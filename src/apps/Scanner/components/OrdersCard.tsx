import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { CheckCircle, Clock, ShoppingCart, XCircle } from "lucide-react";
import { MetricCard } from "./MetricCard.tsx";
import { formatCurrency, formatDate, formatNumber } from "../utils.ts";
import type { OrderInfo } from "../types.ts";

interface OrdersCardProps {
  orders: {
    open: OrderInfo[];
    closed: OrderInfo[];
    canceled: OrderInfo[];
  };
}

/**
 * Orders management display component
 */
export const OrdersCard: React.FC<OrdersCardProps> = ({ orders }) => {
  const hasOrders = orders.open.length > 0 ||
    orders.closed.length > 0 ||
    orders.canceled.length > 0;

  if (!hasOrders) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Order Management</CardTitle>
            <CardDescription>
              Trading orders and execution history
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="open" className="w-full">
          <TabsList className="w-full h-auto p-1 bg-muted/50 border-b rounded-none">
            <TabsTrigger
              value="open"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
            >
              <Clock className="h-4 w-4" />
              <span>Open Orders</span>
              <Badge variant="secondary" className="text-xs">
                {orders.open.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="closed"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Executed</span>
              <Badge variant="secondary" className="text-xs">
                {orders.closed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="canceled"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
            >
              <XCircle className="h-4 w-4" />
              <span>Canceled</span>
              <Badge variant="secondary" className="text-xs">
                {orders.canceled.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Open Orders Tab */}
          <TabsContent value="open" className="space-y-3 p-4">
            {orders.open.length === 0
              ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No open orders
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your pending orders will appear here
                  </p>
                </div>
              )
              : (
                orders.open.map((order: OrderInfo, index: number) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <h4 className="font-semibold truncate">
                            {order.symbol}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={order.side === "sell"
                                ? "destructive"
                                : "default"}
                              className="text-xs"
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                        <MetricCard
                          label="Price"
                          value={formatCurrency(order.price)}
                          size="sm"
                        />
                        <MetricCard
                          label="Quantity"
                          value={formatNumber(order.amount, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Executed"
                          value={formatNumber(order.filled, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Remaining"
                          value={formatNumber(order.remaining, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Cost"
                          value={formatCurrency(order.cost)}
                          size="sm"
                        />
                        <MetricCard
                          label="Time"
                          value={formatDate(order.timestamp)}
                          size="sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </TabsContent>

          {/* Closed Orders Tab */}
          <TabsContent value="closed" className="space-y-3 p-4">
            {orders.closed.length === 0
              ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No executed orders
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your completed orders will appear here
                  </p>
                </div>
              )
              : (
                orders.closed.map((order: OrderInfo, index: number) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <h4 className="font-semibold truncate">
                            {order.symbol}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={order.side === "sell"
                                ? "destructive"
                                : "default"}
                              className="text-xs"
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant="default"
                          className="text-xs flex-shrink-0"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                        <MetricCard
                          label="Price"
                          value={formatCurrency(order.price)}
                          size="sm"
                        />
                        <MetricCard
                          label="Quantity"
                          value={formatNumber(order.amount, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Executed"
                          value={formatNumber(order.filled, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Cost"
                          value={formatCurrency(order.cost)}
                          size="sm"
                        />
                        <MetricCard
                          label="Fee"
                          value={`${
                            formatCurrency(order.fee.cost)
                          } ${order.fee.currency}`}
                          size="sm"
                        />
                        <MetricCard
                          label="Time"
                          value={formatDate(order.timestamp)}
                          size="sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </TabsContent>

          {/* Canceled Orders Tab */}
          <TabsContent value="canceled" className="space-y-3 p-4">
            {orders.canceled.length === 0
              ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No canceled orders
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your canceled orders will appear here
                  </p>
                </div>
              )
              : (
                orders.canceled.map((order: OrderInfo, index: number) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <h4 className="font-semibold truncate">
                            {order.symbol}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={order.side === "sell"
                                ? "destructive"
                                : "default"}
                              className="text-xs"
                            >
                              {order.side.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant="destructive"
                          className="text-xs flex-shrink-0"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <MetricCard
                          label="Price"
                          value={formatCurrency(order.price)}
                          size="sm"
                        />
                        <MetricCard
                          label="Quantity"
                          value={formatNumber(order.amount, 4)}
                          size="sm"
                        />
                        <MetricCard
                          label="Creation Time"
                          value={formatDate(order.timestamp)}
                          size="sm"
                        />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">
                            Order ID
                          </p>
                          <p className="font-mono text-xs break-all text-muted-foreground">
                            {order.id}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
