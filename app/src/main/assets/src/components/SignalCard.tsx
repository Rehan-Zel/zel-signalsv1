"use client";

import { motion } from "framer-motion";
import { BookmarkPlus, Check, Crosshair, ShieldAlert, Target, TrendingDown, TrendingUp } from "lucide-react";
import type { Signal } from "@/lib/types";

interface Props {
  signal: Signal;
  logged: boolean;
  onLog: () => void;
}

export function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

export default function SignalCard({ signal, logged, onLog }: Props) {
  const bull = signal.bias === "Bullish";
  const color = bull ? "text-emerald-400" : "text-rose-400";
  const barColor = bull ? "bg-emerald-400" : "bg-rose-400";
  const border = bull ? "border-emerald-500/30" : "border-rose-500/30";
  const glow = bull ? "shadow-[0_0_40px_rgba(16,185,129,0.12)]" : "shadow-[0_0_40px_rgba(244,63,94,0.12)]";
  const Icon = bull ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 260 }}
      className={`overflow-hidden rounded-3xl border ${border} ${glow} bg-[#111418]`}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {signal.timeframe} · AI Setup
          </p>
          <h3 className="text-xl font-bold text-white">{signal.symbol}</h3>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${bull ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
          <Icon className={`h-5 w-5 ${color}`} />
          <span className={`font-bold ${color}`}>{signal.bias}</span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Confidence</span>
            <span className={`font-mono text-2xl font-bold ${color}`}>{signal.confidence}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${signal.confidence}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Level label="Entry" value={signal.entry} icon={<Crosshair className="h-3.5 w-3.5" />} tone="text-sky-300" />
          <Level label="Take Profit" value={signal.takeProfit} icon={<Target className="h-3.5 w-3.5" />} tone="text-emerald-400" />
          <Level label="Stop Loss" value={signal.stopLoss} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone="text-rose-400" />
        </div>

        {signal.currentPrice !== undefined && (
          <p className="text-xs text-zinc-500">
            Last price: <span className="font-mono text-zinc-300">{formatPrice(signal.currentPrice)}</span>
          </p>
        )}

        <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">AI Reasoning</p>
          <p className="text-sm leading-relaxed text-zinc-300">{signal.reasoning}</p>
        </div>

        <button
          onClick={onLog}
          disabled={logged}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition active:scale-[0.98] ${
            logged
              ? "cursor-default bg-white/5 text-zinc-400"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {logged ? <Check className="h-5 w-5 text-emerald-400" /> : <BookmarkPlus className="h-5 w-5" />}
          {logged ? "Paper Trade Logged" : "Log Paper Trade"}
        </button>

        <p className="text-center text-[11px] text-zinc-600">
          Simulated analysis for education only. Not financial advice.
        </p>
      </div>
    </motion.div>
  );
}

function Level({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
      <div className={`mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${tone}`}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="truncate font-mono text-sm font-semibold text-white sm:text-base">{formatPrice(value)}</p>
    </div>
  );
}
