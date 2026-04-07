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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getAccountCredits } from "@/lib/credits";
import { getAllRequests, isTATExpired, getDelayNotes } from "@/data/requests";
import { addNotifications, unreadCount, getNotifications, saveNotifications } from "@/lib/notifications";

const PLAN = "Starter";

// ── Sync TAT + delay note notifications into the shared store ─────────────────

function syncRequestNotifications() {
  try {
    const raw = localStorage.getItem("home-projects");
    const projects: { domain: string }[] = raw ? JSON.parse(raw) : [];
    const domains = projects.map((p) => p.domain);
    const allRequests = getAllRequests("incoming", domains).concat(getAllRequests("outgoing", domains));
    const incoming: Parameters<typeof addNotifications>[0] = [];

    for (const req of allRequests) {
      const status = localStorage.getItem(`req-status-${req.id}`) ?? "Pending";
      if (status === "Accepted" && isTATExpired(req.id, req.createdAt)) {
        const notifId = `tat-overdue-${req.id}`;
        const isIncoming = req.type === "incoming";
        incoming.push({
          id: notifId,
          type: "tat_overdue",
          title: "TAT deadline passed",
          body: isIncoming
            ? `The link for ${req.externalDomain}'s request is overdue. Consider sending a delay note.`
            : `${req.externalDomain} has not published the link yet and the TAT has passed.`,
          requestId: req.id,
          createdAt: new Date().toISOString(),
        });
      }

      const notes = getDelayNotes(req.id);
      const mySide = req.type === "incoming" ? "publisher" : "requester";
      for (const note of notes.filter((n) => n.fromSide !== mySide)) {
        incoming.push({
          id: `delay-note-${note.id}`,
          type: "delay_note",
          title: "Delay note received",
          body: `${req.externalDomain}: "${note.note.slice(0, 100)}${note.note.length > 100 ? "..." : ""}"`,
          requestId: req.id,
          createdAt: note.sentAt,
        });
      }
    }
    addNotifications(incoming);
  } catch { /* ignore */ }
}

// ── SidebarItem ───────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  badge?: string | number;
  badgeColor?: "blue" | "red";
}

function SidebarItem({ icon, label, to, badge, badgeColor = "blue" }: SidebarItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");

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
      {badge !== undefined && Number(badge) > 0 && (
        <span className={`rounded-full text-white text-[9px] font-bold px-1.5 py-0.5 leading-none min-w-[16px] text-center ${badgeColor === "red" ? "bg-red-500" : "bg-blue-500"}`}>
          {Number(badge) > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(() => getAccountCredits());
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const sync = () => setCredits(getAccountCredits());
    window.addEventListener("creditsChanged", sync);
    return () => window.removeEventListener("creditsChanged", sync);
  }, []);

  useEffect(() => {
    syncRequestNotifications();
    setNotifCount(unreadCount());
    const id = setInterval(() => {
      syncRequestNotifications();
      setNotifCount(unreadCount());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Update badge count when navigating away from /notifications
  const location = useLocation();
  useEffect(() => {
    setNotifCount(unreadCount());
  }, [location.pathname]);

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
        <SidebarItem
          icon={<Bell className="h-4 w-4" />}
          label="Notifications"
          to="/notifications"
          badge={notifCount}
          badgeColor="red"
        />
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

        {/* Profile row */}
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
