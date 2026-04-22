import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MovimientoDto,
  getMovimientosPorLocal,
  crearCompra,
  editarCompra,
  eliminarCompra,
} from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { getLocales, LocalDto } from '../../api/locales';
import { Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { compareBy } from '../../utils/tableSort';
import ProductoSelect from '../../components/ProductoSelect';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  const f = fecha.endsWith('Z') || fecha.includes('+') ? fecha : fecha + 'Z';
  return new Date(f).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatMonto(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

type SortDir = 'asc' | 'desc';

export default function ComprasPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  // --- Data ---
  const [movimientos, setMovimientos] = useState<MovimientoDto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);

  // --- Locales ---
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));

  // --- Filtros ---
  const [fechaDesde, setFechaDesde] = useState(getHoy());
  const [fechaHasta, setFechaHasta] = useState(getHoy());
  const [filtroProducto, setFiltroProducto] = useState<number | ''>('');

  // --- Orden ---
  const [ordenCol, setOrdenCol] = useState<string>('fechaMovimiento');
  const [ordenDir, setOrdenDir] = useState<SortDir>('desc');

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formProductoId, setFormProductoId] = useState<number | ''>('');
  const [formBultos, setFormBultos] = useState<string>('');
  const [formPrecioBulto, setFormPrecioBulto] = useState<string>('');
  const [formFecha, setFormFecha] = useState(getHoy());
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formImpactarCaja, setFormImpactarCaja] = useState(false);
  const [formModo, setFormModo] = useState<'bultos' | 'unidades'>('bultos');
  const [formLocalId, setFormLocalId] = useState<number>(localDelUsuario || 1);

  // --- Confirmar eliminar ---
  const [confirmEliminar, setConfirmEliminar] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  // --- Load catalogos ---
  useEffect(() => {
    getProductos().then(setProductos).catch(() => {});
    getLocales().then(setLocales).catch(() => {});
  }, []);

  // --- Producto seleccionado ---
  const productoSeleccionado = useMemo(() => {
    if (formProductoId === '') return null;
    return productos.find(p => p.id === formProductoId) || null;
  }, [formProductoId, productos]);

  const unidadesPorBulto = productoSeleccionado?.unidadesPorBulto || 1;
  const unidadMinima = productoSeleccionado?.unidadMinima || 1;
  const cantidadInput = parseFloat(formBultos) || 0;
  const precioInput = parseFloat(formPrecioBulto) || 0;

  // Cálculos según modo
  const bultos = formModo === 'bultos' ? cantidadInput : (unidadesPorBulto > 0 ? cantidadInput / unidadesPorBulto : cantidadInput);
  const precioBulto = formModo === 'bultos' ? precioInput : precioInput * unidadesPorBulto;
  const totalPaquetes = formModo === 'bultos' ? cantidadInput * unidadesPorBulto : cantidadInput;
  const totalUnidades = totalPaquetes * unidadMinima;
  const precioUnitarioPaq = unidadesPorBulto > 0 ? precioBulto / unidadesPorBulto : 0;
  const montoTotalForm = formModo === 'bultos' ? cantidadInput * precioInput : cantidadInput * precioInput;

  // --- Cargar movimientos ---
  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    try {
      const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
      let data: MovimientoDto[];
      if (localSeleccionado === 0) {
        const promises = locales.map(l => getMovimientosPorLocal(l.id, fechaDesde, hasta));
        const results = await Promise.all(promises);
        data = results.flat().sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime());
      } else {
        data = await getMovimientosPorLocal(localSeleccionado, fechaDesde, hasta);
      }
      setMovimientos(data.filter(m => m.codigoAccionCodigo === 'ING_CMP'));
    } catch {
      showToast('Error al cargar compras', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, localSeleccionado, locales, showToast]);

  useEffect(() => { cargarMovimientos(); }, [cargarMovimientos]);

  // --- Filtrado local ---
  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];
    if (filtroProducto !== '') lista = lista.filter(m => m.productoId === filtroProducto);
    lista.sort((a, b) => compareBy(a, b, ordenCol, ordenDir));
    return lista;
  }, [movimientos, filtroProducto, ordenCol, ordenDir]);

  const montoTotal = useMemo(() => movimientosFiltrados.reduce((s, m) => s + m.montoTotal, 0), [movimientosFiltrados]);

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span> : null;

  // --- Modal handlers ---
  const abrirModalNueva = () => {
    setEditandoId(null);
    setFormProductoId('');
    setFormBultos('');
    setFormPrecioBulto('');
    setFormFecha(getHoy());
    setFormObservaciones('');
    setFormImpactarCaja(false);
    setFormModo('bultos');
    setFormLocalId(localSeleccionado || localDelUsuario || 1);
    setModalOpen(true);
  };

  const abrirModalEditar = (m: MovimientoDto) => {
    setEditandoId(m.id);
    setFormProductoId(m.productoId || '');
    // Intentar extraer bultos de las observaciones (formato: "X bultos x Y paq/bulto = Z paq.")
    const prod = productos.find(p => p.id === m.productoId);
    const upb = prod?.unidadesPorBulto || 1;
    const bultosCalc = upb > 0 ? Math.round(m.cantidad / upb) : m.cantidad;
    const precioBultoCalc = m.precioUnitario * upb;
    setFormBultos(String(bultosCalc));
    setFormPrecioBulto(String(Math.round(precioBultoCalc * 100) / 100));
    setFormFecha(m.fechaMovimiento.split('T')[0]);
    // Extraer observaciones del usuario (después del ". ")
    const obsMatch = m.observaciones?.match(/\. (.+)$/);
    setFormObservaciones(obsMatch ? obsMatch[1] : (m.observaciones || ''));
    setFormImpactarCaja(false);
    setFormModo('bultos');
    setFormLocalId(m.localId);
    setModalOpen(true);
  };

  const guardarCompra = async () => {
    if (formProductoId === '' || !formBultos || !formPrecioBulto) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    if (bultos <= 0 || precioBulto <= 0) {
      showToast('La cantidad y el precio deben ser mayores a 0', 'error');
      return;
    }
    if (formFecha > getHoy()) {
      showToast('La fecha no puede ser futura', 'error');
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await editarCompra(editandoId, {
          cantidadBultos: bultos,
          precioPorBulto: precioBulto,
          fechaMovimiento: formFecha,
          observaciones: formObservaciones || undefined,
          impactarEnCaja: formImpactarCaja,
        });
        showToast('Compra actualizada correctamente', 'success');
      } else {
        await crearCompra({
          productoId: formProductoId as number,
          localId: formLocalId,
          cantidadBultos: bultos,
          precioPorBulto: precioBulto,
          fechaMovimiento: formFecha,
          observaciones: formObservaciones || undefined,
          impactarEnCaja: formImpactarCaja,
        });
        showToast('Compra registrada correctamente', 'success');
      }
      setModalOpen(false);
      cargarMovimientos();
    } catch {
      showToast('Error al guardar compra', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarCompra(confirmEliminar.id);
      showToast('Compra eliminada correctamente', 'success');
      cargarMovimientos();
    } catch {
      showToast('Error al eliminar compra', 'error');
    }
    setConfirmEliminar({ visible: false, id: 0 });
  };

  // Extraer info de bultos de observaciones
  const parseBultosInfo = (obs: string | undefined) => {
    if (!obs) return null;
    const match = obs.match(/^(\d+) bultos? x (\d+) paq\/bulto = (\d+) paq/);
    return match ? { bultos: parseInt(match[1]), paqBulto: parseInt(match[2]), totalPaq: parseInt(match[3]) } : null;
  };

  const columnas = [
    { key: 'fechaMovimiento', label: 'Fecha/Hora' },
    { key: 'localNombre', label: 'Local' },
    { key: 'productoNombre', label: 'Producto' },
    { key: 'cantidad', label: 'Bultos / Paq.' },
    { key: 'precioUnitario', label: 'Precio Bulto' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'usuarioNombre', label: 'Usuario' },
    { key: 'observaciones', label: 'Obs.' },
    { key: 'acciones', label: 'Acciones' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Compras de Mercaderia</h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select className={selectClass + ' w-full'} value={localSeleccionado} onChange={e => setLocalSeleccionado(Number(e.target.value))}>
                <option value={0}>Todos los locales</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
            <input type="date" className={inputClass} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
            <input type="date" className={inputClass} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
            <select className={selectClass} value={filtroProducto} onChange={e => setFiltroProducto(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">Todos</option>
              {productos.filter(p => p.activo).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <button onClick={cargarMovimientos} className="px-4 py-1.5 text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm font-semibold">Buscar</button>
          <button onClick={abrirModalNueva} className="px-4 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nueva Compra
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columnas.map(col => (
                <th key={col.key} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200" onClick={() => col.key !== 'acciones' && toggleOrden(col.key)}>
                  {col.label}
                  {col.key !== 'acciones' && <SortArrow col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={columnas.length} className="text-center py-8 text-gray-400">Cargando compras...</td></tr>
            ) : movimientosFiltrados.length === 0 ? (
              <tr><td colSpan={columnas.length} className="text-center py-8 text-gray-400">No se encontraron compras</td></tr>
            ) : (
              movimientosFiltrados.map((m, idx) => {
                const bInfo = parseBultosInfo(m.observaciones ?? undefined);
                const prod = productos.find(p => p.id === m.productoId);
                const upb = prod?.unidadesPorBulto || 1;
                const bultosDisplay = bInfo ? bInfo.bultos : Math.round(m.cantidad / upb);
                const precioBultoDisplay = m.precioUnitario * upb;
                return (
                  <tr key={m.id} className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatFecha(m.fechaMovimiento)}</td>
                    <td className="px-3 py-2">{m.localNombre}</td>
                    <td className="px-3 py-2">{m.productoNombre || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-semibold text-green-600">{bultosDisplay} bultos</span>
                      <span className="text-gray-400 text-xs ml-1">({m.cantidad} paq. / {m.cantidad * (prod?.unidadMinima || 1)} un.)</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMonto(precioBultoDisplay)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">{formatMonto(m.montoTotal)}</td>
                    <td className="px-3 py-2">{m.usuarioNombre || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[150px] truncate">
                      {bInfo && m.observaciones ? m.observaciones.replace(/^\d+ bultos? x \d+ paq\/bulto = \d+ paq\.\s*/, '') || '-' : (m.observaciones || '-')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => abrirModalEditar(m)} className="text-blue-600 hover:underline text-xs mr-2">Editar</button>
                      <button onClick={() => setConfirmEliminar({ visible: true, id: m.id })} className="text-red-600 hover:underline text-xs">Eliminar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-slate-500 to-slate-700 rounded-lg shadow p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total compras:</span>
          <span className="text-sm font-bold text-white">{movimientosFiltrados.length}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Monto total:</span>
          <span className="text-sm font-bold text-green-400">{formatMonto(montoTotal)}</span>
        </div>
      </div>

      {/* Modal Nueva/Editar Compra */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200 bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">{editandoId ? 'Editar Compra' : 'Nueva Compra'}</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Producto */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Producto <span className="text-red-500">*</span></label>
                <ProductoSelect
                  productos={productos}
                  value={formProductoId}
                  onChange={setFormProductoId}
                  disabled={!!editandoId}
                  renderSuffix={p => `(${p.unidadesPorBulto} paq/bulto)`}
                />
              </div>

              {/* Local destino */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Local destino <span className="text-red-500">*</span></label>
                {esSuperAdmin ? (
                  <select className={`${selectClass} w-full`} value={formLocalId} onChange={e => setFormLocalId(Number(e.target.value))} disabled={!!editandoId}>
                    {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                ) : (
                  <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                    {locales.find(l => l.id === formLocalId)?.nombre || 'Mi Local'}
                  </div>
                )}
              </div>

              {/* Info bulto */}
              {productoSeleccionado && (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-700">
                  1 bulto = <strong>{unidadesPorBulto} paquetes</strong> de {unidadMinima} un. c/u
                  ({unidadesPorBulto * unidadMinima} unidades por bulto)
                </div>
              )}

              {/* Toggle Bultos / Paquetes */}
              <div className="flex gap-1 bg-gray-100 rounded-md p-0.5 w-fit">
                <button type="button" onClick={() => { setFormModo('bultos'); setFormBultos(''); setFormPrecioBulto(''); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${formModo === 'bultos' ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  Bultos
                </button>
                <button type="button" onClick={() => { setFormModo('unidades'); setFormBultos(''); setFormPrecioBulto(''); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${formModo === 'unidades' ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  Paquetes
                </button>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {formModo === 'bultos' ? 'Cantidad de Bultos' : 'Cantidad de Paquetes'} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" className={`${inputClass} w-full`} value={formBultos} onChange={e => setFormBultos(e.target.value)} min="1" step="1" />
                  {cantidadInput > 0 && productoSeleccionado && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formModo === 'bultos'
                        ? <span>= <strong className="text-blue-600">{totalPaquetes} paquetes</strong> / <strong className="text-blue-600">{totalUnidades} unidades</strong></span>
                        : <span>= <strong className="text-blue-600">{Math.ceil(cantidadInput / unidadesPorBulto)} bultos</strong> / <strong className="text-blue-600">{totalUnidades} unidades</strong></span>
                      }
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {formModo === 'bultos' ? 'Precio por Bulto' : 'Precio por Paquete'} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" className={`${inputClass} w-full`} value={formPrecioBulto} onChange={e => setFormPrecioBulto(e.target.value)} min="0" step="100" />
                </div>
              </div>

              {/* Resumen cálculo */}
              {cantidadInput > 0 && precioInput > 0 && productoSeleccionado && (
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm space-y-1">
                  {formModo === 'bultos' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paquetes:</span>
                      <span className="font-semibold">{cantidadInput} bultos x {unidadesPorBulto} paq = <strong>{totalPaquetes} paq.</strong></span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unidades totales:</span>
                    <span className="font-bold text-blue-700">{totalUnidades} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio por paquete:</span>
                    <span className="font-semibold">{formatMonto(precioUnitarioPaq)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-300 pt-1 mt-1">
                    <span className="text-gray-700 font-semibold">Total:</span>
                    <span className="font-bold text-lg text-amber-700">{formatMonto(montoTotalForm)}</span>
                  </div>
                </div>
              )}

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
                <input type="date" className={`${inputClass} w-full`} value={formFecha} onChange={e => setFormFecha(e.target.value)} max={getHoy()} />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                <textarea className={`${inputClass} w-full`} rows={2} value={formObservaciones} onChange={e => setFormObservaciones(e.target.value)} />
              </div>

              {/* Impactar en caja */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                <input
                  type="checkbox"
                  id="impactarCaja"
                  checked={formImpactarCaja}
                  onChange={e => setFormImpactarCaja(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="impactarCaja" className="text-sm text-gray-700 font-medium">
                  Registrar egreso en caja diaria
                </label>
                <span className="text-xs text-gray-400 ml-1">(descuenta de la caja abierta del local)</span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-amber-50 rounded-b-lg flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={guardarCompra} disabled={guardando} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        visible={confirmEliminar.visible}
        titulo="Eliminar compra"
        mensaje="Se revertira el stock y el egreso de caja si existiera. ¿Confirmar?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={handleEliminar}
        onCancelar={() => setConfirmEliminar({ visible: false, id: 0 })}
      />
    </div>
  );
}
