import AppLayout from "@/components/AppLayout";
import { Star, Check, Zap, Users, BarChart3, Headphones, Globe, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    tagline: "For individuals just getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "border-border",
    badge: null,
    cta: "Current Plan",
    ctaStyle: "border border-border text-muted-foreground cursor-default",
    isCurrent: true,
    features: [
      { text: "5 exchange requests / month", included: true },
      { text: "1 project", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Community support", included: true },
      { text: "Advanced analytics", included: false },
      { text: "Priority request queue", included: false },
      { text: "Team seats", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For growing websites and blogs",
    monthlyPrice: 29,
    yearlyPrice: 23,
    color: "border-primary",
    badge: null,
    cta: "Start Growth",
    ctaStyle: "bg-primary text-primary-foreground hover:bg-primary/90",
    isCurrent: false,
    features: [
      { text: "50 exchange requests / month", included: true },
      { text: "3 projects", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Priority request queue", included: true },
      { text: "Email support", included: true },
      { text: "Responsiveness score boost", included: true },
      { text: "Team seats", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For power users and SEO agencies",
    monthlyPrice: 79,
    yearlyPrice: 63,
    color: "border-gray-900",
    badge: "Most Popular",
    badgeColor: "bg-black",
    cta: "Start Pro",
    ctaStyle: "bg-black text-white hover:bg-black/80",
    isCurrent: false,
    features: [
      { text: "200 exchange requests / month", included: true },
      { text: "10 projects", included: true },
      { text: "Full analytics + export", included: true },
      { text: "Priority request queue", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "3 team seats", included: true },
      { text: "API access", included: true },
      { text: "White-label reports", included: true },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For agencies managing multiple clients",
    monthlyPrice: 199,
    yearlyPrice: 159,
    color: "border-border",
    badge: null,
    cta: "Contact Sales",
    ctaStyle: "bg-black text-white hover:bg-black/80",
    isCurrent: false,
    features: [
      { text: "Unlimited exchange requests", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full analytics + export", included: true },
      { text: "Highest priority queue", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Unlimited team seats", included: true },
      { text: "Full API access", included: true },
      { text: "White-label platform", included: true },
    ],
  },
];

const FEATURE_HIGHLIGHTS = [
  { icon: <Zap className="h-5 w-5 text-amber-500" />, title: "Exchange Requests", desc: "Send and receive backlink exchange requests with verified publishers across 40+ niches." },
  { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, title: "Advanced Analytics", desc: "Track DR, DA, traffic, spam scores, and responsiveness metrics for every partner site." },
  { icon: <Globe className="h-5 w-5 text-green-500" />, title: "Multi-Project Management", desc: "Manage backlink campaigns across multiple websites from a single dashboard." },
  { icon: <Users className="h-5 w-5 text-gray-700" />, title: "Team Collaboration", desc: "Invite team members to review, approve, and manage requests together." },
  { icon: <Shield className="h-5 w-5 text-gray-700" />, title: "Quality Filtering", desc: "Built-in spam detection and site quality metrics to keep your link profile clean." },
  { icon: <Headphones className="h-5 w-5 text-teal-500" />, title: "Dedicated Support", desc: "Get help from our expert team via email, chat, or a dedicated account manager." },
];

export default function Upgrade() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <AppLayout title="Upgrade Plan" icon={<Star className="h-5 w-5" />}>
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Choose the right plan for you</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Scale your backlink exchange strategy with plans built for every stage — from solo bloggers to full-service SEO agencies.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 mt-2">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${billing === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Yearly
              <span className="rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 leading-none">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-4 gap-5 items-stretch">
          {PLANS.map((plan) => {
            const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 ${plan.color} bg-card p-6 transition-shadow hover:shadow-lg ${plan.id === "pro" ? "shadow-md" : ""}`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-bold text-white whitespace-nowrap ${plan.badgeColor ?? "bg-primary"}`}>
                    {plan.badge}
                  </span>
                )}

                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    {price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${price}</span>
                        <span className="text-sm text-muted-foreground mb-1">/mo</span>
                      </>
                    )}
                  </div>
                  {billing === "yearly" && price > 0 && (
                    <p className="text-xs text-muted-foreground">Billed ${price * 12}/year</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 leading-snug">{plan.tagline}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2">
                      <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${f.included ? "bg-green-100" : "bg-gray-100"}`}>
                        {f.included
                          ? <Check className="h-2.5 w-2.5 text-green-600" strokeWidth={3} />
                          : <span className="text-gray-400 text-[10px] font-bold leading-none">—</span>
                        }
                      </div>
                      <span className={`text-xs leading-snug ${f.included ? "text-foreground" : "text-muted-foreground"}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                  {!plan.isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature highlights */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-foreground text-center">Everything included in every paid plan</h2>
          <div className="grid grid-cols-3 gap-5">
            {FEATURE_HIGHLIGHTS.map((feat) => (
              <div key={feat.title} className="flex gap-4 rounded-xl border border-border bg-card px-5 py-4">
                <div className="mt-0.5 shrink-0">{feat.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{feat.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-border bg-card p-8 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            {[
              { q: "Can I switch plans at any time?", a: "Yes — you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated." },
              { q: "What happens to my unused credits?", a: "Credits are separate from plan limits. Any purchased credits are yours to keep and never expire, regardless of your plan." },
              { q: "Is there a free trial?", a: "All paid plans come with a 7-day money-back guarantee. No free trial, but you can start with the free Starter plan." },
              { q: "What payment methods are accepted?", a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) and PayPal for subscription payments." },
              { q: "How does the request limit work?", a: "Each accepted backlink exchange request consumes one of your monthly requests. Pending and rejected requests are not counted." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel anytime from your settings — you'll retain access until the end of your billing period." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-semibold text-foreground mb-1">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
