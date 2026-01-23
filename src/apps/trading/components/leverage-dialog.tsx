/**
 * Leverage Dialog Component
 * Dialog for setting trading leverage
 */

import { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeverageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  symbol?: string;
  currentLeverage?: number;
}

const LEVERAGE_PRESETS = [1, 5, 10, 20, 50, 75, 100, 125];

export function LeverageDialog({
  open,
  onOpenChange,
  accountId,
  symbol,
  currentLeverage = 1,
}: LeverageDialogProps) {
  const { setLeverage, leverageUpdating } = useTradingStore();

  const [leverage, setLeverageValue] = useState(currentLeverage);

  const handleSubmit = useCallback(async () => {
    const success = await setLeverage({
      accountId,
      leverage,
      symbol,
    });

    if (success) {
      onOpenChange(false);
    }
  }, [accountId, leverage, symbol, setLeverage, onOpenChange]);

  const isHighLeverage = leverage >= 50;
  const isExtremelyHighLeverage = leverage >= 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Leverage</DialogTitle>
          <DialogDescription>
            {symbol ? `Set leverage for ${symbol}` : "Set leverage for all symbols"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Leverage Display */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div
                className={cn(
                  "text-5xl font-bold font-mono",
                  isExtremelyHighLeverage && "text-red-500",
                  isHighLeverage && !isExtremelyHighLeverage && "text-yellow-500"
                )}
              >
                {leverage}x
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Maximum position: ${(10000 * leverage).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <Slider
              value={[leverage]}
              onValueChange={([value]) => setLeverageValue(value)}
              min={1}
              max={125}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1x</span>
              <span>125x</span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {LEVERAGE_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={leverage === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setLeverageValue(preset)}
                className={cn(
                  "flex-1 min-w-[50px]",
                  preset >= 100 && "border-red-500/30",
                  preset >= 50 && preset < 100 && "border-yellow-500/30"
                )}
              >
                {preset}x
              </Button>
            ))}
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="leverage-input">Custom leverage</Label>
            <Input
              id="leverage-input"
              type="number"
              min={1}
              max={125}
              value={leverage}
              onChange={(e) => {
                const value = Math.min(125, Math.max(1, parseInt(e.target.value) || 1));
                setLeverageValue(value);
              }}
            />
          </div>

          {/* Warning */}
          {isHighLeverage && (
            <div
              className={cn(
                "flex items-start gap-2 p-3 rounded-lg text-sm",
                isExtremelyHighLeverage
                  ? "bg-red-500/10 text-red-500"
                  : "bg-yellow-500/10 text-yellow-500"
              )}
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong>High leverage warning</strong>
                <p className="text-xs mt-1 opacity-80">
                  {isExtremelyHighLeverage
                    ? "Extremely high leverage significantly increases your risk of liquidation. Only use if you understand the risks."
                    : "Higher leverage increases both potential profits and losses. Use with caution."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={leverageUpdating}>
            {leverageUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Set ${leverage}x Leverage`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
