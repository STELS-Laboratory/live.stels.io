import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Transaction } from "@/lib/gliesereum";

interface TransactionListProps {
  transactions: Transaction[];
}

/**
 * Transaction list component displaying wallet transaction history
 */
export function TransactionList({ transactions }: TransactionListProps) {
  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(8);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-700/50">
        <CardContent className="p-6">
          <div className="text-center text-zinc-400">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium mb-2">No Transactions</h3>
            <p className="text-sm">Your transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-zinc-100">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/70 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-zinc-300 font-medium">
                  {formatAmount(tx.amount)} TST
                </span>
                <Badge
                  variant="secondary"
                  className={getStatusColor(tx.status)}
                >
                  {tx.status}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>From:</span>
                  <span className="font-mono">
                    {formatAddress(tx.from.address)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>To:</span>
                  <span className="font-mono">{formatAddress(tx.to)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Fee:</span>
                  <span>{formatAmount(tx.fee)} TST</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Hash:</span>
                  <span className="font-mono">{formatAddress(tx.hash)}</span>
                </div>
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="text-xs text-zinc-400">
                {formatDate(tx.timestamp)}
              </div>
              {tx.verified && (
                <div className="mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-300 border-green-500/30 text-xs"
                  >
                    Verified
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
