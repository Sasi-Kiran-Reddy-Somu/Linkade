export interface BacklinkRequest {
  id: string;
  type: "incoming" | "outgoing";
  projectDomain: string;
  externalDomain: string;
  categories: string[];
  language: string;
  countries: string[];
  dr: number;
  da: number;
  traffic: number;
  tf: number;
  rd: number;
  spamScore: number;
  tags: string[];
  requestType: "Link Insertion" | "Guest Post";
  sourceUrl: string;
  // Link Insertion only
  anchorText?: string;
  targetUrl?: string;
  // Guest Post only
  title?: string;
  description: string;
  createdAt: string;
}

export type RequestStatus = "Pending" | "Accepted" | "Rejected" | "On Hold" | "Live";

export function getRequestStatus(id: string): RequestStatus {
  return (localStorage.getItem(`req-status-${id}`) as RequestStatus) ?? "Pending";
}

export function setRequestStatus(id: string, status: RequestStatus): void {
  localStorage.setItem(`req-status-${id}`, status);
}

export function getRequestTAT(id: string): number | null {
  const v = localStorage.getItem(`req-tat-${id}`);
  return v !== null ? Number(v) : null;
}

export function setRequestTAT(id: string, days: number): void {
  localStorage.setItem(`req-tat-${id}`, String(days));
}

export function setRequestAcceptedAt(id: string, isoDate: string): void {
  localStorage.setItem(`req-accepted-at-${id}`, isoDate);
}

export function getRequestAcceptedAt(id: string): string | null {
  return localStorage.getItem(`req-accepted-at-${id}`);
}

/** Returns true if the TAT deadline (acceptedAt + tatDays + 1 buffer day) has passed. */
export function isTATExpired(id: string, createdAt: string): boolean {
  const tat = getRequestTAT(id);
  if (tat === null) return false;
  const acceptedAt = getRequestAcceptedAt(id) ?? createdAt;
  const deadline = new Date(acceptedAt);
  deadline.setDate(deadline.getDate() + Number(tat) + 1);
  return new Date() > deadline;
}

export function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

// ── Static mock requests for the two default projects ─────────────────────────
export const MOCK_REQUESTS: BacklinkRequest[] = [
  // ── Incoming for cubehq.ai (13) ─────────────────────────────────────────────
  { id: "ci-01", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "ahrefs.com", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States", "United Kingdom"], dr: 89, da: 90, traffic: 11200000, tf: 80, rd: 654000, spamScore: 2, tags: ["SEO", "Analytics"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/seo-tools-comparison", anchorText: "Ahrefs", targetUrl: "https://ahrefs.com", description: "Please insert the anchor in the section comparing SEO tools, in the third paragraph.", createdAt: "2026-02-28" },
  { id: "ci-02", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "semrush.com", categories: ["Digital Marketing"], language: "English", countries: ["United States"], dr: 90, da: 91, traffic: 9340000, tf: 78, rd: 580000, spamScore: 1, tags: ["SEO", "B2B"], requestType: "Guest Post", sourceUrl: "https://cubehq.ai/blog/", title: "How to Run a Full Competitor SEO Audit in 30 Minutes", description: "A practical guide covering keyword gap analysis, backlink comparison, and content benchmarking using SEMrush. The article will include actionable steps and screenshots, aimed at marketing managers.", createdAt: "2026-02-25" },
  { id: "ci-03", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "contentkingapp.com", categories: ["Technology", "Digital Marketing", "News & Media"], language: "English", countries: ["Netherlands", "United States", "Germany"], dr: 72, da: 74, traffic: 380000, tf: 55, rd: 42000, spamScore: 4, tags: ["SEO", "Content Marketing"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/real-time-seo-auditing", anchorText: "ContentKing", targetUrl: "https://contentkingapp.com", description: "Insert the link near the mention of real-time SEO audit tools.", createdAt: "2026-02-20" },
  { id: "ci-04", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "clearscope.io", categories: ["Technology", "Digital Marketing"], language: "English", countries: ["United States"], dr: 68, da: 70, traffic: 290000, tf: 52, rd: 34000, spamScore: 3, tags: ["SEO", "Content Marketing"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/content-optimization", anchorText: "Clearscope", targetUrl: "https://clearscope.io", description: "Add our link in the content optimization tools section.", createdAt: "2026-02-18" },
  { id: "ci-05", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "surferseo.com", categories: ["Digital Marketing"], language: "English", countries: ["United States", "Poland"], dr: 74, da: 76, traffic: 620000, tf: 60, rd: 78000, spamScore: 2, tags: ["SEO"], requestType: "Guest Post", sourceUrl: "https://cubehq.ai/blog/", title: "On-Page SEO in 2026: What Still Works and What Doesn't", description: "An updated guide on on-page SEO signals covering NLP-based optimization, content depth, and passage ranking. Will include a practical checklist and data from real SERP experiments.", createdAt: "2026-02-16" },
  { id: "ci-06", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "marketmuse.com", categories: ["Technology", "Digital Marketing"], language: "English", countries: ["United States"], dr: 66, da: 68, traffic: 190000, tf: 48, rd: 21000, spamScore: 3, tags: ["Content Marketing", "AI"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/ai-content-tools", anchorText: "MarketMuse", targetUrl: "https://marketmuse.com", description: "Mention in the AI writing tools comparison.", createdAt: "2026-02-14" },
  { id: "ci-07", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "sitebulb.com", categories: ["Technology"], language: "English", countries: ["United Kingdom", "United States"], dr: 63, da: 65, traffic: 140000, tf: 46, rd: 16000, spamScore: 2, tags: ["SEO", "Technical"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/technical-seo-tools", anchorText: "Sitebulb", targetUrl: "https://sitebulb.com", description: "Add in the technical SEO audit tools section.", createdAt: "2026-02-12" },
  { id: "ci-08", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "nozzle.io", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States"], dr: 57, da: 59, traffic: 80000, tf: 41, rd: 9000, spamScore: 4, tags: ["SEO", "Analytics"], requestType: "Guest Post", sourceUrl: "https://cubehq.ai/blog/", title: "Rank Tracking at Scale: Metrics That Actually Matter", description: "A deep-dive into SERP volatility, tracking frequency, and which rank-tracking KPIs to prioritize for enterprise SEO teams. Includes case studies from mid-size e-commerce brands.", createdAt: "2026-02-10" },
  { id: "ci-09", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "spyfu.com", categories: ["Digital Marketing"], language: "English", countries: ["United States"], dr: 76, da: 78, traffic: 1200000, tf: 62, rd: 130000, spamScore: 3, tags: ["SEO", "Competitive Intelligence"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/competitor-analysis", anchorText: "SpyFu", targetUrl: "https://spyfu.com", description: "Link in the competitor keyword research section.", createdAt: "2026-02-08" },
  { id: "ci-10", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "rankmath.com", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States", "India"], dr: 78, da: 80, traffic: 2400000, tf: 65, rd: 180000, spamScore: 2, tags: ["SEO", "WordPress"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/wordpress-seo-plugins", anchorText: "Rank Math", targetUrl: "https://rankmath.com", description: "Add in the WordPress SEO plugins comparison.", createdAt: "2026-02-06" },
  { id: "ci-11", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "seobility.net", categories: ["Technology"], language: "German", countries: ["Germany", "Austria", "Switzerland"], dr: 64, da: 66, traffic: 340000, tf: 49, rd: 38000, spamScore: 3, tags: ["SEO"], requestType: "Guest Post", sourceUrl: "https://cubehq.ai/blog/", title: "Website-Optimierung für Suchmaschinen: Ein Praxisleitfaden", description: "Ein umfassender deutschsprachiger Leitfaden zur technischen SEO-Optimierung, on-page Faktoren und Core Web Vitals. Zielgruppe: deutschsprachige Webentwickler und Online-Marketer.", createdAt: "2026-02-04" },
  { id: "ci-12", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "wordlift.io", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["Italy", "United States"], dr: 61, da: 63, traffic: 120000, tf: 44, rd: 13000, spamScore: 3, tags: ["SEO", "AI", "Structured Data"], requestType: "Link Insertion", sourceUrl: "https://cubehq.ai/blog/structured-data-seo", anchorText: "WordLift", targetUrl: "https://wordlift.io", description: "Mention in the structured data and schema markup article.", createdAt: "2026-02-02" },
  { id: "ci-13", type: "incoming", projectDomain: "cubehq.ai", externalDomain: "buzzsumo.com", categories: ["Digital Marketing"], language: "English", countries: ["United States", "United Kingdom"], dr: 83, da: 85, traffic: 3200000, tf: 70, rd: 290000, spamScore: 2, tags: ["Content Marketing", "Analytics"], requestType: "Guest Post", sourceUrl: "https://cubehq.ai/blog/", title: "Content Amplification Strategies That Drive Viral Shares", description: "A research-backed article on what makes content shareable in 2026, covering emotional triggers, influencer seeding, and distribution timing. Data sourced from 500+ analyzed campaigns.", createdAt: "2026-01-31" },

  // ── Outgoing from cubehq.ai (11) ─────────────────────────────────────────────
  { id: "co-01", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "techcrunch.com", categories: ["Technology", "Business & Finance"], language: "English", countries: ["United States"], dr: 90, da: 94, traffic: 28450000, tf: 82, rd: 892345, spamScore: 2, tags: ["Startups", "VC & Funding"], requestType: "Link Insertion", sourceUrl: "https://techcrunch.com/2025/12/ai-productivity-tools", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Looking to get a mention in the AI productivity tools comparison article.", createdAt: "2026-02-27" },
  { id: "co-02", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "producthunt.com", categories: ["Technology", "E-commerce & Online Retail"], language: "English", countries: ["United States"], dr: 85, da: 86, traffic: 5600000, tf: 70, rd: 412000, spamScore: 3, tags: ["Startups"], requestType: "Guest Post", sourceUrl: "https://producthunt.com/stories/", title: "How We Built Cube HQ: A Maker's Story", description: "A behind-the-scenes maker story covering our product journey from idea to launch, including technical decisions, growth hacks, and lessons learned. Aimed at the Product Hunt indie maker community.", createdAt: "2026-02-24" },
  { id: "co-03", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "indiehackers.com", categories: ["Business & Finance", "Technology"], language: "English", countries: ["United States"], dr: 79, da: 80, traffic: 1840000, tf: 62, rd: 185000, spamScore: 4, tags: ["Startups", "B2B"], requestType: "Link Insertion", sourceUrl: "https://indiehackers.com/interviews/", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Requesting a mention in relevant product discussions or founder interviews.", createdAt: "2026-02-21" },
  { id: "co-04", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "venturebeat.com", categories: ["Technology", "Business & Finance"], language: "English", countries: ["United States"], dr: 87, da: 89, traffic: 8900000, tf: 76, rd: 540000, spamScore: 2, tags: ["AI", "Startups"], requestType: "Link Insertion", sourceUrl: "https://venturebeat.com/category/ai/", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Requesting mention in AI tools coverage.", createdAt: "2026-02-19" },
  { id: "co-05", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "wired.com", categories: ["Technology", "News & Media"], language: "English", countries: ["United States", "United Kingdom"], dr: 91, da: 93, traffic: 31000000, tf: 85, rd: 1200000, spamScore: 1, tags: ["Technology"], requestType: "Guest Post", sourceUrl: "https://wired.com/category/business/", title: "The Quiet Revolution: How AI Is Reshaping Team Productivity", description: "An editorial piece exploring how AI-native tools are changing how modern teams collaborate, make decisions, and manage workflows — written from the perspective of a founder who built one.", createdAt: "2026-02-17" },
  { id: "co-06", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "inc.com", categories: ["Business & Finance"], language: "English", countries: ["United States"], dr: 88, da: 90, traffic: 14500000, tf: 79, rd: 720000, spamScore: 2, tags: ["B2B", "Startups"], requestType: "Link Insertion", sourceUrl: "https://inc.com/best-tools-for-startups", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Request for inclusion in the startup tools roundup.", createdAt: "2026-02-15" },
  { id: "co-07", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "entrepreneur.com", categories: ["Business & Finance"], language: "English", countries: ["United States"], dr: 88, da: 90, traffic: 12000000, tf: 78, rd: 680000, spamScore: 2, tags: ["Entrepreneurship", "B2B"], requestType: "Guest Post", sourceUrl: "https://entrepreneur.com/growing-a-business/", title: "5 Remote Work Rituals That Actually Help Distributed Teams Ship Faster", description: "A practical guide on async communication rituals, documentation habits, and meeting cadences that help remote teams stay aligned without burning out. Based on real workflows from 3 fully-remote startups.", createdAt: "2026-02-13" },
  { id: "co-08", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "thenextweb.com", categories: ["Technology", "Business & Finance"], language: "English", countries: ["Netherlands", "United States"], dr: 84, da: 86, traffic: 7200000, tf: 72, rd: 460000, spamScore: 3, tags: ["Technology", "Startups"], requestType: "Link Insertion", sourceUrl: "https://thenextweb.com/tools/", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Mention in productivity tools coverage.", createdAt: "2026-02-11" },
  { id: "co-09", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "g2.com", categories: ["Technology", "E-commerce & Online Retail"], language: "English", countries: ["United States"], dr: 82, da: 84, traffic: 5800000, tf: 68, rd: 390000, spamScore: 3, tags: ["B2B", "SaaS"], requestType: "Link Insertion", sourceUrl: "https://g2.com/categories/project-management", anchorText: "Cube HQ", targetUrl: "https://cubehq.ai", description: "Requesting category listing and mention in comparison articles.", createdAt: "2026-02-09" },
  { id: "co-10", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "capterra.com", categories: ["Technology"], language: "English", countries: ["United States"], dr: 83, da: 85, traffic: 6100000, tf: 69, rd: 410000, spamScore: 2, tags: ["SaaS", "B2B"], requestType: "Link Insertion", sourceUrl: "https://capterra.com/project-management-software/", anchorText: "Cube", targetUrl: "https://cubehq.ai", description: "Requesting inclusion in the project management software listings.", createdAt: "2026-02-07" },
  { id: "co-11", type: "outgoing", projectDomain: "cubehq.ai", externalDomain: "mashable.com", categories: ["Technology", "Digital Marketing"], language: "English", countries: ["United States"], dr: 86, da: 88, traffic: 9800000, tf: 74, rd: 580000, spamScore: 3, tags: ["Technology"], requestType: "Guest Post", sourceUrl: "https://mashable.com/category/business/", title: "Why the Future of Work Is Asynchronous (And How to Prepare)", description: "A thought-leadership piece arguing for the long-term shift to async work culture, with practical frameworks for managers making the transition. Includes survey data from 1,200 knowledge workers.", createdAt: "2026-02-05" },

  // ── Incoming for justwhatworks.com (15) ──────────────────────────────────────
  { id: "ji-01", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "neilpatel.com", categories: ["Digital Marketing", "Business & Finance"], language: "English", countries: ["United States", "Canada", "Australia"], dr: 86, da: 87, traffic: 6200000, tf: 71, rd: 320000, spamScore: 3, tags: ["Blogging", "Content Marketing"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/growth-hacking-strategies", anchorText: "Neil Patel", targetUrl: "https://neilpatel.com", description: "Mention in the list of recommended marketing blogs in section 2.", createdAt: "2026-02-22" },
  { id: "ji-02", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "backlinko.com", categories: ["Digital Marketing"], language: "English", countries: ["United States"], dr: 77, da: 78, traffic: 2150000, tf: 65, rd: 198000, spamScore: 3, tags: ["SEO", "Blogging"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "The Link Building Playbook: Strategies That Still Work in 2026", description: "A comprehensive breakdown of white-hat link building strategies including HARO, digital PR, and content-led outreach. Includes email templates and response rate benchmarks from 6 months of campaigns.", createdAt: "2026-02-18" },
  { id: "ji-03", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "bloggerspassion.com", categories: ["Digital Marketing", "Educational"], language: "English", countries: ["India"], dr: 62, da: 64, traffic: 520000, tf: 45, rd: 28000, spamScore: 7, tags: ["Blogging"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/best-blogging-tools", anchorText: "Bloggers Passion", targetUrl: "https://bloggerspassion.com", description: "Add link in the 'Recommended Reading' section at the bottom of the article.", createdAt: "2026-02-15" },
  { id: "ji-04", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "searchenginejournal.com", categories: ["Digital Marketing", "News & Media"], language: "English", countries: ["United States"], dr: 85, da: 86, traffic: 4800000, tf: 72, rd: 340000, spamScore: 2, tags: ["SEO", "Content Marketing"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/seo-checklist", anchorText: "Search Engine Journal", targetUrl: "https://searchenginejournal.com", description: "Reference in the SEO resources section.", createdAt: "2026-02-13" },
  { id: "ji-05", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "searchengineland.com", categories: ["Digital Marketing", "News & Media"], language: "English", countries: ["United States"], dr: 84, da: 86, traffic: 4200000, tf: 71, rd: 310000, spamScore: 2, tags: ["SEO", "PPC"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "Local SEO for Small Businesses: A Step-by-Step 2026 Guide", description: "A tactical guide covering Google Business Profile optimization, local citation building, and review generation specifically for small business owners. Includes a downloadable checklist.", createdAt: "2026-02-11" },
  { id: "ji-06", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "contentmarketinginstitute.com", categories: ["Digital Marketing", "Educational"], language: "English", countries: ["United States"], dr: 80, da: 82, traffic: 3100000, tf: 68, rd: 260000, spamScore: 2, tags: ["Content Marketing"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/content-strategy-guide", anchorText: "Content Marketing Institute", targetUrl: "https://contentmarketinginstitute.com", description: "Reference as a leading content marketing resource.", createdAt: "2026-02-09" },
  { id: "ji-07", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "copyblogger.com", categories: ["Digital Marketing", "Educational"], language: "English", countries: ["United States"], dr: 79, da: 80, traffic: 980000, tf: 64, rd: 200000, spamScore: 3, tags: ["Blogging", "Copywriting"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "How to Write SaaS Landing Pages That Actually Convert", description: "A breakdown of high-converting SaaS landing page formulas, covering headline structures, social proof placement, and CTA psychology. Includes before/after rewrites of 3 real pages.", createdAt: "2026-02-07" },
  { id: "ji-08", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "crazyegg.com", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States"], dr: 78, da: 79, traffic: 1400000, tf: 63, rd: 190000, spamScore: 3, tags: ["CRO", "Analytics"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/conversion-optimization", anchorText: "Crazy Egg", targetUrl: "https://crazyegg.com", description: "Add reference to heatmap and A/B testing tools section.", createdAt: "2026-02-05" },
  { id: "ji-09", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "optinmonster.com", categories: ["Digital Marketing"], language: "English", countries: ["United States"], dr: 80, da: 82, traffic: 2800000, tf: 67, rd: 240000, spamScore: 2, tags: ["Lead Generation", "Email Marketing"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/lead-generation-tools", anchorText: "OptinMonster", targetUrl: "https://optinmonster.com", description: "Include in the list of top lead generation tools.", createdAt: "2026-02-03" },
  { id: "ji-10", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "convinceandconvert.com", categories: ["Digital Marketing"], language: "English", countries: ["United States"], dr: 75, da: 76, traffic: 860000, tf: 60, rd: 160000, spamScore: 3, tags: ["Content Marketing", "Social Media"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "Building a Social Media Content Calendar That Actually Gets Used", description: "A practical guide to creating sustainable social content calendars with templates, approval workflows, and batching strategies. Includes a free Notion template readers can duplicate.", createdAt: "2026-02-01" },
  { id: "ji-11", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "marketingprofs.com", categories: ["Digital Marketing", "Educational"], language: "English", countries: ["United States"], dr: 73, da: 75, traffic: 720000, tf: 58, rd: 140000, spamScore: 3, tags: ["Marketing", "B2B"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/b2b-marketing-guide", anchorText: "MarketingProfs", targetUrl: "https://marketingprofs.com", description: "Reference in B2B marketing resources section.", createdAt: "2026-01-30" },
  { id: "ji-12", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "digitalmarketer.com", categories: ["Digital Marketing", "Educational"], language: "English", countries: ["United States"], dr: 74, da: 76, traffic: 1100000, tf: 60, rd: 155000, spamScore: 3, tags: ["Digital Marketing", "Funnel"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "The Modern Marketing Funnel: From Awareness to Advocacy", description: "A deep-dive into full-funnel marketing strategy adapted for 2026 buyer journeys, including dark social attribution, community-led growth, and retention loops. Includes a funnel audit framework.", createdAt: "2026-01-28" },
  { id: "ji-13", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "hubspot.com", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States", "United Kingdom"], dr: 92, da: 93, traffic: 22000000, tf: 84, rd: 980000, spamScore: 1, tags: ["CRM", "Inbound Marketing"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/crm-comparison", anchorText: "HubSpot", targetUrl: "https://hubspot.com", description: "Mention in the CRM tools comparison article.", createdAt: "2026-01-26" },
  { id: "ji-14", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "moz.com", categories: ["Digital Marketing", "Technology"], language: "English", countries: ["United States"], dr: 91, da: 92, traffic: 5200000, tf: 77, rd: 490000, spamScore: 2, tags: ["SEO", "Analytics"], requestType: "Link Insertion", sourceUrl: "https://justwhatworks.com/seo-tools-review", anchorText: "Moz", targetUrl: "https://moz.com", description: "Add in the SEO tools review article.", createdAt: "2026-01-24" },
  { id: "ji-15", type: "incoming", projectDomain: "justwhatworks.com", externalDomain: "socialmediaexaminer.com", categories: ["Digital Marketing", "News & Media"], language: "English", countries: ["United States"], dr: 81, da: 83, traffic: 3400000, tf: 69, rd: 275000, spamScore: 2, tags: ["Social Media"], requestType: "Guest Post", sourceUrl: "https://justwhatworks.com/blog/", title: "Scheduling vs. Spontaneity: Finding the Right Balance for Social Media", description: "An evidence-based look at how brands perform when mixing scheduled content with real-time reactive posts. Covers platform-specific strategies for Instagram, LinkedIn, and X/Twitter.", createdAt: "2026-01-22" },

  // ── Outgoing from justwhatworks.com (14) ─────────────────────────────────────
  { id: "jo-01", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "sitepoint.com", categories: ["Technology", "Educational"], language: "English", countries: ["Australia", "United Kingdom"], dr: 83, da: 84, traffic: 2900000, tf: 68, rd: 265000, spamScore: 2, tags: ["Development", "Web Design"], requestType: "Link Insertion", sourceUrl: "https://sitepoint.com/productivity-tools-for-developers/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Requesting link insertion in the productivity tools article.", createdAt: "2026-02-26" },
  { id: "jo-02", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "smashingmagazine.com", categories: ["Technology", "Digital Marketing"], language: "English", countries: ["Germany", "United States"], dr: 88, da: 90, traffic: 3850000, tf: 72, rd: 310000, spamScore: 2, tags: ["Web Design", "Content Marketing"], requestType: "Guest Post", sourceUrl: "https://smashingmagazine.com/articles/", title: "No-Code Tools for Designers: What's Actually Worth Using in 2026", description: "An honest review of the no-code landscape for designers, covering Webflow, Framer, and emerging tools. Focuses on real-world use cases, limitations, and when to hand off to developers.", createdAt: "2026-02-19" },
  { id: "jo-03", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "css-tricks.com", categories: ["Technology"], language: "English", countries: ["United States"], dr: 86, da: 88, traffic: 4200000, tf: 74, rd: 380000, spamScore: 3, tags: ["Development", "Web Design"], requestType: "Link Insertion", sourceUrl: "https://css-tricks.com/guides/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Requesting mention in guides about modern web development tools.", createdAt: "2026-02-16" },
  { id: "jo-04", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "alistapart.com", categories: ["Technology", "Educational"], language: "English", countries: ["United States"], dr: 82, da: 84, traffic: 1100000, tf: 67, rd: 280000, spamScore: 2, tags: ["Web Design", "UX"], requestType: "Guest Post", sourceUrl: "https://alistapart.com/articles/", title: "Designing for Trust: How UX Decisions Shape User Confidence", description: "An exploration of how micro-interactions, transparency patterns, and visual hierarchy influence perceived trustworthiness in digital products. Includes annotated case studies from fintech and health apps.", createdAt: "2026-02-14" },
  { id: "jo-05", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "webdesignerdepot.com", categories: ["Technology"], language: "English", countries: ["United States", "United Kingdom"], dr: 76, da: 78, traffic: 1600000, tf: 62, rd: 195000, spamScore: 3, tags: ["Web Design"], requestType: "Link Insertion", sourceUrl: "https://webdesignerdepot.com/tools/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Mention in the web design tools roundup.", createdAt: "2026-02-12" },
  { id: "jo-06", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "creativebloq.com", categories: ["Technology", "Arts & Culture"], language: "English", countries: ["United Kingdom", "United States"], dr: 80, da: 82, traffic: 2400000, tf: 66, rd: 235000, spamScore: 3, tags: ["Design", "Creative"], requestType: "Link Insertion", sourceUrl: "https://creativebloq.com/features/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Reference in creative productivity tools article.", createdAt: "2026-02-10" },
  { id: "jo-07", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "speckyboy.com", categories: ["Technology"], language: "English", countries: ["United States"], dr: 71, da: 73, traffic: 820000, tf: 56, rd: 115000, spamScore: 4, tags: ["Web Design", "Development"], requestType: "Guest Post", sourceUrl: "https://speckyboy.com/articles/", title: "The No-Code Designer's Toolkit: 12 Tools Reviewed Honestly", description: "A no-fluff roundup of the most useful no-code tools for designers in 2026, categorized by use case with honest pros/cons. Based on 90 days of hands-on testing across client projects.", createdAt: "2026-02-08" },
  { id: "jo-08", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "codrops.com", categories: ["Technology"], language: "English", countries: ["Germany", "United States"], dr: 79, da: 81, traffic: 1900000, tf: 64, rd: 220000, spamScore: 2, tags: ["Development", "Design"], requestType: "Link Insertion", sourceUrl: "https://codrops.com/category/tutorials/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Mention in the frontend tools and resources article.", createdAt: "2026-02-06" },
  { id: "jo-09", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "awwwards.com", categories: ["Technology", "Arts & Culture"], language: "English", countries: ["Spain", "United States"], dr: 84, da: 86, traffic: 3600000, tf: 70, rd: 340000, spamScore: 2, tags: ["Web Design", "Creative"], requestType: "Link Insertion", sourceUrl: "https://awwwards.com/blog/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Reference in the web design tools and resources.", createdAt: "2026-02-04" },
  { id: "jo-10", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "designmodo.com", categories: ["Technology", "Digital Marketing"], language: "English", countries: ["United States"], dr: 74, da: 76, traffic: 950000, tf: 59, rd: 145000, spamScore: 3, tags: ["Web Design", "UI"], requestType: "Guest Post", sourceUrl: "https://designmodo.com/articles/", title: "UI Patterns That Boost Conversion: A Data-Driven Analysis", description: "An analysis of 50 high-converting web interfaces, identifying the most impactful UI patterns for e-commerce, SaaS, and service businesses. Includes annotated screenshots and implementation notes.", createdAt: "2026-02-02" },
  { id: "jo-11", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "uxplanet.org", categories: ["Technology", "Educational"], language: "English", countries: ["United States"], dr: 73, da: 75, traffic: 680000, tf: 57, rd: 125000, spamScore: 3, tags: ["UX", "Design"], requestType: "Link Insertion", sourceUrl: "https://uxplanet.org/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Mention in UX tools and resources article.", createdAt: "2026-01-31" },
  { id: "jo-12", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "webflow.com", categories: ["Technology"], language: "English", countries: ["United States"], dr: 86, da: 88, traffic: 9200000, tf: 73, rd: 560000, spamScore: 2, tags: ["No-code", "Web Design"], requestType: "Link Insertion", sourceUrl: "https://webflow.com/blog/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Requesting mention in the no-code tools blog post.", createdAt: "2026-01-29" },
  { id: "jo-13", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "nocode.tech", categories: ["Technology"], language: "English", countries: ["United States", "United Kingdom"], dr: 65, da: 67, traffic: 380000, tf: 50, rd: 68000, spamScore: 3, tags: ["No-code"], requestType: "Guest Post", sourceUrl: "https://nocode.tech/articles/", title: "From Idea to Live Product Without Writing a Line of Code", description: "A founder-focused walkthrough of building and launching a web product using only no-code tools. Covers tool selection, common pitfalls, and how to decide when to hire a developer.", createdAt: "2026-01-27" },
  { id: "jo-14", type: "outgoing", projectDomain: "justwhatworks.com", externalDomain: "nngroup.com", categories: ["Technology", "Educational"], language: "English", countries: ["United States"], dr: 81, da: 83, traffic: 2100000, tf: 67, rd: 250000, spamScore: 2, tags: ["UX", "Research"], requestType: "Link Insertion", sourceUrl: "https://nngroup.com/articles/", anchorText: "JustWhatWorks", targetUrl: "https://justwhatworks.com", description: "Reference in the user research tools article.", createdAt: "2026-01-25" },
];

// ── Dynamic request generation for any project ────────────────────────────────
const GEN_POOL = [
  { domain: "techcrunch.com",       da: 94, dr: 90, tf: 82, traffic: 28450000, rd: 892000, spamScore: 2, categories: ["Technology","Business & Finance"], countries: ["United States"],                tags: ["Startups","AI"] },
  { domain: "hubspot.com",          da: 93, dr: 92, tf: 79, traffic: 15200000, rd: 654000, spamScore: 1, categories: ["Digital Marketing","Technology"], countries: ["United States"],               tags: ["B2B","CRM"] },
  { domain: "moz.com",              da: 92, dr: 91, tf: 77, traffic: 5340000,  rd: 412000, spamScore: 3, categories: ["Digital Marketing"],             countries: ["United States"],               tags: ["SEO","Analytics"] },
  { domain: "smashingmagazine.com", da: 90, dr: 88, tf: 72, traffic: 3850000,  rd: 310000, spamScore: 2, categories: ["Technology","Design"],            countries: ["Germany","United States"],      tags: ["Web Design","Development"] },
  { domain: "copyblogger.com",      da: 83, dr: 82, tf: 65, traffic: 1240000,  rd: 198000, spamScore: 5, categories: ["Digital Marketing"],             countries: ["United States"],               tags: ["Content Marketing","Blogging"] },
  { domain: "searchenginejournal.com", da: 88, dr: 87, tf: 70, traffic: 4120000, rd: 285000, spamScore: 4, categories: ["Digital Marketing"], countries: ["United States","India","Canada"], tags: ["SEO","Content Marketing"] },
  { domain: "entrepreneur.com",     da: 90, dr: 88, tf: 78, traffic: 12000000, rd: 680000, spamScore: 2, categories: ["Business & Finance"],            countries: ["United States"],               tags: ["Entrepreneurship","B2B"] },
  { domain: "inc.com",              da: 90, dr: 88, tf: 79, traffic: 14500000, rd: 720000, spamScore: 2, categories: ["Business & Finance"],            countries: ["United States"],               tags: ["B2B","Startups"] },
  { domain: "wired.com",            da: 93, dr: 91, tf: 85, traffic: 31000000, rd: 1200000, spamScore: 1, categories: ["Technology","News & Media"],    countries: ["United States","United Kingdom"], tags: ["Technology"] },
  { domain: "forbes.com",           da: 95, dr: 93, tf: 84, traffic: 72000000, rd: 2100000, spamScore: 2, categories: ["Business & Finance","News & Media"], countries: ["United States"],         tags: ["Finance","Entrepreneurship"] },
  { domain: "medium.com",           da: 96, dr: 93, tf: 76, traffic: 180000000, rd: 4200000, spamScore: 3, categories: ["Technology","Digital Marketing"], countries: ["United States","India"],   tags: ["Blogging","B2B"] },
  { domain: "producthunt.com",      da: 86, dr: 85, tf: 70, traffic: 5600000,  rd: 412000, spamScore: 3, categories: ["Technology"],                    countries: ["United States"],               tags: ["Startups","SaaS"] },
  { domain: "indiehackers.com",     da: 80, dr: 79, tf: 62, traffic: 1840000,  rd: 185000, spamScore: 4, categories: ["Business & Finance","Technology"], countries: ["United States"],            tags: ["Startups","B2B"] },
  { domain: "sitepoint.com",        da: 84, dr: 83, tf: 68, traffic: 2900000,  rd: 265000, spamScore: 2, categories: ["Technology","Educational"],       countries: ["Australia","United Kingdom"], tags: ["Development","Web Design"] },
  { domain: "css-tricks.com",       da: 88, dr: 86, tf: 74, traffic: 4200000,  rd: 380000, spamScore: 3, categories: ["Technology"],                    countries: ["United States"],               tags: ["Development","Web Design"] },
  { domain: "ahrefs.com",           da: 90, dr: 89, tf: 80, traffic: 11200000, rd: 654000, spamScore: 2, categories: ["Digital Marketing","Technology"], countries: ["United States","United Kingdom"], tags: ["SEO","Analytics"] },
  { domain: "semrush.com",          da: 91, dr: 90, tf: 78, traffic: 9340000,  rd: 580000, spamScore: 1, categories: ["Digital Marketing"],             countries: ["United States"],               tags: ["SEO","B2B"] },
  { domain: "backlinko.com",        da: 78, dr: 77, tf: 65, traffic: 2150000,  rd: 198000, spamScore: 3, categories: ["Digital Marketing"],             countries: ["United States"],               tags: ["SEO","Blogging"] },
  { domain: "neilpatel.com",        da: 87, dr: 86, tf: 71, traffic: 6200000,  rd: 320000, spamScore: 3, categories: ["Digital Marketing","Business & Finance"], countries: ["United States","Canada","Australia"], tags: ["Blogging","Content Marketing"] },
  { domain: "venturebeat.com",      da: 89, dr: 87, tf: 76, traffic: 8900000,  rd: 540000, spamScore: 2, categories: ["Technology","Business & Finance"], countries: ["United States"],            tags: ["AI","Startups"] },
  { domain: "thenextweb.com",       da: 86, dr: 84, tf: 72, traffic: 7200000,  rd: 460000, spamScore: 3, categories: ["Technology","Business & Finance"], countries: ["Netherlands","United States"], tags: ["Technology","Startups"] },
  { domain: "webdesignerdepot.com", da: 78, dr: 76, tf: 62, traffic: 1600000,  rd: 195000, spamScore: 3, categories: ["Technology"],                    countries: ["United States","United Kingdom"], tags: ["Web Design"] },
  { domain: "fitnessblender.com",   da: 78, dr: 77, tf: 58, traffic: 3200000,  rd: 142000, spamScore: 3, categories: ["Health & Fitness"],              countries: ["United States","Australia"],    tags: ["Fitness","Workouts"] },
  { domain: "tripadvisor.com",      da: 94, dr: 92, tf: 79, traffic: 95000000, rd: 1800000, spamScore: 2, categories: ["Travel & Tourism"],            countries: ["United States","United Kingdom"], tags: ["Travel","Reviews"] },
  { domain: "g2.com",               da: 84, dr: 82, tf: 68, traffic: 5800000,  rd: 390000, spamScore: 3, categories: ["Technology"],                    countries: ["United States"],               tags: ["SaaS","B2B"] },
];

const GEN_TITLES_IN = [
  "The Complete Guide to [NICHE] for Beginners",
  "10 Proven Strategies to Grow Your [NICHE] in 2026",
  "How We Scaled Our [NICHE] Blog to 100k Monthly Readers",
  "Why Most [NICHE] Tactics Fail (And What to Do Instead)",
  "The [NICHE] Playbook: From Zero to Authority in 90 Days",
  "Expert Roundup: Top [NICHE] Insights for 2026",
  "The Hidden [NICHE] Mistakes Costing You Traffic",
  "A Step-by-Step [NICHE] Framework That Actually Works",
  "Case Study: How We Used [NICHE] to Triple Our Leads",
  "The Future of [NICHE]: Trends and Predictions for 2026",
];

const GEN_TITLES_OUT = [
  "Building a Successful [NICHE] Strategy From Scratch",
  "What Nobody Tells You About [NICHE] (But Should)",
  "The Definitive [NICHE] Checklist for 2026",
  "How to Audit Your [NICHE] in Under an Hour",
  "5 [NICHE] Lessons Learned the Hard Way",
  "The [NICHE] Metrics That Actually Matter",
  "Advanced [NICHE] Tactics for Experienced Teams",
  "Why [NICHE] Is Changing Faster Than You Think",
];

const GEN_ANCHORS = [
  "top SEO tools",
  "content marketing strategies",
  "link building techniques",
  "keyword research guide",
  "digital marketing best practices",
  "on-page SEO checklist",
  "backlink outreach tactics",
  "search engine optimization tips",
  "organic traffic growth strategies",
  "technical SEO fundamentals",
  "conversion rate optimization",
  "email marketing automation",
];
const GEN_DESCS_LI_IN = [
  "Please insert the anchor in the section where this topic is first discussed in detail.",
  "Add the link near the relevant tool or resource mention in the comparison section.",
  "Include the anchor in the introductory paragraph where this subject is introduced.",
  "Place the link in the resources or further reading section at the bottom of the article.",
  "Insert the anchor next to the related strategy mention in the middle of the piece.",
];
const GEN_DESCS_GUESTPOST_IN = [
  "A comprehensive guide covering proven strategies with real-world examples and actionable takeaways. Includes step-by-step implementation advice, data-backed insights from industry benchmarks, and a practical framework readers can apply immediately.",
  "An in-depth breakdown of advanced techniques that go beyond the basics. Features annotated case studies, expert commentary, and a practical checklist for professionals looking to improve their results in this space.",
  "A research-driven analysis of what separates high performers from the rest. Includes before-and-after comparisons, data from real campaigns, and a downloadable audit framework. Aimed at intermediate to advanced practitioners.",
  "A tactical walkthrough structured around common mistakes and how to avoid them. Uses accessible language, clear section breakdowns, and supplementary examples to make complex concepts approachable for a broad audience.",
  "An evidence-based look at emerging trends and their practical implications. The article combines original research with expert interviews, covering platform-specific strategies and how to adapt quickly to industry shifts.",
  "A beginner-friendly deep dive into a fast-evolving topic, explaining core concepts clearly before building up to advanced strategies. Includes a glossary, FAQ section, and real examples from brands that have succeeded with this approach.",
];
const GEN_DESCS_OUT = [
  "Looking to get a mention in a relevant article on your site.",
  "Requesting a contextual link from one of your high-traffic guides.",
  "We'd love to be referenced in your upcoming content about this topic.",
  "Seeking inclusion in your resource roundup for our target audience.",
  "This guest post will deliver genuine value to your readers while including a contextual link back to us.",
];

function hashStr(s: string): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b9);
  }
  return Math.abs(h >>> 0);
}

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0);
}

export function generateRequestsForDomain(projectDomain: string): BacklinkRequest[] {
  const requests: BacklinkRequest[] = [];
  let seed = hashStr(projectDomain);

  const pick = <T>(arr: T[]): T => {
    seed = lcg(seed);
    return arr[seed % arr.length];
  };

  const pickInt = (min: number, max: number): number => {
    seed = lcg(seed);
    return min + (seed % (max - min + 1));
  };

  const niche = projectDomain.split(".")[0].replace(/-/g, " ");

  // 10 incoming
  const usedIn = new Set<number>();
  for (let i = 0; i < 10; i++) {
    let poolIdx: number;
    do { seed = lcg(seed); poolIdx = seed % GEN_POOL.length; } while (usedIn.has(poolIdx));
    usedIn.add(poolIdx);
    const site = GEN_POOL[poolIdx];
    const isGuestPost = i % 3 === 1;
    const rawTitle = pick(GEN_TITLES_IN).replace("[NICHE]", niche);
    const months = ["2026-01","2026-02","2026-03"];
    const day = String(pickInt(1, 28)).padStart(2, "0");
    requests.push({
      id: `gen-${projectDomain}-in-${i}`,
      type: "incoming",
      projectDomain,
      externalDomain: site.domain,
      categories: site.categories,
      language: "English",
      countries: site.countries,
      dr: site.dr, da: site.da, tf: site.tf, traffic: site.traffic, rd: site.rd, spamScore: site.spamScore,
      tags: site.tags,
      requestType: isGuestPost ? "Guest Post" : "Link Insertion",
      sourceUrl: `https://${projectDomain}/blog/`,
      ...(isGuestPost ? { title: rawTitle } : { anchorText: pick(GEN_ANCHORS), targetUrl: `https://${site.domain}` }),
      description: isGuestPost ? pick(GEN_DESCS_GUESTPOST_IN) : pick(GEN_DESCS_LI_IN),
      createdAt: `${pick(months)}-${day}`,
    });
  }

  // 9 outgoing
  const usedOut = new Set<number>();
  for (let i = 0; i < 9; i++) {
    let poolIdx: number;
    do { seed = lcg(seed); poolIdx = seed % GEN_POOL.length; } while (usedOut.has(poolIdx));
    usedOut.add(poolIdx);
    const site = GEN_POOL[poolIdx];
    const isGuestPost = i % 3 === 2;
    const rawTitle = pick(GEN_TITLES_OUT).replace("[NICHE]", niche);
    const months = ["2026-01","2026-02","2026-03"];
    const day = String(pickInt(1, 28)).padStart(2, "0");
    requests.push({
      id: `gen-${projectDomain}-out-${i}`,
      type: "outgoing",
      projectDomain,
      externalDomain: site.domain,
      categories: site.categories,
      language: "English",
      countries: site.countries,
      dr: site.dr, da: site.da, tf: site.tf, traffic: site.traffic, rd: site.rd, spamScore: site.spamScore,
      tags: site.tags,
      requestType: isGuestPost ? "Guest Post" : "Link Insertion",
      sourceUrl: `https://${site.domain}/articles/`,
      ...(isGuestPost ? { title: rawTitle, description: pick(GEN_DESCS_OUT) } : { anchorText: projectDomain.split(".")[0], targetUrl: `https://${projectDomain}`, description: pick(GEN_DESCS_OUT) }),
      description: pick(GEN_DESCS_OUT),
      createdAt: `${pick(months)}-${day}`,
    });
  }

  return requests;
}

/** Returns requests for any project — static data for the defaults, generated for others */
export function getProjectRequests(projectDomain: string): BacklinkRequest[] {
  const existing = MOCK_REQUESTS.filter((r) => r.projectDomain === projectDomain);
  return existing.length > 0 ? existing : generateRequestsForDomain(projectDomain);
}

/** Returns ALL requests across all given project domains */
export function getAllRequests(type: "incoming" | "outgoing", projectDomains: string[]): BacklinkRequest[] {
  return projectDomains.flatMap((d) => getProjectRequests(d).filter((r) => r.type === type));
}
