/**
 * Agent Account List Component
 * Displays connected accounts for an agent with their permissions
 */

import { useCallback, useState } from "react";
import {
  Loader2,
  Plus,
  ShieldCheck,
  Unlink,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { useAgentStore } from "../store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import { ConnectAccountDialog } from "./connect-account-dialog";
import type { Agent, ConnectedAccountRef } from "../types";
import { PERMISSION_SCOPES } from "../types";

interface AgentAccountListProps {
  agent: Agent;
  /** If true, shows the "Connect Account" button */
  showAddButton?: boolean;
  /** If true, uses compact layout */
  compact?: boolean;
  /** Called when accounts list changes */
  onAccountsChange?: () => void;
}

export function AgentAccountList({
  agent,
  showAddButton = true,
  compact = false,
  onAccountsChange,
}: AgentAccountListProps) {
  const accounts = useAccountsStore((s) => s.accounts);
  const { disconnectAccountFromAgent, accountLinking } = useAgentStore();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const connectedAccounts: ConnectedAccountRef[] = agent.connectedAccounts || 
    (agent.connectedAccountIds || []).map((id) => ({ accountId: id, grantedScopes: [] }));

  // Handle disconnect
  const handleDisconnect = useCallback(
    async (accountId: string) => {
      await disconnectAccountFromAgent({
        agentId: agent.id,
        accountId,
      });
      onAccountsChange?.();
    },
    [agent.id, disconnectAccountFromAgent, onAccountsChange]
  );

  // Group scopes for display
  const scopeGroups = Array.from(new Set(PERMISSION_SCOPES.map((s) => s.group)));

  if (connectedAccounts.length === 0 && !showAddButton) {
    return (
      <div className="text-sm text-muted-foreground">
        No accounts connected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connectedAccounts.length === 0 ? (
        <div className={compact ? "text-sm text-muted-foreground" : "p-4 text-center border border-dashed rounded-lg"}>
          {!compact && <Wallet className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />}
          <p className={compact ? "" : "text-sm text-muted-foreground"}>
            No accounts connected to this agent.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {connectedAccounts.map((ref) => {
            const storedAccount = accounts.find(
              (a) => a.account.nid === ref.accountId || a.id === ref.accountId
            );
            const exchange = storedAccount?.account.exchange || "unknown";
            const scopes = ref.grantedScopes || [];

            return (
              <li
                key={ref.accountId}
                className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <img
                    src={getExchangeIconPath(exchange)}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-mono text-sm block">
                      {storedAccount?.account.nid ?? ref.accountId}
                    </span>
                    {!compact && scopes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scopes.slice(0, 3).map((scope) => (
                          <Badge
                            key={scope}
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            {scope}
                          </Badge>
                        ))}
                        {scopes.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0"
                          >
                            +{scopes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {/* Permissions Popover */}
                  <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="View permissions"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          Permissions ({scopes.length})
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-80" align="end" side="left">
                      <div className="mb-2 font-medium">
                        Permissions for{" "}
                        <span className="font-mono text-sm">
                          {storedAccount?.account.nid ?? ref.accountId}
                        </span>
                      </div>
                      {scopes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No permissions granted.
                        </p>
                      ) : (
                        <div className="max-h-64 space-y-3 overflow-y-auto">
                          {scopeGroups.map((group) => {
                            const groupScopes = PERMISSION_SCOPES.filter(
                              (s) => s.group === group
                            );
                            const hasAnyInGroup = groupScopes.some((s) =>
                              scopes.includes(s.value)
                            );
                            if (!hasAnyInGroup) return null;
                            return (
                              <div key={group}>
                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                  {group}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {groupScopes
                                    .filter((s) => scopes.includes(s.value))
                                    .map((s) => (
                                      <Badge
                                        key={s.value}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {s.label}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                        To change permissions, disconnect and reconnect the account.
                      </p>
                    </PopoverContent>
                  </Popover>

                  {/* Disconnect Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDisconnect(ref.accountId)}
                          disabled={accountLinking}
                          aria-label="Disconnect"
                        >
                          {accountLinking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Disconnect account</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Connect Account Button */}
      {showAddButton && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConnectDialogOpen(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </Button>

          <ConnectAccountDialog
            open={connectDialogOpen}
            onOpenChange={setConnectDialogOpen}
            agent={agent}
            onSuccess={onAccountsChange}
          />
        </>
      )}
    </div>
  );
}
