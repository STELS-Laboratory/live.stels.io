import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  Grid3X3,
  List,
  Search,
  SortAsc,
  SortDesc,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeviceType } from "@/hooks/useMobile.ts";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DragPreview } from "./DragPreview";
import { WidgetStatusBadge } from "./WidgetStatusBadge";
import {
  type GroupedWidgets,
  type GroupingMode,
  type SessionStore,
  type SessionWidgetData,
  type WidgetCategories,
} from "@/lib/canvas-types";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { getAllSchemas } from "@/apps/Schemas/db.ts";
import type { SchemaProject } from "@/apps/Schemas/types.ts";

/**
 * Props for the WidgetStore component
 */
interface WidgetStoreProps {
  /** Whether the widget store is open */
  isOpen: boolean;
  /** Callback to close the widget store */
  onClose: () => void;
  /** Callback when drag starts */
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    keyStore: string,
  ) => void;
  /** Callback when touch starts (for mobile) */
  onTouchStart: (
    event: React.TouchEvent<HTMLDivElement>,
    keyStore: string,
  ) => void;
  /** Array of widget keys that are already in the current Canvas */
  existingWidgets?: string[];
}

/**
 * Props for the WidgetItem component
 */
interface WidgetItemProps {
  /** Key of the widget in session storage */
  keyStore: string;
  /** Widget data */
  widget: SessionWidgetData;
  /** Callback when drag starts */
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    keyStore: string,
  ) => void;
  /** Callback when touch starts */
  onTouchStart: (
    event: React.TouchEvent<HTMLDivElement>,
    keyStore: string,
  ) => void;
  /** Whether this is a mobile view */
  isMobile: boolean;
  /** Whether this is a compact view */
  isCompact?: boolean;
  /** Whether this widget is already in the Canvas */
  isInCanvas?: boolean;
}

/**
 * Props for the GroupHeader component
 */
interface GroupHeaderProps {
  /** Title of the group */
  title: string;
  /** Number of items in the group */
  count: number;
  /** Whether the group is currently expanded */
  isOpen: boolean;
  /** Callback when the group is toggled */
  onToggle: () => void;
  /** Indentation level (0 for top level) */
  level?: number;
  /** Whether this is mobile view */
  isMobile?: boolean;
  /** Whether this is tablet view */
  isTablet?: boolean;
}

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  /** Search term */
  searchTerm: string;
  /** Callback when search term changes */
  onSearchChange: (term: string) => void;
  /** Active category */
  activeCategory: string;
  /** Available categories */
  categories: string[];
  /** Callback when category changes */
  onCategoryChange: (category: string) => void;
  /** Grouping mode */
  groupingMode: GroupingMode;
  /** Callback when grouping mode changes */
  onGroupingModeChange: (mode: GroupingMode) => void;
  /** Sort direction */
  sortDirection: "asc" | "desc";
  /** Callback when sort direction changes */
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  /** View mode */
  viewMode: "grid" | "list";
  /** Callback when view mode changes */
  onViewModeChange: (mode: "grid" | "list") => void;
  /** Whether this is mobile view */
  isMobile: boolean;
  /** Whether this is tablet view */
  isTablet: boolean;
  /** Filter by widget status */
  statusFilter?: "all" | "available" | "inCanvas";
  /** Callback when status filter changes */
  onStatusFilterChange?: (filter: "all" | "available" | "inCanvas") => void;
}

/**
 * Helper function to extract category from widget key
 */
function extractCategory(key: string): string {
  const parts = key.split(".");
  return parts[1] || "Unknown";
}

/**
 * Helper function to extract widget type from widget key
 */
function extractWidgetType(key: string): string {
  const parts = key.split(".");
  return parts[parts.length - 1] || "Unknown";
}

/**
 * Helper function to get widget icon based on type
 */
function getWidgetIcon(widgetType: string): React.ReactNode {
  const iconClass = "h-4 w-4";

  switch (widgetType.toLowerCase()) {
    case "trades":
      return <Zap className={iconClass} />;
    case "book":
      return <List className={iconClass} />;
    case "candles":
      return <Grid3X3 className={iconClass} />;
    case "ticker":
      return <Zap className={iconClass} />;
    case "indicator":
      return <Filter className={iconClass} />;
    case "ariadna":
      return <Zap className={iconClass} />;
    case "finance":
      return <Zap className={iconClass} />;
    case "sonar":
      return <Zap className={iconClass} />;
    case "timezone":
      return <Zap className={iconClass} />;
    default:
      return <Zap className={iconClass} />;
  }
}

/**
 * Schema Item Component for drag & drop
 */
interface SchemaItemProps {
  schema: SchemaProject;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, key: string) => void;
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>, key: string) => void;
  isMobile: boolean;
  isCompact?: boolean;
  isInCanvas?: boolean;
}

function SchemaItem({
  schema,
  onDragStart,
  onTouchStart,
  isMobile,
  isCompact = false,
  isInCanvas = false,
}: SchemaItemProps): React.ReactElement {
  const {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragAndDrop();

  const handleItemDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (isInCanvas) {
        event.preventDefault();
        return;
      }
      // Pass schema data
      const schemaData = {
        type: "schema",
        widgetKey: schema.widgetKey,
        schemaId: schema.id,
        schemaType: schema.type,
        channelKeys: schema.channelKeys,
        ...schema,
      };
      handleDragStart(event, schemaData);
      onDragStart(event, `schema:${schema.widgetKey}`);
    },
    [schema, onDragStart, handleDragStart, isInCanvas],
  );

  const handleItemTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isInCanvas) {
        event.preventDefault();
        return;
      }
      const schemaData = {
        type: "schema",
        widgetKey: schema.widgetKey,
        schemaId: schema.id,
        ...schema,
      };
      handleTouchStart(event, schemaData);
      onTouchStart(event, `schema:${schema.widgetKey}`);
    },
    [schema, onTouchStart, handleTouchStart, isInCanvas],
  );

  const Icon = schema.type === "static" ? Box : Database;
  const typeColor = schema.type === "static"
    ? "text-purple-400"
    : "text-blue-400";
  const bgColor = schema.type === "static"
    ? "bg-purple-500/10"
    : "bg-blue-500/10";

  if (isCompact) {
    return (
      <div
        draggable={!isInCanvas}
        onDragStart={handleItemDragStart}
        onTouchStart={handleItemTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex items-center p-2 rounded-md transition-all duration-200",
          isInCanvas
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            : "bg-amber-600 text-black cursor-grab active:cursor-grabbing hover:bg-amber-500 hover:scale-105",
          dragState.isDragging && "opacity-50 scale-95",
          isMobile && "touch-manipulation",
        )}
        title={isInCanvas ? "Schema already in Canvas" : "Drag to add schema"}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{schema.name}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      draggable={!isInCanvas}
      onDragStart={handleItemDragStart}
      onTouchStart={handleItemTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragEnd={handleDragEnd}
      className={cn(
        "transition-all duration-200",
        isInCanvas
          ? "opacity-60 cursor-not-allowed"
          : "cursor-grab active:cursor-grabbing hover:shadow-lg hover:scale-[1.02]",
        dragState.isDragging && "opacity-50 scale-95",
        isMobile && "touch-manipulation",
      )}
    >
      <CardHeader className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className={cn("p-1.5 rounded", bgColor)}>
              <Icon className={cn("h-4 w-4", typeColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {schema.name}
              </CardTitle>
              {schema.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {schema.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="ml-2 flex-shrink-0">
            {schema.type === "static" ? "📦" : "📊"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          <span className="font-mono truncate">{schema.widgetKey}</span>
          {schema.channelKeys.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4">
              {schema.channelKeys.length} ch
            </Badge>
          )}
          {schema.nestedSchemas && schema.nestedSchemas.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4">
              {schema.nestedSchemas.length} nested
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Widget Item Component
 */
function WidgetItem({
  keyStore,
  widget,
  onDragStart,
  onTouchStart,
  isMobile,
  isCompact = false,
  isInCanvas = false,
}: WidgetItemProps): React.ReactElement {
  const {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragAndDrop();
  const widgetType = extractWidgetType(widget.widget);

  const handleItemDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (isInCanvas) {
        event.preventDefault();
        return;
      }
      handleDragStart(event, widget);
      onDragStart(event, keyStore);
    },
    [keyStore, onDragStart, handleDragStart, widget, isInCanvas],
  );

  const handleItemTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isInCanvas) {
        event.preventDefault();
        return;
      }
      handleTouchStart(event, widget);
      onTouchStart(event, keyStore);
    },
    [keyStore, onTouchStart, handleTouchStart, widget, isInCanvas],
  );

  if (isCompact) {
    return (
      <div
        draggable={!isInCanvas}
        onDragStart={handleItemDragStart}
        onTouchStart={handleItemTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex items-center p-2 rounded-md transition-all duration-200",
          isInCanvas
            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            : "bg-amber-600 text-black dark:text-black cursor-grab active:cursor-grabbing hover:bg-amber-500 hover:scale-105",
          dragState.isDragging && "opacity-50 scale-95",
          isMobile && "touch-manipulation",
        )}
        title={isInCanvas ? "Widget already in Canvas" : "Drag to add widget"}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getWidgetIcon(widgetType)}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {widget.module}
            </div>
            <div className="text-xs opacity-75 truncate">
              {widget.channel}
            </div>
          </div>
          <WidgetStatusBadge
            isInCanvas={isInCanvas}
            size="sm"
            showIcon={false}
          />
        </div>
      </div>
    );
  }

  return (
    <Card
      draggable={!isInCanvas}
      onDragStart={handleItemDragStart}
      onTouchStart={handleItemTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragEnd={handleDragEnd}
      className={cn(
        "transition-all duration-200",
        isInCanvas
          ? "cursor-not-allowed opacity-60 bg-secondary dark:bg-muted"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-105",
        dragState.isDragging && "opacity-50 scale-95",
        isMobile && "touch-manipulation",
      )}
      title={isInCanvas ? "Widget already in Canvas" : "Drag to add widget"}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widgetType)}
            <CardTitle className="text-sm font-medium truncate">
              {widget.module}
            </CardTitle>
          </div>
          <WidgetStatusBadge
            isInCanvas={isInCanvas}
            size="sm"
            showIcon={false}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">
            Channel: {widget.channel}
          </div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">
            Type: {widgetType}
          </div>
          <Badge variant="secondary" className="text-xs">
            {extractCategory(keyStore)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Group Header Component
 */
function GroupHeader({
  title,
  count,
  isOpen,
  onToggle,
  level = 0,
  isMobile = false,
  isTablet = false,
}: GroupHeaderProps): React.ReactElement {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer hover:bg-secondary dark:hover:bg-muted transition-colors",
        level === 0
          ? "bg-secondary/50 dark:bg-secondary/50"
          : "bg-secondary/30 dark:bg-muted/50",
        level === 0 && "sticky top-0 z-10",
        isMobile && "p-2",
        isTablet && "p-2.5",
      )}
      style={{ paddingLeft: `${level * 8 + 8}px` }}
    >
      <div className="flex items-center">
        {isOpen
          ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />}
        <span
          className={cn(
            "font-medium",
            level === 0 ? "text-sm" : "text-xs",
            isMobile && "text-xs",
            isTablet && "text-sm",
          )}
        >
          {title}
        </span>
      </div>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}

/**
 * Filter Bar Component
 */
function FilterBar({
  searchTerm,
  onSearchChange,
  sortDirection,
  onSortDirectionChange,
  viewMode,
  onViewModeChange,
  isMobile,
  isTablet,
}: FilterBarProps): React.ReactElement {
  return (
    <div className="space-y-3 p-3 border-b bg-muted/30 dark:bg-muted/50">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search widgets..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white dark:bg-secondary"
        />
      </div>

      {/* Controls */}
      <div
        className={cn(
          "flex flex-wrap gap-2",
          isMobile && "flex-col",
          isTablet && "gap-1.5",
        )}
      >
        {/* Sort Direction */}
        <Button
          variant="outline"
          size={isMobile ? "sm" : isTablet ? "sm" : "sm"}
          onClick={() =>
            onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
          className="whitespace-nowrap"
        >
          {sortDirection === "asc"
            ? <SortAsc className="h-4 w-4" />
            : <SortDesc className="h-4 w-4" />}
        </Button>

        {/* View Mode */}
        <Button
          variant="outline"
          size={isMobile ? "sm" : isTablet ? "sm" : "sm"}
          onClick={() =>
            onViewModeChange(viewMode === "grid" ? "list" : "grid")}
          className="whitespace-nowrap"
        >
          {viewMode === "grid"
            ? <Grid3X3 className="h-4 w-4" />
            : <List className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Main Widget Store Component
 */
export function WidgetStore({
  isOpen,
  onClose,
  onDragStart,
  onTouchStart,
  existingWidgets = [],
}: WidgetStoreProps): React.ReactElement | null {
  const session = useSessionStoreSync() as SessionStore | null;
  const { isMobile, isTablet } = useDeviceType();
  const { dragState } = useDragAndDrop();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedExchanges, setExpandedExchanges] = useState<
    Record<string, boolean>
  >({});
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>(
    {},
  );
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("exchange");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "inCanvas"
  >("all");
  const [schemas, setSchemas] = useState<SchemaProject[]>([]);

  // Load schemas from IndexedDB - only when needed
  useEffect(() => {
    const loadSchemas = async (): Promise<void> => {
      try {
        const allSchemas = await getAllSchemas();

        // Filter: only schemas with data available in session
        const schemasWithData = allSchemas.filter((schema) => {
          if (!session) return false;

          // Dynamic schemas - check if channels exist in session
          if (schema.type === "dynamic" && schema.channelKeys.length > 0) {
            return schema.channelKeys.some((channelKey) => {
              const data = session[channelKey];
              return data && typeof data === "object" &&
                ("raw" in data || "data" in data);
            });
          }

          // Static schemas - always show (they compose dynamic schemas)
          return schema.type === "static";
        });

        setSchemas(schemasWithData);
      } catch (error) {
        console.error("[WidgetStore] Failed to load schemas:", error);
      }
    };

    if (isOpen && session) {
      loadSchemas();
    }
  }, [isOpen, session]);

  // Refs for mobile touch handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  // Get all widget keys
  const keys = useMemo(() => {
    if (!session) return [];
    return Object.keys(session).filter((key) => session[key]?.module);
  }, [session]);

  // Categorize widgets + schemas
  const widgetsByCategory = useMemo<WidgetCategories>(() => {
    const categorized: WidgetCategories = { All: [], Schemas: [] };

    // Add session widgets
    if (session) {
      keys.forEach((key) => {
        const widget = session[key];
        if (widget && widget.module) {
          // Add to "All" category
          categorized.All.push(key);

          // Add to specific category
          const category = extractCategory(key);
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(key);
        }
      });
    }

    // Add schemas (use widgetKey as key)
    schemas.forEach((schema) => {
      const schemaKey = `schema:${schema.widgetKey}`;
      categorized.All.push(schemaKey);
      categorized.Schemas.push(schemaKey);
    });

    return categorized;
  }, [keys, session, schemas]);

  // Get categories
  const categories = useMemo<string[]>(() => {
    return Object.keys(widgetsByCategory).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      if (a === "Schemas") return -1;
      if (b === "Schemas") return 1;
      return a.localeCompare(b);
    });
  }, [widgetsByCategory]);

  // Filter widgets
  const filteredWidgets = useMemo<string[]>(() => {
    let categoryWidgets = widgetsByCategory[activeCategory] || [];

    // Apply search filter
    if (searchTerm) {
      categoryWidgets = categoryWidgets.filter((key) => {
        if (!session) return false;
        const widget = session[key];
        const searchLower = searchTerm.toLowerCase();

        return (
          widget.module.toLowerCase().includes(searchLower) ||
          widget.channel.toLowerCase().includes(searchLower) ||
          extractWidgetType(widget.widget).toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      categoryWidgets = categoryWidgets.filter((key) => {
        const isInCanvas = existingWidgets.includes(key);
        return statusFilter === "inCanvas" ? isInCanvas : !isInCanvas;
      });
    }

    return categoryWidgets;
  }, [
    activeCategory,
    searchTerm,
    widgetsByCategory,
    session,
    statusFilter,
    existingWidgets,
  ]);

  // Sort widgets
  const sortedWidgets = useMemo<string[]>(() => {
    return [...filteredWidgets].sort((a, b) => {
      if (!session) return 0;

      const widgetA = session[a];
      const widgetB = session[b];

      if (!widgetA || !widgetB) return 0;

      const comparison = widgetA.module.localeCompare(widgetB.module);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredWidgets, session, sortDirection]);

  // Calculate widget statistics
  const widgetStats = useMemo(() => {
    const total = sortedWidgets.length;
    const inCanvas = sortedWidgets.filter((key) =>
      existingWidgets.includes(key)
    ).length;
    const available = total - inCanvas;

    return { total, inCanvas, available };
  }, [sortedWidgets, existingWidgets]);

  // Group widgets
  const groupedWidgets = useMemo<GroupedWidgets>(() => {
    const grouped: GroupedWidgets = {};

    sortedWidgets.forEach((key) => {
      const exchange = extractCategory(key);
      const asset = extractWidgetType(key);

      if (!grouped[exchange]) {
        grouped[exchange] = {};
      }

      if (!grouped[exchange][asset]) {
        grouped[exchange][asset] = [];
      }

      grouped[exchange][asset].push(key);
    });

    return grouped;
  }, [sortedWidgets]);

  // Toggle functions
  const toggleExchange = useCallback((exchange: string) => {
    setExpandedExchanges((prev) => ({
      ...prev,
      [exchange]: !prev[exchange],
    }));
  }, []);

  const toggleAsset = useCallback((exchange: string, asset: string) => {
    const key = `${exchange}:${asset}`;
    setExpandedAssets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Mobile touch handling
  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>, keyStore: string) => {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // For mobile, we'll use a different approach
      // You might want to implement a long-press or double-tap to add widgets
      onTouchStart(event, keyStore);
    },
    [onTouchStart],
  );

  // Render grouped widgets
  const renderGroupedWidgets = (): React.ReactNode => {
    if (sortedWidgets.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground dark:text-muted-foreground">
          {searchTerm
            ? "No widgets match your search"
            : "No widgets available in this category"}
        </div>
      );
    }

    if (groupingMode === "exchange") {
      return Object.entries(groupedWidgets).map(([exchange, assets]) => {
        const isExchangeOpen = expandedExchanges[exchange] || false;
        const exchangeWidgetCount = Object.values(assets).flat().length;

        return (
          <div key={exchange} className="border-b last:border-b-0">
            <GroupHeader
              title={`Exchange: ${exchange}`}
              count={exchangeWidgetCount}
              isOpen={isExchangeOpen}
              onToggle={() => toggleExchange(exchange)}
              level={0}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isExchangeOpen &&
              Object.entries(assets).map(([asset, assetWidgets]) => {
                const assetKey = `${exchange}:${asset}`;
                const isAssetOpen = expandedAssets[assetKey] || false;

                return (
                  <div
                    key={assetKey}
                    className="border-t border-border/30 dark:border-border"
                  >
                    <GroupHeader
                      title={`${asset}`}
                      count={assetWidgets.length}
                      isOpen={isAssetOpen}
                      onToggle={() => toggleAsset(exchange, asset)}
                      level={1}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />

                    {isAssetOpen && (
                      <div
                        className={cn(
                          "p-2",
                          viewMode === "grid"
                            ? isMobile
                              ? "grid grid-cols-1 gap-2"
                              : isTablet
                              ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                              : "grid grid-cols-1 sm:grid-cols-2 gap-2"
                            : "space-y-2",
                        )}
                      >
                        {assetWidgets.map((keyStore) => {
                          // Check if it's a schema
                          if (keyStore.startsWith("schema:")) {
                            const widgetKey = keyStore.replace("schema:", "");
                            const schema = schemas.find(
                              (s) => s.widgetKey === widgetKey,
                            );
                            if (!schema) return null;

                            return (
                              <SchemaItem
                                key={keyStore}
                                schema={schema}
                                onDragStart={onDragStart}
                                onTouchStart={handleTouchStart}
                                isMobile={isMobile}
                                isCompact={viewMode === "list"}
                                isInCanvas={existingWidgets.includes(
                                  schema.widgetKey,
                                )}
                              />
                            );
                          }

                          // Regular widget
                          const widget = session?.[keyStore];
                          if (!widget) return null;

                          return (
                            <WidgetItem
                              key={keyStore}
                              keyStore={keyStore}
                              widget={widget}
                              onDragStart={onDragStart}
                              onTouchStart={handleTouchStart}
                              isMobile={isMobile}
                              isCompact={viewMode === "list"}
                              isInCanvas={existingWidgets.includes(keyStore)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      });
    } else {
      const assetFirst: Record<string, Record<string, string[]>> = {};

      Object.entries(groupedWidgets).forEach(([exchange, assets]) => {
        Object.entries(assets).forEach(([asset, widgets]) => {
          if (!assetFirst[asset]) {
            assetFirst[asset] = {};
          }
          assetFirst[asset][exchange] = widgets;
        });
      });

      return Object.entries(assetFirst).map(([asset, exchanges]) => {
        const isAssetOpen = expandedAssets[asset] || false;
        const assetWidgetCount = Object.values(exchanges).flat().length;

        return (
          <div key={asset} className="border-b last:border-b-0">
            <GroupHeader
              title={`${asset}`}
              count={assetWidgetCount}
              isOpen={isAssetOpen}
              onToggle={() => toggleAsset("", asset)}
              level={0}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isAssetOpen &&
              Object.entries(exchanges).map(([exchange, exchangeWidgets]) => {
                const exchangeKey = `${asset}:${exchange}`;
                const isExchangeOpen = expandedExchanges[exchangeKey] || false;

                return (
                  <div
                    key={exchangeKey}
                    className="border-t border-border/30 dark:border-border"
                  >
                    <GroupHeader
                      title={`${exchange}`}
                      count={exchangeWidgets.length}
                      isOpen={isExchangeOpen}
                      onToggle={() => toggleExchange(exchangeKey)}
                      level={1}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />

                    {isExchangeOpen && (
                      <div
                        className={cn(
                          "p-2",
                          viewMode === "grid"
                            ? isMobile
                              ? "grid grid-cols-1 gap-2"
                              : isTablet
                              ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
                              : "grid grid-cols-1 sm:grid-cols-2 gap-2"
                            : "space-y-2",
                        )}
                      >
                        {exchangeWidgets.map((keyStore) => {
                          // Check if it's a schema
                          if (keyStore.startsWith("schema:")) {
                            const widgetKey = keyStore.replace("schema:", "");
                            const schema = schemas.find(
                              (s) => s.widgetKey === widgetKey,
                            );
                            if (!schema) return null;

                            return (
                              <SchemaItem
                                key={keyStore}
                                schema={schema}
                                onDragStart={onDragStart}
                                onTouchStart={handleTouchStart}
                                isMobile={isMobile}
                                isCompact={viewMode === "list"}
                                isInCanvas={existingWidgets.includes(
                                  schema.widgetKey,
                                )}
                              />
                            );
                          }

                          // Regular widget
                          const widget = session?.[keyStore];
                          if (!widget) return null;

                          return (
                            <WidgetItem
                              key={keyStore}
                              keyStore={keyStore}
                              widget={widget}
                              onDragStart={onDragStart}
                              onTouchStart={handleTouchStart}
                              isMobile={isMobile}
                              isCompact={viewMode === "list"}
                              isInCanvas={existingWidgets.includes(keyStore)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      });
    }
  };

  if (!isOpen || !session) return null;

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-0 z-50 border bg-background/95 overflow-hidden transition-all duration-300 transform backdrop-blur-md",
        isMobile ? "w-1/2 h-full" : isTablet ? "w-1/2 h-full" : "w-1/3 h-full",
      )}
    >
      {/* Header */}
      <div className="border-b p-3 flex justify-between items-center bg-muted/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <Grid3X3 className="h-4 w-4 mr-2" />
            <h3 className="font-semibold">Widget Store</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground dark:text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {widgetStats.available} available
            </Badge>
            <Badge variant="outline" className="text-xs">
              {widgetStats.inCanvas} in canvas
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="h-3 w-3 rounded-full bg-[#febc2e]"
            onClick={() => {}}
          />
          <button
            className="h-3 w-3 rounded-full bg-[#ff5f57]"
            onClick={onClose}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeCategory={activeCategory}
        categories={categories}
        onCategoryChange={setActiveCategory}
        groupingMode={groupingMode}
        onGroupingModeChange={setGroupingMode}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isMobile={isMobile}
        isTablet={isTablet}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Content */}
      <ScrollArea className="h-[calc(100%-144px)]">
        {renderGroupedWidgets()}
      </ScrollArea>

      {/* Drag Preview */}
      <DragPreview
        isDragging={dragState.isDragging}
        widgetData={dragState.draggedWidget
          ? {
            module: dragState.draggedWidget.module,
            channel: dragState.draggedWidget.channel,
            type: extractWidgetType(dragState.draggedWidget.widget),
          }
          : undefined}
        mousePosition={dragState.mousePosition || undefined}
      />
    </div>
  );
}
