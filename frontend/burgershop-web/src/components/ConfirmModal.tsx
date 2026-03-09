import React from 'react';

export interface ConfirmModalProps {
  visible: boolean;
  titulo: string;
  mensaje?: string;
  detalle?: React.ReactNode;
  tipo?: 'danger' | 'warning' | 'success' | 'info';
  textoConfirmar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const headerColors: Record<string, string> = {
  danger: 'bg-red-600',
  warning: 'bg-amber-500',
  success: 'bg-green-600',
  info: 'bg-slate-700',
};

const buttonColors: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-600/20',
  warning: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20',
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-green-600/20',
  info: 'bg-slate-700 hover:bg-slate-800 active:bg-slate-900 shadow-slate-700/20',
};

const mensajeColors: Record<string, string> = {
  danger: 'text-red-100',
  warning: 'text-amber-100',
  success: 'text-green-100',
  info: 'text-slate-300',
};

function IconDanger() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function IconSuccess() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const iconMap: Record<string, () => React.JSX.Element> = {
  danger: IconDanger,
  warning: IconWarning,
  success: IconSuccess,
  info: IconInfo,
};

export function ConfirmModal({
  visible,
  titulo,
  mensaje,
  detalle,
  tipo = 'info',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  if (!visible) return null;

  const Icon = iconMap[tipo] || iconMap.info;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => !cargando && onCancelar()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${headerColors[tipo] || headerColors.info} px-6 py-4 flex items-center gap-3`}>
          <div className="bg-white/20 rounded-full p-2">
            <Icon />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{titulo}</h3>
            {mensaje && (
              <p className={`${mensajeColors[tipo] || mensajeColors.info} text-sm`}>{mensaje}</p>
            )}
          </div>
        </div>

        {/* Body / Detalle */}
        {detalle && (
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            {detalle}
          </div>
        )}

        {/* Botones */}
        <div className="px-6 py-4 flex gap-3 border-t border-gray-100">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={`flex-[1.5] py-2.5 rounded-lg font-bold text-sm text-white transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2 ${buttonColors[tipo] || buttonColors.info}`}
          >
            {cargando ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : (
              textoConfirmar
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
