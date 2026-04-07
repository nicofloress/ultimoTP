import { useEffect, useState } from 'react';
import { Repartidor } from '../../types/logistica';
import { getRepartidores, crearRepartidor, actualizarRepartidor, eliminarRepartidor } from '../../api/repartidores';
import { getLocales, LocalDto } from '../../api/locales';
import { crearUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

const emptyForm = { nombre: '', telefono: '', vehiculo: '', activo: true, localId: undefined as number | undefined, nombreUsuario: '', password: '' };

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

export default function RepartidoresPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Repartidor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));

  const cargar = () => getRepartidores().then(setRepartidores);

  useEffect(() => {
    cargar();
    getLocales().then(setLocales);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const localId = form.localId || (esSuperAdmin ? undefined : usuario?.localId);
      if (editando) {
        await actualizarRepartidor(editando.id, {
          nombre: form.nombre,
          telefono: form.telefono || undefined,
          vehiculo: form.vehiculo || undefined,
          activo: form.activo,
          localId,
        });
        showToast('Repartidor actualizado correctamente', 'success');
      } else {
        const nuevoRep = await crearRepartidor({
          nombre: form.nombre,
          telefono: form.telefono || undefined,
          vehiculo: form.vehiculo || undefined,
          localId,
        });
        // Crear usuario si se completaron los campos
        try {
          await crearUsuario({
            nombreUsuario: form.nombreUsuario,
            password: form.password,
            nombreCompleto: form.nombre,
            rol: RolUsuario.Repartidor,
            repartidorId: nuevoRep.id,
            localId,
          });
          showToast('Repartidor y usuario creados correctamente', 'success');
        } catch {
          showToast('Repartidor creado, pero error al crear usuario (puede que ya exista)', 'error');
        }
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar repartidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (r: Repartidor) => {
    setEditando(r);
    setForm({
      nombre: r.nombre,
      telefono: r.telefono || '',
      vehiculo: r.vehiculo || '',
      activo: r.activo,
      localId: r.localId,
      nombreUsuario: '',
      password: '',
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    try {
      await eliminarRepartidor(confirmacion.id);
      showToast('Repartidor desactivado correctamente', 'success');
    } catch {
      showToast('Error al desactivar repartidor', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const crearUsuarioRepartidor = async (r: Repartidor) => {
    const pwd = prompt(`Ingresa la contraseña para el usuario de ${r.nombre}:`);
    if (!pwd) return;
    const usr = prompt(`Ingresa el nombre de usuario:`, r.nombre.toLowerCase().replace(/\s+/g, ''));
    if (!usr) return;
    try {
      await crearUsuario({
        nombreUsuario: usr,
        password: pwd,
        nombreCompleto: r.nombre,
        rol: RolUsuario.Repartidor,
        repartidorId: r.id,
        localId: r.localId,
      });
      showToast(`Usuario "${usr}" creado para ${r.nombre}`, 'success');
    } catch {
      showToast('Error al crear usuario (puede que ya exista)', 'error');
    }
  };

  const repartidoresFiltrados = repartidores.filter(r => !localSeleccionado || r.localId === localSeleccionado);

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Repartidores</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          {showForm ? 'Cerrar' : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo Repartidor</>)}
        </button>
      </div>

      {/* Filtro por local */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Local:</label>
        {esSuperAdmin ? (
          <select value={localSeleccionado} onChange={e => setLocalSeleccionado(Number(e.target.value))} className={selectClass}>
            <option value={0}>Todos los locales</option>
            {locales.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        ) : (
          <div className="text-sm text-gray-700 font-medium">{locales.find(l => l.id === usuario?.localId)?.nombre || `Local ${usuario?.localId}`}</div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              placeholder="Telefono"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehiculo</label>
            <input
              type="text"
              value={form.vehiculo}
              onChange={e => setForm({ ...form, vehiculo: e.target.value })}
              placeholder="Vehiculo"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          {!editando && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usuario (login)</label>
                <input
                  type="text"
                  value={form.nombreUsuario}
                  onChange={e => setForm({ ...form, nombreUsuario: e.target.value })}
                  placeholder="Nombre de usuario para login"
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Contraseña del usuario"
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
            </>
          )}
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
                checked={form.activo}
                onChange={e => setForm({ ...form, activo: e.target.checked })}
              />
              Activo
            </label>
          )}
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Vehiculo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Local</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {repartidoresFiltrados.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm font-medium">{r.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.vehiculo || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.localNombre || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-3">
                  <button onClick={() => handleEditar(r)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => crearUsuarioRepartidor(r)} className="text-xs text-purple-600 hover:underline">Resetear Usuario</button>
                  <button onClick={() => handleEliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {repartidoresFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay repartidores registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar repartidor"
        mensaje="¿Eliminar este repartidor?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
