import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MovimientoDto,
  getMovimientosPorLocal,
  crearMovimiento,
} from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { getLocales, LocalDto } from '../../api/locales';
import { Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';

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
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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
  const [guardando, setGuardando] = useState(false);
  const [formProductoId, setFormProductoId] = useState<number | ''>('');
  const [formCantidad, setFormCantidad] = useState<string>('');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<string>('');
  const [formFecha, setFormFecha] = useState(getHoy());
  const [formObservaciones, setFormObservaciones] = useState('');

  // --- Load catalogos ---
  useEffect(() => {
    getProductos().then(setProductos).catch(() => {});
    getLocales().then(setLocales).catch(() => {});
  }, []);

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
      // Filtrar solo compras (ING_CMP)
      setMovimientos(data.filter(m => m.codigoAccionCodigo === 'ING_CMP'));
    } catch (err) {
      console.error('Error cargando compras:', err);
      showToast('Error al cargar compras', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, localSeleccionado, locales, showToast]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  // --- Filtrado local ---
  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];
    if (filtroProducto !== '') {
      lista = lista.filter((m) => m.productoId === filtroProducto);
    }
    lista.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[ordenCol];
      const valB = (b as unknown as Record<string, unknown>)[ordenCol];
      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') cmp = valA.localeCompare(valB);
      else if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
      else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
      return ordenDir === 'asc' ? cmp : -cmp;
    });
    return lista;
  }, [movimientos, filtroProducto, ordenCol, ordenDir]);

  // --- Resumen ---
  const montoTotal = useMemo(
    () => movimientosFiltrados.reduce((s, m) => s + m.montoTotal, 0),
    [movimientosFiltrados]
  );

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrdenCol(col);
      setOrdenDir('asc');
    }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? (
      <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
    ) : null;

  // --- Modal handlers ---
  const abrirModal = () => {
    setFormProductoId('');
    setFormCantidad('');
    setFormPrecioUnitario('');
    setFormFecha(getHoy());
    setFormObservaciones('');
    setModalOpen(true);
  };

  const guardarMovimiento = async () => {
    if (formProductoId === '' || !formCantidad || !formPrecioUnitario) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    if (formFecha > getHoy()) {
      showToast('La fecha no puede ser futura', 'error');
      return;
    }
    setGuardando(true);
    try {
      await crearMovimiento({
        codigoAccionId: 3, // ING_CMP
        productoId: formProductoId as number,
        localId: localSeleccionado || (localDelUsuario || 1),
        cantidad: parseFloat(formCantidad),
        precioUnitario: parseFloat(formPrecioUnitario),
        fechaMovimiento: formFecha,
        observaciones: formObservaciones || undefined,
      });
      showToast('Compra registrada correctamente', 'success');
      setModalOpen(false);
      cargarMovimientos();
    } catch (err) {
      console.error('Error creando compra:', err);
      showToast('Error al registrar compra', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // --- Columnas de la tabla ---
  const columnas: { key: string; label: string }[] = [
    { key: 'fechaMovimiento', label: 'Fecha' },
    { key: 'localNombre', label: 'Local' },
    { key: 'productoNombre', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'precioUnitario', label: 'Precio Unit.' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'usuarioNombre', label: 'Usuario' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Compras</h2>
      </div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select
                className={selectClass + ' w-full'}
                value={localSeleccionado}
                onChange={(e) => setLocalSeleccionado(Number(e.target.value))}
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Desde</label>
            <input
              type="date"
              className={inputClass}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Hasta</label>
            <input
              type="date"
              className={inputClass}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
            <select
              className={selectClass}
              value={filtroProducto}
              onChange={(e) =>
                setFiltroProducto(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={cargarMovimientos}
            className="px-4 py-1.5 text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
          <button
            onClick={abrirModal}
            className="px-4 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
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
              {columnas.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 transition-colors"
                  onClick={() => toggleOrden(col.key)}
                >
                  {col.label}
                  <SortArrow col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  Cargando compras...
                </td>
              </tr>
            ) : movimientosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  No se encontraron compras
                </td>
              </tr>
            ) : (
              movimientosFiltrados.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${
                    idx % 2 === 1 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{formatFecha(m.fechaMovimiento)}</td>
                  <td className="px-3 py-2">{m.localNombre}</td>
                  <td className="px-3 py-2">{m.productoNombre || '-'}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap text-green-600">+{m.cantidad}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatMonto(m.precioUnitario)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{formatMonto(m.montoTotal)}</td>
                  <td className="px-3 py-2">{m.usuarioNombre || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                    {m.observaciones || '-'}
                  </td>
                </tr>
              ))
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

      {/* Modal Nueva Compra */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">Nueva Compra</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Producto <span className="text-red-500">*</span>
                </label>
                <select
                  className={`${selectClass} w-full`}
                  value={formProductoId}
                  onChange={(e) =>
                    setFormProductoId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">Seleccionar...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`${inputClass} w-full`}
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Precio Unitario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`${inputClass} w-full`}
                    value={formPrecioUnitario}
                    onChange={(e) => setFormPrecioUnitario(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Fecha Movimiento
                </label>
                <input
                  type="date"
                  className={`${inputClass} w-full`}
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  max={getHoy()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Observaciones
                </label>
                <textarea
                  className={`${inputClass} w-full`}
                  rows={3}
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-amber-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarMovimiento}
                disabled={guardando}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
