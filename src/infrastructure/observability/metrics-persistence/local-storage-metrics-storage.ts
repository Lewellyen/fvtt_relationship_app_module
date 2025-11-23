import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";

/**
 * LocalStorage-based metrics persistence.
 *
 * Gracefully degrades when localStorage is unavailable (e.g., in private mode
 * or server-side rendering) by behaving like a no-op storage.
 */
export class LocalStorageMetricsStorage implements MetricsStorage {
  constructor(
    private readonly storageKey: string,
    private readonly storage: Storage | null = getStorage()
  ) {}

  load(): MetricsPersistenceState | null {
    if (!this.storage) {
      return null;
    }

    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as MetricsPersistenceState;
    } catch {
      return null;
    }
  }

  save(state: MetricsPersistenceState): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or serialization failed → ignore silently
    }
  }

  clear(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Gets the localStorage object if available in the current environment.
 * Returns null if localStorage is not available (e.g., server-side, private mode).
 * Exported for testing purposes.
 */
export function getStorage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
    // Accessing localStorage can throw in some environments
  }
  return null;
}
