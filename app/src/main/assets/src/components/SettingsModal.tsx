"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  twelveDataKey: string;
  aiKey: string;
  onSave: (twelveDataKey: string, aiKey: string) => void;
}

export default function SettingsModal({ open, onClose, twelveDataKey, aiKey, onSave }: Props) {
  const [td, setTd] = useState(twelveDataKey);
  const [ai, setAi] = useState(aiKey);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setTd(twelveDataKey);
      setAi(aiKey);
    }
  }, [open, twelveDataKey, aiKey]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#111418] p-5 shadow-2xl sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">API Settings</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Twelve Data API Key
                </span>
                <input
                  type={show ? "text" : "password"}
                  value={td}
                  onChange={(e) => setTd(e.target.value)}
                  placeholder="Enter Twelve Data key"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/60"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  OpenRouter API Key
                </span>
                <input
                  type={show ? "text" : "password"}
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  placeholder="sk-or-..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500/60"
                />
              </label>
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {show ? "Hide keys" : "Show keys"}
              </button>
              <p className="text-xs leading-relaxed text-zinc-500">
                Keys are stored only in your browser&apos;s LocalStorage and sent to the
                server solely to fetch market data and AI analysis.
              </p>
            </div>

            <button
              onClick={() => {
                onSave(td.trim(), ai.trim());
                onClose();
              }}
              className="mt-5 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              Save Keys
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
