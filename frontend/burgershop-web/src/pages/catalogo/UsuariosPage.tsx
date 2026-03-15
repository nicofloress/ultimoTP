import { useEffect, useState } from 'react';
import { RolUsuario } from '../../types/auth';
import { Repartidor } from '../../types/logistica';
import { getRepartidores } from '../../api/repartidores';
import { UsuarioList, getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../../api/usuarios';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = {
  nombreUsuario: '',
  password: '',
  nombreCompleto: '',
  rol: RolUsuario.Local as RolUsuario,
  repartidorId: undefined as number | undefined,
  activo: true,
};

const rolOptions: { value: RolUsuario; label: string }[] = [
  { value: RolUsuario.Administrador, label: 'Administrador' },
  { value: RolUsuario.Local, label: 'Local' },
  { value: RolUsuario.Repartidor, label: 'Repartidor' },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioList[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<UsuarioList | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => {
    getUsuarios().then(res => setUsuarios(res.data));
    getRepartidores().then(res => setRepartidores(res.data));
  };

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await actualizarUsuario(editando.id, {
        nombreUsuario: form.nombreUsuario,
        password: form.password || undefined,
        nombreCompleto: form.nombreCompleto,
        rol: form.rol,
        repartidorId: form.rol === RolUsuario.Repartidor ? form.repartidorId : undefined,
        activo: form.activo,
      });
    } else {
      await crearUsuario({
        nombreUsuario: form.nombreUsuario,
        password: form.password,
        nombreCompleto: form.nombreCompleto,
        rol: form.rol,
        repartidorId: form.rol === RolUsuario.Repartidor ? form.repartidorId : undefined,
      });
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (u: UsuarioList) => {
    setEditando(u);
    setForm({
      nombreUsuario: u.nombreUsuario,
      password: '',
      nombreCompleto: u.nombreCompleto,
      rol: u.rol,
      repartidorId: u.repartidorId,
      activo: u.activo,
    });
    setShowForm(true);
  };

  const handleDesactivar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarDesactivar = async () => {
    await eliminarUsuario(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            value={form.nombreUsuario}
            onChange={e => setForm({ ...form, nombreUsuario: e.target.value })}
            placeholder="Nombre de usuario"
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            value={form.nombreCompleto}
            onChange={e => setForm({ ...form, nombreCompleto: e.target.value })}
            placeholder="Nombre completo"
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder={editando ? 'Nueva contraseña (dejar vacio para no cambiar)' : 'Contraseña'}
            className="border rounded px-3 py-2"
            required={!editando}
          />
          <select
            value={form.rol}
            onChange={e => setForm({ ...form, rol: Number(e.target.value) as RolUsuario, repartidorId: undefined })}
            className="border rounded px-3 py-2"
            required
          >
            {rolOptions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {form.rol === RolUsuario.Repartidor && (
            <select
              value={form.repartidorId ?? ''}
              onChange={e => setForm({ ...form, repartidorId: e.target.value ? Number(e.target.value) : undefined })}
              className="border rounded px-3 py-2"
            >
              <option value="">Sin repartidor asociado</option>
              {repartidores.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
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
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
              {editando ? 'Actualizar' : 'Crear'}
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Repartidor</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm font-medium">{u.nombreUsuario}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.nombreCompleto}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.rolNombre}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay usuarios registrados</td>
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
