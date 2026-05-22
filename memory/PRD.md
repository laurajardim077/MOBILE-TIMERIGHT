# TimeRight — PRD

## Vision
Premium mobile app for booking beauty salon services with confirmed slots, loyalty rewards, and a polished black/gold experience.

## Tech Stack
- Frontend: Expo Router (React Native, SDK 54), TypeScript, Reanimated, react-native-calendars, Axios
- Backend: FastAPI + MongoDB (motor)
- Auth: JWT (bcrypt password hashing). Forgot-password flow logs reset token to console (MOCKED email).

## Core Features (MVP — implemented)
- **Auth**: register, login, forgot-password (mocked email), JWT session persisted in AsyncStorage.
- **Splash → Onboarding (3 slides) → Auth → Tabs**.
- **Bottom tabs**: Home, Services, Bookings, Profile.
- **Services**: list with categories filter & search, detail page with description & duration & price, list of professionals offering it.
- **Professionals**: list, detail with bio/specialties/rating/reviews, favorite toggle.
- **Booking flow (4 steps)**: service → professional → date+time (calendar + slots, 12h advance rule) → coupon+notes → confirm.
- **Confirmation screen** with animated checkmark + booking summary.
- **Bookings tab**: upcoming/past tabs, cancel (≥12h), rate completed bookings.
- **Reviews**: 1-5 stars + comment; updates pro rating; awards +5 loyalty points.
- **Profile**: avatar (base64 photo upload via expo-image-picker on native), stats, menu.
- **Edit profile**, **Favorites list**, **Coupons (copy)**, **Loyalty (Bronze/Prata/Ouro/Diamante)**, **Salon location (with OpenStreetMap static + open maps + call)**, **Notifications (in-app)**, **Settings**.
- **Business rules**: CPF/email duplicates blocked, 12h cancel/booking rule, 5-cancel block, slot conflict 409.

## Deferred / Future
- FCM push notifications (only in-app today)
- Chat cliente-salão
- Admin panel
- Google login

## Seed Data
6 services, 4 professionals, 3 coupons created on backend startup.
