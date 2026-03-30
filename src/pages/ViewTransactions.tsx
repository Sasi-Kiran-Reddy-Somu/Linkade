import AppLayout from "@/components/AppLayout";
import { CreditCard } from "lucide-react";
import { getAccountCredits } from "@/lib/credits";

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  balance: number;
}

const transactions: Transaction[] = [
  { id: 1, date: "2026-03-01", description: "Credits purchased", amount: 5, type: "credit", balance: 8 },
  { id: 2, date: "2026-02-28", description: "Exchange request sent", amount: 1, type: "debit", balance: 3 },
  { id: 3, date: "2026-02-25", description: "Credits purchased", amount: 3, type: "credit", balance: 4 },
  { id: 4, date: "2026-02-20", description: "Exchange request sent", amount: 1, type: "debit", balance: 1 },
  { id: 5, date: "2026-02-15", description: "Welcome bonus", amount: 2, type: "credit", balance: 2 },
];

export default function ViewTransactions() {
  return (
    <AppLayout title="Transactions" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Available Credits</p>
            <p className="text-3xl font-bold text-foreground mt-1">{getAccountCredits()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Credits Earned</p>
            <p className="text-3xl font-bold text-foreground mt-1">2</p>
            <p className="text-xs text-muted-foreground mt-1">From giving backlinks</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Credits Spent</p>
            <p className="text-3xl font-bold text-foreground mt-1">7</p>
            <p className="text-xs text-muted-foreground mt-1">On receiving backlinks</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Credits Purchased</p>
            <p className="text-3xl font-bold text-foreground mt-1">8</p>
          </div>
        </div>

        {/* Transactions table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Transaction History</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Description</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={tx.id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <td className="px-6 py-3 text-center text-muted-foreground">{tx.date}</td>
                  <td className="px-6 py-3 text-center text-foreground">{tx.description}</td>
                  <td className="px-6 py-3 text-center font-semibold">
                    <span className={tx.type === "credit" ? "text-green-700" : "text-red-500"}>
                      {tx.type === "credit" ? "+" : "-"}{tx.amount}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center font-semibold text-foreground">{tx.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
