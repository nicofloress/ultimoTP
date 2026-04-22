import { useEffect, useState } from 'react';
import { MarcaDto, getMarcas, crearMarca, actualizarMarca, eliminarMarca } from '../../api/marcas';
import { getProveedores } from '../../api/proveedores';
import { Proveedor } from '../../types/catalogo';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

const emptyForm = { nombre: '', descripcion: '', proveedorId: undefined as number | undefined };

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<MarcaDto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<MarcaDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getMarcas().then(setMarcas);

  useEffect(() => {
    cargar();
    getProveedores().then(setProveedores).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await actualizarMarca(editando.id, {
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          proveedorId: form.proveedorId,
          activo: editando.activo,
        });
        showToast('Marca actualizada correctamente', 'success');
      } else {
        await crearMarca({
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          proveedorId: form.proveedorId,
        });
        showToast('Marca creada correctamente', 'success');
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar marca', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (m: MarcaDto) => {
    setEditando(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      proveedorId: m.proveedorId,
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    try {
      await eliminarMarca(confirmacion.id);
      showToast('Marca eliminada correctamente', 'success');
    } catch {
      showToast('Error al eliminar marca', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const marcasFiltradas = marcas.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.proveedorNombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* Header simple sin botón */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Marcas</h2>
      </div>

      {/* Barra de filtros uniforme */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, descripcion o proveedor..."
          className={selectClass + ' flex-1 min-w-[180px] w-full sm:w-auto'}
        />
        <button
          onClick={() => { setShowForm(true); setEditando(null); setForm(emptyForm); }}
          className="w-full sm:w-auto px-2.5 py-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Marca
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor</label>
            <select
              value={form.proveedorId ?? ''}
              onChange={e => setForm({ ...form, proveedorId: e.target.value ? Number(e.target.value) : undefined })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Sin proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-span-full flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-emerald-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditando(null); }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-2 sm:px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-2 sm:px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Descripcion</th>
              <th className="text-left px-2 sm:px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Proveedor</th>
              <th className="text-left px-2 sm:px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-2 sm:px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {marcasFiltradas.map(m => (
              <tr key={m.id} className={!m.activo ? 'opacity-50' : ''}>
                <td className="px-2 sm:px-4 py-3 text-sm font-medium">
                  <div>{m.nombre}</div>
                  <div className="sm:hidden text-xs text-gray-500">{m.proveedorNombre || ''}</div>
                </td>
                <td className="px-2 sm:px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{m.descripcion || '-'}</td>
                <td className="px-2 sm:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{m.proveedorNombre || '-'}</td>
                <td className="px-2 sm:px-4 py-3 text-sm">
                  {m.activo
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activa</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>
                  }
                </td>
                <td className="px-2 sm:px-4 py-3 text-sm text-right whitespace-nowrap">
                  <button onClick={() => handleEditar(m)} className="text-blue-600 hover:underline mr-2 sm:mr-3">Editar</button>
                  <button onClick={() => handleEliminar(m.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {marcasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay marcas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar marca"
        mensaje="¿Eliminar esta marca?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
