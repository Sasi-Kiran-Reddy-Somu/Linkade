import AppLayout from "@/components/AppLayout";
import { Settings, User, Bell, Shield, CreditCard, Palette, Check } from "lucide-react";
import { useState, useEffect } from "react";

type Tab = "account" | "notifications" | "security" | "billing" | "appearance";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "account", label: "Account", icon: <User className="h-4 w-4" /> },
  { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { key: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  { key: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
];

const NOTIF_KEY = "settings-notifications";
const ACCOUNT_KEY = "settings-account";

type NotifPrefs = {
  newRequest: boolean;
  requestAccepted: boolean;
  requestDeclined: boolean;
  newMessage: boolean;
};

const DEFAULT_NOTIFS: NotifPrefs = {
  newRequest: true,
  requestAccepted: true,
  requestDeclined: true,
  newMessage: true,
};

function loadNotifs(): NotifPrefs {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    return stored ? { ...DEFAULT_NOTIFS, ...JSON.parse(stored) } : DEFAULT_NOTIFS;
  } catch {
    return DEFAULT_NOTIFS;
  }
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-[180px]">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SaveBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
      <Check className="h-4 w-4" />
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
      {message}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // ── Account ──
  const [displayName, setDisplayName] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "{}").displayName ?? "Alex Johnson"; } catch { return "Alex Johnson"; }
  });
  const [email, setEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "{}").email ?? "alex@example.com"; } catch { return "alex@example.com"; }
  });
  const [website, setWebsite] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "{}").website ?? "alexjohnson.com"; } catch { return "alexjohnson.com"; }
  });
  const [bio, setBio] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "{}").bio ?? ""; } catch { return ""; }
  });
  const [accountSaved, setAccountSaved] = useState(false);

  function saveAccount() {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ displayName, email, website, bio }));
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 3000);
  }

  // ── Notifications ──
  const [notifs, setNotifs] = useState<NotifPrefs>(loadNotifs);
  const [notifSaved, setNotifSaved] = useState(false);

  function setNotif(key: keyof NotifPrefs, value: boolean) {
    const updated = { ...notifs, [key]: value };
    setNotifs(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  }

  // ── Security / Password ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  function handlePasswordChange() {
    setPwError(null);
    if (!currentPw) { setPwError("Please enter your current password."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw === currentPw) { setPwError("New password must be different from the current one."); return; }
    // In production this would call the backend API
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 4000);
  }

  // ── Security toggles ──
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // ── Appearance ──
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [compactMode, setCompactMode] = useState(false);

  return (
    <AppLayout title="Settings" icon={<Settings className="h-5 w-5" />}>
      <div className="flex gap-8 max-w-4xl">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                activeTab === tab.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {/* ── Account ── */}
          {activeTab === "account" && (
            <>
              <SectionCard title="Profile" description="Update your public profile information.">
                <FieldRow label="Display Name" hint="Your name shown to other users.">
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
                </FieldRow>
                <FieldRow label="Email Address">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} />
                </FieldRow>
                <FieldRow label="Primary Website" hint="Your main site on the platform.">
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourdomain.com" className={inputCls} />
                </FieldRow>
                <FieldRow label="Bio" hint="A short description visible on your profile.">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others a bit about yourself..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </FieldRow>
                {accountSaved && <SaveBanner message="Profile saved successfully." />}
                <div className="flex justify-end">
                  <button onClick={saveAccount} className="rounded-md bg-black px-5 py-2 text-sm text-white font-medium hover:bg-black/80 transition-colors">
                    Save Changes
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Danger Zone" description="Irreversible actions for your account.">
                <FieldRow label="Delete Account" hint="Permanently remove your account and all data.">
                  <button className="rounded-md border border-red-200 text-red-600 px-4 py-2 text-sm hover:bg-red-50 transition-colors">
                    Delete my account
                  </button>
                </FieldRow>
              </SectionCard>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <SectionCard title="Notification Preferences" description="Choose what you get notified about. Changes are saved automatically.">
              {notifSaved && <SaveBanner message="Preferences saved." />}
              <FieldRow label="New Backlink Request" hint="When someone sends you a request.">
                <Toggle checked={notifs.newRequest} onChange={(v) => setNotif("newRequest", v)} />
              </FieldRow>
              <FieldRow label="Request Accepted" hint="When one of your requests is approved.">
                <Toggle checked={notifs.requestAccepted} onChange={(v) => setNotif("requestAccepted", v)} />
              </FieldRow>
              <FieldRow label="Request Declined" hint="When one of your requests is rejected.">
                <Toggle checked={notifs.requestDeclined} onChange={(v) => setNotif("requestDeclined", v)} />
              </FieldRow>
              <FieldRow label="New Message" hint="When you receive a direct message.">
                <Toggle checked={notifs.newMessage} onChange={(v) => setNotif("newMessage", v)} />
              </FieldRow>
            </SectionCard>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <>
              <SectionCard title="Password" description="Update your login password.">
                <FieldRow label="Current Password">
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="New Password" hint="Minimum 8 characters.">
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="Confirm New Password">
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </FieldRow>
                {pwError && <ErrorBanner message={pwError} />}
                {pwSuccess && <SaveBanner message="Password updated successfully." />}
                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    className="rounded-md bg-black px-5 py-2 text-sm text-white font-medium hover:bg-black/80 transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                <FieldRow label="Enable 2FA" hint="Require a verification code at login.">
                  <Toggle checked={twoFactor} onChange={setTwoFactor} />
                </FieldRow>
                <FieldRow label="Login Alerts" hint="Email me when a new device signs in.">
                  <Toggle checked={loginAlerts} onChange={setLoginAlerts} />
                </FieldRow>
              </SectionCard>

            </>
          )}

          {/* ── Billing ── */}
          {activeTab === "billing" && (
            <>
              <SectionCard title="Current Plan" description="You are on the Free plan.">
                <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-foreground">Free Plan</p>
                    <p className="text-sm text-muted-foreground mt-0.5">3 credits remaining · Resets monthly</p>
                  </div>
                  <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    Upgrade Plan
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Payment Method" description="Add or update your payment details.">
                <FieldRow label="Card Number">
                  <input placeholder="•••• •••• •••• ••••" className={inputCls} />
                </FieldRow>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FieldRow label="Expiry">
                      <input placeholder="MM / YY" className={inputCls} />
                    </FieldRow>
                  </div>
                  <div className="flex-1">
                    <FieldRow label="CVC">
                      <input placeholder="•••" className={inputCls} />
                    </FieldRow>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="rounded-md bg-black px-5 py-2 text-sm text-white font-medium hover:bg-black/80 transition-colors">
                    Save Card
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Billing History">
                <p className="text-sm text-muted-foreground">No billing history yet.</p>
              </SectionCard>
            </>
          )}

          {/* ── Appearance ── */}
          {activeTab === "appearance" && (
            <SectionCard title="Appearance" description="Customize how the platform looks for you.">
              <FieldRow label="Theme" hint="Choose your preferred color scheme.">
                <div className="flex gap-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FieldRow>
              <FieldRow label="Compact Mode" hint="Reduce spacing to show more content on screen.">
                <Toggle checked={compactMode} onChange={setCompactMode} />
              </FieldRow>
            </SectionCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
