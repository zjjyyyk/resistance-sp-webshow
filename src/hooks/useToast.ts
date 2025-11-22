/**
 * @fileoverview Toast notification hook
 * @module hooks/useToast
 */

import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useState<Map<string, ReturnType<typeof setTimeout>>>(() => new Map())[0];

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      id,
      type,
      message,
      duration: duration ?? (type === 'error' ? undefined : type === 'warning' ? 5000 : 3000),
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      const timeoutId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutRefs.delete(id);
      }, newToast.duration);
      timeoutRefs.set(id, timeoutId);
    }
  }, [timeoutRefs]);

  const removeToast = useCallback((id: string) => {
    const timeoutId = timeoutRefs.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [timeoutRefs]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutRefs.clear();
    };
  }, [timeoutRefs]);

  return { toasts, showToast, removeToast };
}
