import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Inbox, Send, Search, SlidersHorizontal, ChevronDown, ArrowUp, ArrowDown, X, Download, Clock } from "lucide-react";
import RequestsPanel, { computeFilteredRequests, exportRequestsCSV, exportRequestsTSV, exportRequestsJSON, exportRequestsXLS } from "@/components/RequestsPanel";
import { RequestStatus, getAllRequests, getRequestStatus, isTATExpired } from "@/data/requests";

type DatePreset = "all" | "today" | "7d" | "30d" | "custom";

interface RequestsPageProps {
  type: "incoming" | "outgoing";
}

const SORT_OPTIONS = [
  { label: "Domain", key: "externalDomain" },
  { label: "Domain Rating (DR)", key: "dr" },
  { label: "Domain Authority (DA)", key: "da" },
  { label: "Trust Flow (TF)", key: "tf" },
  { label: "Traffic", key: "traffic" },
  { label: "Spam Score", key: "spamScore" },
];

const STATUS_OPTIONS: (RequestStatus | "All")[] = ["All", "Pending", "Accepted", "Rejected", "On Hold", "Live"];

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d") {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (preset === "30d") {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (preset === "custom") return { from: customFrom, to: customTo };
  return { from: "", to: "" };
}

export default function RequestsPage({ type }: RequestsPageProps) {
  const title = type === "incoming" ? "All Incoming Requests" : "All Outgoing Requests";
  const icon = type === "incoming" ? <Inbox className="h-5 w-5" /> : <Send className="h-5 w-5" />;

  // Sort / filter state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [domainSearch, setDomainSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "Link Insertion" | "Guest Post">("All");

  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Dropdown open states
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // TAT banner
  const [tatDismissed, setTatDismissed] = useState(false);
  const tatExpiredRequests = type === "outgoing" ? (() => {
    const projects = JSON.parse(localStorage.getItem("home-projects") ?? "[]").map((p: { domain: string }) => p.domain);
    if (!projects.length) return [];
    return getAllRequests("outgoing", projects).filter((r) => {
      return getRequestStatus(r.id) === "Accepted" && isTATExpired(r.id, r.createdAt);
    });
  })() : [];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { from: dateFrom, to: dateTo } = getDateRange(datePreset, customFrom, customTo);

  const activeFilterCount = [
    sortKey !== null,
    statusFilter !== "All",
    typeFilter !== "All",
  ].filter(Boolean).length;

  function clearFilters() {
    setSortKey(null);
    setStatusFilter("All");
    setTypeFilter("All");
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  return (
    <AppLayout title={title} icon={icon}>
      {/* TAT expiry banner */}
      {type === "outgoing" && !tatDismissed && tatExpiredRequests.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-4 py-3.5">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              {tatExpiredRequests.length === 1 ? "Your link should be live by now" : `${tatExpiredRequests.length} links should be live by now`}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              {tatExpiredRequests.length === 1
                ? <>{`The publisher's turnaround time on `}<strong>{tatExpiredRequests[0].externalDomain}</strong>{` has passed. Check if the link is live and mark it accordingly.`}</>
                : <>{`Turnaround deadline passed for `}{tatExpiredRequests.map((r) => r.externalDomain).join(", ")}{`. Open each request to check and mark live.`}</>}
            </p>
          </div>
          <button onClick={() => setTatDismissed(true)} className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Controls row ── */}
      <div className="flex items-center gap-3 flex-wrap mb-4">

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
            <button onClick={() => setDomainSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
            {sortKey ? `Sort: ${SORT_OPTIONS.find((o) => o.key === sortKey)?.label}` : "Sort By"}
            <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
              {SORT_OPTIONS.map((opt) => (
                <div key={opt.key} className="flex items-center px-4 py-1.5 hover:bg-gray-50 transition-colors">
                  <span className="flex-1 text-sm text-gray-700">{opt.label}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => { setSortKey(opt.key); setSortAsc(true); setSortOpen(false); }}
                      title="Ascending"
                      className={`p-1 rounded transition-colors ${sortKey === opt.key && sortAsc ? "text-primary bg-primary/10" : "text-gray-300 hover:text-gray-600"}`}
                    ><ArrowUp className="h-3 w-3" /></button>
                    <button
                      onClick={() => { setSortKey(opt.key); setSortAsc(false); setSortOpen(false); }}
                      title="Descending"
                      className={`p-1 rounded transition-colors ${sortKey === opt.key && !sortAsc ? "text-primary bg-primary/10" : "text-gray-300 hover:text-gray-600"}`}
                    ><ArrowDown className="h-3 w-3" /></button>
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

        {/* Filter dropdown (status + type only) */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              activeFilterCount > 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-xl z-50 p-4 space-y-4">
              {/* Status */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <div className="flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        statusFilter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              {/* Type */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Request type</p>
                <div className="flex gap-1">
                  {(["All", "Link Insertion", "Guest Post"] as const).map((t) => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        typeFilter === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date preset pills */}
        <div className="flex items-center gap-1">
          {([
            { key: "all",    label: "All time" },
            { key: "today",  label: "Today" },
            { key: "7d",     label: "7d" },
            { key: "30d",    label: "30d" },
            { key: "custom", label: "Custom" },
          ] as { key: DatePreset; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDatePreset(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                datePreset === opt.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >{opt.label}</button>
          ))}
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
            <span className="text-xs text-muted-foreground">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}

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
                    const filtered = computeFilteredRequests(
                      type, undefined, sortKey, sortAsc, domainSearch, typeFilter, statusFilter, undefined,
                      dateFrom || undefined, dateTo || undefined,
                    );
                    const base = `all-${type}-requests`;
                    if (fmt === "csv") exportRequestsCSV(filtered, base, true);
                    else if (fmt === "tsv") exportRequestsTSV(filtered, base, true);
                    else if (fmt === "json") exportRequestsJSON(filtered, base);
                    else exportRequestsXLS(filtered, base, true);
                    setExportOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <RequestsPanel
        type={type}
        sortKey={sortKey}
        sortAsc={sortAsc}
        domainSearch={domainSearch}
        typeFilter={typeFilter}
        localStatusFilter={statusFilter}
        dateFrom={dateFrom || undefined}
        dateTo={dateTo || undefined}
      />
    </AppLayout>
  );
}
