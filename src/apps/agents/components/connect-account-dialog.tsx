/**
 * Connect Account Dialog Component
 * Dialog for connecting an exchange account to an agent with specific permissions
 */

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { useAgentStore } from "../store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { Agent, PermissionScope } from "../types";
import { PERMISSION_SCOPES } from "../types";

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onSuccess?: () => void;
}

export function ConnectAccountDialog({
  open,
  onOpenChange,
  agent,
  onSuccess,
}: ConnectAccountDialogProps) {
  const accounts = useAccountsStore((s) => s.accounts);
  const { connectAccountToAgent, accountLinking } = useAgentStore();

  const [selectedAccountId, setSelectedAccountId] = useState("");
  // Default scopes: "read" + "trade" for trading agents (required for strategies)
  const defaultScopes: PermissionScope[] = agent.domain === "trading" 
    ? ["read", "trade"] 
    : ["read"];
  const [selectedScopes, setSelectedScopes] = useState<PermissionScope[]>(defaultScopes);

  // Get accounts that are not already connected to this agent
  const availableAccounts = useMemo(() => {
    const connectedIds = new Set(
      agent.connectedAccounts?.map((acc) => acc.accountId) || []
    );
    return accounts.filter(
      (a) => !connectedIds.has(a.account.nid) && !connectedIds.has(a.id)
    );
  }, [accounts, agent.connectedAccounts]);

  // Reset form when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setSelectedAccountId("");
        // Reset to default scopes based on agent domain
        setSelectedScopes(agent.domain === "trading" ? ["read", "trade"] : ["read"]);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, agent.domain]
  );

  // Toggle a scope
  const toggleScope = useCallback((scope: PermissionScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!selectedAccountId || selectedScopes.length === 0) return;

    const success = await connectAccountToAgent({
      agentId: agent.id,
      accountId: selectedAccountId,
      grantedScopes: selectedScopes,
    });

    if (success) {
      handleOpenChange(false);
      onSuccess?.();
    }
  }, [agent.id, selectedAccountId, selectedScopes, connectAccountToAgent, handleOpenChange, onSuccess]);

  // Group scopes by category
  const scopeGroups = useMemo(() => {
    return Array.from(new Set(PERMISSION_SCOPES.map((s) => s.group)));
  }, []);

  // Check if trade permission is selected
  // Check if trade permission is selected (either "trade" or legacy "trading:write")
  const hasTradePermission = selectedScopes.includes("trade") || selectedScopes.includes("trading:write");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Account to Agent
          </DialogTitle>
          <DialogDescription>
            Link an exchange account to <strong>{agent.name}</strong> with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label>Select Account</Label>
            {availableAccounts.length === 0 ? (
              <div className="p-4 text-center border border-dashed rounded-lg">
                <Wallet className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No more accounts available to connect.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add accounts in the Accounts section first.
                </p>
              </div>
            ) : (
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={accountLinking}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map((stored) => {
                    const account = stored.account;
                    return (
                      <SelectItem key={stored.id} value={account.nid}>
                        <div className="flex items-center gap-2">
                          <img
                            src={getExchangeIconPath(account.exchange)}
                            alt=""
                            className="h-4 w-4 rounded object-contain"
                          />
                          <span className="font-mono text-sm">{account.nid}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {account.exchange}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Permissions Selection */}
          {selectedAccountId && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Permissions
              </Label>
              <p className="text-xs text-muted-foreground">
                Select which actions this agent can perform with the connected account.
              </p>

              <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                {scopeGroups.map((group) => (
                  <div key={group}>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {group}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {PERMISSION_SCOPES.filter((s) => s.group === group).map(
                        (scope) => (
                          <label
                            key={scope.value}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedScopes.includes(scope.value)}
                              onCheckedChange={() => toggleScope(scope.value)}
                              disabled={accountLinking}
                            />
                            {scope.label}
                          </label>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected scopes summary */}
              {selectedScopes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedScopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Trade permission warning */}
              {hasTradePermission && (
                <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                    <strong>Warning:</strong> Trade permission allows the agent to create
                    and cancel orders on this account. Make sure you trust this agent.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={accountLinking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              accountLinking ||
              !selectedAccountId ||
              selectedScopes.length === 0 ||
              availableAccounts.length === 0
            }
          >
            {accountLinking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
