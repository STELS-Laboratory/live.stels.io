/**
 * Price Alerts Panel Component
 * Displays and manages price alerts
 */

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Volume2,
  BellRing,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertsStore } from "../stores/alerts.store";
import { useRealtimeTicker } from "../hooks";
import type { AlertCondition, AlertNotifyMethod, PriceAlert } from "../types";

interface AlertsPanelProps {
  symbol: string;
  exchange: string;
  market: string;
}

export function AlertsPanel({ symbol, exchange, market }: AlertsPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlertPrice, setNewAlertPrice] = useState("");
  const [newAlertCondition, setNewAlertCondition] = useState<AlertCondition>("above");
  const [newAlertNotify, setNewAlertNotify] = useState<AlertNotifyMethod>("both");

  const {
    alerts,
    createAlert,
    deleteAlert,
    toggleAlert,
    checkAlerts,
    requestNotificationPermission,
  } = useAlertsStore();

  // Get current price for checking alerts
  const { raw: tickerData } = useRealtimeTicker(symbol, exchange, market, { interval: 1000 });

  // Check alerts when price updates
  useEffect(() => {
    if (tickerData?.last) {
      checkAlerts(symbol, exchange, market, tickerData.last);
    }
  }, [tickerData?.last, symbol, exchange, market, checkAlerts]);

  // Filter alerts for current symbol
  const symbolAlerts = alerts.filter(
    (a) => a.symbol === symbol && a.exchange === exchange && a.market === market
  );
  const activeAlerts = symbolAlerts.filter((a) => a.isActive && !a.triggeredAt);
  const triggeredAlerts = symbolAlerts.filter((a) => a.triggeredAt);

  // Create new alert
  const handleCreateAlert = useCallback(() => {
    const price = parseFloat(newAlertPrice);
    if (isNaN(price) || price <= 0) return;

    createAlert({
      symbol,
      exchange,
      market,
      condition: newAlertCondition,
      price,
      isActive: true,
      notifyMethod: newAlertNotify,
    });

    // Reset form
    setNewAlertPrice("");
    setIsCreateDialogOpen(false);

    // Request notification permission
    if (newAlertNotify === "notification" || newAlertNotify === "both") {
      requestNotificationPermission();
    }
  }, [
    newAlertPrice,
    newAlertCondition,
    newAlertNotify,
    symbol,
    exchange,
    market,
    createAlert,
    requestNotificationPermission,
  ]);

  // Set price from current ticker
  const handleSetCurrentPrice = useCallback(() => {
    if (tickerData?.last) {
      setNewAlertPrice(tickerData.last.toString());
    }
  }, [tickerData?.last]);

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return price.toFixed(4);
  };

  // Get condition icon
  const getConditionIcon = (condition: AlertCondition) => {
    switch (condition) {
      case "above":
        return <TrendingUp className="h-3 w-3" />;
      case "below":
        return <TrendingDown className="h-3 w-3" />;
      case "cross":
        return <ArrowUpDown className="h-3 w-3" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Price Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeAlerts.length} active
            </Badge>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Symbol Display */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <span className="text-sm text-muted-foreground">Symbol</span>
                    <span className="font-medium">{symbol}</span>
                  </div>

                  {/* Current Price */}
                  {tickerData && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm text-muted-foreground">Current Price</span>
                      <span className="font-mono font-medium">
                        ${formatPrice(tickerData.last)}
                      </span>
                    </div>
                  )}

                  {/* Condition */}
                  <div className="space-y-2">
                    <Label>Alert when price is</Label>
                    <Select
                      value={newAlertCondition}
                      onValueChange={(v) => setNewAlertCondition(v as AlertCondition)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Above or equal
                          </div>
                        </SelectItem>
                        <SelectItem value="below">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            Below or equal
                          </div>
                        </SelectItem>
                        <SelectItem value="cross">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-blue-500" />
                            Crosses
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Target Price</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleSetCurrentPrice}
                      >
                        Use Current
                      </Button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAlertPrice}
                      onChange={(e) => setNewAlertPrice(e.target.value)}
                    />
                  </div>

                  {/* Notification Method */}
                  <div className="space-y-2">
                    <Label>Notification</Label>
                    <Select
                      value={newAlertNotify}
                      onValueChange={(v) => setNewAlertNotify(v as AlertNotifyMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sound">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Sound only
                          </div>
                        </SelectItem>
                        <SelectItem value="notification">
                          <div className="flex items-center gap-2">
                            <BellRing className="h-4 w-4" />
                            Browser notification
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Both
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAlert} disabled={!newAlertPrice}>
                    Create Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-hidden">
        {symbolAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p>No alerts for {symbol}</p>
            <p className="text-xs mt-1">Create an alert to get notified</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="space-y-1">
                  {activeAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      currentPrice={tickerData?.last}
                      onToggle={() => toggleAlert(alert.id)}
                      onDelete={() => deleteAlert(alert.id)}
                      formatPrice={formatPrice}
                      getConditionIcon={getConditionIcon}
                    />
                  ))}
                </div>
              )}

              {/* Triggered Alerts */}
              {triggeredAlerts.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground px-1 pt-2 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Triggered
                  </div>
                  <div className="space-y-1 opacity-60">
                    {triggeredAlerts.map((alert) => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        currentPrice={tickerData?.last}
                        onToggle={() => toggleAlert(alert.id)}
                        onDelete={() => deleteAlert(alert.id)}
                        formatPrice={formatPrice}
                        getConditionIcon={getConditionIcon}
                        isTriggered
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Alert Item Component
interface AlertItemProps {
  alert: PriceAlert;
  currentPrice?: number;
  onToggle: () => void;
  onDelete: () => void;
  formatPrice: (price: number) => string;
  getConditionIcon: (condition: AlertCondition) => React.ReactNode;
  isTriggered?: boolean;
}

function AlertItem({
  alert,
  currentPrice,
  onToggle,
  onDelete,
  formatPrice,
  getConditionIcon,
  isTriggered,
}: AlertItemProps) {
  // Calculate distance from current price
  const distance = currentPrice ? ((alert.price - currentPrice) / currentPrice) * 100 : 0;
  const isAbove = alert.price > (currentPrice || 0);

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
        isTriggered
          ? "bg-muted/30 border-dashed"
          : alert.isActive
          ? "bg-background hover:bg-muted/50"
          : "bg-muted/30"
      )}
    >
      {/* Condition Icon */}
      <div
        className={cn(
          "p-1.5 rounded",
          alert.condition === "above"
            ? "bg-green-500/10 text-green-500"
            : alert.condition === "below"
            ? "bg-red-500/10 text-red-500"
            : "bg-blue-500/10 text-blue-500"
        )}
      >
        {getConditionIcon(alert.condition)}
      </div>

      {/* Price & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-sm">
            ${formatPrice(alert.price)}
          </span>
          {currentPrice && !isTriggered && (
            <span
              className={cn(
                "text-xs",
                isAbove ? "text-green-500" : "text-red-500"
              )}
            >
              {isAbove ? "+" : ""}
              {distance.toFixed(2)}%
            </span>
          )}
        </div>
        {isTriggered && alert.triggeredAt && (
          <div className="text-xs text-muted-foreground">
            Triggered {new Date(alert.triggeredAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Notify Method Icon */}
      <div className="text-muted-foreground">
        {alert.notifyMethod === "sound" && <Volume2 className="h-3.5 w-3.5" />}
        {alert.notifyMethod === "notification" && <BellRing className="h-3.5 w-3.5" />}
        {alert.notifyMethod === "both" && <Bell className="h-3.5 w-3.5" />}
      </div>

      {/* Toggle */}
      {!isTriggered && (
        <Switch
          checked={alert.isActive}
          onCheckedChange={onToggle}
          className="scale-75"
        />
      )}

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
