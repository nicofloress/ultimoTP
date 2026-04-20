import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GastoDto,
  GastoStatsDto,
  getGastos,
  getGastoStats,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
} from '../../api/gastos';
import { getLocales, LocalDto } from '../../api/locales';
import { getFormasPagoActivas } from '../../api/formasPago';
import { FormaPago } from '../../types/ventas';
import { compareBy } from '../../utils/tableSort';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { useGlobalToast } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { formatearMonto } from '../../components/NumericInput';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatMonto(n: number) {
  return formatearMonto(n);
}

type SortDir = 'asc' | 'desc';

export default function GastosPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  // --- Data ---
  const [gastos, setGastos] = useState<GastoDto[]>([]);
  const [stats, setStats] = useState<GastoStatsDto | null>(null);
  const [cargando, setCargando] = useState(false);

  // --- Locales ---
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));

  // --- Formas de pago ---
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  // --- Filtros ---
  const [busquedaNombre, setBusquedaNombre] = useState('');

  // --- Orden ---
  const [ordenCol, setOrdenCol] = useState<string>('fechaGasto');
  const [ordenDir, setOrdenDir] = useState<SortDir>('desc');

  // --- Formulario ---
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formFechaGasto, setFormFechaGasto] = useState(getHoy());
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formProveedor, setFormProveedor] = useState('Sin proveedor');
  const [formEtiqueta, setFormEtiqueta] = useState('');
  const [formFormaPagoId, setFormFormaPagoId] = useState<number | ''>('');
  const [formSubtotal, setFormSubtotal] = useState<string>('');
  const [formIva, setFormIva] = useState<string>('0');
  const [formTotal, setFormTotal] = useState<string>('');
  const [formObservaciones, setFormObservaciones] = useState('');

  // --- Confirm delete ---
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // --- Load catalogos ---
  useEffect(() => {
    getLocales().then(setLocales).catch(() => {});
    getFormasPagoActivas().then(setFormasPago).catch(() => {});
  }, []);

  // --- Cargar gastos ---
  const cargarGastos = useCallback(async () => {
    setCargando(true);
    try {
      const localId = localSeleccionado === 0 ? undefined : localSeleccionado;
      const [data, statsData] = await Promise.all([
        getGastos(localId),
        getGastoStats(localId),
      ]);
      setGastos(data);
      setStats(statsData);
    } catch {
      showToast('Error al cargar gastos', 'error');
    } finally {
      setCargando(false);
    }
  }, [localSeleccionado, showToast]);

  // Cargar al montar solo
  useEffect(() => {
    cargarGastos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Auto-calcular total ---
  useEffect(() => {
    const sub = parseFloat(formSubtotal) || 0;
    const iva = parseFloat(formIva) || 0;
    setFormTotal(String(sub + iva));
  }, [formSubtotal, formIva]);

  // --- Filtrado y orden ---
  const gastosFiltrados = useMemo(() => {
    let lista = [...gastos];
    if (busquedaNombre.trim()) {
      const q = busquedaNombre.toLowerCase();
      lista = lista.filter(g => g.nombre.toLowerCase().includes(q));
    }
    lista.sort((a, b) => compareBy(a, b, ordenCol, ordenDir));
    return lista;
  }, [gastos, busquedaNombre, ordenCol, ordenDir]);

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrdenCol(col);
      setOrdenDir('asc');
    }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? (
      <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
    ) : null;

  // --- Form handlers ---
  const resetForm = () => {
    setFormNombre('');
    setFormFechaGasto(getHoy());
    setFormFechaVencimiento('');
    setFormCategoria('');
    setFormProveedor('Sin proveedor');
    setFormEtiqueta('');
    setFormFormaPagoId('');
    setFormSubtotal('');
    setFormIva('0');
    setFormTotal('');
    setFormObservaciones('');
    setEditandoId(null);
  };

  const abrirForm = () => {
    resetForm();
    setMostrarForm(true);
  };

  const editarGasto = (g: GastoDto) => {
    setEditandoId(g.id);
    setFormNombre(g.nombre);
    setFormFechaGasto(g.fechaGasto ? g.fechaGasto.substring(0, 10) : getHoy());
    setFormFechaVencimiento(g.fechaVencimiento ? g.fechaVencimiento.substring(0, 10) : '');
    setFormCategoria(g.categoria || '');
    setFormProveedor(g.proveedor || 'Sin proveedor');
    setFormEtiqueta(g.etiqueta || '');
    setFormFormaPagoId(g.formaPagoId || '');
    setFormSubtotal(String(g.subtotal));
    setFormIva(String(g.iva));
    setFormTotal(String(g.total));
    setFormObservaciones(g.observaciones || '');
    setMostrarForm(true);
  };

  const guardarGasto = async () => {
    if (!formNombre.trim()) {
      showToast('El nombre del gasto es obligatorio', 'error');
      return;
    }
    if (!formSubtotal || parseFloat(formSubtotal) <= 0) {
      showToast('El subtotal debe ser mayor a 0', 'error');
      return;
    }
    setGuardando(true);
    try {
      const data = {
        nombre: formNombre.trim(),
        fechaGasto: formFechaGasto,
        fechaVencimiento: formFechaVencimiento || undefined,
        categoria: formCategoria || undefined,
        proveedor: formProveedor || undefined,
        etiqueta: formEtiqueta || undefined,
        formaPagoId: formFormaPagoId !== '' ? (formFormaPagoId as number) : undefined,
        subtotal: parseFloat(formSubtotal) || 0,
        iva: parseFloat(formIva) || 0,
        total: parseFloat(formTotal) || 0,
        observaciones: formObservaciones || undefined,
        localId: esSuperAdmin ? (localSeleccionado === 0 ? undefined : localSeleccionado) : localDelUsuario,
      };
      if (editandoId) {
        await actualizarGasto(editandoId, data);
        showToast('Gasto actualizado correctamente', 'success');
      } else {
        await crearGasto(data);
        showToast('Gasto creado correctamente', 'success');
      }
      setMostrarForm(false);
      resetForm();
      cargarGastos();
    } catch {
      showToast('Error al guardar el gasto', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarGasto(id);
      showToast('Gasto eliminado correctamente', 'success');
      cargarGastos();
    } catch {
      showToast('Error al eliminar el gasto', 'error');
    }
    setConfirmDelete(null);
  };

  // --- Columnas ---
  const columnas: { key: string; label: string }[] = [
    { key: 'fechaGasto', label: 'Fecha' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'formaPagoNombre', label: 'Metodo de Pago' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'deuda', label: 'Deuda' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'iva', label: 'IVA' },
    { key: 'total', label: 'Total' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Gastos</h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</div>
              <div className="text-xl font-bold text-gray-800">{stats.cantidadGastos}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">P</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Gastos Pagos</div>
              <div className="text-xl font-bold text-green-600">{formatMonto(stats.gastosPagados)}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold text-lg">D</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Gastos Adeudados</div>
              <div className="text-xl font-bold text-red-600">{formatMonto(stats.gastosAdeudados)}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 font-bold text-lg">$</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Gastos Totales</div>
              <div className="text-xl font-bold text-gray-800">{formatMonto(stats.gastosTotal)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            {editandoId ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nombre del gasto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`${inputClass} w-full`}
                value={formNombre}
                onChange={e => setFormNombre(e.target.value)}
                placeholder="Ej: Alquiler local"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fecha de gasto <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`${inputClass} w-full`}
                value={formFechaGasto}
                onChange={e => setFormFechaGasto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de vencimiento</label>
              <input
                type="date"
                className={`${inputClass} w-full`}
                value={formFechaVencimiento}
                onChange={e => setFormFechaVencimiento(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
              <input
                type="text"
                className={`${inputClass} w-full`}
                value={formCategoria}
                onChange={e => setFormCategoria(e.target.value)}
                placeholder="Ej: Servicios"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Proveedor</label>
              <input
                type="text"
                className={`${inputClass} w-full`}
                value={formProveedor}
                onChange={e => setFormProveedor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta</label>
              <input
                type="text"
                className={`${inputClass} w-full`}
                value={formEtiqueta}
                onChange={e => setFormEtiqueta(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Forma de Pago</label>
              <select
                className={`${selectClass} w-full`}
                value={formFormaPagoId}
                onChange={e => setFormFormaPagoId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Sin especificar</option>
                {formasPago.map(fp => (
                  <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Monto / Subtotal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} w-full`}
                value={formSubtotal}
                onChange={e => setFormSubtotal(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">IVA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} w-full`}
                value={formIva}
                onChange={e => setFormIva(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} w-full bg-gray-50`}
                value={formTotal}
                onChange={e => setFormTotal(e.target.value)}
                placeholder="Calculado automaticamente"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
              <textarea
                className={`${inputClass} w-full`}
                rows={2}
                value={formObservaciones}
                onChange={e => setFormObservaciones(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => { setMostrarForm(false); resetForm(); }}
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarGasto}
              disabled={guardando}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select
                className={selectClass + ' w-full'}
                value={localSeleccionado}
                onChange={e => setLocalSeleccionado(Number(e.target.value))}
              >
                <option value={0}>Todos los locales</option>
                {locales.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por nombre</label>
            <input
              type="text"
              className={`${inputClass} w-full`}
              value={busquedaNombre}
              onChange={e => setBusquedaNombre(e.target.value)}
              placeholder="Nombre del gasto..."
            />
          </div>
          <button
            onClick={cargarGastos}
            disabled={cargando}
            className="px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1.5"
          >
            {cargando ? (
              <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { if (mostrarForm && !editandoId) { setMostrarForm(false); } else { abrirForm(); } }}
            className="px-2.5 py-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar Gasto
          </button>
          {gastosFiltrados.length > 0 && (
            <div className="flex gap-2 ml-3 pl-3 border-l border-gray-300">
              <button
                onClick={() => {
                  const sep = ';';
                  const localNombre = localSeleccionado === 0
                    ? 'Todos los locales'
                    : (locales.find(l => l.id === localSeleccionado)?.nombre || 'Local');
                  const header = `Gastos - ${localNombre}\n\n`;
                  const colHeaders = `Fecha${sep}Nombre${sep}Metodo Pago${sep}Proveedor${sep}Categoria${sep}Deuda${sep}Subtotal${sep}IVA${sep}Total\n`;
                  const rows = gastosFiltrados.map(g =>
                    `${formatFecha(g.fechaGasto)}${sep}${g.nombre}${sep}${g.formaPagoNombre || '-'}${sep}${g.proveedor || '-'}${sep}${g.categoria || '-'}${sep}${g.deuda}${sep}${g.subtotal}${sep}${g.iva}${sep}${g.total}`
                  ).join('\n');
                  const bom = '\uFEFF';
                  const blob = new Blob([bom + header + colHeaders + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `gastos_${localNombre.replace(/\s+/g, '_')}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2.5 py-1.5 text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 flex items-center gap-1"
                title="Exportar Excel"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 13.5h1.2l.8 1.3.8-1.3h1.2l-1.4 2 1.4 2h-1.2l-.8-1.3-.8 1.3H9.5l1.4-2-1.4-2z" />
                </svg>
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columnas.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 transition-colors"
                  onClick={() => toggleOrden(col.key)}
                >
                  {col.label}
                  <SortArrow col={col.key} />
                </th>
              ))}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={columnas.length + 1} className="text-center py-8 text-gray-400">
                  Cargando gastos...
                </td>
              </tr>
            ) : gastosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length + 1} className="text-center py-8 text-gray-400">
                  No se encontraron gastos
                </td>
              </tr>
            ) : (
              gastosFiltrados.map((g, idx) => (
                <tr
                  key={g.id}
                  className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${
                    idx % 2 === 1 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{formatFecha(g.fechaGasto)}</td>
                  <td className="px-3 py-2">{g.nombre}</td>
                  <td className="px-3 py-2">{g.formaPagoNombre || '-'}</td>
                  <td className="px-3 py-2">{g.proveedor || '-'}</td>
                  <td className="px-3 py-2">{g.categoria || '-'}</td>
                  <td className={`px-3 py-2 whitespace-nowrap font-semibold ${g.deuda > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMonto(g.deuda)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatMonto(g.subtotal)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatMonto(g.iva)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{formatMonto(g.total)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => editarGasto(g)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(g.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        visible={confirmDelete !== null}
        titulo="Eliminar Gasto"
        mensaje="¿Estas seguro de que deseas eliminar este gasto? Esta accion no se puede deshacer."
        tipo="danger"
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={() => { if (confirmDelete !== null) handleEliminar(confirmDelete); }}
        onCancelar={() => setConfirmDelete(null)}
      />
    </div>
  );
}
