import AppLayout from "@/components/AppLayout";
import { Store, Search, ChevronDown, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MarketplaceOrders() {
  return (
    <AppLayout title="My Orders" icon={<Store className="h-5 w-5" />}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" className="pl-10" />
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            All <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Wallet className="h-3.5 w-3.5" /> justwhatworks <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <p className="py-20 text-center text-muted-foreground">No orders to show</p>

        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="ghost" size="sm" disabled>← Previous</Button>
          <Button variant="ghost" size="sm" disabled>Next →</Button>
        </div>
      </div>
    </AppLayout>
  );
}
