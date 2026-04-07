import AppLayout from "@/components/AppLayout";
import {
  Bell, AlertTriangle, MessageSquare, TrendingUp, TrendingDown,
  Activity, X, CheckCheck, Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  SidebarNotif, getNotifications, dismissNotification,
  dismissAll, markAllRead,
} from "@/lib/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Icon + color per type ─────────────────────────────────────────────────────

function NotifIcon({ type }: { type: SidebarNotif["type"] }) {
  const cfg = {
    tat_overdue:    { icon: <AlertTriangle className="h-3.5 w-3.5" />, bg: "bg-amber-100",  text: "text-amber-600"  },
    delay_note:     { icon: <MessageSquare className="h-3.5 w-3.5" />, bg: "bg-blue-100",   text: "text-blue-600"   },
    metric_up:      { icon: <TrendingUp    className="h-3.5 w-3.5" />, bg: "bg-green-100",  text: "text-green-600"  },
    metric_down:    { icon: <TrendingDown  className="h-3.5 w-3.5" />, bg: "bg-red-100",    text: "text-red-600"    },
    traffic_update: { icon: <Activity      className="h-3.5 w-3.5" />, bg: "bg-purple-100", text: "text-purple-600" },
  }[type] ?? { icon: <Bell className="h-3.5 w-3.5" />, bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <div className={`shrink-0 rounded-full p-2 ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type Filter = "all" | "metrics" | "requests";

const METRIC_TYPES: SidebarNotif["type"][] = ["metric_up", "metric_down", "traffic_update"];
const REQUEST_TYPES: SidebarNotif["type"][] = ["tat_overdue", "delay_note"];

function filterNotifs(notifs: SidebarNotif[], f: Filter): SidebarNotif[] {
  if (f === "metrics")  return notifs.filter((n) => METRIC_TYPES.includes(n.type));
  if (f === "requests") return notifs.filter((n) => REQUEST_TYPES.includes(n.type));
  return notifs;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<SidebarNotif[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setNotifs(getNotifications());
    markAllRead();
  }, []);

  function handleDismiss(id: string) {
    dismissNotification(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function handleClearAll() {
    dismissAll();
    setNotifs([]);
  }

  const visible = filterNotifs(notifs, filter);
  const counts: Record<Filter, number> = {
    all:      notifs.length,
    metrics:  notifs.filter((n) => METRIC_TYPES.includes(n.type)).length,
    requests: notifs.filter((n) => REQUEST_TYPES.includes(n.type)).length,
  };

  return (
    <AppLayout title="Notifications" icon={<Bell className="h-5 w-5" />}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {notifs.length === 0 ? "All caught up." : `${notifs.length} notification${notifs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {notifs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-5">
          {(["all", "metrics", "requests"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
                filter === f
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 leading-none ${
                  filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Bell className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No notifications here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDismiss(n.id)}
                  className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors mt-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
