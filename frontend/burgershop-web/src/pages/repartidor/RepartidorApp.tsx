import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
import { Venta, Mensaje, EstadoVenta } from '../../types';
import { marcarEnCamino, marcarEntregado, marcarNoEntregado, reabrirEntrega } from '../../api/entregas';
import { getMensajesRepartidor, enviarMensajeRepartidor, marcarLeidos, getNoLeidos } from '../../api/mensajes';
import { useAuth } from '../../context/AuthContext';
import { useGlobalToast } from '../../components/Toast';
import { useNotifications } from '../../hooks/useNotifications';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';
import { useGeoTracking } from '../../hooks/useGeoTracking';
import { desactivarTracking } from '../../api/tracking';
import { getLocal } from '../../api/locales';
import { GoogleMap } from '../../components/GoogleMap';
import { parseFechaUtc } from '../../utils/fechas';

type Tab = 'pendientes' | 'completados' | 'noEntregados';

export default function RepartidorApp() {
  const { usuario, logout } = useAuth();
  const repartidorId = usuario?.repartidorId ?? null;
  const puedeVerWhatsapp = usuario?.nombreUsuario === 'pedro';
  const { entregas, pendingCount, refresh, lastRefresh, isRefreshing } = useNotifications(repartidorId);
  const { showToast } = useGlobalToast();
  const [hayNuevaVersion, setHayNuevaVersion] = useState(false);

  useEffect(() => {
    // Solo chequear version en produccion (evita loops en dev local)
    if (import.meta.env.DEV) return;

    let actualizando = false;
    const autoActualizar = async () => {
      if (actualizando) return;
      actualizando = true;
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch { /* ignore */ }
      window.location.href = window.location.pathname + '?_v=' + Date.now();
    };
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          setHayNuevaVersion(true);
          // Auto-actualizar en background sin intervención del usuario
          autoActualizar();
        }
      } catch { /* ignore */ }
    };
    checkVersion();
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh al volver del background (cuando el repartidor vuelve de Maps/WhatsApp)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [refresh]);

  const { gpsStatus, lastPosition } = useGeoTracking(!!repartidorId);

  const [activeTab, setActiveTab] = useState<Tab>('pendientes');
  const [modalPedido, setModalPedido] = useState<Venta | null>(null);
  const [notasEntrega, setNotasEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'pendiente' | 'dividido' | null>(null);
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(null);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [optimizando, setOptimizando] = useState(false);
  const [rutaOptimizada, setRutaOptimizada] = useState<{ orden: Venta[]; duracion: string; distancia: string; directions: google.maps.DirectionsResult } | null>(null);
  const [ordenManual, setOrdenManual] = useState<Venta[] | null>(null);
  const [direccionLocal, setDireccionLocal] = useState<string | null>(null);
  const optimizacionIniciada = useRef(false);
  const [whatsappPedido, setWhatsappPedido] = useState<Venta | null>(null);

  const abrirWhatsApp = (pedido: Venta) => {
    if (!pedido.telefonoCliente) return;
    const tel = pedido.telefonoCliente.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hola, somos Hamburguesas La Plata. Tu pedido #${pedido.numeroTicket} está en camino y será entregado en breve. ¡Gracias por elegirnos!`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  };

  // Cargar dirección del local del repartidor para usar como punto de partida
  useEffect(() => {
    const localId = usuario?.localId;
    if (!localId) { setDireccionLocal(null); return; }
    getLocal(localId)
      .then(l => {
        setDireccionLocal(l.direccion ?? null);
        // Re-optimizar ruta ahora que tenemos el origen correcto
        optimizacionIniciada.current = false;
      })
      .catch(() => setDireccionLocal(null));
  }, [usuario?.localId]);

  const moverPedido = (fromIdx: number, toIdx: number) => {
    const lista = ordenManual || rutaOptimizada?.orden || pendientes;
    const copia = [...lista];
    const [item] = copia.splice(fromIdx, 1);
    copia.splice(toIdx, 0, item);
    setOrdenManual(copia);
  };

  const optimizarRuta = async () => {
    const conDireccion = pendientes.filter(p => p.direccionEntrega);
    if (conDireccion.length < 2 || !window.google?.maps) return;

    setOptimizando(true);
    try {
      const directionsService = new google.maps.DirectionsService();

      // Origen: GPS > dirección del local asignado > primer pedido
      let origin: google.maps.LatLng | string;
      let pedidosParaRuta: Venta[];
      if (lastPosition) {
        origin = new google.maps.LatLng(lastPosition.lat, lastPosition.lng);
        pedidosParaRuta = conDireccion;
      } else if (direccionLocal) {
        origin = direccionLocal;
        pedidosParaRuta = conDireccion;
      } else {
        origin = conDireccion[0].direccionEntrega!;
        pedidosParaRuta = conDireccion.slice(1);
      }

      const destination = conDireccion[conDireccion.length - 1].direccionEntrega!;

      const waypoints = pedidosParaRuta.slice(0, -1).map(p => ({
        location: p.direccionEntrega!,
        stopover: true,
      }));

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res, status) => {
            if (status === 'OK' && res) resolve(res);
            else reject(new Error(`Directions failed: ${status}`));
          }
        );
      });

      // Reordenar pedidos según waypoint_order
      const waypointOrder = result.routes[0].waypoint_order;
      const reordenados: Venta[] = [];
      // Si origin no es un pedido (GPS o local), no se agrega. Si lo es (primer pedido), sí.
      if (!lastPosition && !direccionLocal) reordenados.push(conDireccion[0]);
      for (const idx of waypointOrder) {
        reordenados.push(pedidosParaRuta[idx]);
      }
      reordenados.push(pedidosParaRuta[pedidosParaRuta.length - 1]); // destination

      // Calcular totales
      const legs = result.routes[0].legs;
      const totalDuracion = legs.reduce((sum, l) => sum + (l.duration?.value || 0), 0);
      const totalDistancia = legs.reduce((sum, l) => sum + (l.distance?.value || 0), 0);
      const minutos = Math.round(totalDuracion / 60);
      const km = (totalDistancia / 1000).toFixed(1);

      setRutaOptimizada({
        orden: reordenados,
        duracion: minutos < 60 ? `${minutos} min` : `${Math.floor(minutos/60)}h ${minutos%60}min`,
        distancia: `${km} km`,
        directions: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error optimizando ruta:', msg, err);
      showToast('No se pudo optimizar la ruta, reintentá en unos segundos', 'error');
    } finally {
      setOptimizando(false);
    }
  };

  const handleReoptimizar = () => {
    setOrdenManual(null);
    setRutaOptimizada(null);
    optimizacionIniciada.current = false;
    optimizarRuta();
  };

  /**
   * Abre Google Maps con navegación a UNA dirección específica.
   * Se usa en cada tarjeta de pedido (paso a paso).
   *
   * La ruta ya fue optimizada por Google Directions API (soporta hasta 25 waypoints),
   * así que el orden de los pedidos en la lista ya es el óptimo.
   * El repartidor navega de a uno: toca "Navegar", entrega, vuelve a la app, toca el siguiente.
   */
  const navegarAPedido = async (pedido: Venta) => {
    // Si está Asignado, marcarlo como EnCamino antes de navegar
    if (pedido.estado === EstadoVenta.Asignado) {
      setActionLoading(pedido.id);
      try {
        await marcarEnCamino(pedido.id);
        await refresh();
        if (puedeVerWhatsapp && pedido.telefonoCliente) {
          setWhatsappPedido(pedido);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al iniciar entrega';
        showToast(msg, 'error');
        setActionLoading(null);
        return;
      }
      setActionLoading(null);
    }
    if (!pedido.direccionEntrega) {
      showToast('El pedido no tiene dirección de entrega', 'error');
      return;
    }
    const destino = encodeURIComponent(pedido.direccionEntrega);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
    window.open(url, '_blank');
    // Refrescar datos al volver de Maps (el visibilitychange ya lo hace,
    // pero también refrescamos inmediatamente para actualizar la UI)
    refresh();
  };

  // Polling mensajes no leidos
  useEffect(() => {
    if (!repartidorId) return;
    const checkNoLeidos = async () => {
      try {
        const count = await getNoLeidos(repartidorId, false);
        setMensajesNoLeidos(count);
      } catch (err) {
        console.error('Error checking no leidos:', err);
      }
    };
    checkNoLeidos();
    const interval = setInterval(checkNoLeidos, 5000);
    return () => clearInterval(interval);
  }, [repartidorId, chatAbierto]);

  const pendientes = useMemo(() => {
    return entregas
      .filter(e => e.estado === EstadoVenta.Asignado || e.estado === EstadoVenta.EnCamino)
      .sort((a, b) => {
        // EnCamino primero, luego Asignado
        if (a.estado === EstadoVenta.EnCamino && b.estado !== EstadoVenta.EnCamino) return -1;
        if (b.estado === EstadoVenta.EnCamino && a.estado !== EstadoVenta.EnCamino) return 1;
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      });
  }, [entregas]);

  // Auto-optimizar ruta cuando hay pedidos pendientes con dirección
  useEffect(() => {
    const conDireccion = pendientes.filter(p => p.direccionEntrega);
    if (conDireccion.length >= 2 && !optimizando && !optimizacionIniciada.current && window.google?.maps) {
      optimizacionIniciada.current = true;
      optimizarRuta();
    }
    if (conDireccion.length < 2) {
      optimizacionIniciada.current = false;
      setRutaOptimizada(null);
    }
  }, [pendientes, direccionLocal]);

  // Detectar cambios en los IDs de pendientes y resetear ruta/orden manual
  const pendientesIdsRef = useRef<string>('');
  useEffect(() => {
    const idsActuales = pendientes.map(p => p.id).sort().join(',');
    if (pendientesIdsRef.current && pendientesIdsRef.current !== idsActuales) {
      // Cambió la lista de pendientes (se reabrió o marcó como no entregado)
      setRutaOptimizada(null);
      setOrdenManual(null);
      optimizacionIniciada.current = false;
    }
    pendientesIdsRef.current = idsActuales;
  }, [pendientes]);

  const completados = useMemo(() => {
    const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    return entregas
      .filter(e => e.estado === EstadoVenta.Entregado && e.fechaEntrega && e.fechaEntrega.slice(0, 10) === hoy)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [entregas]);

  const noEntregados = useMemo(() => {
    return entregas
      .filter(e => e.estado === EstadoVenta.NoEntregado)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [entregas]);

  // Estado para modal de cancelacion
  const [cancelarPedido, setCancelarPedido] = useState<Venta | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Estado para lightbox comprobante
  const [comprobanteSrc, setComprobanteSrc] = useState<string | null>(null);


  const handleReabrir = async (ventaId: number) => {
    setActionLoading(ventaId);
    try {
      await reabrirEntrega(ventaId);
      showToast('Pedido reabierto, pasa a En Camino', 'success');
      setRutaOptimizada(null);
      setOrdenManual(null);
      optimizacionIniciada.current = false;
      await refresh();
    } catch {
      showToast('Error al reabrir pedido', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelar = async () => {
    if (!cancelarPedido || !motivoCancelacion.trim()) return;
    setCancelLoading(true);
    try {
      await marcarNoEntregado(cancelarPedido.id, motivoCancelacion.trim());
      showToast(`Pedido ${cancelarPedido.numeroTicket} marcado como no entregado`, 'success');
      setCancelarPedido(null);
      setMotivoCancelacion('');
      setRutaOptimizada(null);
      setOrdenManual(null);
      optimizacionIniciada.current = false;
      await refresh();
    } catch {
      showToast('Error al cancelar entrega', 'error');
    } finally {
      setCancelLoading(false);
    }
  };


  const handleEnCamino = async (pedido: Venta) => {
    setActionLoading(pedido.id);
    try {
      await marcarEnCamino(pedido.id);
      showToast(`Entrega ${pedido.numeroTicket} en camino`, 'success');
      setRutaOptimizada(null);
      setOrdenManual(null);
      optimizacionIniciada.current = false;
      await refresh();
      if (puedeVerWhatsapp && pedido.telefonoCliente) {
        setWhatsappPedido(pedido);
      }
    } catch {
      showToast('Error al iniciar entrega', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEntregado = async () => {
    if (!modalPedido) return;

    // Si no esta pago y no eligio metodo de pago, no permitir
    if (!modalPedido.estaPago && !metodoPago) {
      showToast('Selecciona un metodo de pago', 'error');
      return;
    }

    setActionLoading(modalPedido.id);
    try {
      const data: { notas?: string; formaPagoId?: number; comprobanteBase64?: string; pagos?: { formaPagoId: number; monto: number }[] } = {
        notas: notasEntrega || undefined,
      };

      if (!modalPedido.estaPago && metodoPago && metodoPago !== 'pendiente') {
        if (metodoPago === 'dividido') {
          const efNum = parseFloat(montoEfectivo) || 0;
          const trNum = parseFloat(montoTransferencia) || 0;
          if (efNum <= 0 && trNum <= 0) {
            showToast('Ingresa los montos del pago dividido', 'error');
            setActionLoading(null);
            return;
          }
          const pagos: { formaPagoId: number; monto: number }[] = [];
          if (efNum > 0) pagos.push({ formaPagoId: 1, monto: efNum });
          if (trNum > 0) pagos.push({ formaPagoId: 2, monto: trNum });
          data.pagos = pagos;
        } else {
          data.formaPagoId = metodoPago === 'efectivo' ? 1 : 2;
        }
        if ((metodoPago === 'transferencia' || metodoPago === 'dividido') && comprobanteBase64) {
          data.comprobanteBase64 = comprobanteBase64;
        }
      }
      // Si es "pendiente", no se envía formaPagoId → EstaPago queda false en el backend

      await marcarEntregado(modalPedido.id, data);
      showToast(`Entrega ${modalPedido.numeroTicket} completada`, 'success');
      setModalPedido(null);
      setNotasEntrega('');
      setMetodoPago(null);
      setComprobanteBase64(null);
      // Limpiar ruta/orden para que se recalcule con los datos nuevos
      setRutaOptimizada(null);
      setOrdenManual(null);
      optimizacionIniciada.current = false;
      await refresh();
    } catch {
      showToast('Error al marcar entregado', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  if (!repartidorId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">Este usuario no tiene un repartidor asociado.</p>
          <button onClick={logout} className="bg-slate-800 text-white px-6 py-2 rounded font-medium hover:bg-slate-700 transition-colors">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header sticky - estilo panel admin */}
      <header className="sticky top-0 z-40">
        {/* Barra superior slate */}
        <div className="bg-gradient-to-b from-slate-500 to-slate-800 text-gray-300" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-white tracking-tight truncate">Gestion HLP</h1>
                  <span className="text-[10px] text-slate-500">v{APP_VERSION}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 text-sm truncate">{usuario?.nombreCompleto}</p>
                  {hayNuevaVersion && (
                    <span className="text-[10px] text-amber-400 font-medium animate-pulse">
                      Actualizando...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* GPS indicator */}
                {gpsStatus === 'active' && (
                  <span className="relative flex h-3 w-3" title="GPS activo">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
                {gpsStatus === 'denied' && (
                  <span className="text-red-400 text-xs font-medium" title="GPS denegado">GPS off</span>
                )}
                {gpsStatus === 'error' && (
                  <span className="text-amber-400 text-xs font-medium" title="Error GPS">GPS err</span>
                )}
                {/* Badge pendientes */}
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
                {/* Refresh button */}
                <button
                  onClick={refresh}
                  disabled={isRefreshing}
                  className={`text-gray-400 hover:text-white hover:bg-slate-700 p-2 rounded transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                  title="Actualizar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {/* Logout */}
                <button
                  onClick={() => { desactivarTracking().catch(() => {}); logout(); }}
                  className="text-gray-400 hover:text-white hover:bg-slate-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>

            {/* Last refresh indicator */}
            {lastRefresh && (
              <p className="text-slate-500 text-xs mt-1">
                Actualizado: {formatTime(lastRefresh.toISOString())}
                {isRefreshing && ' - Actualizando...'}
              </p>
            )}
          </div>
        </div>

        {/* Tabs - estilo topbar blanco */}
        <div className="bg-white shadow-md">
          <div className="max-w-2xl mx-auto flex">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'pendientes'
                  ? 'border-amber-500 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Mis Repartos {pendingCount > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('completados')}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'completados'
                  ? 'border-green-500 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Entregados ({completados.length})
            </button>
            <button
              onClick={() => setActiveTab('noEntregados')}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'noEntregados'
                  ? 'border-red-500 text-gray-800'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              No Entregados ({noEntregados.length})
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'pendientes' && (
          <>
            {/* Ruta optimizada: botón navegar al siguiente + resumen de ruta */}
            {optimizando && (
              <div className="mb-3 bg-slate-600 text-amber-400 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Optimizando reparto...
              </div>
            )}
            {!optimizando && !rutaOptimizada && pendientes.filter(p => p.direccionEntrega).length >= 2 && (
              <button
                onClick={handleReoptimizar}
                className="mb-3 w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Optimizar ruta
              </button>
            )}
            {!optimizando && rutaOptimizada && (() => {
              // Buscar el siguiente pedido pendiente (no entregado) en el orden optimizado
              const listaOrdenada = ordenManual || rutaOptimizada.orden;
              const siguiente = listaOrdenada.find(p =>
                p.direccionEntrega && (p.estado === EstadoVenta.Asignado || p.estado === EstadoVenta.EnCamino)
              );

              return (
                <div className="mb-3 space-y-2">
                  {/* Botón grande: Navegar al siguiente */}
                  {siguiente && (
                    <button
                      onClick={() => navegarAPedido(siguiente)}
                      disabled={actionLoading === siguiente.id}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-base"
                    >
                      <span>{'\uD83E\uDDED'} Navegar al siguiente</span>
                      <span className="text-blue-200 text-xs font-normal truncate max-w-[90%] sm:max-w-[200px]">
                        ({siguiente.direccionEntrega})
                      </span>
                    </button>
                  )}

                  {/* Botón: Reoptimizar ruta */}
                  <button
                    onClick={handleReoptimizar}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reoptimizar ruta
                  </button>

                  {/* Resumen de ruta optimizada */}
                  <details className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2 flex items-center justify-between cursor-pointer select-none">
                      <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Ver ruta optimizada
                      </div>
                      <span className="text-emerald-600 text-xs font-semibold">{rutaOptimizada.distancia} · {rutaOptimizada.duracion}</span>
                    </summary>
                    <div className="px-4 pb-3 border-t border-emerald-200">
                      {/* Mapa con la ruta dibujada */}
                      <RutaMap directions={rutaOptimizada.directions} />
                      <ol className="mt-2 space-y-1">
                        {listaOrdenada.filter(p => p.direccionEntrega).map((p, i) => {
                          const entregado = p.estado === EstadoVenta.Entregado || p.estado === EstadoVenta.NoEntregado;
                          const esSiguiente = siguiente && p.id === siguiente.id;
                          return (
                            <li key={p.id} className={`flex items-center gap-2 text-xs py-1 ${entregado ? 'line-through text-gray-400' : esSiguiente ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${entregado ? 'bg-gray-200 text-gray-400' : esSiguiente ? 'bg-blue-600 text-white' : 'bg-emerald-200 text-emerald-700'}`}>
                                {entregado ? '\u2713' : i + 1}
                              </span>
                              <span className="truncate">{p.direccionEntrega}</span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </details>
                </div>
              );
            })()}
            <PendientesTab
              pedidos={ordenManual || (rutaOptimizada ? rutaOptimizada.orden : pendientes)}
              onMover={moverPedido}
              actionLoading={actionLoading}
              onEnCamino={handleEnCamino}
              onEntregado={(p) => { setModalPedido(p); setNotasEntrega(''); setMetodoPago(null); setComprobanteBase64(null); setMontoEfectivo(''); setMontoTransferencia(''); }}
              onCancelar={(p) => { setCancelarPedido(p); setMotivoCancelacion(''); }}
              onNavegar={(p) => navegarAPedido(p)}
              formatTime={formatTime}
            />
          </>
        )}

        {activeTab === 'completados' && (
          <CompletadosTab
            pedidos={completados}
            formatTime={formatTime}
            onVerComprobante={setComprobanteSrc}
            onReabrir={handleReabrir}
            actionLoading={actionLoading}
          />
        )}

        {activeTab === 'noEntregados' && (
          <NoEntregadosTab
            pedidos={noEntregados}
            onReabrir={handleReabrir}
            actionLoading={actionLoading}
          />
        )}

      </main>

      {/* Modal de confirmacion de entrega */}
      {modalPedido && (
        <EntregaModal
          pedido={modalPedido}
          notas={notasEntrega}
          onNotasChange={setNotasEntrega}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          comprobanteBase64={comprobanteBase64}
          onComprobanteChange={setComprobanteBase64}
          montoEfectivo={montoEfectivo}
          onMontoEfectivoChange={setMontoEfectivo}
          montoTransferencia={montoTransferencia}
          onMontoTransferenciaChange={setMontoTransferencia}
          onConfirm={handleEntregado}
          onCancel={() => { setModalPedido(null); setNotasEntrega(''); setMetodoPago(null); setComprobanteBase64(null); setMontoEfectivo(''); setMontoTransferencia(''); }}
          loading={actionLoading === modalPedido.id}
          formatTime={formatTime}
        />
      )}

      {/* Modal de cancelacion */}
      {cancelarPedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => !cancelLoading && setCancelarPedido(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 px-5 py-4 sm:rounded-t-xl rounded-t-xl">
              <h3 className="text-white font-bold text-lg">No Entregado</h3>
              <p className="text-red-100 text-sm">#{cancelarPedido.numeroTicket} - {cancelarPedido.nombreCliente}</p>
            </div>
            <div className="px-5 py-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de no entrega *</label>
              <textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Ingresa el motivo de no entrega..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
                autoFocus
              />
              {motivoCancelacion.trim() === '' && (
                <p className="text-xs text-red-500 mt-1">El motivo es obligatorio</p>
              )}
            </div>
            <div className="px-5 py-3 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setCancelarPedido(null); setMotivoCancelacion(''); }}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelLoading || !motivoCancelacion.trim()}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirmar No Entregado'
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal avisar por WhatsApp */}
      {whatsappPedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="text-center text-lg font-semibold text-gray-800">
              {'\uD83D\uDCF2'} ¿Avisar al cliente por WhatsApp?
            </p>
            <p className="text-center text-sm text-gray-500">
              Se abrirá WhatsApp con un mensaje listo para enviar a <span className="font-medium text-gray-700">{whatsappPedido.nombreCliente || whatsappPedido.telefonoCliente}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setWhatsappPedido(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                No
              </button>
              <button
                onClick={() => { abrirWhatsApp(whatsappPedido); setWhatsappPedido(null); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {'\uD83D\uDCAC'} Sí, avisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox comprobante */}
      {comprobanteSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setComprobanteSrc(null)}>
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

      {/* Boton flotante de chat */}
      {!chatAbierto && (
        <button
          onClick={() => setChatAbierto(true)}
          className="fixed bottom-6 right-6 bg-slate-700 hover:bg-slate-800 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all z-40 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {mensajesNoLeidos}
            </span>
          )}
        </button>
      )}

      {/* Panel de chat */}
      {chatAbierto && repartidorId && (
        <RepartidorChatPanel
          repartidorId={repartidorId}
          onCerrar={() => setChatAbierto(false)}
          onLeidosChange={() => setMensajesNoLeidos(0)}
        />
      )}
    </div>
  );
}

// ============================
// Mapa de ruta optimizada
// ============================

/**
 * Renderiza un mapa con la ruta optimizada dibujada.
 * Usa DirectionsRenderer de Google Maps para mostrar la polyline con marcadores numerados.
 */
function RutaMap({ directions }: { directions: google.maps.DirectionsResult }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const fullscreenInstanceRef = useRef<google.maps.Map | null>(null);
  const fullscreenRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const fullscreenMarkersRef = useRef<google.maps.Marker[]>([]);
  const [expandido, setExpandido] = useState(false);

  const renderDirections = useCallback((
    container: HTMLDivElement,
    mapInstance: React.MutableRefObject<google.maps.Map | null>,
    rendererInstance: React.MutableRefObject<google.maps.DirectionsRenderer | null>,
    markersInstance: React.MutableRefObject<google.maps.Marker[]>
  ) => {
    if (!window.google?.maps) return;

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(container, {
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });
    }

    if (rendererInstance.current) rendererInstance.current.setMap(null);
    markersInstance.current.forEach(m => m.setMap(null));
    markersInstance.current = [];

    rendererInstance.current = new google.maps.DirectionsRenderer({
      map: mapInstance.current,
      directions,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    const route = directions.routes[0];
    if (!route) return;
    const legs = route.legs;
    const puntos: google.maps.LatLng[] = [];
    if (legs.length > 0) {
      puntos.push(legs[0].start_location);
      legs.forEach(l => puntos.push(l.end_location));
    }

    puntos.forEach((pos, idx) => {
      const marker = new google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        label: { text: String(idx + 1), color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      markersInstance.current.push(marker);
    });
  }, [directions]);

  useEffect(() => {
    if (!mapRef.current) return;
    renderDirections(mapRef.current, mapInstanceRef, rendererRef, markersRef);
  }, [renderDirections]);

  useEffect(() => {
    if (!expandido || !fullscreenMapRef.current) return;
    // Resetear refs cuando se abre el modal para que se cree de nuevo
    fullscreenInstanceRef.current = null;
    renderDirections(fullscreenMapRef.current, fullscreenInstanceRef, fullscreenRendererRef, fullscreenMarkersRef);
  }, [expandido, renderDirections]);

  return (
    <>
      <div className="relative mt-2">
        <div ref={mapRef} className="w-full rounded-lg" style={{ height: '250px' }} />
        <button
          type="button"
          onClick={() => setExpandido(true)}
          className="absolute top-2 right-2 bg-white/95 hover:bg-white shadow-md rounded-lg p-2 transition-colors z-10"
          title="Expandir mapa"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
      {expandido && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-2">
          <div className="relative w-full h-full max-w-5xl">
            <div ref={fullscreenMapRef} className="w-full h-full rounded-lg" />
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="absolute top-3 right-3 bg-white/95 hover:bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-1.5 text-sm font-medium text-gray-800 transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================
// Pendientes Tab
// ============================
function PendientesTab({
  pedidos,
  actionLoading,
  onEnCamino,
  onEntregado,
  onCancelar,
  onMover,
  onNavegar,
  formatTime,
}: {
  pedidos: Venta[];
  actionLoading: number | null;
  onEnCamino: (p: Venta) => void;
  onEntregado: (p: Venta) => void;
  onCancelar: (p: Venta) => void;
  onMover?: (fromIdx: number, toIdx: number) => void;
  onNavegar: (p: Venta) => void;
  formatTime: (s: string) => string;
}) {
  const hayEnCamino = pedidos.some(p => p.estado === EstadoVenta.EnCamino);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const touchStartY = useRef(0);
  const touchItemIdx = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx && onMover) onMover(dragIdx, idx);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // Touch drag support - solo desde el grip handle
  const handleGripTouchStart = (e: React.TouchEvent, idx: number) => {
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
    touchItemIdx.current = idx;
    setDragIdx(idx);
  };
  const handleGripTouchMove = useCallback((e: TouchEvent) => {
    if (touchItemIdx.current === null || !listRef.current) return;
    e.preventDefault(); // Evitar scroll mientras arrastra
    const y = e.touches[0].clientY;
    const cards = listRef.current.querySelectorAll<HTMLElement>('[data-drag-idx]');
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        setOverIdx(i);
        break;
      }
    }
  }, []);
  const handleGripTouchEnd = useCallback(() => {
    if (touchItemIdx.current !== null && overIdx !== null && touchItemIdx.current !== overIdx && onMover) {
      onMover(touchItemIdx.current, overIdx);
    }
    touchItemIdx.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }, [overIdx, onMover]);

  // Registrar listeners globales de touch (necesario para preventDefault)
  useEffect(() => {
    document.addEventListener('touchmove', handleGripTouchMove, { passive: false });
    document.addEventListener('touchend', handleGripTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleGripTouchMove);
      document.removeEventListener('touchend', handleGripTouchEnd);
    };
  }, [handleGripTouchMove, handleGripTouchEnd]);

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">{'\uD83D\uDE0E'}</p>
        <p className="text-gray-500 text-lg font-medium">No tenes entregas pendientes</p>
        <p className="text-gray-400 text-sm mt-1">Relajate, te notificamos cuando llegue un reparto</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={listRef}>
      {pedidos.map((p, idx) => (
        <div
          key={p.id}
          data-drag-idx={idx}
          draggable={!!onMover && pedidos.length > 1}
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={handleDragEnd}
          className={`flex gap-2 items-stretch transition-all ${dragIdx === idx ? 'opacity-50 scale-95' : ''} ${overIdx === idx && dragIdx !== idx ? 'border-t-2 border-amber-500' : ''}`}
        >
          {onMover && pedidos.length > 1 && (
            <div
              className="flex flex-col justify-center items-center flex-shrink-0 cursor-grab active:cursor-grabbing select-none px-1"
              onTouchStart={(e) => handleGripTouchStart(e, idx)}
              title="Arrastra para ordenar"
            >
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
              </svg>
              <span className="text-[10px] text-gray-400 font-bold">{idx + 1}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <PedidoCard
              pedido={p}
              actionLoading={actionLoading}
              onEnCamino={onEnCamino}
              onEntregado={onEntregado}
              onCancelar={onCancelar}
              onNavegar={onNavegar}
              hayEnCamino={hayEnCamino}
              formatTime={formatTime}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================
// Pedido Card
// ============================
function PedidoCard({
  pedido,
  actionLoading,
  onEnCamino,
  onEntregado,
  onCancelar,
  onNavegar,
  hayEnCamino,
  formatTime,
}: {
  pedido: Venta;
  actionLoading: number | null;
  onEnCamino: (p: Venta) => void;
  onEntregado: (p: Venta) => void;
  onCancelar: (p: Venta) => void;
  onNavegar: (p: Venta) => void;
  hayEnCamino: boolean;
  formatTime: (s: string) => string;
}) {
  const isAsignado = pedido.estado === EstadoVenta.Asignado;
  const isEnCamino = pedido.estado === EstadoVenta.EnCamino;
  const loading = actionLoading === pedido.id;

  const borderColor = isAsignado ? 'border-l-amber-400' : 'border-l-blue-400';
  const bgColor = isAsignado ? 'bg-amber-50' : 'bg-blue-50';
  const estadoLabel = isAsignado ? 'Asignado' : 'En Camino';
  const estadoBadge = isAsignado
    ? 'bg-amber-100 text-amber-800 border border-amber-300'
    : 'bg-blue-100 text-blue-800 border border-blue-300';

  return (
    <div className={`${bgColor} rounded-xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
      <div className="p-4">
        {/* Header de la card */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-bold text-gray-900 text-lg">#{pedido.numeroTicket}</span>
            <span className="text-gray-400 text-xs ml-2">{formatTime(pedido.fechaCreacion)}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${estadoBadge}`}>
            {isEnCamino ? '\uD83D\uDEF5' : '\uD83D\uDCE6'} {estadoLabel}
          </span>
        </div>

        {/* Cliente */}
        {pedido.nombreCliente && (
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {'\uD83D\uDC64'} {pedido.nombreCliente}
          </p>
        )}

        {/* Direccion + botón Navegar */}
        {pedido.direccionEntrega && (
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm text-gray-600">
              {'\uD83D\uDCCD'} {pedido.direccionEntrega}
            </p>
            <button
              onClick={() => onNavegar(pedido)}
              disabled={actionLoading === pedido.id}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {'\uD83E\uDDED'} Navegar
            </button>
          </div>
        )}

        {/* Zona */}
        {pedido.zonaNombre && (
          <p className="text-xs text-gray-500 mb-2">
            Zona: {pedido.zonaNombre}
          </p>
        )}

        {/* Mapa */}
        {pedido.direccionEntrega && (
          <DireccionMap direccion={pedido.direccionEntrega} />
        )}

        {/* Items */}
        <div className="bg-white/60 rounded-lg p-2.5 mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Productos</p>
          {pedido.lineas.map(l => (
            <div key={l.id} className="flex justify-between text-sm text-gray-700">
              <span>{l.cantidad}x {l.descripcion}</span>
            </div>
          ))}
        </div>

        {/* Total + Badge Cta Cte */}
        <div className="flex items-center gap-2 mb-3">
          <p className="font-bold text-amber-700 text-lg">${pedido.total.toLocaleString('es-AR')}</p>
          {pedido.estaPago && pedido.notaInterna?.includes('[CTA CTE]') && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
              Cuenta Corriente
            </span>
          )}
          {pedido.estaPago && !pedido.notaInterna?.includes('[CTA CTE]') && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
              Pagado
            </span>
          )}
        </div>

        {/* Acciones */}
        {isAsignado && (
          <button
            onClick={() => onEnCamino(pedido)}
            disabled={loading || hayEnCamino}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {'\uD83D\uDEF5'} Iniciar Entrega
              </>
            )}
          </button>
        )}

        {isEnCamino && (
          <div className="flex gap-2">
            <button
              onClick={() => onEntregado(pedido)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {'\u2705'} Marcar Entregado
                </>
              )}
            </button>
            <button
              onClick={() => onCancelar(pedido)}
              disabled={loading}
              className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 py-2.5 px-4 rounded-lg font-semibold transition-colors text-sm"
            >
              No Entregado
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ============================
// Completados Tab
// ============================
function CompletadosTab({
  pedidos,
  formatTime,
  onVerComprobante,
  onReabrir,
  actionLoading,
}: {
  pedidos: Venta[];
  formatTime: (s: string) => string;
  onVerComprobante: (src: string) => void;
  onReabrir: (id: number) => void;
  actionLoading: number | null;
}) {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">{'\uD83D\uDCE6'}</p>
        <p className="text-gray-500 text-lg font-medium">No hay entregas completadas hoy</p>
      </div>
    );
  }

  return (
    <div>
      {/* Resumen */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
        <p className="text-3xl font-bold text-green-700">{pedidos.length}</p>
        <p className="text-sm text-green-600 font-medium">entregas completadas hoy</p>
      </div>

      <div className="space-y-2">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-3">
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-800">#{p.numeroTicket}</span>
                {p.nombreCliente && (
                  <span className="text-gray-500 text-sm ml-2">{p.nombreCliente}</span>
                )}
              </div>
              <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
                {'\u2705'} Entregado
              </span>
            </div>
            {p.direccionEntrega && (
              <p className="text-xs text-gray-500">{'\uD83D\uDCCD'} {p.direccionEntrega}</p>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-amber-700">${p.total.toLocaleString('es-AR')}</span>
              {p.fechaEntrega && (
                <span className="text-xs text-gray-400">Entregado: {formatTime(p.fechaEntrega)}</span>
              )}
            </div>
            {p.notasEntrega && (
              <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1">
                {'\uD83D\uDCDD'} {p.notasEntrega}
              </p>
            )}
            {p.comprobanteEntrega && (
              <button
                onClick={() => onVerComprobante(p.comprobanteEntrega!)}
                className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ver comprobante
              </button>
            )}
            <button
              onClick={() => onReabrir(p.id)}
              disabled={actionLoading === p.id}
              className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 px-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {'\u21A9'} {actionLoading === p.id ? 'Reabriendo...' : 'Reabrir pedido'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// No Entregados Tab
// ============================
function NoEntregadosTab({
  pedidos,
  onReabrir,
  actionLoading,
}: {
  pedidos: Venta[];
  onReabrir: (id: number) => void;
  actionLoading: number | null;
}) {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">{'\u2705'}</p>
        <p className="text-gray-500 text-lg font-medium">No hay pedidos sin entregar</p>
        <p className="text-gray-400 text-sm mt-1">Todos los pedidos fueron entregados correctamente</p>
      </div>
    );
  }

  return (
    <div>
      {/* Resumen */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
        <p className="text-3xl font-bold text-red-700">{pedidos.length}</p>
        <p className="text-sm text-red-600 font-medium">pedidos no entregados</p>
      </div>

      <div className="space-y-2">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-red-200 p-3">
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-800">#{p.numeroTicket}</span>
                {p.nombreCliente && (
                  <span className="text-gray-500 text-sm ml-2">{p.nombreCliente}</span>
                )}
              </div>
              <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
                {'\u274C'} No Entregado
              </span>
            </div>
            {p.direccionEntrega && (
              <p className="text-xs text-gray-500">{'\uD83D\uDCCD'} {p.direccionEntrega}</p>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-amber-700">${p.total.toLocaleString('es-AR')}</span>
            </div>
            {p.motivoCancelacion && (
              <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1 italic">
                Motivo: {p.motivoCancelacion}
              </p>
            )}
            <button
              onClick={() => onReabrir(p.id)}
              disabled={actionLoading === p.id}
              className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 px-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {'\u21A9'} {actionLoading === p.id ? 'Reabriendo...' : 'Reabrir para reintentar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// Modal de Entrega
// ============================
function EntregaModal({
  pedido,
  notas,
  onNotasChange,
  metodoPago,
  onMetodoPagoChange,
  comprobanteBase64,
  onComprobanteChange,
  montoEfectivo,
  onMontoEfectivoChange,
  montoTransferencia,
  onMontoTransferenciaChange,
  onConfirm,
  onCancel,
  loading,
  formatTime,
}: {
  pedido: Venta;
  notas: string;
  onNotasChange: (v: string) => void;
  metodoPago: 'efectivo' | 'transferencia' | 'pendiente' | 'dividido' | null;
  onMetodoPagoChange: (v: 'efectivo' | 'transferencia' | 'pendiente' | 'dividido' | null) => void;
  comprobanteBase64: string | null;
  onComprobanteChange: (v: string | null) => void;
  montoEfectivo: string;
  onMontoEfectivoChange: (v: string) => void;
  montoTransferencia: string;
  onMontoTransferenciaChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  formatTime: (s: string) => string;
}) {
  const necesitaPago = !pedido.estaPago;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede pesar mas de 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onComprobanteChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900">{'\u2705'} Confirmar Entrega</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {/* Info del pedido */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-800">#{pedido.numeroTicket}</span>
              <span className="text-sm text-gray-500">{formatTime(pedido.fechaCreacion)}</span>
            </div>
            {pedido.nombreCliente && (
              <p className="text-sm text-gray-600">{'\uD83D\uDC64'} {pedido.nombreCliente}</p>
            )}
            {pedido.direccionEntrega && (
              <p className="text-sm text-gray-600">{'\uD83D\uDCCD'} {pedido.direccionEntrega}</p>
            )}
            <p className="font-bold text-amber-700 mt-1">${pedido.total.toLocaleString('es-AR')}</p>
          </div>

          {/* Estado de pago */}
          {pedido.estaPago ? (
            pedido.notaInterna?.includes('[CTA CTE]') ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <span className="text-purple-700 font-semibold text-sm">{'\uD83D\uDCB3'} Pagado por Cuenta Corriente</span>
                <span className="text-purple-500 text-xs">No cobrar al cliente</span>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <span className="text-green-600 font-semibold text-sm">{'\u2705'} Pedido ya pagado</span>
                {pedido.formaPagoNombre && (
                  <span className="text-green-500 text-xs">({pedido.formaPagoNombre})</span>
                )}
              </div>
            )
          ) : (
            <div className="mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-amber-800 font-semibold text-sm">{'\u26A0\uFE0F'} Pedido NO pagado - Cobrar ${pedido.total.toLocaleString('es-AR')}</p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metodo de pago
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { onMetodoPagoChange('efectivo'); onComprobanteChange(null); }}
                  className={`py-3 rounded-lg font-semibold text-sm border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === 'efectivo'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{'\uD83D\uDCB5'}</span>
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => onMetodoPagoChange('transferencia')}
                  className={`py-3 rounded-lg font-semibold text-sm border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === 'transferencia'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{'\uD83D\uDCF1'}</span>
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => onMetodoPagoChange('dividido')}
                  className={`py-3 rounded-lg font-semibold text-sm border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === 'dividido'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{'\uD83D\uDCB3'}</span>
                  Dividido
                </button>
                <button
                  type="button"
                  onClick={() => { onMetodoPagoChange('pendiente'); onComprobanteChange(null); }}
                  className={`py-3 rounded-lg font-semibold text-sm border-2 transition-all flex flex-col items-center gap-1 ${
                    metodoPago === 'pendiente'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{'\u23F3'}</span>
                  Pago Pendiente
                </button>
              </div>

              {/* Montos pago dividido */}
              {metodoPago === 'dividido' && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Efectivo</label>
                      <input
                        type="number"
                        value={montoEfectivo}
                        onChange={e => {
                          onMontoEfectivoChange(e.target.value);
                          const ef = parseFloat(e.target.value) || 0;
                          const resto = Math.max(0, pedido.total - ef);
                          onMontoTransferenciaChange(resto > 0 ? resto.toString() : '');
                        }}
                        placeholder="$0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400"
                        min={0}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transferencia</label>
                      <input
                        type="number"
                        value={montoTransferencia}
                        onChange={e => onMontoTransferenciaChange(e.target.value)}
                        placeholder="$0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400"
                        min={0}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    Total: ${((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0)).toLocaleString('es-AR')}
                    {' / '}${pedido.total.toLocaleString('es-AR')}
                  </p>
                </div>
              )}

              {/* Subir comprobante si es transferencia o dividido */}
              {(metodoPago === 'transferencia' || metodoPago === 'dividido') && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comprobante de transferencia <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  {!comprobanteBase64 ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                      <span className="text-3xl mb-1">{'\uD83D\uDCF7'}</span>
                      <span className="text-sm text-blue-600 font-medium">Toca para subir imagen</span>
                      <span className="text-xs text-blue-400">JPG, PNG (max 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={comprobanteBase64}
                        alt="Comprobante"
                        className="w-full h-40 object-cover rounded-lg border border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => onComprobanteChange(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas de entrega (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => onNotasChange(e.target.value)}
            placeholder="Ej: Recibido por portero, dejo en recepcion..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            rows={2}
          />

          {/* Acciones */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || (necesitaPago && !metodoPago) || (metodoPago === 'dividido' && (parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) <= 0)}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {'\u2705'} Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// Mapa de direccion
// ============================
function DireccionMap({ direccion }: { direccion: string }) {
  const { coordenadas, geocodificarDireccion } = useGooglePlaces();
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (mostrar) {
      geocodificarDireccion(direccion);
    }
  }, [mostrar, direccion, geocodificarDireccion]);

  if (!mostrar) {
    return (
      <button
        onClick={() => setMostrar(true)}
        className="w-full bg-white/80 hover:bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-blue-600 font-medium flex items-center justify-center gap-2 mb-3 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Ver en mapa
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 relative">
      {coordenadas ? (
        <GoogleMap coordenadas={coordenadas} className="h-40" />
      ) : (
        <div className="h-40 bg-gray-100 flex items-center justify-center">
          <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      <button
        onClick={() => setMostrar(false)}
        className="absolute top-2 right-2 bg-white/90 text-gray-500 hover:text-gray-700 rounded-full w-6 h-6 flex items-center justify-center shadow text-xs font-bold"
      >
        &times;
      </button>
    </div>
  );
}

// ============================
// Chat Panel del Repartidor
// ============================
function RepartidorChatPanel({
  repartidorId,
  onCerrar,
  onLeidosChange,
}: {
  repartidorId: number;
  onCerrar: () => void;
  onLeidosChange: () => void;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cargarMensajes = useCallback(async () => {
    try {
      const msgs = await getMensajesRepartidor(repartidorId);
      setMensajes(msgs);
      await marcarLeidos(repartidorId, false);
      onLeidosChange();
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }, [repartidorId, onLeidosChange]);

  useEffect(() => {
    cargarMensajes();
    const interval = setInterval(cargarMensajes, 5000);
    return () => clearInterval(interval);
  }, [cargarMensajes]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await enviarMensajeRepartidor(texto.trim());
      setTexto('');
      await cargarMensajes();
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatHora = (fecha: string) => {
    return parseFechaUtc(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-md" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={onCerrar}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="font-bold text-sm">Chat con Admin</h3>
            <p className="text-slate-400 text-xs">Gestion HLP</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No hay mensajes aun. Escribe al admin.</p>
        ) : (
          mensajes.map(m => (
            <div
              key={m.id}
              className={`flex ${m.esDeAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                  m.esDeAdmin
                    ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    : 'bg-slate-700 text-white rounded-br-md'
                }`}
              >
                {m.esDeAdmin && (
                  <p className="text-[10px] font-semibold text-amber-600 mb-0.5">Admin</p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                  m.esDeAdmin ? 'text-gray-400' : 'text-slate-400 justify-end'
                }`}>
                  {formatHora(m.fechaEnvio)}
                  {!m.esDeAdmin && (
                    <span>{m.leido ? '\u2713\u2713' : '\u2713'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
            disabled={enviando}
          />
          <button
            onClick={handleEnviar}
            disabled={!texto.trim() || enviando}
            className="bg-slate-700 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
