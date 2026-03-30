import { ReactNode, useState, useRef, useEffect } from "react";
import { Star, Zap, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAccountCredits } from "@/lib/credits";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
}

const RESPONSIVENESS_SCORE = 87;

export default function AppLayout({ children, title, icon }: AppLayoutProps) {
  const [credits, setCredits] = useState(() => getAccountCredits());
  const [creditsOpen, setCreditsOpen] = useState(false);
  const creditsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setCredits(getAccountCredits());
    window.addEventListener("creditsChanged", sync);
    return () => window.removeEventListener("creditsChanged", sync);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (creditsRef.current && !creditsRef.current.contains(e.target as Node)) {
        setCreditsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-primary">{icon}</span>}
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Responsiveness Score */}
            <div className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground">Responsiveness</span>
              <span className={`text-base font-bold ${RESPONSIVENESS_SCORE >= 75 ? "text-green-600" : RESPONSIVENESS_SCORE >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {RESPONSIVENESS_SCORE}%
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-default" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  <p className="font-semibold mb-1">Account Responsiveness Score</p>
                  <p>
                    This score reflects how consistently you handle incoming backlink requests: whether you accept, decline, or let them expire without responding. A higher score builds trust and makes your profile more attractive to potential exchange partners.
                  </p>
                  <p className="mt-1.5">
                    When another user finds your domain in the Exchange tab, they can see both your <span className="font-medium">overall account score</span> and a <span className="font-medium">per-website score</span> showing how responsive you are to requests for that specific site.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Credits button + dropdown */}
            <div className="relative" ref={creditsRef}>
              <button
                onClick={() => setCreditsOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-700 to-black px-5 py-2 text-sm font-bold text-white shadow-sm hover:from-gray-800 hover:to-black transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                {credits} <span className="opacity-80 font-medium">Credits</span>
              </button>

              {creditsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    <p className="text-sm font-semibold text-foreground">Available Credits</p>
                    <p className="ml-auto text-sm font-bold text-foreground">{credits}</p>
                  </div>
                  <div className="p-3 flex gap-2">
                    <button
                      onClick={() => { setCreditsOpen(false); navigate("/transactions"); }}
                      className="flex-1 rounded-lg bg-black px-[9px] py-[6px] text-xs font-semibold text-white hover:bg-black/80 transition-colors whitespace-nowrap"
                    >
                      View Transactions
                    </button>
                    <button
                      onClick={() => { setCreditsOpen(false); navigate("/credits/add"); }}
                      className="flex-1 rounded-lg bg-green-700 px-[9px] py-[6px] text-xs font-semibold text-white hover:bg-green-800 transition-colors whitespace-nowrap"
                    >
                      Add Credits
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/upgrade")}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-800 to-black px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all"
            >
              <Star className="h-3.5 w-3.5 fill-white" />
              Upgrade Plan
            </button>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
