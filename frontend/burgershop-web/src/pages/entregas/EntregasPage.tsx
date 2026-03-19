import { useEffect, useState, useMemo, useCallback } from 'react';
import { Pedido, Repartidor, EstadoPedido, estadoLabels, TipoPedido } from '../../types';
import { getPedidosPorZona, empezarReparto, descargarControlCamioneta, finalizarRepartoZona } from '../../api/entregas';
import { getRepartidores } from '../../api/repartidores';
import { getZonas } from '../../api/zonas';
import { getProductos } from '../../api/productos';
import { crearPedido, getPedido } from '../../api/pedidos';
import { useGlobalToast } from '../../components/Toast';
import AdminChat from './AdminChat';

// Separate from shared estadoColores: entregas uses different colors for visual distinction in the delivery context
const estadoColorEntrega: Partial<Record<EstadoPedido, string>> = {
  [EstadoPedido.Pendiente]: 'bg-yellow-100 text-yellow-800',
  [EstadoPedido.Asignado]: 'bg-amber-100 text-amber-800',
  [EstadoPedido.EnCamino]: 'bg-indigo-100 text-indigo-800',
  [EstadoPedido.Entregado]: 'bg-green-100 text-green-700',
  [EstadoPedido.Cancelado]: 'bg-red-100 text-red-700',
  [EstadoPedido.NoEntregado]: 'bg-rose-100 text-rose-700',
};

const selectClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

export default function EntregasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [asignaciones, setAsignaciones] = useState<Map<number, number>>(new Map());
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [creandoTest, setCreandoTest] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [comprobanteSrc, setComprobanteSrc] = useState<string | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const { showToast } = useGlobalToast();
  const [chatAbierto, setChatAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [p, r] = await Promise.all([getPedidosPorZona(), getRepartidores()]);
      setPedidos(p);
      setRepartidores(r.filter(rep => rep.activo));

      // Auto-asignar repartidores en zonas que ya tienen repartidor activo
      setAsignaciones(prev => {
        const next = new Map(prev);
        p.forEach(ped => {
          if (ped.zonaId && ped.repartidorId &&
            (ped.estado === EstadoPedido.Asignado || ped.estado === EstadoPedido.EnCamino)) {
            if (!next.has(ped.zonaId)) {
              next.set(ped.zonaId, ped.repartidorId);
            }
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error cargando datos de entregas:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crearPedidosTest = async () => {
    setCreandoTest(true);
    try {
      const [productos, zonas] = await Promise.all([getProductos(), getZonas()]);
      const productosActivos = productos.filter(p => p.activo);
      const zonasActivas = zonas.filter(z => z.activa);

      if (productosActivos.length === 0 || zonasActivas.length === 0) {
        showToast('Necesitas productos y zonas activas para crear pedidos test', 'error');
        return;
      }

      const nombres = ['Juan Perez', 'Maria Garcia', 'Carlos Lopez', 'Ana Martinez', 'Pedro Rodriguez', 'Laura Fernandez'];
      const calles = ['Av. Rivadavia', 'Calle San Martin', 'Av. Mitre', 'Calle Belgrano', 'Av. 25 de Mayo', 'Calle Sarmiento'];
      const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

      for (let i = 0; i < 6; i++) {
        const cantLineas = 2 + Math.floor(Math.random() * 3); // 2-4 lineas
        const lineas = [];
        for (let j = 0; j < cantLineas; j++) {
          const prod = pick(productosActivos);
          lineas.push({
            productoId: prod.id,
            cantidad: 1 + Math.floor(Math.random() * 3),
            precioUnitario: prod.precio,
          });
        }
        const zona = pick(zonasActivas);
        await crearPedido({
          tipo: TipoPedido.Domicilio,
          nombreCliente: nombres[i],
          telefonoCliente: `11${Math.floor(10000000 + Math.random() * 90000000)}`,
          direccionEntrega: `${pick(calles)} ${100 + Math.floor(Math.random() * 9000)}, Hurlingham`,
          zonaId: zona.id,
          descuento: 0,
          estaPago: Math.random() > 0.5,
          lineas,
        });
        // Pedido ya se crea en estado Pendiente, no hace falta cambiar
      }

      showToast('6 pedidos de prueba creados', 'success');
      await cargar();
    } catch (err) {
      console.error('Error creando pedidos test:', err);
      showToast('Error al crear pedidos test', 'error');
    } finally {
      setCreandoTest(false);
    }
  };

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [cargar]);

  // Agrupar pedidos simplemente por zonaId
  const pedidosPorZona = useMemo(() => {
    const map = new Map<number, { zonaId: number; zona: string; pedidos: Pedido[] }>();

    pedidos.forEach(p => {
      if (!p.zonaId) return;
      if (!map.has(p.zonaId)) {
        map.set(p.zonaId, {
          zonaId: p.zonaId,
          zona: p.zonaNombre || 'Sin nombre',
          pedidos: [],
        });
      }
      map.get(p.zonaId)!.pedidos.push(p);
    });

    return map;
  }, [pedidos]);

  const totalPedidos = pedidos.length;

  // Pedidos pendientes de despacho (Pendiente) — para el boton Empezar Reparto
  const pedidosPendientes = useMemo(() =>
    pedidos.filter(p => p.estado === EstadoPedido.Pendiente),
    [pedidos]
  );

  // Zona IDs que tienen pedidos pendientes de despacho
  const zonasPendientesDespacho = useMemo(() => {
    const ids = new Set<number>();
    for (const [zonaId, data] of pedidosPorZona.entries()) {
      if (data.pedidos.some(p => p.estado === EstadoPedido.Pendiente)) {
        ids.add(zonaId);
      }
    }
    return ids;
  }, [pedidosPorZona]);

  // Validacion del boton: solo zonas con pedidos pendientes necesitan repartidor
  const todasZonasAsignadas = useMemo(() => {
    if (zonasPendientesDespacho.size === 0) return false;
    for (const zonaId of zonasPendientesDespacho) {
      if (!asignaciones.has(zonaId)) return false;
    }
    return true;
  }, [zonasPendientesDespacho, asignaciones]);

  const puedeEmpezar = pedidosPendientes.length > 0 && todasZonasAsignadas && !enviando;

  const handleAsignarRepartidor = (zonaId: number, repartidorId: number | null) => {
    setAsignaciones(prev => {
      const next = new Map(prev);
      if (repartidorId === null) {
        next.delete(zonaId);
      } else {
        next.set(zonaId, repartidorId);
      }
      return next;
    });
  };

  const handleEmpezarReparto = () => {
    if (!puedeEmpezar) return;
    setMostrarConfirmacion(true);
  };

  const confirmarReparto = async () => {
    setEnviando(true);
    try {
      // Solo enviar asignaciones de zonas que tienen pedidos pendientes
      const asignacionesArray = Array.from(asignaciones.entries())
        .filter(([zonaId]) => zonasPendientesDespacho.has(zonaId))
        .map(([zonaId, repartidorId]) => ({
          zonaId,
          repartidorId,
        }));
      // Descargar Excel de Control Camionetas antes de empezar reparto
      try {
        await descargarControlCamioneta(asignacionesArray);
      } catch (excelErr) {
        console.error('Error al descargar control camionetas:', excelErr);
      }
      await empezarReparto(asignacionesArray);
      setMostrarConfirmacion(false);
      showToast('Reparto iniciado con exito', 'success');
      setAsignaciones(new Map());
      await cargar();
    } catch (err) {
      console.error('Error al empezar reparto:', err);
      showToast('Error al empezar reparto', 'error');
      setMostrarConfirmacion(false);
    } finally {
      setEnviando(false);
    }
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const verDetalle = async (pedidoId: number) => {
    setCargandoDetalle(true);
    try {
      const detalle = await getPedido(pedidoId);
      setPedidoDetalle(detalle);
    } catch (err) {
      console.error('Error cargando detalle:', err);
      showToast('Error al cargar detalle del pedido', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Reparto</h1>
          <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-sm font-semibold">
            {totalPedidos} pedido{totalPedidos !== 1 ? 's' : ''}
          </span>
          {cargando && (
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              onClick={crearPedidosTest}
              disabled={creandoTest}
              className="text-sm text-orange-500 hover:text-orange-700 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {creandoTest ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              Test +6
            </button>
          )}
          <button
            onClick={() => setChatAbierto(true)}
            className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </button>
          <button
            onClick={cargar}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Grid de zonas */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {totalPedidos === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium">No hay pedidos pendientes para reparto</p>
            <p className="text-sm mt-1">Los pedidos tipo Domicilio con zona asignada apareceran aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
            {Array.from(pedidosPorZona.entries()).map(([zonaId, data]) => {
              const totalZona = data.pedidos.reduce((sum, p) => sum + p.total, 0);
              const repartidorAsignado = asignaciones.get(zonaId);
              const pendientesZona = data.pedidos.filter(p => p.estado === EstadoPedido.Pendiente).length;
              const asignadosZona = data.pedidos.filter(p => p.estado === EstadoPedido.Asignado).length;
              const enCaminoZona = data.pedidos.filter(p => p.estado === EstadoPedido.EnCamino).length;
              const entregadosZona = data.pedidos.filter(p => p.estado === EstadoPedido.Entregado).length;
              const canceladosZona = data.pedidos.filter(p => p.estado === EstadoPedido.Cancelado).length;
              const tienePendientes = pendientesZona > 0;
              const repartidorDeZona = data.pedidos.find(p => p.repartidorNombre)?.repartidorNombre;
              // Zona completada: todos los pedidos en estado final y al menos uno fue despachado
              const todosFinales = data.pedidos.length > 0
                && data.pedidos.every(p => p.estado === EstadoPedido.Entregado || p.estado === EstadoPedido.Cancelado || p.estado === EstadoPedido.NoEntregado);
              return (
                <div
                  key={zonaId}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col max-h-[calc(100vh-16rem)]"
                >
                  {/* Header de zona - sticky */}
                  <div className="sticky top-0 bg-white rounded-t-lg border-b border-gray-200 p-3 flex-shrink-0 z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-bold text-gray-800 text-base">{data.zona}</h2>
                      <span className="text-lg" role="img" aria-label="moto">🏍</span>
                    </div>
                    {tienePendientes ? (
                      <>
                      {repartidorDeZona && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 mb-1">
                          <span>Repartidor: {repartidorDeZona}</span>
                        </div>
                      )}
                      <select
                        value={repartidorAsignado || ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          handleAsignarRepartidor(zonaId, val);
                        }}
                        className={`${selectClass} ${repartidorAsignado ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                      >
                        <option value="">Seleccionar repartidor...</option>
                        {repartidores.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}{r.vehiculo ? ` - ${r.vehiculo}` : ''}
                          </option>
                        ))}
                      </select>
                      </>
                    ) : (
                      <div className="py-1.5">
                        {repartidorDeZona && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded px-2 py-1 mb-1">
                            <span>🏍</span>
                            <span>{repartidorDeZona}</span>
                          </div>
                        )}
                        {todosFinales ? (
                          <button
                            onClick={async () => {
                              try {
                                const repIdFin = data.pedidos.find(p => p.repartidorId)?.repartidorId;
                                if (!repIdFin) return;
                                await finalizarRepartoZona(data.zonaId, repIdFin);
                                showToast(`Reparto de ${data.zona} finalizado`, 'success');
                                await cargar();
                              } catch (err) {
                                console.error('Error al finalizar reparto:', err);
                                showToast('Error al finalizar reparto', 'error');
                              }
                            }}
                            className="w-full mt-1 py-2 rounded-lg font-semibold text-sm bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Finalizar Reparto
                          </button>
                        ) : (
                          <div className="text-xs text-gray-400 italic">Todos despachados</div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span>{data.pedidos.length} pedido{data.pedidos.length !== 1 ? 's' : ''} · ${totalZona.toLocaleString('es-AR')}</span>
                      <span className="text-gray-300">|</span>
                      {pendientesZona > 0 && <span className="text-yellow-600">{pendientesZona} pendiente{pendientesZona !== 1 ? 's' : ''}</span>}
                      {asignadosZona > 0 && <span className="text-amber-600">{asignadosZona} asignado{asignadosZona !== 1 ? 's' : ''}</span>}
                      {enCaminoZona > 0 && <span className="text-indigo-600">{enCaminoZona} en camino</span>}
                      {entregadosZona > 0 && <span className="text-gray-500">{entregadosZona} entregado{entregadosZona !== 1 ? 's' : ''}</span>}
                      {canceladosZona > 0 && <span className="text-red-500">{canceladosZona} cancelado{canceladosZona !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>

                  {/* Lista de pedidos - scrolleable */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {data.pedidos.map(pedido => (
                      <div
                        key={pedido.id}
                        className={`rounded-md border p-2.5 transition-colors ${pedido.estado === EstadoPedido.Cancelado || pedido.estado === EstadoPedido.NoEntregado ? 'bg-red-50 border-red-200 opacity-70' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-gray-800">{pedido.numeroTicket}</span>
                            {pedido.fechaProgramada && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                Programado: {new Date(pedido.fechaProgramada.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColorEntrega[pedido.estado] || 'bg-gray-100 text-gray-800'}`}>
                            {estadoLabels[pedido.estado]}
                          </span>
                        </div>
                        {pedido.direccionEntrega && (
                          <p className="text-sm text-gray-600 flex items-start gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{pedido.direccionEntrega}</span>
                          </p>
                        )}
                        {pedido.nombreCliente && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {pedido.nombreCliente}
                          </p>
                        )}
                        {pedido.telefonoCliente && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Tel: {pedido.telefonoCliente}
                          </p>
                        )}
                        {(pedido.estado === EstadoPedido.Cancelado || pedido.estado === EstadoPedido.NoEntregado) && pedido.motivoCancelacion && (
                          <p className="text-xs text-red-600 mt-1 italic">
                            {pedido.estado === EstadoPedido.NoEntregado ? 'Motivo no entrega' : 'Motivo cancelacion'}: {pedido.motivoCancelacion}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatHora(pedido.fechaCreacion)}
                            </span>
                            {pedido.estaPago ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Pago</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">No pago</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => verDetalle(pedido.id)}
                              className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200"
                            >
                              Ver Detalle
                            </button>
                            <span className="font-semibold text-sm text-amber-600">
                              ${pedido.total.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Boton Empezar Reparto - sticky al fondo */}
      {pedidosPendientes.length > 0 && (
        <div className="flex-shrink-0 pt-3 pb-1">
          <button
            onClick={handleEmpezarReparto}
            disabled={!puedeEmpezar}
            className={`w-full py-3 rounded-lg font-bold text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              puedeEmpezar
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500 shadow-lg shadow-green-600/30'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!todasZonasAsignadas
              ? 'Asigne repartidores a todas las zonas con pedidos pendientes'
              : `EMPEZAR REPARTO (${pedidosPendientes.length} pedido${pedidosPendientes.length !== 1 ? 's' : ''})`
            }
          </button>
        </div>
      )}

      {/* Modal de confirmacion */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !enviando && setMostrarConfirmacion(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="bg-green-600 px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Confirmar Reparto</h3>
                <p className="text-green-100 text-sm">Se enviaran {pedidosPendientes.length} pedido{pedidosPendientes.length !== 1 ? 's' : ''} a reparto</p>
              </div>
            </div>

            {/* Detalle de asignaciones */}
            <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
              {Array.from(pedidosPorZona.entries()).filter(([zonaId]) => zonasPendientesDespacho.has(zonaId)).map(([zonaId, data]) => {
                const rep = repartidores.find(r => r.id === asignaciones.get(zonaId));
                const pendientes = data.pedidos.filter(p => p.estado === EstadoPedido.Pendiente);
                const totalZona = pendientes.reduce((sum, p) => sum + p.total, 0);
                return (
                  <div key={zonaId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">{data.zona}</div>
                      <div className="text-sm text-gray-500">
                        {pendientes.length} pedido{pendientes.length !== 1 ? 's' : ''} · ${totalZona.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-indigo-600">{rep?.nombre}</div>
                      {rep?.vehiculo && <div className="text-xs text-gray-400">{rep.vehiculo}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen total */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total a despachar</span>
                <span className="font-bold text-gray-800">
                  ${pedidosPendientes.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                disabled={enviando}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReparto}
                disabled={enviando}
                className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-colors shadow-md shadow-green-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  'Confirmar Reparto'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle pedido */}
      {(pedidoDetalle || cargandoDetalle) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !cargandoDetalle && setPedidoDetalle(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {cargandoDetalle && !pedidoDetalle ? (
              <div className="flex items-center justify-center py-16">
                <svg className="animate-spin w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : pedidoDetalle && (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-white">{pedidoDetalle.numeroTicket}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColorEntrega[pedidoDetalle.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {estadoLabels[pedidoDetalle.estado]}
                      </span>
                      {pedidoDetalle.estaPago ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-400/20 text-green-300">Pago</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-400/20 text-red-300">No pago</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5">{formatHora(pedidoDetalle.fechaCreacion)}</p>
                  </div>
                  <button
                    onClick={() => setPedidoDetalle(null)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {/* Info cliente */}
                  <div className="space-y-1.5 text-sm">
                    {pedidoDetalle.nombreCliente && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cliente</span>
                        <span className="font-medium text-gray-800">{pedidoDetalle.nombreCliente}</span>
                      </div>
                    )}
                    {pedidoDetalle.telefonoCliente && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Telefono</span>
                        <span className="font-medium text-gray-800">{pedidoDetalle.telefonoCliente}</span>
                      </div>
                    )}
                    {pedidoDetalle.direccionEntrega && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Direccion</span>
                        <span className="font-medium text-gray-800 text-right max-w-[250px]">{pedidoDetalle.direccionEntrega}</span>
                      </div>
                    )}
                    {pedidoDetalle.zonaNombre && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Zona</span>
                        <span className="font-medium text-gray-800">{pedidoDetalle.zonaNombre}</span>
                      </div>
                    )}
                    {pedidoDetalle.repartidorNombre && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Repartidor</span>
                        <span className="font-medium text-gray-800">{pedidoDetalle.repartidorNombre}</span>
                      </div>
                    )}
                    {(pedidoDetalle.pagos && pedidoDetalle.pagos.length > 0) ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Forma de pago</span>
                        <span className="font-medium text-gray-800">
                          {pedidoDetalle.pagos.map(p => p.formaPagoNombre).join(', ')}
                        </span>
                      </div>
                    ) : pedidoDetalle.formaPagoNombre ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Forma de pago</span>
                        <span className="font-medium text-gray-800">{pedidoDetalle.formaPagoNombre}</span>
                      </div>
                    ) : null}
                    {pedidoDetalle.notaInterna && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nota</span>
                        <span className="font-medium text-gray-800 text-right max-w-[250px]">{pedidoDetalle.notaInterna}</span>
                      </div>
                    )}
                    {(pedidoDetalle.estado === EstadoPedido.Cancelado || pedidoDetalle.estado === EstadoPedido.NoEntregado) && pedidoDetalle.motivoCancelacion && (
                      <div className="flex justify-between">
                        <span className="text-red-500">{pedidoDetalle.estado === EstadoPedido.NoEntregado ? 'Motivo no entrega' : 'Motivo cancelacion'}</span>
                        <span className="font-medium text-red-700 text-right max-w-[250px]">{pedidoDetalle.motivoCancelacion}</span>
                      </div>
                    )}
                  </div>

                  {/* Lineas */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Productos</h4>
                    <div className="space-y-1.5">
                      {pedidoDetalle.lineas.map(l => (
                        <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800">{l.cantidad}x</span>
                            <span className="ml-1.5 text-gray-700">{l.descripcion}</span>
                            {l.notas && <p className="text-xs text-gray-400 mt-0.5">{l.notas}</p>}
                          </div>
                          <span className="text-gray-600 font-medium ml-2">${l.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagos */}
                  {pedidoDetalle.pagos && pedidoDetalle.pagos.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Pagos</h4>
                      <div className="space-y-1.5">
                        {pedidoDetalle.pagos.map(pago => (
                          <div key={pago.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                            <span className="text-gray-700">{pago.formaPagoNombre}</span>
                            <span className="font-medium text-gray-800">${pago.totalACobrar.toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comprobante de entrega */}
                {pedidoDetalle.comprobanteEntrega && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Comprobante de entrega</h4>
                    <button
                      onClick={() => setComprobanteSrc(pedidoDetalle.comprobanteEntrega!)}
                      className="relative group cursor-pointer"
                    >
                      <img
                        src={pedidoDetalle.comprobanteEntrega}
                        alt="Comprobante"
                        className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">Ver imagen</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Footer totales */}
                <div className="border-t border-amber-200 px-6 py-3 space-y-1 bg-amber-50 flex-shrink-0">
                  <div className="flex justify-between text-sm text-amber-700/70">
                    <span>Subtotal</span>
                    <span>${pedidoDetalle.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                  {pedidoDetalle.descuento > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Descuento</span>
                      <span>-${pedidoDetalle.descuento.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  {pedidoDetalle.recargo > 0 && (
                    <div className="flex justify-between text-sm text-amber-700/70">
                      <span>Recargo</span>
                      <span>+${pedidoDetalle.recargo.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-amber-200">
                    <span className="text-amber-900">Total</span>
                    <span className="text-amber-700">${pedidoDetalle.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Admin */}
      <AdminChat abierto={chatAbierto} onCerrar={() => setChatAbierto(false)} />

      {/* Lightbox comprobante */}
      {comprobanteSrc && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setComprobanteSrc(null)}>
          <button
            onClick={() => setComprobanteSrc(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
          >
            &times;
          </button>
          <img
            src={comprobanteSrc}
            alt="Comprobante de entrega"
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
