import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open, message, onConfirm, onCancel,
  title = 'Confirm Delete',
  confirmLabel = 'Delete',
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.82, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="glass rounded-2xl p-8 w-full max-w-sm pointer-events-auto shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.05 }}
                  className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                >
                  <AlertTriangle size={24} className="text-red-400" />
                </motion.div>

                <div>
                  <h3 className="font-display font-semibold text-accent text-lg mb-1">{title}</h3>
                  <p className="text-sm text-accent-muted leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl text-sm text-accent-muted hover:text-accent bg-surface-2 border border-border hover:border-accent-dim transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={onConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 transition-colors font-medium"
                  >
                    {confirmLabel}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
