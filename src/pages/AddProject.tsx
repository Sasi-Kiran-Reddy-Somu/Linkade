import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Globe, Info, Copy, Check, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

const steps = [
  { number: 1, label: "Create your project" },
  { number: 2, label: "Verify ownership" },
  { number: 3, label: "Complete" },
];

function generateVerifyToken(domain: string): string {
  // deterministic-looking token based on domain
  const base = btoa(domain + "-linkade-verify-2024").replace(/[^a-z0-9]/gi, "").slice(0, 24);
  return `linkade-${base}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AddProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [addToExchange, setAddToExchange] = useState(false);

  // Step 2 state
  const [verifyMethod, setVerifyMethod] = useState<"meta" | "dns">("meta");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState("");

  useEffect(() => {
    if (websiteUrl) {
      setVerifyToken(generateVerifyToken(websiteUrl));
    }
  }, [websiteUrl]);

  const domain = websiteUrl.replace(/^https?:\/\//, "").split("/")[0] || "yourdomain.com";
  const metaTag = `<meta name="linkade-site-verification" content="${verifyToken}" />`;
  const dnsTxtRecord = `linkade-site-verification=${verifyToken}`;

  function handleStep1Continue() {
    if (!websiteUrl.trim()) return;
    setCurrentStep(2);
  }

  function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    // Simulate verification (in prod this would call the backend)
    setTimeout(() => {
      setVerifying(false);
      // Simulate success ~80% of the time for demo; always succeed if domain looks real
      const success = true;
      if (success) {
        // Save project to localStorage
        const existing = JSON.parse(localStorage.getItem("home-projects") ?? "[]");
        const newProject = {
          id: crypto.randomUUID(),
          name: projectName || domain,
          domain,
          addedToExchange: addToExchange,
          verified: true,
          createdAt: new Date().toISOString(),
          metrics: { dr: 0, da: 0, tf: 0, traffic: 0, rd: 0, spam: 0 },
        };
        localStorage.setItem("home-projects", JSON.stringify([...existing, newProject]));
        setCurrentStep(3);
      } else {
        setVerifyError("Verification tag not found. Make sure you've added it to your site and it's publicly accessible.");
      }
    }, 2200);
  }

  return (
    <AppLayout title="Add Project" icon={<Globe className="h-5 w-5" />}>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  currentStep === step.number
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.number
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-12 transition-colors", currentStep > step.number ? "bg-green-500" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <h2 className="text-center text-2xl font-bold text-foreground">
          {steps[currentStep - 1].label}
        </h2>

        {/* ── Step 1 ── */}
        {currentStep === 1 && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-foreground">Add Website URL</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>Enter the full URL of your website</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center rounded-lg border border-input bg-background">
                <span className="px-3 text-sm text-muted-foreground border-r border-input py-2.5">https://</span>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="mannyandolgas.com"
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Project name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Website"
              />
            </div>

            <div className="mt-8 space-y-3">
              <p className="text-sm text-foreground">
                Want to list your site in our backlink exchange and earn credits by accepting backlinks from other users?
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exchange"
                  checked={addToExchange}
                  onCheckedChange={(checked) => setAddToExchange(!!checked)}
                />
                <Label htmlFor="exchange" className="text-sm text-foreground cursor-pointer">
                  Yes, add my website to the backlink exchange
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                To confirm you own <span className="font-semibold text-foreground">{domain}</span>, add one of the following verification methods to your site.
              </p>

              {/* Method tabs */}
              <div className="flex gap-2">
                {(["meta", "dns"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVerifyMethod(m)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      verifyMethod === m
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "meta" ? "HTML Meta Tag" : "DNS TXT Record"}
                  </button>
                ))}
              </div>

              {verifyMethod === "meta" && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground font-medium">1. Add this tag inside the <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> of your homepage:</p>
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-4">
                    <code className="flex-1 text-xs text-foreground break-all font-mono leading-relaxed">{metaTag}</code>
                    <CopyButton value={metaTag} />
                  </div>
                  <p className="text-sm text-muted-foreground">2. Publish the change and click <strong>Verify Now</strong> below.</p>
                </div>
              )}

              {verifyMethod === "dns" && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground font-medium">1. Add a TXT record to your domain's DNS:</p>
                  <div className="rounded-lg border border-border bg-muted/50 overflow-hidden">
                    <div className="grid grid-cols-3 gap-px bg-border">
                      {["Type", "Name", "Value"].map((h) => (
                        <div key={h} className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">{h}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-px bg-border">
                      <div className="bg-card px-3 py-2 text-xs font-mono">TXT</div>
                      <div className="bg-card px-3 py-2 text-xs font-mono">@</div>
                      <div className="bg-card px-3 py-2 flex items-center gap-2">
                        <span className="text-xs font-mono break-all flex-1">{dnsTxtRecord}</span>
                        <CopyButton value={dnsTxtRecord} />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">2. DNS changes may take up to 24 hours to propagate. Click <strong>Verify Now</strong> once ready.</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tips</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>The meta tag must be on the homepage (root URL), not a subpage.</li>
                <li>Do not remove the tag after verification — it may be re-checked periodically.</li>
                <li>If you use a CMS like WordPress, add the tag via your theme's <em>header.php</em> or an SEO plugin.</li>
              </ul>
            </div>

            {verifyError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400">
                {verifyError}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 ── */}
        {currentStep === 3 && (
          <div className="rounded-xl border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-foreground">Project verified & created!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{projectName || domain}</span> has been added to your projects.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-medium text-foreground">{domain}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project name</span>
                <span className="font-medium text-foreground">{projectName || domain}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backlink exchange</span>
                <span className={cn("font-medium", addToExchange ? "text-green-600" : "text-muted-foreground")}>
                  {addToExchange ? "Listed" : "Not listed"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ownership</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => navigate("/exchange/websites?welcome=1")}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Browse Backlink Exchange <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setWebsiteUrl("");
                  setProjectName("");
                  setAddToExchange(false);
                  setVerifyError(null);
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Another Project
              </button>
              <button
                onClick={() => navigate("/app")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Go to My Projects
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {currentStep !== 3 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 1 && setCurrentStep((p) => p - 1)}
              className={cn(
                "text-sm font-medium transition-colors",
                currentStep > 1 ? "text-primary hover:underline" : "text-muted-foreground cursor-default"
              )}
            >
              {currentStep > 1 ? "← Back" : "View Instructions"}
            </button>

            {currentStep === 1 && (
              <button
                onClick={handleStep1Continue}
                disabled={!websiteUrl.trim()}
                className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex items-center gap-2 rounded-lg bg-primary px-10 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-75"
              >
                {verifying ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify Now"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
