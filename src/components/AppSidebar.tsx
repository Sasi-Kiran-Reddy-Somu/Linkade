import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  LayoutDashboard,
  ArrowLeftRight,
  HelpCircle,
  Inbox,
  Send,
  PenLine,
  Lightbulb,
  Settings,
  User,
  Star,
  Zap,
  Bell,
  AlertTriangle,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getAccountCredits } from "@/lib/credits";
import { getAllRequests, isTATExpired, getDelayNotes } from "@/data/requests";

const PLAN = "Starter";

// ── Notification helpers ──────────────────────────────────────────────────────

interface SidebarNotif {
  id: string;
  type: "tat_overdue" | "delay_note";
  title: string;
  body: string;
  requestId: string;
  createdAt: string;
}

function getSidebarNotifications(): SidebarNotif[] {
  try {
    return JSON.parse(localStorage.getItem("sidebar-notifications") ?? "[]");
  } catch { return []; }
}

function dismissSidebarNotification(id: string) {
  const current = getSidebarNotifications().filter((n) => n.id !== id);
  localStorage.setItem("sidebar-notifications", JSON.stringify(current));
}

/** Scans localStorage for overdue requests and delay notes, generates notifications
 *  if not already present. Safe to call on every render — deduplicates by notif id. */
function syncNotifications(): SidebarNotif[] {
  const existing = getSidebarNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const newNotifs: SidebarNotif[] = [];

  // Check all projects' requests for TAT overdue
  try {
    const raw = localStorage.getItem("home-projects");
    const projects: { domain: string }[] = raw ? JSON.parse(raw) : [];
    const domains = projects.map((p) => p.domain);

    const allRequests = getAllRequests("incoming", domains).concat(getAllRequests("outgoing", domains));
    for (const req of allRequests) {
      const status = localStorage.getItem(`req-status-${req.id}`) ?? "Pending";
      if (status !== "Accepted") continue;
      if (!isTATExpired(req.id, req.createdAt)) continue;

      const notifId = `tat-overdue-${req.id}`;
      if (existingIds.has(notifId)) continue;

      const isIncoming = req.type === "incoming";
      newNotifs.push({
        id: notifId,
        type: "tat_overdue",
        title: "TAT deadline passed",
        body: isIncoming
          ? `The link for ${req.externalDomain}'s request is overdue. Consider sending a delay note.`
          : `${req.externalDomain} hasn't published the link yet — TAT has passed.`,
        requestId: req.id,
        createdAt: new Date().toISOString(),
      });
    }

    // Check for unread delay notes sent TO us (fromSide !== our side)
    for (const req of allRequests) {
      const notes = getDelayNotes(req.id);
      const mySide = req.type === "incoming" ? "publisher" : "requester";
      const incomingNotes = notes.filter((n) => n.fromSide !== mySide);
      for (const note of incomingNotes) {
        const notifId = `delay-note-${note.id}`;
        if (existingIds.has(notifId)) continue;
        newNotifs.push({
          id: notifId,
          type: "delay_note",
          title: "Delay note received",
          body: `${req.externalDomain}: "${note.note.slice(0, 80)}${note.note.length > 80 ? "…" : ""}"`,
          requestId: req.id,
          createdAt: note.sentAt,
        });
      }
    }
  } catch { /* ignore */ }

  if (newNotifs.length > 0) {
    const updated = [...existing, ...newNotifs];
    localStorage.setItem("sidebar-notifications", JSON.stringify(updated));
    return updated;
  }
  return existing;
}

// ── SidebarItem ───────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  badge?: string;
}

function SidebarItem({ icon, label, to, badge }: SidebarItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none tracking-wide">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Sidebar notifications panel ───────────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<SidebarNotif[]>(() => syncNotifications());

  function dismiss(id: string) {
    dismissSidebarNotification(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function dismissAll() {
    localStorage.setItem("sidebar-notifications", "[]");
    setNotifs([]);
  }

  return (
    <div className="absolute left-[220px] bottom-0 w-80 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        <div className="flex items-center gap-2">
          {notifs.length > 0 && (
            <button onClick={dismissAll} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          notifs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
              <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${n.type === "tat_overdue" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                {n.type === "tat_overdue"
                  ? <AlertTriangle className="h-3 w-3" />
                  : <MessageSquare className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(() => getAccountCredits());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(() => syncNotifications().length);

  useEffect(() => {
    const sync = () => setCredits(getAccountCredits());
    window.addEventListener("creditsChanged", sync);
    return () => window.removeEventListener("creditsChanged", sync);
  }, []);

  // Re-sync notification count periodically
  useEffect(() => {
    const refresh = () => setNotifCount(syncNotifications().length);
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar relative">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">Linkade</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <SidebarItem icon={<Briefcase className="h-4 w-4" />} label="My Projects" to="/app" />

        <div className="my-3" />

        <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" to="/dashboard" />
        <SidebarItem icon={<ArrowLeftRight className="h-4 w-4" />} label="Make Requests" to="/exchange/websites" />
        <SidebarItem icon={<Lightbulb className="h-4 w-4" />} label="Suggested Requests" to="/exchange/suggestions" />
        <SidebarItem icon={<Inbox className="h-4 w-4" />} label="All Incoming Requests" to="/exchange/incoming" />
        <SidebarItem icon={<Send className="h-4 w-4" />} label="All Outgoing Requests" to="/exchange/outgoing" />
        <SidebarItem icon={<PenLine className="h-4 w-4" />} label="Writerate" to="/writerate" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              notifOpen
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Notifications</span>
            {notifCount > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none min-w-[16px] text-center">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationsPanel
              onClose={() => {
                setNotifOpen(false);
                setNotifCount(getSidebarNotifications().length);
              }}
            />
          )}
        </div>

        <SidebarItem icon={<HelpCircle className="h-4 w-4" />} label="Help Center" to="/help" />
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-2.5">

        {/* Plan + upgrade card */}
        <div className="rounded-xl bg-gradient-to-b from-primary/8 to-primary/4 border border-primary/15 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">{PLAN} Plan</span>
              <span className="rounded-full bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 leading-none uppercase tracking-wide">
                FREE
              </span>
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>{credits} credits left</span>
            </div>
            <button
              onClick={() => navigate("/credits/add")}
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              + Add
            </button>
          </div>

          <button
            onClick={() => navigate("/upgrade")}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Star className="h-3 w-3" />
            Upgrade Plan
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>Settings</span>
        </button>

        {/* Profile row — clickable */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors text-left"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">John Doe</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">john@example.com</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
