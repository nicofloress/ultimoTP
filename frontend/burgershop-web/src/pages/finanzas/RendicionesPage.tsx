import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RendicionDto,
  RepartidorPendienteRendicionDto,
  getRendiciones,
  aprobarRendicion,
  getRepartidoresPendientes,
  crearRendicion,
} from '../../api/rendiciones';
import { getPedido } from '../../api/pedidos';
import { Pedido } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

type FiltroEstado = 'todas' | 'pendientes' | 'aprobadas' | 'rechazadas';

export default function RendicionesPage() {
  const [rendiciones, setRendiciones] = useState<RendicionDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const hoy = new Date().toISOString().slice(0, 10);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(hoy);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(hoy);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<{ id: number; aprobar: boolean } | null>(null);
  const [obsAdmin, setObsAdmin] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { showToast } = useGlobalToast();

  // Nueva Rendicion modal state
  const [mostrarNuevaRendicion, setMostrarNuevaRendicion] = useState(false);
  const [repartidoresPendientes, setRepartidoresPendientes] = useState<RepartidorPendienteRendicionDto[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<RepartidorPendienteRendicionDto | null>(null);
  const [efectivoDeclarado, setEfectivoDeclarado] = useState('');
  const [obsNueva, setObsNueva] = useState('');
  const [creandoRendicion, setCreandoRendicion] = useState(false);

  // Detalle de pedido expandido dentro del modal de rendición
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<number | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<Pedido | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);

  const verDetallePedido = async (pedidoId: number) => {
    if (pedidoExpandidoId === pedidoId) {
      setPedidoExpandidoId(null);
      setPedidoExpandido(null);
      return;
    }
    setPedidoExpandidoId(pedidoId);
    setPedidoExpandido(null);
    setCargandoPedido(true);
    try {
      const data = await getPedido(pedidoId);
      setPedidoExpandido(data);
    } catch {
      showToast('Error al cargar detalle del pedido', 'error');
      setPedidoExpandidoId(null);
    } finally {
      setCargandoPedido(false);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await getRendiciones(filtroFechaDesde || undefined, filtroFechaHasta || undefined);
      setRendiciones(data);
    } catch {
      // silenciar errores
    } finally {
      setCargando(false);
    }
  };

  // Cantidad de rendiciones pendientes de crear (para notificación)
  const [cantPendientes, setCantPendientes] = useState(0);

  const cargarPendientesCount = async () => {
    try {
      const data = await getRepartidoresPendientes();
      setCantPendientes(data.length);
    } catch { /* silenciar */ }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => {
    cargarPendientesCount();
  }, []);

  const abrirNuevaRendicion = useCallback(async () => {
    setMostrarNuevaRendicion(true);
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
    setCargandoPendientes(true);
    try {
      const data = await getRepartidoresPendientes();
      setRepartidoresPendientes(data);
    } catch {
      showToast('Error al cargar repartidores pendientes', 'error');
    } finally {
      setCargandoPendientes(false);
    }
  }, [showToast]);

  const cerrarNuevaRendicion = () => {
    setMostrarNuevaRendicion(false);
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
  };

  const seleccionarRepartidor = (r: RepartidorPendienteRendicionDto) => {
    setRepartidorSeleccionado(r);
    setEfectivoDeclarado('');
    setObsNueva('');
  };

  const volverASeleccion = () => {
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
  };

  const efectivoDeclaradoNum = parseFloat(efectivoDeclarado) || 0;
  const diferenciaPreview = repartidorSeleccionado
    ? efectivoDeclaradoNum - repartidorSeleccionado.totalEfectivo
    : 0;

  const handleCrearRendicion = async () => {
    if (!repartidorSeleccionado) return;
    setCreandoRendicion(true);
    try {
      await crearRendicion({
        repartidorId: repartidorSeleccionado.repartidorId,
        repartoZonaId: repartidorSeleccionado.repartoZonaId,
        efectivoDeclarado: efectivoDeclaradoNum,
        observaciones: obsNueva || undefined,
      });
      showToast('Rendicion creada correctamente', 'success');
      cerrarNuevaRendicion();
      await cargarDatos();
      await cargarPendientesCount();
    } catch {
      showToast('Error al crear la rendicion', 'error');
    } finally {
      setCreandoRendicion(false);
    }
  };

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

      {/* Banner pendientes */}
      {cantPendientes > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-1.5">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-green-800">
                {cantPendientes === 1 ? 'Hay 1 reparto pendiente de rendicion' : `Hay ${cantPendientes} repartos pendientes de rendicion`}
              </span>
            </div>
          </div>
          <button
            onClick={abrirNuevaRendicion}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear rendicion
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={e => setFiltroFechaDesde(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={e => setFiltroFechaHasta(e.target.value)}
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
              onClick={() => { setFiltroFechaDesde(hoy); setFiltroFechaHasta(hoy); setFiltroEstado('todas'); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline mt-5"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="ml-auto flex items-end gap-3">
            <button
              onClick={cargarDatos}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={abrirNuevaRendicion}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Rendicion
              {cantPendientes > 0 && (
                <span className="bg-white text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{cantPendientes}</span>
              )}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setDetalleId(null); setPedidoExpandidoId(null); setPedidoExpandido(null); }}>
          <div className="flex items-stretch gap-3 max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Panel izquierdo: Rendición */}
            <div className="bg-white rounded-xl shadow-2xl w-[28rem] overflow-hidden flex flex-col flex-shrink-0">
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
                  onClick={() => { setDetalleId(null); setPedidoExpandidoId(null); setPedidoExpandido(null); }}
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
                  <div className="space-y-2">
                    {detalle.detalles.map(d => {
                      const isSelected = pedidoExpandidoId === d.pedidoId;
                      return (
                        <button
                          key={d.id}
                          onClick={() => verDetallePedido(d.pedidoId)}
                          className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                            isSelected ? 'bg-blue-100 border border-blue-300 ring-1 ring-blue-300' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-sm">{d.numeroTicket}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                d.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {d.estado}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {d.formaPago && <span className="text-xs text-gray-400">{d.formaPago}</span>}
                              <span className="text-sm text-gray-700 font-semibold">${d.total.toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                          {(d.nombreCliente || d.direccionEntrega) && (
                            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                              {d.nombreCliente && <span className="font-medium text-gray-600">{d.nombreCliente}</span>}
                              {d.direccionEntrega && (
                                <span className="truncate max-w-[200px]" title={d.direccionEntrega}>{d.direccionEntrega}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
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

            {/* Panel derecho: Detalle del pedido */}
            {pedidoExpandido && (
              <div className="bg-white rounded-xl shadow-2xl w-[22rem] overflow-hidden flex flex-col flex-shrink-0 animate-in slide-in-from-left-2">
                {/* Header */}
                <div className="px-5 py-4 bg-slate-700 flex items-center justify-between flex-shrink-0">
                  <div>
                    <div className="font-bold text-white">{pedidoExpandido.numeroTicket}</div>
                    <div className="text-xs text-slate-300 mt-0.5">Detalle del pedido</div>
                  </div>
                  <button
                    onClick={() => { setPedidoExpandidoId(null); setPedidoExpandido(null); }}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* Info cliente */}
                  <div className="space-y-2">
                    {pedidoExpandido.nombreCliente && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-gray-700 font-medium">{pedidoExpandido.nombreCliente}</span>
                      </div>
                    )}
                    {pedidoExpandido.telefonoCliente && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-gray-700">{pedidoExpandido.telefonoCliente}</span>
                      </div>
                    )}
                    {pedidoExpandido.direccionEntrega && (
                      <div className="flex items-start gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-gray-700">{pedidoExpandido.direccionEntrega}</span>
                      </div>
                    )}
                    {pedidoExpandido.zonaNombre && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        <span className="text-gray-700">{pedidoExpandido.zonaNombre}</span>
                      </div>
                    )}
                  </div>

                  {pedidoExpandido.notaInterna && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
                      <span className="font-medium">Nota:</span> {pedidoExpandido.notaInterna}
                    </div>
                  )}

                  {/* Líneas del pedido */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Productos</h4>
                    <div className="space-y-1.5">
                      {pedidoExpandido.lineas.map(l => (
                        <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-blue-600 font-bold text-xs">{l.cantidad}x</span>
                            <span className="text-gray-700 truncate">{l.descripcion}</span>
                          </div>
                          <span className="text-gray-700 font-semibold flex-shrink-0 ml-2">${l.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagos */}
                  {pedidoExpandido.pagos && pedidoExpandido.pagos.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Pagos</h4>
                      <div className="space-y-1">
                        {pedidoExpandido.pagos.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{p.formaPagoNombre}</span>
                            <span className="text-gray-700 font-medium">${p.totalACobrar.toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer total */}
                <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex-shrink-0 space-y-1">
                  {pedidoExpandido.descuento > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Descuento</span>
                      <span className="text-green-600 font-medium">-${pedidoExpandido.descuento.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  {pedidoExpandido.recargo > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Recargo</span>
                      <span className="text-red-600 font-medium">+${pedidoExpandido.recargo.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-gray-700">Total</span>
                    <span className="text-gray-900">${pedidoExpandido.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading panel derecho */}
            {cargandoPedido && !pedidoExpandido && pedidoExpandidoId && (
              <div className="bg-white rounded-xl shadow-2xl w-[22rem] overflow-hidden flex items-center justify-center flex-shrink-0">
                <div className="text-gray-400 text-sm">Cargando pedido...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nueva Rendicion */}
      {mostrarNuevaRendicion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={cerrarNuevaRendicion}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 bg-amber-600 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {repartidorSeleccionado && (
                  <button
                    onClick={volverASeleccion}
                    className="text-white/80 hover:text-white transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h3 className="font-bold text-lg text-white">
                  {repartidorSeleccionado ? 'Crear Rendicion' : 'Nueva Rendicion'}
                </h3>
              </div>
              <button
                onClick={cerrarNuevaRendicion}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!repartidorSeleccionado ? (
                /* Step 1: Seleccionar repartidor */
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Selecciona un reparto finalizado para crear la rendicion:
                  </p>
                  {cargandoPendientes ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-400">Cargando repartidores...</div>
                    </div>
                  ) : repartidoresPendientes.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-400 font-medium">No hay repartidores pendientes de rendicion</p>
                      <p className="text-gray-300 text-sm mt-1">Todos los repartidores ya tienen su rendicion de hoy o no finalizaron sus zonas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {repartidoresPendientes.map(rp => (
                        <button
                          key={rp.repartoZonaId}
                          onClick={() => seleccionarRepartidor(rp)}
                          className="w-full text-left bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-lg p-4 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800 group-hover:text-amber-800">
                                {rp.repartidorNombre}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                <span className="text-blue-600 font-medium">{rp.zonaNombre}</span>
                                <span className="text-green-600">{rp.totalEntregados} entregados</span>
                                {rp.totalNoEntregados > 0 && (
                                  <span className="text-red-500">{rp.totalNoEntregados} no entreg.</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-700">
                                ${(rp.totalEfectivo + rp.totalTransferencia).toLocaleString('es-AR')}
                              </div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Preview + Efectivo Declarado */
                <div className="p-6 space-y-5">
                  {/* Repartidor info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <div className="font-semibold text-amber-900">{repartidorSeleccionado.repartidorNombre}</div>
                    <div className="text-xs text-amber-700 mt-0.5">
                      {repartidorSeleccionado.zonas.map(z => z.zonaNombre).join(', ')}
                    </div>
                  </div>

                  {/* Zonas breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Zonas del reparto</h4>
                    <div className="space-y-1.5">
                      {repartidorSeleccionado.zonas.map(z => (
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

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Entregados</div>
                      <div className="text-lg font-bold mt-1 text-green-700">{repartidorSeleccionado.totalEntregados}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">No Entregados</div>
                      <div className="text-lg font-bold mt-1 text-red-600">{repartidorSeleccionado.totalNoEntregados}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Total Efectivo</div>
                      <div className="text-lg font-bold mt-1 text-gray-800">${repartidorSeleccionado.totalEfectivo.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Total Transferencia</div>
                      <div className="text-lg font-bold mt-1 text-gray-800">${repartidorSeleccionado.totalTransferencia.toLocaleString('es-AR')}</div>
                    </div>
                  </div>

                  {/* Total No Entregado */}
                  {repartidorSeleccionado.totalNoEntregado > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-800">Total No Entregado</span>
                        <span className="text-lg font-bold text-amber-700">${repartidorSeleccionado.totalNoEntregado.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  )}

                  {/* Efectivo Declarado input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Efectivo Declarado</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        value={efectivoDeclarado}
                        onChange={e => setEfectivoDeclarado(e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-right"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Diferencia en vivo */}
                  {efectivoDeclarado !== '' && (
                    <div className={`rounded-xl p-4 border-2 ${
                      diferenciaPreview === 0
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-medium ${diferenciaPreview === 0 ? 'text-green-700' : 'text-red-700'}`}>
                          Diferencia
                        </span>
                        <span className={`text-xl font-bold ${diferenciaPreview === 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {diferenciaPreview > 0 ? '+' : ''}${diferenciaPreview.toLocaleString('es-AR')}
                        </span>
                      </div>
                      {diferenciaPreview !== 0 && (
                        <p className="text-xs mt-1 text-red-500">
                          {diferenciaPreview > 0 ? 'Sobra efectivo respecto al esperado' : 'Falta efectivo respecto al esperado'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                    <textarea
                      value={obsNueva}
                      onChange={e => setObsNueva(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none"
                      rows={2}
                      placeholder="Notas adicionales sobre esta rendicion..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {repartidorSeleccionado && (
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-gray-50">
                <button
                  onClick={cerrarNuevaRendicion}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={creandoRendicion}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearRendicion}
                  disabled={creandoRendicion || efectivoDeclarado === ''}
                  className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creandoRendicion ? 'Creando...' : 'Crear Rendicion'}
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
