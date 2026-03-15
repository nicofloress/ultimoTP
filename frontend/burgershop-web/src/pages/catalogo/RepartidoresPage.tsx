import { useEffect, useState } from 'react';
import { Repartidor } from '../../types/logistica';
import { getRepartidores, crearRepartidor, actualizarRepartidor, eliminarRepartidor } from '../../api/repartidores';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = { nombre: '', telefono: '', vehiculo: '', codigoAcceso: '', activo: true };

export default function RepartidoresPage() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Repartidor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getRepartidores().then(setRepartidores);

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await actualizarRepartidor(editando.id, {
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        vehiculo: form.vehiculo || undefined,
        activo: form.activo,
        codigoAcceso: form.codigoAcceso || undefined,
      });
    } else {
      await crearRepartidor({
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        vehiculo: form.vehiculo || undefined,
        codigoAcceso: form.codigoAcceso,
      });
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (r: Repartidor) => {
    setEditando(r);
    setForm({
      nombre: r.nombre,
      telefono: r.telefono || '',
      vehiculo: r.vehiculo || '',
      codigoAcceso: '',
      activo: r.activo,
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarRepartidor(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Repartidores</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Repartidor'}
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
            value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })}
            placeholder="Telefono"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.vehiculo}
            onChange={e => setForm({ ...form, vehiculo: e.target.value })}
            placeholder="Vehiculo"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.codigoAcceso}
            onChange={e => setForm({ ...form, codigoAcceso: e.target.value })}
            placeholder={editando ? 'Nuevo codigo (dejar vacio para no cambiar)' : 'Codigo de Acceso'}
            className="border rounded px-3 py-2"
            required={!editando}
          />
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Vehiculo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {repartidores.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm font-medium">{r.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.vehiculo || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(r)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {repartidores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay repartidores registrados</td>
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
