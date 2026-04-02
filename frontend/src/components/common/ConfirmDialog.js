import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const ConfirmDialog = ({
  isOpen, onClose, onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  danger = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="w-full max-w-sm card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                danger ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5 -mt-1 -mr-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-heading font-bold text-white text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{message}</p>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  danger
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-primary-500 hover:bg-primary-600 text-white"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
