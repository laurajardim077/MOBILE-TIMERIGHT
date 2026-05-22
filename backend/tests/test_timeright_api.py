"""TimeRight backend API tests."""
import pytest
import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001"


# ============== Health ==============
class TestHealth:
    def test_root_health(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ============== Auth ==============
class TestAuth:
    def test_register_success(self, registered_user):
        u = registered_user["user"]
        assert u["loyalty_points"] == 100
        assert u["email"] == registered_user["email"]
        assert registered_user["token"]

    def test_register_duplicate_email(self, api_session, registered_user):
        payload = {
            "name": "Other",
            "email": registered_user["email"],
            "password": "abc12345",
        }
        r = api_session.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r.status_code == 400
        assert "mail" in r.json()["detail"].lower() or "cadastr" in r.json()["detail"].lower()

    def test_register_duplicate_cpf(self, api_session, registered_user):
        payload = {
            "name": "Other CPF",
            "email": f"other_{uuid.uuid4().hex[:8]}@test.com",
            "password": "abc12345",
            "cpf": registered_user["cpf"],
        }
        r = api_session.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r.status_code == 400
        assert "CPF" in r.json()["detail"]

    def test_login_valid(self, api_session, registered_user):
        r = api_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_invalid(self, api_session, registered_user):
        r = api_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user["email"],
            "password": "wrong-password",
        })
        assert r.status_code == 401

    def test_me(self, api_session, auth_headers, registered_user):
        r = api_session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == registered_user["email"]

    def test_update_me(self, api_session, auth_headers):
        r = api_session.put(f"{BASE_URL}/api/auth/me", headers=auth_headers, json={
            "name": "Maria Updated", "phone": "+5511888887777",
        })
        assert r.status_code == 200
        assert r.json()["name"] == "Maria Updated"
        assert r.json()["phone"] == "+5511888887777"

    def test_forgot_password_known(self, api_session, registered_user):
        r = api_session.post(f"{BASE_URL}/api/auth/forgot-password",
                             json={"email": registered_user["email"]})
        assert r.status_code == 200
        assert "message" in r.json()

    def test_forgot_password_unknown(self, api_session):
        r = api_session.post(f"{BASE_URL}/api/auth/forgot-password",
                             json={"email": "nobody-here-xyz@example.com"})
        assert r.status_code == 200
        assert "message" in r.json()


# ============== Services ==============
class TestServices:
    def test_list_services(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/services")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6
        ids = {s["id"] for s in items}
        assert {"svc-1", "svc-2", "svc-3", "svc-4", "svc-5", "svc-6"}.issubset(ids)

    def test_categories(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/services/categories")
        assert r.status_code == 200
        cats = r.json()["categories"]
        assert "Cabelo" in cats

    def test_filter_by_category(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/services", params={"category": "Cabelo"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(s["category"] == "Cabelo" for s in items)

    def test_get_service_by_id(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/services/svc-1")
        assert r.status_code == 200
        assert r.json()["id"] == "svc-1"

    def test_get_service_404(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/services/does-not-exist")
        assert r.status_code == 404


# ============== Professionals ==============
class TestProfessionals:
    def test_list_pros(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/professionals")
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_filter_pros_by_service(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/professionals", params={"service_id": "svc-1"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all("svc-1" in p["service_ids"] for p in items)

    def test_get_pro_by_id(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/professionals/pro-1")
        assert r.status_code == 200
        assert r.json()["id"] == "pro-1"

    def test_favorite_toggle(self, api_session, auth_headers):
        # First toggle -> favorite
        r1 = api_session.post(f"{BASE_URL}/api/professionals/pro-1/favorite", headers=auth_headers)
        assert r1.status_code == 200
        assert r1.json()["is_favorite"] is True
        assert "pro-1" in r1.json()["favorites"]
        # Verify persistence via /me
        me = api_session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
        assert "pro-1" in me["favorites"]
        # Toggle off
        r2 = api_session.post(f"{BASE_URL}/api/professionals/pro-1/favorite", headers=auth_headers)
        assert r2.json()["is_favorite"] is False
        assert "pro-1" not in r2.json()["favorites"]


# ============== Availability ==============
class TestAvailability:
    def test_slots_available_future(self, api_session, future_date):
        r = api_session.get(f"{BASE_URL}/api/availability", params={
            "professional_id": "pro-1",
            "service_id": "svc-1",
            "date": future_date["date"],
        })
        assert r.status_code == 200
        data = r.json()
        assert "slots" in data
        assert len(data["slots"]) > 0
        assert future_date["time"] in data["slots"]

    def test_slots_today_within_12h_filtered(self, api_session):
        today = datetime.now().date().isoformat()
        r = api_session.get(f"{BASE_URL}/api/availability", params={
            "professional_id": "pro-1",
            "service_id": "svc-1",
            "date": today,
        })
        assert r.status_code == 200
        # Today is likely all within 12h => either empty or only late hours
        slots = r.json()["slots"]
        cutoff = datetime.now() + timedelta(hours=12)
        for s in slots:
            slot_dt = datetime.strptime(f"{today} {s}", "%Y-%m-%d %H:%M")
            assert slot_dt >= cutoff


# ============== Bookings ==============
class TestBookings:
    def test_create_booking_too_soon(self, api_session, auth_headers):
        today = datetime.now().date().isoformat()
        r = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-1",
            "professional_id": "pro-1",
            "date": today,
            "time": "09:00",
        })
        assert r.status_code == 400

    def test_create_booking_invalid_coupon(self, api_session, auth_headers, future_date):
        r = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-1",
            "professional_id": "pro-1",
            "date": future_date["date"],
            "time": "10:00",
            "coupon_code": "NOPE-INVALID",
        })
        assert r.status_code == 400

    def test_create_booking_with_coupon(self, api_session, auth_headers, future_date):
        # Use 11:00 to avoid clash with future_date["time"]=15:00
        r = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-1",
            "professional_id": "pro-1",
            "date": future_date["date"],
            "time": "11:00",
            "coupon_code": "BEMVINDA10",
        })
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "confirmed"
        assert b["coupon_code"] == "BEMVINDA10"
        # svc-1 = 150 -> 10% => 135
        assert abs(b["final_price"] - 135.0) < 0.01
        assert abs(b["discount"] - 15.0) < 0.01
        # Loyalty points should now be 110 (100 welcome + 10 booking)
        me = api_session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
        assert me["loyalty_points"] >= 110
        pytest.booking_with_coupon_id = b["id"]

    def test_create_booking_slot_conflict(self, api_session, auth_headers, future_date):
        # Create first booking at 12:00
        r1 = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-1",
            "professional_id": "pro-2",  # use svc-1 pro? pro-2 doesn't have svc-1, but server doesn't validate
            "date": future_date["date"],
            "time": "12:00",
        })
        # pro-2 doesn't have svc-1 in service_ids but server doesn't enforce that. OK.
        assert r1.status_code == 200, r1.text
        # Second booking on same slot
        r2 = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-1",
            "professional_id": "pro-2",
            "date": future_date["date"],
            "time": "12:00",
        })
        assert r2.status_code == 409

    def test_create_booking_basic_for_review(self, api_session, auth_headers, future_date):
        r = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-6",
            "professional_id": "pro-2",
            "date": future_date["date"],
            "time": "13:00",
        })
        assert r.status_code == 200, r.text
        pytest.booking_for_review_id = r.json()["id"]

    def test_list_upcoming(self, api_session, auth_headers):
        r = api_session.get(f"{BASE_URL}/api/bookings", headers=auth_headers,
                            params={"scope": "upcoming"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(b["status"] == "confirmed" for b in items)

    def test_list_past(self, api_session, auth_headers):
        r = api_session.get(f"{BASE_URL}/api/bookings", headers=auth_headers,
                            params={"scope": "past"})
        assert r.status_code == 200

    def test_cancel_booking(self, api_session, auth_headers, future_date):
        # Create a fresh booking to cancel
        r = api_session.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "service_id": "svc-3",
            "professional_id": "pro-3",
            "date": future_date["date"],
            "time": "14:00",
        })
        assert r.status_code == 200, r.text
        bid = r.json()["id"]
        c = api_session.post(f"{BASE_URL}/api/bookings/{bid}/cancel", headers=auth_headers)
        assert c.status_code == 200
        assert c.json()["status"] == "cancelled"
        # Verify
        g = api_session.get(f"{BASE_URL}/api/bookings/{bid}", headers=auth_headers)
        assert g.json()["status"] == "cancelled"

    def test_complete_booking(self, api_session, auth_headers):
        bid = getattr(pytest, "booking_for_review_id", None)
        assert bid, "Need booking from earlier test"
        r = api_session.post(f"{BASE_URL}/api/bookings/{bid}/complete", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"
        g = api_session.get(f"{BASE_URL}/api/bookings/{bid}", headers=auth_headers)
        assert g.json()["status"] == "completed"


# ============== Reviews ==============
class TestReviews:
    def test_review_rating_out_of_range(self, api_session, auth_headers):
        bid = getattr(pytest, "booking_for_review_id", None)
        assert bid
        r = api_session.post(f"{BASE_URL}/api/reviews", headers=auth_headers, json={
            "booking_id": bid, "rating": 10, "comment": "bad rating",
        })
        # Pydantic accepts int but server logic blocks >5 with 400
        assert r.status_code == 400

    def test_create_review_success(self, api_session, auth_headers):
        bid = getattr(pytest, "booking_for_review_id", None)
        assert bid
        # Get user's loyalty points before
        me_before = api_session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
        pts_before = me_before["loyalty_points"]
        r = api_session.post(f"{BASE_URL}/api/reviews", headers=auth_headers, json={
            "booking_id": bid, "rating": 5, "comment": "Excelente!",
        })
        assert r.status_code == 200, r.text
        rv = r.json()
        assert rv["rating"] == 5
        # Verify booking rated=true
        g = api_session.get(f"{BASE_URL}/api/bookings/{bid}", headers=auth_headers).json()
        assert g["rated"] is True
        # Loyalty +5
        me_after = api_session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers).json()
        assert me_after["loyalty_points"] == pts_before + 5

    def test_review_twice_same_booking(self, api_session, auth_headers):
        bid = getattr(pytest, "booking_for_review_id", None)
        r = api_session.post(f"{BASE_URL}/api/reviews", headers=auth_headers, json={
            "booking_id": bid, "rating": 4, "comment": "again",
        })
        assert r.status_code == 400


# ============== Coupons / Notifications / Salon ==============
class TestMisc:
    def test_coupons(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/coupons")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 3
        codes = {c["code"] for c in items}
        assert {"BEMVINDA10", "BELEZA20", "FIDELIDADE15"}.issubset(codes)

    def test_notifications_has_welcome(self, api_session, auth_headers):
        r = api_session.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        types = {n["type"] for n in items}
        assert "promo" in types  # welcome notification

    def test_notifications_read_all(self, api_session, auth_headers):
        r = api_session.post(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # Verify all marked read
        items = api_session.get(f"{BASE_URL}/api/notifications", headers=auth_headers).json()
        assert all(n["read"] for n in items)

    def test_salon(self, api_session):
        r = api_session.get(f"{BASE_URL}/api/salon")
        assert r.status_code == 200
        d = r.json()
        assert "lat" in d and "lng" in d and "address" in d
