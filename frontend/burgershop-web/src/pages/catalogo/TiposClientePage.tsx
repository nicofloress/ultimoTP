import { useEffect, useState } from 'react';
import { TipoCliente } from '../../types/ventas';
import { getTiposCliente, crearTipoCliente, actualizarTipoCliente, eliminarTipoCliente } from '../../api/tiposCliente';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = { nombre: '', descripcion: '' };

export default function TiposClientePage() {
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<TipoCliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getTiposCliente().then(setTiposCliente);

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
    };
    if (editando) {
      await actualizarTipoCliente(editando.id, data);
    } else {
      await crearTipoCliente(data);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (tc: TipoCliente) => {
    setEditando(tc);
    setForm({
      nombre: tc.nombre,
      descripcion: tc.descripcion || '',
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarTipoCliente(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tipos de Clientes</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Tipo de Cliente'}
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
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripcion"
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripcion</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tiposCliente.map(tc => (
              <tr key={tc.id}>
                <td className="px-4 py-3 text-sm font-medium">{tc.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tc.descripcion || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(tc)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(tc.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {tiposCliente.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No hay tipos de clientes registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar tipo de cliente"
        mensaje="¿Eliminar este tipo de cliente?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
