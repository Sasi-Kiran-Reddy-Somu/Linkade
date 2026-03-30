import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ArrowRight, X, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "onboarding-complete";

const STEPS = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Welcome to Linkade",
    description: "Trade backlinks with verified site owners. You link to them, they link to you — no money, just mutual authority growth.",
    cta: "Let's go",
    skipLabel: "Skip intro",
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Add your site first",
    description: "Verify ownership in 60 seconds with a meta tag or DNS record. Verified sites get 2× more exchange requests.",
    cta: "Add my site →",
    skipLabel: "I'll do this later",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Then browse the exchange",
    description: "Filter by niche, language, DR, DA, and traffic. Send a request — if accepted, both sites gain a backlink.",
    cta: "Browse exchange",
    skipLabel: null,
  },
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }

  function handleCta() {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      // Send to add-project — the main action we want
      dismiss();
      navigate("/add-project");
    } else {
      dismiss();
      navigate("/exchange/websites");
    }
  }

  function handleSkip() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {current.icon}
            </div>
          </div>

          {/* Copy */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCta}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {current.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            {current.skipLabel && (
              <button
                onClick={handleSkip}
                className="w-full rounded-xl px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {current.skipLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
