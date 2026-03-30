import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ExchangeWebsitesList from "@/components/ExchangeWebsitesList";
import { ArrowLeftRight, X, Zap } from "lucide-react";

export default function ExchangeAllWebsites() {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("welcome") === "1") {
      setShowWelcome(true);
    }
  }, [location.search]);

  return (
    <AppLayout title="Make Requests" icon={<ArrowLeftRight className="h-5 w-5" />}>
      {showWelcome && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
          <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Your site is verified — you're ready to exchange!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You have credits to send requests. Filter by niche, language, or DR and click <strong>Request</strong> on any site you want a backlink from.
            </p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <ExchangeWebsitesList actionLabel="Request" actionVariant="request" />
    </AppLayout>
  );
}
