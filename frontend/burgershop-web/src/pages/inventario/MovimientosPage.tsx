import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MovimientoDto,
  CodigoAccion,
  getCodigosAccion,
  getMovimientosPorLocal,
  crearMovimiento,
} from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonto(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

type SortDir = 'asc' | 'desc';

export default function MovimientosPage() {
  const { showToast } = useGlobalToast();

  // --- Data ---
  const [movimientos, setMovimientos] = useState<MovimientoDto[]>([]);
  const [codigosAccion, setCodigosAccion] = useState<CodigoAccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);

  // --- Filtros ---
  const [fechaDesde, setFechaDesde] = useState(getHoy());
  const [fechaHasta, setFechaHasta] = useState(getHoy());
  const [filtroCodigoAccion, setFiltroCodigoAccion] = useState<number | ''>('');
  const [filtroProducto, setFiltroProducto] = useState<number | ''>('');

  // --- Orden ---
  const [ordenCol, setOrdenCol] = useState<string>('fechaMovimiento');
  const [ordenDir, setOrdenDir] = useState<SortDir>('desc');

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formCodigoAccionId, setFormCodigoAccionId] = useState<number | ''>('');
  const [formProductoId, setFormProductoId] = useState<number | ''>('');
  const [formCantidad, setFormCantidad] = useState<string>('');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<string>('');
  const [formFecha, setFormFecha] = useState(getHoy());
  const [formObservaciones, setFormObservaciones] = useState('');

  // --- Load catálogos ---
  useEffect(() => {
    getCodigosAccion().then(setCodigosAccion).catch(() => {});
    getProductos().then(setProductos).catch(() => {});
  }, []);

  // --- Cargar movimientos ---
  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    try {
      const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
      const data = await getMovimientosPorLocal(1, fechaDesde, hasta);
      setMovimientos(data);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      showToast('Error al cargar movimientos', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, showToast]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  // --- Filtrado local ---
  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];
    if (filtroCodigoAccion !== '') {
      lista = lista.filter((m) => m.codigoAccionId === filtroCodigoAccion);
    }
    if (filtroProducto !== '') {
      lista = lista.filter((m) => m.productoId === filtroProducto);
    }
    // Ordenar
    lista.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[ordenCol];
      const valB = (b as Record<string, unknown>)[ordenCol];
      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') cmp = valA.localeCompare(valB);
      else if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
      else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
      return ordenDir === 'asc' ? cmp : -cmp;
    });
    return lista;
  }, [movimientos, filtroCodigoAccion, filtroProducto, ordenCol, ordenDir]);

  // --- Resumen ---
  const totalIngresos = useMemo(
    () => movimientosFiltrados.filter((m) => m.signo > 0).reduce((s, m) => s + m.montoTotal, 0),
    [movimientosFiltrados]
  );
  const totalEgresos = useMemo(
    () => movimientosFiltrados.filter((m) => m.signo < 0).reduce((s, m) => s + Math.abs(m.montoTotal), 0),
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
    setFormCodigoAccionId('');
    setFormProductoId('');
    setFormCantidad('');
    setFormPrecioUnitario('');
    setFormFecha(getHoy());
    setFormObservaciones('');
    setModalOpen(true);
  };

  const guardarMovimiento = async () => {
    if (formCodigoAccionId === '' || !formCantidad || !formPrecioUnitario) {
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
        codigoAccionId: formCodigoAccionId as number,
        productoId: formProductoId !== '' ? (formProductoId as number) : undefined,
        localId: 1,
        cantidad: parseFloat(formCantidad),
        precioUnitario: parseFloat(formPrecioUnitario),
        fechaMovimiento: formFecha,
        observaciones: formObservaciones || undefined,
      });
      showToast('Movimiento creado correctamente', 'success');
      setModalOpen(false);
      cargarMovimientos();
    } catch (err) {
      console.error('Error creando movimiento:', err);
      showToast('Error al crear movimiento', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // --- Columnas de la tabla ---
  const columnas: { key: string; label: string }[] = [
    { key: 'fechaMovimiento', label: 'Fecha Mov.' },
    { key: 'fechaProceso', label: 'Fecha Proceso' },
    { key: 'codigoAccionCodigo', label: 'Codigo' },
    { key: 'codigoAccionNombre', label: 'Descripcion' },
    { key: 'productoNombre', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'precioUnitario', label: 'Precio Unit.' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'numeroTicket', label: 'Pedido' },
    { key: 'usuarioNombre', label: 'Usuario' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Movimientos de Inventario</h2>
      </div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Codigo de Accion</label>
            <select
              className={selectClass}
              value={filtroCodigoAccion}
              onChange={(e) =>
                setFiltroCodigoAccion(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Todos</option>
              {codigosAccion.map((ca) => (
                <option key={ca.id} value={ca.id}>
                  {ca.codigo} - {ca.nombre}
                </option>
              ))}
            </select>
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
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Buscar
          </button>
          <button
            onClick={abrirModal}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Nuevo Movimiento
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
                  Cargando movimientos...
                </td>
              </tr>
            ) : movimientosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  No se encontraron movimientos
                </td>
              </tr>
            ) : (
              movimientosFiltrados.map((m, idx) => {
                const esPositivo = m.signo > 0;
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{formatFecha(m.fechaMovimiento)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatFecha(m.fechaProceso)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{m.codigoAccionCodigo}</td>
                    <td className="px-3 py-2">{m.codigoAccionNombre}</td>
                    <td className="px-3 py-2">{m.productoNombre || '-'}</td>
                    <td
                      className={`px-3 py-2 font-semibold whitespace-nowrap ${
                        esPositivo ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {esPositivo ? '+' : '-'}
                      {m.cantidad}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMonto(m.precioUnitario)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold">{formatMonto(m.montoTotal)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{m.numeroTicket || '-'}</td>
                    <td className="px-3 py-2">{m.usuarioNombre || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                      {m.observaciones || '-'}
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
          <span className="text-xs text-slate-200">Total movimientos:</span>
          <span className="text-sm font-bold text-white">{movimientosFiltrados.length}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total ingresos:</span>
          <span className="text-sm font-bold text-green-400">{formatMonto(totalIngresos)}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total egresos:</span>
          <span className="text-sm font-bold text-red-400">{formatMonto(totalEgresos)}</span>
        </div>
      </div>

      {/* Modal Nuevo Movimiento */}
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
              <h3 className="text-lg font-semibold text-white">Nuevo Movimiento</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Codigo de Accion <span className="text-red-500">*</span>
                </label>
                <select
                  className={`${selectClass} w-full`}
                  value={formCodigoAccionId}
                  onChange={(e) =>
                    setFormCodigoAccionId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">Seleccionar...</option>
                  {codigosAccion.map((ca) => (
                    <option key={ca.id} value={ca.id}>
                      {ca.codigo} - {ca.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
                <select
                  className={`${selectClass} w-full`}
                  value={formProductoId}
                  onChange={(e) =>
                    setFormProductoId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">Sin producto</option>
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
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors"
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
