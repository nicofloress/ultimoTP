import { useState, useEffect, useCallback } from 'react';
import { Pedido, estadoLabels, estadoColores, EstadoPedido } from '../../types';
import { getEntregasRepartidor, marcarEnCamino, marcarEntregado } from '../../api/entregas';
import { useAuth } from '../../context/AuthContext';

export default function RepartidorApp() {
  const { usuario, logout } = useAuth();
  const repartidorId = usuario?.repartidorId ?? null;
  const [entregas, setEntregas] = useState<Pedido[]>([]);
  const [notasEntrega, setNotasEntrega] = useState('');
  const [pedidoNotas, setPedidoNotas] = useState<number | null>(null);

  const cargarEntregas = useCallback(() => {
    if (repartidorId) {
      getEntregasRepartidor(repartidorId).then(setEntregas);
    }
  }, [repartidorId]);

  useEffect(() => { cargarEntregas(); }, [cargarEntregas]);

  useEffect(() => {
    if (!repartidorId) return;
    const interval = setInterval(cargarEntregas, 30000);
    return () => clearInterval(interval);
  }, [repartidorId, cargarEntregas]);

  const handleEnCamino = async (pedidoId: number) => {
    await marcarEnCamino(pedidoId);
    cargarEntregas();
  };

  const handleEntregado = async (pedidoId: number) => {
    await marcarEntregado(pedidoId, notasEntrega);
    setNotasEntrega('');
    setPedidoNotas(null);
    cargarEntregas();
  };

  if (!repartidorId) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-6">Este usuario no tiene un repartidor asociado.</p>
          <button onClick={logout} className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  const pendientes = entregas.filter(e => e.estado === EstadoPedido.Asignado || e.estado === EstadoPedido.EnCamino);
  const completados = entregas.filter(e => e.estado === EstadoPedido.Entregado);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
        <div>
          <div className="font-bold">Gestion HLP</div>
          <div className="text-sm text-amber-100">Hola, {usuario?.nombreCompleto}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarEntregas} className="bg-amber-700 px-3 py-1 rounded text-sm">Actualizar</button>
          <button onClick={logout} className="bg-amber-800 px-3 py-1 rounded text-sm">Salir</button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <h2 className="font-bold text-lg mb-3">Entregas pendientes ({pendientes.length})</h2>
        <div className="space-y-3 mb-6">
          {pendientes.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold">{p.numeroTicket}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${estadoColores[p.estado]}`}>{estadoLabels[p.estado]}</span>
              </div>
              {p.nombreCliente && <p className="text-sm font-medium">{p.nombreCliente}</p>}
              {p.direccionEntrega && <p className="text-sm text-gray-600">{p.direccionEntrega}</p>}
              {p.zonaNombre && <p className="text-xs text-gray-500">Zona: {p.zonaNombre}</p>}
              <div className="text-sm mt-2">
                {p.lineas.map(l => <div key={l.id} className="text-gray-600">{l.cantidad}x {l.descripcion}</div>)}
              </div>
              <p className="font-bold text-amber-600 mt-2">${p.total.toLocaleString()}</p>

              <div className="mt-3 space-y-2">
                {p.estado === EstadoPedido.Asignado && (
                  <button onClick={() => handleEnCamino(p.id)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">En Camino</button>
                )}
                {p.estado === EstadoPedido.EnCamino && (
                  <>
                    {pedidoNotas === p.id ? (
                      <div className="space-y-2">
                        <textarea value={notasEntrega} onChange={e => setNotasEntrega(e.target.value)} placeholder="Notas de entrega (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
                        <button onClick={() => handleEntregado(p.id)} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium">Confirmar Entrega</button>
                      </div>
                    ) : (
                      <button onClick={() => setPedidoNotas(p.id)} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium">Marcar Entregado</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {pendientes.length === 0 && <p className="text-gray-400 text-center py-6">No tenes entregas pendientes</p>}
        </div>

        {completados.length > 0 && (
          <>
            <h2 className="font-bold text-lg mb-3 text-gray-500">Completados hoy ({completados.length})</h2>
            <div className="space-y-2">
              {completados.map(p => (
                <div key={p.id} className="bg-gray-100 rounded-lg p-3 opacity-70">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{p.numeroTicket}</span>
                    <span className="text-sm text-gray-500">${p.total.toLocaleString()}</span>
                  </div>
                  {p.direccionEntrega && <p className="text-xs text-gray-500">{p.direccionEntrega}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
