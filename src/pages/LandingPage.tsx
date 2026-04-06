import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Auth nav helpers ──────────────────────────────────────────────────────────
function useGoToApp() {
  const navigate = useNavigate();
  // Sign Up: clear onboarding so new users see the flow
  return () => {
    localStorage.removeItem("onboarding-complete");
    navigate("/app");
  };
}

function useSignIn() {
  const navigate = useNavigate();
  // Sign In: preserve onboarding-complete so returning users skip it
  return () => navigate("/app");
}

// ── Theme ─────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";

const THEMES: Record<Theme, {
  bg: string; bgAlt: string; text: string; subtext: string; muted: string;
  border: string; cardBg: string; navBg: string;
}> = {
  dark: {
    bg: "#080812", bgAlt: "#0c0c1a", text: "#ffffff", subtext: "#9ca3af",
    muted: "#4b5563", border: "rgba(255,255,255,0.07)", cardBg: "rgba(255,255,255,0.03)",
    navBg: "rgba(8,8,20,0.85)",
  },
  light: {
    bg: "#fafafa", bgAlt: "#f1f0f8", text: "#0f0f1a", subtext: "#6b7280",
    muted: "#9ca3af", border: "rgba(0,0,0,0.08)", cardBg: "rgba(139,92,246,0.04)",
    navBg: "rgba(250,250,250,0.85)",
  },
};

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = THEMES[theme];
  const goToApp = useGoToApp();
  const signIn = useSignIn();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? t.navBg : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid rgba(139,92,246,0.15)` : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo("hero")}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: t.text }}>Linkade</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[["Features", "features"], ["Stats", "stats"], ["Contact", "contact"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm font-medium transition-colors duration-200 hover:text-violet-400"
              style={{ color: t.subtext }}>
              {label}
            </button>
          ))}
        </div>

        {/* Right side: theme + auth */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: t.cardBg, border: `1px solid ${t.border}`, color: t.subtext }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          <button onClick={signIn}
            className="text-sm font-medium transition-colors duration-200 px-4 py-2 rounded-lg"
            style={{ color: t.subtext }}
            onMouseEnter={e => (e.currentTarget.style.color = t.text)}
            onMouseLeave={e => (e.currentTarget.style.color = t.subtext)}>
            Sign In
          </button>
          <button onClick={goToApp}
            className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              boxShadow: "0 0 20px rgba(139,92,246,0.3)",
            }}>
            Get Started
          </button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden transition-colors" style={{ color: t.subtext }} onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 pt-2 flex flex-col gap-3"
          style={{ background: theme === "dark" ? "rgba(8,8,20,0.97)" : "rgba(250,250,250,0.97)", backdropFilter: "blur(20px)" }}>
          {[["Features", "features"], ["Stats", "stats"], ["Contact", "contact"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-left text-sm py-2 font-medium" style={{ color: t.subtext }}>{label}</button>
          ))}
          <div className="flex gap-3 pt-2 items-center">
            <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ background: t.cardBg, border: `1px solid ${t.border}`, color: t.subtext }}>
              {theme === "dark"
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>
            <button onClick={signIn} className="flex-1 text-center text-sm py-2 rounded-lg" style={{ border: `1px solid ${t.border}`, color: t.text }}>Sign In</button>
            <button onClick={goToApp} className="flex-1 text-center text-sm text-white font-semibold py-2 rounded-lg"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>Get Started</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ theme }: { theme: Theme }) {
  const t = THEMES[theme];
  const goToApp = useGoToApp();
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: t.bg }}>

      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0"
        style={{
          opacity: theme === "dark" ? 0.03 : 0.06,
          backgroundImage: `radial-gradient(circle, ${theme === "dark" ? "#ffffff" : "#8b5cf6"} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium"
          style={{
            border: "1px solid rgba(139,92,246,0.4)",
            background: "rgba(139,92,246,0.08)",
            color: "#a78bfa",
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          The smarter way to exchange backlinks
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6" style={{ color: t.text }}>
          Your backlink exchange,{" "}
          <span style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            minus the chaos.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: t.subtext }}>
          A credit-based exchange where site owners swap backlinks directly — no cold outreach, no payments, no guesswork. Find a match, send a request, and go live.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={goToApp}
            className="px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 40px rgba(139,92,246,0.35), 0 2px 20px rgba(0,0,0,0.4)",
            }}>
            Start for free →
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 hover:bg-violet-500/10"
            style={{ border: `1px solid ${t.border}`, color: t.subtext }}>
            Explore features
          </button>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm" style={{ color: t.muted }}>
          Trusted by <span className="font-medium" style={{ color: t.subtext }}>2,500+</span> SEO professionals worldwide
        </p>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
    title: "Link Exchange",
    desc: "Browse verified publishers, filter by niche, DR, and availability, and send Link Insertion or Guest Post requests through a structured pipeline.",
    color: "#8b5cf6",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1010 10"/><path d="M22 2L11 13"/><path d="M15 2h7v7"/>
      </svg>
    ),
    title: "AI Niche Matching",
    desc: "Our AI scans your site and surfaces the most relevant publishers automatically, matched by niche, category, and content relevance.",
    color: "#6366f1",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
      </svg>
    ),
    title: "SEO Change Tracking",
    desc: "After adding a project, track time-filtered SEO metric changes and see exactly how your rankings, DR, and traffic shift over any period.",
    color: "#a78bfa",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "AI Blog Generator",
    desc: "Generate SEO-optimised blog posts for your projects instantly. Tailored to your niche, ready to publish.",
    color: "#60a5fa",
  },
];

function Features({ theme }: { theme: Theme }) {
  const { ref, visible } = useReveal();
  const t = THEMES[theme];
  return (
    <section id="features" className="py-28 relative" style={{ background: t.bg }}>
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: t.text }}>
            Everything your SEO needs.
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: t.muted }}>
            One platform replaces a dozen tools. Simple, powerful, built for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl transition-all duration-700 cursor-default hover:scale-[1.02]"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                transitionDelay: `${i * 100}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(32px)",
              }}
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}18, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: t.text }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: t.muted }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "12,400+", label: "Websites Listed" },
  { value: "54,000+", label: "Links Exchanged" },
  { value: "2,500+", label: "Active Users" },
  { value: "98%", label: "Satisfaction Rate" },
];

function Stats({ theme }: { theme: Theme }) {
  const { ref, visible } = useReveal();
  const t = THEMES[theme];
  const goToApp = useGoToApp();
  return (
    <section id="stats" className="py-28 relative" style={{ background: t.bgAlt }}>
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
      <div className="absolute bottom-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-64 opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #8b5cf6, transparent)" }} />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">By the numbers</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: t.text }}>
            Results that speak.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: t.border }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center py-12 px-6 text-center transition-all duration-700"
              style={{
                background: t.bgAlt,
                transitionDelay: `${i * 100}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.9)",
              }}
            >
              <span className="text-4xl md:text-5xl font-bold mb-2"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                {s.value}
              </span>
              <span className="text-sm font-medium" style={{ color: t.muted }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={`mt-16 text-center transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-lg mb-6" style={{ color: t.subtext }}>
            Join thousands of SEOs building smarter, faster.
          </p>
          <button onClick={goToApp}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 30px rgba(139,92,246,0.3)",
            }}>
            Get started free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact({ theme }: { theme: Theme }) {
  const { ref, visible } = useReveal();
  const t = THEMES[theme];
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const focusStyle = { border: "1px solid rgba(139,92,246,0.5)", boxShadow: "0 0 0 3px rgba(139,92,246,0.1)" };
  const blurStyle  = { border: `1px solid ${t.border}`, boxShadow: "none" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  };

  const inputBase: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    color: t.text,
  };

  return (
    <section id="contact" className="py-28 relative overflow-hidden" style={{ background: t.bg }}>
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
      </div>

      <div ref={ref} className="max-w-2xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: t.text }}>
            Let's talk.
          </h2>
          <p className="text-lg" style={{ color: t.muted }}>
            Have a question? We'll get back to you within 24 hours.
          </p>
        </div>

        <div
          className={`p-8 rounded-2xl transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>

          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(139,92,246,0.15)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2" style={{ color: t.text }}>Message sent!</h3>
              <p style={{ color: t.muted }}>We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: t.subtext }}>Name</label>
                  <input type="text" required placeholder="Your name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 text-sm placeholder-gray-500"
                    style={inputBase}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium" style={{ color: t.subtext }}>Email</label>
                  <input type="email" required placeholder="you@company.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 text-sm placeholder-gray-500"
                    style={inputBase}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: t.subtext }}>Message</label>
                <textarea required rows={5} placeholder="Tell us what you're looking for..." value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200 text-sm resize-none placeholder-gray-500"
                  style={inputBase}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.01] disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 0 30px rgba(139,92,246,0.25)" }}>
                {sending ? "Sending..." : "Send message →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ theme }: { theme: Theme }) {
  const t = THEMES[theme];
  return (
    <footer className="py-10 px-6" style={{ background: t.bg, borderTop: `1px solid ${t.border}` }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: t.text }}>Linkade</span>
        </div>
        <p className="text-xs" style={{ color: t.muted }}>© {new Date().getFullYear()} Linkade. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Support"].map((item) => (
            <a key={item} href="#" className="text-xs transition-colors hover:text-violet-400" style={{ color: t.muted }}>{item}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div style={{ fontFamily: "Inter, sans-serif", transition: "background 0.3s" }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Hero theme={theme} />
      <Features theme={theme} />
      <Stats theme={theme} />
      <Contact theme={theme} />
      <Footer theme={theme} />
    </div>
  );
}
