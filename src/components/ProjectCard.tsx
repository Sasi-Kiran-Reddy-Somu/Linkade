import React, { useState, useEffect, useRef } from "react";
import { StickyNote, Globe, ScrollText, X, Plus, Settings, AlertTriangle, CheckCircle2, Copy, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricInfo } from "./MetricInfo";

interface ProjectCardProps {
  name: string;
  domain: string;
  image: string;
  da?: number;
  dr?: number;
  tf?: number;
  traffic?: number;
  spamScore?: number;
  ahrefsRefDomains?: number;
  ahrefsBacklinks?: number;
  exchangeEnabled: boolean;
  responsivenessScore?: number;
  hasNotes?: boolean;
  onNotesClick?: () => void;
  onRemove?: () => void;
  onEdit?: (name: string) => void;
}

function Metric({ label, value, colorClass }: { label: string; value?: number; colorClass?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 min-w-[72px]">
      <span className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
        {label}
        <MetricInfo metric={label === "Spam" ? "Spam" : label} />
      </span>
      <span className={`text-lg font-bold ${colorClass ?? "text-gray-800"}`}>{value ?? "—"}</span>
    </div>
  );
}

function MiniToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 mt-0.5 ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
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

function parseGuidelines(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

function generateToken() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  name: initialName,
  domain,
  da, dr, tf, traffic, spamScore, ahrefsRefDomains, ahrefsBacklinks,
  exchangeEnabled,
  responsivenessScore,
  hasNotes,
  onNotesClick,
  onRemove,
  onEdit,
}) => {
  const storageKey = `project-exchange-${domain}`;

  const saved = () => {
    const s = localStorage.getItem(storageKey);
    return s ? JSON.parse(s) : {};
  };

  const [displayName, setDisplayName] = useState(initialName);
  const [isExchangeEnabled, setIsExchangeEnabled] = useState(() => saved().isExchangeEnabled ?? exchangeEnabled);
  const [linkInsertionEnabled, setLinkInsertionEnabled] = useState(() => saved().linkInsertionEnabled ?? false);
  const [guestPostEnabled, setGuestPostEnabled] = useState(() => saved().guestPostEnabled ?? false);
  const [linkInsertionGuidelines, setLinkInsertionGuidelines] = useState<string[]>(() => parseGuidelines(saved().linkInsertionGuidelines));
  const [guestPostGuidelines, setGuestPostGuidelines] = useState<string[]>(() => parseGuidelines(saved().guestPostGuidelines));
  const [isVerified, setIsVerified] = useState(() => saved().isVerified ?? false);
  const [verificationToken] = useState(() => saved().verificationToken ?? generateToken());

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      isExchangeEnabled, linkInsertionEnabled, guestPostEnabled,
      linkInsertionGuidelines, guestPostGuidelines, isVerified, verificationToken,
    }));
  }, [isExchangeEnabled, linkInsertionEnabled, guestPostEnabled, linkInsertionGuidelines, guestPostGuidelines, isVerified]);

  // Exchange modal
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyLaterInfoOpen, setVerifyLaterInfoOpen] = useState(false);
  const [draftLinkInsertion, setDraftLinkInsertion] = useState(false);
  const [draftGuestPost, setDraftGuestPost] = useState(false);
  const [draftLinkInsertionGuidelines, setDraftLinkInsertionGuidelines] = useState<string[]>([]);
  const [draftGuestPostGuidelines, setDraftGuestPostGuidelines] = useState<string[]>([]);

  // Standalone guidelines modal
  const [guidelinesModal, setGuidelinesModal] = useState<"linkInsertion" | "guestPost" | null>(null);
  const [draftGuidelines, setDraftGuidelines] = useState<string[]>([]);

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<"dns" | "meta">("dns");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Settings dropdown
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const [faviconError, setFaviconError] = useState(false);
  const initials = displayName.slice(0, 2).toUpperCase();

  const hasLinkInsertionGuidelines = linkInsertionGuidelines.some((p) => p.trim());
  const hasGuestPostGuidelines = guestPostGuidelines.some((p) => p.trim());
  const showVerificationReminder = isExchangeEnabled && !isVerified;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openVerifyModal() {
    setVerifySuccess(false);
    setVerifyMethod("dns");
    setVerifyModalOpen(true);
  }

  function handleExchangeToggle() {
    if (!isExchangeEnabled) {
      setDraftLinkInsertion(linkInsertionEnabled);
      setDraftGuestPost(guestPostEnabled);
      setDraftLinkInsertionGuidelines([...linkInsertionGuidelines]);
      setDraftGuestPostGuidelines([...guestPostGuidelines]);
      setModalOpen(true);
    } else {
      setIsExchangeEnabled(false);
    }
  }

  function applyModalDraft() {
    setLinkInsertionEnabled(draftLinkInsertion);
    setGuestPostEnabled(draftGuestPost);
    setLinkInsertionGuidelines(draftLinkInsertionGuidelines.filter((p) => p.trim()));
    setGuestPostGuidelines(draftGuestPostGuidelines.filter((p) => p.trim()));
    setIsExchangeEnabled(draftLinkInsertion || draftGuestPost);
  }

  function handleVerifyLater() {
    applyModalDraft();
    setModalOpen(false);
    setVerifyLaterInfoOpen(true);
  }

  function handleVerifyNow() {
    applyModalDraft();
    setModalOpen(false);
    openVerifyModal();
  }

  function openGuidelinesModal(type: "linkInsertion" | "guestPost") {
    setDraftGuidelines([...(type === "linkInsertion" ? linkInsertionGuidelines : guestPostGuidelines)]);
    setGuidelinesModal(type);
  }

  function handleGuidelinesSave() {
    const filtered = draftGuidelines.filter((p) => p.trim());
    if (guidelinesModal === "linkInsertion") setLinkInsertionGuidelines(filtered);
    else if (guidelinesModal === "guestPost") setGuestPostGuidelines(filtered);
    setGuidelinesModal(null);
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 1500);
  }

  function handleEditSave() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    onEdit?.(trimmed);
    setEditModalOpen(false);
  }

  const metaTag = `<meta name="unpredictable-verify-ownership" content="${verificationToken}">`;
  const dnsValue = `unpredictable-${verificationToken}`;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 shrink-0 overflow-hidden mt-0.5">
              {faviconError ? (
                <span className="text-sm font-bold text-gray-700">{initials}</span>
              ) : (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setFaviconError(true)}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-base font-semibold text-gray-900 leading-tight">{displayName}</h3>

                {/* Verification reminder */}
                {showVerificationReminder && (
                  <button
                    onClick={openVerifyModal}
                    className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Verification Pending
                  </button>
                )}
              </div>

              {/* Domain */}
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
              >
                <Globe className="h-3 w-3" />
                {domain}
              </a>
            </div>
          </div>

          {/* Settings gear */}
          <div className="relative ml-3 shrink-0" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
                <button
                  onClick={() => { setSettingsOpen(false); setEditName(displayName); setEditModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit Project
                </button>
                {isExchangeEnabled && !isVerified && (
                  <button
                    onClick={() => { setSettingsOpen(false); openVerifyModal(); }}
                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    Verify Access
                  </button>
                )}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    if (window.confirm(`Remove "${name}"?\n\nIf you add this project again, you will need to re-verify ownership of ${domain}.`)) {
                      onRemove?.();
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-6" />

        {/* Body */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Metric label="DA" value={da} />
            <Metric label="DR" value={dr} colorClass={dr === undefined ? "text-gray-800" : dr >= 70 ? "text-green-600" : dr >= 40 ? "text-amber-500" : "text-red-500"} />
            <Metric label="TF" value={tf} />
            <Metric label="Traffic" value={traffic} />
            <Metric label="Spam" value={spamScore} colorClass={spamScore === undefined ? "text-gray-800" : spamScore <= 3 ? "text-green-600" : spamScore <= 7 ? "text-amber-500" : "text-red-500"} />
            {ahrefsRefDomains !== undefined && <Metric label="RefDomains" value={ahrefsRefDomains} />}
            {ahrefsBacklinks !== undefined && <Metric label="Backlinks" value={ahrefsBacklinks} />}
            {responsivenessScore !== undefined && (
              <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 min-w-[72px]">
                <span className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Resp.<MetricInfo metric="Resp" isOwn /></span>
                <span className={`text-lg font-bold ${responsivenessScore >= 75 ? "text-green-600" : responsivenessScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {responsivenessScore}%
                </span>
              </div>
            )}

            {isExchangeEnabled && (
              <>
                <div className="h-10 w-px bg-gray-100 shrink-0 mx-1" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap w-[172px]">Available for Link Insertion</span>
                    <MiniToggle checked={linkInsertionEnabled} onChange={() => setLinkInsertionEnabled((v) => !v)} />
                    {linkInsertionEnabled && (
                      <button
                        onClick={() => openGuidelinesModal("linkInsertion")}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors ${hasLinkInsertionGuidelines ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                      >
                        <ScrollText className="h-3 w-3" /> Guidelines
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap w-[172px]">Available for Guest Post</span>
                    <MiniToggle checked={guestPostEnabled} onChange={() => setGuestPostEnabled((v) => !v)} />
                    {guestPostEnabled && (
                      <button
                        onClick={() => openGuidelinesModal("guestPost")}
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border transition-colors ${hasGuestPostGuidelines ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                      >
                        <ScrollText className="h-3 w-3" /> Guidelines
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/60">
          <div className="flex items-center px-6 py-3 gap-4">
            <span className="text-xs text-gray-500 font-medium">Available for Exchange</span>
            <MiniToggle checked={isExchangeEnabled} onChange={handleExchangeToggle} />
            <div className="h-4 w-px bg-gray-200" />
            <button
              onClick={onNotesClick}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100 hover:text-gray-800 ${hasNotes ? "text-gray-800 font-semibold" : "text-gray-500"}`}
            >
              <StickyNote className={`h-3.5 w-3.5 ${hasNotes ? "text-yellow-500" : ""}`} />
              <span className={hasNotes ? "text-gray-800" : "text-gray-500"}>Notes</span>
              {hasNotes && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Exchange options modal ── */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) setModalOpen(false); }}>
        <DialogContent className="w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exchange Options — {displayName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-1">Choose what types of exchange you want to accept for this site.</p>
          <div className="space-y-3 mt-2">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for Link Insertion</p>
                  <p className="text-xs text-gray-400 mt-0.5">Accept requests to insert links into existing content</p>
                </div>
                <MiniToggle checked={draftLinkInsertion} onChange={() => setDraftLinkInsertion((v) => !v)} />
              </div>
              {draftLinkInsertion && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Guidelines (optional)</label>
                  <PointsInput points={draftLinkInsertionGuidelines} onChange={setDraftLinkInsertionGuidelines} hint="e.g. anchor text rules, link placement, niche restrictions, link type..." />
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for Guest Post</p>
                  <p className="text-xs text-gray-400 mt-0.5">Accept requests to publish guest articles on this site</p>
                </div>
                <MiniToggle checked={draftGuestPost} onChange={() => setDraftGuestPost((v) => !v)} />
              </div>
              {draftGuestPost && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Guidelines (optional)</label>
                  <PointsInput points={draftGuestPostGuidelines} onChange={setDraftGuestPostGuidelines} hint="e.g. minimum/maximum word count, AI score requirement, topic restrictions, original content only..." />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleVerifyLater} className="rounded-md border border-border px-5 py-2 text-sm hover:bg-muted transition-colors">
              Verify Later
            </button>
            <button onClick={handleVerifyNow} className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-black/80 transition-colors">
              Verify Now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Verification modal ── */}
      <Dialog open={verifyModalOpen} onOpenChange={(open) => { if (!open) setVerifyModalOpen(false); }}>
        <DialogContent className="w-[560px] max-h-[90vh] overflow-y-auto">
          {verifySuccess ? (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Verification Successful!</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Your ownership of <span className="font-medium">{domain}</span> has been confirmed. You're all set to start exchanging backlinks.
              </p>
              <button
                onClick={() => { setIsVerified(true); setVerifyModalOpen(false); }}
                className="mt-2 rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-black/80 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Verify Website</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600 leading-relaxed mt-1">
                Please select your preferred method to verify your website. You can either verify using a DNS record or by adding a meta tag to your website's HTML. Both methods are secure and ensure your ownership of the domain.
              </p>

              {/* Method selection */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                {(["dns", "meta"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setVerifyMethod(method)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      verifyMethod === method ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${verifyMethod === method ? "border-primary" : "border-gray-300"}`}>
                      {verifyMethod === method && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    {method === "dns" ? "Verify with DNS" : "Verify with Meta Tag"}
                  </button>
                ))}
              </div>

              {/* Copy instructions */}
              <div className="space-y-4 mt-4">
                {/* Meta tag */}
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    1. Add the following meta tag in the &lt;head&gt; section of your website's HTML:
                  </p>
                  <div className="relative rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10">
                    <code className="text-xs text-gray-700 break-all">{metaTag}</code>
                    <button
                      onClick={() => handleCopy(metaTag, "meta")}
                      className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedItem === "meta" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* DNS */}
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    2. Add a TXT record to your domain's DNS settings with the following details:
                  </p>
                  <div className="relative rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 space-y-1">
                    <p className="text-xs text-gray-700">Type: <span className="font-medium">TXT</span></p>
                    <p className="text-xs text-gray-700">Name: <span className="font-medium">@</span></p>
                    <p className="text-xs text-gray-700 break-all">Value: <span className="font-medium">{dnsValue}</span></p>
                    <button
                      onClick={() => handleCopy(`Type: TXT\nName: @\nValue: ${dnsValue}`, "dns")}
                      className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedItem === "dns" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setVerifyModalOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => setVerifySuccess(true)}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Guidelines modal ── */}
      <Dialog open={!!guidelinesModal} onOpenChange={(open) => { if (!open) setGuidelinesModal(null); }}>
        <DialogContent className="w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{guidelinesModal === "linkInsertion" ? "Link Insertion" : "Guest Post"} Guidelines — {displayName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-1">Add your requirements or rules. These will be visible to anyone who requests a link from your site.</p>
          <div className="mt-3">
            <PointsInput
              points={draftGuidelines}
              onChange={setDraftGuidelines}
              hint={guidelinesModal === "linkInsertion"
                ? "e.g. anchor text rules, link placement, niche restrictions, link type..."
                : "e.g. minimum/maximum word count, AI score requirement, topic restrictions, original content only..."}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setGuidelinesModal(null)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleGuidelinesSave} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors">Save & Close</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Verify Later Info Popup ── */}
      <Dialog open={verifyLaterInfoOpen} onOpenChange={setVerifyLaterInfoOpen}>
        <DialogContent className="w-[420px]">
          <button
            onClick={() => setVerifyLaterInfoOpen(false)}
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
                <span className="font-medium text-gray-700">{domain}</span> won't be visible in the exchange and won't be available to receive requests until ownership is verified.
              </p>
              <p className="text-xs text-gray-400 mt-1">You can verify anytime using the "Verification Pending" badge on this project card.</p>
            </div>
            <button
              onClick={() => setVerifyLaterInfoOpen(false)}
              className="mt-1 rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project modal ── */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) setEditModalOpen(false); }}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                value={domain}
                disabled
                className="w-full rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Domain cannot be changed after creation.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEditModalOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleEditSave} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors">Save</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectCard;
