import { useEffect, useState } from 'react';
import { Proveedor } from '../../types/catalogo';
import { getProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } from '../../api/proveedores';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = { nombre: '', contacto: '', telefono: '', direccion: '' };

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getProveedores().then(res => setProveedores(res.data));

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await actualizarProveedor(editando.id, form);
    } else {
      await crearProveedor(form);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (p: Proveedor) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarProveedor(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Proveedor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            value={form.contacto}
            onChange={e => setForm({ ...form, contacto: e.target.value })}
            placeholder="Contacto"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })}
            placeholder="Telefono"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.direccion}
            onChange={e => setForm({ ...form, direccion: e.target.value })}
            placeholder="Direccion"
            className="border rounded px-3 py-2"
          />
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Contacto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Direccion</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {proveedores.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.contacto || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.direccion || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(p)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(p.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay proveedores registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar proveedor"
        mensaje="¿Eliminar este proveedor?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
