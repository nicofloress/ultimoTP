import { useEffect, useState } from 'react';
import { ClienteDto, CrearClienteDto } from '../../types/ventas';
import { Zona } from '../../types/logistica';
import { ListaPrecio } from '../../types/catalogo';
import { TipoCliente } from '../../types/ventas';
import { getClientes, crearCliente, actualizarCliente, eliminarCliente } from '../../api/clientes';
import { getZonas } from '../../api/zonas';
import { getTiposCliente } from '../../api/tiposCliente';
import { getListasPrecios } from '../../api/listasPrecios';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = {
  nombre: '',
  cuit: '',
  email: '',
  telefono: '',
  direccion: '',
  zonaId: '' as string,
  tipoClienteId: '' as string,
  listaPrecioId: '' as string,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<ClienteDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const cargar = () => getClientes().then(setClientes);

  useEffect(() => {
    cargar();
    getZonas().then(setZonas);
    getTiposCliente().then(setTiposCliente);
    getListasPrecios().then(setListasPrecios);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CrearClienteDto = {
      nombre: form.nombre,
      cuit: form.cuit || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      direccion: form.direccion || undefined,
      zonaId: form.zonaId ? Number(form.zonaId) : undefined,
      tipoClienteId: form.tipoClienteId ? Number(form.tipoClienteId) : undefined,
      listaPrecioId: form.listaPrecioId ? Number(form.listaPrecioId) : undefined,
    };
    if (editando) {
      await actualizarCliente(editando.id, data);
    } else {
      await crearCliente(data);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (c: ClienteDto) => {
    setEditando(c);
    setForm({
      nombre: c.nombre,
      cuit: c.cuit || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      zonaId: c.zonaId ? String(c.zonaId) : '',
      tipoClienteId: c.tipoClienteId ? String(c.tipoClienteId) : '',
      listaPrecioId: c.listaPrecioId ? String(c.listaPrecioId) : '',
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarCliente(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const clientesFiltrados = clientes.filter(c => {
    const term = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Clientes</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 text-sm font-semibold transition-colors"
        >
          {showForm ? 'Cerrar' : 'Nuevo Cliente'}
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
            value={form.cuit}
            onChange={e => setForm({ ...form, cuit: e.target.value })}
            placeholder="CUIT (ej: 20-12345678-9)"
            className="border rounded px-3 py-2"
          />
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
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
          <select
            value={form.zonaId}
            onChange={e => setForm({ ...form, zonaId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Sin zona</option>
            {zonas.filter(z => z.activa).map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
          <select
            value={form.tipoClienteId}
            onChange={e => setForm({ ...form, tipoClienteId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Sin tipo de cliente</option>
            {tiposCliente.filter(tc => tc.activo).map(tc => (
              <option key={tc.id} value={tc.id}>{tc.nombre}</option>
            ))}
          </select>
          <select
            value={form.listaPrecioId}
            onChange={e => setForm({ ...form, listaPrecioId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Precio Base (sin lista)</option>
            {listasPrecios.filter(l => l.activa).map(l => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
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

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o telefono..."
          className="border rounded px-3 py-2 w-full max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">CUIT</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Direccion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Zona</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tipo Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Lista Precios</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientesFiltrados.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm font-medium">{c.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.cuit || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.direccion || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.zonaNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.tipoClienteNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.listaPrecioId ? listasPrecios.find(l => l.id === c.listaPrecioId)?.nombre || '-' : 'Precio Base'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(c)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay clientes registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar cliente"
        mensaje="¿Eliminar este cliente?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
