import AppLayout from "@/components/AppLayout";
import { CreditCard, Zap, Check, Shield, BarChart3 } from "lucide-react";
import { useState } from "react";

const CREDIT_PACKAGES = [
  {
    id: "starter",
    credits: 5,
    price: 9.99,
    perCredit: 2.0,
    label: "Starter",
    color: "border-border",
    highlight: false,
    badge: null,
    features: ["5 credits to spend or earn", "Credits never expire", "Use on any quality site"],
  },
  {
    id: "growth",
    credits: 15,
    price: 24.99,
    perCredit: 1.67,
    label: "Growth",
    color: "border-primary",
    highlight: true,
    badge: "Most Popular",
    features: ["15 credits to spend or earn", "Credits never expire", "Priority request queue", "Save 17% vs Starter"],
  },
  {
    id: "pro",
    credits: 35,
    price: 49.99,
    perCredit: 1.43,
    label: "Pro",
    color: "border-border",
    highlight: false,
    badge: null,
    features: ["35 credits to spend or earn", "Credits never expire", "Priority request queue", "Save 28% vs Starter"],
  },
  {
    id: "agency",
    credits: 80,
    price: 99.99,
    perCredit: 1.25,
    label: "Agency",
    color: "border-green-500",
    highlight: false,
    badge: "Best Value",
    features: ["80 credits to spend or earn", "Credits never expire", "Priority request queue", "Dedicated account support", "Save 37% vs Starter"],
  },
];

const CURRENT_CREDITS = 3;

export default function AddCredits() {
  const [selected, setSelected] = useState("growth");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const pkg = CREDIT_PACKAGES.find((p) => p.id === selected)!;

  function formatCard(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  return (
    <AppLayout title="Add Credits" icon={<CreditCard className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Current balance */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-6 py-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Balance</p>
            <p className="text-xl font-bold text-foreground">{CURRENT_CREDITS} Credits</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Credits never expire
          </div>
        </div>

        <div className="grid grid-cols-[1fr_360px] gap-8 items-start">

          {/* Package selector */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Choose a Credit Package</h2>
            <div className="grid grid-cols-2 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                    selected === pkg.id
                      ? pkg.highlight
                        ? "border-primary bg-primary/5 shadow-md"
                        : pkg.id === "agency"
                        ? "border-green-500 bg-green-50/40 shadow-md"
                        : "border-foreground bg-muted/30 shadow-md"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {pkg.badge && (
                    <span className={`absolute -top-2.5 left-4 rounded-full px-3 py-0.5 text-[10px] font-bold text-white ${pkg.highlight ? "bg-primary" : "bg-green-600"}`}>
                      {pkg.badge}
                    </span>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{pkg.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">{pkg.credits}
                        <span className="text-base font-medium text-muted-foreground ml-1">credits</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">${pkg.price}</p>
                      <p className="text-xs text-muted-foreground">${pkg.perCredit.toFixed(2)}/credit</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mt-4">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Selection indicator */}
                  <div className={`mt-4 h-1.5 rounded-full transition-all ${selected === pkg.id ? (pkg.highlight ? "bg-primary" : pkg.id === "agency" ? "bg-green-500" : "bg-foreground") : "bg-transparent"}`} />
                </button>
              ))}
            </div>

            {/* How credits work */}
            <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">How Credits Work</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <BarChart3 className="h-4 w-4 text-primary" />, title: "Metric-Based Value", desc: "Each backlink's credit value is calculated from DR, DA, Traffic, TF, and Spam Score — higher quality sites earn or cost more credits." },
                  { icon: <Zap className="h-4 w-4 text-amber-500" />, title: "Earn & Spend", desc: "Earn credits when you publish an accepted link on your site. Spend credits when you send outgoing requests to other publishers." },
                  { icon: <Shield className="h-4 w-4 text-green-500" />, title: "Refund Policy", desc: "Unused credits are refundable within 30 days of purchase. Credits never expire." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 sticky top-6">
            <h2 className="text-base font-semibold text-foreground">Payment Details</h2>

            {/* Order summary */}
            <div className="rounded-xl bg-muted/40 px-4 py-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{pkg.label} Package</span>
                <span className="font-medium text-foreground">{pkg.credits} credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium text-foreground">${pkg.price}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">${pkg.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                New balance after purchase: <strong>{CURRENT_CREDITS + pkg.credits} credits</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Cardholder Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Card Number</label>
                <div className="relative">
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Expiry</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <button className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-black/80 transition-colors flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Pay ${pkg.price} — Get {pkg.credits} Credits
            </button>

            <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" /> Secured by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
