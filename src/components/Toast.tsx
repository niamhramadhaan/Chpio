import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType } from '../store/toastStore';

const icons: Record<ToastType, typeof Check> = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'bg-teal-400/15 border-teal-400/30 text-teal-400',
  error: 'bg-red-400/15 border-red-400/30 text-red-400',
  info: 'bg-white/10 border-white/20 text-white/70',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-lg ${colors[toast.type]}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
