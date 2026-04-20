import { useEffect, useState } from 'react';
import { Zona, Repartidor } from '../../../types';
import { getZonas } from '../../../api/zonas';
import { getRepartidores, crearRepartidor, actualizarRepartidor, asignarZonas } from '../../../api/repartidores';
import { useGlobalToast } from '../../../components/Toast';

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function RepartidoresTab({ onConfirm }: Props) {
  const { showToast } = useGlobalToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [form, setForm] = useState({ nombre: '', telefono: '', vehiculo: '' });
  const [editando, setEditando] = useState<Repartidor | null>(null);
  const [zonasAsignar, setZonasAsignar] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    getZonas().then(setZonas);
    getRepartidores().then(setRepartidores);
  };
  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await actualizarRepartidor(editando.id, { ...form, activo: editando.activo });
        showToast('Repartidor actualizado correctamente', 'success');
      } else {
        await crearRepartidor(form);
        showToast('Repartidor creado correctamente', 'success');
      }
      setForm({ nombre: '', telefono: '', vehiculo: '' });
      setEditando(null);
      cargar();
    } catch {
      showToast('Error al guardar repartidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignarZonas = async (repId: number) => {
    try {
      await asignarZonas(repId, zonasAsignar);
      setZonasAsignar([]);
      cargar();
      showToast('Zonas actualizadas', 'success');
    } catch {
      showToast('Error al asignar zonas', 'error');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 flex-wrap">
        <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1 min-w-[150px]" required />
        <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="border rounded px-3 py-2" />
        <input type="text" value={form.vehiculo} onChange={e => setForm({ ...form, vehiculo: e.target.value })} placeholder="Vehiculo" className="border rounded px-3 py-2" />
        <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
      </form>
      <div className="space-y-4">
        {repartidores.map(r => (
          <div key={r.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h3 className="font-bold">{r.nombre}</h3>
                <p className="text-sm text-gray-600">{r.vehiculo} | {r.telefono}</p>
                <p className="text-xs text-gray-400 mt-1">Zonas: {r.zonas.map(z => z.nombre).join(', ') || 'Sin asignar'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditando(r); setForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '' }); }} className="text-sm text-blue-600 hover:underline">Editar</button>
                <button onClick={() => onConfirm('repartidor', r.id, r.nombre)} className="text-sm text-red-600 hover:underline">Desactivar</button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 items-center flex-wrap">
              <div className="flex gap-1 flex-wrap flex-1 min-w-[200px]">
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
  );
}
