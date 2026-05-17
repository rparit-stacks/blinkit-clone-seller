const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ─── Token storage ────────────────────────────────────────────────────────────
const TOKEN_KEY = "seller_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init.headers ?? {}) },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SellerAuthResponse {
  token: string;
  sellerId: string;
  email: string;
  fullName: string;
  storeName: string;
  storeCategory: string;
  status: string;
  storeId: string | null;
}

export interface SellerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  storeName: string;
  storeCategory: string;
  description: string;
  gstNumber: string;
  panNumber: string;
  businessRegNumber: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountHolderName: string;
  bankName: string;
  gstCertificateUrl?: string;
  panCardUrl?: string;
  licenseUrl?: string;
  businessProofUrl?: string;
  idProofUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  storeImages?: string[];
  storeId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  storeOpen: boolean;
  openTime?: string;
  closeTime?: string;
  createdAt: string;
}

export interface SellerDashboard {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  totalProducts: number;
  activeProducts: number;
}

export interface SellerProduct {
  id: string;
  sellerId: string;
  productId?: string;
  storeId?: string;
  name: string;
  description: string;
  categorySlug: string;
  storeCategory: string;
  price: number;
  originalPrice: number;
  unit: string;
  badge?: string;
  sku?: string;
  stockQuantity: number;
  gstPercent: number;
  image?: string;
  images?: string[];
  tags?: string[];
  available: boolean;
  createdAt: string;
}

export interface SellerProductRequest {
  name: string;
  description: string;
  categorySlug: string;
  price: number;
  originalPrice: number;
  unit: string;
  badge?: string;
  sku?: string;
  stockQuantity: number;
  gstPercent: number;
  image?: string;
  images?: string[];
  tags?: string[];
  available: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  storeCategory: string;
  storeId?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  unit?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  total: number;
  addressSnapshot: string;
  paymentMode: string;
  status: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubOrder {
  id: string;
  displayId: string;
  masterOrderId: string;
  sellerId: string;
  storeId: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  total: number;
  addressSnapshot: string;
  paymentMode: string;
  paid: boolean;
  status: string;
  commissionRate: number;
  commissionAmount: number;
  sellerEarning: number;
  earningCredited: boolean;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface WalletInfo {
  id: string;
  ownerId: string;
  ownerType: string;
  balanceRupees: number;
  pendingBalanceRupees: number;
  lifetimeEarnedRupees: number;
  lifetimeWithdrawnRupees: number;
  active: boolean;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amountRupees: number;
  balanceAfterRupees: number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  ownerId: string;
  ownerType: string;
  amountRupees: number;
  status: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  upiId?: string;
  adminNote?: string;
  utrReference?: string;
  createdAt: string;
  processedAt?: string;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────
export const sellerSendOtp = (email: string) =>
  post<{ otp?: string }>("/api/seller/auth/send-otp", { email });
export const sellerVerifyOtp = (email: string, otp: string) =>
  post<{ verified: string }>("/api/seller/auth/verify-otp", { email, otp });

// ─── File upload ─────────────────────────────────────────────────────────────
export async function uploadFile(file: File, folder = "seller-docs"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Upload failed");
  return json.data.url as string;
}

// Update a single document field by URL
export const uploadDocument = (field: string, url: string) =>
  request<string>(`/api/seller/profile/documents?field=${encodeURIComponent(field)}&url=${encodeURIComponent(url)}`, { method: "POST" });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const sellerRegister = (data: {
  fullName: string; email: string; phone: string; password: string;
  storeName: string; storeCategory: string; description?: string;
  gstNumber?: string; panNumber?: string; businessRegNumber?: string;
  addressLine?: string; city?: string; state?: string; pincode?: string;
  latitude?: number; longitude?: number;
  bankAccountNumber?: string; bankIfsc?: string; bankAccountHolderName?: string; bankName?: string;
}) => post<SellerAuthResponse>("/api/seller/auth/register", data);

export const sellerLogin = (email: string, password: string) =>
  post<SellerAuthResponse>("/api/seller/auth/login", { email, password });

// ─── Profile ─────────────────────────────────────────────────────────────────
export const fetchProfile = () => get<SellerProfile>("/api/seller/profile");
export const updateProfile = (data: Partial<SellerProfile>) =>
  put<SellerProfile>("/api/seller/profile", data);
export const toggleStore = () =>
  post<SellerProfile>("/api/seller/store/toggle", {});

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const fetchDashboard = () => get<SellerDashboard>("/api/seller/dashboard");

// ─── Products ────────────────────────────────────────────────────────────────
export const fetchProducts = () => get<SellerProduct[]>("/api/seller/products");
export const createProduct = (data: SellerProductRequest) =>
  post<SellerProduct>("/api/seller/products", data);
export const updateProduct = (id: string, data: SellerProductRequest) =>
  put<SellerProduct>(`/api/seller/products/${id}`, data);
export const deleteProduct = (id: string) =>
  del<string>(`/api/seller/products/${id}`);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const fetchOrders = () => get<SubOrder[]>("/api/seller/orders");
export const updateOrderStatus = (id: string, status: string) =>
  patch<SubOrder>(`/api/seller/orders/${id}/status`, { status });

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const fetchWallet = () => get<WalletInfo>("/api/seller/wallet");
export const fetchWalletTransactions = (page = 0, size = 20) =>
  get<WalletTransaction[]>(`/api/seller/wallet/transactions?page=${page}&size=${size}`);
export const fetchWithdrawals = () => get<WithdrawalRequest[]>("/api/seller/wallet/withdrawals");
export const requestWithdrawal = (data: {
  amountRupees: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  upiId?: string;
}) => post<WithdrawalRequest>("/api/seller/wallet/withdraw", data);
