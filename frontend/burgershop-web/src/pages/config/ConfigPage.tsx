import { useEffect, useState } from 'react';
import { Zona, Repartidor, FormaPago, Categoria } from '../../types';
import { TipoCliente } from '../../types/ventas';
import { getZonas, createZona, updateZona, deleteZona } from '../../api/zonas';
import { getRepartidores, crearRepartidor as createRepartidor, actualizarRepartidor as updateRepartidor, eliminarRepartidor as deleteRepartidor, asignarZonas } from '../../api/repartidores';
import { getFormasPago, createFormaPago, updateFormaPago, deleteFormaPago } from '../../api/formasPago';
import { getTiposCliente, crearTipoCliente, actualizarTipoCliente, eliminarTipoCliente } from '../../api/tiposCliente';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../api/categorias';
import { EmpresaDto, getEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa } from '../../api/empresas';
import { LocalDto, getLocales, crearLocal, actualizarLocal, eliminarLocal } from '../../api/locales';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';

type TabType = 'zonas' | 'repartidores' | 'formasPago' | 'tiposCliente' | 'categorias' | 'empresas' | 'locales';

// ─── Tipos Cliente Tab ───────────────────────────────────────
const tcEmptyForm = { nombre: '', descripcion: '', permiteCuentaCorriente: false };

function TiposClienteTab({ onConfirm }: { onConfirm: (tipo: string, id: number, nombre: string) => void }) {
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
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Tipo de Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2" />
          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={form.permiteCuentaCorriente} onChange={e => setForm({ ...form, permiteCuentaCorriente: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            <span className="text-sm font-medium text-gray-700">Permite Cuenta Corriente</span>
          </label>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripcion</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Cta Cte</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tiposCliente.map(tc => (
              <tr key={tc.id}>
                <td className="px-4 py-3 text-sm font-medium">{tc.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tc.descripcion || '-'}</td>
                <td className="px-4 py-3 text-sm text-center">
                  {tc.permiteCuentaCorriente
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Si</span>
                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-right">
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

// ─── Categorias Tab ──────────────────────────────────────────
function CategoriasTab({ onConfirm }: { onConfirm: (tipo: string, id: number, nombre: string) => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [categoriaPadreId, setCategoriaPadreId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getCategorias().then(setCategorias);
  useEffect(() => { cargar(); }, []);

  const categoriasPadre = categorias.filter(c => !c.categoriaPadreId);

  const categoriasOrdenadas = () => {
    const padres = categorias.filter(c => !c.categoriaPadreId);
    const result: Categoria[] = [];
    for (const padre of padres) {
      result.push(padre);
      const hijas = categorias.filter(c => c.categoriaPadreId === padre.id);
      result.push(...hijas);
    }
    const idsEnResult = new Set(result.map(c => c.id));
    for (const cat of categorias) {
      if (!idsEnResult.has(cat.id)) result.push(cat);
    }
    return result;
  };

  const opcionesPadre = () => {
    if (!editando) return categoriasPadre;
    return categoriasPadre.filter(c => c.id !== editando.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await updateCategoria(editando.id, { nombre, activa: editando.activa, categoriaPadreId });
        showToast('Categoria actualizada correctamente', 'success');
      } else {
        await createCategoria({ nombre, categoriaPadreId });
        showToast('Categoria creada correctamente', 'success');
      }
      setNombre('');
      setCategoriaPadreId(null);
      setEditando(null);
      cargar();
    } catch {
      showToast('Error al guardar categoria', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (cat: Categoria) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setCategoriaPadreId(cat.categoriaPadreId ?? null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 items-end">
        <div className="flex-1">
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la categoria" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div className="w-56">
          <select value={categoriaPadreId ?? ''} onChange={e => setCategoriaPadreId(e.target.value ? Number(e.target.value) : null)} className="border rounded px-3 py-2 w-full">
            <option value="">Sin categoria padre</option>
            {opcionesPadre().map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setNombre(''); setCategoriaPadreId(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Categoria Padre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categoriasOrdenadas().map(cat => {
              const esHija = !!cat.categoriaPadreId;
              return (
                <tr key={cat.id} className={esHija ? 'bg-gray-50/50' : ''}>
                  <td className="px-4 py-3 text-sm">{cat.id}</td>
                  <td className={`px-4 py-3 text-sm ${esHija ? 'pl-10' : 'font-semibold'}`}>
                    {esHija && <span className="text-gray-400 mr-1">--</span>}
                    {cat.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cat.categoriaPadreNombre ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${cat.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button onClick={() => handleEditar(cat)} className="text-blue-600 hover:underline mr-3">Editar</button>
                    <button onClick={() => onConfirm('categoria', cat.id, cat.nombre)} className="text-red-600 hover:underline">Desactivar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Empresas Tab ────────────────────────────────────────────
const condicionesIva = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'Responsable No Inscripto',
];

const empEmptyForm = {
  razonSocial: '',
  nombreFantasia: '',
  cuit: '',
  condicionIva: '',
  direccionFiscal: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
  telefono: '',
  email: '',
  ingresosBrutos: '',
  inicioActividades: '',
  puntoVenta: '',
};

function EmpresasTab({ onConfirm }: { onConfirm: (tipo: string, id: number, nombre: string) => void }) {
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(empEmptyForm);
  const [editando, setEditando] = useState<EmpresaDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const { sugerencias: sugDirFiscal, buscarDirecciones: buscarDirFiscal } = useGooglePlaces();
  const [mostrarSugDirFiscal, setMostrarSugDirFiscal] = useState(false);

  const cargar = () => getEmpresas().then(setEmpresas);
  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        razonSocial: form.razonSocial,
        nombreFantasia: form.nombreFantasia || undefined,
        cuit: form.cuit,
        condicionIva: form.condicionIva,
        direccionFiscal: form.direccionFiscal || undefined,
        localidad: form.localidad || undefined,
        provincia: form.provincia || undefined,
        codigoPostal: form.codigoPostal || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        ingresosBrutos: form.ingresosBrutos || undefined,
        inicioActividades: form.inicioActividades || undefined,
        puntoVenta: form.puntoVenta ? Number(form.puntoVenta) : undefined,
      };
      if (editando) {
        await actualizarEmpresa(editando.id, { ...data, activa: editando.activa });
        showToast('Empresa actualizada correctamente', 'success');
      } else {
        await crearEmpresa(data);
        showToast('Empresa creada correctamente', 'success');
      }
      setForm(empEmptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar empresa', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (emp: EmpresaDto) => {
    setEditando(emp);
    setForm({
      razonSocial: emp.razonSocial,
      nombreFantasia: emp.nombreFantasia || '',
      cuit: emp.cuit,
      condicionIva: emp.condicionIva,
      direccionFiscal: emp.direccionFiscal || '',
      localidad: emp.localidad || '',
      provincia: emp.provincia || '',
      codigoPostal: emp.codigoPostal || '',
      telefono: emp.telefono || '',
      email: emp.email || '',
      ingresosBrutos: emp.ingresosBrutos || '',
      inicioActividades: emp.inicioActividades || '',
      puntoVenta: emp.puntoVenta ? String(emp.puntoVenta) : '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Empresas</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(empEmptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nueva Empresa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
          <input type="text" value={form.razonSocial} onChange={e => setForm({ ...form, razonSocial: e.target.value })} placeholder="Razon Social" className="border rounded px-3 py-2" required />
          <input type="text" value={form.nombreFantasia} onChange={e => setForm({ ...form, nombreFantasia: e.target.value })} placeholder="Nombre Fantasia" className="border rounded px-3 py-2" />
          <input type="text" value={form.cuit} onChange={e => setForm({ ...form, cuit: e.target.value })} placeholder="CUIT (ej: 20-12345678-9)" className="border rounded px-3 py-2" required />
          <select value={form.condicionIva} onChange={e => setForm({ ...form, condicionIva: e.target.value })} className="border rounded px-3 py-2" required>
            <option value="">Condicion IVA...</option>
            {condicionesIva.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="relative">
            <input type="text" value={form.direccionFiscal} onChange={e => { setForm({ ...form, direccionFiscal: e.target.value }); buscarDirFiscal(e.target.value); setMostrarSugDirFiscal(true); }} onFocus={() => { if (sugDirFiscal.length > 0) setMostrarSugDirFiscal(true); }} onBlur={() => setTimeout(() => setMostrarSugDirFiscal(false), 200)} placeholder="Direccion Fiscal" className="border rounded px-3 py-2 w-full" />
            {mostrarSugDirFiscal && sugDirFiscal.length > 0 && form.direccionFiscal.length >= 3 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {sugDirFiscal.map(s => (
                  <button key={s.placeId} type="button" onClick={() => { setForm({ ...form, direccionFiscal: s.descripcion }); setMostrarSugDirFiscal(false); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0">{s.descripcion}</button>
                ))}
              </div>
            )}
          </div>
          <input type="text" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} placeholder="Localidad" className="border rounded px-3 py-2" />
          <input type="text" value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} placeholder="Provincia" className="border rounded px-3 py-2" />
          <input type="text" value={form.codigoPostal} onChange={e => setForm({ ...form, codigoPostal: e.target.value })} placeholder="Codigo Postal" className="border rounded px-3 py-2" />
          <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="border rounded px-3 py-2" />
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded px-3 py-2" />
          <input type="text" value={form.ingresosBrutos} onChange={e => setForm({ ...form, ingresosBrutos: e.target.value })} placeholder="Ingresos Brutos" className="border rounded px-3 py-2" />
          <input type="date" value={form.inicioActividades} onChange={e => setForm({ ...form, inicioActividades: e.target.value })} placeholder="Inicio Actividades" className="border rounded px-3 py-2" />
          <input type="number" value={form.puntoVenta} onChange={e => setForm({ ...form, puntoVenta: e.target.value })} placeholder="Punto de Venta AFIP" className="border rounded px-3 py-2" />
          <div className="col-span-3 flex gap-2">
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Razon Social</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre Fantasia</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">CUIT</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Condicion IVA</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {empresas.map(emp => (
              <tr key={emp.id}>
                <td className="px-4 py-3 text-sm font-medium">{emp.razonSocial}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.nombreFantasia || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.cuit}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.condicionIva}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(emp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('empresa', emp.id, emp.razonSocial)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay empresas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Locales Tab ─────────────────────────────────────────────
const locEmptyForm = { nombre: '', direccion: '', empresaId: '' as string, esPuntoVenta: false };

function LocalesTab({ onConfirm }: { onConfirm: (tipo: string, id: number, nombre: string) => void }) {
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(locEmptyForm);
  const [editando, setEditando] = useState<LocalDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const { sugerencias: sugDirLocal, buscarDirecciones: buscarDirLocal } = useGooglePlaces();
  const [mostrarSugDirLocal, setMostrarSugDirLocal] = useState(false);

  const cargar = () => getLocales().then(setLocales);
  useEffect(() => { cargar(); getEmpresas().then(setEmpresas); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        direccion: form.direccion || undefined,
        empresaId: form.empresaId ? Number(form.empresaId) : undefined,
        esPuntoVenta: form.esPuntoVenta,
      };
      if (editando) {
        await actualizarLocal(editando.id, { ...data, activo: editando.activo });
        showToast('Local actualizado correctamente', 'success');
      } else {
        await crearLocal(data);
        showToast('Local creado correctamente', 'success');
      }
      setForm(locEmptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar local', 'error');
    } finally {
      setGuardando(false);
    }
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Locales</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(locEmptyForm); }}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {showForm ? 'Cerrar' : 'Nuevo Local'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <div className="relative">
            <input type="text" value={form.direccion} onChange={e => { setForm({ ...form, direccion: e.target.value }); buscarDirLocal(e.target.value); setMostrarSugDirLocal(true); }} onFocus={() => { if (sugDirLocal.length > 0) setMostrarSugDirLocal(true); }} onBlur={() => setTimeout(() => setMostrarSugDirLocal(false), 200)} placeholder="Direccion" className="border rounded px-3 py-2 w-full" />
            {mostrarSugDirLocal && sugDirLocal.length > 0 && form.direccion.length >= 3 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {sugDirLocal.map(s => (
                  <button key={s.placeId} type="button" onClick={() => { setForm({ ...form, direccion: s.descripcion }); setMostrarSugDirLocal(false); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0">{s.descripcion}</button>
                ))}
              </div>
            )}
          </div>
          <select value={form.empresaId} onChange={e => setForm({ ...form, empresaId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Sin empresa</option>
            {empresas.filter(emp => emp.activa).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.esPuntoVenta} onChange={e => setForm({ ...form, esPuntoVenta: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            <span className="text-sm font-medium text-gray-700">Es Punto de Venta</span>
          </label>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
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
                  <button onClick={() => onConfirm('local', loc.id, loc.nombre)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {locales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay locales registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Config Page Principal ───────────────────────────────────
export default function ConfigPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [formasPagoList, setFormasPagoList] = useState<FormaPago[]>([]);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; tipo: string; id: number; nombre: string }>({ visible: false, tipo: '', id: 0, nombre: '' });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState<TabType>('zonas');

  // Zona form
  const [zonaForm, setZonaForm] = useState({ nombre: '', descripcion: '', costoEnvio: 0 });
  const [editandoZona, setEditandoZona] = useState<Zona | null>(null);

  // Repartidor form
  const [repForm, setRepForm] = useState({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' });
  const [editandoRep, setEditandoRep] = useState<Repartidor | null>(null);
  const [zonasAsignar, setZonasAsignar] = useState<number[]>([]);

  // FormaPago form
  const [fpForm, setFpForm] = useState({ nombre: '', porcentajeRecargo: 0, activa: true });
  const [editandoFp, setEditandoFp] = useState<FormaPago | null>(null);
  const [showFpForm, setShowFpForm] = useState(false);

  // Configuracion de Impresion
  const [autoImprimir, setAutoImprimir] = useState(() => localStorage.getItem('autoImprimir') === 'true');
  const [papelTicket, setPapelTicket] = useState(() => localStorage.getItem('papelTicket') || '80mm');

  useEffect(() => {
    localStorage.setItem('autoImprimir', String(autoImprimir));
  }, [autoImprimir]);

  useEffect(() => {
    localStorage.setItem('papelTicket', papelTicket);
  }, [papelTicket]);

  const cargar = () => {
    getZonas().then(setZonas);
    getRepartidores().then(setRepartidores);
    getFormasPago().then(setFormasPagoList);
  };
  useEffect(() => { cargar(); }, []);

  // Zonas handlers
  const handleZonaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoZona) {
        await updateZona(editandoZona.id, { ...zonaForm, activa: editandoZona.activa });
        showToast('Zona actualizada correctamente', 'success');
      } else {
        await createZona(zonaForm);
        showToast('Zona creada correctamente', 'success');
      }
      setZonaForm({ nombre: '', descripcion: '', costoEnvio: 0 }); setEditandoZona(null); cargar();
    } catch {
      showToast('Error al guardar zona', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Repartidor handlers
  const handleRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoRep) {
        await updateRepartidor(editandoRep.id, { ...repForm, activo: editandoRep.activo, codigoAcceso: repForm.codigoAcceso || undefined });
        showToast('Repartidor actualizado correctamente', 'success');
      } else {
        await createRepartidor(repForm);
        showToast('Repartidor creado correctamente', 'success');
      }
      setRepForm({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' }); setEditandoRep(null); cargar();
    } catch {
      showToast('Error al guardar repartidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignarZonas = async (repId: number) => {
    await asignarZonas(repId, zonasAsignar);
    setZonasAsignar([]); cargar();
  };

  // FormaPago handlers
  const handleFpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editandoFp) {
        await updateFormaPago(editandoFp.id, fpForm);
        showToast('Forma de pago actualizada correctamente', 'success');
      } else {
        await createFormaPago(fpForm);
        showToast('Forma de pago creada correctamente', 'success');
      }
      setFpForm({ nombre: '', porcentajeRecargo: 0, activa: true });
      setEditandoFp(null);
      setShowFpForm(false);
      cargar();
    } catch {
      showToast('Error al guardar forma de pago', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Callback para ConfirmModal desde sub-tabs
  const handleSubTabConfirm = (tipo: string, id: number, nombre: string) => {
    setConfirmacion({ visible: true, tipo, id, nombre });
  };

  const handleConfirmacion = async () => {
    const { tipo, id } = confirmacion;
    setGuardando(true);
    try {
      if (tipo === 'zona') await deleteZona(id);
      else if (tipo === 'repartidor') await deleteRepartidor(id);
      else if (tipo === 'formaPago') await deleteFormaPago(id);
      else if (tipo === 'tipoCliente') await eliminarTipoCliente(id);
      else if (tipo === 'categoria') await deleteCategoria(id);
      else if (tipo === 'empresa') await eliminarEmpresa(id);
      else if (tipo === 'local') await eliminarLocal(id);

      const mensajes: Record<string, string> = {
        zona: 'Zona desactivada correctamente',
        repartidor: 'Repartidor desactivado correctamente',
        formaPago: 'Forma de pago eliminada correctamente',
        tipoCliente: 'Tipo de cliente eliminado correctamente',
        categoria: 'Categoria desactivada correctamente',
        empresa: 'Empresa eliminada correctamente',
        local: 'Local eliminado correctamente',
      };
      showToast(mensajes[tipo] || 'Eliminado correctamente', 'success');
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' });
    // Forzar re-render de sub-tabs recargando
    cargar();
    // Para sub-tabs que manejan su propio estado, usamos key trick
    setSubTabKey(k => k + 1);
  };

  const [subTabKey, setSubTabKey] = useState(0);

  const tituloConfirmacion = confirmacion.tipo === 'zona'
    ? 'Desactivar zona'
    : confirmacion.tipo === 'repartidor'
      ? 'Desactivar repartidor'
      : confirmacion.tipo === 'formaPago'
        ? 'Eliminar forma de pago'
        : confirmacion.tipo === 'tipoCliente'
          ? 'Eliminar tipo de cliente'
          : confirmacion.tipo === 'categoria'
            ? 'Desactivar categoria'
            : confirmacion.tipo === 'empresa'
              ? 'Eliminar empresa'
              : 'Eliminar local';

  const mensajeConfirmacion = confirmacion.tipo === 'zona' || confirmacion.tipo === 'repartidor'
    ? `Se desactivara "${confirmacion.nombre}"`
    : confirmacion.tipo === 'categoria'
      ? `Se desactivara la categoria "${confirmacion.nombre}"`
      : `Se eliminara "${confirmacion.nombre}"`;

  const textoBotonConfirmar = (confirmacion.tipo === 'zona' || confirmacion.tipo === 'repartidor' || confirmacion.tipo === 'categoria')
    ? 'Desactivar'
    : 'Eliminar';

  const handleEditarFp = (fp: FormaPago) => {
    setEditandoFp(fp);
    setFpForm({ nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: fp.activa });
    setShowFpForm(true);
  };

  const handleToggleFpActiva = async (fp: FormaPago) => {
    await updateFormaPago(fp.id, { nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: !fp.activa });
    cargar();
  };

  const tabBtn = (key: TabType, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded font-medium ${tab === key ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Configuracion</h2>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabBtn('zonas', 'Zonas')}
        {tabBtn('repartidores', 'Repartidores')}
        {tabBtn('formasPago', 'Formas de Pago')}
        {tabBtn('tiposCliente', 'Tipos de Cliente')}
        {tabBtn('categorias', 'Categorias')}
        {tabBtn('empresas', 'Empresas')}
        {tabBtn('locales', 'Locales')}
      </div>

      {/* Seccion Impresion */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Impresion</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Auto-imprimir al crear pedido</label>
            <button
              onClick={() => setAutoImprimir(!autoImprimir)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoImprimir ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoImprimir ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Tamano de papel</label>
            <select
              value={papelTicket}
              onChange={e => setPapelTicket(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="80mm">80mm</option>
              <option value="58mm">58mm</option>
            </select>
          </div>
        </div>
      </div>

      {tab === 'zonas' && (
        <div>
          <form onSubmit={handleZonaSubmit} className="flex gap-2 mb-6">
            <input type="text" value={zonaForm.nombre} onChange={e => setZonaForm({ ...zonaForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={zonaForm.descripcion} onChange={e => setZonaForm({ ...zonaForm, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2 flex-1" />
            <input type="number" value={zonaForm.costoEnvio} onChange={e => setZonaForm({ ...zonaForm, costoEnvio: Number(e.target.value) })} placeholder="Costo envio" className="border rounded px-3 py-2 w-32" min={0} step={100} />
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editandoZona ? 'Actualizar' : 'Crear')}</button>
          </form>
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripcion</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Costo Envio</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {zonas.map(z => (
                  <tr key={z.id}>
                    <td className="px-4 py-3 text-sm font-medium">{z.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{z.descripcion}</td>
                    <td className="px-4 py-3 text-sm">${z.costoEnvio.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => { setEditandoZona(z); setZonaForm({ nombre: z.nombre, descripcion: z.descripcion || '', costoEnvio: z.costoEnvio }); }} className="text-blue-600 hover:underline mr-3">Editar</button>
                      <button onClick={() => setConfirmacion({ visible: true, tipo: 'zona', id: z.id, nombre: z.nombre })} className="text-red-600 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'repartidores' && (
        <div>
          <form onSubmit={handleRepSubmit} className="flex gap-2 mb-6 flex-wrap">
            <input type="text" value={repForm.nombre} onChange={e => setRepForm({ ...repForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={repForm.telefono} onChange={e => setRepForm({ ...repForm, telefono: e.target.value })} placeholder="Telefono" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.vehiculo} onChange={e => setRepForm({ ...repForm, vehiculo: e.target.value })} placeholder="Vehiculo" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.codigoAcceso} onChange={e => setRepForm({ ...repForm, codigoAcceso: e.target.value })} placeholder="Codigo acceso" className="border rounded px-3 py-2 w-32" required={!editandoRep} />
            <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editandoRep ? 'Actualizar' : 'Crear')}</button>
          </form>
          <div className="space-y-4">
            {repartidores.map(r => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{r.nombre}</h3>
                    <p className="text-sm text-gray-600">{r.vehiculo} | {r.telefono}</p>
                    <p className="text-xs text-gray-400 mt-1">Zonas: {r.zonas.map(z => z.nombre).join(', ') || 'Sin asignar'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditandoRep(r); setRepForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '', codigoAcceso: '' }); }} className="text-sm text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => setConfirmacion({ visible: true, tipo: 'repartidor', id: r.id, nombre: r.nombre })} className="text-sm text-red-600 hover:underline">Desactivar</button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  <div className="flex gap-1 flex-wrap flex-1">
                    {zonas.filter(z => z.activa).map(z => (
                      <label key={z.id} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                        <input type="checkbox" checked={zonasAsignar.includes(z.id) || r.zonas.some(rz => rz.id === z.id)} onChange={e => {
                          const ids = r.zonas.map(rz => rz.id);
                          if (e.target.checked) setZonasAsignar([...new Set([...ids, z.id])]);
                          else setZonasAsignar(ids.filter(id => id !== z.id));
                        }} />
                        {z.nombre}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => handleAsignarZonas(r.id)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">Guardar Zonas</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'formasPago' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Formas de Pago</h2>
            <button
              onClick={() => { setShowFpForm(!showFpForm); setEditandoFp(null); setFpForm({ nombre: '', porcentajeRecargo: 0, activa: true }); }}
              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              {showFpForm ? 'Cerrar' : 'Nueva Forma de Pago'}
            </button>
          </div>

          {showFpForm && (
            <form onSubmit={handleFpSubmit} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={fpForm.nombre} onChange={e => setFpForm({ ...fpForm, nombre: e.target.value })} placeholder="Ej: Efectivo, Tarjeta, MercadoPago" className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recargo (%)</label>
                <input type="number" value={fpForm.porcentajeRecargo} onChange={e => setFpForm({ ...fpForm, porcentajeRecargo: Number(e.target.value) })} className="w-full border rounded px-3 py-2" min={0} max={100} step={0.5} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Activa</label>
                <input type="checkbox" checked={fpForm.activa} onChange={e => setFpForm({ ...fpForm, activa: e.target.checked })} className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={guardando} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editandoFp ? 'Actualizar' : 'Crear')}</button>
                <button type="button" onClick={() => { setShowFpForm(false); setEditandoFp(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Recargo (%)</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Activa</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formasPagoList.map(fp => (
                  <tr key={fp.id} className={!fp.activa ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium">{fp.nombre}</td>
                    <td className="px-4 py-3 text-sm">{fp.porcentajeRecargo}%</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        onClick={() => handleToggleFpActiva(fp)}
                        className={`px-3 py-1 rounded text-xs font-medium ${fp.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {fp.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => handleEditarFp(fp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                      <button onClick={() => setConfirmacion({ visible: true, tipo: 'formaPago', id: fp.id, nombre: fp.nombre })} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {formasPagoList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay formas de pago configuradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tiposCliente' && <TiposClienteTab key={`tc-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'categorias' && <CategoriasTab key={`cat-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'empresas' && <EmpresasTab key={`emp-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'locales' && <LocalesTab key={`loc-${subTabKey}`} onConfirm={handleSubTabConfirm} />}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo={tituloConfirmacion}
        mensaje={mensajeConfirmacion}
        tipo="danger"
        textoConfirmar={textoBotonConfirmar}
        onConfirmar={handleConfirmacion}
        onCancelar={() => setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' })}
      />
    </div>
  );
}
