import NumericInput from '../../../components/NumericInput';

interface Props {
  montoInicial: number;
  setMontoInicial: (v: number) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCerrar: () => void;
}

export default function ModalAbrirCaja({
  montoInicial, setMontoInicial, observaciones, setObservaciones,
  onSubmit, onCerrar,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abrir-caja-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="bg-green-600 px-5 py-4 rounded-t-xl">
          <h3 id="abrir-caja-title" className="text-white font-bold text-lg">Abrir Caja</h3>
          <p className="text-green-100 text-sm">Ingrese el monto inicial para comenzar</p>
        </div>
        <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial *</label>
            <NumericInput
              value={montoInicial}
              onChange={v => setMontoInicial(v)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              min={0}
              decimales
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 resize-none"
              rows={2}
              placeholder="Observaciones opcionales..."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Abrir Caja
            </button>
            <button type="button" onClick={onCerrar} className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
