import AppLayout from "@/components/AppLayout";
import { Store, Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sortOptions = ["Sort by Date", "Sort AS", "Sort DA", "Sort TF", "Sort RD", "Sort Price"];

const mockMarketplace = [
  { domain: "mydiginest.com", initial: "M", da: 20, tf: 4, rd: 712, category: "Technology & Software", tags: ["Tech News & Re..."], extraTags: 1, price: 152.50 },
  { domain: "flaremagazine.co.uk", initial: "F", da: 34, tf: 14, rd: 248, category: "News & Journalism", tags: ["General News O..."], extraTags: 5, price: 67.10 },
  { domain: "hitconsultant.net", initial: "H", da: 63, tf: 24, rd: 3755, category: "Health & Wellness", tags: ["Medical Informa..."], extraTags: 1, price: 414.80 },
  { domain: "fappelo.net", initial: "F", da: 35, tf: 2, rd: 121, category: "News & Journalism", tags: ["General News O..."], extraTags: 4, price: 61.00 },
  { domain: "newskysecurity.com", initial: "N", da: 43, tf: 12, rd: 442, category: "Technology & Software", tags: ["Cybersecurity"], price: 183.00 },
  { domain: "girlspring.com", initial: "G", da: 35, tf: 14, rd: 228, category: "Non-Profit & Charity", tags: ["Charitable Orga..."], extraTags: 2, price: 109.80 },
  { domain: "venisonmagazine.com", initial: "V", da: 29, tf: 10, rd: 304, category: "Entertainment & Media", tags: ["Digital Magazines"], extraTags: 1, price: 79.30 },
];

export default function MarketplaceWebsites() {
  return (
    <AppLayout title="All Websites" icon={<Store className="h-5 w-5" />}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <Button key={opt} variant="outline" size="sm" className="gap-1">
              {opt} <ChevronDown className="h-3 w-3" />
            </Button>
          ))}
        </div>

        <div className="w-full overflow-x-auto">
        <div className="space-y-3 min-w-[700px]">
          {mockMarketplace.map((site, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {site.initial}
              </div>
              <div className="min-w-[200px] text-center">
                <p className="text-xs text-muted-foreground">Website</p>
                <a href={`https://${site.domain}`} target="_blank" rel="noreferrer"
                  className="text-sm font-semibold text-foreground hover:underline">
                  {site.domain}
                </a>
              </div>
              <div className="flex items-center gap-3 text-center text-xs">
                <div><p className="text-muted-foreground">AS</p><p className="font-semibold text-foreground">-</p></div>
                <div><p className="text-muted-foreground">DA</p><p className="font-semibold text-foreground">{site.da}</p></div>
                <div><p className="text-muted-foreground">TF</p><p className="font-semibold text-foreground">{site.tf}</p></div>
                <div><p className="text-muted-foreground">RD</p><p className="font-semibold text-foreground">{site.rd.toLocaleString()}</p></div>
              </div>
              <div className="min-w-[120px] text-center">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm text-foreground">{site.category}</p>
              </div>
              <div className="min-w-[120px] text-center">
                <p className="text-xs text-muted-foreground">Tags</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">{site.tags[0]}</span>
                  {site.extraTags && <span className="text-xs text-muted-foreground">+{site.extraTags}</span>}
                </div>
              </div>
              <div className="min-w-[80px] text-center">
                <p className="text-xs text-muted-foreground">Price ($)</p>
                <p className="text-sm font-bold text-foreground">${site.price.toFixed(2)}</p>
              </div>
              <div className="ml-auto">
                <Button size="sm">Buy</Button>
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="ghost" size="sm" disabled>← Previous</Button>
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} size="sm" variant={n === 1 ? "default" : "ghost"} className="h-8 w-8 p-0">{n}</Button>
          ))}
          <span className="text-muted-foreground">...</span>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">134</Button>
          <Button variant="ghost" size="sm">Next →</Button>
        </div>
      </div>
    </AppLayout>
  );
}
