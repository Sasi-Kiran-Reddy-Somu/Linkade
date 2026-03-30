import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const METRIC_INFO: Record<string, string> = {
  DR: "Ahrefs' 0–100 score measuring backlink profile strength. Improve it by earning links from other high-DR sites through content-led outreach and digital PR.",
  DA: "Moz's 0–100 score predicting ranking potential. Build it by acquiring quality backlinks and publishing authoritative, well-cited content consistently.",
  TF: "Majestic's 0–100 trust score based on link quality. Increase it by earning links from trusted, topically relevant sites in your niche.",
  Traffic: "Estimated monthly organic visitors from search engines. Grow it with consistent SEO, high-quality content publishing, and strong backlink acquisition.",
  RD: "Number of unique domains linking to this site. A higher count with diverse, relevant sources signals stronger domain authority and search visibility.",
  Spam: "Moz's spam indicator (0–17) — lower is better. Reduce it by disavowing toxic backlinks and avoiding link schemes or low-quality directories.",
  Responsiveness: "How consistently the site owner responds to backlink requests. Higher scores indicate a more reliable exchange partner who handles requests promptly.",
  Resp: "How consistently the site owner responds to backlink requests. Higher means a more reliable exchange partner.",
};

const OWN_METRIC_INFO: Record<string, string> = {
  ...METRIC_INFO,
  Responsiveness: "Your response rate to backlink requests on this project. Respond promptly to incoming requests to increase your score and attract more exchange partners.",
  Resp: "Your response rate to backlink requests on this project. Respond promptly to incoming requests to increase your score and attract more exchange partners.",
};

export function MetricInfo({ metric, isOwn }: { metric: string; isOwn?: boolean }) {
  const text = (isOwn ? OWN_METRIC_INFO : METRIC_INFO)[metric];
  if (!text) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3 w-3 text-muted-foreground/50 cursor-default hover:text-muted-foreground transition-colors shrink-0" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-52 text-[11px] leading-relaxed font-normal normal-case tracking-normal text-left"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
