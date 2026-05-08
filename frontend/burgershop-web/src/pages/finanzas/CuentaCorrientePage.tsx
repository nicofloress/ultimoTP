import { useEffect, useState } from 'react';
import {
  CuentaCorrienteDto,
  MovimientoCuentaCorrienteDto,
  CuentaCorrienteStatsDto,
  getCuentasCorrientes,
  getCuentasConSaldo,
  getMovimientosCuenta,
  registrarPago,
  registrarAjuste,
  getCuentaCorrienteStats,
} from '../../api/cuentaCorriente';
import { FormaPago } from '../../types/ventas';
import { getFormasPagoActivas } from '../../api/formasPago';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { useGlobalToast } from '../../components/Toast';
import { parseFechaUtc } from '../../utils/fechas';


const formatFecha = (f: string) => {
  if (!f) return '-';
  return parseFechaUtc(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatFechaHora = (f: string) => {
  if (!f) return '-';
  return parseFechaUtc(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatMonto = (m: number) =>
  m.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

export default function CuentaCorrientePage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (usuario?.localId || 1));
  const [busquedaNombre, setBusquedaNombre] = useState('');

  const [cuentas, setCuentas] = useState<CuentaCorrienteDto[]>([]);
  const [soloConSaldo, setSoloConSaldo] = useState(false);
  const [seleccionada, setSeleccionada] = useState<CuentaCorrienteDto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorrienteDto[]>([]);
  const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const unMesAtras = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [desde, setDesde] = useState(unMesAtras);
  const [hasta, setHasta] = useState(hoy);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  // Ordenamiento tabla movimientos
  const [ordenCol, setOrdenCol] = useState<string>('fechaMovimiento');
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc');

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    const dir = ordenDir === 'asc' ? 1 : -1;
    let va: string | number, vb: string | number;
    switch (ordenCol) {
      case 'fechaMovimiento': va = a.fechaMovimiento; vb = b.fechaMovimiento; break;
      case 'tipo': va = a.tipo; vb = b.tipo; break;
      case 'monto': va = a.monto; vb = b.monto; break;
      case 'saldoResultante': va = a.saldoResultante; vb = b.saldoResultante; break;
      case 'referencia': va = a.numeroTicket || a.numeroVenta || ''; vb = b.numeroTicket || b.numeroVenta || ''; break;
      case 'usuarioNombre': va = a.usuarioNombre || ''; vb = b.usuarioNombre || ''; break;
      case 'observaciones': va = a.observaciones || ''; vb = b.observaciones || ''; break;
      default: return 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  // Stats
  const [stats, setStats] = useState<CuentaCorrienteStatsDto | null>(null);
  const [statsMobileVisibles, setStatsMobileVisibles] = useState(false);

  // Modal pago
  const [showPago, setShowPago] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoFormaPagoId, setPagoFormaPagoId] = useState('');
  const [pagoObs, setPagoObs] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);
  // Pago dividido
  const [pagoDividido, setPagoDividido] = useState(false);
  const [pagosDivididos, setPagosDivididos] = useState<{ formaPagoId: string; monto: string }[]>([{ formaPagoId: '', monto: '' }, { formaPagoId: '', monto: '' }]);

  // Modal ajuste
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteMonto, setAjusteMonto] = useState('');
  const [ajusteAFavor, setAjusteAFavor] = useState(false);
  const [ajusteObs, setAjusteObs] = useState('');
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  // Mobile filtros (panel detalle)
  const [filtrosMobileVisibles, setFiltrosMobileVisibles] = useState(false);
  const cantidadFiltrosActivos =
    (desde !== unMesAtras ? 1 : 0) +
    (hasta !== hoy ? 1 : 0);

  const cargarCuentas = async () => {
    try {
      const data = soloConSaldo ? await getCuentasConSaldo() : await getCuentasCorrientes();
      setCuentas(data);
    } catch {
      showToast('Error al cargar cuentas corrientes', 'error');
    }
  };

  const cargarStats = async () => {
    try {
      const localFiltro = esSuperAdmin && localSeleccionado === 0 ? undefined : localSeleccionado;
      const data = await getCuentaCorrienteStats(localFiltro);
      setStats(data);
    } catch {
      // ignorar fallo de stats - no critico
    }
  };

  const [cargandoMovs, setCargandoMovs] = useState(false);

  const cargarMovimientos = async (clienteId: number) => {
    setCargandoMovs(true);
    try {
      const data = await getMovimientosCuenta(clienteId, desde || undefined, hasta || undefined);
      setMovimientos(data);
    } catch {
      showToast('Error al cargar movimientos', 'error');
    } finally {
      setCargandoMovs(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
    cargarStats();
    getFormasPagoActivas().then(setFormasPago);
    getLocales().then(setLocales);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarCuentas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloConSaldo]);

  useEffect(() => {
    cargarStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSeleccionado]);

  useEffect(() => {
    if (seleccionada) {
      cargarMovimientos(seleccionada.clienteId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada]);

  const seleccionar = (cuenta: CuentaCorrienteDto) => {
    setSeleccionada(cuenta);
    setDesde(unMesAtras);
    setHasta(hoy);
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada) return;

    if (pagoDividido) {
      const items = pagosDivididos
        .map(p => ({ formaPagoId: Number(p.formaPagoId), monto: Number(p.monto) }))
        .filter(p => p.formaPagoId > 0 && p.monto > 0);
      if (items.length < 2) {
        showToast('Pago dividido requiere al menos 2 formas de pago con monto', 'error');
        return;
      }
      const formasUnicas = new Set(items.map(i => i.formaPagoId));
      if (formasUnicas.size !== items.length) {
        showToast('No se puede repetir la misma forma de pago', 'error');
        return;
      }
      setGuardandoPago(true);
      try {
        for (const item of items) {
          await registrarPago({
            clienteId: seleccionada.clienteId,
            monto: item.monto,
            formaPagoId: item.formaPagoId,
            localId: localSeleccionado || 1,
            observaciones: pagoObs ? `${pagoObs} (pago dividido)` : 'Pago dividido',
          });
        }
        showToast(`Pago dividido registrado en ${items.length} formas de pago`, 'success');
        setShowPago(false);
        setPagoMonto('');
        setPagoFormaPagoId('');
        setPagoObs('');
        setPagoDividido(false);
        setPagosDivididos([{ formaPagoId: '', monto: '' }, { formaPagoId: '', monto: '' }]);
        cargarCuentas();
        cargarStats();
        cargarMovimientos(seleccionada.clienteId);
        const updated = await getCuentasCorrientes().catch(() => null);
        if (updated) {
          const found = updated.find(c => c.clienteId === seleccionada.clienteId);
          if (found) setSeleccionada(found);
        }
      } catch {
        showToast('Error al registrar pago dividido. Algunas partes pueden haberse aplicado, revise movimientos.', 'error');
      } finally {
        setGuardandoPago(false);
      }
      return;
    }

    if (!pagoMonto || !pagoFormaPagoId) return;
    setGuardandoPago(true);
    try {
      await registrarPago({
        clienteId: seleccionada.clienteId,
        monto: Number(pagoMonto),
        formaPagoId: Number(pagoFormaPagoId),
        localId: localSeleccionado || 1,
        observaciones: pagoObs || undefined,
      });
      showToast('Pago registrado correctamente', 'success');
      setShowPago(false);
      setPagoMonto('');
      setPagoFormaPagoId('');
      setPagoObs('');
      cargarCuentas();
      cargarStats();
      cargarMovimientos(seleccionada.clienteId);
      // Update seleccionada saldo
      const updated = await getCuentasConSaldo().catch(() => null);
      if (updated) {
        const found = updated.find(c => c.clienteId === seleccionada.clienteId);
        if (found) setSeleccionada(found);
      }
    } catch {
      showToast('Error al registrar pago', 'error');
    } finally {
      setGuardandoPago(false);
    }
  };

  const handleAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada || !ajusteMonto || !ajusteObs) return;
    setGuardandoAjuste(true);
    try {
      await registrarAjuste({
        clienteId: seleccionada.clienteId,
        monto: Number(ajusteMonto),
        esAFavor: ajusteAFavor,
        observaciones: ajusteObs,
      });
      showToast('Ajuste registrado correctamente', 'success');
      setShowAjuste(false);
      setAjusteMonto('');
      setAjusteAFavor(false);
      setAjusteObs('');
      cargarCuentas();
      cargarStats();
      cargarMovimientos(seleccionada.clienteId);
      const updated = await getCuentasCorrientes().catch(() => null);
      if (updated) {
        const found = updated.find(c => c.clienteId === seleccionada.clienteId);
        if (found) setSeleccionada(found);
      }
    } catch {
      showToast('Error al registrar ajuste', 'error');
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const tipoBadge = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('cargo') || t.includes('venta') || t.includes('pedido'))
      return 'bg-red-100 text-red-700';
    if (t.includes('pago'))
      return 'bg-green-100 text-green-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 lg:h-[calc(100vh-5rem)]">
      {/* Stats bar */}
      {stats && (
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 text-white rounded-lg shadow px-3 py-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-1 sm:hidden">
            <span className="text-xs font-semibold text-slate-300">Resumen</span>
            <button onClick={() => setStatsMobileVisibles(v => !v)} className="text-xs text-amber-300 hover:text-amber-200">
              {statsMobileVisibles ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <div className={`${statsMobileVisibles ? 'grid' : 'hidden'} grid-cols-2 sm:flex sm:flex-wrap gap-x-5 gap-y-1.5 items-baseline`}>
            <StatBubble
              label="Deuda total"
              value={formatMonto(stats.totalDeudaActual)}
              tone="red"
              tooltip="Suma de saldos positivos de todos los clientes con cta cte. Plata que clientes deben al negocio."
            />
            <StatBubble
              label="Clientes c/deuda"
              value={stats.clientesConDeuda.toString()}
              tone="amber"
              tooltip="Cantidad de clientes que tienen saldo positivo (deudores)."
            />
            <StatBubble
              label="A favor"
              value={formatMonto(stats.totalSaldoFavor)}
              tone="green"
              tooltip="Suma de saldos a favor (cliente pago de mas o tiene credito). Plata que el negocio debe descontar en futuras compras."
            />
            <StatBubble
              label="Cobrado mes"
              value={formatMonto(stats.totalPagosMes)}
              tone="emerald"
              tooltip={`Total de pagos recibidos este mes (${stats.cantidadPagosMes} operaciones).`}
            />
            <StatBubble
              label="Cargado mes"
              value={formatMonto(stats.totalCargosMes)}
              tone="blue"
              tooltip="Total de cargos generados este mes (ventas en cta cte + cargos manuales)."
            />
            <StatBubble
              label="Ajustes mes"
              value={`${stats.cantidadAjustesMes}`}
              tone="purple"
              tooltip={`Cantidad de ajustes manuales este mes. A favor cliente: ${formatMonto(stats.totalAjustesFavorMes)} - En contra: ${formatMonto(stats.totalAjustesContraMes)}. Revisar para detectar fugas o abusos.`}
            />
            {stats.clienteTopDeudor && (
              <StatBubble
                label="Top deudor"
                value={`${stats.clienteTopDeudor.length > 14 ? stats.clienteTopDeudor.slice(0, 14) + '..' : stats.clienteTopDeudor}: ${formatMonto(stats.montoTopDeudor)}`}
                tone="red"
                tooltip={`Cliente con mayor saldo deudor: ${stats.clienteTopDeudor} debe ${formatMonto(stats.montoTopDeudor)}.`}
              />
            )}
            <StatBubble
              label="Promedio deuda"
              value={formatMonto(stats.saldoPromedioDeudor)}
              tone="slate"
              tooltip="Saldo promedio entre clientes con deuda. Indicador de tamano tipico de cuenta."
            />
          </div>
        </div>
      )}

    <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1 lg:overflow-hidden">
      {/* Panel izquierdo - lista de cuentas. En mobile se oculta cuando hay cliente seleccionado */}
      <div className={`w-full lg:w-96 flex-shrink-0 flex flex-col bg-white rounded-lg shadow overflow-hidden lg:max-h-full ${seleccionada ? 'hidden lg:flex' : 'flex max-h-[calc(100vh-12rem)]'}`}>
        <div className="bg-gradient-to-b from-slate-500 to-slate-700 px-4 py-3">
          <h2 className="text-lg font-bold text-white">Cuentas Corrientes</h2>
        </div>
        <div className="px-4 py-2 border-b space-y-2">
          <div className="min-w-0">
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
          <input
            type="text"
            value={busquedaNombre}
            onChange={e => setBusquedaNombre(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <label
            className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
            title="Si esta tildado, solo muestra clientes con deuda o saldo a favor (saldo distinto de cero). Si esta destildado, muestra todos los clientes con cuenta corriente."
          >
            <input
              type="checkbox"
              checked={soloConSaldo}
              onChange={e => setSoloConSaldo(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
            />
            Solo con saldo
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold cursor-help">?</span>
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {cuentas.filter(c => {
            if (localSeleccionado && c.clienteLocalId && c.clienteLocalId !== localSeleccionado) return false;
            if (busquedaNombre && !c.clienteNombre.toLowerCase().includes(busquedaNombre.toLowerCase())) return false;
            return true;
          }).length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No hay cuentas corrientes</div>
          )}
          {cuentas.filter(c => {
            if (localSeleccionado && c.clienteLocalId && c.clienteLocalId !== localSeleccionado) return false;
            if (busquedaNombre && !c.clienteNombre.toLowerCase().includes(busquedaNombre.toLowerCase())) return false;
            return true;
          }).map(c => (
            <div
              key={c.id}
              onClick={() => seleccionar(c)}
              className={`px-4 py-3 border-b cursor-pointer transition-colors hover:bg-slate-50 ${
                seleccionada?.id === c.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm text-gray-800">{c.clienteNombre}</div>
                  {c.clienteTelefono && (
                    <div className="text-xs text-gray-500">{c.clienteTelefono}</div>
                  )}
                </div>
                <div className={`text-sm font-bold ${c.saldoActual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatMonto(c.saldoActual)}
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  Limite: {formatMonto(c.limiteCredito)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatFecha(c.fechaUltimoMovimiento)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho - detalle. En mobile se oculta cuando no hay seleccion */}
      <div className={`flex-1 flex-col bg-white rounded-lg shadow overflow-hidden ${seleccionada ? 'flex' : 'hidden lg:flex'}`}>
        {!seleccionada ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Selecciona un cliente para ver su cuenta corriente
          </div>
        ) : (
          <>
            {/* Header detalle */}
            <div className="bg-gradient-to-b from-slate-500 to-slate-700 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
              <button
                onClick={() => setSeleccionada(null)}
                className="lg:hidden text-white/70 hover:text-white p-1 -ml-1 flex-shrink-0"
                aria-label="Volver"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{seleccionada.clienteNombre}</h3>
                {seleccionada.clienteTelefono && (
                  <p className="text-xs sm:text-sm text-slate-300 truncate">{seleccionada.clienteTelefono}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wide">Saldo</div>
                <div className={`text-base sm:text-2xl font-bold whitespace-nowrap ${seleccionada.saldoActual > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {formatMonto(seleccionada.saldoActual)}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPago(true)}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="hidden sm:inline">Registrar Pago</span>
                <span className="sm:hidden">Pago</span>
              </button>
              <button
                onClick={() => setShowAjuste(true)}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Ajuste Manual</span>
                <span className="sm:hidden">Ajuste</span>
              </button>
              {/* Botón mobile filtros */}
              <button
                onClick={() => setFiltrosMobileVisibles(v => !v)}
                className={`sm:hidden px-2.5 py-2 rounded-md border flex items-center justify-center gap-1 transition-colors ${
                  filtrosMobileVisibles || cantidadFiltrosActivos > 0
                    ? 'text-amber-700 bg-amber-50 border-amber-300'
                    : 'text-gray-700 bg-white border-gray-300'
                }`}
                aria-label="Filtros"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {cantidadFiltrosActivos > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cantidadFiltrosActivos}
                  </span>
                )}
              </button>
              <button
                onClick={() => seleccionada && cargarMovimientos(seleccionada.clienteId)}
                disabled={!seleccionada || cargandoMovs}
                className="sm:hidden px-2.5 py-2 text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center"
                aria-label="Buscar"
              >
                {cargandoMovs ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
              <div className={`${filtrosMobileVisibles ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2 text-sm w-full sm:w-auto sm:flex-1 justify-start sm:justify-center`}>
                <label className="text-gray-500">Desde:</label>
                <input
                  type="date"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                  max={hoy}
                  className="border rounded px-2 py-1 text-sm"
                />
                <label className="text-gray-500">Hasta:</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                  max={hoy}
                  className="border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => seleccionada && cargarMovimientos(seleccionada.clienteId)}
                  disabled={!seleccionada || cargandoMovs}
                  className="hidden sm:flex ml-1 px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 items-center gap-1.5"
                >
                  {cargandoMovs ? (
                    <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {cargandoMovs ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {movimientos.length > 0 && (
                <div className="flex gap-2">
                <button
                  onClick={() => {
                    const rows = movimientosOrdenados.map(m =>
                      `<tr>
                        <td style="padding:4px 8px;border:1px solid #ddd">${formatFechaHora(m.fechaMovimiento)}</td>
                        <td style="padding:4px 8px;border:1px solid #ddd">${m.tipo}</td>
                        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${formatMonto(m.monto)}</td>
                        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${formatMonto(m.saldoResultante)}</td>
                        <td style="padding:4px 8px;border:1px solid #ddd">${m.numeroTicket ? `Ticket #${m.numeroTicket}` : m.numeroVenta ? `Venta #${m.numeroVenta}` : '-'}</td>
                        <td style="padding:4px 8px;border:1px solid #ddd">${m.observaciones || '-'}</td>
                      </tr>`
                    ).join('');
                    const html = `<html><head><title>Cuenta Corriente - ${seleccionada?.clienteNombre}</title></head><body>
                      <h2 style="font-family:sans-serif">Cuenta Corriente: ${seleccionada?.clienteNombre}</h2>
                      <p style="font-family:sans-serif;color:#555">Saldo actual: ${formatMonto(seleccionada?.saldoActual ?? 0)} | Periodo: ${desde} al ${hasta}</p>
                      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px">
                        <thead><tr style="background:#f3f4f6">
                          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Fecha</th>
                          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Tipo</th>
                          <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Monto</th>
                          <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Saldo</th>
                          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Referencia</th>
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
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF
                </button>
                <button
                  onClick={() => {
                    const sep = ';';
                    const header = `Cuenta Corriente: ${seleccionada?.clienteNombre}${sep}${sep}Saldo: ${seleccionada?.saldoActual}${sep}Periodo: ${desde} al ${hasta}\n\n`;
                    const colHeaders = `Fecha${sep}Tipo${sep}Monto${sep}Saldo${sep}Referencia${sep}Observaciones\n`;
                    const rows = movimientosOrdenados.map(m =>
                      `${formatFechaHora(m.fechaMovimiento)}${sep}${m.tipo}${sep}${m.monto}${sep}${m.saldoResultante}${sep}${m.numeroTicket ? `Ticket #${m.numeroTicket}` : m.numeroVenta ? `Venta #${m.numeroVenta}` : '-'}${sep}${(m.observaciones || '-').replace(/;/g, ',')}`
                    ).join('\n');
                    const bom = '\uFEFF';
                    const blob = new Blob([bom + header + colHeaders + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cta_cte_${seleccionada?.clienteNombre?.replace(/\s+/g, '_') || 'cliente'}_${desde}_${hasta}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Excel
                </button>
                </div>
              )}
            </div>

            {/* Tabla movimientos */}
            <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {([
                      ['fechaMovimiento', 'Fecha', 'text-left', ''],
                      ['tipo', 'Tipo', 'text-left', ''],
                      ['monto', 'Monto', 'text-right', ''],
                      ['saldoResultante', 'Saldo', 'text-right', ''],
                      ['referencia', 'Referencia', 'text-left', 'hidden sm:table-cell'],
                      ['usuarioNombre', 'Usuario', 'text-left', 'hidden md:table-cell'],
                      ['observaciones', 'Observaciones', 'text-left', 'hidden md:table-cell'],
                    ] as [string, string, string, string][]).map(([col, label, align, hide]) => (
                      <th
                        key={col}
                        onClick={() => toggleOrden(col)}
                        className={`${align} ${hide} px-2 sm:px-4 py-2 text-[10px] sm:text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors`}
                      >
                        {label}
                        {ordenCol === col && (
                          <span className="ml-1 text-amber-600">{ordenDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimientosOrdenados.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap text-[11px] sm:text-sm">
                        <span className="sm:hidden">{formatFecha(m.fechaMovimiento)}</span>
                        <span className="hidden sm:inline">{formatFechaHora(m.fechaMovimiento)}</span>
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${tipoBadge(m.tipo)}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className={`px-2 sm:px-3 py-2 text-right font-medium text-[11px] sm:text-sm whitespace-nowrap ${m.tipo === 'Pago' ? 'text-green-600' : m.monto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {m.tipo === 'Pago' ? '+' : ''}{formatMonto(Math.abs(m.monto))}
                      </td>
                      <td className={`px-2 sm:px-3 py-2 text-right font-medium text-[11px] sm:text-sm whitespace-nowrap ${m.saldoResultante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMonto(m.saldoResultante)}
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                        {m.numeroTicket ? `Ticket #${m.numeroTicket}` : m.numeroVenta ? `Venta #${m.numeroVenta}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs hidden md:table-cell">{m.usuarioNombre || '-'}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate text-xs hidden md:table-cell" title={m.observaciones || ''}>
                        {m.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No hay movimientos en el periodo seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Registrar Pago */}
      {showPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
          <form onSubmit={handlePago} className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="bg-green-600 text-white px-6 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold">Registrar Pago</h3>
              <p className="text-sm text-green-100">{seleccionada?.clienteNombre}</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Toggle pago dividido */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <input
                  id="pagoDividido"
                  type="checkbox"
                  checked={pagoDividido}
                  onChange={e => setPagoDividido(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400"
                />
                <label htmlFor="pagoDividido" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Pago dividido (varias formas de pago)
                </label>
              </div>

              {!pagoDividido && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pagoMonto}
                      onChange={e => setPagoMonto(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      required={!pagoDividido}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label>
                    <select
                      value={pagoFormaPagoId}
                      onChange={e => setPagoFormaPagoId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      required={!pagoDividido}
                    >
                      <option value="">Seleccionar...</option>
                      {formasPago.map(fp => (
                        <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {pagoDividido && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detalle del pago dividido *</label>
                  <div className="space-y-2">
                    {pagosDivididos.map((p, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <select
                          value={p.formaPagoId}
                          onChange={e => {
                            const next = [...pagosDivididos];
                            next[idx] = { ...next[idx], formaPagoId: e.target.value };
                            setPagosDivididos(next);
                          }}
                          className="flex-1 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">Forma...</option>
                          {formasPago.map(fp => (
                            <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Monto"
                          value={p.monto}
                          onChange={e => {
                            const next = [...pagosDivididos];
                            next[idx] = { ...next[idx], monto: e.target.value };
                            setPagosDivididos(next);
                          }}
                          className="w-28 border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-400"
                        />
                        {pagosDivididos.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPagosDivididos(pagosDivididos.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-lg px-1"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setPagosDivididos([...pagosDivididos, { formaPagoId: '', monto: '' }])}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      + Agregar otra forma
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      Total: {formatMonto(pagosDivididos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={pagoObs}
                  onChange={e => setPagoObs(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  rows={2}
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPago(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoPago}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {guardandoPago ? 'Guardando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Ajuste Manual */}
      {showAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={handleAjuste} className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-gradient-to-b from-slate-500 to-slate-700 text-white px-6 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold">Ajuste Manual</h3>
              <p className="text-sm text-slate-200">{seleccionada?.clienteNombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={ajusteMonto}
                  onChange={e => setAjusteMonto(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ajuste *</label>
                <div className="flex flex-col gap-2">
                  <label className={`flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border-2 transition-colors ${!ajusteAFavor ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="tipoAjuste"
                      checked={!ajusteAFavor}
                      onChange={() => setAjusteAFavor(false)}
                      className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-400"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Cargo (aumenta la deuda)</div>
                      <div className="text-xs text-gray-500">El cliente debe mas plata. Saldo sube.</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border-2 transition-colors ${ajusteAFavor ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="tipoAjuste"
                      checked={ajusteAFavor}
                      onChange={() => setAjusteAFavor(true)}
                      className="mt-0.5 w-4 h-4 text-green-600 focus:ring-green-400"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Descuento / Credito (reduce la deuda)</div>
                      <div className="text-xs text-gray-500">El cliente debe menos plata. Saldo baja.</div>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones *</label>
                <textarea
                  value={ajusteObs}
                  onChange={e => setAjusteObs(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  rows={3}
                  required
                  placeholder="Motivo del ajuste..."
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAjuste(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoAjuste}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {guardandoAjuste ? 'Guardando...' : 'Registrar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}

const toneClasses: Record<string, string> = {
  red: 'text-red-300',
  amber: 'text-amber-300',
  green: 'text-green-300',
  emerald: 'text-emerald-300',
  blue: 'text-blue-300',
  purple: 'text-purple-300',
  slate: 'text-slate-300',
};

function StatBubble({ label, value, tone, tooltip }: { label: string; value: string; tone: string; tooltip: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1.5 cursor-help min-w-0" title={tooltip}>
      <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wide truncate">{label}</span>
      <span className={`text-xs sm:text-sm font-bold truncate ${toneClasses[tone] || 'text-white'}`}>{value}</span>
    </div>
  );
}
