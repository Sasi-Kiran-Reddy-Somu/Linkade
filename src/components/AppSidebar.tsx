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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getAccountCredits } from "@/lib/credits";

const PLAN = "Starter";

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

export default function AppSidebar() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(() => getAccountCredits());

  useEffect(() => {
    const sync = () => setCredits(getAccountCredits());
    window.addEventListener("creditsChanged", sync);
    return () => window.removeEventListener("creditsChanged", sync);
  }, []);

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar">
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
        <SidebarItem icon={<PenLine className="h-4 w-4" />} label="Writerate" to="/writerate" badge="NEW" />
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
