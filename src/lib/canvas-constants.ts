/**
 * Canvas-related constants
 */

/**
 * LocalStorage keys for canvas data persistence
 */
export const STORAGE_KEYS = {
  NODES: "stels-canvas-nodes",
  EDGES: "stels-canvas-edges",
  UI_STATE: "canvas-ui-store",
} as const;

/**
 * Default widget store dimensions
 */
export const WIDGET_STORE_DIMENSIONS = {
  WIDTH: "w-60",
  HEIGHT: "h-60",
  MAX_HEIGHT: "h-[calc(100%-144px)]",
} as const;

/**
 * Node styling classes
 */
export const NODE_STYLES = {
  CONTAINER: "border transition-all cursor-auto bg-zinc-900 rounded-lg overflow-hidden",
  HEADER: "flex relative items-center border-b bg-zinc-900 justify-between px-2 py-1 cursor-move drag-handle",
  BUTTON: "w-3 h-3 cursor-pointer rounded-full flex items-center justify-center transition-colors",
  CLOSE_BUTTON: "bg-zinc-950 hover:bg-red-500",
  MINIMIZE_BUTTON: "bg-zinc-950 hover:bg-yellow-500",
  MAXIMIZE_BUTTON: "bg-zinc-950 hover:bg-green-500",
  ACTIVE_MINIMIZE: "bg-amber-600",
  ACTIVE_MAXIMIZE: "bg-green-600",
} as const;

/**
 * Dock styling classes
 */
export const DOCK_STYLES = {
  CONTAINER: "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-black/20 p-2 backdrop-blur-lg",
  ITEM_CONTAINER: "group relative flex flex-col items-center",
  TOOLTIP: "absolute bottom-full mb-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity",
  TOOLTIP_VISIBLE: "opacity-100",
  BUTTON: "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/20",
  BUTTON_ACTIVE: "bg-white/30",
  INDICATOR: "mt-1 h-1 w-1 rounded-full bg-white",
} as const;
