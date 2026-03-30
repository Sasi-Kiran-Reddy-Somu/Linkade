import AppLayout from "@/components/AppLayout";
import { Briefcase, Search, Activity, X } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const RESP_BANNER_KEY = "resp-score-banner-seen";

interface Project {
  name: string;
  domain: string;
  exchangeEnabled: boolean;
  exchangeStatus: string;
  responsivenessScore?: number;
  da: number;
  dr: number;
  tf: number;
  traffic: number;
  spamScore: number;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMetrics() {
  return { da: randInt(10, 75), dr: randInt(5, 80), tf: randInt(5, 70), traffic: randInt(500, 85000), spamScore: randInt(1, 20), responsivenessScore: randInt(40, 98) };
}

const INITIAL_PROJECTS: Project[] = [
  { name: "Cube", domain: "cubehq.ai", exchangeEnabled: true, exchangeStatus: "Pending", responsivenessScore: 92, da: 42, dr: 51, tf: 38, traffic: 12400, spamScore: 3 },
  { name: "JustWhatWorks", domain: "justwhatworks.com", exchangeEnabled: false, exchangeStatus: "Exchange Off", responsivenessScore: 61, da: 27, dr: 33, tf: 21, traffic: 4800, spamScore: 7 },
];

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("home-projects");
    const parsed: Project[] = saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    // Backfill any projects missing dr, spamScore, or responsivenessScore
    return parsed.map((p) => ({
      ...p,
      dr: p.dr ?? randInt(5, 80),
      spamScore: p.spamScore ?? randInt(1, 20),
      responsivenessScore: p.responsivenessScore ?? randInt(40, 98),
    }));
  });

  useEffect(() => {
    localStorage.setItem("home-projects", JSON.stringify(projects));
  }, [projects]);

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("project-notes");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeProject, setActiveProject] = useState<{ name: string; domain: string } | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const [search, setSearch] = useState("");
  const [respBannerVisible, setRespBannerVisible] = useState(
    () => !localStorage.getItem(RESP_BANNER_KEY) && projects.some((p) => p.responsivenessScore !== undefined)
  );

  function dismissRespBanner() {
    localStorage.setItem(RESP_BANNER_KEY, "1");
    setRespBannerVisible(false);
  }

  // Add project modal state
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newExchange, setNewExchange] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({});

  function openNotes(name: string, domain: string) {
    setDraftNote(notes[domain] ?? "");
    setActiveProject({ name, domain });
  }

  function handleSaveNote() {
    if (!activeProject) return;
    const updated = { ...notes, [activeProject.domain]: draftNote };
    setNotes(updated);
    localStorage.setItem("project-notes", JSON.stringify(updated));
    setActiveProject(null);
  }

  function handleRemoveProject(domain: string) {
    setProjects((prev) => prev.filter((p) => p.domain !== domain));
    localStorage.removeItem(`project-exchange-${domain}`);
  }

  function handleEditProject(domain: string, name: string) {
    setProjects((prev) => prev.map((p) => p.domain === domain ? { ...p, name } : p));
  }

  function openAddModal() {
    setNewName("");
    setNewDomain("");
    setNewExchange(false);
    setErrors({});
    setAddOpen(true);
  }

  function handleAddProject() {
    const e: { name?: string; domain?: string } = {};
    if (!newName.trim()) e.name = "Project name is required.";
    if (!newDomain.trim()) e.domain = "Domain is required.";
    if (Object.keys(e).length) { setErrors(e); return; }

    setProjects((prev) => [
      ...prev,
      {
        name: newName.trim(),
        domain: newDomain.trim().replace(/^https?:\/\//, ""),
        exchangeEnabled: newExchange,
        exchangeStatus: newExchange ? "Pending" : "Exchange Off",
        ...randomMetrics(),
      },
    ]);
    setAddOpen(false);
  }

  return (
    <AppLayout title="My Projects" icon={<Briefcase className="h-5 w-5" />}>
      <div className="space-y-6">

        {/* Responsiveness score education banner */}
        {respBannerVisible && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 px-4 py-3.5">
            <Activity className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">What is the Responsiveness score?</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                It reflects how quickly you respond to incoming backlink requests. A higher score makes your site more visible in the exchange — sites with scores above 75% appear at the top of searches.
                <strong> Respond to requests within 48 hours to keep your score healthy.</strong>
              </p>
            </div>
            <button
              onClick={dismissRespBanner}
              className="shrink-0 text-blue-400 hover:text-blue-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-72 rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="rounded-md bg-primary px-4 py-2 text-white text-sm flex items-center gap-1"
          >
            <span className="text-lg leading-none">+</span> Add Project
          </button>
        </div>

        {projects.filter((p) => {
          const q = search.toLowerCase();
          return !q || p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
        }).map((p) => (
          <ProjectCard
            key={p.domain}
            name={p.name}
            domain={p.domain}
            image=""
            da={p.da}
            dr={p.dr}
            tf={p.tf}
            traffic={p.traffic}
            spamScore={p.spamScore}
            exchangeEnabled={p.exchangeEnabled}
            responsivenessScore={p.responsivenessScore}
            hasNotes={!!notes[p.domain]}
            onNotesClick={() => openNotes(p.name, p.domain)}
            onRemove={() => handleRemoveProject(p.domain)}
            onEdit={(name) => handleEditProject(p.domain, name)}
          />
        ))}
      </div>

      {/* Add Project Modal */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) setAddOpen(false); }}>
        <DialogContent className="w-[460px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }}
                placeholder="e.g. My Blog"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                value={newDomain}
                onChange={(e) => { setNewDomain(e.target.value); setErrors((v) => ({ ...v, domain: undefined })); }}
                placeholder="e.g. myblog.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.domain && <p className="mt-1 text-xs text-red-500">{errors.domain}</p>}
            </div>

            {/* Exchange toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Available for Exchange</p>
                <p className="text-xs text-gray-400 mt-0.5">Allow others to request backlinks from this site</p>
              </div>
              <button
                role="switch"
                aria-checked={newExchange}
                onClick={() => setNewExchange((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                  newExchange ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
                    newExchange ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setAddOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProject}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Add Project
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={!!activeProject} onOpenChange={(open) => { if (!open) setActiveProject(null); }}>
        <DialogContent className="w-[500px]">
          <DialogHeader>
            <DialogTitle>Notes — {activeProject?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Write your notes about this project..."
            className="min-h-40 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setActiveProject(null)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors"
            >
              Save & Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
