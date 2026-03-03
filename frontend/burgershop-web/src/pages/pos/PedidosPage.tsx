import { useEffect, useState } from 'react';
import { Pedido, EstadoPedido, estadoLabels, estadoColores } from '../../types';
import { getPedidos, cambiarEstado, cancelarPedido } from '../../api/pedidos';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | null>(null);
  const [detalle, setDetalle] = useState<Pedido | null>(null);

  const cargar = () => {
    const params: { estado?: number } = {};
    if (filtroEstado) params.estado = filtroEstado;
    getPedidos(undefined, params.estado).then(setPedidos);
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);
  }, [filtroEstado]);

  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoPedido) => {
    await cambiarEstado(id, nuevoEstado);
    cargar();
    if (detalle?.id === id) setDetalle(null);
  };

  const handleCancelar = async (id: number) => {
    if (confirm('¿Cancelar este pedido?')) {
      await cancelarPedido(id);
      cargar();
      if (detalle?.id === id) setDetalle(null);
    }
  };

  const siguienteEstado = (estado: EstadoPedido): EstadoPedido | null => {
    switch (estado) {
      case EstadoPedido.Pendiente: return EstadoPedido.EnPreparacion;
      case EstadoPedido.EnPreparacion: return EstadoPedido.Listo;
      case EstadoPedido.Listo: return EstadoPedido.Entregado;
      default: return null;
    }
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Pedidos del día</h1>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFiltroEstado(null)} className={`px-3 py-1 rounded text-sm ${!filtroEstado ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>Todos</button>
          {Object.entries(estadoLabels).map(([key, label]) => (
            <button key={key} onClick={() => setFiltroEstado(Number(key))} className={`px-3 py-1 rounded text-sm ${filtroEstado === Number(key) ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>{label}</button>
          ))}
        </div>
        <div className="space-y-3">
          {pedidos.map(p => (
            <div key={p.id} onClick={() => setDetalle(p)} className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:ring-2 hover:ring-amber-400 transition ${detalle?.id === p.id ? 'ring-2 ring-amber-500' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold">{p.numeroTicket}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${estadoColores[p.estado]}`}>{estadoLabels[p.estado]}</span>
                  <span className="ml-2 text-xs text-gray-500">{p.tipo === 1 ? 'Para Llevar' : 'Domicilio'}</span>
                </div>
                <span className="font-bold text-amber-600">${p.total.toLocaleString()}</span>
              </div>
              {p.nombreCliente && <p className="text-sm text-gray-600 mt-1">{p.nombreCliente}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(p.fechaCreacion).toLocaleTimeString()}</p>
            </div>
          ))}
          {pedidos.length === 0 && <p className="text-gray-400 text-center py-8">No hay pedidos</p>}
        </div>
      </div>

      {/* Panel de detalle */}
      {detalle && (
        <div className="w-96 bg-white rounded-lg shadow p-4 h-fit sticky top-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{detalle.numeroTicket}</h2>
              <span className={`px-2 py-0.5 rounded text-xs ${estadoColores[detalle.estado]}`}>{estadoLabels[detalle.estado]}</span>
            </div>
            <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>

          {detalle.nombreCliente && <p className="text-sm"><strong>Cliente:</strong> {detalle.nombreCliente}</p>}
          {detalle.telefonoCliente && <p className="text-sm"><strong>Teléfono:</strong> {detalle.telefonoCliente}</p>}
          {detalle.direccionEntrega && <p className="text-sm"><strong>Dirección:</strong> {detalle.direccionEntrega}</p>}
          {detalle.zonaNombre && <p className="text-sm"><strong>Zona:</strong> {detalle.zonaNombre}</p>}
          {detalle.repartidorNombre && <p className="text-sm"><strong>Repartidor:</strong> {detalle.repartidorNombre}</p>}

          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Items</h3>
            {detalle.lineas.map(l => (
              <div key={l.id} className="flex justify-between text-sm py-1">
                <span>{l.cantidad}x {l.descripcion}</span>
                <span>${l.subtotal.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>${detalle.subtotal.toLocaleString()}</span></div>
              {detalle.descuento > 0 && <div className="flex justify-between text-sm text-red-600"><span>Descuento</span><span>-${detalle.descuento.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-lg mt-1"><span>Total</span><span className="text-amber-600">${detalle.total.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {siguienteEstado(detalle.estado) && detalle.estado !== EstadoPedido.Cancelado && detalle.estado !== EstadoPedido.Entregado && (
              <button onClick={() => handleCambiarEstado(detalle.id, siguienteEstado(detalle.estado)!)} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Pasar a: {estadoLabels[siguienteEstado(detalle.estado)!]}
              </button>
            )}
            {detalle.estado !== EstadoPedido.Cancelado && detalle.estado !== EstadoPedido.Entregado && (
              <button onClick={() => handleCancelar(detalle.id)} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Cancelar Pedido</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
