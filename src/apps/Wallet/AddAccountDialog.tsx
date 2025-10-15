import { useState } from "react";
import type { AccountRequest, ProtocolData } from "@/lib/api-types";
import { deterministicStringify, sign } from "@/lib/gliesereum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAccountsStore } from "@/stores/modules/accounts.store";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialAccountState: AccountRequest = {
  nid: `nid-${Date.now()}`,
  connection: true,
  exchange: "binance",
  note: "My trading account.",
  apiKey: "",
  secret: "",
  status: "active",
  password: "",
  viewers: [],
};

const initialProtocolState: ProtocolData = {
  maxRiskPerTrade: 3.5,
  strategy: "Trend Following",
  maxLeverage: 10,
  markets: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
  maxDrawdown: 20,
  stopLoss: 2,
  takeProfit: 4,
  riskRewardRatio: 2,
  tradingStyle: "Swing Trading",
  positionSizing: "Fixed Fractional",
  portfolioAllocation: 50,
  slippageTolerance: 0.5,
  orderTypes: ["Limit", "Market"],
  timeframes: ["4h", "1d"],
  marketConditions: ["Trending", "Volatile"],
  hedgingEnabled: true,
  scalingEnabled: false,
  trailingStopEnabled: true,
  dynamicPositionSizing: false,
};

const annaAriadnaStrategy: ProtocolData = {
  strategy: "Anna Ariadna",
  tradingStyle: "Intelligent Position Trading",
  maxRiskPerTrade: 6,
  maxLeverage: 5,
  maxDrawdown: 18,
  stopLoss: 5,
  takeProfit: 9,
  riskRewardRatio: 7,
  positionSizing: "Dynamic Volatility Adjusted",
  portfolioAllocation: 75,
  slippageTolerance: 0.25,
  markets: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
  orderTypes: ["Limit", "Stop-Limit"],
  timeframes: ["1d", "3d", "1w"],
  marketConditions: ["Trending", "High Volume"],
  hedgingEnabled: true,
  scalingEnabled: true,
  trailingStopEnabled: true,
  dynamicPositionSizing: true,
};

const parseStringToArray = (str: string) =>
  str
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Dialog component for adding new exchange accounts
 */
export default function AddAccountDialog(
  { open, onOpenChange }: AddAccountDialogProps,
): React.ReactElement {
  const [step, setStep] = useState(1); // 1: Account, 2: Protocol, 3: Confirm & Send
  const [account, setAccount] = useState<AccountRequest>(initialAccountState);
  const [protocol, setProtocol] = useState<ProtocolData>(initialProtocolState);
  const [viewersStr, setViewersStr] = useState("");
  const [signedPayload, setSignedPayload] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const { wallet, connectionSession } = useAuthStore();
  const { addAccount, sendAccountToServer } = useAccountsStore();

  const handleClose = (): void => {
    setStep(1);
    setAccount(initialAccountState);
    setProtocol(initialProtocolState);
    setViewersStr("");
    setSignedPayload("");
    setIsSending(false);
    setSendError(null);
    setSendSuccess(false);
    onOpenChange(false);
  };

  const handleReview = (): void => {
    if (!wallet) {
      console.error("[AddAccount] No wallet available");
      return;
    }

    const accountData: AccountRequest = {
      ...account,
      viewers: parseStringToArray(viewersStr),
      protocol: protocol,
    };

    // Create signed payload for preview
    const dataString = deterministicStringify(accountData);
    const signature = sign(dataString, wallet.privateKey);

    const payload = {
      webfix: "1.0",
      method: "setAccount",
      params: ["gliesereum"],
      body: {
        account: accountData,
        publicKey: wallet.publicKey,
        address: wallet.address,
        signature: signature,
      },
    };

    setSignedPayload(JSON.stringify(payload, null, 2));
    setStep(3);
  };

  const handleSendToServer = async (): Promise<void> => {
    if (!wallet || !connectionSession) {
      console.error("[AddAccount] No wallet or connection session");
      return;
    }

    const accountData: AccountRequest = {
      ...account,
      viewers: parseStringToArray(viewersStr),
      protocol: protocol,
    };

    setIsSending(true);
    setSendError(null);

    try {
      await sendAccountToServer(
        accountData,
        wallet,
        connectionSession.session,
        connectionSession.api,
      );
      setSendSuccess(true);

      // Also save locally
      addAccount(accountData, wallet);

      // Close after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Failed to send account",
      );
      setIsSending(false);
    }
  };

  const handleSaveLocallyOnly = (): void => {
    if (!wallet) {
      console.error("[AddAccount] No wallet available");
      return;
    }

    const accountData: AccountRequest = {
      ...account,
      viewers: parseStringToArray(viewersStr),
      protocol: protocol,
    };

    addAccount(accountData, wallet);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Step 1: Account Details"
              : step === 2
              ? "Step 2: Protocol Configuration"
              : "Step 3: Confirm & Send"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Fill in the exchange account information."
              : step === 2
              ? "Configure the trading strategy parameters."
              : "Review the signed payload and send to server."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nid">Node ID (nid)</Label>
              <Input
                id="nid"
                value={account.nid}
                onChange={(e) =>
                  setAccount((p) => ({ ...p, nid: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Select
                value={account.exchange}
                onValueChange={(value) =>
                  setAccount((p) => ({ ...p, exchange: value }))}
              >
                <SelectTrigger id="exchange">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="kraken">Kraken</SelectItem>
                  <SelectItem value="coinbase">Coinbase</SelectItem>
                  <SelectItem value="bybit">Bybit</SelectItem>
                  <SelectItem value="okx">OKX</SelectItem>
                  <SelectItem value="kucoin">KuCoin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={account.apiKey}
                onChange={(e) =>
                  setAccount((p) => ({ ...p, apiKey: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">API Secret</Label>
              <Input
                id="secret"
                type="password"
                value={account.secret}
                onChange={(e) =>
                  setAccount((p) => ({ ...p, secret: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">API Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                value={account.password || ""}
                onChange={(e) =>
                  setAccount((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={account.status}
                onValueChange={(value: "active" | "learn" | "stopped") =>
                  setAccount((p) => ({ ...p, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="learn">Learn</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={account.note}
                onChange={(e) =>
                  setAccount((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="viewers">
                Viewers (comma-separated addresses)
              </Label>
              <Textarea
                id="viewers"
                value={viewersStr}
                onChange={(e) => setViewersStr(e.target.value)}
                placeholder="g..., g..., g..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="py-4">
            <div className="pb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProtocol(annaAriadnaStrategy)}
              >
                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                Load 'Anna Ariadna' Strategy
              </Button>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>View & Edit Parameters</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Strategy</Label>
                      <Input
                        value={protocol.strategy}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            strategy: e.target.value,
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trading Style</Label>
                      <Input
                        value={protocol.tradingStyle}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            tradingStyle: e.target.value,
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Risk Per Trade (%)</Label>
                      <Input
                        type="number"
                        value={protocol.maxRiskPerTrade}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            maxRiskPerTrade: Number.parseFloat(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Leverage</Label>
                      <Input
                        type="number"
                        value={protocol.maxLeverage}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            maxLeverage: Number.parseInt(e.target.value, 10),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Drawdown (%)</Label>
                      <Input
                        type="number"
                        value={protocol.maxDrawdown}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            maxDrawdown: Number.parseFloat(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stop Loss (%)</Label>
                      <Input
                        type="number"
                        value={protocol.stopLoss}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            stopLoss: Number.parseFloat(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Take Profit (%)</Label>
                      <Input
                        type="number"
                        value={protocol.takeProfit}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            takeProfit: Number.parseFloat(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk/Reward Ratio</Label>
                      <Input
                        type="number"
                        value={protocol.riskRewardRatio}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            riskRewardRatio: Number.parseFloat(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position Sizing</Label>
                      <Input
                        value={protocol.positionSizing}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            positionSizing: e.target.value,
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Portfolio Allocation (%)</Label>
                      <Input
                        type="number"
                        value={protocol.portfolioAllocation}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            portfolioAllocation: Number.parseFloat(
                              e.target.value,
                            ),
                          }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slippage Tolerance (%)</Label>
                      <Input
                        type="number"
                        value={protocol.slippageTolerance}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            slippageTolerance: Number.parseFloat(
                              e.target.value,
                            ),
                          }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Markets (comma-separated)</Label>
                      <Input
                        value={protocol.markets.join(", ")}
                        onChange={(e) =>
                          setProtocol((p) => ({
                            ...p,
                            markets: parseStringToArray(e.target.value),
                          }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="hedgingEnabled"
                        checked={protocol.hedgingEnabled}
                        onCheckedChange={(checked) =>
                          setProtocol((p) => ({
                            ...p,
                            hedgingEnabled: !!checked,
                          }))}
                      />
                      <Label htmlFor="hedgingEnabled">Hedging Enabled</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="scalingEnabled"
                        checked={protocol.scalingEnabled}
                        onCheckedChange={(checked) =>
                          setProtocol((p) => ({
                            ...p,
                            scalingEnabled: !!checked,
                          }))}
                      />
                      <Label htmlFor="scalingEnabled">Scaling Enabled</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="trailingStopEnabled"
                        checked={protocol.trailingStopEnabled}
                        onCheckedChange={(checked) =>
                          setProtocol((p) => ({
                            ...p,
                            trailingStopEnabled: !!checked,
                          }))}
                      />
                      <Label htmlFor="trailingStopEnabled">Trailing Stop</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="dynamicPositionSizing"
                        checked={protocol.dynamicPositionSizing}
                        onCheckedChange={(checked) =>
                          setProtocol((p) => ({
                            ...p,
                            dynamicPositionSizing: !!checked,
                          }))}
                      />
                      <Label htmlFor="dynamicPositionSizing">
                        Dynamic Position Sizing
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            {sendSuccess
              ? (
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-300">
                    Account Sent Successfully!
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Your account has been saved and sent to the server.
                  </AlertDescription>
                </Alert>
              )
              : (
                <>
                  <Alert>
                    <AlertDescription>
                      Review the signed payload below. Click "Send to Server" to
                      submit the account, or "Save Locally Only" to store it
                      without sending.
                    </AlertDescription>
                  </Alert>

                  {sendError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{sendError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Signed Payload (WebFix Format)</Label>
                    <pre className="w-full bg-muted p-4 rounded-md text-xs overflow-x-auto border border-border/50 max-h-96">
                     {signedPayload}
                    </pre>
                  </div>
                </>
              )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {step === 1
            ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )
            : step === 2
            ? (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleReview}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
                >
                  Review & Sign <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )
            : (
              <>
                {!sendSuccess && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      disabled={isSending}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleSaveLocallyOnly}
                        disabled={isSending}
                      >
                        Save Locally Only
                      </Button>
                      <Button
                        onClick={handleSendToServer}
                        disabled={isSending}
                        className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
                      >
                        {isSending ? "Sending..." : "Send to Server"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
