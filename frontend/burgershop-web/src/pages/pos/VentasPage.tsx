import { useEffect, useState, useMemo } from 'react';
import { Venta, estadoLabels, estadoColores, TipoVenta } from '../../types';
import { getVentas, getVentaStats, VentaStats } from '../../api/pedidos';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';

const inputClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-AR', {
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

  useEffect(() => {
    getLocales().then(setLocales);
  }, []);

  useEffect(() => {
    getVentaStats(fechaDesde).then(setStats).catch(() => {});
  }, [fechaDesde]);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
        const data = await getVentas(fechaDesde, undefined, hasta, localSeleccionado || undefined);
        setVentas(data.filter(v => v.tipo === TipoVenta.Mostrador));
      } catch (err) {
        console.error('Error cargando ventas:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [fechaDesde, fechaHasta, localSeleccionado]);

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
    <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Panel de estadisticas */}
        {stats && (
          <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg mb-3 flex-shrink-0">
            {/* Fila 1: Comparativas */}
            <div className="flex items-center gap-6 px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mr-2">Nro. total de ventas</span>
              <StatItem label="Hoy" value={stats.ventasHoy} porcentaje={stats.porcentajeVariacionAyer} />
              <StatItem label="Ayer" value={stats.ventasAyer} />
              <StatItem label="Ult. 7 dias" value={stats.ventasUltimos7Dias} porcentaje={stats.porcentajeVariacion7Dias} />
              <StatItem label="Ano pasado" value={stats.ventasAnioAnterior} porcentaje={stats.porcentajeVariacionAnio} />
            </div>
            {/* Fila 2: Resumen de la fecha */}
            <div className="flex items-center gap-6 px-4 py-2.5 border-t border-slate-600">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide mr-2">Ventas</span>
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
        <div className="flex flex-wrap items-center gap-3 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Local</label>
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
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Desde</span>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inputClass} />
            <span className="text-xs text-gray-500 font-medium">Hasta</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inputClass} />
          </div>
          <input
            type="text"
            placeholder="Buscar ticket, cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={`${inputClass} flex-1 min-w-[200px]`}
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
        <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-lg border-2 border-gray-300 shadow-xl">
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
                    ['numeroTicket', 'Ticket', ''],
                    ['fechaCreacion', 'Hora', ''],
                    ['localNombre', 'Local', ''],
                    ['nombreCliente', 'Cliente', ''],
                    ['formaPagoNombre', 'Forma Pago', ''],
                    ['total', 'Total', 'text-right'],
                    ['estaPago', 'Pago', 'text-center'],
                  ] as [string, string, string][]).map(([col, label, align]) => (
                    <th
                      key={col}
                      onClick={() => toggleOrden(col)}
                      className={`px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-700 transition-colors ${align}`}
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
                    <td className="px-4 py-2.5 text-gray-600">{formatFecha(v.fechaCreacion)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.localNombre || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{v.nombreCliente || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {v.pagos && v.pagos.length > 0
                        ? v.pagos.map(p => p.formaPagoNombre).join(' / ')
                        : v.formaPagoNombre || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-600">${v.total.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2.5 text-center">
                      {v.estaPago ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Pagado</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Cta Cte</span>
                      )}
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
        <div className="w-96 bg-white rounded-lg border-2 border-slate-300 shadow-2xl flex flex-col overflow-hidden flex-shrink-0">
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
            <div className="flex justify-center pt-1">
              {seleccionado.estaPago ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Pagado</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Cuenta Corriente</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
