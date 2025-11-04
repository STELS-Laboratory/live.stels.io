/**
 * STELS Application Hub
 * Development laboratory for building and launching autonomous AI web agents
 */

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import { getAllSchemas, getSchemaByWidgetKey } from "@/apps/schemas/db.ts";
import type { SchemaProject } from "@/apps/schemas/types.ts";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Calendar,
  Code,
  Coins,
  Copy,
  CreditCard,
  FileText,
  Fingerprint,
  Layers,
  Layout as LayoutIcon,
  Package,
  Play,
  Shield,
  Wallet,
} from "lucide-react";
import { navigateTo } from "@/lib/router.ts";
import {
  collectRequiredChannels,
  resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";
import ErrorBoundary from "@/apps/schemas/error_boundary";
import AppLauncher from "@/components/main/app_launcher";
import { useOpenAppsStore } from "@/stores/modules/open_apps.ts";
import { useRestoreOpenApps } from "@/hooks/use_restore_open_apps.ts";
import { useDefaultSchemas } from "@/hooks/use_default_schemas.ts";
import { toast, useAuthStore } from "@/stores";
import { useAssetList } from "@/hooks/use_asset_list";
import { useAssetBalance } from "@/hooks/use_asset_balance";
import { useAssetBalances } from "@/hooks/use_asset_balances";
import { useAllTokenPrices } from "@/hooks/use_token_price";

/**
 * Format card number with spaces (XXXX XXXX XXXX XXXX)
 */
function formatCardNumber(cardNum: string): string {
  // Remove all non-digits
  const digits = cardNum.replace(/\D/g, "");

  // Add space every 4 digits
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(" ");
}

/**
 * STELS Application Hub - Build and launch autonomous AI web agents
 */
function Welcome(): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const wallet = useAuthStore((state) => state.wallet);
  const connectionSession = useAuthStore((state) => state.connectionSession);
  const [schemas, setSchemas] = useState<SchemaProject[]>([]);

  // Load asset list from server
  const { assets, refetch: refetchAssets } = useAssetList();

  // Find TST token for main balance
  const tstToken = useMemo(() => {
    if (!assets) return null;
    return assets.find(
      (asset) =>
        asset.raw.genesis.token.metadata.symbol === "TST" ||
        asset.raw.genesis.token.metadata.symbol === "tst",
    );
  }, [assets]);

  // Get TST balance using getAssetBalance API (only if tstToken is found)
  const { balance: tstBalance, loading: balanceLoading } = useAssetBalance({
    address: wallet?.address || "",
    token_id: tstToken?.raw.genesis.token.id || "",
    network: connectionSession?.network,
  });

  // Get all balances for USD calculation
  const { balances: allBalances } = useAssetBalances({
    address: wallet?.address || "",
    network: connectionSession?.network,
  });

  // Get all token prices from session ticker data
  const tokenPrices = useAllTokenPrices(connectionSession?.network);

  // Find TST balance from allBalances if tstToken not found
  const tstBalanceFromAll = useMemo(() => {
    if (!allBalances || allBalances.length === 0) return null;
    return allBalances.find(
      (balance) =>
        balance.symbol?.toUpperCase() === "TST" ||
        balance.currency?.toUpperCase() === "TST",
    );
  }, [allBalances]);

  // Use TST balance from allBalances if available, otherwise from useAssetBalance
  // Priority: tstBalance (from useAssetBalance) > tstBalanceFromAll (from allBalances)
  const mainBalance = useMemo(() => {
    if (tstBalance && tstBalance.balance) {
      const balanceNum = Number.parseFloat(tstBalance.balance);
      return Number.isNaN(balanceNum) ? 0 : balanceNum;
    }
    if (tstBalanceFromAll && tstBalanceFromAll.balance) {
      const balanceNum = Number.parseFloat(tstBalanceFromAll.balance);
      return Number.isNaN(balanceNum) ? 0 : balanceNum;
    }
    return 0;
  }, [tstBalance, tstBalanceFromAll]);

  // Calculate total USD value from all token balances and prices
  const totalUSDValue = useMemo((): number => {
    if (!allBalances || allBalances.length === 0) return 0;

    let total = 0;

    for (const balance of allBalances) {
      const symbol = balance.symbol?.toUpperCase();
      if (!symbol) continue;

      // For USDT, use fixed price of 1 USD (stablecoin)
      const price = symbol === "USDT" ? 1 : tokenPrices.get(symbol);
      if (!price) continue;

      const balanceNum = Number.parseFloat(balance.balance);
      if (!Number.isNaN(balanceNum) && balanceNum > 0) {
        total += balanceNum * price;
      }
    }

    return total;
  }, [allBalances, tokenPrices]);

  const [selectedSchema, setSelectedSchema] = useState<SchemaProject | null>(
    null,
  );
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [resolvedSchema, setResolvedSchema] = useState<UINode | null>(null);
  const [requiredChannelAliases, setRequiredChannelAliases] = useState<
    Array<{ channelKey: string; alias: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [launchStep, setLaunchStep] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);

  // Refetch assets when returning to Welcome screen (only once)
  const hasRefetchedRef = useRef(false);
  useEffect(() => {
    if (!selectedSchema && !isLoading && !hasRefetchedRef.current) {
      // User is on Welcome screen - refetch asset list once
      console.log("[Welcome] Returning to Welcome, refetching asset list...");
      hasRefetchedRef.current = true;
      refetchAssets();
    }

    // Reset flag when user navigates away
    if (selectedSchema) {
      hasRefetchedRef.current = false;
    }
  }, [selectedSchema, isLoading, refetchAssets]);

  // Sync server assets to sessionStorage
  useEffect(() => {
    if (assets.length > 0) {
      console.log(
        "[Welcome] Syncing",
        assets.length,
        "assets from server to sessionStorage",
      );

      assets.forEach((asset) => {
        try {
          const channelKey = asset.channel.toLowerCase();
          const existing = sessionStorage.getItem(channelKey);

          // Only update if data is different (avoid unnecessary writes)
          const newData = JSON.stringify(asset);
          if (existing !== newData) {
            sessionStorage.setItem(channelKey, newData);
            console.log("[Welcome] Updated sessionStorage for:", channelKey);
          }
        } catch (error) {
          console.error(
            "[Welcome] Failed to sync asset to sessionStorage:",
            error,
          );
        }
      });
    }
  }, [assets]);

  // Debug: Log session updates and assets
  useEffect(() => {
    if (session) {
      const assetCount = Object.keys(session).filter((key) =>
        key.startsWith("asset.testnet.token:")
      ).length;
      console.log(
        "[Welcome] Session updated - session assets count:",
        assetCount,
      );
      console.log("[Welcome] Server assets count:", assets.length);
    }
  }, [session, assets]);
  const openApp = useOpenAppsStore((state) => state.openApp);
  const apps = useOpenAppsStore((state) => state.apps);
  const activeAppId = useOpenAppsStore((state) => state.activeAppId);

  // Restore open apps from previous session
  useRestoreOpenApps();

  // Load default schemas from public/schemas/
  const defaultSchemasState = useDefaultSchemas();

  // Debug: Log default schemas state
  useEffect(() => {
    console.log("[Welcome] Default schemas state:", defaultSchemasState);
  }, [defaultSchemasState]);

  // Auto-open active app on mount or when activeAppId changes
  useEffect(() => {
    // Skip if activeAppId is empty or null (user wants hub view)
    if (!activeAppId || activeAppId === "") {
      // Clear any currently open app
      if (selectedAppId) {
        console.log("[Welcome] Clearing active app, returning to hub");
        setSelectedSchema(null);
        setSelectedAppId(null);
        setResolvedSchema(null);
        setRequiredChannelAliases([]);
      }
      return;
    }

    const activeApp = apps.find((app) => app.id === activeAppId);

    // If there's an active app and it's not currently selected, open it
    // CRITICAL: Check schemas.length > 0 to prevent infinite loop
    if (
      activeApp && selectedAppId !== activeAppId && !isLaunching &&
      schemas.length > 0
    ) {
      // Find schema - check both regular schemas and virtual token schemas
      let schema: SchemaProject | undefined;

      if (activeApp.channelKey && session) {
        // For virtual schemas (tokens), recreate from template
        const templateSchema = schemas.find(
          (s) => s.widgetKey === "widget.asset.testnet.token",
        );

        if (templateSchema) {
          // Recreate virtual schema for this token
          schema = {
            ...templateSchema,
            id: `virtual-${activeApp.channelKey}`,
            channelKeys: [activeApp.channelKey],
            selfChannelKey: activeApp.channelKey,
            channelAliases: templateSchema.channelAliases || [],
            displayName: activeApp.displayName,
          } as SchemaProject;
        }
      }

      if (!schema) {
        // Fallback to regular schemas
        schema = schemas.find((s) => s.id === activeApp.schemaId);
      }

      if (schema) {
        console.log(
          "[Welcome] Auto-opening active app:",
          activeApp.displayName || schema.name,
          {
            channelKey: activeApp.channelKey,
            schemaId: activeApp.schemaId,
          },
        );

        // Open app immediately without launcher animation
        const openAppImmediately = async (): Promise<void> => {
          try {
            const schemaStore = {
              getSchemaByWidgetKey: async (widgetKey: string) => {
                const project = await getSchemaByWidgetKey(widgetKey);
                if (!project) return null;
                return {
                  schema: project.schema,
                  channelKeys: project.channelKeys,
                  channelAliases: project.channelAliases,
                };
              },
            };

            const resolved = await resolveSchemaRefs(
              schema.schema,
              schemaStore,
              0, // depth
              10, // maxDepth
              schema.selfChannelKey || undefined, // Pass self channel
            );
            const requiredChannels = await collectRequiredChannels(
              schema.schema,
              schemaStore,
            );

            setResolvedSchema(resolved);
            setRequiredChannelAliases(requiredChannels);
            setSelectedSchema(schema);
            setSelectedAppId(activeAppId);
          } catch (error) {
            console.error("[Welcome] Failed to auto-open app:", error);
          }
        };

        openAppImmediately();
      }
    }
  }, [activeAppId, apps, selectedAppId, isLaunching, schemas, session]); // Add session for virtual schemas

  // Watch for app closure from tabs - if current app is closed, return to hub
  useEffect(() => {
    if (!selectedAppId) return;

    // Check if current app still exists
    const appExists = apps.some((app) => app.id === selectedAppId);

    if (!appExists) {
      // App was closed from tab - close it here too
      console.log("[Welcome] App closed from tab, returning to hub");
      setSelectedSchema(null);
      setSelectedAppId(null);
      setResolvedSchema(null);
      setRequiredChannelAliases([]);
    }
  }, [apps, selectedAppId]);

  // Load all schemas from IndexedDB (after default schemas are loaded)
  useEffect(() => {
    // Wait for default schemas to finish loading
    if (defaultSchemasState.isLoading) {
      return;
    }

    const loadSchemas = async (): Promise<void> => {
      try {
        const allSchemas = await getAllSchemas();
        setSchemas(allSchemas);
        console.log(
          "[Welcome] Loaded schemas from IndexedDB:",
          allSchemas.length,
        );

        // Log default schemas loading result
        if (defaultSchemasState.loaded > 0) {
          console.log(
            `[Welcome] Default schemas loaded: ${defaultSchemasState.loaded}`,
          );
        }
      } catch (error) {
        console.error("Failed to load schemas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchemas();
  }, [defaultSchemasState.isLoading]); // Re-run when default schemas finish loading

  // Debug: Log session token channels only once
  useEffect(() => {
    if (!isLoading && session) {
      const assetChannels = Object.keys(session).filter((key) =>
        key.startsWith("asset.")
      );
      console.log(
        "[Welcome] Asset channels in session:",
        assetChannels.length,
        assetChannels,
      );

      assetChannels.forEach((key) => {
        const data = session[key] as Record<string, unknown>;
        console.log(`[Welcome] Asset ${key}:`, {
          widget: data.widget,
          status: data.status,
          hasGenesis: !!(data.raw as Record<string, unknown>)?.genesis,
        });
      });
    }
  }, [isLoading]); // Only log once when loading completes

  // Filter static router schemas for Web Agents section
  // INCLUDE: widget.app.* (public default apps from public/schemas/)
  // EXCLUDE: widget.apps.* (Development Tools shown in separate section below)
  const routerSchemas = useMemo(() => {
    return schemas.filter(
      (schema) =>
        schema.type === "static" &&
        (schema.widgetKey.includes(".router") ||
          schema.widgetKey.startsWith("widget.app.")) &&
        // EXCLUDE Development Tools (shown in separate section)
        !schema.widgetKey.startsWith("widget.apps."),
    );
  }, [schemas]);

  // Find token template schema (ONE schema for ALL tokens)
  const tokenTemplateSchema = useMemo(() => {
    return schemas.find(
      (schema) =>
        schema.type === "static" &&
        (schema.widgetKey === "widget.asset.testnet.token" ||
          schema.widgetKey.startsWith("widget.asset.") &&
            !schema.widgetKey.includes("sha256")),
    );
  }, [schemas]);

  // Extract all tokens from SERVER and SESSION, create virtual schemas
  const tokenSchemas = useMemo(() => {
    if (!tokenTemplateSchema) {
      console.log("[Welcome] tokenSchemas: No template schema", {
        hasTemplate: !!tokenTemplateSchema,
      });
      return [];
    }

    // Collect unique asset channels from BOTH server and session
    // Use Map to deduplicate by normalized key but keep original keys for data access
    const channelMap = new Map<
      string,
      { normalized: string; original: string; source: "server" | "session" }
    >();

    // 1. Add channels from SESSION first (they have the working keys for data access)
    if (session) {
      Object.keys(session).forEach((key) => {
        if (key.startsWith("asset.testnet.token:sha256:")) {
          const normalized = key.toLowerCase();
          // Prefer session version (it's the one that works for data reading)
          if (!channelMap.has(normalized)) {
            channelMap.set(normalized, {
              normalized,
              original: key,
              source: "session",
            });
          }
        }
      });
    }

    // 2. Add channels from server assets (only if not in session)
    assets.forEach((asset) => {
      if (
        asset.channel && asset.channel.startsWith("asset.testnet.token:sha256:")
      ) {
        const normalized = asset.channel.toLowerCase();
        // Only add if not already present from session
        if (!channelMap.has(normalized)) {
          channelMap.set(normalized, {
            normalized,
            original: asset.channel,
            source: "server",
          });
        }
      }
    });

    const assetChannels = Array.from(channelMap.values()).map((item) =>
      item.original
    );

    console.log(
      "[Welcome] Creating virtual token schemas:",
      assetChannels.length,
      "tokens (server:",
      assets.length,
      "session:",
      session
        ? Object.keys(session).filter((k) =>
          k.startsWith("asset.testnet.token:")
        ).length
        : 0,
      ")",
    );

    // Debug: Show all unique asset channels
    console.log("[Welcome] All unique asset channels:", assetChannels);
    console.log(
      "[Welcome] Channel map details:",
      Array.from(channelMap.entries()).map(([norm, data]) => ({
        normalized: norm,
        original: data.original,
        source: data.source,
      })),
    );
    console.log(
      "[Welcome] Server asset channels:",
      assets.map((a) => a.channel),
    );
    console.log(
      "[Welcome] Session asset channels:",
      session
        ? Object.keys(session).filter((k) =>
          k.startsWith("asset.testnet.token:")
        )
        : [],
    );

    // Create virtual schema for each token
    const virtualSchemas = assetChannels.map((channelKey) => {
      return {
        ...tokenTemplateSchema,
        id: `virtual-${channelKey}`, // Unique ID for each token
        channelKeys: [channelKey], // Override with specific token channel
        selfChannelKey: channelKey, // Set as self channel
        channelAliases: tokenTemplateSchema.channelAliases || [],
      };
    });

    console.log("[Welcome] Virtual schemas created:", virtualSchemas.length);
    console.log(
      "[Welcome] Virtual schema sample:",
      virtualSchemas[0]
        ? {
          id: virtualSchemas[0].id,
          name: virtualSchemas[0].name,
          channelKeys: virtualSchemas[0].channelKeys,
          selfChannelKey: virtualSchemas[0].selfChannelKey,
        }
        : "none",
    );
    return virtualSchemas;
  }, [session, tokenTemplateSchema, assets]);

  // Debug: Log schemas only once after loading
  useEffect(() => {
    if (!isLoading && schemas.length > 0) {
      console.log(
        "[Welcome] All schemas:",
        schemas.length,
        schemas.map((s) => ({
          name: s.name,
          widgetKey: s.widgetKey,
          type: s.type,
          channelKeys: s.channelKeys,
        })),
      );
      console.log(
        "[Welcome] Token template schema:",
        tokenTemplateSchema?.name,
        tokenTemplateSchema?.widgetKey,
      );
      console.log(
        "[Welcome] Virtual token schemas created:",
        tokenSchemas.length,
      );
    }
  }, [isLoading]); // Only log once when loading completes

  // Handle launch app with progress tracking
  const handleLaunchApp = useCallback(
    async (schema: SchemaProject): Promise<void> => {
      try {
        // Check if app is already running
        const existingApp = apps.find((app) => app.schemaId === schema.id);
        if (existingApp) {
          // App already running - just switch to it
          console.log(
            "[Welcome] App already running, switching to it:",
            existingApp.id,
          );
          useOpenAppsStore.getState().setActiveApp(existingApp.id);
          setSelectedSchema(schema);
          setSelectedAppId(existingApp.id);
          return;
        }

        // Start launch animation (minimal delay for tokens)
        setIsLaunching(true);
        setLaunchStep(1);

        // Step 1: Resolving schema
        const schemaStore = {
          getSchemaByWidgetKey: async (widgetKey: string) => {
            const project = await getSchemaByWidgetKey(widgetKey);
            if (!project) return null;

            return {
              schema: project.schema,
              channelKeys: project.channelKeys,
              channelAliases: project.channelAliases,
            };
          },
        };

        const resolved = await resolveSchemaRefs(
          schema.schema,
          schemaStore,
          0, // depth
          10, // maxDepth
          schema.selfChannelKey || undefined, // Pass self channel
        );
        setLaunchStep(2);

        // Step 2: Loading channels
        const requiredChannels = await collectRequiredChannels(
          schema.schema,
          schemaStore,
        );
        setLaunchStep(3);

        // Step 3: Preparing data
        setResolvedSchema(resolved);
        setRequiredChannelAliases(requiredChannels);
        setLaunchStep(4);

        // Step 4: Ready! - Register app in store
        const appId = openApp(schema);
        setSelectedSchema(schema);
        setSelectedAppId(appId); // Track app ID for closure sync
        setLaunchStep(5);

        // Hide launcher quickly
        setTimeout(() => {
          setIsLaunching(false);
          setLaunchStep(0);
        }, 100);
      } catch (error) {
        console.error("Failed to launch app:", error);
        setResolvedSchema(schema.schema);
        setRequiredChannelAliases([]);
        setIsLaunching(false);
        setLaunchStep(0);
      }
    },
    [openApp, apps],
  );

  // Prepare merged data reactively when session updates
  const mergedData = useMemo<Record<string, unknown>>(() => {
    if (!session || !selectedSchema) return {};

    const data: Record<string, unknown> = {};

    // 1. Add "self" using selfChannelKey from schema (set by developer)
    if (
      selectedSchema.selfChannelKey && session[selectedSchema.selfChannelKey]
    ) {
      data["self"] = session[selectedSchema.selfChannelKey];
    } else if (
      selectedSchema.channelKeys &&
      selectedSchema.channelKeys.length > 0 &&
      session[selectedSchema.channelKeys[0]]
    ) {
      // Fallback: use first channel from schema
      data["self"] = session[selectedSchema.channelKeys[0]];
    }

    // 2. Add schema's own channels with their aliases
    if (
      selectedSchema.channelAliases && selectedSchema.channelAliases.length > 0
    ) {
      selectedSchema.channelAliases.forEach(
        ({ channelKey, alias }: { channelKey: string; alias: string }) => {
          const sessionData = session[channelKey];
          if (!sessionData || typeof sessionData !== "object") return;

          const dataObj = sessionData as Record<string, unknown>;
          if (!("raw" in dataObj)) return;

          data[alias] = dataObj;
        },
      );
    }

    // 3. Add nested channels with their aliases
    requiredChannelAliases.forEach(({ channelKey, alias }) => {
      // Skip if this alias already exists (avoid duplicates)
      if (data[alias]) return;

      const sessionData = session[channelKey];
      if (!sessionData || typeof sessionData !== "object") return;

      const dataObj = sessionData as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      data[alias] = dataObj;
    });

    return data;
  }, [session, requiredChannelAliases, selectedSchema]);

  // If app is launching, show launcher
  if (isLaunching && selectedSchema) {
    return (
      <AppLauncher
        appName={selectedSchema.name}
        appType={selectedSchema.type}
        currentStep={launchStep}
      />
    );
  }

  // If app is selected, render full-screen
  if (selectedSchema) {
    return (
      <UIEngineProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-background overflow-hidden"
        >
          {/* Render app */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full overflow-auto"
          >
            <ErrorBoundary>
              {resolvedSchema
                ? <UIRenderer schema={resolvedSchema} data={mergedData} />
                : (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground"
                    >
                      Loading app...
                    </motion.div>
                  </div>
                )}
            </ErrorBoundary>
          </motion.div>
        </motion.div>
      </UIEngineProvider>
    );
  }

  // Store view
  return (
    <UIEngineProvider>
      <div className="min-h-screen bg-background p-2">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-foreground">
              STELS Space
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Developer laboratory for Web 5: Build and launch autonomous AI web
            agents using schemas and protocols
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <div className="text-muted-foreground">Loading apps...</div>
          </div>
        )}

        {/* Digital Identity Card - Marketing Block */}
        {!isLoading && wallet && (
          <div className="max-w-7xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
            >
              {/* Background gradient - project colors */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-zinc-500/5 to-amber-500/5 rounded" />

              <div className="relative bg-card/90 backdrop-blur-sm border border-border rounded p-4 sm:p-6 lg:p-8 shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Right: Wallet Card */}
                  <div>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="relative"
                    >
                      <div className="relative bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl overflow-hidden">
                        {/* Card Background Pattern - softer */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-amber-500 rounded-full -translate-y-12 translate-x-12" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-40 sm:h-40 bg-amber-500 rounded-full translate-y-16 -translate-x-16" />
                        </div>

                        <div className="relative z-10 space-y-4 sm:space-y-5 lg:space-y-6">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                              <span className="text-white/80 font-medium text-xs sm:text-sm tracking-wide">
                                STELS Web 5
                              </span>
                            </div>
                            <div className="text-white/60 text-[10px] sm:text-xs font-mono">
                              {wallet.number
                                ? formatCardNumber(wallet.number)
                                : "•••• •••• •••• ••••"}
                            </div>
                          </div>

                          {/* Balance */}
                          <div>
                            <div className="text-white/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">
                              Balance
                            </div>
                            <div className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
                              {balanceLoading && mainBalance === 0
                                ? "..."
                                : mainBalance.toFixed(6)}
                            </div>
                            <div className="text-white/60 text-xs sm:text-sm font-medium mt-1">
                              {connectionSession?.network === "testnet"
                                ? "TST"
                                : connectionSession?.network === "mainnet"
                                ? "STELS"
                                : "LOCAL"}
                            </div>
                            {totalUSDValue > 0 && (
                              <div className="text-white/80 text-xs sm:text-sm font-semibold mt-1">
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(totalUSDValue)}
                              </div>
                            )}
                          </div>

                          {/* Address */}
                          <div>
                            <div className="text-white/60 text-[10px] sm:text-xs mb-2 uppercase tracking-wider">
                              Wallet Address
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded p-2 sm:p-2.5 border border-white/20">
                              <code className="text-white text-[10px] sm:text-xs font-mono flex-1 truncate">
                                {wallet.address}
                              </code>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(wallet.address);
                                  toast.success(
                                    "Address copied!",
                                    "Wallet address copied to clipboard",
                                  );
                                }}
                                className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded transition-colors active:bg-white/30"
                                title="Copy address"
                              >
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Card Footer - Chip simulation */}
                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
                            <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-br from-amber-300 to-amber-400 rounded opacity-60" />
                            <div className="text-white/50 text-[10px] sm:text-xs font-mono tracking-wider">
                              Web 5 Identity
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Card Info */}
                    <div className="mt-3 sm:mt-4 px-2 text-center space-y-3">
                      <p className="text-xs text-muted-foreground">
                        This is your sovereign identity on the STELS network.
                        <span className="block mt-1 font-medium text-foreground text-xs sm:text-sm">
                          You own your data, you control your assets.
                        </span>
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigateTo("wallet")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Open Wallet</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  {/* Left: Digital Identity Info */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-zinc-600 to-zinc-700 dark:from-zinc-700 dark:to-zinc-800 rounded-xl flex items-center justify-center shadow-md"
                      >
                        <Fingerprint className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                          Digital Identity
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Your sovereign Web 5 identity
                        </p>
                      </div>
                    </div>

                    {/* Marketing Message */}
                    <div className="space-y-3">
                      <p className="text-sm sm:text-base text-foreground leading-relaxed">
                        Welcome to the{" "}
                        <span className="font-semibold text-amber-600 dark:text-amber-500">
                          decentralized web
                        </span>. Your digital identity is cryptographically
                        secured and fully owned by you.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-background/50 rounded border border-border">
                          <Shield className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              Secure
                            </div>
                            <div className="text-xs text-muted-foreground">
                              secp256k1
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-background/50 rounded border border-border">
                          <Fingerprint className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              Private
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Your keys
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-background/50 rounded border border-border">
                          <Wallet className="w-4 h-4 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              Sovereign
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Self-custody
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Network Badge */}
                    {connectionSession && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500/10 to-green-500/10 border border-green-500/20 rounded">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="w-2 h-2 bg-green-500 rounded-full shadow-sm"
                        />
                        <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-500">
                          Connected to {connectionSession.network}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Your Tokens */}
        {!isLoading && tokenSchemas.length > 0 && (
          <div className="max-w-7xl mx-auto mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-500" />
              <span>Web Tokens</span>
              <span className="text-sm text-muted-foreground font-normal">
                {tokenSchemas.length}{" "}
                token{tokenSchemas.length === 1 ? "" : "s"}
              </span>
            </h2>

            {/* Horizontal scroll container */}
            <div className="relative pt-4">
              <div className="flex gap-2 overflow-x-auto p-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {tokenSchemas.map((schema) => (
                  <motion.div
                    key={schema.id}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="snap-start"
                  >
                    <TokenCard
                      schema={schema}
                      session={session}
                      onLaunch={handleLaunchApp}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Debug: Tokens exist in session but no template schema */}
        {!isLoading && !tokenTemplateSchema && session &&
          Object.keys(session).some((key) =>
            key.startsWith("asset.testnet.token:")
          ) && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="p-6 bg-amber-500/5 rounded border border-amber-500/30 text-center">
              <Coins className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {Object.keys(session).filter((key) =>
                  key.startsWith("asset.testnet.token:")
                ).length} Token(s) Found in Session
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You have published tokens, but no UI template schema defined.
                Create a schema in Schema Manager to display all your tokens.
              </p>
              <div className="text-xs font-mono text-muted-foreground mb-4">
                Expected widgetKey:{" "}
                <code className="px-2 py-1 bg-background rounded">
                  widget.asset.testnet.token
                </code>
              </div>
              <button
                onClick={() => navigateTo("schemas")}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors inline-flex items-center gap-2"
              >
                <LayoutIcon className="w-4 h-4" />
                Create Token Template Schema
              </button>
            </div>
          </div>
        )}

        {/* User Apps from Schema Store */}
        {!isLoading && routerSchemas.length === 0 && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Web Agents
            </h2>
            <div className="p-12 bg-card rounded border border-dashed border-border text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Custom Agents Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Use Schema Manager to define data structures for your autonomous
                web agents
              </p>
              <button
                onClick={() => navigateTo("schemas")}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors inline-flex items-center gap-2"
              >
                <LayoutIcon className="w-5 h-5" />
                Create First Agent
              </button>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: Create schemas with widgetKey pattern "widget.app.*" to
                auto-display here
              </p>
            </div>
          </div>
        )}

        {/* User Apps Grid */}
        {!isLoading && routerSchemas.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Web Agents
            </h2>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {routerSchemas.map((schema) => (
                <motion.div
                  key={schema.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                >
                  <AppCard
                    schema={schema}
                    session={session}
                    onLaunch={handleLaunchApp}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Development Tools - Available for all users */}
        {!isLoading && (
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>Development Tools</span>
              <span className="text-sm text-muted-foreground font-normal">
                Build Autonomous Web Agents
              </span>
            </h2>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.04,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Canvas */}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo("canvas")}
                className="group bg-card rounded border border-border overflow-hidden hover:border-blue-500/50 transition-colors duration-200 text-left"
              >
                <div className="aspect-video bg-blue-500/5 border-b border-border flex items-center justify-center">
                  <Boxes className="icon-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Visual Workspace
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Compose agent workflows with drag-and-drop interface
                  </p>
                  <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                    Open Canvas <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>

              {/* Editor */}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo("editor")}
                className="group bg-card rounded border border-border overflow-hidden hover:border-amber-500/50 transition-colors duration-200 text-left"
              >
                <div className="aspect-video bg-amber-500/5 border-b border-border flex items-center justify-center">
                  <Code className="icon-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Protocol Editor
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Write and deploy workers across the heterogeneous network
                  </p>
                  <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    Open Editor <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>

              {/* Schemas */}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo("schemas")}
                className="group bg-card rounded border border-border overflow-hidden hover:border-green-500/50 transition-colors duration-200 text-left"
              >
                <div className="aspect-video bg-green-500/5 border-b border-border flex items-center justify-center">
                  <LayoutIcon className="icon-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Schema Manager
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Define data structures and channels for your web agents
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-semibold">
                    Open Manager <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>

              {/* Documentation */}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo("docs")}
                className="group bg-card rounded border border-border overflow-hidden hover:border-zinc-500/50 transition-colors duration-200 text-left"
              >
                <div className="aspect-video bg-zinc-500/5 border-b border-border flex items-center justify-center">
                  <FileText className="icon-2xl text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Documentation
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Platform overview, updates, and technical documentation
                  </p>
                  <div className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-400 font-semibold">
                    Open Docs <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>
    </UIEngineProvider>
  );
}

/**
 * Token Card Component - Compact horizontal layout
 * Reads data from session based on schema's channelKeys
 */
interface TokenCardProps {
  schema: SchemaProject;
  session: Record<string, unknown> | null;
  onLaunch: (schema: SchemaProject) => Promise<void>;
}

function TokenCard(
  { schema, session, onLaunch }: TokenCardProps,
): ReactElement {
  const apps = useOpenAppsStore((state) => state.apps);

  // Extract token data from session using channelKeys
  const tokenData = useMemo(() => {
    if (!session || !schema.channelKeys || schema.channelKeys.length === 0) {
      console.log("[TokenCard] No session or channelKeys", {
        hasSession: !!session,
        channelKeys: schema.channelKeys,
      });
      return null;
    }

    // Find the asset channel in session
    const channelKey = schema.channelKeys[0];

    // Try both original and normalized (lowercase) versions
    let channelData = session[channelKey] as
      | Record<string, unknown>
      | undefined;

    if (!channelData) {
      // Try lowercase version
      const normalizedKey = channelKey.toLowerCase();
      channelData = session[normalizedKey] as
        | Record<string, unknown>
        | undefined;

      console.log("[TokenCard] Channel key lookup:", {
        originalKey: channelKey,
        normalizedKey,
        foundWithOriginal: !!session[channelKey],
        foundWithNormalized: !!session[normalizedKey],
        availableKeys: Object.keys(session).filter((k) =>
          k.includes(channelKey.split(":")[2]?.substring(0, 20) || "")
        ),
      });
    }

    if (!channelData) {
      console.log("[TokenCard] No channel data found for:", channelKey);
      return null;
    }

    // Extract genesis certificate from raw data
    const raw = channelData.raw as Record<string, unknown> | undefined;
    const genesis = raw?.genesis as Record<string, unknown> | undefined;
    const token = genesis?.token as Record<string, unknown> | undefined;
    const metadata = token?.metadata as Record<string, unknown> | undefined;
    const economics = token?.economics as Record<string, unknown> | undefined;
    const supply = economics?.supply as Record<string, unknown> | undefined;

    return {
      name: metadata?.name as string || "Unknown Token",
      symbol: metadata?.symbol as string || "???",
      icon: metadata?.icon as string | undefined,
      standard: token?.standard as string || "unknown",
      initialSupply: supply?.initial as string || "0",
      status: channelData.status as string || "unknown",
      channelKey: channelKey,
    };
  }, [schema, session]);

  // Check if this token is already open
  const isOpen = useMemo(() => {
    if (!tokenData?.channelKey) return false;
    return apps.some((app) => app.channelKey === tokenData.channelKey);
  }, [apps, tokenData]);

  // Enhanced launch handler that adds displayName
  const handleLaunch = useCallback(async () => {
    if (!tokenData) return;

    // If already open, just switch to it
    if (isOpen) {
      const openApp = apps.find((app) =>
        app.channelKey === tokenData.channelKey
      );
      if (openApp) {
        useOpenAppsStore.getState().setActiveApp(openApp.id);
        return;
      }
    }

    // Create enhanced schema with displayName (using type assertion)
    const enhancedSchema = {
      ...schema,
      displayName: `${tokenData.symbol} - ${tokenData.name}`,
    } as SchemaProject;

    await onLaunch(enhancedSchema);
  }, [schema, tokenData, onLaunch, isOpen, apps]);

  if (!tokenData) {
    console.log(
      "[TokenCard] No tokenData, not rendering card for schema:",
      schema.id,
    );
    return <></>;
  }

  console.log(
    "[TokenCard] Rendering card for:",
    tokenData.symbol,
    tokenData.name,
  );

  return (
    <motion.button
      onClick={handleLaunch}
      whileHover={{ scale: isOpen ? 1.01 : 1.02, y: isOpen ? -1 : -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group rounded border overflow-hidden transition-all duration-200 w-[280px] flex-shrink-0 text-left ${
        isOpen
          ? "bg-green-500/5 border-green-500/50 hover:border-green-500/70 shadow-sm shadow-green-500/20"
          : "bg-card border-border hover:border-amber-500/50 hover:shadow-md"
      }`}
    >
      {/* Compact horizontal layout */}
      <div className="flex items-center gap-3 p-3">
        {/* Token Icon */}
        <div className="w-14 h-14 bg-amber-500/5 border border-border rounded flex items-center justify-center flex-shrink-0">
          {tokenData.icon
            ? (
              <img
                src={tokenData.icon}
                alt={tokenData.symbol}
                className="w-10 h-10 object-contain"
              />
            )
            : <Coins className="w-8 h-8 text-amber-500/50" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {tokenData.name}
            </h3>
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-500 text-xs font-bold rounded border border-amber-500/30 flex-shrink-0">
              {tokenData.symbol}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate mb-1">
            {tokenData.standard} • {tokenData.initialSupply}
          </p>

          {/* Status */}
          <div className="flex items-center gap-2">
            {isOpen && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500 text-xs font-semibold">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                />
                Open
              </div>
            )}

            {!isOpen && tokenData.status === "pending" && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 text-xs">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-amber-500 rounded-full"
                />
                Pending
              </div>
            )}

            {!isOpen && tokenData.status === "active" && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500 text-xs">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                />
                Active
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * App Card Component
 */
interface AppCardProps {
  schema: SchemaProject;
  session: Record<string, unknown> | null;
  onLaunch: (schema: SchemaProject) => Promise<void>;
}

function AppCard({ schema, session, onLaunch }: AppCardProps): ReactElement {
  const [previewSchema, setPreviewSchema] = useState<UINode | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [isLaunchingLocal, setIsLaunchingLocal] = useState(false);
  const apps = useOpenAppsStore((state) => state.apps);

  // Check if app is already running
  const runningApp = apps.find((app) => app.schemaId === schema.id);
  const isRunning = !!runningApp;

  // Resolve schema and collect data for preview
  useEffect(() => {
    const resolvePreview = async (): Promise<void> => {
      try {
        const schemaStore = {
          getSchemaByWidgetKey: async (widgetKey: string) => {
            const project = await getSchemaByWidgetKey(widgetKey);
            if (!project) return null;
            return {
              schema: project.schema,
              channelKeys: project.channelKeys,
              channelAliases: project.channelAliases,
            };
          },
        };

        // 1. Resolve schema
        const resolved = await resolveSchemaRefs(
          schema.schema,
          schemaStore,
          0, // depth
          10, // maxDepth
          schema.selfChannelKey || undefined, // Pass self channel
        );

        // 2. Collect required channels
        const requiredChannels = await collectRequiredChannels(
          schema.schema,
          schemaStore,
        );

        // 3. Prepare data with aliases
        const data: Record<string, unknown> = {};

        // 3.1 Add "self" using selfChannelKey from schema (set by developer)
        if (schema.selfChannelKey && session?.[schema.selfChannelKey]) {
          data["self"] = session[schema.selfChannelKey];
        } else if (
          schema.channelKeys &&
          schema.channelKeys.length > 0 &&
          session?.[schema.channelKeys[0]]
        ) {
          // Fallback: use first channel from schema
          data["self"] = session[schema.channelKeys[0]];
        }

        // 3.2 Add schema's own channels with their aliases
        if (
          session && schema.channelAliases && schema.channelAliases.length > 0
        ) {
          for (const { channelKey, alias } of schema.channelAliases) {
            const sessionData = session[channelKey];
            if (!sessionData || typeof sessionData !== "object") continue;

            const dataObj = sessionData as Record<string, unknown>;
            if (!("raw" in dataObj)) continue;

            data[alias] = dataObj;
          }
        }

        // 3.3 Add nested channels with their aliases
        if (session && requiredChannels.length > 0) {
          for (const { channelKey, alias } of requiredChannels) {
            // Skip if this alias already exists (avoid duplicates)
            if (data[alias]) continue;

            const sessionData = session[channelKey];
            if (!sessionData || typeof sessionData !== "object") continue;

            const dataObj = sessionData as Record<string, unknown>;
            if (!("raw" in dataObj)) continue;

            // Add with alias from schema (collectRequiredChannels already provides it)
            data[alias] = dataObj;
          }
        }

        setPreviewSchema(resolved);
        setPreviewData(data);
      } catch (error) {
        console.error("Failed to resolve preview:", error);
        setPreviewSchema(schema.schema);
        setPreviewData({});
      }
    };

    resolvePreview();
  }, [schema, session]);

  const formattedDate = useMemo(() => {
    return new Date(schema.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [schema.updatedAt]);

  const handleLaunchClick = (): void => {
    if (isRunning && runningApp) {
      // App already running - just switch to it
      useOpenAppsStore.getState().setActiveApp(runningApp.id);
      return;
    }

    // App not running - launch it
    setIsLaunchingLocal(true);
    onLaunch(schema).catch(() => {
      setIsLaunchingLocal(false);
    });
  };

  return (
    <motion.div
      onClick={handleLaunchClick}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group bg-card rounded border overflow-hidden transition-all duration-200 relative cursor-pointer ${
        isRunning
          ? "border-green-500/50 hover:border-green-500/70 shadow-green-500/20 shadow-md"
          : "border-border hover:border-amber-500/30 hover:shadow-md"
      }`}
    >
      {/* Subtle glow for running apps */}
      {isRunning && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-px bg-green-500/10 rounded -z-10"
        />
      )}
      {/* Preview */}
      <div className="aspect-video bg-background border-b border-border overflow-hidden relative">
        <div className="absolute inset-0 scale-90 overflow-auto">
          <ErrorBoundary>
            {previewSchema
              ? <UIRenderer schema={previewSchema} data={previewData} />
              : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground text-xs">
                    Loading preview...
                  </div>
                </div>
              )}
          </ErrorBoundary>
        </div>

        {/* Running indicator badge */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg flex items-center gap-1.5"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
            Running
          </motion.div>
        )}

        {/* Instant loading indicator */}
        {isLaunchingLocal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-muted-foreground"
              >
                Launching...
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Overlay on hover (document-style) - visual only, click handled by parent */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-8 pointer-events-none">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{
              y: isLaunchingLocal ? 10 : 0,
              opacity: isLaunchingLocal ? 0 : 1,
            }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`px-4 py-2 font-medium rounded-md flex items-center gap-2 shadow-lg ${
              isRunning
                ? "bg-green-500 text-white"
                : "bg-foreground text-background"
            }`}
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">{isRunning ? "Open" : "Launch"}</span>
          </motion.div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-foreground">
            {schema.name}
          </h3>
          {isRunning && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-500 text-xs font-medium rounded border border-green-500/30"
            >
              Active
            </motion.span>
          )}
        </div>

        {schema.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {schema.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {isRunning
            ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                />
                Running
              </div>
            )
            : (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}

          {schema.nestedSchemas && schema.nestedSchemas.length > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {schema.nestedSchemas.length} nested
            </div>
          )}
        </div>

        {/* Widget Key */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground truncate">
            {schema.widgetKey}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Welcome;
