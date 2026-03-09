import { useEffect, useState, useCallback } from 'react';

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
      // Pequeño delay para activar la transicion de entrada
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
