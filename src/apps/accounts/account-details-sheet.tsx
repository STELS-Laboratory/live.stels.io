/**
 * Account Details Sheet
 * Professional financial UI with full account info and balances
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Lock,
  Pencil,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  StoredAccount,
  AccountRawData,
  AccountWalletData,
  WalletCoinRow,
  WalletAccountSummary,
} from "@/types/stores/types";
import { getExchangeIconPath } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatNum(x: string | number | undefined | null, decimals = 8): string {
  if (x == null || x === "") return "—";
  const n = typeof x === "string" ? parseFloat(x) : x;
  if (Number.isNaN(n)) return String(x);
  if (Math.abs(n) < 1e-8 && n !== 0) return n.toExponential(4);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatUSD(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPreciseShort(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPnlColor(value: string | number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n) || n === 0) return "text-muted-foreground";
  return n > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500";
}

function getPnlBg(value: string | number | null | undefined): string {
  if (value == null) return "bg-muted/50";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n) || n === 0) return "bg-muted/50";
  return n > 0 ? "bg-green-500/10" : "bg-red-500/10";
}

function isEncrypted(
  v: unknown,
): v is { data: string; iv: string; salt: string; version: number } {
  return (
    !!v &&
    typeof v === "object" &&
    "data" in v &&
    "iv" in v &&
    "salt" in v &&
    "version" in v
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "danger" | "muted";
}) {
  const bgClass =
    variant === "success"
      ? "bg-green-500/10 border-green-500/20"
      : variant === "danger"
        ? "bg-red-500/10 border-red-500/20"
        : variant === "muted"
          ? "bg-muted/50"
          : "bg-card";
  const textClass =
    variant === "success"
      ? "text-green-600 dark:text-green-500"
      : variant === "danger"
        ? "text-red-600 dark:text-red-500"
        : "";

  return (
    <div className={`rounded-lg border p-3 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold tracking-tight ${textClass}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionHeader({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {badge && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {badge}
        </Badge>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface AccountDetailsSheetProps {
  account: StoredAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (account: StoredAccount) => void;
}

const WALLET_TOP_KEYS = ["info", "timestamp", "datetime", "free", "used", "total", "debt"];

function getWalletCoinKeys(w: AccountWalletData): string[] {
  const fromTotal = w.total && typeof w.total === "object" ? Object.keys(w.total) : [];
  const fromWallet: string[] = [];
  for (const k of Object.keys(w)) {
    if (WALLET_TOP_KEYS.includes(k)) continue;
    const v = w[k];
    if (v && typeof v === "object" && !Array.isArray(v) && ("total" in v || "free" in v)) {
      fromWallet.push(k);
    }
  }
  return Array.from(new Set([...fromTotal, ...fromWallet])).sort();
}

export function AccountDetailsSheet({
  account,
  open,
  onOpenChange,
  onEdit,
}: AccountDetailsSheetProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!account) return null;

  const a = account.account;
  const r = account.rawData as AccountRawData | undefined;
  const status = r?.status ?? a.status ?? "active";
  const w = r?.wallet;
  const info = w?.info;
  const result = info?.result;
  const list = result?.list;
  const first = Array.isArray(list) && list.length > 0 ? (list[0] as WalletAccountSummary) : null;
  const coins = first?.coin;
  const credEnc = r?.credentialsEncrypted === true;
  const apiKeyVal = r?.apiKey;
  const secretVal = r?.secret;

  const totalEquity = first?.totalEquity;
  const totalWalletBalance = first?.totalWalletBalance;
  const totalAvailableBalance = first?.totalAvailableBalance;
  const totalMarginBalance = first?.totalMarginBalance;
  const totalPerpUPL = first?.totalPerpUPL;
  const accountIMRate = first?.accountIMRate;
  const accountMMRate = first?.accountMMRate;

  const pnlNum = totalPerpUPL != null ? parseFloat(String(totalPerpUPL)) : 0;
  const pnlVariant = pnlNum > 0 ? "success" : pnlNum < 0 ? "danger" : "muted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {/* Header */}
        <SheetHeader className="border-b p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={getExchangeIconPath(a.exchange)}
                alt={a.exchange}
                className="h-14 w-14 rounded-xl object-contain shadow-md ring-1 ring-border"
              />
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                  a.connection ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate font-mono text-xl">{a.nid}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {a.exchange.charAt(0).toUpperCase() + a.exchange.slice(1)}
                {a.note ? ` · ${a.note}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    status === "active"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
                      : status === "stopped"
                        ? "bg-muted"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                    status === "active" ? "bg-green-500" : status === "stopped" ? "bg-muted-foreground" : "bg-amber-500"
                  }`} />
                  {status}
                </Badge>
                {first?.accountType && (
                  <Badge variant="outline" className="text-xs">
                    {first.accountType}
                  </Badge>
                )}
                {credEnc && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="mr-1 h-3 w-3" />
                    Encrypted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-6">
            {/* Hero Stats */}
            {first && (
              <div className="space-y-4">
                {/* Primary Balance */}
                <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                  </div>
                  <p className="text-4xl font-bold tracking-tight">
                    {formatUSD(totalEquity ?? totalWalletBalance)}
                  </p>
                  {totalAvailableBalance != null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatUSD(totalAvailableBalance)} available
                    </p>
                  )}
                </div>

                {/* Secondary Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {totalPerpUPL != null && (
                    <StatCard
                      label="Unrealized PnL"
                      value={formatPreciseShort(totalPerpUPL)}
                      icon={pnlNum >= 0 ? ArrowUpRight : ArrowDownRight}
                      variant={pnlVariant}
                    />
                  )}
                  {totalWalletBalance != null && totalEquity != null && (
                    <StatCard
                      label="Wallet Balance"
                      value={formatPreciseShort(totalWalletBalance)}
                      icon={TrendingUp}
                    />
                  )}
                  {totalMarginBalance != null && (
                    <StatCard
                      label="Margin Balance"
                      value={formatPreciseShort(totalMarginBalance)}
                      icon={Shield}
                    />
                  )}
                  {accountIMRate != null && (
                    <StatCard
                      label="IM Rate"
                      value={`${(parseFloat(String(accountIMRate)) * 100).toFixed(2)}%`}
                      subValue={accountMMRate != null ? `MM: ${(parseFloat(String(accountMMRate)) * 100).toFixed(2)}%` : undefined}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Coin Holdings Table */}
            {Array.isArray(coins) && coins.length > 0 && (
              <section>
                <SectionHeader title="Holdings" badge={`${coins.length} coins`} />
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Asset</TableHead>
                        <TableHead className="text-right font-semibold">Balance</TableHead>
                        <TableHead className="text-right font-semibold">USD Value</TableHead>
                        <TableHead className="text-right font-semibold">PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(coins as WalletCoinRow[])
                        .filter((c) => {
                          const usd = parseFloat(String(c.usdValue ?? 0));
                          return Math.abs(usd) >= 0.01;
                        })
                        .sort((a, b) => {
                          const aUsd = Math.abs(parseFloat(String(a.usdValue ?? 0)));
                          const bUsd = Math.abs(parseFloat(String(b.usdValue ?? 0)));
                          return bUsd - aUsd;
                        })
                        .map((c) => {
                          const cumPnl = c.cumRealisedPnl;
                          return (
                            <TableRow key={c.coin}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold">
                                    {c.coin.slice(0, 2)}
                                  </div>
                                  <span className="font-medium">{c.coin}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNum(c.walletBalance ?? c.equity, 6)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatUSD(c.usdValue)}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${getPnlColor(cumPnl)}`}>
                                {cumPnl != null ? formatNum(cumPnl, 2) : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Balance Summary Table */}
            {w && typeof w === "object" && (w.total || w.free) && (() => {
              const keys = getWalletCoinKeys(w);
              if (keys.length === 0) return null;
              const total = w.total && typeof w.total === "object" ? w.total : {};
              const free = w.free && typeof w.free === "object" ? w.free : {};
              const used = w.used && typeof w.used === "object" ? w.used : {};
              const debt = w.debt && typeof w.debt === "object" ? w.debt : {};
              
              const filteredKeys = keys.filter((coin) => {
                const t = total[coin] ?? 0;
                return Math.abs(t) >= 0.00000001;
              });

              if (filteredKeys.length === 0) return null;

              return (
                <section>
                  <SectionHeader title="Balance Details" badge={`${filteredKeys.length} assets`} />
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold">Asset</TableHead>
                          <TableHead className="text-right font-semibold">Free</TableHead>
                          <TableHead className="text-right font-semibold">Used</TableHead>
                          <TableHead className="text-right font-semibold">Total</TableHead>
                          <TableHead className="text-right font-semibold">Debt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKeys.map((coin) => {
                          const debtVal = debt[coin] ?? 0;
                          const hasDebt = debtVal > 0;
                          return (
                            <TableRow key={coin}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold">
                                    {coin.slice(0, 2)}
                                  </div>
                                  <span className="font-medium">{coin}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatNum(free[coin], 6)}</TableCell>
                              <TableCell className="text-right font-mono">{formatNum(used[coin], 6)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">{formatNum(total[coin], 6)}</TableCell>
                              <TableCell className={`text-right font-mono ${hasDebt ? "text-red-600 dark:text-red-500" : ""}`}>
                                {hasDebt ? formatNum(debtVal, 6) : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              );
            })()}

            {/* Advanced Details (Collapsible) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Advanced Details
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Account Info */}
                <div className="rounded-lg border p-4">
                  <SectionHeader title="Account Info" />
                  <div className="space-y-0">
                    <InfoRow label="NID" value={a.nid} mono />
                    <InfoRow label="Exchange" value={a.exchange} />
                    <InfoRow label="Note" value={a.note || "—"} />
                    <InfoRow label="Connection" value={a.connection ? "Connected" : "Disconnected"} />
                    <InfoRow label="Local ID" value={account.id} mono />
                    <InfoRow
                      label="Address"
                      value={
                        account.address
                          ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}`
                          : r?.address
                            ? `${String(r.address).slice(0, 8)}...`
                            : "—"
                      }
                      mono
                    />
                  </div>
                </div>

                {/* Credentials */}
                <div className="rounded-lg border p-4">
                  <SectionHeader title="Credentials" />
                  <div className="space-y-0">
                    <InfoRow
                      label="API Key"
                      value={
                        isEncrypted(apiKeyVal) ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Encrypted
                          </span>
                        ) : typeof apiKeyVal === "string" && apiKeyVal ? (
                          "••••••••"
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="Secret"
                      value={
                        isEncrypted(secretVal) ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Encrypted
                          </span>
                        ) : typeof secretVal === "string" && secretVal ? (
                          "••••••••"
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow label="Password" value={a.password ? "••••••••" : "—"} />
                    {a.viewers && a.viewers.length > 0 && (
                      <InfoRow label="Viewers" value={a.viewers.join(", ")} />
                    )}
                    {a.workers && a.workers.length > 0 && (
                      <InfoRow label="Workers" value={a.workers.join(", ")} />
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-lg border p-4">
                  <SectionHeader title="Timestamps" />
                  <div className="space-y-0">
                    <InfoRow label="Created" value={formatDate(account.createdAt)} />
                    <InfoRow label="Updated" value={formatDate(account.updatedAt)} />
                    {r?.timestamp != null && (
                      <InfoRow label="Server Timestamp" value={formatDate(r.timestamp)} />
                    )}
                    {w?.timestamp != null && (
                      <InfoRow label="Wallet Updated" value={formatDate(w.timestamp)} />
                    )}
                    {w?.datetime != null && (
                      <InfoRow label="Wallet Datetime" value={String(w.datetime)} />
                    )}
                  </div>
                </div>

                {/* API Meta */}
                {(r?.channel || r?.module || r?.widget) && (
                  <div className="rounded-lg border p-4">
                    <SectionHeader title="API Meta" />
                    <div className="space-y-0">
                      {r.channel && <InfoRow label="Channel" value={r.channel} mono />}
                      {r.module && <InfoRow label="Module" value={r.module} mono />}
                      {r.widget && <InfoRow label="Widget" value={r.widget} mono />}
                    </div>
                  </div>
                )}

                {/* Wallet Info */}
                {info && (
                  <div className="rounded-lg border p-4">
                    <SectionHeader title="Wallet API Response" />
                    <div className="space-y-0">
                      {info.retCode != null && <InfoRow label="retCode" value={String(info.retCode)} />}
                      {info.retMsg != null && <InfoRow label="retMsg" value={String(info.retMsg)} />}
                      {info.time != null && <InfoRow label="time" value={String(info.time)} />}
                      {first?.accountIMRate != null && <InfoRow label="accountIMRate" value={formatNum(first.accountIMRate, 4)} />}
                      {first?.accountMMRate != null && <InfoRow label="accountMMRate" value={formatNum(first.accountMMRate, 4)} />}
                      {first?.accountLTV != null && <InfoRow label="accountLTV" value={formatNum(first.accountLTV, 4)} />}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {onEdit && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onEdit(account);
                onOpenChange(false);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
