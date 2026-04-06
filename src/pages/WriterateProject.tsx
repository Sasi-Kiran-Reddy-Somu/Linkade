import AppLayout from "@/components/AppLayout";
import {
  PenLine, ArrowLeft, Plus, Trash2, FileText, Settings2,
  CheckCircle2, Clock, Loader2, Sparkles, ChevronRight,
  Upload, X, ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  WProject, WDraft,
  getProjects, getDrafts, saveDrafts,
} from "./Writerate";

// ── Brand config helpers ──────────────────────────────────────────────────────

export interface WBrandConfig {
  brandName: string;
  websiteUrl: string;
  niche: string;
  brandVoice: string;
  targetAudience: string;
  sampleBlogs: { name: string; url?: string }[];
}

export function getBrandConfig(projectId: string): WBrandConfig {
  try {
    return JSON.parse(localStorage.getItem(`wr-brand-${projectId}`) ?? "null") ?? {
      brandName: "", websiteUrl: "", niche: "", brandVoice: "", targetAudience: "", sampleBlogs: [],
    };
  } catch {
    return { brandName: "", websiteUrl: "", niche: "", brandVoice: "", targetAudience: "", sampleBlogs: [] };
  }
}

function saveBrandConfig(projectId: string, config: WBrandConfig) {
  localStorage.setItem(`wr-brand-${projectId}`, JSON.stringify(config));
}

const PROJECT_COLORS = [
  "#ef4444", "#ec4899", "#3b82f6", "#22c55e",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316",
];

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

// ── Confirm delete modal ───────────────────────────────────────────────────────

function ConfirmDelete({
  title, onConfirm, onCancel,
}: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded-2xl bg-white shadow-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Delete Draft</h2>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-semibold">"{title}"</span>? This cannot be undone.
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

function DraftsTab({ project }: { project: WProject }) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<WDraft[]>(() => getDrafts(project.id));
  const [deleteTarget, setDeleteTarget] = useState<WDraft | null>(null);

  useEffect(() => { saveDrafts(project.id, drafts); }, [drafts, project.id]);

  function handleDelete(draft: WDraft) {
    setDrafts((d) => d.filter((x) => x.id !== draft.id));
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{drafts.length} article{drafts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => navigate(`/writerate/${project.id}/new-article`)}
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
            onClick={() => navigate(`/writerate/${project.id}/new-article`)}
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
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">Last Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft, i) => (
                <tr
                  key={draft.id}
                  className={`group transition-colors hover:bg-gray-50 cursor-pointer ${i > 0 ? "border-t border-gray-100" : ""}`}
                  onClick={() => navigate(`/writerate/${project.id}/draft/${draft.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                      {draft.title}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={draft.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <AiScore score={draft.aiScore} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {timeAgo(draft.updatedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/writerate/${project.id}/draft/${draft.id}`);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(draft); }}
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
  "Professional & Authoritative",
  "Friendly & Conversational",
  "Witty & Playful",
  "Educational & Informative",
  "Inspirational & Motivating",
  "Bold & Direct",
];

function ConfigurationTab({ project }: { project: WProject }) {
  const [config, setConfig] = useState<WBrandConfig>(() => getBrandConfig(project.id));
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    saveBrandConfig(project.id, config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newBlogs = files.map((f) => ({ name: f.name }));
    setConfig((c) => ({ ...c, sampleBlogs: [...c.sampleBlogs, ...newBlogs] }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeBlog(i: number) {
    setConfig((c) => ({ ...c, sampleBlogs: c.sampleBlogs.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Brand Configuration</h2>
        <p className="text-sm text-gray-500">Configure your brand details to get better AI-generated content.</p>
      </div>

      {/* Brand details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Brand Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand Name</label>
            <input
              value={config.brandName}
              onChange={(e) => setConfig((c) => ({ ...c, brandName: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Website URL</label>
            <input
              value={config.websiteUrl}
              onChange={(e) => setConfig((c) => ({ ...c, websiteUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Niche / Industry</label>
          <input
            value={config.niche}
            onChange={(e) => setConfig((c) => ({ ...c, niche: e.target.value }))}
            placeholder="e.g. Food & Beverage, SaaS, Fashion..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Audience</label>
          <input
            value={config.targetAudience}
            onChange={(e) => setConfig((c) => ({ ...c, targetAudience: e.target.value }))}
            placeholder="e.g. Health-conscious millennials, B2B SaaS buyers..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Brand Voice</label>
          <select
            value={config.brandVoice}
            onChange={(e) => setConfig((c) => ({ ...c, brandVoice: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-700 bg-white"
          >
            <option value="">Select a brand voice...</option>
            {BRAND_VOICES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sample blogs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Sample Blog Posts</h3>
          <p className="text-xs text-gray-500 mt-0.5">Upload sample blog posts so the AI can match your writing style.</p>
        </div>

        {config.sampleBlogs.length > 0 && (
          <div className="space-y-2">
            {config.sampleBlogs.map((blog, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{blog.name}</span>
                <button
                  onClick={() => removeBlog(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-6 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Upload className="h-5 w-5 text-gray-400" />
          <span>Click to upload .txt or .docx files</span>
          <span className="text-xs text-gray-400">Up to 10 files</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.docx,.doc"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "drafts" | "configuration";

export default function WriterateProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("drafts");

  const project = getProjects().find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <FileText className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Project not found.</p>
          <button
            onClick={() => navigate("/writerate")}
            className="mt-4 text-sm text-gray-700 underline hover:text-gray-900"
          >
            Back to Projects
          </button>
        </div>
      </AppLayout>
    );
  }

  const color = PROJECT_COLORS[project.colorIndex] ?? "#6b7280";

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate("/writerate")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Projects
        </button>

        {/* Project header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {getDrafts(project.id).length} draft{getDrafts(project.id).length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {([
            { key: "drafts", label: "Drafts", icon: <FileText className="h-3.5 w-3.5" /> },
            { key: "configuration", label: "Configuration", icon: <Settings2 className="h-3.5 w-3.5" /> },
          ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "drafts" ? (
          <DraftsTab project={project} />
        ) : (
          <ConfigurationTab project={project} />
        )}
      </div>
    </AppLayout>
  );
}
