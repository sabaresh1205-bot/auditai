"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function write(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

function remove(key: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(key);
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

/**
 * Session-scoped JSON storage: survives refresh in the same tab, clears when the tab/window is closed.
 * Uses the same hydration-safe pattern as `useLocalStorageJson`.
 */
export function useSessionStorageJson<T>(key: string, defaultValue: T) {
  const cacheRef = useRef<{ raw: string | null; parsed: T } | null>(null);

  const readValue = useCallback((): T => {
    if (!isBrowser()) return defaultValue;

    const raw = window.sessionStorage.getItem(key);
    if (raw == null) {
      cacheRef.current = null;
      return defaultValue;
    }

    const cached = cacheRef.current;
    if (cached && cached.raw === raw) {
      return cached.parsed;
    }

    try {
      const parsed = JSON.parse(raw) as T;
      cacheRef.current = { raw, parsed };
      return parsed;
    } catch {
      cacheRef.current = null;
      return defaultValue;
    }
  }, [key, defaultValue]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!isBrowser()) return () => {};
      const handler = (e: StorageEvent) => {
        if (!e.key || e.key === key) {
          onStoreChange();
        }
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key]
  );

  const value = useSyncExternalStore(subscribe, readValue, () => defaultValue);

  const setValue = useCallback(
    (next: T) => {
      write(key, next);
    },
    [key]
  );

  const clearValue = useCallback(() => {
    remove(key);
  }, [key]);

  return { value, setValue, clearValue };
}
