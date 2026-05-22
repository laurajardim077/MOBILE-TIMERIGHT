import axios from "axios";
import { storage } from "@/src/utils/storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem<string>("auth_token", "");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export type UserPublic = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  photo?: string | null;
  loyalty_points: number;
  favorites: string[];
  blocked: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  image: string;
};

export type Professional = {
  id: string;
  name: string;
  photo: string;
  specialties: string[];
  rating: number;
  review_count: number;
  bio: string;
  service_ids: string[];
};

export type Booking = {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  duration_minutes: number;
  professional_id: string;
  professional_name: string;
  professional_photo: string;
  date: string;
  time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  coupon_code?: string | null;
  discount: number;
  final_price: number;
  notes?: string | null;
  rated: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  user_id: string;
  user_name: string;
  user_photo?: string | null;
  professional_id: string;
  service_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_percent: number;
  min_value: number;
  active: boolean;
};

export type Notif = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
};
