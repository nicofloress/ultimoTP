import { useEffect, useState, useMemo } from 'react';
import { RendicionDto, getRendiciones, aprobarRendicion } from '../../api/rendiciones';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

type FiltroEstado = 'todas' | 'pendientes' | 'aprobadas' | 'rechazadas';

export default function RendicionesPage() {
  const [rendiciones, setRendiciones] = useState<RendicionDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<{ id: number; aprobar: boolean } | null>(null);
  const [obsAdmin, setObsAdmin] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { showToast } = useGlobalToast();

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await getRendiciones(filtroFecha || undefined);
      setRendiciones(data);
    } catch {
      // silenciar errores
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha]);

  const rendicionesFiltradas = useMemo(() => {
    if (filtroEstado === 'todas') return rendiciones;
    return rendiciones.filter(r => {
      if (filtroEstado === 'pendientes') return !r.aprobada && !r.fechaAprobacion;
      if (filtroEstado === 'aprobadas') return r.aprobada;
      if (filtroEstado === 'rechazadas') return !r.aprobada && !!r.fechaAprobacion;
      return true;
    });
  }, [rendiciones, filtroEstado]);

  const resumen = useMemo(() => {
    const pendientes = rendiciones.filter(r => !r.aprobada && !r.fechaAprobacion);
    const aprobadas = rendiciones.filter(r => r.aprobada);
    const totalEfectivo = rendiciones.reduce((s, r) => s + r.totalEfectivo, 0);
    const totalTransferencia = rendiciones.reduce((s, r) => s + r.totalTransferencia, 0);
    return { pendientes: pendientes.length, aprobadas: aprobadas.length, totalEfectivo, totalTransferencia };
  }, [rendiciones]);

  const handleAccion = (id: number, aprobar: boolean) => {
    setAccionPendiente({ id, aprobar });
    setObsAdmin('');
  };

  const confirmarAccion = async () => {
    if (!accionPendiente) return;
    setProcesando(true);
    try {
      await aprobarRendicion(accionPendiente.id, {
        aprobada: accionPendiente.aprobar,
        observaciones: obsAdmin || undefined,
      });
      showToast(
        accionPendiente.aprobar ? 'Rendicion aprobada' : 'Rendicion rechazada',
        accionPendiente.aprobar ? 'success' : 'error'
      );
      setAccionPendiente(null);
      await cargarDatos();
    } catch {
      showToast('Error al procesar la rendicion', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoBadge = (r: RendicionDto) => {
    if (r.aprobada) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Aprobada</span>;
    }
    if (r.fechaAprobacion) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Rechazada</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
  };

  const detalle = detalleId ? rendiciones.find(r => r.id === detalleId) : null;

  if (cargando && rendiciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Pendientes</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{resumen.pendientes}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Aprobadas</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{resumen.aprobadas}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Efectivo</div>
          <div className="text-lg font-bold mt-1 text-gray-800">${resumen.totalEfectivo.toLocaleString('es-AR')}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total Transferencia</div>
          <div className="text-lg font-bold mt-1 text-gray-800">${resumen.totalTransferencia.toLocaleString('es-AR')}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value as FiltroEstado)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="aprobadas">Aprobadas</option>
              <option value="rechazadas">Rechazadas</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroFecha(''); setFiltroEstado('todas'); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline mt-5"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="ml-auto flex items-end">
            <button
              onClick={cargarDatos}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de rendiciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Rendiciones de Repartidores</h2>
        {rendicionesFiltradas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay rendiciones para mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Repartidor</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Pedidos</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Efectivo</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Transferencia</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Declarado</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Diferencia</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rendicionesFiltradas.map(r => {
                  const esPendiente = !r.aprobada && !r.fechaAprobacion;
                  return (
                    <tr key={r.id} className={esPendiente ? 'bg-yellow-50/50' : ''}>
                      <td className="px-4 py-3 text-sm">{formatFecha(r.fecha)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{r.repartidorNombre}</td>
                      <td className="px-4 py-3 text-sm text-right">{r.cantidadEntregados + r.cantidadNoEntregados}</td>
                      <td className="px-4 py-3 text-sm text-right">${r.totalEfectivo.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-right">${r.totalTransferencia.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${r.efectivoDeclarado.toLocaleString('es-AR')}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${r.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${r.diferencia.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{getEstadoBadge(r)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetalleId(r.id)}
                            className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200"
                          >
                            Ver
                          </button>
                          {esPendiente && (
                            <>
                              <button
                                onClick={() => handleAccion(r.id, true)}
                                className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors border border-green-200"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleAccion(r.id, false)}
                                className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors border border-red-200"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetalleId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">Rendicion #{detalle.id}</span>
                  {getEstadoBadge(detalle)}
                </div>
                <p className="text-sm text-slate-300 mt-0.5">{detalle.repartidorNombre} - {formatFecha(detalle.fecha)}</p>
              </div>
              <button
                onClick={() => setDetalleId(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Montos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Efectivo</div>
                  <div className="text-sm font-semibold mt-1">${detalle.totalEfectivo.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Transferencia</div>
                  <div className="text-sm font-semibold mt-1">${detalle.totalTransferencia.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Efectivo Declarado</div>
                  <div className="text-sm font-semibold mt-1">${detalle.efectivoDeclarado.toLocaleString('es-AR')}</div>
                </div>
                <div className={`rounded-lg p-3 ${detalle.diferencia !== 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Diferencia</div>
                  <div className={`text-sm font-bold mt-1 ${detalle.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${detalle.diferencia.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Entregados</div>
                  <div className="text-sm font-semibold mt-1">{detalle.cantidadEntregados}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">No Entregados</div>
                  <div className="text-sm font-semibold mt-1">{detalle.cantidadNoEntregados}</div>
                </div>
              </div>

              {detalle.observaciones && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Observaciones del repartidor:</span> {detalle.observaciones}
                </div>
              )}

              {/* Pedidos */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Pedidos incluidos</h4>
                <div className="space-y-1.5">
                  {detalle.detalles.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800">{d.numeroTicket}</span>
                        {d.formaPago && <span className="ml-2 text-xs text-gray-400">{d.formaPago}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          d.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {d.estado}
                        </span>
                        <span className="text-gray-600 font-medium">${d.total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zonas del reparto */}
              {detalle.zonas && detalle.zonas.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Zonas del reparto</h4>
                  <div className="space-y-1.5">
                    {detalle.zonas.map(z => (
                      <div key={z.zonaId} className="flex items-center justify-between text-sm bg-blue-50 rounded px-3 py-2">
                        <span className="font-medium text-gray-800">{z.zonaNombre}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600">{z.totalEntregados} entregados</span>
                          <span className="text-red-600">{z.totalNoEntregados} no entreg.</span>
                          <span className="text-gray-500">{z.totalPedidos} total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="border-t border-amber-200 px-6 py-3 bg-amber-50 flex-shrink-0">
              <div className="flex justify-between font-bold text-base">
                <span className="text-amber-900">Total No Entregado</span>
                <span className="text-amber-700">${detalle.totalNoEntregado.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {!detalle.aprobada && !detalle.fechaAprobacion && (
              <div className="px-6 py-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { setDetalleId(null); handleAccion(detalle.id, false); }}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => { setDetalleId(null); handleAccion(detalle.id, true); }}
                  className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
                >
                  Aprobar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmar Accion */}
      <ConfirmModal
        visible={!!accionPendiente}
        titulo={accionPendiente?.aprobar ? 'Aprobar Rendicion' : 'Rechazar Rendicion'}
        mensaje={accionPendiente?.aprobar
          ? 'Se aprobara esta rendicion del repartidor'
          : 'Se rechazara esta rendicion. El repartidor debera corregirla.'
        }
        tipo={accionPendiente?.aprobar ? 'success' : 'danger'}
        textoConfirmar={accionPendiente?.aprobar ? 'Aprobar' : 'Rechazar'}
        cargando={procesando}
        detalle={
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea
              value={obsAdmin}
              onChange={e => setObsAdmin(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Observaciones para el repartidor..."
            />
          </div>
        }
        onConfirmar={confirmarAccion}
        onCancelar={() => setAccionPendiente(null)}
      />
    </div>
  );
}
