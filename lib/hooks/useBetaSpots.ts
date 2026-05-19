"use client";

import { useEffect, useRef, useState } from "react";

export type BetaSpots = {
  taken: number;
  total: number;
  spotsLeft: number;
  isFull: boolean;
};

type State = {
  data: BetaSpots | null;
  isLoading: boolean;
  error: Error | null;
};

const TOTAL_FALLBACK = 100;

// Singleton fetcher: tutti i consumer (popup + banner + header badge)
// condividono UNA fetch ogni ciclo, no waterfall. Cache invalidata ogni 60s.
let cached: { data: BetaSpots | null; at: number } | null = null;
let inflight: Promise<BetaSpots | null> | null = null;
const TTL_MS = 60_000;

async function fetchSpots(): Promise<BetaSpots | null> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.data;
  if (inflight) return inflight;

  inflight = fetch("/api/v1/beta/spots", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((json: { taken?: number; total?: number } | null) => {
      if (!json || typeof json.taken !== "number") {
        cached = { data: null, at: now };
        return null;
      }
      const total = json.total ?? TOTAL_FALLBACK;
      const taken = Math.max(0, Math.min(json.taken, total));
      const spots: BetaSpots = {
        taken,
        total,
        spotsLeft: Math.max(0, total - taken),
        isFull: taken >= total,
      };
      cached = { data: spots, at: now };
      return spots;
    })
    .catch(() => {
      cached = { data: null, at: now };
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Hook condiviso per Beta spots counter.
 *
 * Usato da BetaPopup, BetaStickyBanner, Header badge.
 * Singleton cache 60s — tutti i consumer condividono UNA fetch per ciclo.
 *
 * Ritorna `null` se la fetch fallisce → il consumer decide il fallback
 * (di solito "nasconditi" o "mostra senza counter").
 */
export function useBetaSpots(): State {
  const [state, setState] = useState<State>(() => ({
    data: cached?.data ?? null,
    isLoading: !cached,
    error: null,
  }));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    fetchSpots()
      .then((data) => {
        if (cancelled || !mounted.current) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled || !mounted.current) return;
        setState({
          data: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error("fetch_failed"),
        });
      });

    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  return state;
}
