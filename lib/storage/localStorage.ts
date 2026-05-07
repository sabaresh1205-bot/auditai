export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not_available" | "not_found" | "invalid_json" };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readLocalStorageJson<T>(key: string): StorageResult<T> {
  if (!isBrowser()) return { ok: false, reason: "not_available" };

  const raw = window.localStorage.getItem(key);
  if (raw == null) return { ok: false, reason: "not_found" };

  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

export function writeLocalStorageJson(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorage(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

