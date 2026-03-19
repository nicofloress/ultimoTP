import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';

// ============================
// Types
// ============================
export type ToastType = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

// ============================
// Global Toast Context (for notifications)
// ============================
interface GlobalToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const GlobalToastContext = createContext<GlobalToastContextType | null>(null);

let globalNextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = globalNextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      dismissToast(id);
      timersRef.current.delete(id);
    }, 5000);
    timersRef.current.set(id, timer);
  }, [dismissToast]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <GlobalToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed z-50 flex flex-col gap-2 pointer-events-none bottom-6 left-1/2 -translate-x-1/2 items-center" style={{ maxWidth: '22rem', width: '100%' }}>
        {toasts.map(toast => (
          <GlobalToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </GlobalToastContext.Provider>
  );
}

const globalTypeStyles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  info: 'bg-amber-500 text-white',
  error: 'bg-red-600 text-white',
};

const globalTypeIcons: Record<ToastType, string> = {
  success: '\u2705',
  info: '\uD83D\uDD14',
  error: '\u274C',
};

function GlobalToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isVisible = entered && !toast.exiting;

  return (
    <div
      className={`pointer-events-auto rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 transition-all duration-300 ease-out ${globalTypeStyles[toast.type]} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      onClick={onDismiss}
      role="alert"
    >
      <span className="text-lg flex-shrink-0">{globalTypeIcons[toast.type]}</span>
      <p className="text-sm font-medium flex-1 min-w-0">{toast.message}</p>
      <button className="text-white/80 hover:text-white text-lg leading-none flex-shrink-0" onClick={onDismiss}>
        &times;
      </button>
    </div>
  );
}

export function useGlobalToast(): GlobalToastContextType {
  const ctx = useContext(GlobalToastContext);
  if (!ctx) {
    // Fallback: return a no-op if not in a provider (for backward compat)
    return { showToast: () => {} };
  }
  return ctx;
}

// ============================
// Legacy per-component Toast (backward compatible)
// ============================
export interface ToastProps {
  visible: boolean;
  mensaje: string;
  tipo?: 'success' | 'error' | 'info';
  onClose: () => void;
  duracion?: number;
}

const bgColors: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-slate-700',
};

function IconSuccess() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconError() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const iconMap: Record<string, () => React.JSX.Element> = {
  success: IconSuccess,
  error: IconError,
  info: IconInfo,
};

export function Toast({
  visible,
  mensaje,
  tipo = 'success',
  onClose,
  duracion = 3000,
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setShow(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onClose();
    }, duracion);
    return () => clearTimeout(timer);
  }, [visible, duracion, onClose]);

  if (!visible) return null;

  const Icon = iconMap[tipo] || iconMap.success;
  const bg = bgColors[tipo] || bgColors.success;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out ${
        show ? 'opacity-100 -translate-x-1/2 translate-y-0' : 'opacity-0 -translate-x-1/2 translate-y-4'
      }`}
    >
      <div className={`${bg} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3`}>
        <div className="bg-white/20 rounded-full p-1">
          <Icon />
        </div>
        <span className="font-semibold">{mensaje}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export interface UseToastState {
  visible: boolean;
  mensaje: string;
  tipo: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<UseToastState>({
    visible: false,
    mensaje: '',
    tipo: 'success',
  });

  const mostrarToast = useCallback((mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, mensaje, tipo });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, mostrarToast, cerrarToast };
}

export default Toast;
