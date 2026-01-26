/**
 * Enhanced Positions Panel Component
 * Displays open positions with P&L and mini sparklines
 * Updated v2.15.0: Added position management actions (close, margin, mode)
 */

import { useState, useEffect, useCallback } from "react";
import { useTradingStore } from "../store";
import type { Position, MarginMode, MarginAction } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Sparkles, 
  MoreVertical,
  X,
  Plus,
  Minus,
  Settings2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Mini PnL Sparkline Component
// ============================================
interface MiniPnLSparklineProps {
  value: number;
  percentage: number;
  width?: number;
  height?: number;
}

function MiniPnLSparkline({ value, percentage, width = 40 }: MiniPnLSparklineProps) {
  const isPositive = value >= 0;
  const absPercentage = Math.min(Math.abs(percentage), 100);
  
  // Create a simple visual bar representation
  return (
    <div className="flex items-center gap-1">
      <div 
        className="h-1.5 rounded-full overflow-hidden bg-muted/50"
        style={{ width }}
      >
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isPositive 
              ? "bg-gradient-to-r from-trading-buy/50 to-trading-buy" 
              : "bg-gradient-to-r from-trading-sell/50 to-trading-sell"
          )}
          style={{ width: `${Math.max(absPercentage, 5)}%` }}
        />
      </div>
    </div>
  );
}

interface PositionsPanelProps {
  accountId: string;
  symbol?: string;
  /** Enable professional trading features (v2.15.0) */
  enableProfessionalFeatures?: boolean;
}

export function PositionsPanel({ accountId, symbol, enableProfessionalFeatures = false }: PositionsPanelProps) {
  const {
    positions,
    positionsLoading,
    positionsError,
    fetchPositions,
    setSelectedPosition,
    closePosition,
    closingPosition,
    modifyMargin,
    marginModifying,
    setMarginMode,
    marginModeUpdating,
    marginMode,
    setPositionMode,
    positionModeUpdating,
    positionMode,
  } = useTradingStore();

  // Dialog states
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedPosForAction, setSelectedPosForAction] = useState<Position | null>(null);
  
  // Close position form
  const [closeAmount, setCloseAmount] = useState("");
  const [closePrice, setClosePrice] = useState("");
  
  // Margin form
  const [marginAmount, setMarginAmount] = useState("");
  const [marginAction, setMarginAction] = useState<MarginAction>("add");
  
  // Settings form
  const [newMarginMode, setNewMarginMode] = useState<MarginMode>("cross");
  const [newPositionMode, setNewPositionMode] = useState<boolean>(false); // false = one-way

  // Fetch positions
  const handleFetch = useCallback(() => {
    fetchPositions({ accountId, symbol });
  }, [accountId, symbol, fetchPositions]);

  useEffect(() => {
    if (accountId) {
      handleFetch();
    }
  }, [accountId, handleFetch]);

  // Handle close position
  const handleClosePosition = useCallback(async () => {
    if (!selectedPosForAction) return;
    
    const result = await closePosition({
      accountId,
      symbol: selectedPosForAction.symbol,
      amount: closeAmount ? parseFloat(closeAmount) : undefined,
      price: closePrice ? parseFloat(closePrice) : undefined,
    });
    
    if (result) {
      setCloseDialogOpen(false);
      setCloseAmount("");
      setClosePrice("");
      setSelectedPosForAction(null);
      handleFetch(); // Refresh positions
    }
  }, [accountId, selectedPosForAction, closeAmount, closePrice, closePosition, handleFetch]);

  // Handle modify margin
  const handleModifyMargin = useCallback(async () => {
    if (!selectedPosForAction || !marginAmount) return;
    
    const result = await modifyMargin({
      accountId,
      symbol: selectedPosForAction.symbol,
      amount: parseFloat(marginAmount),
      action: marginAction,
    });
    
    if (result) {
      setMarginDialogOpen(false);
      setMarginAmount("");
      setSelectedPosForAction(null);
      handleFetch();
    }
  }, [accountId, selectedPosForAction, marginAmount, marginAction, modifyMargin, handleFetch]);

  // Handle save settings (margin mode, position mode)
  const handleSaveSettings = useCallback(async () => {
    if (!selectedPosForAction) return;
    
    let success = true;
    
    // Update margin mode
    if (marginMode !== newMarginMode) {
      const result = await setMarginMode({
        accountId,
        marginMode: newMarginMode,
        symbol: selectedPosForAction.symbol,
      });
      success = success && result;
    }
    
    // Update position mode
    const currentHedged = positionMode === "hedge";
    if (currentHedged !== newPositionMode) {
      const result = await setPositionMode({
        accountId,
        hedged: newPositionMode,
        symbol: selectedPosForAction.symbol,
      });
      success = success && result;
    }
    
    if (success) {
      setSettingsDialogOpen(false);
      setSelectedPosForAction(null);
    }
  }, [accountId, selectedPosForAction, marginMode, newMarginMode, positionMode, newPositionMode, setMarginMode, setPositionMode]);

  // Open dialogs
  const openCloseDialog = (position: Position) => {
    setSelectedPosForAction(position);
    setCloseAmount("");
    setClosePrice("");
    setCloseDialogOpen(true);
  };

  const openMarginDialog = (position: Position, action: MarginAction) => {
    setSelectedPosForAction(position);
    setMarginAction(action);
    setMarginAmount("");
    setMarginDialogOpen(true);
  };

  const openSettingsDialog = (position: Position) => {
    setSelectedPosForAction(position);
    setNewMarginMode(marginMode || "cross");
    setNewPositionMode(positionMode === "hedge");
    setSettingsDialogOpen(true);
  };

  // Filter positions by symbol if specified
  const filteredPositions = symbol
    ? positions.filter((p) => p.symbol === symbol)
    : positions;

  // Calculate total unrealized P&L
  const totalPnl = filteredPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  if (positionsLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positionsError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{positionsError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleFetch}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Positions
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
                {filteredPositions.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {filteredPositions.length > 0 && (
                <Badge 
                  variant="outline"
                  className={cn(
                    "h-6 px-2 font-mono text-xs font-semibold border-0 rounded-md",
                    totalPnl >= 0 
                      ? "bg-trading-buy/15 text-trading-buy shadow-[0_0_10px_rgba(34,197,94,0.15)]" 
                      : "bg-trading-sell/15 text-trading-sell shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                  )}
                >
                  {totalPnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={handleFetch}
                disabled={positionsLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", positionsLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPositions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No open positions
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                  <TableRow className="h-7 border-b-2">
                    <TableHead className="w-[100px] text-[10px] font-semibold">Symbol</TableHead>
                    <TableHead className="text-[10px] font-semibold">Side</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold">Size</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold">Entry</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold">Mark</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold">P&L</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold">Lev.</TableHead>
                    {enableProfessionalFeatures && (
                      <TableHead className="w-8 text-[10px]"></TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.map((position, index) => (
                    <PositionRow
                      key={`${position.symbol}-${index}`}
                      position={position}
                      onClick={() => setSelectedPosition(position)}
                      enableActions={enableProfessionalFeatures}
                      onClose={openCloseDialog}
                      onAddMargin={(p) => openMarginDialog(p, "add")}
                      onReduceMargin={(p) => openMarginDialog(p, "reduce")}
                      onSettings={openSettingsDialog}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Position Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-4 w-4 text-trading-sell" />
              Close Position
            </DialogTitle>
            <DialogDescription>
              {selectedPosForAction && (
                <span className="font-mono">
                  {selectedPosForAction.symbol} - {selectedPosForAction.side.toUpperCase()} {selectedPosForAction.amount}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Amount (leave empty for full close)</Label>
              <Input
                type="number"
                step="any"
                placeholder={selectedPosForAction?.amount.toString() || "0"}
                value={closeAmount}
                onChange={(e) => setCloseAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Price (leave empty for market close)</Label>
              <Input
                type="number"
                step="any"
                placeholder="Market"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClosePosition}
              disabled={closingPosition}
            >
              {closingPosition && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Close Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify Margin Dialog */}
      <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {marginAction === "add" ? (
                <Plus className="h-4 w-4 text-trading-buy" />
              ) : (
                <Minus className="h-4 w-4 text-trading-sell" />
              )}
              {marginAction === "add" ? "Add" : "Reduce"} Margin
            </DialogTitle>
            <DialogDescription>
              {selectedPosForAction && (
                <span className="font-mono">
                  {selectedPosForAction.symbol} - Current margin: {selectedPosForAction.margin}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Amount (USDT)</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={marginAmount}
                onChange={(e) => setMarginAmount(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarginDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={marginAction === "add" ? "default" : "destructive"}
              onClick={handleModifyMargin}
              disabled={marginModifying || !marginAmount}
            >
              {marginModifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {marginAction === "add" ? "Add" : "Reduce"} Margin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Position Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Position Settings
            </DialogTitle>
            <DialogDescription>
              Configure margin and position mode for {selectedPosForAction?.symbol}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Margin Mode</Label>
              <Select value={newMarginMode} onValueChange={(v) => setNewMarginMode(v as MarginMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cross">Cross Margin</SelectItem>
                  <SelectItem value="isolated">Isolated Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Position Mode</Label>
              <Select 
                value={newPositionMode ? "hedge" : "one-way"} 
                onValueChange={(v) => setNewPositionMode(v === "hedge")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-way">One-Way Mode</SelectItem>
                  <SelectItem value="hedge">Hedge Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={marginModeUpdating || positionModeUpdating}
            >
              {(marginModeUpdating || positionModeUpdating) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PositionRowProps {
  position: Position;
  onClick: () => void;
  enableActions?: boolean;
  onClose?: (position: Position) => void;
  onAddMargin?: (position: Position) => void;
  onReduceMargin?: (position: Position) => void;
  onSettings?: (position: Position) => void;
}

function PositionRow({ 
  position, 
  onClick,
  enableActions = false,
  onClose,
  onAddMargin,
  onReduceMargin,
  onSettings,
}: PositionRowProps) {
  const isProfit = position.unrealizedPnl >= 0;

  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors h-8",
        "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5",
        position.side === "long" ? "before:bg-trading-buy" : "before:bg-trading-sell"
      )} 
      onClick={onClick}
    >
      <TableCell className="font-mono text-[10px] font-medium">{position.symbol}</TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold",
            position.side === "long"
              ? "bg-trading-buy/15 text-trading-buy"
              : "bg-trading-sell/15 text-trading-sell"
          )}
        >
          {position.side === "long" ? (
            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
          )}
          {position.side.toUpperCase()}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-[10px]">
        {position.amount.toFixed(4)}
      </TableCell>
      <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
        {position.entryPrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono text-[10px]">
        {position.markPrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              "font-mono text-[10px] font-semibold",
              isProfit ? "text-trading-buy" : "text-trading-sell"
            )}
          >
            {isProfit ? "+" : ""}{position.unrealizedPnl.toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <MiniPnLSparkline 
              value={position.unrealizedPnl} 
              percentage={position.percentage} 
              width={30}
            />
            <span className={cn(
              "text-[9px] font-mono",
              isProfit ? "text-trading-buy" : "text-trading-sell"
            )}>
              {position.percentage >= 0 ? "+" : ""}{position.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className="h-5 px-1 text-[9px] font-mono border-muted">
          {position.leverage}x
        </Badge>
      </TableCell>
      {enableActions && (
        <TableCell className="w-8 p-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClose?.(position); }}>
                <X className="h-3.5 w-3.5 mr-2 text-trading-sell" />
                Close Position
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddMargin?.(position); }}>
                <Plus className="h-3.5 w-3.5 mr-2 text-trading-buy" />
                Add Margin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReduceMargin?.(position); }}>
                <Minus className="h-3.5 w-3.5 mr-2 text-trading-sell" />
                Reduce Margin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSettings?.(position); }}>
                <Settings2 className="h-3.5 w-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}
