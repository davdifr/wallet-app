"use client";

export type SyncDomain = "transactions" | "recurring-incomes" | "saving-goals" | "groups";

export type SyncEvent = {
  id: string;
  domain: SyncDomain;
  sourceId: string;
  timestamp: number;
};

const CHANNEL_NAME = "wallet-app-sync";
const STORAGE_KEY = "wallet-app-sync-event";

function canUseBrowserApis() {
  return typeof window !== "undefined";
}

export function createSyncSourceId() {
  return `sync-${crypto.randomUUID()}`;
}

export function publishSyncEvent(event: SyncEvent) {
  if (!canUseBrowserApis()) {
    return;
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
}

export function subscribeToSyncEvents(listener: (event: SyncEvent) => void) {
  if (!canUseBrowserApis()) {
    return () => undefined;
  }

  const cleanups: Array<() => void> = [];

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const handleMessage = (messageEvent: MessageEvent<SyncEvent>) => {
      listener(messageEvent.data);
    };

    channel.addEventListener("message", handleMessage);
    cleanups.push(() => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    });
  }

  const handleStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== STORAGE_KEY || !storageEvent.newValue) {
      return;
    }

    try {
      listener(JSON.parse(storageEvent.newValue) as SyncEvent);
    } catch {
      return;
    }
  };

  window.addEventListener("storage", handleStorage);
  cleanups.push(() => window.removeEventListener("storage", handleStorage));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
