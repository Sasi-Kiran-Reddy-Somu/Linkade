import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BacklinkRequest, RequestStatus, getRequestStatus, setRequestStatus,
  setRequestTAT, setRequestAcceptedAt, getAllRequests, getProjectRequests,
} from "@/data/requests";
import { ExternalLink, CheckCircle, Link2, FileText, Activity, Zap, Loader2, Search, SlidersHorizontal, ChevronDown, ArrowUp, ArrowDown, X, Download } from "lucide-react";
import { calcLinkCredits, addAccountCredits } from "@/lib/credits";
import { MetricInfo } from "./MetricInfo";

// Owner's overall account responsiveness (across all their domains) — derived from domain seed
function ownerOverallResponsiveness(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = (Math.imul(47, h) + domain.charCodeAt(i)) | 0;
  return 40 + (Math.abs(h) % 55);
}

// ── CSV export utilities ──────────────────────────────────────────────────────
export function computeFilteredRequests(
  type: "incoming" | "outgoing",
  projectDomain: string | undefined,
  sortKey: string | null | undefined,
  sortAsc: boolean | undefined,
  domainSearch: string | undefined,
  typeFilter: "All" | "Link Insertion" | "Guest Post" | undefined,
  localStatusFilter: RequestStatus | "All" | undefined,
  filterStatus: RequestStatus | RequestStatus[] | undefined,
  dateFrom?: string,
  dateTo?: string,
): BacklinkRequest[] {
  let requests: BacklinkRequest[];
  if (projectDomain) {
    requests = getProjectRequests(projectDomain).filter((r) => r.type === type);
  } else {
    const saved = localStorage.getItem("home-projects");
    const projects: { domain: string }[] = saved ? JSON.parse(saved) : [];
    requests = getAllRequests(type, projects.map((p) => p.domain));
  }
  let displayed: BacklinkRequest[];
  if (localStatusFilter && localStatusFilter !== "All") {
    displayed = requests.filter((r) => getRequestStatus(r.id) === localStatusFilter);
  } else if (filterStatus !== undefined) {
    const arr = Array.isArray(filterStatus) ? filterStatus : [filterStatus];
    displayed = requests.filter((r) => arr.includes(getRequestStatus(r.id)));
  } else {
    displayed = requests;
  }
  if (domainSearch) {
    displayed = displayed.filter((r) => r.externalDomain.toLowerCase().includes(domainSearch.toLowerCase()));
  }
  if (typeFilter && typeFilter !== "All") {
    displayed = displayed.filter((r) => r.requestType === typeFilter);
  }
  if (dateFrom) {
    displayed = displayed.filter((r) => r.createdAt >= dateFrom);
  }
  if (dateTo) {
    displayed = displayed.filter((r) => r.createdAt <= dateTo);
  }
  if (sortKey) {
    displayed = [...displayed].sort((a, b) => {
      if (sortKey === "externalDomain") {
        return sortAsc ? a.externalDomain.localeCompare(b.externalDomain) : b.externalDomain.localeCompare(a.externalDomain);
      }
      const aVal = (a as Record<string, number>)[sortKey] ?? 0;
      const bVal = (b as Record<string, number>)[sortKey] ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }
  return displayed;
}

function getExportHeaders(includeProjectColumn: boolean) {
  return [
    ...(includeProjectColumn ? ["Project"] : []),
    "External Domain", "Request Type", "Status",
    "DR", "DA", "TF", "Traffic", "RD", "Spam Score",
    "Categories", "Language", "Countries",
    "Source URL", "Anchor Text", "Target URL", "Title", "Description", "Created At",
  ];
}

function getExportRows(requests: BacklinkRequest[], includeProjectColumn: boolean) {
  return requests.map((r) => [
    ...(includeProjectColumn ? [r.projectDomain] : []),
    r.externalDomain, r.requestType, getRequestStatus(r.id),
    r.dr, r.da, r.tf, r.traffic, r.rd, r.spamScore,
    r.categories.join("; "), r.language, r.countries.join("; "),
    r.sourceUrl, r.anchorText ?? "", r.targetUrl ?? "", r.title ?? "",
    r.description, r.createdAt,
  ]);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRequestsCSV(
  requests: BacklinkRequest[],
  filename: string,
  includeProjectColumn = false,
) {
  const today = new Date().toISOString().slice(0, 10);
  const headers = getExportHeaders(includeProjectColumn);
  const rows = getExportRows(requests, includeProjectColumn);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}-${today}.csv`);
}

export function exportRequestsTSV(
  requests: BacklinkRequest[],
  filename: string,
  includeProjectColumn = false,
) {
  const today = new Date().toISOString().slice(0, 10);
  const headers = getExportHeaders(includeProjectColumn);
  const rows = getExportRows(requests, includeProjectColumn);
  const tsv = [headers, ...rows]
    .map((row) => row.map((v) => String(v).replace(/\t/g, " ")).join("\t"))
    .join("\n");
  triggerDownload(new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8;" }), `${filename}-${today}.tsv`);
}

export function exportRequestsJSON(
  requests: BacklinkRequest[],
  filename: string,
) {
  const today = new Date().toISOString().slice(0, 10);
  const data = requests.map((r) => ({
    externalDomain: r.externalDomain,
    requestType: r.requestType,
    status: getRequestStatus(r.id),
    dr: r.dr, da: r.da, tf: r.tf, traffic: r.traffic, rd: r.rd, spamScore: r.spamScore,
    categories: r.categories, language: r.language, countries: r.countries,
    sourceUrl: r.sourceUrl, anchorText: r.anchorText ?? "",
    targetUrl: r.targetUrl ?? "", title: r.title ?? "",
    description: r.description, createdAt: r.createdAt,
    ...(r.projectDomain ? { projectDomain: r.projectDomain } : {}),
  }));
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" }),
    `${filename}-${today}.json`,
  );
}

export function exportRequestsXLS(
  requests: BacklinkRequest[],
  filename: string,
  includeProjectColumn = false,
) {
  const today = new Date().toISOString().slice(0, 10);
  const headers = getExportHeaders(includeProjectColumn);
  const rows = getExportRows(requests, includeProjectColumn);
  const escape = (v: unknown) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tableRows = [headers, ...rows]
    .map((row) => `<tr>${row.map((v) => `<td>${escape(v)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><table>${tableRows}</table></body></html>`;
  triggerDownload(
    new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    `${filename}-${today}.xls`,
  );
}

function domainResponsiveness(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = (Math.imul(31, h) + domain.charCodeAt(i)) | 0;
  return 30 + (Math.abs(h) % 65);
}

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending:   "bg-amber-50 text-amber-600 border-amber-200",
  Accepted:  "bg-green-50 text-green-600 border-green-200",
  Rejected:  "bg-red-50 text-red-500 border-red-200",
  "On Hold": "bg-gray-100 text-gray-600 border-gray-200",
  Live:      "bg-blue-50 text-blue-600 border-blue-200",
};

// ── OverflowList ──────────────────────────────────────────────────────────────
function OverflowList({ items, max = 1, textSize = "text-sm", maxItemW = "max-w-[120px]" }: { items: string[]; max?: number; textSize?: string; maxItemW?: string }) {
  const visible = items.slice(0, max);
  const extra = items.slice(max);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((item) => (
        <span key={item} className={`${textSize} ${maxItemW} text-foreground truncate`}>{item}</span>
      ))}
      {extra.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200 transition-colors">
              +{extra.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px] leading-relaxed font-normal max-w-[240px] text-left">
            {items.join(", ")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── ShowDetailsDialog ─────────────────────────────────────────────────────────
function ShowDetailsDialog({
  request, open, onClose, status, onStatusChange,
}: {
  request: BacklinkRequest;
  open: boolean;
  onClose: () => void;
  status: RequestStatus;
  onStatusChange: (s: RequestStatus) => void;
}) {
  const isIncoming = request.type === "incoming";
  const isGuestPost = request.requestType === "Guest Post";
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [tatDays, setTatDays] = useState("7");
  const [liveState, setLiveState] = useState<"idle" | "verifying" | "verified">("idle");

  const creditsValue = calcLinkCredits(request.dr, request.da, request.traffic, request.tf, request.spamScore);

  function handleConfirmAccept() {
    const days = parseInt(tatDays, 10);
    if (!isNaN(days) && days > 0) {
      setRequestTAT(request.id, days);
      setRequestAcceptedAt(request.id, new Date().toISOString());
    }
    onStatusChange("Accepted");
    onClose();
  }

  function handleClose() {
    setConfirmAccept(false);
    setTatDays("7");
    setLiveState("idle");
    onClose();
  }

  function handleMarkLive() {
    setLiveState("verifying");
    setTimeout(() => {
      onStatusChange("Live");
      if (isIncoming) addAccountCredits(creditsValue);
      setLiveState("verified");
      setTimeout(() => handleClose(), 1400);
    }, 1000);
  }

  const resp = domainResponsiveness(request.externalDomain);
  const respColor = resp >= 75 ? "text-green-600" : resp >= 50 ? "text-amber-500" : "text-red-500";
  const respBg = resp >= 75 ? "bg-green-500" : resp >= 50 ? "bg-amber-400" : "bg-red-500";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[580px] max-h-[88vh] flex flex-col overflow-hidden p-0">

        {/* ── Site header ── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <DialogHeader className="mb-0">
            <DialogTitle className="sr-only">Request Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={`https://www.google.com/s2/favicons?domain=${request.externalDomain}&sz=32`}
                alt="" className="h-7 w-7 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`https://${request.externalDomain}`} target="_blank" rel="noreferrer"
                  className="text-base font-bold text-foreground hover:underline">
                  {request.externalDomain}
                </a>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>{status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1`}>
                  {isGuestPost ? <FileText className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                  {request.requestType}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">↔ Your project: <strong>{request.projectDomain}</strong></p>

              {/* Metrics row */}
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                {[
                  { label: "DR", value: request.dr, color: "" },
                  { label: "DA", value: request.da, color: "" },
                  { label: "TF", value: request.tf, color: "" },
                  { label: "Traffic", value: fmtNum(request.traffic), color: "" },
                  { label: "RD", value: fmtNum(request.rd), color: "" },
                  { label: "Spam", value: request.spamScore, color: request.spamScore <= 3 ? "text-green-600" : request.spamScore <= 7 ? "text-amber-500" : "text-red-500" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-0.5 rounded-md bg-muted/50 px-2 py-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                    <MetricInfo metric={m.label} />
                    <span className={`text-[11px] font-bold text-foreground ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Responsiveness bars */}
              {(() => {
                const overall = ownerOverallResponsiveness(request.externalDomain);
                const ovColor = overall >= 75 ? "text-green-600" : overall >= 50 ? "text-amber-500" : "text-red-500";
                const ovBg = overall >= 75 ? "bg-green-500" : overall >= 50 ? "bg-amber-400" : "bg-red-500";
                return (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (all projects)</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[100px]">
                        <div className={`h-full rounded-full ${ovBg}`} style={{ width: `${overall}%` }} />
                      </div>
                      <span className={`text-[11px] font-bold ${ovColor}`}>{overall}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (this domain)</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[100px]">
                        <div className={`h-full rounded-full ${respBg}`} style={{ width: `${resp}%` }} />
                      </div>
                      <span className={`text-[11px] font-bold ${respColor}`}>{resp}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4">

          {isGuestPost ? (
            <>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Article Title</p>
                <p className="text-sm font-semibold text-foreground leading-snug">{request.title || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {isIncoming ? "Publish On" : "Publisher Site"}
                </p>
                <a href={request.sourceUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                  {request.sourceUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {isIncoming ? "Source URL (Their page)" : "Source URL"}
                </p>
                <a href={request.sourceUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                  {request.sourceUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Anchor Text</p>
                <span className="inline-block text-sm font-medium text-foreground bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  "{request.anchorText || "—"}"
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Target URL</p>
                <a href={request.targetUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                  {request.targetUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </>
          )}

          {request.description && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes / Description</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">{request.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap pt-1">
            {request.categories.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{c}</span>
            ))}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{request.language}</span>
            {request.countries.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{c}</span>
            ))}
          </div>
        </div>

        {/* ── Sticky footer — all action states ── */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-background">

          {/* INCOMING: action buttons (only when Pending or On Hold) */}
          {isIncoming && !confirmAccept && (status === "Pending" || status === "On Hold") && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { onStatusChange("Rejected"); handleClose(); }}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >Reject</button>
              <button
                onClick={() => { onStatusChange("On Hold"); handleClose(); }}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >Put on Hold</button>
              <button
                onClick={() => setConfirmAccept(true)}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >Accept →</button>
            </div>
          )}

          {/* INCOMING: accept confirmation + TAT */}
          {isIncoming && confirmAccept && (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm font-semibold text-green-800">Confirm acceptance</p>
                <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                  By accepting, you agree to publish this backlink on <strong>{request.projectDomain}</strong>. Specify how many days it will take to go live.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  TAT — Days until the link goes live <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={tatDays}
                    onChange={(e) => setTatDays(e.target.value)}
                    className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">day{parseInt(tatDays) !== 1 ? "s" : ""}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Shown to the requester as your expected turnaround time.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmAccept(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >Back</button>
                <button
                  onClick={handleConfirmAccept}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> Confirm Accept
                </button>
              </div>
            </div>
          )}

          {/* INCOMING: accepted — prompt to mark link as live */}
          {isIncoming && !confirmAccept && status === "Accepted" && liveState === "idle" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Is this link live on your site?</p>
                  <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                    You accepted this request. Once published on <strong>{request.projectDomain}</strong>, mark it live so the requester is notified.
                  </p>
                </div>
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Zap className="h-3 w-3" /> +{creditsValue} credits
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={handleClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                  Not Yet
                </button>
                <button
                  onClick={handleMarkLive}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> Mark as Live
                </button>
              </div>
            </div>
          )}

          {/* INCOMING: mark-live animation states */}
          {isIncoming && !confirmAccept && status === "Accepted" && liveState === "verifying" && (
            <div className="flex items-center justify-center gap-3 py-3">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">Verifying link…</span>
            </div>
          )}
          {isIncoming && !confirmAccept && (status === "Accepted" || status === "Live") && liveState === "verified" && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-5 py-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Verified! Link is live.</p>
                  <p className="text-xs text-green-700 flex items-center gap-1 mt-0.5">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <strong>+{creditsValue} credits</strong> added to your account
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INCOMING: Live status — just close */}
          {isIncoming && !confirmAccept && status === "Live" && liveState === "idle" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Link is marked live
              </span>
              <button onClick={handleClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Close</button>
            </div>
          )}

          {/* INCOMING: Rejected status — just close */}
          {isIncoming && !confirmAccept && status === "Rejected" && (
            <div className="flex justify-end">
              <button onClick={handleClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Close</button>
            </div>
          )}

          {/* OUTGOING: read-only — Mark as Live if Accepted */}
          {!isIncoming && (
            <div className="flex justify-end gap-2">
              {status === "Accepted" && liveState === "idle" && (
                <button
                  onClick={handleMarkLive}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> Mark as Live
                </button>
              )}
              {status === "Accepted" && liveState === "verifying" && (
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                </div>
              )}
              {status === "Accepted" && liveState === "verified" && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold px-4 py-2">
                  <CheckCircle className="h-4 w-4" /> Verified! Link is live.
                </span>
              )}
              {(liveState === "idle" || status !== "Accepted") && (
                <button
                  onClick={handleClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                >Close</button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── MobileRequestCard (shown below md breakpoint) ─────────────────────────────
function MobileRequestCard({ req, status, onShow }: { req: BacklinkRequest; status: RequestStatus; onShow: () => void }) {
  const isIncoming = req.type === "incoming";
  const credits = calcLinkCredits(req.dr, req.da, req.traffic, req.tf, req.spamScore);
  const resp = domainResponsiveness(req.externalDomain);
  const respColor = resp >= 75 ? "text-green-600" : resp >= 50 ? "text-amber-500" : "text-red-500";
  const spamColor = req.spamScore <= 3 ? "text-green-600" : req.spamScore <= 7 ? "text-amber-500" : "text-red-500";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-3">
      {/* Top: favicon + domain */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
          <img src={`https://www.google.com/s2/favicons?domain=${req.externalDomain}&sz=32`} alt=""
            className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="min-w-0 flex-1">
          <a href={`https://${req.externalDomain}`} target="_blank" rel="noreferrer"
            className="text-sm font-semibold text-foreground hover:underline truncate block">{req.externalDomain}</a>
          <p className="text-[10px] text-muted-foreground truncate">↔ {req.projectDomain}</p>
          <p className={`text-[10px] font-medium ${respColor}`}>{resp}% responsiveness</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status]}`}>{status}</span>
          <span className={`flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isIncoming ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
            <Zap className="h-2.5 w-2.5" />{isIncoming ? `+${credits}` : credits}
          </span>
        </div>
      </div>
      {/* Type + categories row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${req.requestType === "Link Insertion" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {req.requestType}
        </span>
        {req.categories.slice(0, 2).map((c) => (
          <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 truncate max-w-[100px]">{c}</span>
        ))}
        {req.categories.length > 2 && <span className="text-[10px] text-muted-foreground">+{req.categories.length - 2}</span>}
        <span className="text-[10px] text-muted-foreground">{req.language}</span>
        {req.countries.slice(0, 1).map((c) => (
          <span key={c} className="text-[10px] text-muted-foreground truncate max-w-[80px]">{c}</span>
        ))}
      </div>
      {/* Metrics grid */}
      <div className="grid grid-cols-5 divide-x divide-gray-100 rounded-lg border border-gray-100 bg-gray-50 py-2">
        {[
          { label: "DR", value: req.dr, color: "" },
          { label: "DA", value: req.da, color: "" },
          { label: "TF", value: req.tf, color: "" },
          { label: "Traffic", value: fmtNum(req.traffic), color: "" },
          { label: "Spam", value: req.spamScore, color: spamColor },
        ].map((m) => (
          <div key={m.label} className="text-center px-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
            <p className={`text-xs font-semibold ${m.color || "text-foreground"}`}>{m.value}</p>
          </div>
        ))}
      </div>
      {/* Show button */}
      <button onClick={onShow} className="w-full rounded-lg border border-border py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
        Show Details
      </button>
    </div>
  );
}

// ── RequestRow ────────────────────────────────────────────────────────────────
function RequestRow({ req, status, onShow }: { req: BacklinkRequest; status: RequestStatus; onShow: () => void }) {
  const isIncoming = req.type === "incoming";
  const credits = calcLinkCredits(req.dr, req.da, req.traffic, req.tf, req.spamScore);
  const resp = domainResponsiveness(req.externalDomain);
  const respColor = resp >= 75 ? "text-green-600" : resp >= 50 ? "text-amber-500" : "text-red-500";

  const metrics = [
    { label: "DR",      value: req.dr,              cls: "w-12" },
    { label: "DA",      value: req.da,              cls: "w-12" },
    { label: "TF",      value: req.tf,              cls: "w-12" },
    { label: "Traffic", value: fmtNum(req.traffic), cls: "w-16" },
    { label: "Spam",    value: req.spamScore,        cls: "w-12",
      color: req.spamScore <= 3 ? "text-green-600" : req.spamScore <= 7 ? "text-amber-500" : "text-red-500" },
  ];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3.5 hover:shadow-sm transition-shadow">
      {/* Favicon + domain grouped tight */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
          <img src={`https://www.google.com/s2/favicons?domain=${req.externalDomain}&sz=32`} alt={req.externalDomain}
            className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="w-52 shrink-0 min-w-0 text-center">
          <a href={`https://${req.externalDomain}`} target="_blank" rel="noreferrer"
            className="text-sm font-semibold text-foreground truncate hover:underline block">
            {req.externalDomain}
          </a>
          <p className="text-xs text-muted-foreground truncate mt-0.5">↔ {req.projectDomain}</p>
          <p className={`text-[10px] font-medium mt-0.5 ${respColor}`}>{resp}% responsiveness</p>
        </div>
      </div>
      <div className="w-24 shrink-0 flex justify-center">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${req.requestType === "Link Insertion" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {req.requestType}
        </span>
      </div>
      <div className="w-28 shrink-0 flex justify-center">
        <OverflowList items={req.categories} textSize="text-[10px]" maxItemW="max-w-[90px]" />
      </div>
      <div className="w-14 shrink-0 text-center">
        <p className="text-[10px] text-foreground whitespace-nowrap">{req.language}</p>
      </div>
      <div className="w-24 shrink-0 flex justify-center">
        <OverflowList items={req.countries} textSize="text-[10px]" maxItemW="max-w-[90px]" />
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={`${m.cls} shrink-0 text-center`}>
          <p className={`text-sm font-semibold text-foreground ${m.color ?? ""}`}>{m.value}</p>
        </div>
      ))}
      <div className="w-28 shrink-0 flex justify-center">
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>{status}</span>
      </div>
      <div className="w-20 shrink-0 flex justify-center">
        <span className={`flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${isIncoming ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
          <Zap className="h-2.5 w-2.5" />
          {isIncoming ? `+${credits}` : credits}
        </span>
      </div>
      <button onClick={onShow} className="shrink-0 rounded-md border border-border px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Show</button>
    </div>
  );
}

// ── RequestsPanel ─────────────────────────────────────────────────────────────
interface RequestsPanelProps {
  type: "incoming" | "outgoing";
  projectDomain?: string;
  filterStatus?: RequestStatus | RequestStatus[];
  // Dialog sort/filter props
  sortKey?: string | null;
  sortAsc?: boolean;
  domainSearch?: string;
  typeFilter?: "All" | "Link Insertion" | "Guest Post";
  localStatusFilter?: RequestStatus | "All";
  dateFrom?: string;
  dateTo?: string;
}

export default function RequestsPanel({ type, projectDomain, filterStatus, sortKey, sortAsc, domainSearch, typeFilter, localStatusFilter, dateFrom, dateTo }: RequestsPanelProps) {
  // Load all projects if no projectDomain given, to show cross-project requests
  let requests: BacklinkRequest[];
  if (projectDomain) {
    requests = getProjectRequests(projectDomain).filter((r) => r.type === type);
  } else {
    const saved = localStorage.getItem("home-projects");
    const projects: { domain: string }[] = saved ? JSON.parse(saved) : [];
    const domains = projects.map((p) => p.domain);
    requests = getAllRequests(type, domains);
  }

  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>(() => {
    const out: Record<string, RequestStatus> = {};
    requests.forEach((r) => { out[r.id] = getRequestStatus(r.id); });
    return out;
  });

  const [showRequest, setShowRequest] = useState<BacklinkRequest | null>(null);

  function handleStatusChange(id: string, status: RequestStatus) {
    setRequestStatus(id, status);
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  // Apply status filter — localStatusFilter takes precedence over filterStatus
  let displayedRequests: BacklinkRequest[];
  if (localStatusFilter && localStatusFilter !== "All") {
    displayedRequests = requests.filter((r) => (statuses[r.id] ?? getRequestStatus(r.id)) === localStatusFilter);
  } else {
    const statusArray = filterStatus !== undefined
      ? (Array.isArray(filterStatus) ? filterStatus : [filterStatus])
      : null;
    displayedRequests = statusArray
      ? requests.filter((r) => statusArray.includes(statuses[r.id] ?? getRequestStatus(r.id)))
      : requests;
  }

  // Domain search
  if (domainSearch) {
    displayedRequests = displayedRequests.filter((r) => r.externalDomain.toLowerCase().includes(domainSearch.toLowerCase()));
  }

  // Type filter
  if (typeFilter && typeFilter !== "All") {
    displayedRequests = displayedRequests.filter((r) => r.requestType === typeFilter);
  }

  // Date range filter
  if (dateFrom) {
    displayedRequests = displayedRequests.filter((r) => r.createdAt >= dateFrom);
  }
  if (dateTo) {
    displayedRequests = displayedRequests.filter((r) => r.createdAt <= dateTo);
  }

  // Sort
  if (sortKey) {
    displayedRequests = [...displayedRequests].sort((a, b) => {
      if (sortKey === "externalDomain") {
        return sortAsc ? a.externalDomain.localeCompare(b.externalDomain) : b.externalDomain.localeCompare(a.externalDomain);
      }
      const aVal = (a as Record<string, number>)[sortKey] ?? 0;
      const bVal = (b as Record<string, number>)[sortKey] ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }

  return (
    <>
      {/* ── Mobile card view (hidden on md+) ── */}
      <div className="block md:hidden space-y-3">
        {displayedRequests.length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">No {type} requests found.</p>
        ) : (
          displayedRequests.map((req) => (
            <MobileRequestCard
              key={req.id}
              req={req}
              status={statuses[req.id] ?? getRequestStatus(req.id)}
              onShow={() => setShowRequest(req)}
            />
          ))
        )}
      </div>

      {/* ── Desktop table view (hidden below md) ── */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="w-max space-y-2.5">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-9 shrink-0" />
              <div className="w-52 shrink-0 text-center">Website</div>
            </div>
            <div className="w-24 shrink-0 text-center">Type</div>
            <div className="w-28 shrink-0 text-center">Category</div>
            <div className="w-14 shrink-0 text-center">Language</div>
            <div className="w-24 shrink-0 text-center">Country</div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">DR<MetricInfo metric="DR" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">DA<MetricInfo metric="DA" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">TF<MetricInfo metric="TF" /></div>
            <div className="w-16 shrink-0 flex items-center justify-center gap-0.5">Traffic<MetricInfo metric="Traffic" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">Spam<MetricInfo metric="Spam" /></div>
            <div className="w-28 shrink-0 text-center">Status</div>
            <div className="w-20 shrink-0 text-center">Credits</div>
            <div className="invisible pointer-events-none shrink-0">
              <button className="rounded-md border border-transparent px-4 py-1.5 text-xs font-medium">Show</button>
            </div>
          </div>

          {displayedRequests.length === 0 ? (
            <p className="text-center py-12 text-sm text-muted-foreground">No {type} requests found.</p>
          ) : (
            displayedRequests.map((req) => (
              <RequestRow
                key={req.id}
                req={req}
                status={statuses[req.id] ?? getRequestStatus(req.id)}
                onShow={() => setShowRequest(req)}
              />
            ))
          )}
        </div>
      </div>

      {showRequest && (
        <ShowDetailsDialog
          request={showRequest}
          open={!!showRequest}
          onClose={() => setShowRequest(null)}
          status={statuses[showRequest.id] ?? getRequestStatus(showRequest.id)}
          onStatusChange={(s) => handleStatusChange(showRequest.id, s)}
        />
      )}
    </>
  );
}

// ── Dialog sort options ───────────────────────────────────────────────────────
const DIALOG_SORT_OPTIONS = [
  { label: "Domain", key: "externalDomain" },
  { label: "Domain Rating (DR)", key: "dr" },
  { label: "Domain Authority (DA)", key: "da" },
  { label: "Trust Flow (TF)", key: "tf" },
  { label: "Traffic", key: "traffic" },
  { label: "Spam Score", key: "spamScore" },
];
const DIALOG_STATUS_OPTIONS: (RequestStatus | "All")[] = ["All", "Pending", "Accepted", "Rejected", "On Hold", "Live"];

// ── RequestsListDialog — sticky header with sort + filter, scrollable body ───
export function RequestsListDialog({
  type,
  projectDomain,
  projectName,
  filterStatus,
  open,
  onClose,
}: {
  type: "incoming" | "outgoing";
  projectDomain?: string;
  projectName?: string;
  filterStatus?: RequestStatus | RequestStatus[];
  open: boolean;
  onClose: () => void;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [domainSearch, setDomainSearch] = useState("");
  const [localStatus, setLocalStatus] = useState<RequestStatus | "All">(() => {
    if (!filterStatus) return "All";
    return Array.isArray(filterStatus) ? (filterStatus[0] ?? "All") : filterStatus;
  });
  const [typeFilter, setTypeFilter] = useState<"All" | "Link Insertion" | "Guest Post">("All");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const title = type === "incoming" ? "Incoming Requests" : "Outgoing Requests";
  const subtitle = projectDomain ? ` — ${projectDomain}` : " — All Projects";
  const activeSortLabel = DIALOG_SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[98vw] max-w-[1560px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border space-y-4">
          <DialogHeader>
            <DialogTitle>{title}{subtitle}</DialogTitle>
          </DialogHeader>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Domain search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Search domain…"
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                className="pl-8 pr-8 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary w-44"
              />
              {domainSearch && (
                <button onClick={() => setDomainSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {activeSortLabel ? `Sort: ${activeSortLabel}` : "Sort By"}
                <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
                  {DIALOG_SORT_OPTIONS.map((opt) => (
                    <div key={opt.key} className="flex items-center px-4 py-1.5 hover:bg-gray-50 transition-colors">
                      <span className="flex-1 text-sm text-gray-700">{opt.label}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => { setSortKey(opt.key); setSortAsc(true); setSortOpen(false); }}
                          title="Sort ascending"
                          className={`p-1 rounded transition-colors ${sortKey === opt.key && sortAsc ? "text-primary bg-primary/10" : "text-gray-300 hover:text-gray-600"}`}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { setSortKey(opt.key); setSortAsc(false); setSortOpen(false); }}
                          title="Sort descending"
                          className={`p-1 rounded transition-colors ${sortKey === opt.key && !sortAsc ? "text-primary bg-primary/10" : "text-gray-300 hover:text-gray-600"}`}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {sortKey && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setSortKey(null); setSortOpen(false); }}
                        className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                        Clear Sort
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {DIALOG_STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => setLocalStatus(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${localStatus === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              {(["All", "Link Insertion", "Guest Post"] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? t === "Link Insertion" ? "bg-black text-white border-black"
                        : t === "Guest Post" ? "bg-black text-white border-black"
                        : "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Export dropdown */}
            <div className="relative ml-auto shrink-0" ref={exportRef}>
              <button
                onClick={() => setExportOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className={`h-3 w-3 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
                  {([
                    { label: "CSV (.csv)", fmt: "csv" },
                    { label: "Excel (.xls)", fmt: "xls" },
                    { label: "TSV (.tsv)", fmt: "tsv" },
                    { label: "JSON (.json)", fmt: "json" },
                  ] as const).map(({ label, fmt }) => (
                    <button
                      key={fmt}
                      onClick={() => {
                        const filtered = computeFilteredRequests(type, projectDomain, sortKey, sortAsc, domainSearch, typeFilter, localStatus, filterStatus);
                        const slug = (projectName ?? projectDomain ?? "project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        const base = `${slug}-${type}-requests`;
                        if (fmt === "csv") exportRequestsCSV(filtered, base);
                        else if (fmt === "tsv") exportRequestsTSV(filtered, base);
                        else if (fmt === "json") exportRequestsJSON(filtered, base);
                        else exportRequestsXLS(filtered, base);
                        setExportOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <RequestsPanel
            type={type}
            projectDomain={projectDomain}
            sortKey={sortKey}
            sortAsc={sortAsc}
            domainSearch={domainSearch}
            typeFilter={typeFilter}
            localStatusFilter={localStatus}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
