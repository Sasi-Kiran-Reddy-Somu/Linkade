import AppLayout from "@/components/AppLayout";
import { User, Mail, Globe, Calendar, Edit2, Camera, ArrowLeftRight, Link2, FileText, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { getAllRequests, getRequestStatus } from "@/data/requests";
import { getAccountCredits } from "@/lib/credits";

const MOCK_PROFILE = {
  name: "John Doe",
  email: "john@example.com",
  username: "johndoe",
  bio: "SEO specialist and digital marketing enthusiast. Building backlinks the right way.",
  website: "https://johndoe.com",
  location: "San Francisco, CA",
  joinedDate: "January 2025",
  avatar: null as string | null,
};


const ACTIVITY = [
  { icon: <Link2 className="h-3.5 w-3.5 text-gray-700" />, text: "Sent a Link Insertion request to ahrefs.com", time: "2h ago", color: "bg-gray-100" },
  { icon: <Check className="h-3.5 w-3.5 text-green-500" />, text: "Accepted a Guest Post request from moz.com", time: "5h ago", color: "bg-green-50" },
  { icon: <FileText className="h-3.5 w-3.5 text-blue-500" />, text: "Sent a Guest Post request to backlinko.com", time: "1d ago", color: "bg-blue-50" },
  { icon: <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500" />, text: "Marked link on hubspot.com as Live", time: "2d ago", color: "bg-amber-50" },
  { icon: <Link2 className="h-3.5 w-3.5 text-gray-700" />, text: "Accepted a Link Insertion from neilpatel.com", time: "3d ago", color: "bg-gray-100" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [draft, setDraft] = useState(MOCK_PROFILE);

  const stats = useMemo(() => {
    const saved = localStorage.getItem("home-projects");
    const projects: { domain: string }[] = saved ? JSON.parse(saved) : [];
    const projectDomains = projects.map((p) => p.domain);
    const outgoing = getAllRequests("outgoing", projectDomains);
    const incoming = getAllRequests("incoming", projectDomains);
    const liveCount = [...outgoing, ...incoming].filter((r) => getRequestStatus(r.id) === "Live").length;
    // Responsiveness: % of incoming requests responded to (not still Pending)
    const responded = incoming.filter((r) => getRequestStatus(r.id) !== "Pending").length;
    const responsiveness = incoming.length > 0 ? Math.round((responded / incoming.length) * 100) : 0;
    return [
      { label: "Projects", value: String(projects.length) },
      { label: "Requests Sent", value: String(outgoing.length) },
      { label: "Requests Received", value: String(incoming.length) },
      { label: "Links Live", value: String(liveCount) },
      { label: "Responsiveness", value: `${responsiveness}%` },
      { label: "Credits", value: String(getAccountCredits()) },
    ];
  }, []);

  function handleSave() {
    setProfile(draft);
    setEditing(false);
  }

  return (
    <AppLayout title="My Profile" icon={<User className="h-5 w-5" />}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile header card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

          <div className="px-6 pb-6">
            {/* Avatar + Edit button row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl border-4 border-card bg-muted flex items-center justify-center shadow-md">
                  {profile.avatar
                    ? <img src={profile.avatar} alt={profile.name} className="h-full w-full rounded-xl object-cover" />
                    : <User className="h-8 w-8 text-muted-foreground" />
                  }
                </div>
                <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Camera className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={() => { setDraft(profile); setEditing((v) => !v); }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                    <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Username</label>
                    <input value={draft.username} onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                  <textarea value={draft.bio} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Website</label>
                    <input value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                    <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors">
                    Save Changes
                  </button>
                  <button onClick={() => setEditing(false)} className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-muted transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                {profile.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{profile.bio}</p>}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="h-3.5 w-3.5" />{profile.website.replace("https://", "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />{profile.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />Joined {profile.joinedDate}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">

          {/* Stats grid */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Account Stats</h3>
              <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/40 px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
              {[
                { label: "Email", value: profile.email, icon: <Mail className="h-4 w-4 text-muted-foreground" /> },
                { label: "Plan", value: "Starter (Free)", icon: <ArrowLeftRight className="h-4 w-4 text-muted-foreground" /> },
                { label: "Member since", value: profile.joinedDate, icon: <Calendar className="h-4 w-4 text-muted-foreground" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 flex gap-2">
                <button onClick={() => navigate("/upgrade")} className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Upgrade Plan
                </button>
                <button onClick={() => navigate("/settings")} className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold hover:bg-muted transition-colors">
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
