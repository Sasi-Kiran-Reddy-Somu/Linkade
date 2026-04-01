const TAXONOMY: Record<string, string[]> = {
  "Technology":                  ["SaaS/Software", "Web Dev", "AI/ML", "DevOps", "Open Source", "Cybersecurity", "Mobile Apps", "Cloud Computing", "APIs", "Programming"],
  "Finance":                     ["Personal Finance", "Investing", "FinTech", "Crypto", "Accounting", "Stock Trading", "Budgeting", "Banking", "Insurance", "Real Estate Finance"],
  "Health & Fitness":            ["Nutrition", "Workout", "Mental Health", "Yoga", "Weight Loss", "Wellness", "Running", "Diet Tips", "Supplements", "Sports"],
  "Marketing & SEO":             ["SEO", "Content Marketing", "Social Media", "Email Marketing", "PPC", "Link Building", "Analytics", "CRO", "Affiliate Marketing", "Branding"],
  "Travel":                      ["Adventure Travel", "Budget Travel", "Destinations", "Digital Nomad", "Solo Travel", "Road Trips", "Hotels", "Luxury Travel", "Travel Hacks", "Airlines"],
  "Food & Lifestyle":            ["Recipes", "Vegan", "Cooking Tips", "Restaurants", "Meal Prep", "Wine", "Coffee", "Baking", "Healthy Eating", "Home Decor"],
  "Education":                   ["Online Learning", "Study Tips", "E-learning", "Tutoring", "Languages", "STEM", "Career Growth", "Certifications", "EdTech", "Higher Ed"],
  "E-commerce":                  ["Dropshipping", "Amazon FBA", "Shopify", "Product Reviews", "Fashion", "Retail", "Print on Demand", "Wholesale", "Logistics", "DTC Brands"],
  "Gaming":                      ["PC Gaming", "Console Gaming", "Mobile Gaming", "Esports", "Game Reviews", "Streaming", "RPG", "FPS", "Indie Games", "Game Dev"],
  "Business & Entrepreneurship": ["Startups", "Growth Hacking", "Productivity", "B2B", "Strategy", "Leadership", "Sales", "Networking", "Freelancing", "Remote Work"],
  "Real Estate":                 ["Property Investment", "Home Buying", "Renting", "Commercial Real Estate", "Mortgage", "Interior Design", "Property Management", "REITs", "Real Estate Law", "Flipping"],
  "Legal":                       ["Business Law", "IP Law", "Family Law", "Tax Law", "Employment Law", "Immigration", "Criminal Law", "Legal Tech", "Contracts", "Compliance"],
  "Parenting":                   ["Baby Care", "Toddler Tips", "Homeschooling", "Parenting Advice", "Kids Education", "Family Travel", "Pregnancy", "Teen Parenting", "Special Needs", "Work-Life Balance"],
  "Sustainability":              ["Green Living", "Renewable Energy", "Zero Waste", "Eco Products", "Climate", "Sustainable Fashion", "Organic Farming", "Recycling", "Carbon Footprint", "Green Tech"],
};

const CATEGORIES = Object.keys(TAXONOMY);

async function fetchPageText(domain: string): Promise<string> {
  const url = `https://${domain.replace(/^https?:\/\//, "")}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Linkade-bot/1.0)" },
    signal: AbortSignal.timeout(6000),
  });
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 503 });
  }

  const { domain } = await req.json();
  if (!domain) {
    return new Response(JSON.stringify({ error: "domain is required" }), { status: 400 });
  }

  let pageText = "";
  try {
    pageText = await fetchPageText(domain);
  } catch {
    pageText = `Website domain: ${domain}`;
  }

  const taxonomyStr = CATEGORIES.map(
    (cat) => `- ${cat}: ${TAXONOMY[cat].join(", ")}`
  ).join("\n");

  const prompt = `You are a website categorization assistant. Classify the following website into exactly one primary category and suggest exactly 10 relevant tags from the provided taxonomy.

Domain: ${domain}
Homepage content (truncated): """
${pageText}
"""

Available taxonomy:
${taxonomyStr}

Rules:
- Pick the single most fitting primary category from the list above.
- Pick exactly 10 tags from that category's tag list.
- Return ONLY valid JSON, no markdown, no explanation.

Return format:
{"category":"<category>","tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],"confidence":<0-100>}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.json();
    return new Response(JSON.stringify({ error: "OpenAI error", detail: err }), { status: 502 });
  }

  const data = await openaiRes.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

  let parsed: { category: string; tags: string[]; confidence: number };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500 });
  }

  if (!TAXONOMY[parsed.category]) {
    parsed.category = "Business & Entrepreneurship";
    parsed.tags = TAXONOMY["Business & Entrepreneurship"];
  }

  return new Response(
    JSON.stringify({
      category: parsed.category,
      tags: parsed.tags.slice(0, 10),
      confidence: parsed.confidence ?? 80,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
