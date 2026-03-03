import { useEffect, useState } from 'react';
import { Zona, Repartidor } from '../../types';
import { getZonas, createZona, updateZona, deleteZona, getRepartidores, createRepartidor, updateRepartidor, deleteRepartidor, asignarZonas } from '../../api/entregas';

export default function ConfigPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [tab, setTab] = useState<'zonas' | 'repartidores'>('zonas');

  // Zona form
  const [zonaForm, setZonaForm] = useState({ nombre: '', descripcion: '', costoEnvio: 0 });
  const [editandoZona, setEditandoZona] = useState<Zona | null>(null);

  // Repartidor form
  const [repForm, setRepForm] = useState({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' });
  const [editandoRep, setEditandoRep] = useState<Repartidor | null>(null);
  const [zonasAsignar, setZonasAsignar] = useState<number[]>([]);

  const cargar = () => { getZonas().then(setZonas); getRepartidores().then(setRepartidores); };
  useEffect(() => { cargar(); }, []);

  // Zonas handlers
  const handleZonaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoZona) {
      await updateZona(editandoZona.id, { ...zonaForm, activa: editandoZona.activa });
    } else {
      await createZona(zonaForm);
    }
    setZonaForm({ nombre: '', descripcion: '', costoEnvio: 0 }); setEditandoZona(null); cargar();
  };

  // Repartidor handlers
  const handleRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoRep) {
      await updateRepartidor(editandoRep.id, { ...repForm, activo: editandoRep.activo, codigoAcceso: repForm.codigoAcceso || undefined });
    } else {
      await createRepartidor(repForm);
    }
    setRepForm({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' }); setEditandoRep(null); cargar();
  };

  const handleAsignarZonas = async (repId: number) => {
    await asignarZonas(repId, zonasAsignar);
    setZonasAsignar([]); cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('zonas')} className={`px-4 py-2 rounded font-medium ${tab === 'zonas' ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}>Zonas</button>
        <button onClick={() => setTab('repartidores')} className={`px-4 py-2 rounded font-medium ${tab === 'repartidores' ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}>Repartidores</button>
      </div>

      {tab === 'zonas' && (
        <div>
          <form onSubmit={handleZonaSubmit} className="flex gap-2 mb-6">
            <input type="text" value={zonaForm.nombre} onChange={e => setZonaForm({ ...zonaForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={zonaForm.descripcion} onChange={e => setZonaForm({ ...zonaForm, descripcion: e.target.value })} placeholder="Descripción" className="border rounded px-3 py-2 flex-1" />
            <input type="number" value={zonaForm.costoEnvio} onChange={e => setZonaForm({ ...zonaForm, costoEnvio: Number(e.target.value) })} placeholder="Costo envío" className="border rounded px-3 py-2 w-32" min={0} step={100} />
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editandoZona ? 'Actualizar' : 'Crear'}</button>
          </form>
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripción</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Costo Envío</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {zonas.map(z => (
                  <tr key={z.id}>
                    <td className="px-4 py-3 text-sm font-medium">{z.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{z.descripcion}</td>
                    <td className="px-4 py-3 text-sm">${z.costoEnvio.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => { setEditandoZona(z); setZonaForm({ nombre: z.nombre, descripcion: z.descripcion || '', costoEnvio: z.costoEnvio }); }} className="text-blue-600 hover:underline mr-3">Editar</button>
                      <button onClick={async () => { if (confirm('¿Desactivar?')) { await deleteZona(z.id); cargar(); } }} className="text-red-600 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'repartidores' && (
        <div>
          <form onSubmit={handleRepSubmit} className="flex gap-2 mb-6 flex-wrap">
            <input type="text" value={repForm.nombre} onChange={e => setRepForm({ ...repForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={repForm.telefono} onChange={e => setRepForm({ ...repForm, telefono: e.target.value })} placeholder="Teléfono" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.vehiculo} onChange={e => setRepForm({ ...repForm, vehiculo: e.target.value })} placeholder="Vehículo" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.codigoAcceso} onChange={e => setRepForm({ ...repForm, codigoAcceso: e.target.value })} placeholder="Código acceso" className="border rounded px-3 py-2 w-32" required={!editandoRep} />
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editandoRep ? 'Actualizar' : 'Crear'}</button>
          </form>
          <div className="space-y-4">
            {repartidores.map(r => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{r.nombre}</h3>
                    <p className="text-sm text-gray-600">{r.vehiculo} | {r.telefono}</p>
                    <p className="text-xs text-gray-400 mt-1">Zonas: {r.zonas.map(z => z.nombre).join(', ') || 'Sin asignar'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditandoRep(r); setRepForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '', codigoAcceso: '' }); }} className="text-sm text-blue-600 hover:underline">Editar</button>
                    <button onClick={async () => { if (confirm('¿Desactivar?')) { await deleteRepartidor(r.id); cargar(); } }} className="text-sm text-red-600 hover:underline">Desactivar</button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  <div className="flex gap-1 flex-wrap flex-1">
                    {zonas.filter(z => z.activa).map(z => (
                      <label key={z.id} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                        <input type="checkbox" checked={zonasAsignar.includes(z.id) || r.zonas.some(rz => rz.id === z.id)} onChange={e => {
                          const ids = r.zonas.map(rz => rz.id);
                          if (e.target.checked) setZonasAsignar([...new Set([...ids, z.id])]);
                          else setZonasAsignar(ids.filter(id => id !== z.id));
                        }} />
                        {z.nombre}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => handleAsignarZonas(r.id)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">Guardar Zonas</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
