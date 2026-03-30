import AppLayout from "@/components/AppLayout";
import { PenLine, Sparkles, Plus, X, Upload, Bold, Italic, List, ListOrdered, Undo2, Redo2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const HEADING_OPTIONS = ["Paragraph", "Heading 1", "Heading 2", "Heading 3"];

function RichTextToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [headingOpen, setHeadingOpen] = useState(false);
  const [headingLabel, setHeadingLabel] = useState("Paragraph");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setHeadingOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }

  function applyHeading(label: string) {
    setHeadingLabel(label);
    setHeadingOpen(false);
    editorRef.current?.focus();
    const tag = label === "Heading 1" ? "h1" : label === "Heading 2" ? "h2" : label === "Heading 3" ? "h3" : "p";
    document.execCommand("formatBlock", false, tag);
  }

  const btnCls = "h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-700";

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 flex-wrap">
      {/* Heading dropdown */}
      <div className="relative" ref={dropRef}>
        <button
          type="button"
          onClick={() => setHeadingOpen((o) => !o)}
          className="flex items-center gap-1 h-7 px-2 rounded hover:bg-gray-100 transition-colors text-xs font-medium text-gray-700"
        >
          {headingLabel}
          <ChevronDown className="h-3 w-3" />
        </button>
        {headingOpen && (
          <div className="absolute left-0 top-full mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
            {HEADING_OPTIONS.map((h) => (
              <button key={h} type="button" onClick={() => applyHeading(h)}
                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors ${headingLabel === h ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button type="button" title="Bold" onClick={() => exec("bold")} className={btnCls}>
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button type="button" title="Italic" onClick={() => exec("italic")} className={btnCls}>
        <Italic className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button type="button" title="Bullet list" onClick={() => exec("insertUnorderedList")} className={btnCls}>
        <List className="h-3.5 w-3.5" />
      </button>
      <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")} className={btnCls}>
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button type="button" title="Undo" onClick={() => exec("undo")} className={btnCls}>
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button type="button" title="Redo" onClick={() => exec("redo")} className={btnCls}>
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Writerate() {
  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState("1200");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([""]);
  const [refLinks, setRefLinks] = useState<string[]>([""]);
  const [generating, setGenerating] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddSecondary() {
    setSecondaryKeywords((prev) => [...prev, ""]);
  }
  function handleRemoveSecondary(i: number) {
    setSecondaryKeywords((prev) => prev.filter((_, idx) => idx !== i));
  }
  function handleSecondaryChange(i: number, val: string) {
    setSecondaryKeywords((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function handleAddRef() {
    setRefLinks((prev) => [...prev, ""]);
  }
  function handleRemoveRef(i: number) {
    setRefLinks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function handleRefChange(i: number, val: string) {
    setRefLinks((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function handleReset() {
    setTitle("");
    setWordCount("1200");
    setPrimaryKeyword("");
    setSecondaryKeywords([""]);
    setRefLinks([""]);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setGenerating(false);
  }

  function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2200);
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400";

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">AI Article Generator</h2>
            <p className="text-xs text-gray-500">Fill in the details below and generate a high-quality SEO article.</p>
          </div>
        </div>

        {/* Article Title */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-1.5">
          <label className="block text-sm font-semibold text-gray-800">
            Article Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "10 SEO Strategies to Boost Organic Traffic in 2025"'
            className={inputCls}
          />
        </div>

        {/* Outline */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-800">Outline</p>
              <p className="text-xs text-gray-500 mt-0.5">The Skeleton — describe the structure and key sections</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx" className="hidden" />
          </div>
          <RichTextToolbar editorRef={editorRef} />
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Start typing your outline here… Add headings, bullet points, and key sections."
            className="min-h-[180px] px-5 py-4 text-sm text-gray-800 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          />
        </div>

        {/* Target Word Count */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Target Word Count <span className="text-xs font-normal text-gray-400">(Optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={200}
              step={100}
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <span className="text-xs text-gray-500">words</span>
            <div className="flex items-center gap-2 ml-2">
              {[600, 1000, 1500, 2500].map((n) => (
                <button key={n} type="button" onClick={() => setWordCount(String(n))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${wordCount === String(n) ? "border-gray-900 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                  {n >= 1000 ? `${n / 1000}k` : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SEO Keywords */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-800">SEO Keywords</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Keyword</label>
            <input
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder='e.g. "backlink building strategies"'
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Secondary Keywords</label>
            <div className="space-y-2">
              {secondaryKeywords.map((kw, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={kw}
                    onChange={(e) => handleSecondaryChange(i, e.target.value)}
                    placeholder={`Secondary keyword ${i + 1}`}
                    className={`${inputCls} flex-1`}
                  />
                  {secondaryKeywords.length > 1 && (
                    <button type="button" onClick={() => handleRemoveSecondary(i)}
                      className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddSecondary}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add keyword
            </button>
          </div>
        </div>

        {/* Reference Links */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Reference Links</p>
          <p className="text-xs text-gray-500 -mt-1">URLs to reference or link within the article</p>
          <div className="space-y-2">
            {refLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={link}
                  onChange={(e) => handleRefChange(i, e.target.value)}
                  placeholder={`https://example.com/reference-${i + 1}`}
                  className={`${inputCls} flex-1`}
                />
                {refLinks.length > 1 && (
                  <button type="button" onClick={() => handleRemoveRef(i)}
                    className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddRef}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add reference link
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={handleReset}
            className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!title.trim() || generating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-black px-7 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            {generating ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Article &amp; Generate
              </>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
