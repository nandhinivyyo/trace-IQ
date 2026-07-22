import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Play, X } from "lucide-react";

export function InputDialog({ isOpen, onClose, onSubmit }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-lg)] border border-[#232323] bg-[#111111] p-5 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#232323] pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[#12321f] border border-[#22c55e]/20">
                  <Keyboard className="h-4 w-4 text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="text-body font-semibold text-[var(--color-text-primary)]">
                    Stdin Input Required
                  </h3>
                  <p className="text-micro text-[var(--color-text-tertiary)]">
                    Your program expects runtime inputs.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-tertiary)] hover:bg-[#1c1d21] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-medium text-[var(--color-text-secondary)] select-none">
                  Enter Multi-line Input values:
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="h-32 w-full rounded-[var(--radius-sm)] border border-[#232323] bg-[#0B0B0B] p-3 font-mono text-body-sm text-[var(--color-text-primary)] placeholder-zinc-700 focus:border-[#22C55E] focus:outline-none resize-none transition-colors"
                  placeholder="Example:&#10;5&#10;1 4 2 8 3"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-[#232323] pt-4 mt-1 select-none">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-[var(--radius-sm)] border border-[#232323] bg-[#161616] px-4 text-caption font-semibold text-[var(--color-text-secondary)] hover:bg-[#1f1f1f] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[#22C55E] px-4.5 text-caption font-bold text-black hover:bg-[#2fd66d] cursor-pointer transition-all shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  <span>Run Program</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
