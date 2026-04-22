import { useEffect, useState } from 'react';
import { Zona } from '../../../types';
import { LocalDto, getLocales } from '../../../api/locales';
import { getZonas, createZona, updateZona } from '../../../api/zonas';
import { useGlobalToast } from '../../../components/Toast';
import { useAuth } from '../../../context/AuthContext';
import { RolUsuario } from '../../../types/auth';

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function ZonasTab({ onConfirm }: Props) {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const { showToast } = useGlobalToast();
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localFiltro, setLocalFiltro] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));
  const [form, setForm] = useState({ nombre: '', descripcion: '', costoEnvio: 0, localId: esSuperAdmin ? 0 : (usuario?.localId || 0) });
  const [editando, setEditando] = useState<Zona | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getZonas().then(setZonas);
  useEffect(() => { cargar(); getLocales().then(setLocales); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const localIdEnviar = esSuperAdmin ? (form.localId || undefined) : usuario?.localId;
    try {
      if (editando) {
        await updateZona(editando.id, { nombre: form.nombre, descripcion: form.descripcion, costoEnvio: form.costoEnvio, activa: editando.activa, localId: localIdEnviar });
        showToast('Zona actualizada correctamente', 'success');
      } else {
        await createZona({ nombre: form.nombre, descripcion: form.descripcion, costoEnvio: form.costoEnvio, localId: localIdEnviar });
        showToast('Zona creada correctamente', 'success');
      }
      setForm({ nombre: '', descripcion: '', costoEnvio: 0, localId: esSuperAdmin ? 0 : (usuario?.localId || 0) });
      setEditando(null);
      cargar();
    } catch {
      showToast('Error al guardar zona', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        {esSuperAdmin ? (
          <select value={localFiltro} onChange={e => setLocalFiltro(Number(e.target.value))} className="border rounded px-3 py-2">
            <option value={0}>Todos los locales</option>
            {locales.map(l => (<option key={l.id} value={l.id}>{l.nombre}</option>))}
          </select>
        ) : (
          <span className="text-sm text-gray-600 font-medium">
            Local: {locales.find(l => l.id === usuario?.localId)?.nombre || `#${usuario?.localId}`}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 w-full" required />
        <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
        <input type="number" value={form.costoEnvio} onChange={e => setForm({ ...form, costoEnvio: Number(e.target.value) })} placeholder="Costo envio" className="border rounded px-3 py-2 w-full" min={0} step={100} />
        {esSuperAdmin && (
          <select value={form.localId} onChange={e => setForm({ ...form, localId: Number(e.target.value) })} className="border rounded px-3 py-2 w-full">
            <option value={0}>Sin local</option>
            {locales.map(l => (<option key={l.id} value={l.id}>{l.nombre}</option>))}
          </select>
        )}
        <div className={esSuperAdmin ? 'sm:col-span-2' : 'sm:col-span-2'}>
          <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Descripcion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Costo Envio</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Local</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {zonas.filter(z => !localFiltro || z.localId === localFiltro).map(z => (
              <tr key={z.id}>
                <td className="px-4 py-3 text-sm font-medium">{z.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{z.descripcion}</td>
                <td className="px-4 py-3 text-sm">${z.costoEnvio.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{z.localNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <button onClick={() => { setEditando(z); setForm({ nombre: z.nombre, descripcion: z.descripcion || '', costoEnvio: z.costoEnvio, localId: z.localId || 0 }); }} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('zona', z.id, z.nombre)} className="text-red-600 hover:underline">Desactivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
