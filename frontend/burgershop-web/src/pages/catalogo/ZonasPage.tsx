import { useState, useEffect } from 'react';
import { Zona } from '../../types/logistica';
import { getZonas, createZona, updateZona, deleteZona } from '../../api/zonas';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

const emptyForm = { nombre: '', descripcion: '', costoEnvio: 0, activa: true, localId: undefined as number | undefined };

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

export default function ZonasPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Zona | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));

  const cargar = () => getZonas().then(setZonas);

  useEffect(() => {
    cargar();
    getLocales().then(setLocales);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const localId = form.localId || (esSuperAdmin ? (localSeleccionado || undefined) : usuario?.localId);
      if (editando) {
        await updateZona(editando.id, {
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          costoEnvio: form.costoEnvio,
          activa: form.activa,
          localId,
        });
        showToast('Zona actualizada correctamente', 'success');
      } else {
        await createZona({
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          costoEnvio: form.costoEnvio,
          localId,
        });
        showToast('Zona creada correctamente', 'success');
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar zona', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (z: Zona) => {
    setEditando(z);
    setForm({
      nombre: z.nombre,
      descripcion: z.descripcion || '',
      costoEnvio: z.costoEnvio,
      activa: z.activa,
      localId: z.localId,
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    try {
      await deleteZona(confirmacion.id);
      showToast('Zona eliminada correctamente', 'success');
    } catch {
      showToast('Error al eliminar zona', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const zonasFiltradas = zonas.filter(z => !localSeleccionado || z.localId === localSeleccionado);

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Zonas</h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Local</label>
          {esSuperAdmin ? (
            <select value={localSeleccionado} onChange={e => setLocalSeleccionado(Number(e.target.value))} className={selectClass + ' w-full'}>
              <option value={0}>Todos los locales</option>
              {locales.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          ) : (
            <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
              {locales.find(l => l.id === usuario?.localId)?.nombre || `Local ${usuario?.localId}`}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="px-2.5 py-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 flex items-center gap-1.5"
        >
          {showForm ? 'Cerrar' : (<><svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nueva Zona</>)}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre de la zona"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripcion"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Costo de Envio</label>
            <input
              type="number"
              value={form.costoEnvio}
              onChange={e => setForm({ ...form, costoEnvio: Number(e.target.value) })}
              placeholder="0"
              className="border rounded px-3 py-2 w-full"
              min={0}
              step="0.01"
            />
          </div>
          {esSuperAdmin ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
              <select value={form.localId ?? ''} onChange={e => setForm({ ...form, localId: e.target.value ? Number(e.target.value) : undefined })} className="border rounded px-3 py-2 w-full">
                <option value="">Seleccionar local</option>
                {locales.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
              <div className="border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700 text-sm">
                {locales.find(l => l.id === usuario?.localId)?.nombre || 'Mi Local'}
              </div>
            </div>
          )}
          {editando && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={e => setForm({ ...form, activa: e.target.checked })}
              />
              Activa
            </label>
          )}
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripcion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Costo Envio</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Local</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {zonasFiltradas.map(z => (
              <tr key={z.id}>
                <td className="px-4 py-3 text-sm font-medium">{z.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{z.descripcion || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">${z.costoEnvio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{z.localNombre || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${z.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {z.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-3">
                  <button onClick={() => handleEditar(z)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleEliminar(z.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {zonasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay zonas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar zona"
        mensaje="¿Eliminar esta zona?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
