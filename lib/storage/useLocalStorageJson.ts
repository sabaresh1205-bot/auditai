"use client";

import { useCallback, useEffect, useState } from "react";

type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not_available" | "not_found" | "invalid_json" };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read<T>(key: string): StorageResult<T> {
  if (!isBrowser()) return { ok: false, reason: "not_available" };
  const raw = window.localStorage.getItem(key);
  if (raw == null) return { ok: false, reason: "not_found" };
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

function write(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

function remove(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

export function useLocalStorageJson<T>(key: string, defaultValue: T) {
  const readValue = useCallback((): T => {
    const res = read<T>(key);
    return res.ok ? res.value : defaultValue;
  }, [key, defaultValue]);

  // Avoid reading localStorage during the initial render. When this hook is used in
  // Client Components that are still pre-rendered on the server, reading in the
  // initializer can cause hydration mismatches (server uses default, client uses stored).
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    // Hydrate from storage on mount / key change.
    setValueState(readValue());

    const handler = (e: StorageEvent) => {
      if (!e.key || e.key === key) {
        setValueState(readValue());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, readValue]);

  const setValue = useCallback(
    (next: T) => {
      write(key, next);
      setValueState(next);
    },
    [key]
  );

  const clearValue = useCallback(() => {
    remove(key);
    setValueState(defaultValue);
  }, [key, defaultValue]);

  return { value, setValue, clearValue };
}

