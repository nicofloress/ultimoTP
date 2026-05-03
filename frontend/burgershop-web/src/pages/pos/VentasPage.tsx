import { useEffect, useState, useMemo } from 'react';
import { Venta, estadoLabels, estadoColores, TipoVenta, EstadoVenta } from '../../types';
import { getVentas, getVentaStats, VentaStats, asignarCaja, cancelarVenta } from '../../api/pedidos';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { useGlobalToast } from '../../components/Toast';
import { TicketPrintProps } from '../../components/TicketPrint';
import ComprobanteXPrint from '../../components/ComprobanteXPrint';
import { parseFechaUtc } from '../../utils/fechas';

const inputClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function formatFecha(fecha: string) {
  return parseFechaUtc(fecha).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function getHoy(): string {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function StatItem({ label, value, porcentaje }: { label: string; value: number; porcentaje?: number }) {
  const pctColor = porcentaje === undefined ? '' : porcentaje > 0 ? 'text-green-400' : porcentaje < 0 ? 'text-red-400' : 'text-slate-400';
  const pctArrow = porcentaje === undefined ? '' : porcentaje > 0 ? '\u25B2' : porcentaje < 0 ? '\u25BC' : '';
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-slate-200">{label}</span>
      <span className="text-sm font-bold text-white">{value.toLocaleString('es-AR')}</span>
      {porcentaje !== undefined && (
        <span className={`text-xs font-medium ${pctColor}`}>
          {pctArrow}{Math.abs(Math.round(porcentaje))}%
        </span>
      )}
    </div>
  );
}

export default function VentasPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const esAdmin = esSuperAdmin || usuario?.rol === RolUsuario.Administrador;

  const [fechaDesde, setFechaDesde] = useState(getHoy());
  const [fechaHasta, setFechaHasta] = useState(getHoy());
  const [busqueda, setBusqueda] = useState('');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Venta | null>(null);
  const [stats, setStats] = useState<VentaStats | null>(null);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));
  const [ordenCol, setOrdenCol] = useState<string>('fechaCreacion');
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc');
  const [ventaAcciones, setVentaAcciones] = useState<Venta | null>(null);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<TicketPrintProps['ticket'] | null>(null);
  // Anulacion
  const [ventaAnular, setVentaAnular] = useState<Venta | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const { showToast } = useGlobalToast();

  const imprimirVenta = (v: Venta) => {
    const ticket: TicketPrintProps['ticket'] = {
      numeroTicket: v.numeroTicket,
      fecha: v.fechaCreacion,
      tipo: v.tipo,
      nombreCliente: v.nombreCliente,
      direccionEntrega: v.direccionEntrega,
      zonaNombre: v.zonaNombre,
      lineas: v.lineas.map(l => ({ descripcion: l.descripcion, cantidad: l.cantidad, precioUnitario: l.precioUnitario, subtotal: l.subtotal })),
      subtotal: v.subtotal,
      descuento: v.descuento,
      recargo: v.recargo,
      total: v.total,
      formaPagoNombre: v.pagos && v.pagos.length > 0 ? v.pagos.map(p => p.formaPagoNombre).join(' / ') : v.formaPagoNombre,
      notaInterna: v.notaInterna || v.observaciones,
      tipoFactura: v.tipoFactura ?? 0,
      pagos: v.pagos?.map(p => ({ formaPagoNombre: p.formaPagoNombre, monto: p.monto, recargo: p.recargo, totalACobrar: p.totalACobrar })),
      descuentoPromociones: v.descuentoPromociones,
      reintegroPromociones: v.reintegroPromociones,
      promociones: v.promociones?.map(p => ({
        nombrePromocion: p.nombrePromocion,
        montoDescuento: p.montoDescuento,
        montoReintegro: p.montoReintegro,
        esReintegro: p.esReintegro,
      })),
    };
    setTicketParaImprimir(ticket);
    setMostrarComprobante(true);
  };

  useEffect(() => {
    getLocales().then(setLocales);
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      getVentaStats(fechaDesde, localSeleccionado || undefined, TipoVenta.Mostrador).then(setStats).catch(() => {});
      const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
      const data = await getVentas(fechaDesde, undefined, hasta, localSeleccionado || undefined);
      setVentas(data.filter(v => v.tipo === TipoVenta.Mostrador));
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setCargando(false);
    }
  };

  // Cargar al montar (con filtros por defecto = hoy)
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmarAnulacion = async () => {
    if (!ventaAnular) return;
    if (!motivoAnulacion.trim()) {
      showToast('Ingresa un motivo de anulacion', 'error');
      return;
    }
    setAnulando(true);
    try {
      await cancelarVenta(ventaAnular.id, motivoAnulacion.trim());
      showToast('Venta anulada correctamente', 'success');
      setVentaAnular(null);
      setMotivoAnulacion('');
      setSeleccionado(null);
      await cargar();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al anular la venta';
      showToast(msg, 'error');
    } finally {
      setAnulando(false);
    }
  };

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  const ventasFiltradas = useMemo(() => {
    let lista = ventas;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(v =>
        v.numeroTicket.toLowerCase().includes(q) ||
        v.nombreCliente?.toLowerCase().includes(q)
      );
    }
    const dir = ordenDir === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (ordenCol) {
        case 'numeroTicket': va = a.numeroTicket; vb = b.numeroTicket; break;
        case 'fechaCreacion': va = a.fechaCreacion; vb = b.fechaCreacion; break;
        case 'localNombre': va = a.localNombre || ''; vb = b.localNombre || ''; break;
        case 'nombreCliente': va = a.nombreCliente || ''; vb = b.nombreCliente || ''; break;
        case 'formaPagoNombre': va = a.formaPagoNombre || ''; vb = b.formaPagoNombre || ''; break;
        case 'total': va = a.total; vb = b.total; break;
        case 'estaPago': va = a.estaPago ? 1 : 0; vb = b.estaPago ? 1 : 0; break;
        default: return 0;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [ventas, busqueda, ordenCol, ordenDir]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)] overflow-hidden gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Panel de estadisticas */}
        {stats && (
          <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg mb-3 flex-shrink-0">
            {/* Fila 1: Comparativas */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide w-full sm:w-auto">Nro. total de ventas</span>
              <StatItem label="Hoy" value={stats.ventasHoy} porcentaje={stats.porcentajeVariacionAyer} />
              <StatItem label="Ayer" value={stats.ventasAyer} />
              <StatItem label="Ult. 7 dias" value={stats.ventasUltimos7Dias} porcentaje={stats.porcentajeVariacion7Dias} />
              <StatItem label="Ano pasado" value={stats.ventasAnioAnterior} porcentaje={stats.porcentajeVariacionAnio} />
            </div>
            {/* Fila 2: Resumen de la fecha */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 px-4 py-2.5 border-t border-slate-600">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide w-full sm:w-auto">Ventas</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-slate-200">Ventas</span>
                <span className="text-sm font-bold text-white">{stats.totalVentasFecha.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-slate-200">Ticket promedio</span>
                <span className="text-sm font-bold text-white">${stats.ticketPromedio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-slate-200">Total bruto</span>
                <span className="text-sm font-bold text-amber-400">${stats.totalBruto.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[200px]">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Local</label>
            {esSuperAdmin ? (
              <select className={selectClass + ' flex-1 sm:w-auto'} value={localSeleccionado} onChange={e => setLocalSeleccionado(Number(e.target.value))}>
                <option value={0}>Todos los locales</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium">Desde</span>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={`${inputClass} w-full sm:w-auto`} />
            <span className="text-xs text-gray-500 font-medium">Hasta</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={`${inputClass} w-full sm:w-auto`} />
            <button
              onClick={cargar}
              disabled={cargando}
              className="ml-0 sm:ml-1 px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1.5"
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
          </div>
          <input
            type="text"
            placeholder="Buscar ticket, cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={`${inputClass} w-full sm:flex-1 sm:min-w-[200px]`}
          />
          <span className="text-sm text-gray-500">
            {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? 's' : ''}
          </span>
          {cargando && (
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-white rounded-lg border-2 border-gray-300 shadow-xl">
          {ventasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base font-medium">No hay ventas para esta fecha</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  {([
                    ['numeroTicket', 'Ticket', '', ''],
                    ['fechaCreacion', 'Fecha/Hora', '', 'hidden sm:table-cell'],
                    ['localNombre', 'Local', '', 'hidden md:table-cell'],
                    ['nombreCliente', 'Cliente', '', 'hidden sm:table-cell'],
                    ['formaPagoNombre', 'Forma Pago', '', 'hidden md:table-cell'],
                    ['total', 'Total', 'text-right', ''],
                    ['estaPago', 'Pago', 'text-center', ''],
                    ['cierreCajaId', 'Caja', 'text-center', 'hidden lg:table-cell'],
                    ['acciones', 'Acciones', 'text-center', ''],
                  ] as [string, string, string, string][]).map(([col, label, align, visibility]) => (
                    <th
                      key={col}
                      onClick={() => toggleOrden(col)}
                      className={`px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors ${align} ${visibility}`}
                    >
                      {label}
                      {ordenCol === col && (
                        <span className="ml-1 text-amber-600">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventasFiltradas.map(v => (
                  <tr
                    key={v.id}
                    onClick={() => setSeleccionado(v)}
                    className={`hover:bg-amber-50 cursor-pointer transition-colors ${seleccionado?.id === v.id ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-bold text-gray-800">{v.numeroTicket}</td>
                    <td className="px-4 py-2.5 text-gray-600 hidden sm:table-cell">{formatFecha(v.fechaCreacion)}</td>
                    <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">{v.localNombre || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-700 hidden sm:table-cell max-w-[120px] truncate">{v.nombreCliente || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                      {v.pagos && v.pagos.length > 0
                        ? v.pagos.map(p => p.formaPagoNombre).join(' / ')
                        : v.formaPagoNombre || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                      {v.promociones && v.promociones.length > 0 && (
                        <span
                          className="inline-block mr-1 align-middle bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          title={v.promociones.map(p => `${p.nombrePromocion}: -$${p.montoDescuento.toLocaleString('es-AR')}`).join('\n')}
                        >
                          PROMO
                        </span>
                      )}
                      ${v.total.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {v.estaPago ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Pagado</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Cta Cte</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                      {v.cierreCajaId ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">#{v.cierreCajaId}</span>
                      ) : esAdmin ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await asignarCaja(v.id);
                              showToast('Venta asociada a la caja abierta', 'success');
                              const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
                              const data = await getVentas(fechaDesde, undefined, hasta, localSeleccionado || undefined);
                              setVentas(data.filter(x => x.tipo === TipoVenta.Mostrador));
                            } catch (err: unknown) {
                              const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al asociar a caja';
                              showToast(msg, 'error');
                            }
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100"
                          title="Asociar a la caja abierta"
                        >
                          Sin caja
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">Sin caja</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setVentaAcciones(v); }}
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
                        title="Acciones"
                      >
                        <span className="hidden sm:inline">Acciones</span>
                        <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales */}
        {ventasFiltradas.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-700 rounded-lg mt-2 text-sm flex-shrink-0 shadow-lg">
            <span className="text-slate-400">{ventasFiltradas.length} venta{ventasFiltradas.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-amber-400">
              Total: ${ventasFiltradas.reduce((sum, v) => sum + v.total, 0).toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </div>

      {/* Panel detalle */}
      {seleccionado && (
        <div className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto w-full lg:w-96 bg-white rounded-lg border-2 border-slate-300 shadow-2xl flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b-2 border-amber-500 flex items-center justify-between bg-slate-700 shadow-lg flex-shrink-0">
            <div>
              <span className="font-bold text-white text-lg">{seleccionado.numeroTicket}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${estadoColores[seleccionado.estado]}`}>
                {estadoLabels[seleccionado.estado]}
              </span>
            </div>
            <button onClick={() => setSeleccionado(null)} className="text-slate-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium">{formatFecha(seleccionado.fechaCreacion)}</span>
              </div>
              {seleccionado.nombreCliente && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium">{seleccionado.nombreCliente}</span>
                </div>
              )}
              {seleccionado.formaPagoNombre && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Forma de Pago</span>
                  <span className="font-medium">{seleccionado.formaPagoNombre}</span>
                </div>
              )}
              {seleccionado.observaciones && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Observaciones</span>
                  <span className="font-medium text-right max-w-[200px]">{seleccionado.observaciones}</span>
                </div>
              )}
              {seleccionado.usuarioNombre && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Usuario</span>
                  <span className="font-medium">{seleccionado.usuarioNombre}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Productos</h4>
              <div className="space-y-1.5">
                {seleccionado.lineas.map(l => (
                  <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-800">{l.cantidad}x</span>
                      <span className="ml-1.5 text-gray-700">{l.descripcion}</span>
                      {l.notas && <p className="text-xs text-gray-400 mt-0.5">{l.notas}</p>}
                    </div>
                    <span className="text-gray-600 font-medium ml-2">${l.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>

            {seleccionado.pagos && seleccionado.pagos.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Pagos</h4>
                <div className="space-y-1.5">
                  {seleccionado.pagos.map(pago => (
                    <div key={pago.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <span className="text-gray-700">{pago.formaPagoNombre}</span>
                      <span className="font-medium text-gray-800">${pago.totalACobrar.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-3 space-y-1 bg-gray-50 flex-shrink-0 shadow-[0_-2px_6px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${seleccionado.subtotal.toLocaleString('es-AR')}</span>
            </div>
            {seleccionado.descuento > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Descuento</span>
                <span>-${seleccionado.descuento.toLocaleString('es-AR')}</span>
              </div>
            )}
            {seleccionado.promociones && seleccionado.promociones.filter(p => !p.esReintegro).map(p => (
              <div key={`promo-${p.id}`} className="flex justify-between text-sm text-emerald-600">
                <span className="truncate max-w-[180px]" title={p.nombrePromocion}>✨ {p.nombrePromocion}</span>
                <span className="whitespace-nowrap">-${p.montoDescuento.toLocaleString('es-AR')}</span>
              </div>
            ))}
            {seleccionado.recargo > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Recargo</span>
                <span>+${seleccionado.recargo.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
              <span>Total</span>
              <span className="text-amber-600">${seleccionado.total.toLocaleString('es-AR')}</span>
            </div>
            {seleccionado.promociones && seleccionado.promociones.filter(p => p.esReintegro).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs font-semibold uppercase text-emerald-600 mb-1">Reintegros a cuenta</div>
                {seleccionado.promociones.filter(p => p.esReintegro).map(p => (
                  <div key={`reint-${p.id}`} className="flex justify-between text-xs text-emerald-600">
                    <span className="truncate max-w-[180px]">{p.nombrePromocion}</span>
                    <span>+${p.montoReintegro.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            )}
            {(seleccionado.montoNeto != null && seleccionado.montoNeto > 0) && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Neto</span>
                  <span>${seleccionado.montoNeto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>IVA</span>
                  <span>${(seleccionado.montoIVA ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
            <div className="flex justify-center pt-1">
              {seleccionado.estaPago ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Pagado</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Cuenta Corriente</span>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => imprimirVenta(seleccionado)}
                className="flex-1 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Imprimir / Facturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprobante para imprimir */}
      {mostrarComprobante && ticketParaImprimir && (
        <ComprobanteXPrint ticket={ticketParaImprimir} onClose={() => setMostrarComprobante(false)} />
      )}

      {/* Modal Acciones */}
      {ventaAcciones && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setVentaAcciones(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 sm:mx-0" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-8 py-4 sm:py-5 rounded-t-xl text-center border-b">
              <h3 className="text-xl font-bold text-gray-800">ACCIONES - {ventaAcciones.numeroTicket}</h3>
              <p className="text-sm text-gray-500 mt-1">${ventaAcciones.total.toLocaleString('es-AR')} - {ventaAcciones.nombreCliente || 'Consumidor Final'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-8">
              {/* Imprimir A4 */}
              <button
                onClick={() => { imprimirVenta(ventaAcciones); setVentaAcciones(null); }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                <span className="font-bold text-sm text-gray-700">IMPRIMIR A4</span>
              </button>
              {/* Imprimir Ticket */}
              <button
                onClick={() => { imprimirVenta(ventaAcciones); setVentaAcciones(null); }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
                <span className="font-bold text-sm text-gray-700">TICKET</span>
              </button>
              {/* Facturar */}
              <button
                onClick={() => { setVentaAcciones(null); showToast('Facturación AFIP: próximamente', 'success'); }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="font-bold text-sm text-gray-700">FACTURAR</span>
              </button>
              {/* Enviar WhatsApp */}
              <button
                onClick={() => { setVentaAcciones(null); showToast('Envío por WhatsApp: próximamente', 'success'); }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <svg className="w-12 h-12 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-bold text-sm text-gray-700">WHATSAPP</span>
              </button>
              {/* Anular venta — solo si no esta cancelada */}
              {ventaAcciones.estado !== EstadoVenta.Cancelado && (
                <button
                  onClick={() => { setVentaAnular(ventaAcciones); setMotivoAnulacion(''); setVentaAcciones(null); }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-200 col-span-2 sm:col-span-1"
                >
                  <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-sm text-red-700">ANULAR</span>
                </button>
              )}
            </div>
            <div className="border-t px-4 sm:px-8 py-4 text-center">
              <button onClick={() => setVentaAcciones(null)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anulacion */}
      {ventaAnular && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !anulando && setVentaAnular(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 px-6 py-4 rounded-t-xl flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Anular Venta</h3>
                <p className="text-red-100 text-sm">{ventaAnular.numeroTicket} - ${ventaAnular.total.toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Esta acción <strong>revierte el stock</strong> y los <strong>movimientos de caja</strong> de la venta. Si fue a cuenta corriente, también se acredita el saldo al cliente.
              </p>
              <p className="text-xs text-gray-500">No se puede deshacer.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={motivoAnulacion}
                  onChange={e => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej: cliente devolvio el producto"
                  className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={anulando}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3 border-t border-gray-100">
              <button
                onClick={() => { setVentaAnular(null); setMotivoAnulacion(''); }}
                disabled={anulando}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAnulacion}
                disabled={anulando || !motivoAnulacion.trim()}
                className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {anulando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Anulando...
                  </>
                ) : (
                  'Confirmar Anulacion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
