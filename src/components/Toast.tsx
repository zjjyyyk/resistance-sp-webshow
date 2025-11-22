/**
 * @fileoverview Toast notification component
 * @module components/Toast
 */

import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast, ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'bg-green-600 border-green-500',
  error: 'bg-red-600 border-red-500',
  warning: 'bg-yellow-600 border-yellow-500',
  info: 'bg-blue-600 border-blue-500',
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const Icon = icons[toast.type];
  const colorClass = colors[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${colorClass} text-white shadow-lg min-w-[300px] max-w-md`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:bg-white/10 rounded p-1 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
