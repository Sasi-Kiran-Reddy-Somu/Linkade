import AppLayout from "@/components/AppLayout";
import {
  PenLine, ArrowLeft, Plus, Trash2, FileText, Settings2,
  CheckCircle2, Clock, Loader2, Sparkles, ChevronRight,
  Upload, X, ExternalLink,
} from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WDraft, getDrafts, saveDrafts, projectColor } from "./Writerate";

// ── Home project type ─────────────────────────────────────────────────────────

interface HomeProject {
  name: string;
  domain: string;
  [key: string]: unknown;
}

function getHomeProject(domain: string): HomeProject | undefined {
  try {
    const projects: HomeProject[] = JSON.parse(localStorage.getItem("home-projects") ?? "[]");
    return projects.find((p) => p.domain === domain);
  } catch { return undefined; }
}

// ── Brand config ──────────────────────────────────────────────────────────────

interface WBrandConfig {
  brandName: string;
  websiteUrl: string;
  niche: string;
  brandVoice: string;
  targetAudience: string;
  sampleBlogs: { name: string }[];
}

function getBrandConfig(domain: string): WBrandConfig {
  try {
    return JSON.parse(localStorage.getItem(`wr-brand-${domain}`) ?? "null") ?? defaultBrand();
  } catch { return defaultBrand(); }
}
function defaultBrand(): WBrandConfig {
  return { brandName: "", websiteUrl: "", niche: "", brandVoice: "", targetAudience: "", sampleBlogs: [] };
}
function saveBrandConfig(domain: string, config: WBrandConfig) {
  localStorage.setItem(`wr-brand-${domain}`, JSON.stringify(config));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WDraft["status"] }) {
  if (status === "Completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-100">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </span>
    );
  if (status === "Generating")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-100">
        <Loader2 className="h-3 w-3 animate-spin" /> Generating
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
      <Clock className="h-3 w-3" /> Draft
    </span>
  );
}

// ── AI Score badge ─────────────────────────────────────────────────────────────

function AiScore({ score }: { score: number }) {
  const color =
    score >= 95 ? "text-green-700 bg-green-50 border-green-100"
    : score >= 80 ? "text-blue-700 bg-blue-50 border-blue-100"
    : "text-amber-700 bg-amber-50 border-amber-100";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}>
      <Sparkles className="h-3 w-3" /> {score}
    </span>
  );
}

// ── New Article Modal ─────────────────────────────────────────────────────────

type ModalStep = "choose" | "form" | "generating" | "done";

const WORD_COUNTS = ["500–800", "800–1200", "1200–1800", "1800–2500", "2500+"];
const TONES = ["Professional", "Conversational", "Friendly", "Authoritative", "Educational", "Witty", "Inspirational", "Bold"];

interface ArticleForm {
  title: string;
  keywords: string;
  wordCount: string;
  tone: string;
  notes: string;
}

const EMPTY_FORM: ArticleForm = { title: "", keywords: "", wordCount: "", tone: "", notes: "" };

function NewArticleModal({
  domain,
  onClose,
  onCreated,
}: {
  domain: string;
  onClose: () => void;
  onCreated: (draft: WDraft) => void;
}) {
  const [step, setStep] = useState<ModalStep>("choose");
  const [isOutline, setIsOutline] = useState(false);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const brand = getBrandConfig(domain);
  const hasBrand = !!(brand.brandName || brand.niche);

  function handleChoose(outline: boolean) {
    setIsOutline(outline);
    setStep("form");
  }

  function handleGenerate() {
    setStep("generating");
    setTimeout(() => {
      const draft: WDraft = {
        id: crypto.randomUUID(),
        domain,
        title: form.title.trim(),
        status: "Draft",
        aiScore: Math.floor(Math.random() * 8) + 93,
        updatedAt: new Date().toISOString(),
      };
      const existing = getDrafts(domain);
      saveDrafts(domain, [draft, ...existing]);
      onCreated(draft);
      setStep("done");
    }, 2800);
  }

  function handleCreateAnother() {
    setStep("choose");
    setIsOutline(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Close button — always visible except generating */}
        {step !== "generating" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Step: choose */}
        {step === "choose" && (
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">New Article</h2>
            <p className="text-sm text-gray-500 mb-5">How would you like to start?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChoose(true)}
                className="group rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-gray-900 hover:shadow-sm transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-4.5 w-4.5 text-purple-600" style={{ height: "18px", width: "18px" }} />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Outline First</p>
                <p className="text-xs text-gray-500 leading-relaxed">Generate an outline, review sections, then write the article.</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                  Select <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
              <button
                onClick={() => handleChoose(false)}
                className="group rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-gray-900 hover:shadow-sm transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <Sparkles className="h-4.5 w-4.5 text-blue-600" style={{ height: "18px", width: "18px" }} />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Direct Article</p>
                <p className="text-xs text-gray-500 leading-relaxed">Skip the outline and generate a complete article in one shot.</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                  Select <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: form */}
        {step === "form" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep("choose")} className="text-gray-400 hover:text-gray-700 transition-colors -ml-0.5">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-base font-bold text-gray-900">
                {isOutline ? "Create Outline" : "Create Article"}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 ml-6">
              {isOutline ? "We'll generate a structured outline for review." : "We'll write a complete, ready-to-publish article."}
            </p>

            {hasBrand && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-4 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">
                  Using brand config — tone and style will be adapted automatically.
                </p>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Article Title or Topic <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && form.title.trim() && handleGenerate()}
                  placeholder="e.g. 10 Ways to Use Hot Sauce in Your Morning Routine"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Keywords</label>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                  placeholder="e.g. hot sauce recipes, spicy breakfast (comma separated)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Word Count</label>
                  <select
                    value={form.wordCount}
                    onChange={(e) => setForm((f) => ({ ...f, wordCount: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
                  >
                    <option value="">Select...</option>
                    {WORD_COUNTS.map((w) => <option key={w} value={w}>{w} words</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Tone</label>
                  <select
                    value={form.tone}
                    onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
                  >
                    <option value="">Select...</option>
                    {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any specific sections, references, or requirements..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!form.title.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isOutline ? "Generate Outline" : "Generate Article"}
              </button>
            </div>
          </div>
        )}

        {/* Step: generating */}
        {step === "generating" && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Loader2 className="h-7 w-7 text-gray-500 animate-spin" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1.5">
              {isOutline ? "Generating Outline..." : "Writing Your Article..."}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              {isOutline
                ? "Analyzing your topic and building a structured outline."
                : "Crafting your article with SEO-optimized content."}
            </p>
            <div className="mt-5 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1.5">
              {isOutline ? "Outline Ready!" : "Article Generated!"}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              <span className="font-medium text-gray-700">"{form.title}"</span> has been saved as a draft.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                View Drafts
              </button>
              <button onClick={handleCreateAnother}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────

function ConfirmDelete({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded-2xl bg-white shadow-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Delete Article</h2>
        <p className="text-sm text-gray-600">
          Delete <span className="font-semibold">"{title}"</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drafts tab ────────────────────────────────────────────────────────────────

function DraftsTab({ domain, onNewArticle }: { domain: string; onNewArticle: () => void }) {
  const [drafts, setDrafts] = useState<WDraft[]>(() => getDrafts(domain));
  const [deleteTarget, setDeleteTarget] = useState<WDraft | null>(null);

  // Keep in sync when modal creates a new draft
  const refreshDrafts = () => setDrafts(getDrafts(domain));

  function handleDelete(draft: WDraft) {
    const updated = drafts.filter((x) => x.id !== draft.id);
    setDrafts(updated);
    saveDrafts(domain, updated);
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{drafts.length} article{drafts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={onNewArticle}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">No articles yet.</p>
          <button
            onClick={onNewArticle}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create your first article
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-full">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">AI Score</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft, i) => (
                <tr key={draft.id}
                  className={`group transition-colors hover:bg-gray-50 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-900">{draft.title}</span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={draft.status} /></td>
                  <td className="px-4 py-3.5"><AiScore score={draft.aiScore} /></td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{timeAgo(draft.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDeleteTarget(draft)}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          title={deleteTarget.title}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ── Configuration tab ─────────────────────────────────────────────────────────

const BRAND_VOICES = [
  "Professional & Authoritative", "Friendly & Conversational", "Witty & Playful",
  "Educational & Informative", "Inspirational & Motivating", "Bold & Direct",
];

function ConfigurationTab({ domain }: { domain: string }) {
  const [config, setConfig] = useState<WBrandConfig>(() => getBrandConfig(domain));
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    saveBrandConfig(domain, config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setConfig((c) => ({ ...c, sampleBlogs: [...c.sampleBlogs, ...files.map((f) => ({ name: f.name }))] }));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Brand Configuration</h2>
        <p className="text-sm text-gray-500">Configure brand details to get better AI-generated content.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Brand Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand Name</label>
            <input value={config.brandName}
              onChange={(e) => setConfig((c) => ({ ...c, brandName: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Website URL</label>
            <input value={config.websiteUrl}
              onChange={(e) => setConfig((c) => ({ ...c, websiteUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Niche / Industry</label>
          <input value={config.niche}
            onChange={(e) => setConfig((c) => ({ ...c, niche: e.target.value }))}
            placeholder="e.g. Food & Beverage, SaaS, Fashion..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Audience</label>
          <input value={config.targetAudience}
            onChange={(e) => setConfig((c) => ({ ...c, targetAudience: e.target.value }))}
            placeholder="e.g. Health-conscious millennials, B2B SaaS buyers..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand Voice</label>
          <select value={config.brandVoice}
            onChange={(e) => setConfig((c) => ({ ...c, brandVoice: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700">
            <option value="">Select a brand voice...</option>
            {BRAND_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Sample Blog Posts</h3>
          <p className="text-xs text-gray-500 mt-0.5">Upload samples so the AI can match your writing style.</p>
        </div>
        {config.sampleBlogs.length > 0 && (
          <div className="space-y-2">
            {config.sampleBlogs.map((blog, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{blog.name}</span>
                <button onClick={() => setConfig((c) => ({ ...c, sampleBlogs: c.sampleBlogs.filter((_, idx) => idx !== i) }))}
                  className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-6 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
          <Upload className="h-5 w-5 text-gray-400" />
          <span>Click to upload .txt or .docx files</span>
          <span className="text-xs text-gray-400">Up to 10 files</span>
        </button>
        <input ref={fileRef} type="file" accept=".txt,.docx,.doc" multiple className="hidden" onChange={handleFileChange} />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "drafts" | "configuration";

export default function WriterateProject() {
  const { domain: rawDomain } = useParams<{ domain: string }>();
  const navigate = useNavigate();
  const domain = decodeURIComponent(rawDomain ?? "");
  const [tab, setTab] = useState<Tab>("drafts");
  const [newArticleOpen, setNewArticleOpen] = useState(false);
  const [, forceRefresh] = useState(0);

  const project = getHomeProject(domain);

  if (!project) {
    return (
      <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <FileText className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Project not found.</p>
          <button onClick={() => navigate("/writerate")}
            className="mt-4 text-sm text-gray-700 underline hover:text-gray-900">
            Back to Projects
          </button>
        </div>
      </AppLayout>
    );
  }

  const color = projectColor(domain);

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto">

        <button onClick={() => navigate("/writerate")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Projects
        </button>

        {/* Project header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: color }}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{domain}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {([
            { key: "drafts", label: "Drafts", icon: <FileText className="h-3.5 w-3.5" /> },
            { key: "configuration", label: "Configuration", icon: <Settings2 className="h-3.5 w-3.5" /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === "drafts" ? (
          <DraftsTab
            domain={domain}
            onNewArticle={() => setNewArticleOpen(true)}
          />
        ) : (
          <ConfigurationTab domain={domain} />
        )}
      </div>

      {newArticleOpen && (
        <NewArticleModal
          domain={domain}
          onClose={() => {
            setNewArticleOpen(false);
            forceRefresh((n) => n + 1); // re-render so DraftsTab picks up new draft
          }}
          onCreated={() => {}}
        />
      )}
    </AppLayout>
  );
}
