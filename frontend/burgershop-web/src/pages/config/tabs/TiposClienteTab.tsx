import { useEffect, useState } from 'react';
import { TipoCliente } from '../../../types/ventas';
import { getTiposCliente, crearTipoCliente, actualizarTipoCliente } from '../../../api/tiposCliente';
import { useGlobalToast } from '../../../components/Toast';

const tcEmptyForm = { nombre: '', descripcion: '', permiteCuentaCorriente: false };

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function TiposClienteTab({ onConfirm }: Props) {
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [form, setForm] = useState(tcEmptyForm);
  const [editando, setEditando] = useState<TipoCliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getTiposCliente().then(setTiposCliente);
  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        permiteCuentaCorriente: form.permiteCuentaCorriente,
      };
      if (editando) {
        await actualizarTipoCliente(editando.id, data);
        showToast('Tipo de cliente actualizado correctamente', 'success');
      } else {
        await crearTipoCliente(data);
        showToast('Tipo de cliente creado correctamente', 'success');
      }
      setForm(tcEmptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar tipo de cliente', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (tc: TipoCliente) => {
    setEditando(tc);
    setForm({ nombre: tc.nombre, descripcion: tc.descripcion || '', permiteCuentaCorriente: tc.permiteCuentaCorriente });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tipos de Cliente</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(tcEmptyForm); }}
          className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2"
        >
          {showForm ? 'Cerrar' : 'Nuevo Tipo de Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2" />
          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={form.permiteCuentaCorriente} onChange={e => setForm({ ...form, permiteCuentaCorriente: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            <span className="text-sm font-medium text-gray-700">Permite Cuenta Corriente</span>
          </label>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Descripcion</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Cta Cte</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tiposCliente.map(tc => (
              <tr key={tc.id}>
                <td className="px-4 py-3 text-sm font-medium">{tc.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{tc.descripcion || '-'}</td>
                <td className="px-4 py-3 text-sm text-center">
                  {tc.permiteCuentaCorriente
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Si</span>
                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <button onClick={() => handleEditar(tc)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('tipoCliente', tc.id, tc.nombre)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {tiposCliente.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay tipos de clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
