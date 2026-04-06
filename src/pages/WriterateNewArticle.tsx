import AppLayout from "@/components/AppLayout";
import {
  PenLine, ArrowLeft, Sparkles, FileText, ChevronRight,
  Loader2, CheckCircle2, X, Plus, Minus,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjects, getDrafts, saveDrafts, WDraft } from "./Writerate";
import { getBrandConfig } from "./WriterateProject";

// ── Types ─────────────────────────────────────────────────────────────────────

type Flow = "choose" | "outline-form" | "article-form" | "generating" | "done";

interface ArticleForm {
  title: string;
  keywords: string;
  wordCount: string;
  tone: string;
  additionalInstructions: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const WORD_COUNTS = ["500–800", "800–1200", "1200–1800", "1800–2500", "2500+"];

const TONES = [
  "Professional", "Conversational", "Friendly", "Authoritative",
  "Educational", "Witty", "Inspirational", "Bold",
];

// ── Choose flow modal ─────────────────────────────────────────────────────────

function ChooseFlow({ onChoose }: { onChoose: (flow: "outline" | "article") => void }) {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Article</h1>
        <p className="text-sm text-gray-500">Choose how you'd like to start</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onChoose("outline")}
          className="group rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-gray-900 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1.5">Create Outline First</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Generate a structured outline, review and edit sections, then turn it into a full article.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
            Select <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </button>

        <button
          onClick={() => onChoose("article")}
          className="group rounded-2xl border-2 border-gray-200 bg-white p-6 text-left hover:border-gray-900 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1.5">Create Article Directly</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Skip the outline and generate a complete, ready-to-publish article in one shot.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
            Select <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Article form ──────────────────────────────────────────────────────────────

function ArticleFormView({
  form,
  setForm,
  onGenerate,
  isOutline,
  projectId,
}: {
  form: ArticleForm;
  setForm: React.Dispatch<React.SetStateAction<ArticleForm>>;
  onGenerate: () => void;
  isOutline: boolean;
  projectId: string;
}) {
  const brand = getBrandConfig(projectId);
  const hasBrand = brand.brandName || brand.niche;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {isOutline ? "Create Article Outline" : "Create Article"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isOutline
            ? "Fill in the details and we'll generate a structured outline for you to review."
            : "Fill in the details and we'll generate a complete article."}
        </p>
      </div>

      {hasBrand && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 mb-5 flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700">
            Using brand config from <span className="font-semibold">{brand.brandName || brand.niche}</span> —
            tone and style will be adapted automatically.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {/* Title / Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Article Title or Topic <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. 10 Ways to Use Hot Sauce in Your Morning Routine"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Keywords</label>
          <input
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder="e.g. hot sauce recipes, spicy breakfast ideas"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">Separate keywords with commas</p>
        </div>

        {/* Word count + tone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Word Count</label>
            <select
              value={form.wordCount}
              onChange={(e) => setForm((f) => ({ ...f, wordCount: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
            >
              <option value="">Select range...</option>
              {WORD_COUNTS.map((w) => <option key={w} value={w}>{w} words</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
            <select
              value={form.tone}
              onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
            >
              <option value="">Select tone...</option>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Additional instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Instructions</label>
          <textarea
            value={form.additionalInstructions}
            onChange={(e) => setForm((f) => ({ ...f, additionalInstructions: e.target.value }))}
            rows={3}
            placeholder="Any specific requirements, sections to include, references to cite..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400 resize-none"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={onGenerate}
            disabled={!form.title.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {isOutline ? "Generate Outline" : "Generate Article"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generating screen ─────────────────────────────────────────────────────────

function GeneratingScreen({ isOutline }: { isOutline: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {isOutline ? "Generating Outline..." : "Writing Your Article..."}
      </h2>
      <p className="text-sm text-gray-500 max-w-sm">
        {isOutline
          ? "Analyzing your topic and building a structured outline. This takes a few seconds."
          : "Crafting your article with SEO-optimized content. This usually takes 30–60 seconds."}
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Done screen ───────────────────────────────────────────────────────────────

function DoneScreen({
  title,
  isOutline,
  onViewDraft,
  onCreateAnother,
}: {
  title: string;
  isOutline: boolean;
  onViewDraft: () => void;
  onCreateAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        {isOutline ? "Outline Ready!" : "Article Generated!"}
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        <span className="font-medium text-gray-700">"{title}"</span> has been{" "}
        {isOutline ? "outlined and saved as a draft." : "written and saved as a draft."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onViewDraft}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          View Draft
        </button>
        <button
          onClick={onCreateAnother}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Create Another
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WriterateNewArticle() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [flow, setFlow] = useState<Flow>("choose");
  const [isOutline, setIsOutline] = useState(false);
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>({
    title: "",
    keywords: "",
    wordCount: "",
    tone: "",
    additionalInstructions: "",
  });

  const project = getProjects().find((p) => p.id === projectId);

  function handleChoose(choice: "outline" | "article") {
    setIsOutline(choice === "outline");
    setFlow(choice === "outline" ? "outline-form" : "article-form");
  }

  function handleGenerate() {
    setFlow("generating");
    const id = crypto.randomUUID();
    setCreatedDraftId(id);

    // Simulate generation delay
    setTimeout(() => {
      if (!projectId) return;
      const draft: WDraft = {
        id,
        projectId,
        title: form.title.trim(),
        status: "Draft",
        aiScore: Math.floor(Math.random() * 8) + 93, // 93–100
        updatedAt: new Date().toISOString(),
      };
      const existing = getDrafts(projectId);
      saveDrafts(projectId, [draft, ...existing]);
      setFlow("done");
    }, 2800);
  }

  function handleViewDraft() {
    if (projectId && createdDraftId) {
      navigate(`/writerate/${projectId}/draft/${createdDraftId}`);
    }
  }

  function handleCreateAnother() {
    setFlow("choose");
    setIsOutline(false);
    setCreatedDraftId(null);
    setForm({ title: "", keywords: "", wordCount: "", tone: "", additionalInstructions: "" });
  }

  const showBack = flow === "choose" || flow === "outline-form" || flow === "article-form";

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto">

        {showBack && (
          <button
            onClick={() => {
              if (flow === "choose") navigate(`/writerate/${projectId}`);
              else setFlow("choose");
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {flow === "choose"
              ? project?.name ?? "Project"
              : "Back"}
          </button>
        )}

        {flow === "choose" && <ChooseFlow onChoose={handleChoose} />}

        {(flow === "outline-form" || flow === "article-form") && (
          <ArticleFormView
            form={form}
            setForm={setForm}
            onGenerate={handleGenerate}
            isOutline={isOutline}
            projectId={projectId ?? ""}
          />
        )}

        {flow === "generating" && <GeneratingScreen isOutline={isOutline} />}

        {flow === "done" && (
          <DoneScreen
            title={form.title}
            isOutline={isOutline}
            onViewDraft={handleViewDraft}
            onCreateAnother={handleCreateAnother}
          />
        )}
      </div>
    </AppLayout>
  );
}
