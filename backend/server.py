"""
TimeRight - Beauty Salon Booking API
FastAPI + MongoDB backend
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date as date_cls
from pathlib import Path
import os
import uuid
import logging
import bcrypt
import jwt as pyjwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'timeright-dev-secret-change-me')
JWT_ALG = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 days

app = FastAPI(title="TimeRight API")
api = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("timeright")


# ============ Models ============
class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    cpf: Optional[str] = None
    photo: Optional[str] = None
    loyalty_points: int = 0
    favorites: List[str] = []
    blocked: bool = False
    created_at: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    cpf: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class Service(BaseModel):
    id: str
    name: str
    description: str
    price: float
    duration_minutes: int
    category: str
    image: str


class Professional(BaseModel):
    id: str
    name: str
    photo: str
    specialties: List[str]
    rating: float = 0
    review_count: int = 0
    bio: str = ""
    work_hours: dict = {}  # {"mon": [["09:00","18:00"]], ...}
    service_ids: List[str] = []


class CreateBookingRequest(BaseModel):
    service_id: str
    professional_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


class Booking(BaseModel):
    id: str
    user_id: str
    service_id: str
    service_name: str
    service_price: float
    duration_minutes: int
    professional_id: str
    professional_name: str
    professional_photo: str
    date: str
    time: str
    status: str  # confirmed, cancelled, completed, no_show
    coupon_code: Optional[str] = None
    discount: float = 0
    final_price: float
    notes: Optional[str] = None
    rated: bool = False
    created_at: str


class CreateReviewRequest(BaseModel):
    booking_id: str
    rating: int  # 1-5
    comment: Optional[str] = ""


class Review(BaseModel):
    id: str
    booking_id: str
    user_id: str
    user_name: str
    user_photo: Optional[str] = None
    professional_id: str
    service_id: str
    rating: int
    comment: str
    created_at: str


class Coupon(BaseModel):
    id: str
    code: str
    description: str
    discount_percent: int
    min_value: float = 0
    active: bool = True


class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    type: str  # booking_confirmed, reminder, cancellation, promo
    read: bool = False
    created_at: str


# ============ Helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> str:
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload["sub"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user_id = decode_token(creds.credentials)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="User is blocked")
    return user


def user_to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        phone=u.get("phone"),
        cpf=u.get("cpf"),
        photo=u.get("photo"),
        loyalty_points=u.get("loyalty_points", 0),
        favorites=u.get("favorites", []),
        blocked=u.get("blocked", False),
        created_at=u.get("created_at", ""),
    )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def push_notification(user_id: str, title: str, body: str, ntype: str):
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "body": body,
        "type": ntype,
        "read": False,
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(notif.copy())


# ============ Auth ============
@api.post("/auth/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    email = req.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    if req.cpf:
        cpf_clean = "".join(filter(str.isdigit, req.cpf))
        if cpf_clean:
            dup = await db.users.find_one({"cpf": cpf_clean})
            if dup:
                raise HTTPException(status_code=400, detail="CPF já cadastrado")
            req.cpf = cpf_clean
    user = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "email": email,
        "phone": req.phone,
        "cpf": req.cpf,
        "password_hash": hash_password(req.password),
        "photo": None,
        "loyalty_points": 100,  # welcome bonus
        "favorites": [],
        "blocked": False,
        "cancellation_count": 0,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user.copy())
    await push_notification(user["id"], "Bem-vindo(a) ao TimeRight! ✨",
                            "Você ganhou 100 pontos de fidelidade de boas-vindas.", "promo")
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=user_to_public(user))


@api.post("/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="Conta bloqueada. Entre em contato com o salão.")
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=user_to_public(user))


@api.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if user:
        # MOCKED email: log to console.
        reset_token = str(uuid.uuid4())
        logger.info(f"[PASSWORD RESET - MOCKED] Email: {req.email}  Token: {reset_token}")
    return {"message": "Se este e-mail existir, enviamos instruções de recuperação."}


@api.get("/auth/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return user_to_public(user)


@api.put("/auth/me", response_model=UserPublic)
async def update_me(req: UpdateProfileRequest, user=Depends(get_current_user)):
    update = {k: v for k, v in req.dict().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return user_to_public(fresh)


# ============ Services ============
@api.get("/services", response_model=List[Service])
async def list_services(category: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    items = await db.services.find(q, {"_id": 0}).to_list(500)
    return items


@api.get("/services/categories")
async def list_categories():
    cats = await db.services.distinct("category")
    return {"categories": cats}


@api.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    item = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Serviço não encontrado")
    return item


# ============ Professionals ============
@api.get("/professionals", response_model=List[Professional])
async def list_professionals(service_id: Optional[str] = None):
    q = {}
    if service_id:
        q["service_ids"] = service_id
    items = await db.professionals.find(q, {"_id": 0}).to_list(500)
    return items


@api.get("/professionals/{pro_id}", response_model=Professional)
async def get_professional(pro_id: str):
    item = await db.professionals.find_one({"id": pro_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Profissional não encontrado")
    return item


@api.get("/professionals/{pro_id}/reviews", response_model=List[Review])
async def list_pro_reviews(pro_id: str):
    items = await db.reviews.find({"professional_id": pro_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.post("/professionals/{pro_id}/favorite")
async def toggle_favorite(pro_id: str, user=Depends(get_current_user)):
    favs = set(user.get("favorites", []))
    if pro_id in favs:
        favs.remove(pro_id)
        is_fav = False
    else:
        favs.add(pro_id)
        is_fav = True
    await db.users.update_one({"id": user["id"]}, {"$set": {"favorites": list(favs)}})
    return {"is_favorite": is_fav, "favorites": list(favs)}


# ============ Available slots ============
def generate_default_slots() -> List[str]:
    """09:00 - 19:00 in 30min increments."""
    slots = []
    for h in range(9, 19):
        slots.append(f"{h:02d}:00")
        slots.append(f"{h:02d}:30")
    return slots


@api.get("/availability")
async def availability(professional_id: str, service_id: str, date: str):
    """Return list of slot times available on given date for a professional and service."""
    pro = await db.professionals.find_one({"id": professional_id}, {"_id": 0})
    svc = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not pro or not svc:
        raise HTTPException(404, "Profissional ou serviço não encontrado")
    try:
        target = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Data inválida (use YYYY-MM-DD)")

    # blocked dates
    blocked = await db.blocked_dates.find_one({"date": date})
    if blocked:
        return {"date": date, "slots": []}

    all_slots = generate_default_slots()
    # remove past slots if today
    now = datetime.now()
    cutoff = now + timedelta(hours=12)
    available = []
    # existing confirmed bookings for that pro on that date
    bookings = await db.bookings.find({
        "professional_id": professional_id,
        "date": date,
        "status": {"$in": ["confirmed", "completed"]}
    }, {"_id": 0}).to_list(200)
    taken_starts = {b["time"] for b in bookings}

    for slot in all_slots:
        slot_dt = datetime.strptime(f"{date} {slot}", "%Y-%m-%d %H:%M")
        if slot_dt < cutoff:
            continue
        if slot in taken_starts:
            continue
        available.append(slot)
    return {"date": date, "slots": available}


# ============ Bookings ============
@api.post("/bookings", response_model=Booking)
async def create_booking(req: CreateBookingRequest, user=Depends(get_current_user)):
    svc = await db.services.find_one({"id": req.service_id}, {"_id": 0})
    pro = await db.professionals.find_one({"id": req.professional_id}, {"_id": 0})
    if not svc or not pro:
        raise HTTPException(404, "Serviço ou profissional não encontrado")

    # validate 12h advance
    try:
        slot_dt = datetime.strptime(f"{req.date} {req.time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(400, "Data/hora inválida")
    if slot_dt < datetime.now() + timedelta(hours=12):
        raise HTTPException(400, "Agendamentos exigem ao menos 12h de antecedência")

    # ensure slot not taken
    clash = await db.bookings.find_one({
        "professional_id": req.professional_id,
        "date": req.date,
        "time": req.time,
        "status": {"$in": ["confirmed", "completed"]},
    })
    if clash:
        raise HTTPException(409, "Esse horário acabou de ser reservado. Escolha outro.")

    # blocked
    blocked = await db.blocked_dates.find_one({"date": req.date})
    if blocked:
        raise HTTPException(400, "Esta data está bloqueada pelo salão")

    # coupon
    discount = 0.0
    coupon_code = None
    final_price = svc["price"]
    if req.coupon_code:
        coupon = await db.coupons.find_one({"code": req.coupon_code.upper(), "active": True}, {"_id": 0})
        if not coupon:
            raise HTTPException(400, "Cupom inválido")
        if svc["price"] < coupon.get("min_value", 0):
            raise HTTPException(400, f"Valor mínimo para o cupom é R$ {coupon['min_value']:.2f}")
        discount = svc["price"] * (coupon["discount_percent"] / 100.0)
        final_price = svc["price"] - discount
        coupon_code = coupon["code"]

    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "service_id": svc["id"],
        "service_name": svc["name"],
        "service_price": svc["price"],
        "duration_minutes": svc["duration_minutes"],
        "professional_id": pro["id"],
        "professional_name": pro["name"],
        "professional_photo": pro["photo"],
        "date": req.date,
        "time": req.time,
        "status": "confirmed",
        "coupon_code": coupon_code,
        "discount": discount,
        "final_price": final_price,
        "notes": req.notes,
        "rated": False,
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(booking.copy())
    await push_notification(
        user["id"],
        "Agendamento confirmado ✓",
        f"{svc['name']} com {pro['name']} em {req.date} às {req.time}.",
        "booking_confirmed",
    )
    # add loyalty points (10 per booking)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"loyalty_points": 10}})
    return booking


@api.get("/bookings", response_model=List[Booking])
async def list_bookings(scope: str = Query("all", regex="^(all|upcoming|past)$"),
                        user=Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(500)
    if scope == "all":
        return bookings
    now = datetime.now()
    out = []
    for b in bookings:
        try:
            dt = datetime.strptime(f"{b['date']} {b['time']}", "%Y-%m-%d %H:%M")
        except Exception:
            continue
        is_upcoming = dt >= now and b["status"] == "confirmed"
        if scope == "upcoming" and is_upcoming:
            out.append(b)
        if scope == "past" and not is_upcoming:
            out.append(b)
    return out


@api.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, user=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Agendamento não encontrado")
    return b


@api.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]})
    if not b:
        raise HTTPException(404, "Agendamento não encontrado")
    if b["status"] != "confirmed":
        raise HTTPException(400, "Apenas agendamentos confirmados podem ser cancelados")
    try:
        dt = datetime.strptime(f"{b['date']} {b['time']}", "%Y-%m-%d %H:%M")
    except Exception:
        raise HTTPException(400, "Data inválida")
    if dt < datetime.now() + timedelta(hours=12):
        raise HTTPException(400, "Cancelamentos exigem 12h de antecedência")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"cancellation_count": 1}})
    fresh = await db.users.find_one({"id": user["id"]})
    if fresh and fresh.get("cancellation_count", 0) >= 5:
        await db.users.update_one({"id": user["id"]}, {"$set": {"blocked": True}})
    await push_notification(user["id"], "Agendamento cancelado",
                            f"{b['service_name']} em {b['date']} às {b['time']} foi cancelado.",
                            "cancellation")
    return {"status": "cancelled"}


@api.post("/bookings/{booking_id}/confirm-presence")
async def confirm_presence(booking_id: str, user=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]})
    if not b:
        raise HTTPException(404, "Agendamento não encontrado")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"presence_confirmed": True}})
    return {"presence_confirmed": True}


@api.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, user=Depends(get_current_user)):
    """Mark a booking as completed (auto-call when user opens to rate)."""
    b = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]})
    if not b:
        raise HTTPException(404, "Agendamento não encontrado")
    if b["status"] == "confirmed":
        await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "completed"}})
    return {"status": "completed"}


# ============ Reviews ============
@api.post("/reviews", response_model=Review)
async def create_review(req: CreateReviewRequest, user=Depends(get_current_user)):
    b = await db.bookings.find_one({"id": req.booking_id, "user_id": user["id"]}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Agendamento não encontrado")
    if b.get("rated"):
        raise HTTPException(400, "Esse agendamento já foi avaliado")
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(400, "Nota deve ser entre 1 e 5")
    review = {
        "id": str(uuid.uuid4()),
        "booking_id": req.booking_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_photo": user.get("photo"),
        "professional_id": b["professional_id"],
        "service_id": b["service_id"],
        "rating": req.rating,
        "comment": req.comment or "",
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(review.copy())
    await db.bookings.update_one({"id": req.booking_id}, {"$set": {"rated": True, "status": "completed"}})
    # update professional rating
    all_revs = await db.reviews.find({"professional_id": b["professional_id"]}, {"_id": 0}).to_list(1000)
    avg = sum(r["rating"] for r in all_revs) / max(len(all_revs), 1)
    await db.professionals.update_one(
        {"id": b["professional_id"]},
        {"$set": {"rating": round(avg, 1), "review_count": len(all_revs)}},
    )
    # loyalty bonus
    await db.users.update_one({"id": user["id"]}, {"$inc": {"loyalty_points": 5}})
    return review


# ============ Coupons ============
@api.get("/coupons", response_model=List[Coupon])
async def list_coupons():
    items = await db.coupons.find({"active": True}, {"_id": 0}).to_list(100)
    return items


# ============ Notifications ============
@api.get("/notifications", response_model=List[Notification])
async def list_notifications(user=Depends(get_current_user)):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.post("/notifications/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ============ Salon info ============
@api.get("/salon")
async def salon_info():
    return {
        "name": "TimeRight Salon",
        "address": "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
        "phone": "+55 11 99999-0000",
        "lat": -23.5613,
        "lng": -46.6565,
        "open_hours": "Seg-Sáb: 09:00 - 19:00",
        "instagram": "@timeright",
    }


# ============ Health ============
@api.get("/")
async def health():
    return {"app": "TimeRight", "status": "ok"}


# ============ Seed ============
@app.on_event("startup")
async def startup_seed():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("cpf", sparse=True)
        await db.bookings.create_index([("professional_id", 1), ("date", 1), ("time", 1)])
    except Exception as e:
        logger.warning(f"Index creation skipped: {e}")

    # Seed services
    if await db.services.count_documents({}) == 0:
        services = [
            {
                "id": "svc-1",
                "name": "Corte Feminino Premium",
                "description": "Corte personalizado com finalização. Inclui consulta de estilo e hidratação leve.",
                "price": 150.0,
                "duration_minutes": 60,
                "category": "Cabelo",
                "image": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
            },
            {
                "id": "svc-2",
                "name": "Coloração Completa",
                "description": "Coloração profissional com produtos premium e tratamento de selagem.",
                "price": 280.0,
                "duration_minutes": 120,
                "category": "Cabelo",
                "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
            },
            {
                "id": "svc-3",
                "name": "Manicure & Pedicure",
                "description": "Tratamento completo das unhas das mãos e pés com esmaltação.",
                "price": 90.0,
                "duration_minutes": 75,
                "category": "Unhas",
                "image": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
            },
            {
                "id": "svc-4",
                "name": "Maquiagem para Festa",
                "description": "Make profissional para eventos especiais, com produtos de alta duração.",
                "price": 220.0,
                "duration_minutes": 90,
                "category": "Maquiagem",
                "image": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
            },
            {
                "id": "svc-5",
                "name": "Massagem Relaxante",
                "description": "60 minutos de massagem corporal relaxante com aromaterapia.",
                "price": 180.0,
                "duration_minutes": 60,
                "category": "Spa",
                "image": "https://images.unsplash.com/photo-1639162906614-0603b0ae95fd?auto=format&fit=crop&w=900&q=80",
            },
            {
                "id": "svc-6",
                "name": "Design de Sobrancelhas",
                "description": "Design personalizado com henna ou pinça, conforme formato do rosto.",
                "price": 70.0,
                "duration_minutes": 30,
                "category": "Sobrancelhas",
                "image": "https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=900&q=80",
            },
        ]
        await db.services.insert_many([s.copy() for s in services])
        logger.info(f"Seeded {len(services)} services")

    # Seed professionals
    if await db.professionals.count_documents({}) == 0:
        pros = [
            {
                "id": "pro-1",
                "name": "Camila Rocha",
                "photo": "https://images.pexels.com/photos/8834017/pexels-photo-8834017.jpeg?auto=compress&cs=tinysrgb&w=600",
                "specialties": ["Corte", "Coloração"],
                "rating": 4.9,
                "review_count": 0,
                "bio": "Hairstylist com 10 anos de experiência em cortes femininos e técnicas de coloração.",
                "work_hours": {},
                "service_ids": ["svc-1", "svc-2"],
            },
            {
                "id": "pro-2",
                "name": "Mariana Lopes",
                "photo": "https://images.unsplash.com/photo-1595475716260-0f2c35f5a40f?auto=format&fit=crop&w=600&q=80",
                "specialties": ["Maquiagem", "Sobrancelhas"],
                "rating": 4.8,
                "review_count": 0,
                "bio": "Maquiadora profissional especializada em eventos e produções de luxo.",
                "work_hours": {},
                "service_ids": ["svc-4", "svc-6"],
            },
            {
                "id": "pro-3",
                "name": "Júlia Mendes",
                "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
                "specialties": ["Manicure", "Pedicure"],
                "rating": 4.7,
                "review_count": 0,
                "bio": "Nail artist com técnica em alongamento e nail art autoral.",
                "work_hours": {},
                "service_ids": ["svc-3"],
            },
            {
                "id": "pro-4",
                "name": "Beatriz Souza",
                "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
                "specialties": ["Spa", "Massagem"],
                "rating": 4.9,
                "review_count": 0,
                "bio": "Terapeuta corporal certificada em massagem relaxante e drenagem.",
                "work_hours": {},
                "service_ids": ["svc-5"],
            },
        ]
        await db.professionals.insert_many([p.copy() for p in pros])
        logger.info(f"Seeded {len(pros)} professionals")

    # Seed coupons
    if await db.coupons.count_documents({}) == 0:
        coupons = [
            {"id": str(uuid.uuid4()), "code": "BEMVINDA10", "description": "10% OFF no primeiro agendamento",
             "discount_percent": 10, "min_value": 0, "active": True},
            {"id": str(uuid.uuid4()), "code": "BELEZA20", "description": "20% OFF em serviços acima de R$ 200",
             "discount_percent": 20, "min_value": 200, "active": True},
            {"id": str(uuid.uuid4()), "code": "FIDELIDADE15", "description": "15% OFF para clientes fiéis",
             "discount_percent": 15, "min_value": 100, "active": True},
        ]
        await db.coupons.insert_many([c.copy() for c in coupons])
        logger.info(f"Seeded {len(coupons)} coupons")


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
