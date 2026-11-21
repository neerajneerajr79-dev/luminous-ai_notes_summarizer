import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle2, color: 'text-success' },
  info: { icon: Info, color: 'text-accent' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  error: { icon: XCircle, color: 'text-red-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const { icon: Icon, color } = ICONS[type] || ICONS.info;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className="card pointer-events-auto flex items-start gap-2.5 p-3.5"
                role="status"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
                <p className="flex-1 text-sm leading-snug">{message}</p>
                <button
                  onClick={() => dismiss(id)}
                  className="rounded-md p-0.5 text-ink-soft hover:text-ink"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
