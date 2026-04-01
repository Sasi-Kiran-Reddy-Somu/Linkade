import AppLayout from "@/components/AppLayout";
import { Briefcase, Search, Activity, X, Sparkles, Plus, Check, Copy, Info } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const RESP_BANNER_KEY = "resp-score-banner-seen";

interface Project {
  name: string;
  domain: string;
  exchangeEnabled: boolean;
  exchangeStatus: string;
  responsivenessScore?: number;
  da: number;
  dr: number;
  tf: number;
  traffic: number;
  spamScore: number;
  category?: string;
  tags?: string[];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMetrics() {
  return { da: randInt(10, 75), dr: randInt(5, 80), tf: randInt(5, 70), traffic: randInt(500, 85000), spamScore: randInt(1, 20), responsivenessScore: randInt(40, 98) };
}

const INITIAL_PROJECTS: Project[] = [
  { name: "Cube", domain: "cubehq.ai", exchangeEnabled: true, exchangeStatus: "Pending", responsivenessScore: 92, da: 42, dr: 51, tf: 38, traffic: 12400, spamScore: 3 },
  { name: "JustWhatWorks", domain: "justwhatworks.com", exchangeEnabled: false, exchangeStatus: "Exchange Off", responsivenessScore: 61, da: 27, dr: 33, tf: 21, traffic: 4800, spamScore: 7 },
];

// ── AI category/tag detection via backend ─────────────────────────────────────

async function detectCategoryTags(domain: string): Promise<{ category: string; tags: string[] }> {
  const res = await fetch("/api/ai/detect-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error("Detection failed");
  return res.json();
}

function generateToken() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function MiniToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function PointsInput({ points, onChange, hint }: { points: string[]; onChange: (p: string[]) => void; hint?: string }) {
  return (
    <div className="space-y-2">
      {points.map((point, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-300 text-sm select-none">•</span>
          <input
            value={point}
            onChange={(e) => { const next = [...points]; next[i] = e.target.value; onChange(next); }}
            placeholder="Add a guideline..."
            className="flex-1 text-xs border border-border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={() => onChange(points.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...points, ""])} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
        <Plus className="h-3 w-3" /> Add point
      </button>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("home-projects");
    const parsed: Project[] = saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    return parsed.map((p) => ({
      ...p,
      dr: p.dr ?? randInt(5, 80),
      spamScore: p.spamScore ?? randInt(1, 20),
      responsivenessScore: p.responsivenessScore ?? randInt(40, 98),
    }));
  });

  useEffect(() => {
    localStorage.setItem("home-projects", JSON.stringify(projects));
  }, [projects]);

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("project-notes");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeProject, setActiveProject] = useState<{ name: string; domain: string } | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const [search, setSearch] = useState("");
  const [respBannerVisible, setRespBannerVisible] = useState(
    () => !localStorage.getItem(RESP_BANNER_KEY) && projects.some((p) => p.responsivenessScore !== undefined)
  );

  function dismissRespBanner() {
    localStorage.setItem(RESP_BANNER_KEY, "1");
    setRespBannerVisible(false);
  }

  // ── Add modal state ──────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newExchange, setNewExchange] = useState(false);

  // ── Exchange options modal (appears after add if exchange=on) ────────────────
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [pendingDomain, setPendingDomain] = useState("");
  const [draftLI, setDraftLI] = useState(false);
  const [draftGP, setDraftGP] = useState(false);
  const [draftLIGuidelines, setDraftLIGuidelines] = useState<string[]>([]);
  const [draftGPGuidelines, setDraftGPGuidelines] = useState<string[]>([]);

  // ── Verify modal (from exchange options) ─────────────────────────────────────
  const [addVerifyOpen, setAddVerifyOpen] = useState(false);
  const [addVerifyMethod, setAddVerifyMethod] = useState<"meta" | "dns">("meta");
  const [addVerifyCopied, setAddVerifyCopied] = useState<string | null>(null);
  const [addVerifyToken, setAddVerifyToken] = useState("");
  const [addVerifySuccess, setAddVerifySuccess] = useState(false);

  // ── Info popup (after verify later) ──────────────────────────────────────────
  const [infoPopupOpen, setInfoPopupOpen] = useState(false);

  // ── Notes helpers ────────────────────────────────────────────────────────────
  function openNotes(name: string, domain: string) {
    setDraftNote(notes[domain] ?? "");
    setActiveProject({ name, domain });
  }

  function handleSaveNote() {
    if (!activeProject) return;
    const updated = { ...notes, [activeProject.domain]: draftNote };
    setNotes(updated);
    localStorage.setItem("project-notes", JSON.stringify(updated));
    setActiveProject(null);
  }

  function handleRemoveProject(domain: string) {
    setProjects((prev) => prev.filter((p) => p.domain !== domain));
    localStorage.removeItem(`project-exchange-${domain}`);
  }

  function handleEditProject(domain: string, name: string) {
    setProjects((prev) => prev.map((p) => p.domain === domain ? { ...p, name } : p));
  }

  // ── Add modal helpers ────────────────────────────────────────────────────────
  function openAddModal() {
    setNewName("");
    setNewDomain("");
    setNewExchange(false);
    setErrors({});
    setAddStep(1);
    setSelectedTags([]);
    setDetectedCategory("");
    setSuggestedTags([]);
    setAnalyzing(false);
    setAnalyzeError(false);
    setAddOpen(true);
  }

  async function handleStep1Next() {
    const e: { name?: string; domain?: string } = {};
    if (!newName.trim()) e.name = "Project name is required.";
    if (!newDomain.trim()) e.domain = "Domain is required.";
    if (Object.keys(e).length) { setErrors(e); return; }

    setAnalyzing(true);
    setAnalyzeError(false);
    setAddStep(2);
    const cleanDomain = newDomain.trim().replace(/^https?:\/\//, "");
    try {
      const detected = await detectCategoryTags(cleanDomain);
      setDetectedCategory(detected.category);
      setSuggestedTags(detected.tags);
    } catch (err) {
      console.error("[detect-category]", err);
      setAnalyzeError(true);
      setDetectedCategory("");
      setSuggestedTags([]);
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 5) return prev;
      return [...prev, tag];
    });
  }

  function handleAddProject() {
    const domain = newDomain.trim().replace(/^https?:\/\//, "");
    setProjects((prev) => [
      ...prev,
      {
        name: newName.trim(),
        domain,
        exchangeEnabled: false,
        exchangeStatus: "Exchange Off",
        category: detectedCategory,
        tags: selectedTags,
        ...randomMetrics(),
      },
    ]);
    setPendingDomain(domain);
    setAddOpen(false);

    if (newExchange) {
      setDraftLI(false);
      setDraftGP(false);
      setDraftLIGuidelines([]);
      setDraftGPGuidelines([]);
      setExchangeModalOpen(true);
    }
  }

  // ── Exchange options helpers ─────────────────────────────────────────────────
  function writeExchangeToStorage(domain: string, token: string, verified: boolean) {
    const willBeEnabled = draftLI || draftGP;
    localStorage.setItem(`project-exchange-${domain}`, JSON.stringify({
      isExchangeEnabled: willBeEnabled,
      linkInsertionEnabled: draftLI,
      guestPostEnabled: draftGP,
      linkInsertionGuidelines: draftLIGuidelines.filter((p) => p.trim()),
      guestPostGuidelines: draftGPGuidelines.filter((p) => p.trim()),
      isVerified: verified,
      verificationToken: token,
    }));
    setProjects((prev) => prev.map((p) =>
      p.domain === domain
        ? { ...p, exchangeEnabled: willBeEnabled, exchangeStatus: willBeEnabled ? (verified ? "Active" : "Pending") : "Exchange Off" }
        : p
    ));
  }

  function handleExchangeVerifyLater() {
    const token = generateToken();
    writeExchangeToStorage(pendingDomain, token, false);
    setExchangeModalOpen(false);
    setInfoPopupOpen(true);
  }

  function handleExchangeVerifyNow() {
    const token = generateToken();
    setAddVerifyToken(token);
    writeExchangeToStorage(pendingDomain, token, false);
    setExchangeModalOpen(false);
    setAddVerifySuccess(false);
    setAddVerifyMethod("meta");
    setAddVerifyOpen(true);
  }

  function handleVerifySubmit() {
    // Update storage to mark verified
    const storageKey = `project-exchange-${pendingDomain}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...existing, isVerified: true }));
    setProjects((prev) => prev.map((p) =>
      p.domain === pendingDomain ? { ...p, exchangeStatus: "Active" } : p
    ));
    setAddVerifySuccess(true);
  }

  // ── Derived verify strings ───────────────────────────────────────────────────
  const verifyMetaTag = `<meta name="linkade-site-verification" content="${addVerifyToken}" />`;
  const verifyDnsTxt = `linkade-site-verification=${addVerifyToken}`;

  function handleVerifyCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setAddVerifyCopied(key);
    setTimeout(() => setAddVerifyCopied(null), 1500);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="My Projects" icon={<Briefcase className="h-5 w-5" />}>
      <div className="space-y-6">

        {/* Responsiveness score education banner */}
        {respBannerVisible && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 px-4 py-3.5">
            <Activity className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">What is the Responsiveness score?</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                It reflects how quickly you respond to incoming backlink requests. A higher score makes your site more visible in the exchange — sites with scores above 75% appear at the top of searches.
                <strong> Respond to requests within 48 hours to keep your score healthy.</strong>
              </p>
            </div>
            <button onClick={dismissRespBanner} className="shrink-0 text-blue-400 hover:text-blue-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-72 rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="rounded-md bg-primary px-4 py-2 text-white text-sm flex items-center gap-1"
          >
            <span className="text-lg leading-none">+</span> Add Project
          </button>
        </div>

        {projects.filter((p) => {
          const q = search.toLowerCase();
          return !q || p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
        }).map((p) => (
          <ProjectCard
            key={p.domain}
            name={p.name}
            domain={p.domain}
            image=""
            da={p.da}
            dr={p.dr}
            tf={p.tf}
            traffic={p.traffic}
            spamScore={p.spamScore}
            exchangeEnabled={p.exchangeEnabled}
            responsivenessScore={p.responsivenessScore}
            hasNotes={!!notes[p.domain]}
            onNotesClick={() => openNotes(p.name, p.domain)}
            onRemove={() => handleRemoveProject(p.domain)}
            onEdit={(name) => handleEditProject(p.domain, name)}
          />
        ))}
      </div>

      {/* ── Add Project Modal — Step 1: Name + Domain ── */}
      <Dialog open={addOpen && addStep === 1} onOpenChange={(open) => { if (!open) setAddOpen(false); }}>
        <DialogContent className="w-[460px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }}
                placeholder="e.g. My Blog"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                value={newDomain}
                onChange={(e) => { setNewDomain(e.target.value); setErrors((v) => ({ ...v, domain: undefined })); }}
                placeholder="e.g. myblog.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.domain && <p className="mt-1 text-xs text-red-500">{errors.domain}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={() => setAddOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStep1Next}
              disabled={!newName.trim() || !newDomain.trim()}
              className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next →
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Project Modal — Step 2: Category + Tags + Exchange ── */}
      <Dialog open={addOpen && addStep === 2} onOpenChange={(open) => { if (!open) setAddOpen(false); }}>
        <DialogContent className="w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Project</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{newName} · {newDomain.replace(/^https?:\/\//, "")}</p>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Analyzing your website...</span>
              </div>
              <p className="text-xs text-muted-foreground">Detecting category and suggesting tags</p>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : analyzeError ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Could not reach AI service</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure the backend server is running with a valid OpenAI API key.</p>
              </div>
              <button
                onClick={() => { setAddStep(1); setAnalyzeError(false); }}
                className="text-xs text-primary hover:underline"
              >
                ← Go back and try again
              </button>
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              {/* Detected category */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Detected Category</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-medium text-primary">
                  {detectedCategory}
                </span>
              </div>

              {/* Tag selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggested Tags</span>
                  </div>
                  <span className={`text-xs font-medium ${selectedTags.length >= 5 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {selectedTags.length}/5 selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    const isDisabled = !isSelected && selectedTags.length >= 5;
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        disabled={isDisabled}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : isDisabled
                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Select up to 5 tags that best describe your site. These help match relevant backlink opportunities.</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Exchange toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for Exchange</p>
                  <p className="text-xs text-gray-400 mt-0.5">Allow others to request backlinks from this site</p>
                </div>
                <MiniToggle checked={newExchange} onChange={() => setNewExchange((v) => !v)} />
              </div>
            </div>
          )}

          {!analyzing && !analyzeError && (
            <div className="flex justify-between gap-2 mt-5">
              <button
                onClick={() => setAddStep(1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-black/80 transition-colors"
                >
                  Add Project
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Exchange Options Modal ── */}
      <Dialog open={exchangeModalOpen} onOpenChange={(open) => { if (!open) setExchangeModalOpen(false); }}>
        <DialogContent className="w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exchange Options — {pendingDomain}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-1">Choose what types of exchange you want to accept for this site.</p>

          <div className="space-y-3 mt-3">
            {/* Link Insertion */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for Link Insertion</p>
                  <p className="text-xs text-gray-400 mt-0.5">Accept requests to insert links into existing content</p>
                </div>
                <MiniToggle checked={draftLI} onChange={() => setDraftLI((v) => !v)} />
              </div>
              {draftLI && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Guidelines (optional)</label>
                  <PointsInput
                    points={draftLIGuidelines}
                    onChange={setDraftLIGuidelines}
                    hint="e.g. anchor text rules, link placement, niche restrictions, link type..."
                  />
                </div>
              )}
            </div>

            {/* Guest Post */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for Guest Post</p>
                  <p className="text-xs text-gray-400 mt-0.5">Accept requests to publish guest articles on this site</p>
                </div>
                <MiniToggle checked={draftGP} onChange={() => setDraftGP((v) => !v)} />
              </div>
              {draftGP && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Guidelines (optional)</label>
                  <PointsInput
                    points={draftGPGuidelines}
                    onChange={setDraftGPGuidelines}
                    hint="e.g. minimum/maximum word count, AI score requirement, topic restrictions, original content only..."
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleExchangeVerifyLater}
              className="rounded-md border border-border px-5 py-2 text-sm hover:bg-muted transition-colors"
            >
              Verify Later
            </button>
            <button
              onClick={handleExchangeVerifyNow}
              className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Verify Now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Verify Now Modal (from exchange options) ── */}
      <Dialog open={addVerifyOpen} onOpenChange={(open) => { if (!open) setAddVerifyOpen(false); }}>
        <DialogContent className="w-[560px] max-h-[90vh] overflow-y-auto">
          {addVerifySuccess ? (
            <div className="flex flex-col items-center py-8 text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Verification Successful!</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Your ownership of <span className="font-medium">{pendingDomain}</span> has been confirmed. Your site is now active in the exchange.
              </p>
              <button
                onClick={() => setAddVerifyOpen(false)}
                className="mt-2 rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-black/80 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Verify Website Ownership</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600 leading-relaxed mt-1">
                Confirm you own <span className="font-medium">{pendingDomain}</span> by adding one of the verification methods below.
              </p>

              {/* Method tabs */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {(["meta", "dns"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAddVerifyMethod(m)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      addVerifyMethod === m ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${addVerifyMethod === m ? "border-primary" : "border-gray-300"}`}>
                      {addVerifyMethod === m && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {m === "meta" ? "HTML Meta Tag" : "DNS TXT Record"}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mt-4">
                {addVerifyMethod === "meta" ? (
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      Add this tag inside the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> of your homepage:
                    </p>
                    <div className="relative rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-12">
                      <code className="text-xs text-gray-700 break-all">{verifyMetaTag}</code>
                      <button
                        onClick={() => handleVerifyCopy(verifyMetaTag, "meta")}
                        className="absolute top-2 right-2 p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {addVerifyCopied === "meta" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-2">Add a TXT record to your domain's DNS settings:</p>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                      <div className="grid grid-cols-3 gap-px bg-border">
                        {["Type", "Name", "Value"].map((h) => (
                          <div key={h} className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">{h}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-border">
                        <div className="bg-card px-3 py-2 text-xs font-mono">TXT</div>
                        <div className="bg-card px-3 py-2 text-xs font-mono">@</div>
                        <div className="bg-card px-3 py-2 flex items-center gap-2">
                          <span className="text-xs font-mono break-all flex-1">{verifyDnsTxt}</span>
                          <button onClick={() => handleVerifyCopy(verifyDnsTxt, "dns")}>
                            {addVerifyCopied === "dns" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setAddVerifyOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifySubmit}
                  className="rounded-md bg-primary px-5 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
                >
                  Verify Now
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Verify Later Info Popup ── */}
      <Dialog open={infoPopupOpen} onOpenChange={setInfoPopupOpen}>
        <DialogContent className="w-[420px]">
          <button
            onClick={() => setInfoPopupOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Info className="h-6 w-6 text-amber-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-gray-900">Verification Required</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your site <span className="font-medium text-gray-700">{pendingDomain}</span> won't be visible in the exchange and won't be available to receive requests until you verify ownership.
              </p>
              <p className="text-xs text-gray-400 mt-1">You can verify anytime from the project card settings.</p>
            </div>
            <button
              onClick={() => setInfoPopupOpen(false)}
              className="mt-1 rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Notes Modal ── */}
      <Dialog open={!!activeProject} onOpenChange={(open) => { if (!open) setActiveProject(null); }}>
        <DialogContent className="w-[500px]">
          <DialogHeader>
            <DialogTitle>Notes — {activeProject?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Write your notes about this project..."
            className="min-h-40 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setActiveProject(null)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
