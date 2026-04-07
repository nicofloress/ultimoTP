import { useEffect, useState } from 'react';
import { RolUsuario } from '../../types/auth';
import { Repartidor } from '../../types/logistica';
import { getRepartidores } from '../../api/repartidores';
import { getLocales, LocalDto } from '../../api/locales';
import { UsuarioList, getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

const emptyForm = {
  nombreUsuario: '',
  password: '',
  nombreCompleto: '',
  rol: RolUsuario.Local as RolUsuario,
  repartidorId: undefined as number | undefined,
  localId: undefined as number | undefined,
  activo: true,
};

const rolOptions: { value: RolUsuario; label: string }[] = [
  { value: RolUsuario.SuperAdmin, label: 'Super Admin' },
  { value: RolUsuario.Administrador, label: 'Administrador' },
  { value: RolUsuario.Local, label: 'Local' },
  { value: RolUsuario.Repartidor, label: 'Repartidor' },
  { value: RolUsuario.Deposito, label: 'Depósito' },
];

export default function UsuariosPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;

  const [usuarios, setUsuarios] = useState<UsuarioList[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(usuario?.localId || 0);
  const [rolFiltro, setRolFiltro] = useState<number | ''>('');
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<UsuarioList | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    getUsuarios().then(res => setUsuarios(res.data));
    getRepartidores().then(setRepartidores);
    getLocales().then(setLocales);
  };

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const localId = form.rol !== RolUsuario.SuperAdmin ? form.localId : undefined;
      if (editando) {
        await actualizarUsuario(editando.id, {
          nombreUsuario: form.nombreUsuario,
          password: form.password || undefined,
          nombreCompleto: form.nombreCompleto,
          rol: form.rol,
          repartidorId: form.rol === RolUsuario.Repartidor ? form.repartidorId : undefined,
          localId,
          activo: form.activo,
        });
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        await crearUsuario({
          nombreUsuario: form.nombreUsuario,
          password: form.password,
          nombreCompleto: form.nombreCompleto,
          rol: form.rol,
          repartidorId: form.rol === RolUsuario.Repartidor ? form.repartidorId : undefined,
          localId,
        });
        showToast('Usuario creado correctamente', 'success');
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar usuario', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (u: UsuarioList) => {
    setEditando(u);
    setForm({
      nombreUsuario: u.nombreUsuario,
      password: '',
      nombreCompleto: u.nombreCompleto,
      rol: u.rol,
      repartidorId: u.repartidorId,
      localId: u.localId,
      activo: u.activo,
    });
    setShowForm(true);
  };

  const handleDesactivar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarDesactivar = async () => {
    setGuardando(true);
    try {
      await eliminarUsuario(confirmacion.id);
      showToast('Usuario desactivado correctamente', 'success');
    } catch {
      showToast('Error al desactivar usuario', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Usuarios</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          {showForm ? 'Cerrar' : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo Usuario</>)}
        </button>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <div className="min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
          {esSuperAdmin ? (
            <select className={selectClass + ' w-full'} value={localSeleccionado} onChange={e => setLocalSeleccionado(Number(e.target.value))}>
              <option value={0}>Todos los locales</option>
              {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          ) : (
            <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
              {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
            </div>
          )}
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
          <select className={selectClass + ' w-full'} value={rolFiltro} onChange={e => setRolFiltro(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Todos los roles</option>
            {rolOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de Usuario</label>
            <input
              type="text"
              value={form.nombreUsuario}
              onChange={e => setForm({ ...form, nombreUsuario: e.target.value })}
              placeholder="Nombre de usuario"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={form.nombreCompleto}
              onChange={e => setForm({ ...form, nombreCompleto: e.target.value })}
              placeholder="Nombre completo"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contrasena</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={editando ? 'Nueva contraseña (dejar vacio para no cambiar)' : 'Contraseña'}
              className="border rounded px-3 py-2 w-full"
              required={!editando}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
            <select
              value={form.rol}
              onChange={e => setForm({ ...form, rol: Number(e.target.value) as RolUsuario, repartidorId: undefined })}
              className="border rounded px-3 py-2 w-full"
              required
            >
              {rolOptions.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {/* Select Local — no se muestra para SuperAdmin */}
          {form.rol !== RolUsuario.SuperAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
              <select
                value={form.localId ?? ''}
                onChange={e => setForm({ ...form, localId: e.target.value ? Number(e.target.value) : undefined })}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Sin local asignado</option>
                {locales.filter(l => l.activo).map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {/* Select Repartidor — solo para rol Repartidor */}
          {form.rol === RolUsuario.Repartidor && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Repartidor</label>
              <select
                value={form.repartidorId ?? ''}
                onChange={e => setForm({ ...form, repartidorId: e.target.value ? Number(e.target.value) : undefined })}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Sin repartidor asociado</option>
                {repartidores.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Usuario</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Rol</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Local</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Repartidor</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.filter(u => (!localSeleccionado || u.localId === localSeleccionado) && (rolFiltro === '' || u.rol === rolFiltro)).map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm font-medium">{u.nombreUsuario}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.nombreCompleto}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.rol === RolUsuario.SuperAdmin ? 'bg-purple-100 text-purple-700' :
                    u.rol === RolUsuario.Administrador ? 'bg-blue-100 text-blue-700' :
                    u.rol === RolUsuario.Local ? 'bg-amber-100 text-amber-700' :
                    u.rol === RolUsuario.Deposito ? 'bg-slate-100 text-slate-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {u.rolNombre}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.localNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.repartidorNombre || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(u)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  {u.activo && (
                    <button onClick={() => handleDesactivar(u.id)} className="text-red-600 hover:underline">Desactivar</button>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Desactivar usuario"
        mensaje="¿Desactivar este usuario? No podra iniciar sesion."
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
