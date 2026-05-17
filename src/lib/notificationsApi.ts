const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "seller_token";
const READ_KEY = "notifications-read:seller";

function authHeaders(): Record<string, string> {
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}`, Accept: "application/json" } : { Accept: "application/json" };
}

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  time: string;
  type?: string;
};

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${BASE}/api/seller/notifications?limit=50`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  const readIds = getReadIds();
  return (json.data?.items ?? []).map((n: NotificationItem) => ({
    ...n,
    read: readIds.has(n.id) || n.read,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
}

export async function markAllNotificationsRead(): Promise<void> {
  const items = await fetchNotifications();
  saveReadIds(new Set(items.map((n) => n.id)));
}

export function getUnreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}
