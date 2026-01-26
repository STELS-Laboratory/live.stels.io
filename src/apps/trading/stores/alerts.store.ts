/**
 * Price Alerts Store
 * Manages price alerts with notifications
 */

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { PriceAlert } from "../types";

// ============================================
// Audio for alerts
// ============================================

let audioContext: AudioContext | null = null;

function playAlertSound() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn("Failed to play alert sound:", error);
  }
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/logo.svg",
      tag: "price-alert",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body,
          icon: "/logo.svg",
          tag: "price-alert",
        });
      }
    });
  }
}

// ============================================
// Store Interface
// ============================================

interface AlertsStore {
  // State
  alerts: PriceAlert[];
  lastCheckedPrices: Record<string, number>;

  // Actions
  createAlert: (alert: Omit<PriceAlert, "id" | "createdAt" | "triggeredAt">) => string;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => void;
  clearTriggered: () => void;
  clearAll: () => void;

  // Alert checking
  checkAlerts: (symbol: string, exchange: string, market: string, currentPrice: number) => void;

  // Notification permissions
  requestNotificationPermission: () => Promise<boolean>;
}

// ============================================
// Store Implementation
// ============================================

export const useAlertsStore = create<AlertsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        alerts: [],
        lastCheckedPrices: {},

        // Create new alert
        createAlert: (alertData) => {
          const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const newAlert: PriceAlert = {
            ...alertData,
            id,
            createdAt: Date.now(),
          };

          set(
            (state) => ({
              alerts: [newAlert, ...state.alerts],
            }),
            false,
            "createAlert"
          );

          return id;
        },

        // Delete alert
        deleteAlert: (id) => {
          set(
            (state) => ({
              alerts: state.alerts.filter((a) => a.id !== id),
            }),
            false,
            "deleteAlert"
          );
        },

        // Toggle alert active state
        toggleAlert: (id) => {
          set(
            (state) => ({
              alerts: state.alerts.map((a) =>
                a.id === id ? { ...a, isActive: !a.isActive } : a
              ),
            }),
            false,
            "toggleAlert"
          );
        },

        // Update alert
        updateAlert: (id, updates) => {
          set(
            (state) => ({
              alerts: state.alerts.map((a) =>
                a.id === id ? { ...a, ...updates } : a
              ),
            }),
            false,
            "updateAlert"
          );
        },

        // Clear all triggered alerts
        clearTriggered: () => {
          set(
            (state) => ({
              alerts: state.alerts.filter((a) => !a.triggeredAt),
            }),
            false,
            "clearTriggered"
          );
        },

        // Clear all alerts
        clearAll: () => {
          set({ alerts: [], lastCheckedPrices: {} }, false, "clearAll");
        },

        // Check alerts against current price
        checkAlerts: (symbol, exchange, market, currentPrice) => {
          const { alerts, lastCheckedPrices } = get();
          const key = `${symbol}.${exchange}.${market}`;
          const lastPrice = lastCheckedPrices[key];

          // Update last price
          set(
            (state) => ({
              lastCheckedPrices: {
                ...state.lastCheckedPrices,
                [key]: currentPrice,
              },
            }),
            false,
            "updateLastPrice"
          );

          // Check each active alert for this symbol
          const matchingAlerts = alerts.filter(
            (a) =>
              a.isActive &&
              !a.triggeredAt &&
              a.symbol === symbol &&
              a.exchange === exchange &&
              a.market === market
          );

          for (const alert of matchingAlerts) {
            let triggered = false;

            switch (alert.condition) {
              case "above":
                triggered = currentPrice >= alert.price;
                break;
              case "below":
                triggered = currentPrice <= alert.price;
                break;
              case "cross":
                if (lastPrice !== undefined) {
                  triggered =
                    (lastPrice < alert.price && currentPrice >= alert.price) ||
                    (lastPrice > alert.price && currentPrice <= alert.price);
                }
                break;
            }

            if (triggered) {
              // Mark as triggered
              set(
                (state) => ({
                  alerts: state.alerts.map((a) =>
                    a.id === alert.id
                      ? { ...a, isActive: false, triggeredAt: Date.now() }
                      : a
                  ),
                }),
                false,
                "triggerAlert"
              );

              // Send notifications
              const notifyMessage = `${symbol} ${alert.condition === "above" ? "reached" : alert.condition === "below" ? "dropped to" : "crossed"} $${currentPrice.toLocaleString()}`;

              if (alert.notifyMethod === "sound" || alert.notifyMethod === "both") {
                playAlertSound();
              }

              if (alert.notifyMethod === "notification" || alert.notifyMethod === "both") {
                showBrowserNotification("Price Alert", notifyMessage);
              }

              console.log(`[Alert] ${notifyMessage}`);
            }
          }
        },

        // Request notification permission
        requestNotificationPermission: async () => {
          if (!("Notification" in window)) {
            return false;
          }

          if (Notification.permission === "granted") {
            return true;
          }

          if (Notification.permission === "denied") {
            return false;
          }

          const permission = await Notification.requestPermission();
          return permission === "granted";
        },
      }),
      {
        name: "trading-alerts-store",
        partialize: (state) => ({
          alerts: state.alerts,
        }),
      }
    ),
    { name: "alerts" }
  )
);
