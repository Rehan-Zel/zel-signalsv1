"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Settings, Sparkles, Zap } from "lucide-react";
import SignalCard from "@/components/SignalCard";
import PaperTradeLog from "@/components/PaperTradeLog";
import SettingsModal from "@/components/SettingsModal";
import { STORAGE_KEYS, type PaperTrade, type Signal, type TradeStatus } from "@/lib/types";

const TIMEFRAMES = ["1h", "4h", "1day"] as const;
const QUICK = ["XAU/USD", "BTC/USD", "EUR/USD", "AAPL"];

function WinRing({ rate, decided }: { rate: number; decided: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  const color = decided === 0 ? "#52525b" : rate >= 50 ? "#34d399" : "#fb7185";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-11 w-11">
        <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <motion.circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white">
          {decided === 0 ? "--" : `${Math.round(rate)}`}
        </span>
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Win Rate</p>
        <p className="font-mono text-sm font-bold text-white">
          {decided === 0 ? "—" : `${rate.toFixed(0)}%`}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [twelveKey, setTwelveKey] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [symbol, setSymbol] = useState("XAU/USD");
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("1h");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loggedId, setLoggedId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      setTwelveKey(localStorage.getItem(STORAGE_KEYS.twelveData) ?? "");
      setAiKey(localStorage.getItem(STORAGE_KEYS.openRouter) ?? "");
      const raw = localStorage.getItem(STORAGE_KEYS.trades);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTrades(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(trades));
    } catch {
      /* storage full / unavailable */
    }
  }, [trades, hydrated]);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.status === "win").length;
    const losses = trades.filter((t) => t.status === "loss").length;
    const decided = wins + losses;
    return { wins, losses, decided, rate: decided ? (wins / decided) * 100 : 0 };
  }, [trades]);

  const saveKeys = (td: string, ai: string) => {
    setTwelveKey(td);
    setAiKey(ai);
    try {
      localStorage.setItem(STORAGE_KEYS.twelveData, td);
      localStorage.setItem(STORAGE_KEYS.openRouter, ai);
    } catch {
      /* ignore */
    }
    setError(null);
  };

  const generate = useCallback(async () => {
    if (loading) return;
    setError(null);
    if (!symbol.trim()) {
      setError("Please enter an asset symbol (e.g. XAU/USD).");
      return;
    }
    if (!twelveKey || !aiKey) {
      setError("Add your Twelve Data and OpenRouter API keys in Settings first.");
      setSettingsOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim(),
          timeframe,
          twelveDataKey: twelveKey,
          aiKey,
        }),
      });
      let data: (Signal & { error?: string }) | null = null;
      try {
        data = await res.json();
      } catch {
        /* non-JSON response */
      }
      if (!res.ok || !data || data.error) {
        setSignal(null);
        setError(data?.error || `Request failed (${res.status}).`);
      } else {
        setSignal(data);
        setLoggedId(null);
      }
    } catch {
      setSignal(null);
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, symbol, timeframe, twelveKey, aiKey]);

  const logTrade = () => {
    if (!signal || loggedId === signal.generatedAt) return;
    const trade: PaperTrade = {
      ...signal,
      id: `${signal.generatedAt}-${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      loggedAt: Date.now(),
    };
    setTrades((prev) => [trade, ...prev]);
    setLoggedId(signal.generatedAt);
  };

  const resolve = (id: string, status: TradeStatus) =>
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === status ? "pending" : status } : t))
    );
  const remove = (id: string) => setTrades((prev) => prev.filter((t) => t.id !== id));
  const clearAll = () => {
    if (window.confirm("Delete all paper trades?")) setTrades([]);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)]" />

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0c0f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Zap className="h-5 w-5 text-black" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Zel <span className="text-emerald-400">Signals</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <WinRing rate={stats.rate} decided={stats.decided} />
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-5 w-5" />
              {hydrated && (!twelveKey || !aiKey) && (
                <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-xl space-y-6 px-4 pb-16 pt-5">
        {hydrated && stats.decided > 0 && (
          <div className="flex justify-between rounded-2xl border border-white/5 bg-[#111418] px-4 py-2.5 text-xs text-zinc-400">
            <span>
              Wins <b className="font-mono text-emerald-400">{stats.wins}</b>
            </span>
            <span>
              Losses <b className="font-mono text-rose-400">{stats.losses}</b>
            </span>
            <span>
              Open <b className="font-mono text-zinc-200">{trades.length - stats.decided}</b>
            </span>
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-[#111418] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Asset</span>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="XAU/USD, BTC/USDT..."
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 font-mono text-base text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/60"
              />
            </label>
            <div className="-mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setSymbol(q)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Timeframe</span>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    type="button"
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`relative rounded-lg py-2.5 text-sm font-semibold transition ${
                      timeframe === tf ? "text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {timeframe === tf && (
                      <motion.span
                        layoutId="tf-pill"
                        className="absolute inset-0 rounded-lg bg-emerald-400"
                        transition={{ type: "spring", damping: 26, stiffness: 320 }}
                      />
                    )}
                    <span className="relative">{tf}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-base font-bold text-black shadow-[0_0_28px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Analyzing market...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> Generate Signal
                </>
              )}
            </button>
          </form>
        </section>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <p className="break-words">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {signal && !loading && (
          <SignalCard
            key={signal.generatedAt}
            signal={signal}
            logged={loggedId === signal.generatedAt}
            onLog={logTrade}
          />
        )}

        <PaperTradeLog trades={trades} onResolve={resolve} onDelete={remove} onClear={clearAll} />
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        twelveDataKey={twelveKey}
        aiKey={aiKey}
        onSave={saveKeys}
      />
    </div>
  );
}
