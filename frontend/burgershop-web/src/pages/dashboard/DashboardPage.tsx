import { useEffect, useState, useCallback } from 'react';
import { getDashboard, DashboardDto } from '../../api/dashboard';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtNum(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  const [data, setData] = useState<DashboardDto | null>(null);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localFiltro, setLocalFiltro] = useState<number | undefined>(esSuperAdmin ? undefined : (localDelUsuario || undefined));
  const [cargando, setCargando] = useState(true);

  useEffect(() => { if (esSuperAdmin) getLocales().then(setLocales).catch(() => {}); }, [esSuperAdmin]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const d = await getDashboard(localFiltro);
      setData(d);
    } catch { /* silencio, datos no críticos */ }
    finally { setCargando(false); }
  }, [localFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresh cada 2 minutos
  useEffect(() => { const t = setInterval(cargar, 120000); return () => clearInterval(t); }, [cargar]);

  if (cargando && !data) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Cargando dashboard...</div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No se pudo cargar el dashboard</div>
  );

  const totalVentasHoy = data.ventasMostradorHoy + data.ventasDomicilioHoy;
  const montoTotalHoy = data.montoMostradorHoy + data.montoDomicilioHoy;
  const pctColor = data.porcentajeVsAyer > 0 ? 'text-green-400' : data.porcentajeVsAyer < 0 ? 'text-red-400' : 'text-gray-400';
  const pctArrow = data.porcentajeVsAyer > 0 ? '\u25B2' : data.porcentajeVsAyer < 0 ? '\u25BC' : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Dashboard</h2>
        {esSuperAdmin && (
          <select className={selectClass} value={localFiltro ?? ''} onChange={e => setLocalFiltro(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Todos los locales</option>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        )}
      </div>

      {/* Fila 1: Ventas + Ticket + Caja */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ventas del día */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ventas Hoy</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">{totalVentasHoy}</span>
            <span className={`text-sm font-semibold ${pctColor}`}>{pctArrow}{Math.abs(Math.round(data.porcentajeVsAyer))}% vs ayer</span>
          </div>
          <div className="text-lg font-bold text-amber-600 mt-1">{fmt(montoTotalHoy)}</div>
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex-1 bg-blue-50 rounded-md px-3 py-2">
              <div className="text-xs text-blue-600 font-medium">Mostrador</div>
              <div className="font-bold text-blue-800">{data.ventasMostradorHoy} - {fmt(data.montoMostradorHoy)}</div>
            </div>
            <div className="flex-1 bg-purple-50 rounded-md px-3 py-2">
              <div className="text-xs text-purple-600 font-medium">Domicilio</div>
              <div className="font-bold text-purple-800">{data.ventasDomicilioHoy} - {fmt(data.montoDomicilioHoy)}</div>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ticket Promedio</div>
          <div className="text-3xl font-bold text-gray-800">{fmt(data.ticketPromedio)}</div>
          <div className="text-sm text-gray-500 mt-1">{totalVentasHoy} operaciones</div>
        </div>

        {/* Estado de Caja */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Caja</div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-3 h-3 rounded-full ${data.cajaAbierta ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={`text-sm font-semibold ${data.cajaAbierta ? 'text-green-700' : 'text-red-700'}`}>
              {data.cajaAbierta ? 'Abierta' : 'Cerrada'}
            </span>
          </div>
          {data.cajaAbierta && (
            <div className="text-3xl font-bold text-gray-800">{fmt(data.montoCaja)}</div>
          )}
        </div>
      </div>

      {/* Fila 2: Top Productos + Stock Crítico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Productos */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top 10 Combos del Dia</div>
          {data.topProductos.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">Sin ventas hoy</div>
          ) : (
            <div className="space-y-2">
              {data.topProductos.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.nombre}</span>
                  <span className="text-sm font-semibold text-gray-600">{fmtNum(p.cantidadVendida)} un.</span>
                  <span className="text-sm font-bold text-amber-600 w-24 text-right">{fmt(p.montoTotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Crítico */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Stock Critico</div>
          <div className="flex gap-4 mb-3">
            <div className="flex-1 bg-red-50 rounded-md px-3 py-2 text-center">
              <div className="text-2xl font-bold text-red-700">{data.productosSinStock}</div>
              <div className="text-xs text-red-600">Sin stock</div>
            </div>
            <div className="flex-1 bg-amber-50 rounded-md px-3 py-2 text-center">
              <div className="text-2xl font-bold text-amber-700">{data.productosStockCritico}</div>
              <div className="text-xs text-amber-600">Bajo minimo</div>
            </div>
          </div>
          {data.stockBajo.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {data.stockBajo.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700 truncate flex-1">{s.productoNombre}</span>
                  <span className={`font-semibold w-16 text-right ${s.stockActual <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {s.stockActual}
                  </span>
                  <span className="text-gray-400 text-xs w-16 text-right">min: {s.stockMinimo ?? '-'}</span>
                </div>
              ))}
            </div>
          )}
          {data.stockBajo.length === 0 && (
            <div className="text-sm text-green-600 py-4 text-center font-medium">Todo el stock OK</div>
          )}
        </div>
      </div>

      {/* Fila 3: Cuenta Corriente + Repartos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cuenta Corriente */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cuenta Corriente</div>
          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Saldo adeudado</div>
              <div className="text-2xl font-bold text-red-600">{fmt(data.saldoCtaCteTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Clientes con deuda</div>
              <div className="text-2xl font-bold text-gray-800">{data.clientesConDeuda}</div>
            </div>
          </div>
          {data.topDeudores.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-400 font-medium">Top deudores:</div>
              {data.topDeudores.map((d, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{d.clienteNombre}</span>
                  <span className="font-semibold text-red-600">{fmt(d.saldo)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repartos */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Repartos Hoy</div>
          <div className="flex gap-4">
            <div className="flex-1 bg-amber-50 rounded-md px-3 py-3 text-center">
              <div className="text-3xl font-bold text-amber-700">{data.pedidosPendientesEntrega}</div>
              <div className="text-xs text-amber-600 font-medium">Pendientes</div>
            </div>
            <div className="flex-1 bg-green-50 rounded-md px-3 py-3 text-center">
              <div className="text-3xl font-bold text-green-700">{data.pedidosEntregadosHoy}</div>
              <div className="text-xs text-green-600 font-medium">Entregados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 4: Comparativa Locales (solo SuperAdmin) */}
      {data.comparativaLocales && data.comparativaLocales.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Comparativa entre Locales</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">Local</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">Ventas</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase">Monto</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase w-1/3">Participacion</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxMonto = Math.max(...data.comparativaLocales!.map(l => l.montoTotal), 1);
                  return data.comparativaLocales!
                    .sort((a, b) => b.montoTotal - a.montoTotal)
                    .map((l, i) => (
                      <tr key={l.localId} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-2 font-medium">{l.localNombre}</td>
                        <td className="px-4 py-2 text-right">{l.cantidadVentas}</td>
                        <td className="px-4 py-2 text-right font-semibold text-amber-600">{fmt(l.montoTotal)}</td>
                        <td className="px-4 py-2">
                          <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${(l.montoTotal / maxMonto) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
