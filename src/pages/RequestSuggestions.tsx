import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Lightbulb, Sparkles, Zap, ChevronLeft, ChevronDown, History, Trash2, Check, Minus, Plus } from "lucide-react";
import ExchangeWebsitesList from "@/components/ExchangeWebsitesList";
import { mockWebsites } from "@/data/websites";
import { getAccountCredits, spendAccountCredits } from "@/lib/credits";

interface StoredProject {
  name: string;
  domain: string;
}

interface SuggestionBatch {
  id: string;
  projectDomain: string;
  projectName: string;
  count: number;
  suggestedDomains: string[];
  generatedAt: string;
  creditsCost: number;
}

function loadProjects(): StoredProject[] {
  const saved = localStorage.getItem("home-projects");
  return saved ? JSON.parse(saved) : [];
}

function loadBatches(): SuggestionBatch[] {
  const saved = localStorage.getItem("suggestions-batches");
  return saved ? JSON.parse(saved) : [];
}

function saveBatches(batches: SuggestionBatch[]) {
  localStorage.setItem("suggestions-batches", JSON.stringify(batches));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
}

function generateSuggestedDomains(projectDomain: string, count: number, batchId: string): string[] {
  const seed = hashStr(projectDomain + "|batch-" + batchId);
  const rand = lcg(seed);
  const arr = mockWebsites.map((s) => s.domain);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

const COUNT_OPTIONS = [10, 20, 30];

export default function RequestSuggestions() {
  const [view, setView] = useState<"landing" | "results">(() => {
    const batches = loadBatches();
    const savedId = localStorage.getItem("suggestions-active-batch");
    return savedId && batches.find((b) => b.id === savedId) ? "results" : "landing";
  });
  const [selectedBatch, setSelectedBatch] = useState<SuggestionBatch | null>(() => {
    const batches = loadBatches();
    const savedId = localStorage.getItem("suggestions-active-batch");
    return batches.find((b) => b.id === savedId) ?? null;
  });

  const [projects, setProjects] = useState<StoredProject[]>(() => loadProjects());
  const [selectedDomain, setSelectedDomain] = useState<string>(() => {
    const saved = localStorage.getItem("suggestions-selected-domain");
    const ps = loadProjects();
    return saved && ps.find((p) => p.domain === saved) ? saved : (ps[0]?.domain ?? "");
  });
  const [count, setCount] = useState(10);
  const [batches, setBatches] = useState<SuggestionBatch[]>(() => loadBatches());
  const [credits, setCredits] = useState(() => getAccountCredits());
  const [generateError, setGenerateError] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);

  useEffect(() => {
    const sync = () => setCredits(getAccountCredits());
    window.addEventListener("creditsChanged", sync);
    return () => window.removeEventListener("creditsChanged", sync);
  }, []);

  // Reload projects whenever landing page is shown (picks up newly-added projects)
  useEffect(() => {
    if (view === "landing") {
      const fresh = loadProjects();
      setProjects(fresh);
      if (!fresh.find((p) => p.domain === selectedDomain) && fresh[0]) {
        setSelectedDomain(fresh[0].domain);
      }
    }
  }, [view]);

  const selectedProject = projects.find((p) => p.domain === selectedDomain) ?? projects[0];
  const creditsCost = count / 10;

  function handleGenerate() {
    if (!selectedProject) { setGenerateError("Please select a project first."); return; }
    if (credits < creditsCost) {
      setGenerateError(`Not enough credits. You need ${creditsCost} but only have ${credits}.`);
      return;
    }
    setGenerateError("");

    const batchId = Date.now().toString();
    const suggestedDomains = generateSuggestedDomains(selectedProject.domain, count, batchId);

    const batch: SuggestionBatch = {
      id: batchId,
      projectDomain: selectedProject.domain,
      projectName: selectedProject.name,
      count,
      suggestedDomains,
      generatedAt: new Date().toISOString(),
      creditsCost,
    };

    spendAccountCredits(creditsCost);
    setCredits(getAccountCredits());

    const newBatches = [batch, ...batches];
    setBatches(newBatches);
    saveBatches(newBatches);
    localStorage.setItem("suggestions-selected-domain", selectedProject.domain);

    setSelectedBatch(batch);
    setView("results");
    localStorage.setItem("suggestions-active-batch", batch.id);
  }

  function viewBatch(batch: SuggestionBatch) {
    setSelectedBatch(batch);
    setView("results");
    localStorage.setItem("suggestions-active-batch", batch.id);
  }

  function deleteBatch(id: string) {
    const updated = batches.filter((b) => b.id !== id);
    setBatches(updated);
    saveBatches(updated);
  }

  // ── Results view ──────────────────────────────────────────────────────────────
  if (view === "results" && selectedBatch) {
    return (
      <AppLayout title="Request Suggestions" icon={<Lightbulb className="h-5 w-5" />}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setView("landing"); localStorage.removeItem("suggestions-active-batch"); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Suggestions
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <div className="h-6 w-6 rounded overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <img src={`https://www.google.com/s2/favicons?domain=${selectedBatch.projectDomain}&sz=32`} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="font-semibold text-foreground">{selectedBatch.projectName}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{selectedBatch.count} suggestions</span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-0.5 text-amber-600 font-medium text-xs">
                <Zap className="h-3 w-3" />{selectedBatch.creditsCost} credit{selectedBatch.creditsCost > 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formatDate(selectedBatch.generatedAt)}</span>
            </div>
          </div>

          <ExchangeWebsitesList
            mode="suggestions"
            projectDomain={selectedBatch.projectDomain}
            projectName={selectedBatch.projectName}
            suggestedDomains={selectedBatch.suggestedDomains}
          />
        </div>
      </AppLayout>
    );
  }

  // ── Landing page ─────────────────────────────────────────────────────────────
  return (
    <AppLayout title="Request Suggestions" icon={<Lightbulb className="h-5 w-5" />}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/5 rounded-full translate-y-28 -translate-x-28 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold bg-white/20 rounded-full px-3 py-1 uppercase tracking-wide">AI-Powered</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Generate Request Suggestions</h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-md">
              Our AI analyzes your project's domain, niche, and content to recommend the most relevant backlink opportunities — personalized for each of your websites.
            </p>
          </div>
        </div>

        {/* Config */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">

          {/* Project selector */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Select Project</label>
            {projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No projects yet.{" "}
                <a href="/" className="text-primary hover:underline font-medium">Add a project</a>{" "}
                to get started.
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setProjectOpen((o) => !o)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img src={`https://www.google.com/s2/favicons?domain=${selectedProject?.domain ?? ""}&sz=64`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selectedProject?.name ?? "Select a project"}</p>
                    {selectedProject?.domain && <p className="text-xs text-muted-foreground">{selectedProject.domain}</p>}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${projectOpen ? "rotate-180" : ""}`} />
                </button>
                {projectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-50 py-1.5 max-h-64 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.domain}
                        onClick={() => { setSelectedDomain(p.domain); setProjectOpen(false); setGenerateError(""); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                      >
                        <div className="h-7 w-7 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=32`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.domain}</p>
                        </div>
                        {selectedDomain === p.domain && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Count selector */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Number of Suggestions</label>
            <p className="text-xs text-muted-foreground mb-3">10 suggestions = 1 credit</p>
            <div className="grid grid-cols-3 gap-3">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => { setCount(n); setGenerateError(""); }}
                  className={`rounded-xl border-2 px-4 py-3.5 text-center transition-all ${
                    count === n
                      ? "border-gray-900 text-gray-900 shadow-sm"
                      : "border-border text-foreground hover:border-gray-400 hover:bg-muted/30"
                  }`}
                >
                  <p className="text-2xl font-bold">{n}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">{n / 10} credit{n > 10 ? "s" : ""}</p>
                </button>
              ))}
            </div>
            {/* Custom count */}
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground flex-1">Custom amount</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCount(Math.max(10, count - 10)); setGenerateError(""); }}
                  className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="text-center min-w-[48px]">
                  <span className="text-sm font-bold text-foreground">{count}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{creditsCost} cr</span>
                </div>
                <button
                  onClick={() => { setCount(count + 10); setGenerateError(""); }}
                  className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Credits summary */}
          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-amber-800">
                {creditsCost} credit{creditsCost > 1 ? "s" : ""} will be charged
              </span>
            </div>
            <span className="text-xs text-amber-700 font-medium">
              You have: <span className="font-bold">{credits}</span> credits
            </span>
          </div>

          {generateError && <p className="text-sm text-red-500 font-medium">{generateError}</p>}

          <button
            onClick={handleGenerate}
            disabled={projects.length === 0 || credits < creditsCost}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-black py-3.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Generate {count} Suggestions
          </button>
        </div>

        {/* History */}
        {batches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Previous Suggestions</h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {batches.length} batch{batches.length !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
                >
                  <div className="h-9 w-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img src={`https://www.google.com/s2/favicons?domain=${batch.projectDomain}&sz=32`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{batch.projectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.count} suggestions · {batch.creditsCost} credit{batch.creditsCost > 1 ? "s" : ""} · {formatDate(batch.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => viewBatch(batch)}
                      className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
