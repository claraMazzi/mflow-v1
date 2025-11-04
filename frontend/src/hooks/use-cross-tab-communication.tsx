"use client";

import { useCallback } from "react";

type CrossTabEventType = "toast-removed" | "toast-added";

interface CrossTabEvent {
  type: CrossTabEventType;
  data: {
    toastId: string;
    timestamp: number;
  };
}

export function useCrossTabCommunication() {
  const broadcastEvent = useCallback((event: CrossTabEvent) => {
    try {
      localStorage.setItem(
        `cross-tab-event-${Date.now()}`,
        JSON.stringify(event)
      );
      // Clean up old events (keep only last 10)
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith("cross-tab-event-"))
        .sort()
        .slice(0, -10);
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Failed to broadcast cross-tab event:", error);
    }
  }, []);

  const listenToEvents = useCallback(
    (eventType: CrossTabEventType, callback: (toastId: string) => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        if (!e.key?.startsWith("cross-tab-event-") || !e.newValue) return;

        try {
          const event: CrossTabEvent = JSON.parse(e.newValue);
          if (event.type === eventType) {
            callback(event.data.toastId);
          }
        } catch (error) {
          console.warn("Failed to parse cross-tab event:", error);
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    },
    []
  );

  return {
    broadcastEvent,
    listenToEvents,
  };
}
