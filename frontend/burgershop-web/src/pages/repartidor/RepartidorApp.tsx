import { useState, useEffect, useCallback } from 'react';
import { Pedido, estadoLabels, estadoColores, EstadoPedido } from '../../types';
import { loginRepartidor, getEntregasRepartidor, marcarEnCamino, marcarEntregado } from '../../api/entregas';

export default function RepartidorApp() {
  const [repartidorId, setRepartidorId] = useState<number | null>(() => {
    const saved = localStorage.getItem('repartidorId');
    return saved ? Number(saved) : null;
  });
  const [repartidorNombre, setRepartidorNombre] = useState(() => localStorage.getItem('repartidorNombre') || '');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [entregas, setEntregas] = useState<Pedido[]>([]);
  const [notasEntrega, setNotasEntrega] = useState('');
  const [pedidoNotas, setPedidoNotas] = useState<number | null>(null);

  const cargarEntregas = useCallback(() => {
    if (repartidorId) {
      getEntregasRepartidor(repartidorId).then(setEntregas);
    }
  }, [repartidorId]);

  useEffect(() => { cargarEntregas(); }, [cargarEntregas]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!repartidorId) return;
    const interval = setInterval(cargarEntregas, 30000);
    return () => clearInterval(interval);
  }, [repartidorId, cargarEntregas]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await loginRepartidor(codigo);
      setRepartidorId(result.id);
      setRepartidorNombre(result.nombre);
      localStorage.setItem('repartidorId', String(result.id));
      localStorage.setItem('repartidorNombre', result.nombre);
      setCodigo('');
    } catch {
      setError('Código de acceso inválido');
    }
  };

  const handleLogout = () => {
    setRepartidorId(null);
    setRepartidorNombre('');
    setEntregas([]);
    localStorage.removeItem('repartidorId');
    localStorage.removeItem('repartidorNombre');
  };

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
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-2">BurgerShop</h1>
          <p className="text-gray-500 text-center mb-6">Ingresá tu código de repartidor</p>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Código de acceso"
              className="w-full border-2 rounded-lg px-4 py-3 text-center text-2xl tracking-widest mb-4"
              maxLength={10}
              required
            />
            {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
            <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-amber-700">Ingresar</button>
          </form>
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
          <div className="font-bold">BurgerShop</div>
          <div className="text-sm text-amber-100">Hola, {repartidorNombre}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarEntregas} className="bg-amber-700 px-3 py-1 rounded text-sm">Actualizar</button>
          <button onClick={handleLogout} className="bg-amber-800 px-3 py-1 rounded text-sm">Salir</button>
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
          {pendientes.length === 0 && <p className="text-gray-400 text-center py-6">No tenés entregas pendientes</p>}
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
