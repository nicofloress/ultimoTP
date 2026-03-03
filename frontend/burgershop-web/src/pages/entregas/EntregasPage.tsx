import { useEffect, useState } from 'react';
import { Pedido, Repartidor, estadoLabels, estadoColores } from '../../types';
import { getEntregasPendientes, getRepartidores, asignarEntrega, getEntregasRepartidor } from '../../api/entregas';

export default function EntregasPage() {
  const [pendientes, setPendientes] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<number | null>(null);
  const [entregasRepartidor, setEntregasRepartidor] = useState<Pedido[]>([]);

  const cargar = () => {
    getEntregasPendientes().then(setPendientes);
    getRepartidores().then(setRepartidores);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (repartidorSeleccionado) {
      getEntregasRepartidor(repartidorSeleccionado).then(setEntregasRepartidor);
    } else {
      setEntregasRepartidor([]);
    }
  }, [repartidorSeleccionado]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargar();
      if (repartidorSeleccionado) {
        getEntregasRepartidor(repartidorSeleccionado).then(setEntregasRepartidor);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [repartidorSeleccionado]);

  const handleAsignar = async (pedidoId: number, repartidorId: number) => {
    await asignarEntrega(pedidoId, repartidorId);
    cargar();
    if (repartidorSeleccionado) {
      getEntregasRepartidor(repartidorSeleccionado).then(setEntregasRepartidor);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Entregas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos pendientes de asignación */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Pedidos listos para asignar ({pendientes.length})</h2>
          <div className="space-y-3">
            {pendientes.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold">{p.numeroTicket}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${estadoColores[p.estado]}`}>{estadoLabels[p.estado]}</span>
                  </div>
                  <span className="font-bold text-amber-600">${p.total.toLocaleString()}</span>
                </div>
                {p.nombreCliente && <p className="text-sm">{p.nombreCliente}</p>}
                {p.direccionEntrega && <p className="text-sm text-gray-600">{p.direccionEntrega}</p>}
                {p.zonaNombre && <p className="text-sm text-gray-500">Zona: {p.zonaNombre}</p>}
                <div className="mt-3">
                  <select
                    onChange={e => { if (e.target.value) handleAsignar(p.id, Number(e.target.value)); }}
                    className="w-full border rounded px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">Asignar a repartidor...</option>
                    {repartidores.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre} - {r.vehiculo}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {pendientes.length === 0 && <p className="text-gray-400 text-center py-4">No hay pedidos pendientes de asignación</p>}
          </div>
        </div>

        {/* Panel de repartidores */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Repartidores</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            {repartidores.map(r => (
              <button
                key={r.id}
                onClick={() => setRepartidorSeleccionado(repartidorSeleccionado === r.id ? null : r.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  repartidorSeleccionado === r.id ? 'bg-amber-600 text-white' : 'bg-white shadow hover:bg-amber-50'
                }`}
              >
                {r.nombre} ({r.vehiculo})
              </button>
            ))}
          </div>

          {repartidorSeleccionado && (
            <div>
              <h3 className="font-medium mb-2">Entregas de hoy</h3>
              <div className="space-y-2">
                {entregasRepartidor.map(p => (
                  <div key={p.id} className="bg-white rounded-lg shadow p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{p.numeroTicket}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${estadoColores[p.estado]}`}>{estadoLabels[p.estado]}</span>
                    </div>
                    {p.direccionEntrega && <p className="text-xs text-gray-600 mt-1">{p.direccionEntrega}</p>}
                    <p className="text-xs text-gray-400 mt-1">${p.total.toLocaleString()}</p>
                  </div>
                ))}
                {entregasRepartidor.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">Sin entregas hoy</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
