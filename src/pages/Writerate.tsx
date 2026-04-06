import AppLayout from "@/components/AppLayout";
import { PenLine, Search, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomeProject {
  name: string;
  domain: string;
  [key: string]: unknown;
}

// ── Draft helpers (shared with WriterateProject) ───────────────────────────────

export interface WDraft {
  id: string;
  domain: string;
  title: string;
  status: "Completed" | "Draft" | "Generating";
  aiScore: number;
  updatedAt: string;
}

export function getDrafts(domain: string): WDraft[] {
  try { return JSON.parse(localStorage.getItem(`wr-drafts-${domain}`) ?? "[]"); } catch { return []; }
}
export function saveDrafts(domain: string, drafts: WDraft[]) {
  localStorage.setItem(`wr-drafts-${domain}`, JSON.stringify(drafts));
}

// ── Project color (derived from domain) ───────────────────────────────────────

const PROJECT_COLORS = [
  "#ef4444", "#ec4899", "#3b82f6", "#22c55e",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316",
];

export function projectColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getHomeProjects(): HomeProject[] {
  try { return JSON.parse(localStorage.getItem("home-projects") ?? "[]"); } catch { return []; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Writerate() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const projects = getHomeProjects();
  const filtered = projects.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Writerate" icon={<PenLine className="h-5 w-5" />}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage AI-written content for your projects</p>
          </div>
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-1">No projects yet.</p>
            <p className="text-xs text-gray-400">
              Add a project in{" "}
              <button
                onClick={() => navigate("/app")}
                className="underline hover:text-gray-700 transition-colors"
              >
                My Projects
              </button>{" "}
              to get started.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const drafts = getDrafts(p.domain);
              const color = projectColor(p.domain);
              const lastDraft = drafts[0];
              return (
                <div
                  key={p.domain}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/writerate/${encodeURIComponent(p.domain)}`)}
                >
                  <div className="h-1" style={{ background: color }} />
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-base mb-0.5">{p.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{p.domain}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{drafts.length} Article{drafts.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-400">
                        {lastDraft ? `Updated ${timeAgo(lastDraft.updatedAt)}` : "No articles yet"}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 hover:text-gray-900">View →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
