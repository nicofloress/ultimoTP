import { Venta } from '../../../types';

interface Props {
  pedido: Venta;
  motivoCancelacion: string;
  setMotivoCancelacion: (v: string) => void;
  onConfirmar: () => void;
  onCerrar: () => void;
  inputClass: string;
}

export default function ModalCancelarPedido({
  pedido, motivoCancelacion, setMotivoCancelacion, onConfirmar, onCerrar, inputClass,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelar-pedido-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="bg-red-600 px-5 py-3 rounded-t-xl">
          <h3 id="cancelar-pedido-title" className="text-white font-bold">Cancelar pedido</h3>
          <p className="text-red-100 text-sm">#{pedido.numeroTicket}</p>
        </div>
        <div className="px-5 py-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de cancelacion *</label>
          <textarea
            value={motivoCancelacion}
            onChange={e => setMotivoCancelacion(e.target.value)}
            placeholder="Ingresa el motivo..."
            rows={3}
            className={`${inputClass} resize-none`}
            autoFocus
          />
        </div>
        <div className="px-5 py-3 flex gap-3 border-t border-gray-200">
          <button
            onClick={onCerrar}
            className="flex-1 py-2 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onConfirmar}
            disabled={!motivoCancelacion.trim()}
            className="flex-1 py-2 rounded-lg font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Cancelar pedido
          </button>
        </div>
      </div>
    </div>
  );
}
