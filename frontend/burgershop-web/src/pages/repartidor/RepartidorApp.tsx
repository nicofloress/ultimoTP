import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Pedido, Mensaje, EstadoPedido } from '../../types';
import { marcarEnCamino, marcarEntregado, marcarNoEntregado } from '../../api/entregas';
import { getMensajesRepartidor, enviarMensajeRepartidor, marcarLeidos, getNoLeidos } from '../../api/mensajes';
import { useAuth } from '../../context/AuthContext';
import { useGlobalToast } from '../../components/Toast';
import { useNotifications } from '../../hooks/useNotifications';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';
import { useGeoTracking } from '../../hooks/useGeoTracking';
import { desactivarTracking } from '../../api/tracking';
import { GoogleMap } from '../../components/GoogleMap';

export default function RepartidorApp() {
  return <RepartidorAppContent />;
}

type Tab = 'pendientes' | 'completados' | 'noEntregados';

function RepartidorAppContent() {
  const { usuario, logout } = useAuth();
  const repartidorId = usuario?.repartidorId ?? null;
  const { entregas, pendingCount, refresh, lastRefresh, isRefreshing } = useNotifications(repartidorId);
  const { showToast } = useGlobalToast();
  const { gpsStatus, lastPosition } = useGeoTracking(!!repartidorId);

  const [activeTab, setActiveTab] = useState<Tab>('pendientes');
  const [modalPedido, setModalPedido] = useState<Pedido | null>(null);
  const [notasEntrega, setNotasEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | null>(null);
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const abrirGoogleMapsRuta = () => {
    const conDireccion = pendientes.filter(p => p.direccionEntrega);
    if (conDireccion.length === 0) return;

    const direcciones = conDireccion.map(p => encodeURIComponent(p.direccionEntrega!));

    if (lastPosition) {
      // Con GPS: origin = ubicacion actual, destination = ultima, waypoints = las demas
      const origin = `${lastPosition.lat},${lastPosition.lng}`;
      const destination = direcciones[direcciones.length - 1];
      const waypoints = direcciones.slice(0, -1).join('|');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      // Sin GPS: origin = primera direccion, destination = ultima, waypoints = intermedias
      const origin = direcciones[0];
      const destination = direcciones[direcciones.length - 1];
      const waypoints = direcciones.slice(1, -1).join('|');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
      window.open(url, '_blank');
    }
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
      .filter(e => e.estado === EstadoPedido.Asignado || e.estado === EstadoPedido.EnCamino)
      .sort((a, b) => {
        // EnCamino primero, luego Asignado
        if (a.estado === EstadoPedido.EnCamino && b.estado !== EstadoPedido.EnCamino) return -1;
        if (b.estado === EstadoPedido.EnCamino && a.estado !== EstadoPedido.EnCamino) return 1;
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      });
  }, [entregas]);

  const completados = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return entregas
      .filter(e => e.estado === EstadoPedido.Entregado && e.fechaEntrega && e.fechaEntrega.slice(0, 10) === hoy)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [entregas]);

  const noEntregados = useMemo(() => {
    return entregas
      .filter(e => e.estado === EstadoPedido.NoEntregado)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [entregas]);

  // Estado para modal de cancelacion
  const [cancelarPedido, setCancelarPedido] = useState<Pedido | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Estado para lightbox comprobante
  const [comprobanteSrc, setComprobanteSrc] = useState<string | null>(null);

  const handleCancelar = async () => {
    if (!cancelarPedido || !motivoCancelacion.trim()) return;
    setCancelLoading(true);
    try {
      await marcarNoEntregado(cancelarPedido.id, motivoCancelacion.trim());
      showToast(`Pedido ${cancelarPedido.numeroTicket} marcado como no entregado`, 'success');
      setCancelarPedido(null);
      setMotivoCancelacion('');
      await refresh();
    } catch {
      showToast('Error al cancelar entrega', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleEnCamino = async (pedido: Pedido) => {
    setActionLoading(pedido.id);
    try {
      await marcarEnCamino(pedido.id);
      showToast(`Entrega ${pedido.numeroTicket} en camino`, 'success');
      await refresh();
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

    // Si eligio transferencia y no subio comprobante, no permitir
    if (metodoPago === 'transferencia' && !comprobanteBase64) {
      showToast('Subi la imagen del comprobante', 'error');
      return;
    }

    setActionLoading(modalPedido.id);
    try {
      const data: { notas?: string; formaPagoId?: number; comprobanteBase64?: string } = {
        notas: notasEntrega || undefined,
      };

      if (!modalPedido.estaPago && metodoPago) {
        data.formaPagoId = metodoPago === 'efectivo' ? 1 : 2;
        if (metodoPago === 'transferencia' && comprobanteBase64) {
          data.comprobanteBase64 = comprobanteBase64;
        }
      }

      await marcarEntregado(modalPedido.id, data);
      showToast(`Entrega ${modalPedido.numeroTicket} completada`, 'success');
      setModalPedido(null);
      setNotasEntrega('');
      setMetodoPago(null);
      setComprobanteBase64(null);
      await refresh();
    } catch {
      showToast('Error al marcar entregado', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!repartidorId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm text-center">
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
        <div className="bg-slate-800 text-gray-300" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-white tracking-tight truncate">Gestion HLP</h1>
                <p className="text-slate-400 text-sm truncate">{usuario?.nombreCompleto}</p>
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
            {/* Boton optimizar ruta */}
            {pendientes.filter(p => p.direccionEntrega).length >= 2 && (
              <button
                onClick={abrirGoogleMapsRuta}
                className="w-full mb-3 bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Abrir ruta en Google Maps
              </button>
            )}
            <PendientesTab
              pedidos={pendientes}
              actionLoading={actionLoading}
              onEnCamino={handleEnCamino}
              onEntregado={(p) => { setModalPedido(p); setNotasEntrega(''); setMetodoPago(null); setComprobanteBase64(null); }}
              onCancelar={(p) => { setCancelarPedido(p); setMotivoCancelacion(''); }}
              formatTime={formatTime}
            />
          </>
        )}

        {activeTab === 'completados' && (
          <CompletadosTab
            pedidos={completados}
            formatTime={formatTime}
            onVerComprobante={setComprobanteSrc}
          />
        )}

        {activeTab === 'noEntregados' && (
          <NoEntregadosTab
            pedidos={noEntregados}
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
          onConfirm={handleEntregado}
          onCancel={() => { setModalPedido(null); setNotasEntrega(''); setMetodoPago(null); setComprobanteBase64(null); }}
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
// Pendientes Tab
// ============================
function PendientesTab({
  pedidos,
  actionLoading,
  onEnCamino,
  onEntregado,
  onCancelar,
  formatTime,
}: {
  pedidos: Pedido[];
  actionLoading: number | null;
  onEnCamino: (p: Pedido) => void;
  onEntregado: (p: Pedido) => void;
  onCancelar: (p: Pedido) => void;
  formatTime: (s: string) => string;
}) {
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
    <div className="space-y-3">
      {pedidos.map(p => (
        <PedidoCard
          key={p.id}
          pedido={p}
          actionLoading={actionLoading}
          onEnCamino={onEnCamino}
          onEntregado={onEntregado}
          onCancelar={onCancelar}
          formatTime={formatTime}
        />
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
  formatTime,
}: {
  pedido: Pedido;
  actionLoading: number | null;
  onEnCamino: (p: Pedido) => void;
  onEntregado: (p: Pedido) => void;
  onCancelar: (p: Pedido) => void;
  formatTime: (s: string) => string;
}) {
  const isAsignado = pedido.estado === EstadoPedido.Asignado;
  const isEnCamino = pedido.estado === EstadoPedido.EnCamino;
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

        {/* Direccion */}
        {pedido.direccionEntrega && (
          <p className="text-sm text-gray-600 mb-1">
            {'\uD83D\uDCCD'} {pedido.direccionEntrega}
          </p>
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

        {/* Total */}
        <p className="font-bold text-amber-700 text-lg mb-3">${pedido.total.toLocaleString('es-AR')}</p>

        {/* Acciones */}
        {isAsignado && (
          <button
            onClick={() => onEnCamino(pedido)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
}: {
  pedidos: Pedido[];
  formatTime: (s: string) => string;
  onVerComprobante: (src: string) => void;
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
}: {
  pedidos: Pedido[];
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
  onConfirm,
  onCancel,
  loading,
  formatTime,
}: {
  pedido: Pedido;
  notas: string;
  onNotasChange: (v: string) => void;
  metodoPago: 'efectivo' | 'transferencia' | null;
  onMetodoPagoChange: (v: 'efectivo' | 'transferencia' | null) => void;
  comprobanteBase64: string | null;
  onComprobanteChange: (v: string | null) => void;
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <span className="text-green-600 font-semibold text-sm">{'\u2705'} Pedido ya pagado</span>
              {pedido.formaPagoNombre && (
                <span className="text-green-500 text-xs">({pedido.formaPagoNombre})</span>
              )}
            </div>
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
              </div>

              {/* Subir comprobante si es transferencia */}
              {metodoPago === 'transferencia' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comprobante de transferencia
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
              disabled={loading || (necesitaPago && !metodoPago) || (metodoPago === 'transferencia' && !comprobanteBase64)}
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
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
