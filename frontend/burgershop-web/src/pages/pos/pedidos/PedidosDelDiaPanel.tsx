import { Venta, EstadoVenta, estadoLabels, estadoColores } from '../../../types';

interface Props {
  pedidos: Venta[];
  pedidosFiltrados: Venta[];
  filtroEstado: EstadoVenta | null;
  setFiltroEstado: (v: EstadoVenta | null) => void;
  busquedaTicket: string;
  setBusquedaTicket: (v: string) => void;
  estadosFiltro: EstadoVenta[];
  editandoPedidoId: number | undefined;
  siguienteEstado: (e: EstadoVenta) => EstadoVenta | null;
  onCargarPedido: (p: Venta) => void;
  onCambiarEstado: (id: number, estado: EstadoVenta) => void;
  onAsignarRepartidor: (p: Venta) => void;
  onCancelar: (p: Venta) => void;
}

export default function PedidosDelDiaPanel({
  pedidos, pedidosFiltrados,
  filtroEstado, setFiltroEstado,
  busquedaTicket, setBusquedaTicket,
  estadosFiltro,
  editandoPedidoId,
  siguienteEstado,
  onCargarPedido, onCambiarEstado, onAsignarRepartidor, onCancelar,
}: Props) {
  return (
    <div className="w-full bg-white rounded-lg shadow-2xl border-2 border-slate-300 flex flex-col min-h-0 flex-1">
      <div className="px-3 py-2 border-b-2 border-amber-500 flex-shrink-0 bg-gradient-to-b from-slate-500 to-slate-700 rounded-t-lg shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-sm font-bold text-white">Pedidos del dia ({pedidos.length})</h2>
          <span className="text-xs text-slate-300 font-medium">
            {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex gap-1 mb-1.5 items-center overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setFiltroEstado(null)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              !filtroEstado ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
            }`}
          >
            Todos
          </button>
          {estadosFiltro.map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(filtroEstado === est ? null : est)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                filtroEstado === est ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
              }`}
            >
              {estadoLabels[est]}
            </button>
          ))}
        </div>

        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busquedaTicket}
            onChange={e => setBusquedaTicket(e.target.value)}
            placeholder="Buscar ticket..."
            className="w-full border border-slate-500 bg-slate-600 text-white placeholder-slate-400 rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
        {pedidosFiltrados.length === 0 && (
          <p className="text-gray-400 text-center py-8 text-sm">No hay pedidos</p>
        )}
        {pedidosFiltrados.map(p => (
          <div
            key={p.id}
            onClick={() => onCargarPedido(p)}
            className={`bg-white rounded-lg border p-2.5 cursor-pointer hover:border-amber-400 transition-all ${
              editandoPedidoId === p.id ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/30' : 'border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-800">{p.numeroTicket}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${estadoColores[p.estado]}`}>
                  {estadoLabels[p.estado]}
                </span>
                {p.fechaProgramada && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                    Programado: {new Date(p.fechaProgramada.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400">{new Date(p.fechaCreacion.endsWith('Z') ? p.fechaCreacion : p.fechaCreacion + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              {p.direccionEntrega && (
                <span className="truncate flex-1" title={p.direccionEntrega}>
                  <svg className="w-3 h-3 inline-block mr-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {p.direccionEntrega}
                </span>
              )}
              {p.zonaNombre && (
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                  {p.zonaNombre}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-600 text-sm">${p.total.toLocaleString()}</span>
                {p.estaPago ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Pago</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">No pago</span>
                )}
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                {siguienteEstado(p.estado) && p.estado !== EstadoVenta.Cancelado && p.estado !== EstadoVenta.Entregado && p.estado !== EstadoVenta.NoEntregado && (
                  <button
                    onClick={() => onCambiarEstado(p.id, siguienteEstado(p.estado)!)}
                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors font-medium"
                  >
                    {estadoLabels[siguienteEstado(p.estado)!]}
                  </button>
                )}
                {p.estado === EstadoVenta.Listo && (
                  <button
                    onClick={() => onAsignarRepartidor(p)}
                    className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-100 transition-colors font-medium"
                  >
                    Repartidor
                  </button>
                )}
                {p.estado !== EstadoVenta.Cancelado && p.estado !== EstadoVenta.Entregado && p.estado !== EstadoVenta.NoEntregado && (
                  <button
                    onClick={() => onCancelar(p)}
                    className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors font-medium"
                    aria-label="Cancelar pedido"
                  >
                    X
                  </button>
                )}
              </div>
            </div>

            {p.repartidorNombre && (
              <div className="text-[10px] text-purple-600 mt-0.5 font-medium">
                Repartidor: {p.repartidorNombre}
              </div>
            )}
            {(p.estado === EstadoVenta.Cancelado || p.estado === EstadoVenta.NoEntregado) && p.motivoCancelacion && (
              <div className="text-[10px] text-red-600 mt-0.5 italic">
                Motivo: {p.motivoCancelacion}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
