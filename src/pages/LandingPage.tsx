import { useEffect, useRef, useState } from "react";

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

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        background: scrolled
          ? "rgba(8, 8, 20, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(139,92,246,0.15)" : "none",
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
          <span className="text-white font-bold text-lg tracking-tight">Linkade</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[["Features", "features"], ["How it Works", "how-it-works"], ["Stats", "stats"], ["Contact", "contact"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-medium">
              {label}
            </button>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login"
            className="text-sm text-gray-300 hover:text-white font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/5">
            Sign In
          </a>
          <a href="/signup"
            className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              boxShadow: "0 0 20px rgba(139,92,246,0.3)",
            }}>
            Get Started
          </a>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-4 pt-2 flex flex-col gap-3"
          style={{ background: "rgba(8,8,20,0.95)", backdropFilter: "blur(20px)" }}>
          {[["Features", "features"], ["How it Works", "how-it-works"], ["Stats", "stats"], ["Contact", "contact"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-left text-sm text-gray-400 hover:text-white py-2 font-medium">{label}</button>
          ))}
          <div className="flex gap-3 pt-2">
            <a href="/login" className="flex-1 text-center text-sm text-gray-300 border border-white/10 py-2 rounded-lg">Sign In</a>
            <a href="/signup" className="flex-1 text-center text-sm text-white font-semibold py-2 rounded-lg"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>Get Started</a>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#080812" }}>

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
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
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
          The future of link building is here
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
          Build backlinks that{" "}
          <span style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            actually rank.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Exchange links with vetted publishers, buy placements from a curated marketplace,
          and let AI match you to the perfect niche — all in one platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/signup"
            className="px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 40px rgba(139,92,246,0.35), 0 2px 20px rgba(0,0,0,0.4)",
            }}>
            Start for free →
          </a>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 rounded-xl text-gray-300 font-semibold text-base transition-all duration-200 hover:text-white hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            See how it works
          </button>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-gray-600">
          Trusted by <span className="text-gray-400 font-medium">2,500+</span> SEO professionals worldwide
        </p>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent" />
        </div>
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
    desc: "Connect with website owners in your niche and swap high-quality backlinks — no money, just mutual value.",
    color: "#8b5cf6",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Link Marketplace",
    desc: "Browse thousands of vetted publishers. Buy permanent placements with real traffic and strong DR ratings.",
    color: "#6366f1",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1010 10"/><path d="M22 2L11 13"/><path d="M15 2h7v7"/>
      </svg>
    ),
    title: "AI Niche Matching",
    desc: "Our AI scans your site and finds the most relevant link partners automatically — no manual searching.",
    color: "#a78bfa",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Live Analytics",
    desc: "Track DA, DR, traffic, and spam scores for every link in your portfolio. Stay ahead of your competition.",
    color: "#60a5fa",
  },
];

function Features() {
  const { ref, visible } = useReveal();
  return (
    <section id="features" className="py-28 relative" style={{ background: "#080812" }}>
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Everything your SEO needs.
          </h2>
          <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
            One platform replaces a dozen tools. Simple, powerful, built for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group relative p-6 rounded-2xl transition-all duration-700 cursor-default
                hover:scale-[1.02] hover:shadow-2xl`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                transitionDelay: `${i * 100}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(32px)",
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}18, transparent 70%)` }} />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Add your website.",
    desc: "Submit your domain. Our AI instantly analyzes your niche, authority, and content to build your profile.",
  },
  {
    num: "02",
    title: "Discover opportunities.",
    desc: "Browse AI-matched link partners or explore our marketplace of 10,000+ vetted publishers.",
  },
  {
    num: "03",
    title: "Build & track links.",
    desc: "Send requests, close deals, and monitor every backlink from one clean dashboard.",
  },
];

function HowItWorks() {
  const { ref, visible } = useReveal();
  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden"
      style={{ background: "#0c0c1a" }}>

      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
      <div className="absolute bottom-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

      <div ref={ref} className="max-w-7xl mx-auto px-6">
        <div className={`text-center mb-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Up and running in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px"
            style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3), rgba(139,92,246,0.3))" }} />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="relative flex flex-col items-start md:items-center md:text-center transition-all duration-700"
              style={{
                transitionDelay: `${i * 150}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(40px)",
              }}
            >
              {/* Number circle */}
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                  style={{
                    background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))",
                    border: "1px solid rgba(139,92,246,0.4)",
                  }}>
                  <span className="text-2xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, #a78bfa, #818cf8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>{step.num}</span>
                </div>
                <div className="absolute inset-0 rounded-full blur-xl opacity-30"
                  style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
              </div>

              <h3 className="text-white font-bold text-2xl mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
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

function Stats() {
  const { ref, visible } = useReveal();
  return (
    <section id="stats" className="py-28 relative" style={{ background: "#080812" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-64 opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #8b5cf6, transparent)" }} />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">By the numbers</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Results that speak.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: "rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden" }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center py-12 px-6 text-center transition-all duration-700"
              style={{
                background: "#080812",
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
              <span className="text-gray-500 text-sm font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className={`mt-16 text-center transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-gray-400 text-lg mb-6">
            Join thousands of SEOs building smarter, faster.
          </p>
          <a href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              boxShadow: "0 0 30px rgba(139,92,246,0.3)",
            }}>
            Get started free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  const { ref, visible } = useReveal();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  };

  return (
    <section id="contact" className="py-28 relative overflow-hidden"
      style={{ background: "#0c0c1a" }}>

      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
      </div>

      <div ref={ref} className="max-w-2xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Let's talk.
          </h2>
          <p className="text-gray-500 text-lg">
            Have a question or want to learn more? We'll get back to you within 24 hours.
          </p>
        </div>

        <div
          className={`p-8 rounded-2xl transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>

          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(139,92,246,0.15)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Message sent!</h3>
              <p className="text-gray-500">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all duration-200 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all duration-200 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you're looking for..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none transition-all duration-200 text-sm resize-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(139,92,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.01] disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  boxShadow: "0 0 30px rgba(139,92,246,0.25)",
                }}>
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
function Footer() {
  return (
    <footer className="py-10 px-6" style={{ background: "#080812", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Linkade</span>
        </div>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Linkade. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Support"].map((item) => (
            <a key={item} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{item}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Contact />
      <Footer />
    </div>
  );
}
