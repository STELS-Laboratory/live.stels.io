import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { SetAccountPayload } from "@/lib/api-types";
import type { StoredAccount } from "@/types/stores/types";
import { EXCHANGE_OPTIONS, getExchangeIconPath } from "./types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAccount: StoredAccount | null;
  onSubmit: (
    payload: SetAccountPayload,
    omitSecrets?: boolean,
  ) => Promise<boolean>;
  loading?: boolean;
}

const NID_REGEX = /^[a-z0-9-]+$/;

export function AccountFormDialog({
  open,
  onOpenChange,
  editAccount,
  onSubmit,
  loading = false,
}: AccountFormDialogProps) {
  const isEdit = editAccount != null;

  const [nid, setNid] = useState("");
  const [exchange, setExchange] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [keepExistingCredentials, setKeepExistingCredentials] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editAccount) {
        const a = editAccount.account;
        setNid(a.nid);
        setExchange(a.exchange);
        setApiKey("");
        setSecret("");
        setNote(a.note || "");
        setPassword("");
        setKeepExistingCredentials(true);
      } else {
        setNid("");
        setExchange(EXCHANGE_OPTIONS[0]?.value ?? "");
        setApiKey("");
        setSecret("");
        setNote("");
        setPassword("");
        setKeepExistingCredentials(false);
      }
      setErrors({});
    }
  }, [open, editAccount]);

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!nid.trim()) e.nid = "NID is required";
    else if (!NID_REGEX.test(nid.trim()))
      e.nid = "NID must be lowercase letters, numbers, and hyphens only";
    if (!exchange) e.exchange = "Exchange is required";
    if (!isEdit || !keepExistingCredentials) {
      if (!apiKey.trim()) e.apiKey = "API key is required";
      if (!secret.trim()) e.secret = "Secret is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [nid, exchange, apiKey, secret, isEdit, keepExistingCredentials]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const omitSecrets = isEdit && keepExistingCredentials;
    const payload: SetAccountPayload = {
      nid: nid.trim(),
      exchange,
      note: note.trim(),
      apiKey: omitSecrets ? "" : apiKey.trim(),
      secret: omitSecrets ? "" : secret.trim(),
      ...(password.trim() && { password: password.trim() }),
    };

    const ok = await onSubmit(payload, omitSecrets);
    if (ok) onOpenChange(false);
  }, [
    validate,
    nid,
    exchange,
    note,
    apiKey,
    secret,
    password,
    isEdit,
    keepExistingCredentials,
    onSubmit,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update exchange account credentials."
              : "Add a new exchange account for trading."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nid">NID</Label>
            <Input
              id="nid"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              placeholder="e.g. binance-main"
              className={errors.nid ? "border-destructive" : ""}
              disabled={isEdit}
            />
            {errors.nid && (
              <p className="text-xs text-destructive">{errors.nid}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exchange">Exchange</Label>
            <Select
              value={exchange}
              onValueChange={setExchange}
              disabled={isEdit}
            >
              <SelectTrigger id="exchange" className={errors.exchange ? "border-destructive" : ""}>
                <SelectValue placeholder="Select exchange">
                  {exchange && (
                    <div className="flex items-center gap-2">
                      <img
                        src={getExchangeIconPath(exchange)}
                        alt=""
                        className="h-4 w-4 rounded object-contain"
                      />
                      <span>{EXCHANGE_OPTIONS.find((o) => o.value === exchange)?.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXCHANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex items-center gap-2">
                      <img
                        src={getExchangeIconPath(o.value)}
                        alt={o.label}
                        className="h-4 w-4 rounded object-contain"
                      />
                      <span>{o.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.exchange && (
              <p className="text-xs text-destructive">{errors.exchange}</p>
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Keep existing credentials</Label>
                <p className="text-xs text-muted-foreground">
                  Do not send API key and secret; leave them unchanged on the server.
                </p>
              </div>
              <Switch
                checked={keepExistingCredentials}
                onCheckedChange={setKeepExistingCredentials}
              />
            </div>
          )}

          {(!isEdit || !keepExistingCredentials) && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={isEdit ? "••••••••" : ""}
                  className={errors.apiKey ? "border-destructive" : ""}
                />
                {errors.apiKey && (
                  <p className="text-xs text-destructive">{errors.apiKey}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secret">Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={isEdit ? "••••••••" : ""}
                  className={errors.secret ? "border-destructive" : ""}
                />
                {errors.secret && (
                  <p className="text-xs text-destructive">{errors.secret}</p>
                )}
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Account description"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password (optional, for some exchanges)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passphrase if required"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Add account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
