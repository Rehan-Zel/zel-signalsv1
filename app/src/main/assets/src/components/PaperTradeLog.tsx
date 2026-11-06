"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, Trash2 } from "lucide-react";
import type { PaperTrade, TradeStatus } from "@/lib/types";
import { formatPrice } from "./SignalCard";

interface Props {
  trades: PaperTrade[];
  onResolve: (id: string, status: TradeStatus) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function PaperTradeLog({ trades, onResolve, onDelete, onClear }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Paper Trade History
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{trades.length}</span>
        </div>
        {trades.length > 0 && (
          <button onClick={onClear} className="text-xs text-zinc-500 hover:text-rose-400">
            Clear all
          </button>
        )}
      </div>

      {trades.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
          No paper trades yet. Generate a signal and log it to start tracking your win rate.
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {trades.map((t) => {
              const bull = t.bias === "Bullish";
              const statusStyle =
                t.status === "win"
                  ? "border-emerald-500/40"
                  : t.status === "loss"
                  ? "border-rose-500/40"
                  : "border-white/10";
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className={`rounded-2xl border ${statusStyle} bg-[#111418] p-4`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{t.symbol}</span>
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                          {t.timeframe}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            bull ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {t.bias}
                        </span>
                        <span className="text-[10px] text-zinc-500">{t.confidence}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {new Date(t.loggedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => onDelete(t.id)}
                      aria-label="Delete trade"
                      className="rounded-full p-1.5 text-zinc-600 hover:bg-white/5 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">Entry</p>
                      <p className="truncate text-sky-300">{formatPrice(t.entry)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">TP</p>
                      <p className="truncate text-emerald-400">{formatPrice(t.takeProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">SL</p>
                      <p className="truncate text-rose-400">{formatPrice(t.stopLoss)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onResolve(t.id, "win")}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition active:scale-[0.97] ${
                        t.status === "win"
                          ? "border-emerald-400 bg-emerald-500 text-black"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      Mark as Win ✅
                    </button>
                    <button
                      onClick={() => onResolve(t.id, "loss")}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition active:scale-[0.97] ${
                        t.status === "loss"
                          ? "border-rose-400 bg-rose-500 text-white"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      }`}
                    >
                      Mark as Loss ❌
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
