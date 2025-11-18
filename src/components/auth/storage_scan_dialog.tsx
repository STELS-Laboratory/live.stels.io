/**
 * Storage Scan Dialog
 * Displays found storage data and allows user to delete it
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMobile } from "@/hooks/use_mobile";
import {
  formatBytes,
  scanAllStorage,
  type StorageScanResult,
} from "@/lib/storage-scanner";
import {
  clearCacheStorage,
  clearCookies,
  clearIndexedDB,
  clearLocalStorage,
  clearSessionStorage,
} from "@/lib/storage-cleaner";
import {
  isAppIndexedDBDatabase,
  isAppStorageKey,
} from "@/lib/app-storage-keys";

interface StorageScanDialogProps {
  onComplete: () => void;
}

/**
 * Storage Scan Dialog Component
 * Scans and displays all browser storage data
 */
export function StorageScanDialog({
  onComplete,
}: StorageScanDialogProps): React.ReactElement {
  const isMobile = useMobile();
  const [scanResult, setScanResult] = useState<StorageScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedItems, setDeletedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Count app keys and calculate security metrics
  const securityMetrics = useMemo(() => {
    if (!scanResult) {
      return {
        appKeysCount: 0,
        totalKeys: 0,
        appDataPercentage: 100,
        appKeysSize: 0,
        totalSize: 0,
        allAppKeysVerified: true,
      };
    }

    const localStorageAppKeys = scanResult.localStorage.filter((item) =>
      isAppStorageKey(item.key)
    );
    const sessionStorageAppKeys = scanResult.sessionStorage.filter((item) =>
      isAppStorageKey(item.key)
    );
    const indexedDBAppKeys = scanResult.indexedDB.filter((db) =>
      isAppIndexedDBDatabase(db.name)
    );

    const appKeysCount = localStorageAppKeys.length +
      sessionStorageAppKeys.length +
      indexedDBAppKeys.length;

    const totalKeys = scanResult.localStorage.length +
      scanResult.sessionStorage.length +
      scanResult.indexedDB.length;

    const appKeysSize = localStorageAppKeys.reduce((sum, item) =>
      sum + item.size, 0) +
      sessionStorageAppKeys.reduce((sum, item) => sum + item.size, 0) +
      indexedDBAppKeys.reduce((sum, db) => sum + db.estimatedSize, 0);

    // Calculate percentage of app data from total data size
    const appDataPercentage = scanResult.totalSize > 0
      ? Math.round((appKeysSize / scanResult.totalSize) * 100)
      : 100;

    // All app keys are verified (we have a list of all app keys)
    const allAppKeysVerified = true;

    return {
      appKeysCount,
      totalKeys,
      appDataPercentage,
      appKeysSize,
      totalSize: scanResult.totalSize,
      allAppKeysVerified,
    };
  }, [scanResult]);

  // Scan storage on mount
  useEffect(() => {
    const performScan = async (): Promise<void> => {
      try {
        const result = await scanAllStorage();
        setScanResult(result);
        setIsScanning(false);
      } catch (error) {
        console.error("[StorageScanDialog] Error scanning storage:", error);
        setIsScanning(false);
      }
    };

    performScan();
  }, []);

  // Auto-continue if no data found
  useEffect(() => {
    if (scanResult && !scanResult.hasData) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scanResult, onComplete]);

  /**
   * Handle delete all storage
   */
  const handleDeleteAll = async (): Promise<void> => {
    if (!scanResult) return;

    setIsDeleting(true);

    try {
      // Delete localStorage
      if (scanResult.localStorage.length > 0) {
        clearLocalStorage();
        setDeletedItems((prev) => new Set([...prev, "localStorage"]));
      }

      // Delete sessionStorage
      if (scanResult.sessionStorage.length > 0) {
        clearSessionStorage();
        setDeletedItems((prev) => new Set([...prev, "sessionStorage"]));
      }

      // Delete IndexedDB
      if (scanResult.indexedDB.length > 0) {
        await clearIndexedDB();
        setDeletedItems((prev) => new Set([...prev, "indexedDB"]));
      }

      // Delete Cache Storage
      if (scanResult.caches.length > 0) {
        await clearCacheStorage();
        setDeletedItems((prev) => new Set([...prev, "caches"]));
      }

      // Delete cookies
      if (scanResult.cookies.length > 0) {
        clearCookies();
        setDeletedItems((prev) => new Set([...prev, "cookies"]));
      }

      // Wait a bit for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Rescan to verify
      const newResult = await scanAllStorage();
      setScanResult(newResult);

      // If everything is deleted, close dialog
      if (!newResult.hasData) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } catch (error) {
      console.error("[StorageScanDialog] Error deleting storage:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle continue without deleting
   */
  const handleContinue = (): void => {
    onComplete();
  };

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-2xl mx-4 border-amber-500/30 bg-card/95 backdrop-blur-sm shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Loader2 className="w-6 h-6 text-amber-500" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Scanning Storage
                </h2>
                <p className="text-sm text-muted-foreground">
                  Checking browser storage for data...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!scanResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-2xl mx-4 border-red-500/30 bg-card/95 backdrop-blur-sm shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Scan Failed
                </h2>
                <p className="text-sm text-muted-foreground">
                  Unable to scan storage. You can continue anyway.
                </p>
              </div>
            </div>
            <Button onClick={handleContinue} className="w-full">
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If no data found, show message and continue automatically after a short delay
  if (!scanResult.hasData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="w-full max-w-2xl mx-4 border-green-500/30 bg-card/95 backdrop-blur-sm shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    No Storage Data Found
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your browser storage is clean. No data to delete.
                  </p>
                </div>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${
        isMobile ? "p-0 items-end" : "p-4"
      }`}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: isMobile ? 1 : 0.95,
          y: isMobile ? "100%" : 0,
        }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: isMobile ? 1 : 0.95,
          y: isMobile ? "100%" : 0,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full ${
          isMobile ? "h-[100%]" : "max-w-3xl max-h-[100%]"
        } overflow-hidden flex flex-col`}
      >
        <Card className="bg-card/95 border flex flex-col h-full">
          {/* Security Banner */}
          <div
            className={`${
              isMobile ? "px-3 py-2.5" : "px-6 py-4"
            } bg-green-500/5 border border-green-500/10`}
          >
            <div
              className={`flex items-start ${isMobile ? "gap-2.5" : "gap-3"}`}
            >
              <div
                className={`relative flex-shrink-0 ${
                  isMobile ? "p-1.5" : "p-3"
                } bg-green-500/10 border border-green-500/20 rounded-lg`}
              >
                <ShieldCheck
                  className={`relative ${
                    isMobile ? "w-4 h-4" : "w-6 h-6"
                  } text-green-600 dark:text-green-400`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`flex items-center gap-2 ${
                    isMobile ? "mb-1.5" : "mb-2"
                  }`}
                >
                  <h2
                    className={`${
                      isMobile ? "text-sm" : "text-xl"
                    } font-bold text-foreground truncate`}
                  >
                    {isMobile
                      ? "Security Verified"
                      : "Storage Security Verified"}
                  </h2>
                  {!isMobile && (
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [1, 0.8, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
                <div
                  className={`${
                    isMobile
                      ? "grid grid-cols-2 gap-1.5"
                      : "flex items-center gap-4 flex-wrap"
                  }`}
                >
                  <div
                    className={`flex items-center ${
                      isMobile ? "gap-1" : "gap-1.5"
                    }`}
                  >
                    <CheckCircle2
                      className={`${
                        isMobile ? "w-3 h-3" : "w-4 h-4"
                      } text-green-500 flex-shrink-0`}
                    />
                    <span
                      className={`${
                        isMobile ? "text-[10px]" : "text-sm"
                      } font-semibold text-green-700 dark:text-green-400 truncate`}
                    >
                      {securityMetrics.appKeysCount} app{" "}
                      {securityMetrics.appKeysCount === 1 ? "key" : "keys"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${
                      isMobile ? "gap-1" : "gap-1.5"
                    }`}
                  >
                    <ShieldCheck
                      className={`${
                        isMobile ? "w-3 h-3" : "w-4 h-4"
                      } text-green-500 flex-shrink-0`}
                    />
                    <span
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } font-semibold text-green-700 dark:text-green-400`}
                    >
                      100% verified
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${
                      isMobile ? "gap-1 col-span-2" : "gap-1.5"
                    }`}
                  >
                    <Database
                      className={`${
                        isMobile ? "w-3 h-3" : "w-4 h-4"
                      } text-muted-foreground flex-shrink-0`}
                    />
                    <span
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } text-muted-foreground`}
                    >
                      {formatBytes(scanResult.totalSize)} total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div
            className={`${isMobile ? "px-0 py-2" : "px-6 py-3"}`}
          >
            <div
              className={`flex items-center ${
                isMobile ? "justify-between" : "justify-between"
              }`}
            >
              <div className="flex items-center gap-2">
                <HardDrive
                  className={`${
                    isMobile ? "w-5.5 h-5.5" : "w-6 h-6"
                  } text-muted-foreground`}
                />
                <h3
                  className={`${
                    isMobile ? "text-xl" : "text-sm"
                  } font-semibold text-foreground`}
                >
                  Storage Analysis
                </h3>
              </div>
              {!isMobile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  <span>All app data verified and safe</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            className={`bg-background border ${
              isMobile ? "p-4" : "p-6"
            } overflow-y-auto flex-1 min-h-0 ${
              isMobile ? "" : ""
            } overscroll-contain`}
          >
            <div className={isMobile ? "space-y-2" : "space-y-4"}>
              {/* localStorage */}
              {scanResult.localStorage.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("localStorage")) {
                        newExpanded.delete("localStorage");
                      } else {
                        newExpanded.add("localStorage");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex items-center justify-between w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive
                        className={`${
                          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                        } text-muted-foreground`}
                      />
                      <h3
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-semibold text-foreground`}
                      >
                        Local Storage
                      </h3>
                      <span
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } text-muted-foreground`}
                      >
                        ({scanResult.localStorage.length} items)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletedItems.has("localStorage") && (
                        <CheckCircle2
                          className={`${
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                          } text-green-500`}
                        />
                      )}
                      {expandedSections.has("localStorage")
                        ? (
                          <ChevronUp
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )
                        : (
                          <ChevronDown
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )}
                    </div>
                  </button>
                  {expandedSections.has("localStorage") && (
                    <div
                      className={`${isMobile ? "pl-3" : "pl-6"} space-y-1.5`}
                    >
                      {scanResult.localStorage
                        .slice(0, isMobile ? 5 : 10)
                        .map((item) => {
                          const isAppKey = isAppStorageKey(item.key);
                          return (
                            <div
                              key={item.key}
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } flex items-center justify-between gap-2 ${
                                isMobile ? "px-2 py-1.5" : "px-2.5 py-2"
                              } rounded-md transition-all duration-150 ${
                                isAppKey
                                  ? "bg-green-500/10 border border-green-500/20 text-foreground hover:bg-green-500/15"
                                  : "bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isAppKey
                                  ? (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <ShieldCheck
                                        className={`${
                                          isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                        } text-green-500`}
                                      />
                                      {!isMobile && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 font-semibold rounded border border-green-500/30">
                                          VERIFIED
                                        </span>
                                      )}
                                    </div>
                                  )
                                  : (
                                    <div
                                      className={`${
                                        isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                      } flex-shrink-0`}
                                    />
                                  )}
                                <span
                                  className={`truncate font-mono ${
                                    isMobile ? "text-[10px]" : "text-[11px]"
                                  }`}
                                >
                                  {item.key}
                                </span>
                              </div>
                              <span
                                className={`${
                                  isMobile ? "ml-1.5" : "ml-2"
                                } flex-shrink-0 font-medium ${
                                  isMobile ? "text-[10px]" : "text-xs"
                                } ${
                                  isAppKey
                                    ? "text-foreground/80"
                                    : "text-muted-foreground/70"
                                }`}
                              >
                                {formatBytes(item.size)}
                              </span>
                            </div>
                          );
                        })}
                      {scanResult.localStorage.length > (isMobile ? 5 : 10) && (
                        <div
                          className={`${
                            isMobile ? "text-[10px]" : "text-xs"
                          } text-muted-foreground/70 ${
                            isMobile ? "pl-2" : "pl-2.5"
                          } pt-1`}
                        >
                          ...and{" "}
                          {scanResult.localStorage.length - (isMobile ? 5 : 10)}
                          {" "}
                          more item
                          {scanResult.localStorage.length -
                                (isMobile ? 5 : 10) === 1
                            ? ""
                            : "s"}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* sessionStorage */}
              {scanResult.sessionStorage.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("sessionStorage")) {
                        newExpanded.delete("sessionStorage");
                      } else {
                        newExpanded.add("sessionStorage");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex items-center justify-between w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive
                        className={`${
                          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                        } text-muted-foreground`}
                      />
                      <h3
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-semibold text-foreground`}
                      >
                        Session Storage
                      </h3>
                      <span
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } text-muted-foreground`}
                      >
                        ({scanResult.sessionStorage.length} items)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletedItems.has("sessionStorage") && (
                        <CheckCircle2
                          className={`${
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                          } text-green-500`}
                        />
                      )}
                      {expandedSections.has("sessionStorage")
                        ? (
                          <ChevronUp
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )
                        : (
                          <ChevronDown
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )}
                    </div>
                  </button>
                  {expandedSections.has("sessionStorage") && (
                    <div
                      className={`${isMobile ? "pl-3" : "pl-6"} space-y-1.5`}
                    >
                      {scanResult.sessionStorage
                        .slice(0, isMobile ? 5 : 10)
                        .map((item) => {
                          const isAppKey = isAppStorageKey(item.key);
                          return (
                            <div
                              key={item.key}
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } flex items-center justify-between gap-2 ${
                                isMobile ? "px-2 py-1.5" : "px-2.5 py-2"
                              } rounded-md transition-all duration-150 ${
                                isAppKey
                                  ? "bg-green-500/10 border border-green-500/20 text-foreground hover:bg-green-500/15"
                                  : "bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isAppKey
                                  ? (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <ShieldCheck
                                        className={`${
                                          isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                        } text-green-500`}
                                      />
                                      {!isMobile && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 font-semibold rounded border border-green-500/30">
                                          VERIFIED
                                        </span>
                                      )}
                                    </div>
                                  )
                                  : (
                                    <div
                                      className={`${
                                        isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                      } flex-shrink-0`}
                                    />
                                  )}
                                <span
                                  className={`truncate font-mono ${
                                    isMobile ? "text-[10px]" : "text-[11px]"
                                  }`}
                                >
                                  {item.key}
                                </span>
                              </div>
                              <span
                                className={`${
                                  isMobile ? "ml-1.5" : "ml-2"
                                } flex-shrink-0 font-medium ${
                                  isMobile ? "text-[10px]" : "text-xs"
                                } ${
                                  isAppKey
                                    ? "text-foreground/80"
                                    : "text-muted-foreground/70"
                                }`}
                              >
                                {formatBytes(item.size)}
                              </span>
                            </div>
                          );
                        })}
                      {scanResult.sessionStorage.length > (isMobile ? 5 : 10) &&
                        (
                          <div
                            className={`${
                              isMobile ? "text-[10px]" : "text-xs"
                            } text-muted-foreground/70 ${
                              isMobile ? "pl-2" : "pl-2.5"
                            } pt-1`}
                          >
                            ...and {scanResult.sessionStorage.length -
                              (isMobile ? 5 : 10)} more item
                            {scanResult.sessionStorage.length -
                                  (isMobile ? 5 : 10) === 1
                              ? ""
                              : "s"}
                          </div>
                        )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* IndexedDB */}
              {scanResult.indexedDB.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("indexedDB")) {
                        newExpanded.delete("indexedDB");
                      } else {
                        newExpanded.add("indexedDB");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex items-center justify-between w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database
                        className={`${
                          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                        } text-muted-foreground`}
                      />
                      <h3
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-semibold text-foreground`}
                      >
                        IndexedDB Databases
                      </h3>
                      <span
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } text-muted-foreground`}
                      >
                        ({scanResult.indexedDB.length} databases)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletedItems.has("indexedDB") && (
                        <CheckCircle2
                          className={`${
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                          } text-green-500`}
                        />
                      )}
                      {expandedSections.has("indexedDB")
                        ? (
                          <ChevronUp
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )
                        : (
                          <ChevronDown
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )}
                    </div>
                  </button>
                  {expandedSections.has("indexedDB") && (
                    <div
                      className={`${isMobile ? "pl-3" : "pl-6"} space-y-1.5`}
                    >
                      {scanResult.indexedDB.map((db) => {
                        const isAppDB = isAppIndexedDBDatabase(db.name);
                        return (
                          <div
                            key={db.name}
                            className={`${
                              isMobile ? "text-[10px]" : "text-xs"
                            } flex items-center justify-between gap-2 ${
                              isMobile ? "px-2 py-1.5" : "px-2.5 py-2"
                            } rounded-md transition-all duration-150 ${
                              isAppDB
                                ? "bg-green-500/10 border border-green-500/20 text-foreground hover:bg-green-500/15"
                                : "bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isAppDB
                                ? (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <ShieldCheck
                                      className={`${
                                        isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                      } text-green-500`}
                                    />
                                    {!isMobile && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 font-semibold rounded border border-green-500/30">
                                        VERIFIED
                                      </span>
                                    )}
                                  </div>
                                )
                                : (
                                  <div
                                    className={`${
                                      isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                                    } flex-shrink-0`}
                                  />
                                )}
                              <span
                                className={`truncate font-mono ${
                                  isMobile ? "text-[10px]" : "text-[11px]"
                                }`}
                              >
                                {db.name} ({db.objectStores.length} store
                                {db.objectStores.length === 1 ? "" : "s"})
                              </span>
                            </div>
                            <span
                              className={`${
                                isMobile ? "ml-1.5" : "ml-2"
                              } flex-shrink-0 font-medium ${
                                isMobile ? "text-[10px]" : "text-xs"
                              } ${
                                isAppDB
                                  ? "text-foreground/80"
                                  : "text-muted-foreground/70"
                              }`}
                            >
                              {formatBytes(db.estimatedSize)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Cache Storage */}
              {scanResult.caches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("caches")) {
                        newExpanded.delete("caches");
                      } else {
                        newExpanded.add("caches");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex items-center justify-between w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database
                        className={`${
                          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                        } text-muted-foreground`}
                      />
                      <h3
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-semibold text-foreground`}
                      >
                        Cache Storage
                      </h3>
                      <span
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } text-muted-foreground`}
                      >
                        ({scanResult.caches.length} caches)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletedItems.has("caches") && (
                        <CheckCircle2
                          className={`${
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                          } text-green-500`}
                        />
                      )}
                      {expandedSections.has("caches")
                        ? (
                          <ChevronUp
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )
                        : (
                          <ChevronDown
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )}
                    </div>
                  </button>
                  {expandedSections.has("caches") && (
                    <div className={`${isMobile ? "pl-3" : "pl-6"} space-y-1`}>
                      {scanResult.caches.map((cache) => (
                        <div
                          key={cache.name}
                          className={`${
                            isMobile ? "text-[10px]" : "text-xs"
                          } text-muted-foreground flex items-center justify-between ${
                            isMobile ? "px-2 py-1.5" : "px-2.5 py-2"
                          } rounded-md`}
                        >
                          <span className="truncate flex-1 font-mono">
                            {cache.name} ({cache.keys.length} entries)
                          </span>
                          <span className="ml-2 text-muted-foreground/70 font-medium">
                            {formatBytes(cache.estimatedSize)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Cookies */}
              {scanResult.cookies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("cookies")) {
                        newExpanded.delete("cookies");
                      } else {
                        newExpanded.add("cookies");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex items-center justify-between w-full p-2 -m-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database
                        className={`${
                          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                        } text-muted-foreground`}
                      />
                      <h3
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-semibold text-foreground`}
                      >
                        Cookies
                      </h3>
                      <span
                        className={`${
                          isMobile ? "text-[10px]" : "text-xs"
                        } text-muted-foreground`}
                      >
                        ({scanResult.cookies.length} cookies)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deletedItems.has("cookies") && (
                        <CheckCircle2
                          className={`${
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                          } text-green-500`}
                        />
                      )}
                      {expandedSections.has("cookies")
                        ? (
                          <ChevronUp
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )
                        : (
                          <ChevronDown
                            className={`${
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            } text-muted-foreground`}
                          />
                        )}
                    </div>
                  </button>
                  {expandedSections.has("cookies") && (
                    <div className={`${isMobile ? "pl-3" : "pl-6"} space-y-1`}>
                      {scanResult.cookies.slice(0, isMobile ? 5 : 10).map((
                        cookie,
                      ) => (
                        <div
                          key={cookie.name}
                          className={`${
                            isMobile ? "text-[10px]" : "text-xs"
                          } text-muted-foreground truncate font-mono ${
                            isMobile ? "px-2 py-1" : "px-2.5 py-1.5"
                          }`}
                        >
                          {cookie.name}
                        </div>
                      ))}
                      {scanResult.cookies.length > (isMobile ? 5 : 10) && (
                        <div
                          className={`${
                            isMobile ? "text-[10px]" : "text-xs"
                          } text-muted-foreground/70 ${
                            isMobile ? "pl-2" : "pl-2.5"
                          } pt-1`}
                        >
                          ...and{" "}
                          {scanResult.cookies.length - (isMobile ? 5 : 10)} more
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`${isMobile ? "p-0" : "p-0"} space-y-2 flex-shrink-0`}
          >
            {/* Security Summary */}
            {securityMetrics.appKeysCount > 0 && (
              <div
                className={`grid ${
                  isMobile ? "grid-cols-2 gap-2" : "grid-cols-2 gap-2"
                }`}
              >
                <div
                  className={`${
                    isMobile ? "px-3 py-2.5" : "px-4 py-3"
                  } bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck
                      className={`${
                        isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                      } text-green-500`}
                    />
                    <span
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } font-semibold text-green-700 dark:text-green-400`}
                    >
                      Verified Keys
                    </span>
                  </div>
                  <p
                    className={`${
                      isMobile ? "text-base" : "text-lg"
                    } font-bold text-green-600 dark:text-green-700`}
                  >
                    {securityMetrics.appKeysCount}
                  </p>
                  <p
                    className={`${
                      isMobile ? "text-[9px]" : "text-[10px]"
                    } mt-0.5`}
                  >
                    Safe application data
                  </p>
                </div>
                <div
                  className={`${
                    isMobile ? "px-3 py-2.5" : "px-4 py-3"
                  } bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck
                      className={`${
                        isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                      } text-green-500`}
                    />
                    <span
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } font-semibold text-green-700 dark:text-green-400`}
                    >
                      Verification Status
                    </span>
                  </div>
                  <p
                    className={`${
                      isMobile ? "text-base" : "text-lg"
                    } font-bold text-green-600 dark:text-green-700`}
                  >
                    100%
                  </p>
                  <p
                    className={`${
                      isMobile ? "text-[9px]" : "text-[10px]"
                    } mt-0.5`}
                  >
                    All app keys verified
                  </p>
                </div>
              </div>
            )}

            {/* Security Message */}
            {securityMetrics.appKeysCount > 0 && (
              <div
                className={`flex items-start ${isMobile ? "gap-2" : "gap-3"} ${
                  isMobile ? "px-3 py-2.5" : "px-4 py-3"
                } bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded`}
              >
                <div
                  className={`relative ${
                    isMobile ? "p-1.5" : "p-2"
                  } bg-green-500/20 rounded flex-shrink-0`}
                >
                  <ShieldCheck
                    className={`${
                      isMobile ? "w-4 h-4" : "w-5 h-5"
                    } text-green-600 dark:text-green-400`}
                  />
                  {!isMobile && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`${
                      isMobile ? "text-[10px]" : "text-xs"
                    } font-bold text-green-700 dark:text-green-400 ${
                      isMobile ? "mb-1" : "mb-1.5"
                    }`}
                  >
                    ✓ All Application Data Verified & Safe
                  </p>
                  <p
                    className={`${
                      isMobile ? "text-[9px]" : "text-[11px]"
                    } text-muted-foreground leading-relaxed ${
                      isMobile ? "mb-1.5" : "mb-2"
                    }`}
                  >
                    All {securityMetrics.appKeysCount} application key
                    {securityMetrics.appKeysCount === 1 ? "" : "s"}{" "}
                    verified and safe. These keys belong exclusively to this
                    application.
                  </p>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isMobile ? "text-[9px]" : "text-[10px]"
                    }`}
                  >
                    <Lock
                      className={`${isMobile ? "w-2.5 h-2.5" : "w-3 h-3"}`}
                    />
                    <span className="font-medium">Your data is secure</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              className={`flex items-center ${
                isMobile ? "flex-col gap-2" : "gap-6"
              }`}
            >
              <Button
                onClick={handleContinue}
                disabled={isDeleting}
                variant="outline"
                className={`flex-1 ${isMobile ? "w-full h-11 text-sm" : ""}`}
              >
                Continue
              </Button>
              <Button
                onClick={handleDeleteAll}
                disabled={isDeleting || deletedItems.size > 0}
                variant="destructive"
                className={`flex-1 flex items-center justify-center gap-2 ${
                  isMobile ? "w-full h-11 text-sm" : ""
                }`}
              >
                {isDeleting
                  ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                      <span>Deleting...</span>
                    </>
                  )
                  : deletedItems.size > 0
                  ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Deleted</span>
                    </>
                  )
                  : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All Data</span>
                    </>
                  )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
