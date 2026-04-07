import AppLayout from "@/components/AppLayout";
import { LayoutDashboard, X, CalendarIcon, ChevronDown, Check, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { MetricInfo } from "@/components/MetricInfo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState, useRef, useEffect } from "react";
import { RequestsListDialog } from "@/components/RequestsPanel";
import { getProjectRequests, getRequestStatus, fmtNum, BacklinkRequest, RequestStatus } from "@/data/requests";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface TodoItem {
  id: number;
  text: string;
  trashed: boolean;
}

interface ProjectStats {
  given: { requested: number; accepted: number; rejected: number; onHold: number };
  taken: { requested: number; accepted: number; rejected: number; onHold: number };
}

interface StoredProject {
  name: string;
  domain: string;
}

function loadProjects(): StoredProject[] {
  const saved = localStorage.getItem("home-projects");
  return saved ? JSON.parse(saved) : [];
}

function loadTodos(domain: string): TodoItem[] {
  const saved = localStorage.getItem(`dashboard-todos-${domain}`);
  return saved ? JSON.parse(saved) : [];
}

function loadNextId(domain: string): number {
  return parseInt(localStorage.getItem(`dashboard-next-id-${domain}`) ?? "1");
}

function computeStats(domain: string): ProjectStats {
  const allReqs = getProjectRequests(domain);
  const incoming = allReqs.filter((r) => r.type === "incoming");
  const outgoing = allReqs.filter((r) => r.type === "outgoing");

  function tally(reqs: BacklinkRequest[]) {
    return {
      requested: reqs.length,
      accepted: reqs.filter((r) => getRequestStatus(r.id) === "Accepted").length,
      rejected: reqs.filter((r) => getRequestStatus(r.id) === "Rejected").length,
      onHold:   reqs.filter((r) => getRequestStatus(r.id) === "On Hold").length,
    };
  }

  return { given: tally(incoming), taken: tally(outgoing) };
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending:   "bg-amber-50 text-amber-600 border-amber-200",
  Accepted:  "bg-green-50 text-green-600 border-green-200",
  Rejected:  "bg-red-50 text-red-500 border-red-200",
  "On Hold": "bg-gray-100 text-gray-600 border-gray-200",
  Live:      "bg-blue-50 text-blue-600 border-blue-200",
};

// ── MiniRequestRow ────────────────────────────────────────────────────────────
function MiniRequestRow({ req }: { req: BacklinkRequest }) {
  const status = getRequestStatus(req.id);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {/* Favicon */}
      <div className="h-7 w-7 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        <img
          src={`https://www.google.com/s2/favicons?domain=${req.externalDomain}&sz=32`}
          alt={req.externalDomain}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      {/* Domain */}
      <a href={`https://${req.externalDomain}`} target="_blank" rel="noreferrer"
        className="w-36 shrink-0 text-sm font-medium text-foreground truncate hover:underline">
        {req.externalDomain}
      </a>
      {/* Request type */}
      <span className="w-28 shrink-0 rounded-full border bg-gray-100 text-gray-800 border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-center">
        {req.requestType}
      </span>
      {/* Metrics — fixed widths so columns align */}
      <div className="flex items-center gap-3 shrink-0">
        {[
          { l: "DA", v: req.da },
          { l: "DR", v: req.dr },
          { l: "TF", v: req.tf },
          { l: "Traffic", v: fmtNum(req.traffic) },
        ].map((m) => (
          <div key={m.l} className="w-12 text-center">
            <p className="text-[10px] text-muted-foreground">{m.l}</p>
            <p className="text-xs font-semibold text-foreground">{m.v}</p>
          </div>
        ))}
      </div>
      {/* Status */}
      <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status]}`}>
        {status}
      </span>
    </div>
  );
}

// ── MiniSectionHeader (column labels) ────────────────────────────────────────
function MiniSectionHeaders() {
  return (
    <div className="flex items-center gap-3 pb-1 mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
      <div className="w-7 shrink-0" />
      <div className="w-36 shrink-0">Website</div>
      <div className="w-28 shrink-0 text-center">Type</div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-12 flex items-center justify-center gap-0.5">DA<MetricInfo metric="DA" /></div>
        <div className="w-12 flex items-center justify-center gap-0.5">DR<MetricInfo metric="DR" /></div>
        <div className="w-12 flex items-center justify-center gap-0.5">TF<MetricInfo metric="TF" /></div>
        <div className="w-12 flex items-center justify-center gap-0.5">Traffic<MetricInfo metric="Traffic" /></div>
      </div>
      <div className="ml-auto shrink-0">Status</div>
    </div>
  );
}

function DragHandle() {
  return (
    <div className="grid grid-cols-2 gap-[3px] opacity-30 cursor-grab active:cursor-grabbing shrink-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[3px] w-[3px] rounded-full bg-foreground" />
      ))}
    </div>
  );
}

// ── Metric delta helpers ──────────────────────────────────────────────────────
function hashStr(s: string, seed: number = 0): number {
  let h = (seed * 2654435761) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761) >>> 0;
  }
  return h;
}

// Monthly base ranges [min, max] per metric
const MONTHLY_RANGES: Record<string, [number, number]> = {
  DA:      [-1,    3   ],
  DR:      [-1,    4   ],
  TF:      [-0.5,  2   ],
  Traffic: [-0.05, 0.15], // relative fraction
  Spam:    [-1,    1   ],
  Resp:    [-3,    6   ], // percentage points
};

function computeMetricDeltas(domain: string, timePeriod: string, dateRange?: DateRange) {
  let scale: number;
  if (timePeriod === "week") scale = 7 / 30;
  else if (timePeriod === "month") scale = 1;
  else if (timePeriod === "all") scale = 6;
  else if (timePeriod === "custom" && dateRange?.from && dateRange?.to) {
    const days = Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000));
    scale = days / 30;
  } else scale = 1;

  return Object.entries(MONTHLY_RANGES).map(([label, [min, max]]) => {
    const t = (hashStr(domain, label.charCodeAt(0)) % 1000) / 1000;
    const rawDelta = (min + (max - min) * t) * scale;
    const isTraffic = label === "Traffic";
    const value = isTraffic ? rawDelta * 100 : rawDelta; // convert traffic to %
    const decimals = label === "TF" || label === "Resp" || isTraffic ? 1 : 0;
    const rounded = parseFloat(value.toFixed(decimals));
    const display = (rounded > 0 ? "+" : "") + rounded + (isTraffic || label === "Resp" ? "%" : "");
    return { label, delta: rounded, display, inverted: label === "Spam" };
  });
}

function MetricDeltas({ domain, timePeriod, dateRange }: { domain: string; timePeriod: string; dateRange?: DateRange }) {
  const deltas = computeMetricDeltas(domain, timePeriod, dateRange);
  return (
    <div className="flex items-center gap-2 flex-wrap ml-2">
      {deltas.map(({ label, delta, display, inverted }) => {
        const neutral = Math.abs(delta) < 0.05;
        const green = neutral ? false : inverted ? delta < 0 : delta > 0;
        const cls = neutral
          ? "bg-gray-50 text-gray-400 border-gray-200"
          : green
          ? "bg-green-50 text-green-600 border-green-200"
          : "bg-red-50 text-red-500 border-red-200";
        return (
          <div key={label} className={`flex items-center gap-1 rounded-full border px-3 py-2 ${cls}`}>
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <span className="text-sm font-bold">{neutral ? "~0" : display}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const projects = loadProjects();
  const firstDomain = projects[0]?.domain ?? "";

  const [selectedDomain, setSelectedDomain] = useState<string>(() => {
    return localStorage.getItem("dashboard-selected-domain") ?? firstDomain;
  });

  const selectedProject = projects.find((p) => p.domain === selectedDomain) ?? projects[0];

  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos(selectedDomain));
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const nextId = useRef<number>(loadNextId(selectedDomain));

  const [timePeriod, setTimePeriod] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [requestsDialog, setRequestsDialog] = useState<{ type: "incoming" | "outgoing"; filterStatus?: RequestStatus } | null>(null);
  // refreshKey: increment when a dialog closes so auto-tasks recompute
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTodos(loadTodos(selectedDomain));
    nextId.current = loadNextId(selectedDomain);
    localStorage.setItem("dashboard-selected-domain", selectedDomain);
  }, [selectedDomain]);

  useEffect(() => {
    localStorage.setItem(`dashboard-todos-${selectedDomain}`, JSON.stringify(todos));
  }, [todos, selectedDomain]);

  const activeTodos = todos.filter((t) => !t.trashed);
  const trashedTodos = todos.filter((t) => t.trashed);

  function addTodo() {
    const id = nextId.current++;
    localStorage.setItem(`dashboard-next-id-${selectedDomain}`, String(nextId.current));
    setTodos((prev) => [...prev, { id, text: "", trashed: false }]);
    setFocusedId(id);
  }

  function updateTodo(id: number, text: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  }

  function trashTodo(id: number) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, trashed: true } : t)));
  }

  function restoreTodo(id: number) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, trashed: false } : t)));
  }

  function deletePermanently(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function handleDragStart(id: number) { setDragId(id); }

  function handleDragOver(e: React.DragEvent, overId: number) {
    e.preventDefault();
    if (dragId === null || dragId === overId) return;
    setTodos((prev) => {
      const items = [...prev];
      const fromIdx = items.findIndex((t) => t.id === dragId);
      const toIdx   = items.findIndex((t) => t.id === overId);
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return items;
    });
  }

  function handleDragEnd() { setDragId(null); }

  // Compute stats live from request data + localStorage statuses
  const stats: ProjectStats = computeStats(selectedDomain);

  // Per-project request rows (all, scrollable)
  const allProjectReqs = getProjectRequests(selectedDomain);
  const incomingSample = allProjectReqs.filter((r) => r.type === "incoming");
  const outgoingSample = allProjectReqs.filter((r) => r.type === "outgoing");

  return (
    <AppLayout title="Dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
      <div className="space-y-6">

        {/* Project selector */}
        <Popover open={projectOpen} onOpenChange={setProjectOpen}>
          <PopoverTrigger asChild>
            <button className="group w-full flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-card px-5 py-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${selectedProject?.domain ?? ""}&sz=64`}
                  alt={selectedProject?.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Currently Viewing</p>
                <p className="text-xl font-bold text-foreground leading-tight">{selectedProject?.name ?? "Select a project"}</p>
                {selectedProject && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedProject.domain}</p>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${projectOpen ? "rotate-180" : ""}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1.5" align="start">
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              projects.map((p) => (
                <button
                  key={p.domain}
                  onClick={() => { setSelectedDomain(p.domain); setFocusedId(null); setProjectOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=64`}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.domain}</p>
                  </div>
                  {p.domain === selectedDomain && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>

        {/* ── Tasks ── */}
        {(() => {
          // Auto-tasks: computed live from request data + localStorage statuses
          // refreshKey forces re-evaluation after dialog closes
          void refreshKey;
          const reqs = getProjectRequests(selectedDomain);
          const pendingIncomingCount = reqs.filter(
            (r) => r.type === "incoming" && getRequestStatus(r.id) === "Pending"
          ).length;
          const acceptedIncomingNotLiveCount = reqs.filter(
            (r) => r.type === "incoming" && getRequestStatus(r.id) === "Accepted"
          ).length;
          const acceptedOutgoingNotLiveCount = reqs.filter(
            (r) => r.type === "outgoing" && getRequestStatus(r.id) === "Accepted"
          ).length;

          const autoTasks: { id: string; text: string; sub: string; dialog: "incoming" | "outgoing"; filterStatus?: RequestStatus; color: string; icon: JSX.Element }[] = [];
          if (pendingIncomingCount > 0) {
            autoTasks.push({
              id: "pending-incoming",
              text: `${pendingIncomingCount} incoming request${pendingIncomingCount === 1 ? "" : "s"} pending your approval`,
              sub: "Review and respond to avoid hurting your responsiveness score.",
              dialog: "incoming",
              filterStatus: "Pending",
              color: "border-l-amber-400 bg-amber-50/50",
              icon: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />,
            });
          }
          if (acceptedIncomingNotLiveCount > 0) {
            autoTasks.push({
              id: "accepted-incoming-not-live",
              text: `${acceptedIncomingNotLiveCount} accepted request${acceptedIncomingNotLiveCount === 1 ? "" : "s"} — link not yet published`,
              sub: "You accepted these requests. Open each one and click 'Mark as Live' once you've published the link.",
              dialog: "incoming",
              filterStatus: "Accepted",
              color: "border-l-blue-400 bg-blue-50/50",
              icon: <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />,
            });
          }
          if (acceptedOutgoingNotLiveCount > 0) {
            autoTasks.push({
              id: "accepted-outgoing-not-live",
              text: `${acceptedOutgoingNotLiveCount} accepted outgoing backlink${acceptedOutgoingNotLiveCount === 1 ? "" : "s"} not yet marked as Live`,
              sub: "Open the request and click 'Mark as Live' once the publisher has published your link.",
              dialog: "outgoing",
              filterStatus: "Accepted",
              color: "border-l-green-400 bg-green-50/50",
              icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
            });
          }

          return (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Tasks</h3>
                  {selectedProject && (
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedProject.name}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowTrash(true)}
                  className="rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/80 transition-colors"
                >
                  Trash {trashedTodos.length > 0 && `(${trashedTodos.length})`}
                </button>
              </div>

              {/* Auto-generated tasks */}
              {autoTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Action Required</p>
                  {autoTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 rounded-lg border border-border border-l-4 ${task.color} px-4 py-3`}
                    >
                      <div className="mt-0.5">{task.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{task.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{task.sub}</p>
                      </div>
                      <button
                        onClick={() => setRequestsDialog({ type: task.dialog, filterStatus: task.filterStatus })}
                        className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white transition-colors"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {autoTasks.length === 0 && activeTodos.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">All caught up — no pending tasks.</p>
                </div>
              )}

              {/* Manual tasks */}
              {(autoTasks.length > 0 || activeTodos.length > 0) && activeTodos.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-1">My Tasks</p>
              )}
              <div className="space-y-2">
                {activeTodos.map((todo, i) => (
                  <div
                    key={todo.id}
                    draggable
                    onDragStart={() => handleDragStart(todo.id)}
                    onDragOver={(e) => handleDragOver(e, todo.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 cursor-text transition-opacity ${dragId === todo.id ? "opacity-40" : ""}`}
                    onClick={() => setFocusedId(todo.id)}
                  >
                    <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <DragHandle />
                    </div>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
                    {focusedId === todo.id ? (
                      <input
                        autoFocus
                        value={todo.text}
                        onChange={(e) => updateTodo(todo.id, e.target.value)}
                        onBlur={() => setFocusedId(null)}
                        className="flex-1 text-sm bg-transparent outline-none"
                        placeholder="Enter task..."
                      />
                    ) : (
                      <>
                        <span className="flex-1 text-sm">
                          {todo.text || <span className="text-muted-foreground">Enter task...</span>}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setFocusedId(todo.id); }} className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); trashTodo(todo.id); }} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors">Delete</button>
                      </>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTodo}
                  className="w-full flex items-center gap-1 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  + Add Task
                </button>
              </div>
            </div>
          );
        })()}

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {timePeriod !== "custom" && (
            <Select
              value={timePeriod}
              onValueChange={(v) => {
                setTimePeriod(v);
                if (v === "custom") setCalOpen(true);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          )}

          {timePeriod === "custom" && (
            <div className="flex items-center gap-1.5">
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Pick a date range"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.from && range?.to) setCalOpen(false);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <button
                onClick={() => { setTimePeriod("all"); setDateRange(undefined); }}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Clear custom date"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {selectedDomain && (
            <MetricDeltas domain={selectedDomain} timePeriod={timePeriod} dateRange={dateRange} />
          )}
        </div>

        {/* Stats + mini request sections */}
        <div className="grid grid-cols-2 gap-6">

          {/* Backlinks Given */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-5">Backlinks Given</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Requested", value: stats.given.requested, color: "text-blue-600",  bg: "bg-blue-50" },
                { label: "Accepted",  value: stats.given.accepted,  color: "text-green-600", bg: "bg-green-50" },
                { label: "Rejected",  value: stats.given.rejected,  color: "text-red-500",   bg: "bg-red-50" },
                { label: "On Hold",   value: stats.given.onHold,    color: "text-amber-500", bg: "bg-amber-50" },
              ] as const).map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-lg ${bg} px-4 py-3`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Incoming requests preview */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incoming Requests</p>
                <button
                  onClick={() => setRequestsDialog({ type: "incoming" })}
                  className="rounded-md border border-border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  View All
                </button>
              </div>
              {incomingSample.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No incoming requests for this project.</p>
              ) : (
                <>
                  <MiniSectionHeaders />
                  <div className="max-h-[260px] overflow-y-auto">
                    {incomingSample.map((r) => <MiniRequestRow key={r.id} req={r} />)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Backlinks Taken */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-5">Backlinks Taken</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Requested", value: stats.taken.requested, color: "text-blue-600",  bg: "bg-blue-50" },
                { label: "Accepted",  value: stats.taken.accepted,  color: "text-green-600", bg: "bg-green-50" },
                { label: "Rejected",  value: stats.taken.rejected,  color: "text-red-500",   bg: "bg-red-50" },
                { label: "On Hold",   value: stats.taken.onHold,    color: "text-amber-500", bg: "bg-amber-50" },
              ] as const).map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-lg ${bg} px-4 py-3`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Outgoing requests preview */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Outgoing Requests</p>
                <button
                  onClick={() => setRequestsDialog({ type: "outgoing" })}
                  className="rounded-md border border-border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  View All
                </button>
              </div>
              {outgoingSample.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No outgoing requests for this project.</p>
              ) : (
                <>
                  <MiniSectionHeaders />
                  <div className="max-h-[260px] overflow-y-auto">
                    {outgoingSample.map((r) => <MiniRequestRow key={r.id} req={r} />)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trash modal */}
        {showTrash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[500px] rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <span className="text-base font-semibold text-foreground">Trash</span>
                <button onClick={() => setShowTrash(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {trashedTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Trash is empty.</p>
                ) : (
                  trashedTodos.map((todo, i) => (
                    <div key={todo.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5">
                      <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
                      <span className="flex-1 text-sm text-muted-foreground">{todo.text || "Empty task"}</span>
                      <button onClick={() => restoreTodo(todo.id)} className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors">Restore</button>
                      <button onClick={() => deletePermanently(todo.id)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors">Delete Permanently</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {requestsDialog && (
        <RequestsListDialog
          type={requestsDialog.type}
          projectDomain={selectedDomain}
          projectName={selectedProject?.name}
          filterStatus={requestsDialog.filterStatus}
          open={!!requestsDialog}
          onClose={() => { setRequestsDialog(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </AppLayout>
  );
}
