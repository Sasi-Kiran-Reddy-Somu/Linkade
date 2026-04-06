import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import {
  Search, Filter, ChevronDown, ArrowUp, ArrowDown, X, SlidersHorizontal,
  Check, Link2, FileText, Info, PenLine, Sparkles, Activity, Zap, ExternalLink, Download, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockWebsites, type WebsiteListItem } from "../data/websites";
import { calcLinkCredits } from "@/lib/credits";
import { MetricInfo } from "./MetricInfo";

// ── Overflow badge (+N) ──────────────────────────────────────────────────────
function OverflowBadge({ count, allItems }: { count: number; allItems: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200 transition-colors shrink-0">
          +{count}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px] leading-relaxed font-normal max-w-[240px] text-left">
        {allItems.join(", ")}
      </TooltipContent>
    </Tooltip>
  );
}

// ── OverflowList (country, category) ───────────────────────────────────────────
function OverflowList({ items, maxWidth = "max-w-[120px]", textSize = "text-[10px]" }: { items: string[]; maxWidth?: string; textSize?: string }) {
  const first = items[0] ?? "—";
  const extra = items.slice(1);
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${textSize} text-foreground truncate ${maxWidth}`}>{first}</span>
      {extra.length > 0 && <OverflowBadge count={extra.length} allItems={items} />}
    </div>
  );
}

// ── TagList ─────────────────────────────────────────────────────────────────────
function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground max-w-[96px] truncate">
        {tags[0]}
      </span>
      {tags.length > 1 && <OverflowBadge count={tags.length - 1} allItems={tags} />}
    </div>
  );
}

// ── FormField helper ────────────────────────────────────────────────────────────
function FormField({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// mockWebsites imported from src/data/websites.ts (142 sites, DR 1–99)


const CATEGORIES = [
  "Arts & Culture", "Automotive", "Business & Finance", "Design", "Digital Marketing",
  "E-commerce & Online Retail", "Educational", "Entertainment", "Food & Dining",
  "Health & Fitness", "Home & Garden", "Law & Government", "News & Media",
  "Real Estate", "Religion & Spirituality", "Science & Nature",
  "Sports & Recreation", "Technology", "Travel & Tourism",
];

const TAGS = [
  "Accessories", "Adventures", "Advertising", "Analytics", "B2B", "Blogging",
  "CRM", "Content Marketing", "Design", "Development", "Entrepreneurship",
  "Exhibitions", "Fashion", "Finance", "Fitness", "Fleet Management",
  "Food", "Gadgets", "Gaming", "Health", "Home Decor", "Innovation",
  "Interior Design", "IoT", "Leadership", "Link Building", "Marketing",
  "Media", "Mental Health", "News", "Politics", "Productivity",
  "Psychology", "Recipes", "Restaurants", "Reviews", "SEO",
  "Social Media", "Startups", "Tech", "Technology", "Travel",
  "UI/UX", "VC & Funding", "Visual Arts", "Web Design",
  "Wellness", "WordPress", "Workouts",
];

const LANGUAGES = [
  "Arabic", "Chinese", "Danish", "Dutch", "English", "Finnish", "French",
  "German", "Hindi", "Indonesian", "Italian", "Japanese", "Korean",
  "Norwegian", "Polish", "Portuguese", "Russian", "Spanish", "Swedish", "Turkish",
];

const COUNTRIES = [
  "Australia", "Belgium", "Brazil", "Canada", "China", "Denmark", "Finland",
  "France", "Germany", "India", "Indonesia", "Italy", "Japan", "Mexico",
  "Netherlands", "New Zealand", "Norway", "Poland", "Russia", "Singapore",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Turkey",
  "United Arab Emirates", "United Kingdom", "United States",
];

const SORT_OPTIONS = [
  { label: "Date Added", key: "date" },
  { label: "Domain Rating (DR)", key: "dr" },
  { label: "Domain Authority (DA)", key: "da" },
  { label: "Trust Flow (TF)", key: "tf" },
  { label: "Traffic", key: "traffic" },
  { label: "Referring Domains (RD)", key: "rd" },
  { label: "Spam Score", key: "spamScore" },
  { label: "Responsiveness", key: "responsiveness" },
];

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

// ── Website list export utilities ─────────────────────────────────────────────
function triggerDownloadSites(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportSites(sites: import("../data/websites").WebsiteListItem[], fmt: "csv" | "tsv" | "json" | "xls") {
  const today = new Date().toISOString().slice(0, 10);
  const headers = ["Domain", "DR", "DA", "TF", "Traffic", "RD", "Spam Score", "Responsiveness", "Language", "Countries", "Categories", "Tags", "Link Insertion", "Guest Post"];
  const rows = sites.map((s) => [
    s.domain, s.dr, s.da, s.tf, s.traffic, s.rd, s.spamScore, s.responsiveness,
    s.language, s.countries.join("; "), s.categories.join("; "), s.tags.join("; "),
    s.availableLinkInsertion ? "Yes" : "No",
    s.availableGuestPost ? "Yes" : "No",
  ]);
  const escape = (v: unknown) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (fmt === "json") {
    const data = sites.map((s) => ({
      domain: s.domain, dr: s.dr, da: s.da, tf: s.tf, traffic: s.traffic,
      rd: s.rd, spamScore: s.spamScore, responsiveness: s.responsiveness,
      language: s.language, countries: s.countries, categories: s.categories,
      tags: s.tags, availableLinkInsertion: s.availableLinkInsertion, availableGuestPost: s.availableGuestPost,
    }));
    triggerDownloadSites(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" }), `suggested-sites-${today}.json`);
  } else if (fmt === "tsv") {
    const tsv = [headers, ...rows].map((row) => row.map((v) => String(v).replace(/\t/g, " ")).join("\t")).join("\n");
    triggerDownloadSites(new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8;" }), `suggested-sites-${today}.tsv`);
  } else if (fmt === "xls") {
    const tableRows = [headers, ...rows].map((row) => `<tr>${row.map((v) => `<td>${escape(v)}</td>`).join("")}</tr>`).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><table>${tableRows}</table></body></html>`;
    triggerDownloadSites(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }), `suggested-sites-${today}.xls`);
  } else {
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    triggerDownloadSites(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `suggested-sites-${today}.csv`);
  }
}

// ── Dual range slider ──────────────────────────────────────────────────────────
function DualRangeSlider({ min, max, value, onChange, label, step = 1 }: {
  min: number; max: number; value: [number, number];
  onChange: (v: [number, number]) => void; label: string; step?: number;
}) {
  const [lo, hi] = value;
  const range = max - min;
  const pctLo = range > 0 ? ((lo - min) / range) * 100 : 0;
  const pctHi = range > 0 ? ((hi - min) / range) * 100 : 100;
  const thumbCls =
    "pointer-events-none absolute w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 " +
    "[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white " +
    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary " +
    "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm " +
    "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white " +
    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary " +
    "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500 tabular-nums">{fmtNum(lo)} – {fmtNum(hi)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-gray-200">
          <div className="absolute h-full rounded-full bg-primary" style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          className={thumbCls} style={{ zIndex: lo > max - step * 5 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className={thumbCls} style={{ zIndex: 4 }} />
      </div>
    </div>
  );
}

// ── Checkbox filter column ─────────────────────────────────────────────────────
function CheckboxFilter({ label, items, selected, onToggle, search, onSearchChange }: {
  label: string; items: string[]; selected: Set<string>;
  onToggle: (item: string) => void; search: string; onSearchChange: (s: string) => void;
}) {
  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-xs font-semibold text-gray-700 mb-2">{label}</span>
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search…"
          className="w-full rounded-md border border-gray-200 bg-white pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="overflow-y-auto max-h-36 space-y-1 pr-1">
        {filtered.map((item) => (
          <label key={item} className="flex items-center gap-2 cursor-pointer group">
            <div onClick={() => onToggle(item)}
              className={`h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center cursor-pointer transition-colors ${selected.has(item) ? "bg-primary border-primary" : "border-gray-300 bg-white"}`}>
              {selected.has(item) && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-900 truncate leading-tight">{item}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="text-xs text-gray-400 py-1">No results</p>}
      </div>
    </div>
  );
}

// ── Suggestion generation helpers ──────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff; };
}

const SUGGESTION_ANCHORS: Record<string, string[]> = {
  "Digital Marketing": ["best SEO tools 2025", "content marketing strategies", "improve your search rankings", "grow organic traffic", "link building guide"],
  "Technology": ["top developer tools", "best software solutions", "tech productivity guide", "cloud computing overview", "web development tips"],
  "Business & Finance": ["business growth strategies", "financial planning guide", "startup funding options", "scaling your business", "ROI optimization"],
  "Health & Fitness": ["healthy lifestyle tips", "fitness routines for beginners", "nutrition guide", "workout plans", "mental wellness strategies"],
  "Travel & Tourism": ["top travel destinations", "budget travel tips", "travel planning guide", "adventure travel ideas", "hidden travel gems"],
  "Food & Dining": ["healthy meal prep guide", "cooking tips for beginners", "restaurant discovery", "food trends 2025", "quick easy recipes"],
  "Design": ["UI/UX best practices", "web design trends 2025", "color palette guide", "typography tips", "design inspiration"],
  "News & Media": ["media strategy guide", "content distribution tips", "audience engagement", "digital media trends", "editorial planning"],
  "Educational": ["online learning resources", "e-learning strategies", "educational technology", "student productivity", "effective learning methods"],
  "Home & Garden": ["home improvement tips", "garden design ideas", "interior decoration guide", "smart home solutions", "DIY home projects"],
};

const SUGGESTION_GP_TITLES: Record<string, string[]> = {
  "Digital Marketing": [
    "10 Proven SEO Strategies to Dominate Search Rankings in 2025",
    "How to Build a Content Marketing Funnel That Converts",
    "The Ultimate Guide to Link Building for Beginners",
    "7 Ways to Skyrocket Your Organic Traffic Without Paid Ads",
  ],
  "Technology": [
    "The Developer's Guide to Building Scalable Web Applications",
    "10 Must-Have Tools for Modern Software Teams in 2025",
    "How AI Is Transforming Software Development",
    "Cloud Migration: A Step-by-Step Guide for Startups",
  ],
  "Business & Finance": [
    "How to Scale Your Startup from 0 to $1M in Revenue",
    "The Complete Guide to Business Financial Planning",
    "7 Funding Strategies Every Entrepreneur Should Know",
    "How to Build a High-Performance Remote Team",
  ],
  "Health & Fitness": [
    "The Science-Backed Guide to Building Sustainable Fitness Habits",
    "10 Nutrition Myths That Are Holding You Back",
    "How to Create an Effective Home Workout Routine",
    "Mental Health and Physical Fitness: The Complete Connection",
  ],
  "Travel & Tourism": [
    "The Ultimate Budget Travel Guide for 2025",
    "10 Hidden Travel Gems You Need to Visit This Year",
    "How to Plan the Perfect Family Vacation on a Budget",
    "Solo Travel Safety: Everything You Need to Know",
  ],
  "Design": [
    "The Complete Guide to Modern UI/UX Design Principles",
    "10 Web Design Trends Dominating 2025",
    "How to Create a Brand Identity That Stands Out",
    "Color Psychology in Design: A Practical Guide",
  ],
};

const SUGGESTION_GP_DESCS: Record<string, string[]> = {
  "Digital Marketing": [
    "A comprehensive walkthrough of the most effective SEO techniques, including keyword research, on-page optimization, and ethical link building strategies used by top-ranking websites.",
    "This article breaks down the content marketing funnel from awareness to conversion, with real-world examples and actionable steps readers can implement immediately.",
    "An in-depth look at white-hat link acquisition methods, outreach templates, and the metrics that matter most when building domain authority.",
  ],
  "Technology": [
    "A deep dive into scalable web architecture patterns, covering microservices, API design, caching strategies, and real-world case studies from high-growth companies.",
    "An overview of the essential tools modern development teams are using to boost productivity, collaboration, and code quality in 2025.",
    "Explores how machine learning pipelines are being integrated into everyday development workflows, with examples from leading engineering teams.",
  ],
  "Business & Finance": [
    "A practical guide for entrepreneurs covering growth strategies, key metrics to track, and the mindset shifts necessary to scale a business sustainably.",
    "This article explores proven funding strategies — from bootstrapping to venture capital — with advice from founders who have successfully raised capital.",
    "Covers the operational and cultural shifts needed when transitioning from a co-located to a distributed team, with frameworks for communication and accountability.",
  ],
  "Health & Fitness": [
    "A science-backed breakdown of habit formation in the context of fitness — why most routines fail and what research says about building ones that stick.",
    "Examines the most common nutrition misconceptions and provides evidence-based clarity, making it ideal for readers who want to make smarter dietary choices.",
    "A beginner-friendly framework for establishing a consistent home workout routine without expensive equipment, tailored to different fitness levels.",
  ],
  "Travel & Tourism": [
    "A practical, destination-agnostic guide covering planning, budgeting, packing, and real-time travel hacks for the modern explorer.",
    "Highlights under-the-radar destinations across different continents, with insider tips on the best times to visit and local experiences not found in mainstream guides.",
    "A comprehensive resource covering essential safety tips, gear recommendations, and mindset advice for those traveling solo for the first time.",
  ],
  "Design": [
    "A structured look at the principles guiding modern interface design — usability, accessibility, visual hierarchy, and micro-interactions — with annotated examples.",
    "Identifies the most influential UI and visual design trends shaping product design in 2025, with commentary on which are worth adopting.",
    "Walks through the brand identity creation process from research and positioning to logo design and style guide, with case studies from real brands.",
  ],
};

const SLUG_POOL = ["ultimate-guide", "top-tips", "best-strategies", "how-to", "complete-overview", "step-by-step", "beginners-guide"];
const EXISTING_SLUG_POOL = ["best-practices-2025", "industry-guide", "complete-resource", "expert-tips", "in-depth-review", "popular-strategies"];

interface SuggestionData {
  sourceUrl: string;
  anchorText: string;
  targetUrl: string;
  title: string;
  description: string;
}

// Infer the project's niche from its domain (deterministic)
const PROJECT_NICHE_KEYS = Object.keys(SUGGESTION_ANCHORS);
function inferProjectNiche(projectDomain: string): string {
  const h = hashStr(projectDomain);
  return PROJECT_NICHE_KEYS[h % PROJECT_NICHE_KEYS.length];
}

function generateSuggestions(site: WebsiteListItem, projectDomain: string): SuggestionData {
  const rand = lcg(hashStr(site.domain + "|" + projectDomain));
  const publisherCat = site.categories[0] || "Technology";
  // Anchor text is based on PROJECT niche — what the user wants to rank for
  const projectNiche = inferProjectNiche(projectDomain);
  const anchors = SUGGESTION_ANCHORS[projectNiche] || SUGGESTION_ANCHORS["Technology"];
  const anchor = anchors[Math.floor(rand() * anchors.length)];
  const pageSlug = SLUG_POOL[Math.floor(rand() * SLUG_POOL.length)];
  const existingSlug = EXISTING_SLUG_POOL[Math.floor(rand() * EXISTING_SLUG_POOL.length)];
  // GP title & desc are based on PUBLISHER category — what fits their audience
  const gpTitles = SUGGESTION_GP_TITLES[publisherCat] || SUGGESTION_GP_TITLES["Technology"];
  const gpTitle = gpTitles[Math.floor(rand() * gpTitles.length)];
  const gpDescs = SUGGESTION_GP_DESCS[publisherCat] || SUGGESTION_GP_DESCS["Technology"];
  const gpDesc = gpDescs[Math.floor(rand() * gpDescs.length)];
  return {
    sourceUrl: `https://${site.domain}/blog/${existingSlug}`,
    anchorText: anchor,
    targetUrl: `https://${projectDomain}/${pageSlug}`,
    title: gpTitle,
    description: gpDesc,
  };
}

// Owner's overall account responsiveness (across all their domains) — derived from domain seed
function ownerOverallResponsiveness(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = (Math.imul(47, h) + domain.charCodeAt(i)) | 0;
  return 40 + (Math.abs(h) % 55);
}

// ── Main component ─────────────────────────────────────────────────────────────
interface ExchangeWebsitesListProps {
  actionLabel?: string;
  actionVariant?: "request" | "buy";
  mode?: "request" | "suggestions";
  projectDomain?: string;
  projectName?: string;
  suggestedDomains?: string[];
}

// ── Smart empty state ─────────────────────────────────────────────────────────
function SmartEmptyState({
  search,
  selectedCategories,
  selectedLanguages,
  selectedCountries,
  filterLI,
  filterGP,
  onClearFilters,
  onAddSite,
}: {
  search: string;
  selectedCategories: Set<string>;
  selectedLanguages: Set<string>;
  selectedCountries: Set<string>;
  filterLI: boolean;
  filterGP: boolean;
  onClearFilters: () => void;
  onAddSite: () => void;
}) {
  const hasSearch = !!search;
  const hasCategory = selectedCategories.size > 0;
  const hasLanguage = selectedLanguages.size > 0;
  const hasCountry = selectedCountries.size > 0;
  const hasType = filterLI || filterGP;
  const hasAnyFilter = hasSearch || hasCategory || hasLanguage || hasCountry || hasType;

  let title = "No websites found";
  let description = "There are no sites matching your current filters.";

  if (hasSearch) {
    title = `No results for "${search}"`;
    description = "Try a different domain name or remove the search term.";
  } else if (hasCategory) {
    const cats = [...selectedCategories].slice(0, 2).join(", ");
    title = `No sites in ${cats}`;
    description = "We don't have exchange partners in this niche yet — but they're joining every day.";
  } else if (hasLanguage) {
    const langs = [...selectedLanguages].slice(0, 2).join(", ");
    title = `No ${langs} sites yet`;
    description = "This language filter returned no results. Try broadening your language selection.";
  } else if (hasCountry) {
    const countries = [...selectedCountries].slice(0, 2).join(", ");
    title = `No sites from ${countries}`;
    description = "No exchange partners from this region yet. Consider adding your own site to help grow it!";
  } else if (hasType) {
    const type = filterLI && filterGP ? "Link Insertion + Guest Post" : filterLI ? "Link Insertion" : "Guest Post";
    title = `No sites offer ${type}`;
    description = "Try removing the availability filter to see more exchange partners.";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {hasAnyFilter && (
          <button
            onClick={onClearFilters}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Clear all filters
          </button>
        )}
        <button
          onClick={onAddSite}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add your site to the exchange
        </button>
      </div>
    </div>
  );
}

export default function ExchangeWebsitesList({
  actionLabel = "Request",
  actionVariant = "request",
  mode = "request",
  projectDomain,
  projectName,
  suggestedDomains,
}: ExchangeWebsitesListProps) {
  const navigate = useNavigate();

  // ── Filter / sort state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // ── User project categories (from localStorage) ──────────────────────────────
  const userProjectCategories = useMemo<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("home-projects");
      const projects: { category?: string; tags?: string[] }[] = raw ? JSON.parse(raw) : [];
      const cats = projects.map((p) => p.category).filter(Boolean) as string[];
      return new Set(cats);
    } catch { return new Set(); }
  }, []);

  const [showRecommended, setShowRecommended] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [catSearch, setCatSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [langSearch, setLangSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const [filterDA, setFilterDA] = useState<[number, number]>([0, 100]);
  const [filterDR, setFilterDR] = useState<[number, number]>([0, 100]);
  const [filterTF, setFilterTF] = useState<[number, number]>([0, 100]);
  const [filterSpam, setFilterSpam] = useState<[number, number]>([0, 100]);

  // Availability quick-filter toggles
  const [filterLI, setFilterLI] = useState(false);
  const [filterGP, setFilterGP] = useState(false);

  // ── Pagination state ─────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ── Suggestion status tracking ───────────────────────────────────────────────
  const [suggestionStatuses, setSuggestionStatuses] = useState<Record<string, string>>({});

  function getSuggestionStatus(domain: string): string {
    if (suggestionStatuses[domain]) return suggestionStatuses[domain];
    const key = `suggestion-status-${projectDomain ?? ""}-${domain}`;
    return localStorage.getItem(key) ?? "New";
  }

  function setSuggestionStatus(domain: string, status: string) {
    const key = `suggestion-status-${projectDomain ?? ""}-${domain}`;
    localStorage.setItem(key, status);
    setSuggestionStatuses((prev) => ({ ...prev, [domain]: status }));
  }

  // ── Request dialog state ─────────────────────────────────────────────────────
  const [requestSite, setRequestSite] = useState<WebsiteListItem | null>(null);
  const [requestStep, setRequestStep] = useState<1 | 2>(1);
  const [requestType, setRequestType] = useState<"link-insertion" | "guest-post" | null>(null);
  const [reqSourceUrl, setReqSourceUrl] = useState("");
  const [reqAnchorText, setReqAnchorText] = useState("");
  const [reqTargetUrl, setReqTargetUrl] = useState("");
  const [reqTitle, setReqTitle] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqErrors, setReqErrors] = useState<Record<string, string | undefined>>({});
  const [useWriterate, setUseWriterate] = useState(false);
  const [creditOffer, setCreditOffer] = useState(1);

  // ── Suggestion dialog state ──────────────────────────────────────────────────
  const [suggestionSite, setSuggestionSite] = useState<WebsiteListItem | null>(null);
  const [suggestionType, setSuggestionType] = useState<"link-insertion" | "guest-post">("link-insertion");
  const [useWriterateSuggestion, setUseWriterateSuggestion] = useState(false);
  const [suggestionData, setSuggestionData] = useState<SuggestionData | null>(null);
  // Editable fields within the suggestion dialog
  const [suggSourceUrl, setSuggSourceUrl] = useState("");
  const [suggAnchorText, setSuggAnchorText] = useState("");
  const [suggTargetUrl, setSuggTargetUrl] = useState("");
  const [suggTitle, setSuggTitle] = useState("");
  const [suggDesc, setSuggDesc] = useState("");
  const [suggCreditOffer, setSuggCreditOffer] = useState(1);
  const [suggErrors, setSuggErrors] = useState<Record<string, string | undefined>>({});

  const sortRef = useRef<HTMLDivElement>(null);
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

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setSortOpen(false);
  }

  function toggleSet(set: Set<string>, item: string): Set<string> {
    const next = new Set(set);
    if (next.has(item)) next.delete(item); else next.add(item);
    return next;
  }

  const activeFilterCount =
    selectedCategories.size + selectedTags.size + selectedLanguages.size + selectedCountries.size +
    (filterDA[0] > 0 || filterDA[1] < 100 ? 1 : 0) +
    (filterDR[0] > 0 || filterDR[1] < 100 ? 1 : 0) +
    (filterTF[0] > 0 || filterTF[1] < 100 ? 1 : 0) +
    (filterSpam[0] > 0 || filterSpam[1] < 100 ? 1 : 0) +
    (filterLI ? 1 : 0) + (filterGP ? 1 : 0);

  function resetFilters() {
    setSelectedCategories(new Set()); setSelectedTags(new Set());
    setSelectedLanguages(new Set()); setSelectedCountries(new Set());
    setFilterDA([0, 100]); setFilterDR([0, 100]);
    setFilterTF([0, 100]); setFilterSpam([0, 100]);
    setCatSearch(""); setTagSearch(""); setLangSearch(""); setCountrySearch("");
    setFilterLI(false); setFilterGP(false);
  }

  // ── Request dialog helpers ───────────────────────────────────────────────────
  function openRequest(site: WebsiteListItem) {
    setRequestSite(site);
    setRequestStep(1);
    setRequestType(null);
    setCreditOffer(calcLinkCredits(site.dr, site.da, site.traffic, site.tf, site.spamScore));
    setReqSourceUrl(""); setReqAnchorText(""); setReqTargetUrl("");
    setReqTitle(""); setReqDescription(""); setReqErrors({}); setUseWriterate(false);
  }

  function closeRequest() {
    setRequestSite(null);
    setRequestStep(1);
    setRequestType(null);
    setReqErrors({});
    setUseWriterate(false);
    setCreditOffer(1);
  }

  function handleSelectType(type: "link-insertion" | "guest-post") {
    setRequestType(type);
    setReqErrors({});
    setRequestStep(2);
  }

  function handleSubmitRequest() {
    const errors: Record<string, string> = {};
    if (requestType === "link-insertion") {
      if (!reqSourceUrl.trim()) errors.sourceUrl = "Source URL is required.";
      if (!reqAnchorText.trim()) errors.anchorText = "Anchor text is required.";
      if (!reqTargetUrl.trim()) errors.targetUrl = "Target URL is required.";
    } else {
      if (!reqTitle.trim()) errors.title = "Article title is required.";
      if (!reqDescription.trim()) errors.description = "Description is required.";
    }
    if (Object.keys(errors).length) { setReqErrors(errors); return; }
    closeRequest();
  }

  // ── Suggestion dialog helpers ────────────────────────────────────────────────
  function openSuggestion(site: WebsiteListItem) {
    // Mark as viewed if currently "New"
    const currentStatus = getSuggestionStatus(site.domain);
    if (currentStatus === "New") setSuggestionStatus(site.domain, "Viewed");

    const data = generateSuggestions(site, projectDomain ?? "");
    const minCr = calcLinkCredits(site.dr, site.da, site.traffic, site.tf, site.spamScore);
    setSuggestionSite(site);
    setSuggestionType(site.availableLinkInsertion ? "link-insertion" : "guest-post");
    setUseWriterateSuggestion(false);
    setSuggestionData(data);
    setSuggSourceUrl(data.sourceUrl);
    setSuggAnchorText(data.anchorText);
    setSuggTargetUrl(data.targetUrl);
    setSuggTitle(data.title);
    setSuggDesc(data.description);
    setSuggCreditOffer(minCr);
    setSuggErrors({});
  }

  function closeSuggestion() {
    setSuggestionSite(null);
    setSuggestionData(null);
    setUseWriterateSuggestion(false);
    setSuggErrors({});
  }

  function handleSendFromSuggestion() {
    if (!suggestionSite) return;
    const errors: Record<string, string> = {};
    if (suggestionType === "link-insertion") {
      if (!suggSourceUrl.trim()) errors.sourceUrl = "Source URL is required.";
      if (!suggAnchorText.trim()) errors.anchorText = "Anchor text is required.";
      if (!suggTargetUrl.trim()) errors.targetUrl = "Target URL is required.";
    } else {
      if (!suggTitle.trim()) errors.title = "Article title is required.";
      if (!suggDesc.trim()) errors.description = "Description is required.";
    }
    if (Object.keys(errors).length) { setSuggErrors(errors); return; }
    if (suggestionSite) setSuggestionStatus(suggestionSite.domain, "Made Request");
    closeSuggestion();
  }

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  // ── Filtered & sorted sites ──────────────────────────────────────────────────
  const displayedSites = useMemo(() => {
    let result = mockWebsites.filter((site) => {
      if (mode === "suggestions" && suggestedDomains && suggestedDomains.length > 0 && !suggestedDomains.includes(site.domain)) return false;
      if (search && !site.domain.toLowerCase().includes(search.toLowerCase())) return false;
      if (showRecommended && userProjectCategories.size && !site.categories.some((c) => userProjectCategories.has(c))) return false;
      if (selectedCategories.size && !site.categories.some((c) => selectedCategories.has(c))) return false;
      if (selectedTags.size && !site.tags.some((t) => selectedTags.has(t))) return false;
      if (selectedLanguages.size && !selectedLanguages.has(site.language)) return false;
      if (selectedCountries.size && !site.countries.some((c) => selectedCountries.has(c))) return false;
      if (site.da < filterDA[0] || site.da > filterDA[1]) return false;
      if (site.dr < filterDR[0] || site.dr > filterDR[1]) return false;
      if (site.tf < filterTF[0] || site.tf > filterTF[1]) return false;
      if (site.spamScore < filterSpam[0] || site.spamScore > filterSpam[1]) return false;
      if (filterLI && !site.availableLinkInsertion) return false;
      if (filterGP && !site.availableGuestPost) return false;
      return true;
    });
    if (sortKey && sortKey !== "date") {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, number>)[sortKey] ?? 0;
        const bVal = (b as Record<string, number>)[sortKey] ?? 0;
        return sortAsc ? aVal - bVal : bVal - aVal;
      });
    }
    return result;
  }, [search, selectedCategories, selectedTags, selectedLanguages, selectedCountries, filterDA, filterDR, filterTF, filterSpam, filterLI, filterGP, sortKey, sortAsc, mode, suggestedDomains, showRecommended, userProjectCategories]);

  const totalPages = Math.max(1, Math.ceil(displayedSites.length / ITEMS_PER_PAGE));
  const pagedSites = displayedSites.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 when filters/search change
  const prevDisplayedLength = useRef(displayedSites.length);
  useEffect(() => {
    if (prevDisplayedLength.current !== displayedSites.length) {
      setCurrentPage(1);
      prevDisplayedLength.current = displayedSites.length;
    }
  }, [displayedSites.length]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  return (
    <div className="space-y-4">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by domain…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Sort By */}
        <div className="relative" ref={sortRef}>
          <Button variant="outline" className="gap-2" onClick={() => setSortOpen((o) => !o)}>
            <SlidersHorizontal className="h-4 w-4" />
            {currentSortLabel ? `Sort: ${currentSortLabel}` : "Sort By"}
            <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
          </Button>
          {sortOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
              {SORT_OPTIONS.map((opt) => (
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

        {/* Filter */}
        <Button variant="outline"
          className={`gap-2 ${filterOpen ? "border-primary text-primary bg-primary/5" : ""}`}
          onClick={() => setFilterOpen((o) => !o)}>
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Recommended for you toggle (only when user has project categories) */}
        {userProjectCategories.size > 0 && mode !== "suggestions" && (
          <button
            onClick={() => setShowRecommended((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showRecommended ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            <Sparkles className="h-4 w-4" />
            Recommended
          </button>
        )}

        {/* Export dropdown (suggestions mode only) */}
        {mode === "suggestions" && (
          <div className="relative ml-auto" ref={exportRef}>
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" />
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
                    onClick={() => { exportSites(displayedSites, fmt); setExportOpen(false); }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter panel ── */}
      {filterOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          {/* Availability checkboxes */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Availability</p>
            <div className="flex items-center gap-4">
              {[
                { key: "li" as const, label: "Link Insertion", state: filterLI, set: setFilterLI, color: "text-gray-900 bg-gray-100 border-gray-900" },
                { key: "gp" as const, label: "Guest Post", state: filterGP, set: setFilterGP, color: "text-gray-900 bg-gray-100 border-gray-900" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => opt.set((v) => !v)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${opt.state ? opt.color : "border-border text-muted-foreground hover:bg-muted"}`}>
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${opt.state ? "bg-primary border-primary" : "border-gray-300 bg-white"}`}>
                    {opt.state && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Checkbox filters */}
          <div className="grid grid-cols-4 gap-5">
            <CheckboxFilter label="Category" items={CATEGORIES} selected={selectedCategories}
              onToggle={(i) => setSelectedCategories(toggleSet(selectedCategories, i))}
              search={catSearch} onSearchChange={setCatSearch} />
            <CheckboxFilter label="Tags" items={TAGS} selected={selectedTags}
              onToggle={(i) => setSelectedTags(toggleSet(selectedTags, i))}
              search={tagSearch} onSearchChange={setTagSearch} />
            <CheckboxFilter label="Language" items={LANGUAGES} selected={selectedLanguages}
              onToggle={(i) => setSelectedLanguages(toggleSet(selectedLanguages, i))}
              search={langSearch} onSearchChange={setLangSearch} />
            <CheckboxFilter label="Country" items={COUNTRIES} selected={selectedCountries}
              onToggle={(i) => setSelectedCountries(toggleSet(selectedCountries, i))}
              search={countrySearch} onSearchChange={setCountrySearch} />
          </div>

          {/* Metric sliders */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3">Metric Ranges</p>
            <div className="grid grid-cols-4 gap-6">
              <DualRangeSlider label="DA" min={0} max={100} value={filterDA} onChange={setFilterDA} />
              <DualRangeSlider label="DR" min={0} max={100} value={filterDR} onChange={setFilterDR} />
              <DualRangeSlider label="TF" min={0} max={100} value={filterTF} onChange={setFilterTF} />
              <DualRangeSlider label="Spam Score" min={0} max={100} value={filterSpam} onChange={setFilterSpam} />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Reset all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile card view (hidden on md+) ── */}
      <div className="block md:hidden space-y-3">
        {displayedSites.length === 0 ? (
          <SmartEmptyState
            search={search} selectedCategories={selectedCategories}
            selectedLanguages={selectedLanguages} selectedCountries={selectedCountries}
            filterLI={filterLI} filterGP={filterGP}
            onClearFilters={() => { setSearch(""); setSelectedCategories(new Set()); setSelectedTags(new Set()); setSelectedLanguages(new Set()); setSelectedCountries(new Set()); setFilterDA([0,100]); setFilterDR([0,100]); setFilterTF([0,100]); setFilterSpam([0,100]); setFilterLI(false); setFilterGP(false); }}
            onAddSite={() => navigate("/add-project")}
          />
        ) : (
          pagedSites.map((site, i) => {
            const credits = calcLinkCredits(site.dr, site.da, site.traffic, site.tf, site.spamScore);
            const spamColor = site.spamScore <= 3 ? "text-green-600" : site.spamScore <= 7 ? "text-amber-500" : "text-red-500";
            const respColor = site.responsiveness >= 75 ? "text-green-600" : site.responsiveness >= 50 ? "text-amber-500" : "text-red-500";
            const suggStatus = mode === "suggestions" ? getSuggestionStatus(site.domain) : null;
            const suggCfg: Record<string, string> = {
              "New": "bg-blue-50 text-blue-600 border-blue-200", "Viewed": "bg-gray-100 text-gray-500 border-gray-200",
              "Made Request": "bg-gray-100 text-gray-700 border-gray-200", "Accepted": "bg-green-50 text-green-600 border-green-200",
              "Live": "bg-teal-50 text-teal-600 border-teal-200",
            };
            return (
              <div key={i} className="rounded-xl border border-border bg-card px-4 py-3.5 space-y-3">
                {/* Top: favicon + domain */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                    <img src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`} alt=""
                      className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={`https://${site.domain}`} target="_blank" rel="noreferrer"
                      className="text-sm font-semibold text-foreground hover:underline truncate block">{site.domain}</a>
                    <p className={`text-[10px] font-medium ${respColor}`}>Responsiveness {site.responsiveness}%</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {site.availableLinkInsertion && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 leading-none">
                          <Link2 className="h-2.5 w-2.5" /> Link Insertion
                        </span>
                      )}
                      {site.availableGuestPost && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 leading-none">
                          <FileText className="h-2.5 w-2.5" /> Guest Post
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      <Zap className="h-2.5 w-2.5 text-amber-500" />{credits}
                    </span>
                    {suggStatus && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${suggCfg[suggStatus] ?? suggCfg["New"]}`}>{suggStatus}</span>
                    )}
                  </div>
                </div>
                {/* Category / Language / Country / Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {site.categories.slice(0, 2).map((c) => (
                    <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 truncate max-w-[100px]">{c}</span>
                  ))}
                  {site.categories.length > 2 && <span className="text-[10px] text-muted-foreground">+{site.categories.length - 2}</span>}
                  <span className="text-[10px] text-muted-foreground">{site.language}</span>
                  {site.countries.slice(0, 1).map((c) => <span key={c} className="text-[10px] text-muted-foreground">{c}</span>)}
                  {site.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground truncate max-w-[80px]">{t}</span>
                  ))}
                </div>
                {/* Metrics grid */}
                <div className="grid grid-cols-5 divide-x divide-gray-100 rounded-lg border border-gray-100 bg-gray-50 py-2">
                  {[
                    { label: "DR", value: site.dr, color: "" },
                    { label: "DA", value: site.da, color: "" },
                    { label: "TF", value: site.tf, color: "" },
                    { label: "Traffic", value: fmtNum(site.traffic), color: "" },
                    { label: "Spam", value: site.spamScore, color: spamColor },
                  ].map((m) => (
                    <div key={m.label} className="text-center px-1">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className={`text-xs font-semibold ${m.color || "text-foreground"}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
                {/* Action button */}
                {mode === "suggestions" ? (
                  <Button size="sm" variant="outline" className="w-full border-gray-900 text-gray-900 hover:bg-gray-100 gap-1.5" onClick={() => openSuggestion(site)}>
                    <Sparkles className="h-3.5 w-3.5" /> Show
                  </Button>
                ) : (
                  <Button size="sm" className="w-full"
                    variant={actionVariant === "buy" ? "default" : "outline"}
                    onClick={() => actionVariant === "request" ? openRequest(site) : undefined}>
                    {actionLabel}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Table (desktop only, hidden below md) ── */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="w-max">
          {/* Column header row */}
          <div className="flex items-center gap-4 px-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2.5 mb-2">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-9 shrink-0" />
              <div className="w-52 shrink-0 text-center">Website / Availability</div>
            </div>
            <div className="w-28 shrink-0 text-center">Category</div>
            <div className="w-14 shrink-0 text-center">Language</div>
            <div className="w-24 shrink-0 text-center">Country</div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">DR<MetricInfo metric="DR" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">DA<MetricInfo metric="DA" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">TF<MetricInfo metric="TF" /></div>
            <div className="w-16 shrink-0 flex items-center justify-center gap-0.5">Traffic<MetricInfo metric="Traffic" /></div>
            <div className="w-12 shrink-0 flex items-center justify-center gap-0.5">Spam<MetricInfo metric="Spam" /></div>
            <div className="w-28 shrink-0 text-center">Tags</div>
            <div className="w-20 shrink-0 text-center">Credits</div>
            {mode === "suggestions" && <div className="w-28 shrink-0 text-center">Status</div>}
            <div className="shrink-0 w-20" />
          </div>

          {/* Website rows */}
          <div className="space-y-2.5">
            {displayedSites.length === 0 ? (
              <SmartEmptyState
                search={search} selectedCategories={selectedCategories}
                selectedLanguages={selectedLanguages} selectedCountries={selectedCountries}
                filterLI={filterLI} filterGP={filterGP}
                onClearFilters={() => { setSearch(""); setSelectedCategories(new Set()); setSelectedTags(new Set()); setSelectedLanguages(new Set()); setSelectedCountries(new Set()); setFilterDA([0,100]); setFilterDR([0,100]); setFilterTF([0,100]); setFilterSpam([0,100]); setFilterLI(false); setFilterGP(false); }}
                onAddSite={() => navigate("/add-project")}
              />
            ) : (
              pagedSites.map((site, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3.5 transition-shadow hover:shadow-md">
                  {/* Favicon + Domain grouped */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                      <img src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`} alt=""
                        className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="w-52 shrink-0 min-w-0 text-center">
                      <a href={`https://${site.domain}`} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-foreground truncate hover:underline block">{site.domain}</a>
                      <p className={`text-[11px] font-medium mt-0.5 ${site.responsiveness >= 75 ? "text-green-600" : site.responsiveness >= 50 ? "text-amber-500" : "text-red-500"}`}>
                        Responsiveness {site.responsiveness}%
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                        {site.availableLinkInsertion && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 leading-none">
                            <Link2 className="h-2.5 w-2.5" /> Link Insertion
                          </span>
                        )}
                        {site.availableGuestPost && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 leading-none">
                            <FileText className="h-2.5 w-2.5" /> Guest Post
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-28 shrink-0 min-w-0 flex justify-center">
                    <OverflowList items={site.categories} maxWidth="max-w-[96px]" />
                  </div>
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-[10px] text-foreground">{site.language}</p>
                  </div>
                  <div className="w-24 shrink-0 min-w-0 flex justify-center">
                    <OverflowList items={site.countries} maxWidth="max-w-[80px]" />
                  </div>
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-semibold text-foreground">{site.dr}</p>
                  </div>
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-semibold text-foreground">{site.da}</p>
                  </div>
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-semibold text-foreground">{site.tf}</p>
                  </div>
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-sm font-semibold text-foreground">{fmtNum(site.traffic)}</p>
                  </div>
                  <div className="w-12 shrink-0 text-center">
                    <p className={`text-sm font-semibold ${site.spamScore <= 3 ? "text-green-600" : site.spamScore <= 7 ? "text-amber-500" : "text-red-500"}`}>{site.spamScore}</p>
                  </div>
                  <div className="w-28 shrink-0 min-w-0 flex justify-center">
                    <TagList tags={site.tags} />
                  </div>
                  <div className="w-20 shrink-0 flex justify-center">
                    <span className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      <Zap className="h-2.5 w-2.5 text-amber-500" />
                      {calcLinkCredits(site.dr, site.da, site.traffic, site.tf, site.spamScore)}
                    </span>
                  </div>
                  {mode === "suggestions" && (() => {
                    const st = getSuggestionStatus(site.domain);
                    const cfg: Record<string, { cls: string; label: string }> = {
                      "New":          { cls: "bg-blue-50 text-blue-600 border-blue-200",   label: "New" },
                      "Viewed":       { cls: "bg-gray-100 text-gray-500 border-gray-200",  label: "Viewed" },
                      "Made Request": { cls: "bg-gray-100 text-gray-700 border-gray-200",  label: "Made Request" },
                      "Accepted":     { cls: "bg-green-50 text-green-600 border-green-200", label: "Accepted" },
                      "Live":         { cls: "bg-teal-50 text-teal-600 border-teal-200",    label: "Live" },
                    };
                    const { cls, label } = cfg[st] ?? cfg["New"];
                    return (
                      <div className="w-28 shrink-0 flex justify-center">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
                      </div>
                    );
                  })()}
                  <div className="shrink-0">
                    {mode === "suggestions" ? (
                      <Button size="sm" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-100 gap-1.5" onClick={() => openSuggestion(site)}>
                        <Sparkles className="h-3.5 w-3.5" /> Show
                      </Button>
                    ) : (
                      <Button size="sm"
                        variant={actionVariant === "buy" ? "default" : "outline"}
                        className={actionVariant === "request" ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground" : ""}
                        onClick={() => actionVariant === "request" ? openRequest(site) : undefined}>
                        {actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Previous</Button>
          {(() => {
            const pages: (number | "...")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (currentPage > 3) pages.push("...");
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
              if (currentPage < totalPages - 2) pages.push("...");
              pages.push(totalPages);
            }
            return pages.map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="text-muted-foreground px-1">...</span>
              ) : (
                <Button key={p} size="sm" variant={p === currentPage ? "default" : "ghost"} className="h-8 w-8 p-0" onClick={() => setCurrentPage(p as number)}>{p}</Button>
              )
            );
          })()}
          <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</Button>
        </div>
      )}

      {/* ── Suggestions dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!suggestionSite} onOpenChange={(open) => { if (!open) closeSuggestion(); }}>
        <DialogContent className="w-[680px] max-h-[90vh] flex flex-col overflow-hidden p-0">
          {/* Header */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border">
            <DialogHeader className="mb-0">
              <DialogTitle className="sr-only">AI Suggestions</DialogTitle>
            </DialogHeader>
            {suggestionSite && (
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={`https://www.google.com/s2/favicons?domain=${suggestionSite.domain}&sz=32`}
                    alt="" className="h-7 w-7 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`https://${suggestionSite.domain}`} target="_blank" rel="noreferrer"
                      className="text-base font-bold text-foreground hover:underline">
                      {suggestionSite.domain}
                    </a>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <Sparkles className="h-3 w-3" /> AI Suggestions
                    </span>
                  </div>
                  {projectName && (
                    <p className="text-xs text-muted-foreground mt-0.5">For project: <strong>{projectName}</strong></p>
                  )}
                  {/* Metrics row */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[
                      { label: "DR", value: suggestionSite.dr },
                      { label: "DA", value: suggestionSite.da },
                      { label: "TF", value: suggestionSite.tf },
                      { label: "Traffic", value: fmtNum(suggestionSite.traffic) },
                      { label: "RD", value: fmtNum(suggestionSite.rd) },
                      { label: "Spam", value: suggestionSite.spamScore, color: suggestionSite.spamScore <= 3 ? "text-green-600" : suggestionSite.spamScore <= 7 ? "text-amber-500" : "text-red-500" },
                      { label: "RefDomains", value: fmtNum(suggestionSite.ahrefsRefDomains) },
                      { label: "Backlinks", value: fmtNum(suggestionSite.ahrefsBacklinks) },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-0.5 rounded-md bg-muted/50 px-2 py-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                        <MetricInfo metric={m.label} />
                        <span className={`text-[11px] font-bold text-foreground ${(m as { color?: string }).color ?? ""}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Responsiveness bars */}
                  <div className="flex flex-col gap-1 mt-1.5">
                    {(() => {
                      const overall = ownerOverallResponsiveness(suggestionSite.domain);
                      const perDomain = suggestionSite.responsiveness;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (all projects)</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${overall >= 75 ? "bg-green-500" : overall >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${overall}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold ${overall >= 75 ? "text-green-600" : overall >= 50 ? "text-amber-500" : "text-red-500"}`}>{overall}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (this domain)</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${perDomain >= 75 ? "bg-green-500" : perDomain >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${perDomain}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold ${perDomain >= 75 ? "text-green-600" : perDomain >= 50 ? "text-amber-500" : "text-red-500"}`}>{perDomain}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
            {/* Type switcher */}
            {suggestionSite?.availableLinkInsertion && suggestionSite?.availableGuestPost && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSuggestionType("link-insertion")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${suggestionType === "link-insertion" ? "bg-gray-900 border-gray-900 text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  <Link2 className="h-3.5 w-3.5" /> Link Insertion
                </button>
                <button
                  onClick={() => setSuggestionType("guest-post")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${suggestionType === "guest-post" ? "bg-gray-900 border-gray-900 text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  <FileText className="h-3.5 w-3.5" /> Guest Post
                </button>
              </div>
            )}

            {/* AI info banner */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI-Generated Suggestions
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Pre-filled based on <strong>{suggestionSite?.domain}</strong>'s niche and your project. Edit any field and click "Submit Request" when ready.
              </p>
            </div>

            {/* Link Insertion suggestions */}
            {suggestionType === "link-insertion" && suggestionData && (
              <div className="space-y-4">
                <FormField label="Source URL" required hint="An existing article on their site where your link would fit naturally" error={suggErrors.sourceUrl}>
                  <div className="relative">
                    <input value={suggSourceUrl}
                      onChange={(e) => { setSuggSourceUrl(e.target.value); setSuggErrors((v) => ({ ...v, sourceUrl: undefined })); }}
                      placeholder="https://theirsite.com/some-article" className={`${inputCls} ${suggSourceUrl ? "pr-10" : ""}`} />
                    {suggSourceUrl && (
                      <a href={suggSourceUrl.startsWith("http") ? suggSourceUrl : `https://${suggSourceUrl}`} target="_blank" rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </FormField>
                <FormField label="Anchor Text" required hint="The keyword phrase to use as the clickable link text" error={suggErrors.anchorText}>
                  <input value={suggAnchorText}
                    onChange={(e) => { setSuggAnchorText(e.target.value); setSuggErrors((v) => ({ ...v, anchorText: undefined })); }}
                    placeholder='e.g. "best project management tools"' className={inputCls} />
                </FormField>
                <FormField label="Target URL" required hint="Your page that the link should point to" error={suggErrors.targetUrl}>
                  <div className="relative">
                    <input value={suggTargetUrl}
                      onChange={(e) => { setSuggTargetUrl(e.target.value); setSuggErrors((v) => ({ ...v, targetUrl: undefined })); }}
                      placeholder="https://yoursite.com/your-page" className={`${inputCls} ${suggTargetUrl ? "pr-10" : ""}`} />
                    {suggTargetUrl && (
                      <a href={suggTargetUrl.startsWith("http") ? suggTargetUrl : `https://${suggTargetUrl}`} target="_blank" rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </FormField>
              </div>
            )}

            {/* Guest Post suggestions */}
            {suggestionType === "guest-post" && suggestionData && (
              <div className="space-y-4">
                <FormField label="Blog Title" required hint="A compelling title for your guest post that fits their audience" error={suggErrors.title}>
                  <input value={suggTitle}
                    onChange={(e) => { setSuggTitle(e.target.value); setSuggErrors((v) => ({ ...v, title: undefined })); }}
                    placeholder='e.g. "10 SEO Strategies to Boost Traffic in 2025"' className={inputCls} />
                </FormField>
                <FormField label="Description" required hint="Brief overview of the article to pitch to the publisher" error={suggErrors.description}>
                  <Textarea value={suggDesc}
                    onChange={(e) => { setSuggDesc(e.target.value); setSuggErrors((v) => ({ ...v, description: undefined })); }}
                    placeholder="Describe what the article will cover and why it fits this publisher's audience…"
                    className="min-h-[100px] resize-none" />
                </FormField>

                {/* Writerate integration */}
                <div
                  onClick={() => setUseWriterateSuggestion((v) => !v)}
                  className={`rounded-xl border-2 cursor-pointer transition-all ${useWriterateSuggestion ? "border-blue-400 bg-blue-50/60" : "border-border hover:border-blue-200 hover:bg-blue-50/20"}`}
                >
                  <div className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${useWriterateSuggestion ? "bg-blue-500" : "bg-gray-100"}`}>
                        <PenLine className={`h-[18px] w-[18px] transition-colors ${useWriterateSuggestion ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          Write with Writerate
                          <span className="rounded-full bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none tracking-wide">NEW</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug max-w-[340px]">
                          Let our AI blog writer craft this guest post using the suggested title and description above.
                        </p>
                      </div>
                    </div>
                    <div className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${useWriterateSuggestion ? "bg-blue-500" : "bg-gray-300"}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${useWriterateSuggestion ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Credit offer */}
          {suggestionSite && (() => {
            const minCr = calcLinkCredits(suggestionSite.dr, suggestionSite.da, suggestionSite.traffic, suggestionSite.tf, suggestionSite.spamScore);
            return (
              <div className="shrink-0 px-6 pb-0 pt-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-sm font-semibold text-gray-800">Credits to offer</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSuggCreditOffer(Math.max(minCr, suggCreditOffer - 1))}
                        className="h-7 w-7 rounded-md border border-amber-300 bg-white flex items-center justify-center text-amber-700 hover:bg-amber-50 transition-colors font-bold text-base leading-none">−</button>
                      <input type="number" min={minCr} value={suggCreditOffer}
                        onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) setSuggCreditOffer(Math.max(minCr, val)); }}
                        className="w-16 h-7 rounded-md border border-amber-300 bg-white text-center text-sm font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      <button onClick={() => setSuggCreditOffer(suggCreditOffer + 1)}
                        className="h-7 w-7 rounded-md border border-amber-300 bg-white flex items-center justify-center text-amber-700 hover:bg-amber-50 transition-colors font-bold text-base leading-none">+</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Minimum {minCr} credits based on this site's metrics. Offer more to boost your acceptance rate.</p>
                  {suggCreditOffer > minCr && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      +{suggCreditOffer - minCr} extra credit{suggCreditOffer - minCr > 1 ? "s" : ""} offered — this may improve your chances.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-background mt-4">
            <button onClick={closeSuggestion} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              Close
            </button>
            <button
              onClick={handleSendFromSuggestion}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors flex items-center gap-1.5"
            >
              Submit Request
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Step 1: Site metrics + Choose request type ───────────────────────── */}
      <Dialog open={!!requestSite && requestStep === 1} onOpenChange={(open) => { if (!open) closeRequest(); }}>
        <DialogContent className="w-[560px]">
          <DialogHeader>
            <DialogTitle>Request Backlink</DialogTitle>
            <p className="text-sm text-muted-foreground">{requestSite?.domain}</p>
          </DialogHeader>
          {requestSite && (() => {
            const perDomain = requestSite.responsiveness;
            const overall = ownerOverallResponsiveness(requestSite.domain);
            const spamColor = requestSite.spamScore <= 3 ? "text-green-600" : requestSite.spamScore <= 7 ? "text-amber-500" : "text-red-500";
            return (
              <div className="space-y-4">
                {/* Metrics grid */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Site Metrics</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "DR", value: requestSite.dr },
                      { label: "DA", value: requestSite.da },
                      { label: "TF", value: requestSite.tf },
                      { label: "Traffic", value: fmtNum(requestSite.traffic) },
                      { label: "RD", value: fmtNum(requestSite.rd) },
                      { label: "Spam", value: requestSite.spamScore, color: spamColor },
                      { label: "RefDomains", value: fmtNum(requestSite.ahrefsRefDomains) },
                      { label: "Backlinks", value: fmtNum(requestSite.ahrefsBacklinks) },
                    ].map((m) => (
                      <div key={m.label} className="flex flex-col items-center rounded-lg bg-background border border-border px-2 py-2.5 text-center">
                        <div className="flex items-center gap-0.5 mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                          <MetricInfo metric={m.label} />
                        </div>
                        <span className={`text-sm font-bold ${(m as { color?: string }).color ?? "text-foreground"}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Responsiveness */}
                  <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border">
                    {[
                      { label: "Owner's resp. (all projects)", value: overall },
                      { label: "Owner's resp. (this domain)", value: perDomain },
                    ].map(({ label, value }) => {
                      const color = value >= 75 ? "text-green-600" : value >= 50 ? "text-amber-500" : "text-red-500";
                      const bg = value >= 75 ? "bg-green-500" : value >= 50 ? "bg-amber-400" : "bg-red-500";
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-[10px] text-muted-foreground w-[140px] shrink-0">{label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                            <div className={`h-full rounded-full ${bg}`} style={{ width: `${value}%` }} />
                          </div>
                          <span className={`text-[11px] font-bold ${color}`}>{value}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Request type selection */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose the type of backlink you'd like to request:</p>
                  <div className="flex gap-2">
                    {requestSite.availableLinkInsertion && (
                      <button onClick={() => handleSelectType("link-insertion")}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors">
                        <Link2 className="h-4 w-4 text-gray-600" />
                        Link Insertion
                      </button>
                    )}
                    {requestSite.availableGuestPost && (
                      <button onClick={() => handleSelectType("guest-post")}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-green-50 hover:border-green-400 transition-colors">
                        <FileText className="h-4 w-4 text-green-600" />
                        Guest Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="flex justify-end mt-1">
            <button onClick={closeRequest} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Step 2: Fill request fields ──────────────────────────────────────── */}
      <Dialog open={!!requestSite && requestStep === 2} onOpenChange={(open) => { if (!open) closeRequest(); }}>
        <DialogContent className="w-[580px] max-h-[88vh] flex flex-col overflow-hidden p-0">
          {/* Sticky header — site info + metrics */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border">
            <DialogHeader className="mb-0">
              <DialogTitle className="sr-only">Request</DialogTitle>
            </DialogHeader>
            {requestSite && (
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={`https://www.google.com/s2/favicons?domain=${requestSite.domain}&sz=32`}
                    alt="" className="h-7 w-7 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`https://${requestSite.domain}`} target="_blank" rel="noreferrer"
                      className="text-base font-bold text-foreground hover:underline">
                      {requestSite.domain}
                    </a>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${requestType === "link-insertion" ? "bg-gray-100 text-gray-800 border-gray-300" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {requestType === "link-insertion" ? <Link2 className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {requestType === "link-insertion" ? "Link Insertion" : "Guest Post"}
                    </span>
                  </div>
                  {projectName && (
                    <p className="text-xs text-muted-foreground mt-0.5">↔ Your project: <strong>{projectName}</strong></p>
                  )}
                  {/* Metrics row */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[
                      { label: "DR", value: requestSite.dr },
                      { label: "DA", value: requestSite.da },
                      { label: "TF", value: requestSite.tf },
                      { label: "Traffic", value: fmtNum(requestSite.traffic) },
                      { label: "RD", value: fmtNum(requestSite.rd) },
                      { label: "Spam", value: requestSite.spamScore, color: requestSite.spamScore <= 3 ? "text-green-600" : requestSite.spamScore <= 7 ? "text-amber-500" : "text-red-500" },
                      { label: "RefDomains", value: fmtNum(requestSite.ahrefsRefDomains) },
                      { label: "Backlinks", value: fmtNum(requestSite.ahrefsBacklinks) },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-0.5 rounded-md bg-muted/50 px-2 py-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                        <MetricInfo metric={m.label} />
                        <span className={`text-[11px] font-bold text-foreground ${(m as { color?: string }).color ?? ""}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Responsiveness bars */}
                  <div className="flex flex-col gap-1 mt-1.5">
                    {(() => {
                      const overall2 = ownerOverallResponsiveness(requestSite.domain);
                      const perDomain2 = requestSite.responsiveness;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (all projects)</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${overall2 >= 75 ? "bg-green-500" : overall2 >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${overall2}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold ${overall2 >= 75 ? "text-green-600" : overall2 >= 50 ? "text-amber-500" : "text-red-500"}`}>{overall2}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground w-[120px] shrink-0">Owner's resp. (this domain)</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${perDomain2 >= 75 ? "bg-green-500" : perDomain2 >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                                style={{ width: `${perDomain2}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold ${perDomain2 >= 75 ? "text-green-600" : perDomain2 >= 50 ? "text-amber-500" : "text-red-500"}`}>{perDomain2}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4">
            {/* Guidelines */}
            {requestType === "link-insertion" && requestSite?.guidelinesLinkInsertion && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Publisher Guidelines
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">{requestSite.guidelinesLinkInsertion}</p>
              </div>
            )}
            {requestType === "guest-post" && requestSite?.guidelinesGuestPost && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Publisher Guidelines
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">{requestSite.guidelinesGuestPost}</p>
              </div>
            )}

            {/* Link Insertion fields */}
            {requestType === "link-insertion" && (
              <>
                <FormField label="Source URL" required hint="The URL of their page where you want the link placed" error={reqErrors.sourceUrl}>
                  <div className="relative">
                    <input value={reqSourceUrl}
                      onChange={(e) => { setReqSourceUrl(e.target.value); setReqErrors((v) => ({ ...v, sourceUrl: undefined })); }}
                      placeholder="https://theirsite.com/some-article" className={`${inputCls} ${reqSourceUrl ? "pr-10" : ""}`} />
                    {reqSourceUrl && (
                      <a href={reqSourceUrl.startsWith("http") ? reqSourceUrl : `https://${reqSourceUrl}`} target="_blank" rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </FormField>
                <FormField label="Anchor Text" required hint="The clickable text that will link to your page" error={reqErrors.anchorText}>
                  <input value={reqAnchorText}
                    onChange={(e) => { setReqAnchorText(e.target.value); setReqErrors((v) => ({ ...v, anchorText: undefined })); }}
                    placeholder='e.g. "best project management tools"' className={inputCls} />
                </FormField>
                <FormField label="Target URL" required hint="Your page that the link should point to" error={reqErrors.targetUrl}>
                  <div className="relative">
                    <input value={reqTargetUrl}
                      onChange={(e) => { setReqTargetUrl(e.target.value); setReqErrors((v) => ({ ...v, targetUrl: undefined })); }}
                      placeholder="https://yoursite.com/your-page" className={`${inputCls} ${reqTargetUrl ? "pr-10" : ""}`} />
                    {reqTargetUrl && (
                      <a href={reqTargetUrl.startsWith("http") ? reqTargetUrl : `https://${reqTargetUrl}`} target="_blank" rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </FormField>
                <FormField label="Additional Notes" hint="Any context or special requests for the publisher">
                  <Textarea value={reqDescription} onChange={(e) => setReqDescription(e.target.value)}
                    placeholder="Optional notes for the publisher…" className="min-h-[76px] resize-none" />
                </FormField>
              </>
            )}

            {/* Guest Post fields */}
            {requestType === "guest-post" && (
              <>
                <FormField label="Article Title" required hint="Your proposed title for the guest post" error={reqErrors.title}>
                  <input value={reqTitle}
                    onChange={(e) => { setReqTitle(e.target.value); setReqErrors((v) => ({ ...v, title: undefined })); }}
                    placeholder='e.g. "10 SEO Strategies to Boost Traffic in 2025"' className={inputCls} />
                </FormField>
                <FormField label="Description" required hint="Brief overview of the article's topic, angle, and value to readers" error={reqErrors.description}>
                  <Textarea value={reqDescription}
                    onChange={(e) => { setReqDescription(e.target.value); setReqErrors((v) => ({ ...v, description: undefined })); }}
                    placeholder="Describe what the article will cover and why it fits this publisher's audience…"
                    className="min-h-[100px] resize-none" />
                </FormField>

                {/* Writerate AI writer option */}
                <div
                  onClick={() => setUseWriterate((v) => !v)}
                  className={`rounded-xl border-2 cursor-pointer transition-all ${useWriterate ? "border-blue-400 bg-blue-50/60" : "border-border hover:border-blue-200 hover:bg-blue-50/20"}`}
                >
                  <div className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${useWriterate ? "bg-blue-500" : "bg-gray-100"}`}>
                        <PenLine className={`h-[18px] w-[18px] transition-colors ${useWriterate ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          Use Writerate
                          <span className="rounded-full bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none tracking-wide">NEW</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug max-w-[340px]">
                          Let our AI blog writer craft this guest post for you — based on your title and description above.
                        </p>
                      </div>
                    </div>
                    <div className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${useWriterate ? "bg-blue-500" : "bg-gray-300"}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${useWriterate ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Credit offer */}
            {requestSite && (() => {
              const minCredits = calcLinkCredits(requestSite.dr, requestSite.da, requestSite.traffic, requestSite.tf, requestSite.spamScore);
              return (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-sm font-semibold text-gray-800">Credits to offer</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCreditOffer(Math.max(minCredits, creditOffer - 1))}
                        className="h-7 w-7 rounded-md border border-amber-300 bg-white flex items-center justify-center text-amber-700 hover:bg-amber-50 transition-colors font-bold text-base leading-none"
                      >−</button>
                      <input
                        type="number"
                        min={minCredits}
                        value={creditOffer}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setCreditOffer(Math.max(minCredits, val));
                        }}
                        className="w-16 h-7 rounded-md border border-amber-300 bg-white text-center text-sm font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => setCreditOffer(creditOffer + 1)}
                        className="h-7 w-7 rounded-md border border-amber-300 bg-white flex items-center justify-center text-amber-700 hover:bg-amber-50 transition-colors font-bold text-base leading-none"
                      >+</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Minimum {minCredits} credits based on this site's metrics. Offer more to boost your acceptance rate.</p>
                  {creditOffer > minCredits && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      +{creditOffer - minCredits} extra credit{creditOffer - minCredits > 1 ? "s" : ""} offered — this may improve your chances.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Type switcher at bottom */}
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Switch request type</p>
              <div className="flex gap-2">
                {requestSite?.availableLinkInsertion && (
                  <button onClick={() => { setRequestType("link-insertion"); setReqErrors({}); }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${requestType === "link-insertion" ? "bg-gray-900 border-gray-900 text-white" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    <Link2 className="h-3.5 w-3.5" /> Link Insertion
                  </button>
                )}
                {requestSite?.availableGuestPost && (
                  <button onClick={() => { setRequestType("guest-post"); setReqErrors({}); }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${requestType === "guest-post" ? "bg-gray-900 border-gray-900 text-white" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    <FileText className="h-3.5 w-3.5" /> Guest Post
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-background">
            <button onClick={closeRequest} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmitRequest} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-black/80 transition-colors">
              Submit Request
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
