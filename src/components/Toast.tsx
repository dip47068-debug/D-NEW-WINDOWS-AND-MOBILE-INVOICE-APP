import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div 
      id="vyapar-toast-container"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { id, title, message, type, duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Styling based on type
  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200/60 shadow-emerald-100/40',
      iconBg: 'bg-emerald-100 text-emerald-800',
      textTitle: 'text-emerald-950',
      textMessage: 'text-emerald-800',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200/60 shadow-amber-100/40',
      iconBg: 'bg-amber-100 text-amber-850',
      textTitle: 'text-amber-950',
      textMessage: 'text-amber-800',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    info: {
      bg: 'bg-slate-50 border-slate-200/60 shadow-slate-100/40',
      iconBg: 'bg-slate-100 text-slate-700',
      textTitle: 'text-slate-950',
      textMessage: 'text-slate-800',
      icon: <Info className="h-5 w-5" />
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`pointer-events-auto flex gap-3 p-4 rounded-xl border shadow-lg ${currentStyle.bg}`}
      style={{ contentVisibility: 'auto' }}
    >
      <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center h-9 w-9 ${currentStyle.iconBg}`}>
        {currentStyle.icon}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-xs font-extrabold uppercase tracking-wider font-sans ${currentStyle.textTitle}`}>
          {title}
        </h4>
        <p className={`text-[11px] mt-0.5 font-sans leading-normal font-medium ${currentStyle.textMessage}`}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 shrink-0 self-start p-1 transition cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
