import { useEffect, useState } from 'react';
import { ClienteDto, CrearClienteDto } from '../../types/ventas';
import { Zona } from '../../types/logistica';
import { ListaPrecio } from '../../types/catalogo';
import { TipoCliente } from '../../types/ventas';
import { getClientes, crearCliente, actualizarCliente, eliminarCliente } from '../../api/clientes';
import { getZonas } from '../../api/zonas';
import { getTiposCliente } from '../../api/tiposCliente';
import { getListasPrecios } from '../../api/listasPrecios';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

const emptyForm = {
  nombre: '',
  cuit: '',
  email: '',
  telefono: '',
  direccion: '',
  zonaId: '' as string,
  tipoClienteId: '' as string,
  listaPrecioId: '' as string,
  localId: '' as string,
};

export default function ClientesPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;

  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<ClienteDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));
  const [busqueda, setBusqueda] = useState('');
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const { sugerencias: sugerenciasDireccion, buscarDirecciones } = useGooglePlaces();
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const cargar = () => getClientes().then(setClientes);

  useEffect(() => {
    cargar();
    getZonas().then(setZonas);
    getTiposCliente().then(setTiposCliente);
    getListasPrecios().then(setListasPrecios);
    getLocales().then(setLocales);
  }, []);

  // Zonas filtradas por el local del formulario (o el local del usuario si no es SuperAdmin)
  const localIdFormulario = form.localId
    ? Number(form.localId)
    : (!esSuperAdmin ? (usuario?.localId ?? 0) : 0);

  const zonasFiltradas = zonas.filter(z => {
    if (!z.activa) return false;
    if (localIdFormulario && z.localId && z.localId !== localIdFormulario) return false;
    return true;
  });

  const abrirNuevo = () => {
    setEditando(null);
    setForm({
      ...emptyForm,
      localId: !esSuperAdmin ? String(usuario?.localId ?? '') : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      // Si no es SuperAdmin, forzar el local del usuario
      const localIdFinal = !esSuperAdmin
        ? (usuario?.localId ?? undefined)
        : (form.localId ? Number(form.localId) : undefined);

      const data: CrearClienteDto = {
        nombre: form.nombre,
        cuit: form.cuit || undefined,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined,
        zonaId: form.zonaId ? Number(form.zonaId) : undefined,
        tipoClienteId: form.tipoClienteId ? Number(form.tipoClienteId) : undefined,
        listaPrecioId: form.listaPrecioId ? Number(form.listaPrecioId) : undefined,
        localId: localIdFinal,
      };
      if (editando) {
        await actualizarCliente(editando.id, data);
        showToast('Cliente actualizado correctamente', 'success');
      } else {
        await crearCliente(data);
        showToast('Cliente creado correctamente', 'success');
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar cliente', 'error');
    } finally {
      setGuardando(false);
    }
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
      localId: c.localId ? String(c.localId) : '',
    });
    setShowForm(true);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    try {
      await eliminarCliente(confirmacion.id);
      showToast('Cliente eliminado correctamente', 'success');
    } catch {
      showToast('Error al eliminar cliente', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const clientesFiltrados = clientes.filter(c => {
    if (localSeleccionado && c.localId && c.localId !== localSeleccionado) return false;
    const term = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* Header simple sin botón */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Clientes</h2>
      </div>

      {/* Barra de filtros uniforme */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-4 flex-wrap">
        {esSuperAdmin ? (
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Local</label>
            <select
              className={selectClass + ' flex-1'}
              value={localSeleccionado}
              onChange={e => setLocalSeleccionado(Number(e.target.value))}
            >
              <option value={0}>Todos los locales</option>
              {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Local</label>
            <span className="text-sm text-gray-700 border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50">
              {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
            </span>
          </div>
        )}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o telefono..."
          className={selectClass + ' flex-1 min-w-[180px]'}
        />
        <div className="flex-1" />
        <button
          onClick={abrirNuevo}
          className="px-2.5 py-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">CUIT</label>
            <input
              type="text"
              value={form.cuit}
              onChange={e => setForm({ ...form, cuit: e.target.value })}
              placeholder="CUIT (ej: 20-12345678-9)"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="border rounded px-3 py-2 w-full"
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
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Direccion</label>
            <input
              type="text"
              value={form.direccion}
              onChange={e => {
                setForm({ ...form, direccion: e.target.value });
                buscarDirecciones(e.target.value);
                setMostrarSugerencias(true);
              }}
              onFocus={() => { if (sugerenciasDireccion.length > 0) setMostrarSugerencias(true); }}
              onBlur={() => { setTimeout(() => setMostrarSugerencias(false), 200); }}
              placeholder="Direccion"
              className="border rounded px-3 py-2 w-full"
            />
            {mostrarSugerencias && sugerenciasDireccion.length > 0 && form.direccion.length >= 3 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {sugerenciasDireccion.map(s => (
                  <button
                    key={s.placeId}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, direccion: s.descripcion });
                      setMostrarSugerencias(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {s.descripcion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Zona</label>
            <select
              value={form.zonaId}
              onChange={e => setForm({ ...form, zonaId: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Sin zona</option>
              {zonasFiltradas.map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Cliente</label>
            <select
              value={form.tipoClienteId}
              onChange={e => setForm({ ...form, tipoClienteId: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Sin tipo de cliente</option>
              {tiposCliente.filter(tc => tc.activo).map(tc => (
                <option key={tc.id} value={tc.id}>{tc.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lista de Precios</label>
            <select
              value={form.listaPrecioId}
              onChange={e => setForm({ ...form, listaPrecioId: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Precio Base (sin lista)</option>
              {listasPrecios.filter(l => l.activa).map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select
                value={form.localId}
                onChange={e => {
                  // Al cambiar el local, limpiar la zona seleccionada para evitar zonas de otro local
                  setForm({ ...form, localId: e.target.value, zonaId: '' });
                }}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Sin local asignado</option>
                {locales.filter(l => l.activo).map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-700">
                {locales.find(l => l.id === (usuario?.localId ?? 0))?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">CUIT</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Direccion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Zona</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tipo Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Lista Precios</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Local</th>
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
                <td className="px-4 py-3 text-sm text-gray-600">{c.localNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(c)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No hay clientes registrados</td>
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
