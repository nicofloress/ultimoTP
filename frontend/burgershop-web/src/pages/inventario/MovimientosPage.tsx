import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MovimientoDto,
  CodigoAccion,
  getCodigosAccion,
  getMovimientosPorLocal,
  crearMovimiento,
} from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { getLocales, LocalDto } from '../../api/locales';
import { Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import NumericInput, { formatearMonto } from '../../components/NumericInput';
import { compareBy } from '../../utils/tableSort';
import { parseFechaUtc } from '../../utils/fechas';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  return parseFechaUtc(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMonto(n: number) {
  return formatearMonto(n);
}

type SortDir = 'asc' | 'desc';

export default function MovimientosPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  // --- Data ---
  const [movimientos, setMovimientos] = useState<MovimientoDto[]>([]);
  const [codigosAccion, setCodigosAccion] = useState<CodigoAccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  // --- Locales ---
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));

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
  const [formCantidad, setFormCantidad] = useState<number>(0);
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<number>(0);
  const [formFecha, setFormFecha] = useState(getHoy());
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formModo, setFormModo] = useState<'bultos' | 'paquetes'>('paquetes');

  // Producto seleccionado en el modal y conversiones bultos<->paquetes
  const productoSeleccionadoModal = useMemo(() => {
    if (formProductoId === '') return null;
    return productos.find(p => p.id === formProductoId) || null;
  }, [formProductoId, productos]);

  const upbModal = productoSeleccionadoModal?.unidadesPorBulto || 1;
  const puedeUsarBultos = upbModal > 1;
  const cantidadPaquetes = formModo === 'bultos' ? formCantidad * upbModal : formCantidad;
  const precioUnitarioPaquete = formModo === 'bultos' && upbModal > 0 ? formPrecioUnitario / upbModal : formPrecioUnitario;
  const montoTotalForm = formModo === 'bultos' ? formCantidad * formPrecioUnitario : cantidadPaquetes * formPrecioUnitario;

  // --- Load catálogos ---
  useEffect(() => {
    getCodigosAccion().then(setCodigosAccion).catch(() => {});
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
        // Todos los locales: cargar de cada uno y concatenar
        const promises = locales.map(l => getMovimientosPorLocal(l.id, fechaDesde, hasta));
        const results = await Promise.all(promises);
        data = results.flat().sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime());
      } else {
        data = await getMovimientosPorLocal(localSeleccionado, fechaDesde, hasta);
      }
      // Ocultar movimientos internos de combos (desglose de stock)
      setMovimientos(data.filter(m => !m.observaciones?.startsWith('[COMBO]')));
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      showToast('Error al cargar movimientos', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, localSeleccionado, showToast]);

  useEffect(() => { cargarMovimientos(); }, [cargarMovimientos]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(cargarMovimientos, 300000);
    return () => clearInterval(interval);
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
    lista.sort((a, b) => compareBy(a, b, ordenCol, ordenDir));
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
    setFormCantidad(0);
    setFormPrecioUnitario(0);
    setFormFecha(getHoy());
    setFormObservaciones('');
    setFormModo('paquetes');
    setModalOpen(true);
  };

  // Si se cambia a un producto sin bultos, forzar modo paquetes
  useEffect(() => {
    if (!puedeUsarBultos && formModo === 'bultos') setFormModo('paquetes');
  }, [puedeUsarBultos, formModo]);

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
      const obsBultos = formModo === 'bultos' && upbModal > 1
        ? `${formCantidad} bulto${formCantidad !== 1 ? 's' : ''} x ${upbModal} paq/bulto = ${cantidadPaquetes} paq.`
        : '';
      const observacionesFinal = obsBultos
        ? (formObservaciones ? `${obsBultos} ${formObservaciones}` : obsBultos)
        : (formObservaciones || undefined);

      await crearMovimiento({
        codigoAccionId: formCodigoAccionId as number,
        productoId: formProductoId !== '' ? (formProductoId as number) : undefined,
        localId: localSeleccionado,
        cantidad: cantidadPaquetes,
        precioUnitario: precioUnitarioPaquete,
        fechaMovimiento: formFecha,
        observaciones: observacionesFinal,
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
  const columnas: { key: string; label: string; hide?: string }[] = [
    { key: 'fechaMovimiento', label: 'Fecha Mov.' },
    { key: 'localNombre', label: 'Local', hide: 'hidden sm:table-cell' },
    { key: 'fechaProceso', label: 'Fecha Proceso', hide: 'hidden md:table-cell' },
    { key: 'codigoAccionCodigo', label: 'Codigo' },
    { key: 'codigoAccionNombre', label: 'Descripcion', hide: 'hidden sm:table-cell' },
    { key: 'productoNombre', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'precioUnitario', label: 'Precio Unit.', hide: 'hidden sm:table-cell' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'numeroTicket', label: 'Ticket', hide: 'hidden md:table-cell' },
    { key: 'clienteNombre', label: 'Cliente', hide: 'hidden md:table-cell' },
    { key: 'usuarioNombre', label: 'Usuario', hide: 'hidden md:table-cell' },
    { key: 'observaciones', label: 'Observaciones', hide: 'hidden md:table-cell' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Movimientos de Inventario</h2>
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
          {esSuperAdmin && (
            <button
              onClick={abrirModal}
              className="px-2.5 py-1.5 text-[13px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 flex items-center gap-1.5"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nuevo Movimiento
            </button>
          )}
          <div className="flex-1" />
          {ultimaActualizacion && (
            <span className="text-xs text-gray-400 italic">
              Actualizado: {ultimaActualizacion.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          )}
          <button
            onClick={cargarMovimientos}
            disabled={cargando}
            className="px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          {movimientosFiltrados.length > 0 && (
            <div className="flex gap-2 ml-3 pl-3 border-l border-gray-300">
              <button
                onClick={() => {
                  const localNombre = localSeleccionado === 0
                    ? 'Todos los locales'
                    : (locales.find(l => l.id === localSeleccionado)?.nombre || 'Local');
                  const rows = movimientosFiltrados.map(m =>
                    `<tr>
                      <td style="padding:4px 8px;border:1px solid #ddd;white-space:nowrap">${formatFecha(m.fechaMovimiento)}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd">${m.localNombre || '-'}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd;font-family:monospace;font-size:11px">${m.codigoAccionCodigo}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd">${m.productoNombre || m.observaciones || '-'}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${m.signo > 0 ? '+' : '-'}${m.cantidad}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${formatMonto(m.precioUnitario)}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;font-weight:600">${formatMonto(m.montoTotal)}</td>
                      <td style="padding:4px 8px;border:1px solid #ddd">${m.observaciones || '-'}</td>
                    </tr>`
                  ).join('');
                  const html = `<html><head><title>Movimientos - ${localNombre}</title></head><body>
                    <h2 style="font-family:sans-serif">Movimientos - ${localNombre}</h2>
                    <p style="font-family:sans-serif;color:#555">Periodo: ${fechaDesde} al ${fechaHasta}</p>
                    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px">
                      <thead><tr style="background:#f3f4f6">
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Fecha</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Local</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Codigo</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Producto</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Cantidad</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Precio Unit.</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Monto Total</th>
                        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Observaciones</th>
                      </tr></thead>
                      <tbody>${rows}</tbody>
                    </table>
                  </body></html>`;
                  const w = window.open('', '_blank');
                  if (!w) return;
                  w.document.write(html);
                  w.document.close();
                  w.onafterprint = () => w.close();
                  setTimeout(() => w.print(), 300);
                }}
                className="px-2.5 py-1.5 text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 flex items-center gap-1"
                title="Exportar PDF"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-1.5 9.5c.3 0 .5.1.7.3.2.2.3.4.3.7s-.1.5-.3.7c-.2.2-.4.3-.7.3h-1v1.5H9.5v-4h2zm3.5 0c.5 0 .9.2 1.2.5.3.3.5.8.5 1.5s-.2 1.2-.5 1.5c-.3.3-.7.5-1.2.5h-1.5v-4H15zm-3.5 1.5h-.5v-1h.5c.1 0 .2 0 .3.1.1.1.1.2.1.4s0 .3-.1.4c-.1.1-.2.1-.3.1zm3.5 0h-.5v2h.5c.3 0 .4-.1.5-.2.1-.2.2-.4.2-.8s-.1-.6-.2-.8c-.1-.1-.2-.2-.5-.2z"/></svg>
                PDF
              </button>
              <button
                onClick={() => {
                  const localNombre = localSeleccionado === 0
                    ? 'Todos los locales'
                    : (locales.find(l => l.id === localSeleccionado)?.nombre || 'Local');
                  const sep = ';';
                  const header = `Movimientos - ${localNombre}${sep}${sep}Periodo: ${fechaDesde} al ${fechaHasta}\n\n`;
                  const colHeaders = `Fecha${sep}Local${sep}Codigo${sep}Producto${sep}Cantidad${sep}Precio Unit.${sep}Monto Total${sep}Observaciones\n`;
                  const rows = movimientosFiltrados.map(m =>
                    `${formatFecha(m.fechaMovimiento)}${sep}${m.localNombre || '-'}${sep}${m.codigoAccionCodigo}${sep}${m.productoNombre || '-'}${sep}${m.signo > 0 ? '+' : '-'}${m.cantidad}${sep}${m.precioUnitario}${sep}${m.montoTotal}${sep}${(m.observaciones || '-').replace(/;/g, ',')}`
                  ).join('\n');
                  const bom = '\uFEFF';
                  const blob = new Blob([bom + header + colHeaders + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `movimientos_${localNombre.replace(/\s+/g, '_')}_${fechaDesde}_${fechaHasta}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2.5 py-1.5 text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 flex items-center gap-1"
                title="Exportar Excel"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 13.5h1.2l.8 1.3.8-1.3h1.2l-1.4 2 1.4 2h-1.2l-.8-1.3-.8 1.3H9.5l1.4-2-1.4-2z"/></svg>
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
              {columnas.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 transition-colors ${col.hide ?? ''}`}
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
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{formatFecha(m.fechaMovimiento)}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">{m.localNombre}</td>
                    <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">{formatFecha(m.fechaProceso)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{m.codigoAccionCodigo}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">{m.codigoAccionNombre}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm">{m.productoNombre || m.observaciones || '-'}</td>
                    <td
                      className={`px-3 py-2 font-semibold whitespace-nowrap text-xs sm:text-sm ${
                        esPositivo ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {esPositivo ? '+' : '-'}
                      {m.cantidad}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">{formatMonto(m.precioUnitario)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold text-xs sm:text-sm">{formatMonto(m.montoTotal)}</td>
                    <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">{m.numeroTicket || '-'}</td>
                    <td className="px-3 py-2 hidden md:table-cell">{m.clienteNombre || '-'}</td>
                    <td className="px-3 py-2 hidden md:table-cell">{m.usuarioNombre || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate hidden md:table-cell">
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
                      {p.unidadesPorBulto > 1 ? ` (${p.unidadesPorBulto} paq/bulto)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info bulto + toggle Bultos/Paquetes */}
              {puedeUsarBultos && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700">
                    1 bulto = <strong>{upbModal} paquetes</strong>
                  </div>
                  <div className="flex gap-1 bg-gray-100 rounded-md p-0.5 w-fit">
                    <button
                      type="button"
                      onClick={() => { setFormModo('bultos'); setFormCantidad(0); setFormPrecioUnitario(0); }}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${formModo === 'bultos' ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Bultos
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormModo('paquetes'); setFormCantidad(0); setFormPrecioUnitario(0); }}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${formModo === 'paquetes' ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Paquetes
                    </button>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {formModo === 'bultos' ? 'Cantidad de Bultos' : 'Cantidad (paquetes)'} <span className="text-red-500">*</span>
                  </label>
                  <NumericInput
                    className={`${inputClass} w-full`}
                    value={formCantidad}
                    onChange={(v) => setFormCantidad(v)}
                    min={0}
                  />
                  {formModo === 'bultos' && formCantidad > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      = <strong className="text-blue-600">{cantidadPaquetes} paquetes</strong>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {formModo === 'bultos' ? 'Precio por Bulto' : 'Precio por Paquete'} <span className="text-red-500">*</span>
                  </label>
                  <NumericInput
                    className={`${inputClass} w-full`}
                    value={formPrecioUnitario}
                    onChange={(v) => setFormPrecioUnitario(v)}
                    min={0}
                    decimales
                  />
                  {formModo === 'bultos' && formPrecioUnitario > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      = <strong className="text-blue-600">{precioUnitarioPaquete.toFixed(2)} / paq.</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen total cuando es bultos */}
              {formModo === 'bultos' && formCantidad > 0 && formPrecioUnitario > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm flex justify-between">
                  <span className="text-gray-700 font-semibold">Total:</span>
                  <span className="font-bold text-amber-700">{formatMonto(montoTotalForm)}</span>
                </div>
              )}
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
