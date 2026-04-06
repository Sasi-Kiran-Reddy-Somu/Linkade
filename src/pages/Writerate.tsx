import AppLayout from "@/components/AppLayout";
import { PenLine, Plus, Search, FileText, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Data helpers ──────────────────────────────────────────────────────────────

export interface WProject {
  id: string;
  name: string;
  colorIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface WDraft {
  id: string;
  projectId: string;
  title: string;
  status: "Completed" | "Draft" | "Generating";
  aiScore: number;
  updatedAt: string;
}

const PROJECT_COLORS = [
  "#ef4444", "#ec4899", "#3b82f6", "#22c55e",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316",
];

export function getProjects(): WProject[] {
  try { return JSON.parse(localStorage.getItem("wr-projects") ?? "[]"); } catch { return []; }
}
function saveProjects(p: WProject[]) {
  localStorage.setItem("wr-projects", JSON.stringify(p));
}
export function getDrafts(projectId: string): WDraft[] {
  try { return JSON.parse(localStorage.getItem(`wr-drafts-${projectId}`) ?? "[]"); } catch { return []; }
}
export function saveDrafts(projectId: string, drafts: WDraft[]) {
  localStorage.setItem(`wr-drafts-${projectId}`, JSON.stringify(drafts));
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_PROJECTS: WProject[] = [
  { id: "wp-1", name: "True Made Foods",    colorIndex: 0, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-06T07:00:00Z" },
  { id: "wp-2", name: "Masterpiece Cuisine", colorIndex: 1, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-02T10:00:00Z" },
  { id: "wp-3", name: "Manny & Olga's",     colorIndex: 3, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-02T10:00:00Z" },
  { id: "wp-4", name: "Harlowe",            colorIndex: 2, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-02T10:00:00Z" },
  { id: "wp-5", name: "More Labs",          colorIndex: 1, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-01T10:00:00Z" },
  { id: "wp-6", name: "GALYNA",             colorIndex: 3, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-01T10:00:00Z" },
];

const SEED_DRAFTS: Record<string, WDraft[]> = {
  "wp-1": [
    { id: "d-1a", projectId: "wp-1", title: "10 Ways to Use Hot Sauce in Your Morning Routine", status: "Completed", aiScore: 100, updatedAt: "2026-04-06T07:00:00Z" },
    { id: "d-1b", projectId: "wp-1", title: "The Health Benefits of Fermented Foods", status: "Completed", aiScore: 97, updatedAt: "2026-04-05T14:00:00Z" },
  ],
  "wp-2": [
    { id: "d-2a", projectId: "wp-2", title: "How to Choose the Right Catering Service for Your Corporate Event", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T10:00:00Z" },
    { id: "d-2b", projectId: "wp-2", title: "Pizza, Pools & Party Vibes: Your Backyard Bash Starter Pack", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T09:00:00Z" },
    { id: "d-2c", projectId: "wp-2", title: "Top 10 Catering Mistakes and How to Avoid Them", status: "Completed", aiScore: 100, updatedAt: "2026-04-01T12:00:00Z" },
  ],
  "wp-3": [
    { id: "d-3a", projectId: "wp-3", title: "How to Choose the Right Catering Service for Your Corporate Event", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T10:00:00Z" },
    { id: "d-3b", projectId: "wp-3", title: "Pizza, Pools & Party Vibes: Your Backyard Bash Starter Pack", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T09:00:00Z" },
    { id: "d-3c", projectId: "wp-3", title: "How to Keep Your Team Energized: The Best Food for Work Events", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T08:00:00Z" },
    { id: "d-3d", projectId: "wp-3", title: "How to Plan the Perfect Party in Wheaton with Pizza Catering", status: "Completed", aiScore: 100, updatedAt: "2026-04-02T07:00:00Z" },
    { id: "d-3e", projectId: "wp-3", title: "Top 10 Catering Mistakes and How to Avoid Them", status: "Completed", aiScore: 100, updatedAt: "2026-04-01T12:00:00Z" },
    { id: "d-3f", projectId: "wp-3", title: "Hosting a Movie Night? Top Tips for Pizza, Snacks, and Fun", status: "Completed", aiScore: 100, updatedAt: "2026-04-01T10:00:00Z" },
  ],
  "wp-6": [
    { id: "d-6a", projectId: "wp-6", title: "Best Beauty Routines for Busy Professionals", status: "Completed", aiScore: 95, updatedAt: "2026-04-01T10:00:00Z" },
    { id: "d-6b", projectId: "wp-6", title: "Natural Skincare Ingredients That Actually Work", status: "Completed", aiScore: 98, updatedAt: "2026-04-01T09:00:00Z" },
  ],
};

function ensureSeedData() {
  if (!localStorage.getItem("wr-seeded")) {
    saveProjects(SEED_PROJECTS);
    Object.entries(SEED_DRAFTS).forEach(([pid, drafts]) => saveDrafts(pid, drafts));
    localStorage.setItem("wr-seeded", "1");
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Writerate() {
  ensureSeedData();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WProject[]>(getProjects);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { saveProjects(projects); }, [projects]);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const proj: WProject = {
      id: crypto.randomUUID(),
      name: trimmed,
      colorIndex: projects.length % PROJECT_COLORS.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((p) => [...p, proj]);
    setNewOpen(false);
    setNewName("");
    navigate(`/writerate/${proj.id}`);
  }

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your client projects and content</p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const drafts = getDrafts(p.id);
              const activeDrafts = drafts.length;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/writerate/${p.id}`)}
                >
                  <div className="h-1" style={{ background: PROJECT_COLORS[p.colorIndex] }} />
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{p.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{activeDrafts} Active Draft{activeDrafts !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <span className="text-xs text-gray-400">Last updated {timeAgo(p.updatedAt)}</span>
                      <span className="text-xs font-semibold text-gray-700 hover:text-gray-900">View →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New project modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">New Project</h2>
              <button onClick={() => { setNewOpen(false); setNewName(""); }}
                className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Acme Corp Blog"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setNewOpen(false); setNewName(""); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
