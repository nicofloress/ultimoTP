import { useEffect, useState } from 'react';
import { LocalDto, getLocales, crearLocal, actualizarLocal, eliminarLocal } from '../../api/locales';
import { EmpresaDto, getEmpresas } from '../../api/empresas';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = {
  nombre: '',
  direccion: '',
  empresaId: '' as string,
  esPuntoVenta: false,
};

export default function LocalesPage() {
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<LocalDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getLocales().then(setLocales);

  useEffect(() => {
    cargar();
    getEmpresas().then(setEmpresas);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nombre: form.nombre,
      direccion: form.direccion || undefined,
      empresaId: form.empresaId ? Number(form.empresaId) : undefined,
      esPuntoVenta: form.esPuntoVenta,
    };
    if (editando) {
      await actualizarLocal(editando.id, { ...data, activo: editando.activo });
    } else {
      await crearLocal(data);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (loc: LocalDto) => {
    setEditando(loc);
    setForm({
      nombre: loc.nombre,
      direccion: loc.direccion || '',
      empresaId: loc.empresaId ? String(loc.empresaId) : '',
      esPuntoVenta: loc.esPuntoVenta,
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarLocal(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Locales</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          {showForm ? 'Cerrar' : 'Nuevo Local'}
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
            value={form.direccion}
            onChange={e => setForm({ ...form, direccion: e.target.value })}
            placeholder="Direccion"
            className="border rounded px-3 py-2"
          />
          <select
            value={form.empresaId}
            onChange={e => setForm({ ...form, empresaId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Sin empresa</option>
            {empresas.filter(emp => emp.activa).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.esPuntoVenta}
              onChange={e => setForm({ ...form, esPuntoVenta: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
            />
            <span className="text-sm font-medium text-gray-700">Es Punto de Venta</span>
          </label>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2">
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Direccion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Empresa</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Punto de Venta</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {locales.map(loc => (
              <tr key={loc.id}>
                <td className="px-4 py-3 text-sm font-medium">{loc.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{loc.direccion || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{loc.empresaNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-center">
                  {loc.esPuntoVenta
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Si</span>
                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(loc)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(loc.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {locales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay locales registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar local"
        mensaje="¿Eliminar este local?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
