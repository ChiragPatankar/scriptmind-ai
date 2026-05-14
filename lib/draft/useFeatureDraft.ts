/**
 * Per-feature draft persistence — saves the user's working state to localStorage so
 * they can return to a feature page (Create Story, Dialogue, Visualize, Poster, Analyse, …)
 * and pick up exactly where they left off.
 *
 *   const { loadedDraft, save, isDirty, status, lastSavedAt, clear } =
 *     useFeatureDraft<Snapshot>("dialogue", currentSnapshot);
 *
 * The hook:
 *   • Loads any saved draft once on mount — pages read `loadedDraft` to rehydrate `useState`.
 *   • Does NOT auto-save while the user is working — they save manually via `save()`.
 *   • On tab close / navigation away, automatically flushes the latest snapshot so
 *     no work is lost if the user forgets to click Save.
 *   • Tracks dirty state and last-saved timestamp.
 *   • Drafts are scoped per Supabase user (with an `anon` fallback) so multiple
 *     accounts on the same browser don't overwrite each other.
 */

"use client";

import { useAuthStore } from "@/lib/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_PREFIX = "scriptmind:draft";
const DRAFT_VERSION = 1;

export type DraftStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface PersistedDraft<T> {
  v: number;
  t: number;
  data: T;
}

interface UseFeatureDraftOptions {
  /** Skip writing the draft when this returns true (e.g. all fields empty). */
  shouldSkipPersist?: () => boolean;
}

interface UseFeatureDraftResult<T> {
  /** Draft loaded on mount, or null if no saved draft exists. */
  loadedDraft: T | null;
  /** Whether `loadedDraft` has finished loading (always true after first effect). */
  isHydrated: boolean;
  /** Current persistence status. */
  status: DraftStatus;
  /** Whether the latest snapshot differs from the last persisted snapshot. */
  isDirty: boolean;
  /** Epoch ms of the last successful save, or null. */
  lastSavedAt: number | null;
  /** Persist the latest snapshot now. */
  save: () => void;
  /** Delete the saved draft for this feature. */
  clear: () => void;
}

function getStorageKey(featureId: string, userId: string | null | undefined): string {
  return `${STORAGE_PREFIX}:${userId || "anon"}:${featureId}`;
}

function readDraft<T>(key: string): PersistedDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft<T>;
    if (!parsed || typeof parsed !== "object" || parsed.v !== DRAFT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    const payload: PersistedDraft<T> = { v: DRAFT_VERSION, t: Date.now(), data };
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Stable, order-independent serialisation for change detection.
 * Object keys are sorted at every level so `{a:1,b:2}` and `{b:2,a:1}` hash identically.
 */
function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function useFeatureDraft<T>(
  featureId: string,
  snapshot: T,
  options: UseFeatureDraftOptions = {}
): UseFeatureDraftResult<T> {
  const userId = useAuthStore((s) => s.user?.id);
  const storageKey = useMemo(() => getStorageKey(featureId, userId), [featureId, userId]);

  const [loadedDraft, setLoadedDraft] = useState<T | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const lastSavedHashRef = useRef<string | null>(null);
  const savedTimerRef = useRef<number | null>(null);
  const skipFn = options.shouldSkipPersist;

  // Latest values referenced by the unload listener — keeps the listener
  // stable while still flushing the freshest snapshot when the tab closes.
  const snapshotRef = useRef<T>(snapshot);
  const storageKeyRef = useRef<string>(storageKey);
  const skipFnRef = useRef<typeof skipFn>(skipFn);
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { storageKeyRef.current = storageKey; }, [storageKey]);
  useEffect(() => { skipFnRef.current = skipFn; }, [skipFn]);

  const currentHash = useMemo(() => stableStringify(snapshot), [snapshot]);
  const isDirty = isHydrated && lastSavedHashRef.current !== currentHash;

  // ── Load existing draft on mount or when the user changes ──────────────────
  useEffect(() => {
    const saved = readDraft<T>(storageKey);
    if (saved) {
      setLoadedDraft(saved.data);
      setLastSavedAt(saved.t);
      lastSavedHashRef.current = stableStringify(saved.data);
      setStatus("saved");
    } else {
      setLoadedDraft(null);
      setLastSavedAt(null);
      lastSavedHashRef.current = null;
      setStatus("idle");
    }
    setIsHydrated(true);
  }, [storageKey]);

  // ── Track dirty state without auto-saving ──────────────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    setStatus((prev) => {
      if (lastSavedHashRef.current !== currentHash) return "dirty";
      // Snapshot matches what's on disk — but don't clobber a transient "saved" flash.
      return prev === "saved" ? "saved" : "idle";
    });
  }, [currentHash, isHydrated]);

  const persistNow = useCallback(() => {
    if (skipFn?.()) return;
    setStatus("saving");
    const ok = writeDraft<T>(storageKey, snapshot);
    if (ok) {
      lastSavedHashRef.current = currentHash;
      setLastSavedAt(Date.now());
      setStatus("saved");
      // After the green flash, fall back to "idle" if the user hasn't started typing again.
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => {
        setStatus((s) => (s === "saved" ? "idle" : s));
      }, 2200);
    } else {
      setStatus("error");
    }
  }, [storageKey, snapshot, currentHash, skipFn]);

  // ── Flush before the page unloads / on visibility change ──────────────────
  // This is the safety net: if the user closes the tab without clicking Save,
  // the latest snapshot is still written. Uses refs so the listener doesn't
  // need to be re-bound on every keystroke.
  useEffect(() => {
    if (!isHydrated) return;

    const flushIfDirty = () => {
      const snap = snapshotRef.current;
      if (skipFnRef.current?.()) return;
      const hash = stableStringify(snap);
      if (lastSavedHashRef.current === hash) return;
      const ok = writeDraft<T>(storageKeyRef.current, snap);
      if (ok) lastSavedHashRef.current = hash;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushIfDirty();
    };

    window.addEventListener("beforeunload", flushIfDirty);
    window.addEventListener("pagehide", flushIfDirty);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushIfDirty);
      window.removeEventListener("pagehide", flushIfDirty);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isHydrated]);

  const save = useCallback(() => {
    persistNow();
  }, [persistNow]);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    lastSavedHashRef.current = null;
    setLastSavedAt(null);
    setStatus("idle");
    setLoadedDraft(null);
  }, [storageKey]);

  return {
    loadedDraft,
    isHydrated,
    status,
    isDirty,
    lastSavedAt,
    save,
    clear,
  };
}
