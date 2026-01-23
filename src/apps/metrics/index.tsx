/**
 * Metrics App Component
 * Dashboard for system, logging, and trading metrics
 * 
 * Updated for WebFIX v2.12.0 FullMetrics structure
 * See: /docs/METRICS-FRONTEND-GUIDE.md
 */

import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useMetricsStore } from "@/stores/modules/metrics.store";
import type { LoggingMetricsPeriod } from "@/stores/modules/metrics.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Activity,
  Server,
  Database,
  Clock,
  MemoryStick,
  Cpu,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Gauge,
  Globe,
  Zap,
  Link2,
  Bot,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricsApp() {
  const connectionSession = useAuthStore((s) => s.connectionSession);
  
  const {
    metrics,
    loggingMetrics,
    tradingMetrics,
    metricsLoading,
    loggingLoading,
    tradingLoading,
    metricsError,
    loggingError,
    tradingError,
    lastMetricsUpdate,
    getMetrics,
    getLoggingMetrics,
    getTradingMetrics,
    refreshAll,
  } = useMetricsStore();

  const [loggingPeriod, setLoggingPeriod] = useState<LoggingMetricsPeriod>("day");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load metrics on mount (only once)
  useEffect(() => {
    if (!connectionSession || initialLoadDone) return;
    setInitialLoadDone(true);
    // Auto-load metrics on mount
    refreshAll();
  }, [connectionSession, initialLoadDone, refreshAll]);

  // Auto-refresh (only when explicitly enabled)
  useEffect(() => {
    if (!autoRefresh || !connectionSession) return;
    
    const interval = setInterval(() => {
      refreshAll();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, connectionSession, refreshAll]);

  const handleRefresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const isLoading = metricsLoading || loggingLoading || tradingLoading;

  if (!connectionSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please connect to view metrics</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Metrics
          </h2>
          {lastMetricsUpdate && (
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date(lastMetricsUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={cn("h-4 w-4 mr-2", autoRefresh && "animate-pulse")} />
            Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="system" className="flex-1">
        <TabsList className="flex-wrap">
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="application">
            <Activity className="h-4 w-4 mr-2" />
            Application
          </TabsTrigger>
          <TabsTrigger value="rpc">
            <Zap className="h-4 w-4 mr-2" />
            RPC
          </TabsTrigger>
          <TabsTrigger value="logging">
            <FileText className="h-4 w-4 mr-2" />
            Logging
          </TabsTrigger>
          <TabsTrigger value="trading">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trading
          </TabsTrigger>
        </TabsList>

        {/* System Metrics */}
        <TabsContent value="system" className="mt-4">
          {metricsError ? (
            <ErrorCard error={metricsError} onRetry={() => getMetrics()} />
          ) : metricsLoading && !metrics ? (
            <LoadingCards count={4} />
          ) : metrics?.system ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Uptime"
                icon={Clock}
                value={formatUptime(metrics.system.uptime)}
                description="Server uptime"
              />
              <MetricCard
                title="Heap Used"
                icon={MemoryStick}
                value={formatBytes(metrics.system.memory.heapUsed)}
                description={`of ${formatBytes(metrics.system.memory.heapTotal)} total`}
                progress={(metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100}
              />
              <MetricCard
                title="RSS Memory"
                icon={Cpu}
                value={formatBytes(metrics.system.memory.rss)}
                description="Resident Set Size"
              />
              {metrics.system.deno && (
                <MetricCard
                  title="Deno Version"
                  icon={Server}
                  value={metrics.system.deno.version}
                  description={metrics.system.deno.buildType}
                />
              )}
            </div>
          ) : (
            <EmptyState message="No system metrics available. Click Refresh to load." />
          )}

          {/* Routing Metrics */}
          {metrics?.routing && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Routing Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      By Access Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Public</span>
                        <Badge variant="outline">{metrics.routing.byAccess.public}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Session</span>
                        <Badge variant="outline">{metrics.routing.byAccess.session}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Developer</span>
                        <Badge variant="outline">{metrics.routing.byAccess.developer}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Owner</span>
                        <Badge variant="outline">{metrics.routing.byAccess.owner}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      By Rate Limit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Body</span>
                        <Badge variant="outline">{metrics.routing.byRateLimit.body}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Global</span>
                        <Badge variant="outline">{metrics.routing.byRateLimit.global}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Trading</span>
                        <Badge variant="outline">{metrics.routing.byRateLimit.trading}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Auth</span>
                        <Badge variant="outline">{metrics.routing.byRateLimit.auth}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      By Tag
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Total routes: {metrics.routing.totalRoutes}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(metrics.routing.byTag).slice(0, 8).map(([tag, count]) => (
                        <Badge key={tag} variant="secondary">
                          {tag}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tracing Metrics */}
          {metrics?.tracing && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Tracing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      <div>
                        <div className="text-2xl font-bold font-mono">{metrics.tracing.activeSpans}</div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono">{metrics.tracing.completedSpans.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {metrics.tracing.recentTraces && metrics.tracing.recentTraces.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Traces</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {metrics.tracing.recentTraces.slice(0, 5).map((trace) => (
                          <div key={trace.traceId} className="flex items-center justify-between">
                            <code className="text-xs">{trace.operationName}</code>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{trace.duration.toFixed(0)}ms</span>
                              <Badge variant={trace.status === "ok" ? "default" : "destructive"} className="text-xs">
                                {trace.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Application Metrics */}
        <TabsContent value="application" className="mt-4">
          {metricsError ? (
            <ErrorCard error={metricsError} onRetry={() => getMetrics()} />
          ) : metricsLoading && !metrics ? (
            <LoadingCards count={6} />
          ) : metrics?.application ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* HTTP Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTTP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.http.requestsTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-destructive">
                      {metrics.application.http.errorsTotal} errors
                    </span>
                    <span className="text-muted-foreground">
                      {metrics.application.http.avgRequestDuration.toFixed(1)}ms avg
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.agents.activeCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>{metrics.application.agents.messagesTotal.toLocaleString()} messages</span>
                    <span className="text-muted-foreground">
                      {metrics.application.agents.avgResponseTime.toFixed(0)}ms avg
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Task Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.tasks.executionsTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Executions</div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-yellow-500">
                      {metrics.application.tasks.pendingCount} pending
                    </span>
                    <span className="text-destructive">
                      {metrics.application.tasks.errorsTotal} errors
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Chain Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Chains
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.chains.executionsTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Executions</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {metrics.application.chains.avgExecutionDuration.toFixed(0)}ms avg
                  </div>
                </CardContent>
              </Card>

              {/* Connection Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.connections.activeCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Active WebSockets</div>
                  <div className="mt-2 text-sm text-destructive">
                    {metrics.application.connections.errorsTotal} errors
                  </div>
                </CardContent>
              </Card>

              {/* Domain Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Domains
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">
                    {metrics.application.domains.operationsTotal.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Operations</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {metrics.application.domains.avgOperationDuration.toFixed(1)}ms avg
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState message="No application metrics available. Click Refresh to load." />
          )}
        </TabsContent>

        {/* RPC Metrics */}
        <TabsContent value="rpc" className="mt-4">
          {metricsError ? (
            <ErrorCard error={metricsError} onRetry={() => getMetrics()} />
          ) : metricsLoading && !metrics ? (
            <LoadingCards count={2} />
          ) : metrics?.rpc ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Total Methods"
                  icon={Zap}
                  value={metrics.rpc.totalMethods.toString()}
                  description="Registered RPC methods"
                />
                <MetricCard
                  title="Total Calls"
                  icon={Activity}
                  value={metrics.rpc.totalCalls.toLocaleString()}
                  description="Since startup"
                />
                <MetricCard
                  title="Total Errors"
                  icon={AlertTriangle}
                  value={metrics.rpc.totalErrors.toLocaleString()}
                  description="Failed calls"
                  variant={metrics.rpc.totalErrors > 0 ? "destructive" : "default"}
                />
                <MetricCard
                  title="Avg Duration"
                  icon={Clock}
                  value={`${metrics.rpc.avgDuration.toFixed(1)}ms`}
                  description="Average response time"
                />
              </div>

              {/* Top Methods Table */}
              {metrics.rpc.topMethods && metrics.rpc.topMethods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top RPC Methods</CardTitle>
                    <CardDescription>Most called methods and their performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Calls</TableHead>
                          <TableHead className="text-right">Avg Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.rpc.topMethods.map((method) => (
                          <TableRow key={method.method}>
                            <TableCell>
                              <code className="text-sm">{method.method}</code>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {method.calls.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {method.avgDuration.toFixed(2)}ms
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <EmptyState message="No RPC metrics available. Click Refresh to load." />
          )}
        </TabsContent>

        {/* Logging Metrics */}
        <TabsContent value="logging" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Logging Statistics</h3>
            <Select
              value={loggingPeriod}
              onValueChange={(v) => setLoggingPeriod(v as LoggingMetricsPeriod)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Last Hour</SelectItem>
                <SelectItem value="day">Last Day</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loggingError ? (
            <ErrorCard error={loggingError} onRetry={() => getLoggingMetrics({ period: loggingPeriod })} />
          ) : loggingLoading && !loggingMetrics ? (
            <LoadingCards count={4} />
          ) : loggingMetrics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Logs"
                  icon={FileText}
                  value={loggingMetrics.totalLogs.toLocaleString()}
                  description={`in last ${loggingPeriod}`}
                />
                <MetricCard
                  title="Logs/Minute"
                  icon={Gauge}
                  value={loggingMetrics.logsPerMinute.toFixed(1)}
                  description="Average rate"
                />
                <MetricCard
                  title="Error Rate"
                  icon={AlertTriangle}
                  value={`${(loggingMetrics.errorRate * 100).toFixed(2)}%`}
                  description="Percentage of errors"
                  variant={loggingMetrics.errorRate > 0.05 ? "destructive" : "default"}
                />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      By Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <LogLevelBar label="Error" count={loggingMetrics.byLevel.error} color="bg-red-500" />
                      <LogLevelBar label="Warn" count={loggingMetrics.byLevel.warn} color="bg-yellow-500" />
                      <LogLevelBar label="Info" count={loggingMetrics.byLevel.info} color="bg-blue-500" />
                      <LogLevelBar label="Debug" count={loggingMetrics.byLevel.debug} color="bg-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Loggers */}
              {loggingMetrics.topLoggers && loggingMetrics.topLoggers.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Top Loggers</CardTitle>
                    <CardDescription>Workers with most log entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {loggingMetrics.topLoggers.map((logger, index) => (
                        <div key={logger.workerId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">#{index + 1}</span>
                            <code className="text-sm">{logger.workerId}</code>
                          </div>
                          <Badge variant="secondary">{logger.logCount.toLocaleString()} logs</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <EmptyState message="No logging metrics available" />
          )}
        </TabsContent>

        {/* Trading Metrics */}
        <TabsContent value="trading" className="mt-4">
          {tradingError ? (
            <ErrorCard error={tradingError} onRetry={() => getTradingMetrics()} />
          ) : tradingLoading && !tradingMetrics ? (
            <LoadingCards count={4} />
          ) : tradingMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tradingMetrics.pnl !== undefined && (
                <MetricCard
                  title="PnL"
                  icon={tradingMetrics.pnl >= 0 ? TrendingUp : TrendingDown}
                  value={`$${tradingMetrics.pnl.toLocaleString()}`}
                  description="Profit and Loss"
                  variant={tradingMetrics.pnl >= 0 ? "default" : "destructive"}
                />
              )}
              {tradingMetrics.spreadCapture !== undefined && (
                <MetricCard
                  title="Spread Capture"
                  icon={Gauge}
                  value={`${(tradingMetrics.spreadCapture * 100).toFixed(2)}%`}
                  description="Average spread captured"
                />
              )}
              {tradingMetrics.fillRate !== undefined && (
                <MetricCard
                  title="Fill Rate"
                  icon={CheckCircle}
                  value={`${(tradingMetrics.fillRate * 100).toFixed(1)}%`}
                  description="Order fill rate"
                />
              )}
              {tradingMetrics.sharpeRatio !== undefined && (
                <MetricCard
                  title="Sharpe Ratio"
                  icon={BarChart3}
                  value={tradingMetrics.sharpeRatio.toFixed(2)}
                  description="Risk-adjusted return"
                />
              )}
              {tradingMetrics.volume24h !== undefined && (
                <MetricCard
                  title="24h Volume"
                  icon={Activity}
                  value={`$${tradingMetrics.volume24h.toLocaleString()}`}
                  description="Trading volume"
                />
              )}
              {tradingMetrics.trades24h !== undefined && (
                <MetricCard
                  title="24h Trades"
                  icon={TrendingUp}
                  value={tradingMetrics.trades24h.toLocaleString()}
                  description="Number of trades"
                />
              )}
              {tradingMetrics.inventoryTurnover !== undefined && (
                <MetricCard
                  title="Inventory Turnover"
                  icon={RefreshCw}
                  value={tradingMetrics.inventoryTurnover.toFixed(2)}
                  description="Inventory rotation"
                />
              )}
            </div>
          ) : (
            <EmptyState message="No trading metrics available" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

interface MetricCardProps {
  title: string;
  icon: React.ElementType;
  value: string;
  description?: string;
  progress?: number;
  variant?: "default" | "destructive";
}

function MetricCard({ title, icon: Icon, value, description, progress, variant = "default" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={cn(
          "text-sm flex items-center gap-2",
          variant === "destructive" && "text-destructive"
        )}>
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold font-mono",
          variant === "destructive" && "text-destructive"
        )}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-1" />
        )}
      </CardContent>
    </Card>
  );
}

interface ComponentCardProps {
  title: string;
  icon: React.ElementType;
  total: number;
  active: number;
  error: number;
  activeLabel?: string;
}

function ComponentCard({ title, icon: Icon, total, active, error, activeLabel = "Active" }: ComponentCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono">{total}</div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1 text-green-500">
            <CheckCircle className="h-3 w-3" />
            {active} {activeLabel}
          </span>
          {error > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {error} Error
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LogLevelBarProps {
  label: string;
  count: number;
  color: string;
}

function LogLevelBar({ label, count, color }: LogLevelBarProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="w-12">{label}</span>
      <div className="flex-1 mx-2 h-2 bg-muted rounded overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${Math.min(100, count / 10)}%` }} />
      </div>
      <span className="w-16 text-right font-mono">{count.toLocaleString()}</span>
    </div>
  );
}

function LoadingCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

function ErrorCard({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format uptime in seconds to human-readable string
 */
function formatUptime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${mins % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${mins % 60}m`;
  }
  if (mins > 0) {
    return `${mins}m ${Math.floor(seconds % 60)}s`;
  }
  return `${Math.floor(seconds)}s`;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export default MetricsApp;
