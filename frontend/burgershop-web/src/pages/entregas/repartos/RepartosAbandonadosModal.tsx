import { useState } from 'react';
import { RepartoAbandonadoDto, finalizarRepartoPorId } from '../../../api/entregas';
import { useGlobalToast } from '../../../components/Toast';

interface Props {
  repartos: RepartoAbandonadoDto[];
  onClose: () => void;
  onChanged: () => void;
}

function formatFecha(f: string) {
  const d = new Date(f.endsWith('Z') || f.includes('+') ? f : f + 'Z');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function RepartosAbandonadosModal({ repartos, onClose, onChanged }: Props) {
  const { showToast } = useGlobalToast();
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [procesandoTodos, setProcesandoTodos] = useState(false);
  const [progreso, setProgreso] = useState<{ hechos: number; total: number } | null>(null);

  const sinResolverCount = (r: RepartoAbandonadoDto) =>
    r.totalPendientes + r.totalAsignados + r.totalEnCamino;
  const puedeFinalizar = (r: RepartoAbandonadoDto) => sinResolverCount(r) === 0;
  const repartosFinalizables = repartos.filter(puedeFinalizar);
  const totalPendientesGlobal = repartos.reduce((acc, r) => acc + sinResolverCount(r), 0);

  const finalizarUno = async (r: RepartoAbandonadoDto) => {
    if (!puedeFinalizar(r)) return;
    setProcesandoId(r.id);
    try {
      await finalizarRepartoPorId(r.id);
      showToast(`Reparto de ${r.zonaNombre} finalizado`, 'success');
      onChanged();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al finalizar';
      showToast(msg, 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const finalizarTodos = async () => {
    if (repartosFinalizables.length === 0) return;
    if (!confirm(`¿Finalizar ${repartosFinalizables.length} reparto(s)?`)) return;
    setProcesandoTodos(true);
    setProgreso({ hechos: 0, total: repartosFinalizables.length });
    let ok = 0, fail = 0;
    for (let i = 0; i < repartosFinalizables.length; i++) {
      try {
        await finalizarRepartoPorId(repartosFinalizables[i].id);
        ok++;
      } catch {
        fail++;
      }
      setProgreso({ hechos: i + 1, total: repartosFinalizables.length });
    }
    setProcesandoTodos(false);
    setProgreso(null);
    if (ok > 0) showToast(`Finalizados: ${ok}${fail > 0 ? ` · Fallaron: ${fail}` : ''}`, fail > 0 ? 'error' : 'success');
    onChanged();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repartos-abandonados-title"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 bg-slate-700 rounded-t-xl flex items-center justify-between">
          <h3 id="repartos-abandonados-title" className="font-bold text-white text-base">
            <span className="text-amber-400">⚠</span> {repartos.length} reparto{repartos.length !== 1 ? 's' : ''} sin finalizar de días anteriores
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
          {totalPendientesGlobal > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-md px-3 py-2 mb-3 text-sm text-amber-800">
              Hay {totalPendientesGlobal} pedido(s) sin resolver (Pendiente / Asignado / En Camino). Para finalizar esos repartos,
              cambiales el estado desde <strong>Historial de Pedidos</strong> a <strong>Entregado</strong>, <strong>No Entregado</strong> o <strong>Cancelado</strong>.
            </div>
          )}

          <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-2 py-2 text-left font-semibold">Fecha</th>
                <th className="px-2 py-2 text-left font-semibold">Zona</th>
                <th className="px-2 py-2 text-left font-semibold hidden sm:table-cell">Repartidor</th>
                <th className="px-2 py-2 text-center font-semibold">Ventas</th>
                <th className="px-2 py-2 text-left font-semibold">Estado</th>
                <th className="px-2 py-2 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {repartos.map(r => {
                const bloqueado = !puedeFinalizar(r);
                return (
                  <tr key={r.id} className={bloqueado ? 'bg-red-50/40' : 'hover:bg-amber-50'}>
                    <td className="px-2 py-2 font-medium text-gray-700">{formatFecha(r.fecha)}</td>
                    <td className="px-2 py-2 text-gray-700">{r.zonaNombre}</td>
                    <td className="px-2 py-2 text-gray-700 hidden sm:table-cell">{r.repartidorNombre}</td>
                    <td className="px-2 py-2 text-center font-semibold text-gray-800">{r.totalVentas}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {r.totalEntregados > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{r.totalEntregados} entregados</span>
                        )}
                        {r.totalPendientes > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">{r.totalPendientes} pend.</span>
                        )}
                        {r.totalAsignados > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{r.totalAsignados} asig.</span>
                        )}
                        {r.totalEnCamino > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">{r.totalEnCamino} en camino</span>
                        )}
                        {r.totalNoEntregados > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">{r.totalNoEntregados} no ent.</span>
                        )}
                        {r.totalCancelados > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">{r.totalCancelados} canc.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => finalizarUno(r)}
                        disabled={bloqueado || procesandoId === r.id || procesandoTodos}
                        title={bloqueado ? 'Hay pedidos sin resolver (Pendiente / Asignado / En Camino). Resolvelos desde Historial primero.' : 'Finalizar reparto'}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          bloqueado
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {procesandoId === r.id ? 'Procesando...' : 'Finalizar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t rounded-b-xl flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {progreso ? `Procesando ${progreso.hechos}/${progreso.total}...` : `${repartosFinalizables.length} finalizable(s) de ${repartos.length}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cerrar
            </button>
            <button
              onClick={finalizarTodos}
              disabled={repartosFinalizables.length === 0 || procesandoTodos || procesandoId !== null}
              className="px-4 py-1.5 rounded bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {procesandoTodos ? 'Finalizando...' : `Finalizar todos (${repartosFinalizables.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
