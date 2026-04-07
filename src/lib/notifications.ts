// Shared notification store used by sidebar badge and Notifications page.

export type NotifType =
  | "tat_overdue"
  | "delay_note"
  | "metric_up"
  | "metric_down"
  | "traffic_update";

export interface SidebarNotif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  domain?: string;
  requestId?: string;
  createdAt: string;
  read: boolean;
}

const KEY = "sidebar-notifications";

export function getNotifications(): SidebarNotif[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function saveNotifications(notifs: SidebarNotif[]) {
  localStorage.setItem(KEY, JSON.stringify(notifs));
}

export function addNotifications(incoming: Omit<SidebarNotif, "read">[]) {
  if (incoming.length === 0) return;
  const existing = getNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const fresh = incoming
    .filter((n) => !existingIds.has(n.id))
    .map((n) => ({ ...n, read: false }));
  if (fresh.length > 0) saveNotifications([...fresh, ...existing]);
}

export function dismissNotification(id: string) {
  saveNotifications(getNotifications().filter((n) => n.id !== id));
}

export function dismissAll() {
  saveNotifications([]);
}

export function markAllRead() {
  saveNotifications(getNotifications().map((n) => ({ ...n, read: true })));
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}
