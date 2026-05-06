import { EstadoVenta, FormaPago } from '../../../types/ventas';

interface Props {
  nuevoEstado: EstadoVenta;
  setNuevoEstado: (v: EstadoVenta) => void;
  nuevaFormaPagoId: number | '' | 'dividido';
  setNuevaFormaPagoId: (v: number | '' | 'dividido') => void;
  montoEfectivo: string;
  setMontoEfectivo: (v: string) => void;
  montoTransferencia: string;
  setMontoTransferencia: (v: string) => void;
  motivoNoEntregado: string;
  setMotivoNoEntregado: (v: string) => void;
  formasPago: FormaPago[];
  totalPedido: number;
  guardando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EditarEstadoPedidoModal({
  nuevoEstado, setNuevoEstado,
  nuevaFormaPagoId, setNuevaFormaPagoId,
  montoEfectivo, setMontoEfectivo,
  montoTransferencia, setMontoTransferencia,
  motivoNoEntregado, setMotivoNoEntregado,
  formasPago, totalPedido, guardando,
  onCancel, onConfirm,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editar-estado-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 bg-slate-700 flex-shrink-0">
          <h3 id="editar-estado-title" className="font-bold text-white text-sm">Editar pedido</h3>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(Number(e.target.value) as EstadoVenta)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value={EstadoVenta.Entregado}>Entregado</option>
              <option value={EstadoVenta.NoEntregado}>No Entregado</option>
              <option value={EstadoVenta.EnCamino}>En Camino</option>
              <option value={EstadoVenta.Asignado}>Asignado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pago</label>
            <select
              value={nuevaFormaPagoId}
              onChange={e => {
                const v = e.target.value;
                setNuevaFormaPagoId(v === '' ? '' : v === 'dividido' ? 'dividido' : Number(v));
                if (v !== 'dividido') { setMontoEfectivo(''); setMontoTransferencia(''); }
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">— Sin cambios —</option>
              {formasPago.map(fp => (
                <option key={fp.id} value={fp.id}>{fp.nombre}</option>
              ))}
              <option value="dividido">Dividido (Efectivo + Transferencia)</option>
            </select>
            {nuevaFormaPagoId === 'dividido' && (
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Efectivo</label>
                  <input
                    type="number"
                    value={montoEfectivo}
                    onChange={e => {
                      setMontoEfectivo(e.target.value);
                      const ef = parseFloat(e.target.value) || 0;
                      const resto = Math.max(0, totalPedido - ef);
                      setMontoTransferencia(resto > 0 ? resto.toString() : '');
                    }}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    min={0}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Transferencia</label>
                  <input
                    type="number"
                    value={montoTransferencia}
                    onChange={e => setMontoTransferencia(e.target.value)}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>
          {nuevoEstado === EstadoVenta.NoEntregado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoNoEntregado}
                onChange={e => setMotivoNoEntregado(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Motivo por el cual no se entregó..."
              />
            </div>
          )}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={guardando}
            className="px-4 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={guardando}
            className="px-4 py-2 rounded bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
