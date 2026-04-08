import { useEffect, useState } from 'react';
import {
  CuentaCorrienteDto,
  MovimientoCuentaCorrienteDto,
  getCuentasCorrientes,
  getCuentasConSaldo,
  getMovimientosCuenta,
  registrarPago,
  registrarAjuste,
} from '../../api/cuentaCorriente';
import { FormaPago } from '../../types/ventas';
import { getFormasPagoActivas } from '../../api/formasPago';
import { getLocales, LocalDto } from '../../api/locales';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { useGlobalToast } from '../../components/Toast';


const formatFecha = (f: string) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatFechaHora = (f: string) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
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
  const [soloConSaldo, setSoloConSaldo] = useState(true);
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

  // Modal pago
  const [showPago, setShowPago] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoFormaPagoId, setPagoFormaPagoId] = useState('');
  const [pagoObs, setPagoObs] = useState('');
  const [guardandoPago, setGuardandoPago] = useState(false);

  // Modal ajuste
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteMonto, setAjusteMonto] = useState('');
  const [ajusteAFavor, setAjusteAFavor] = useState(false);
  const [ajusteObs, setAjusteObs] = useState('');
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  const cargarCuentas = async () => {
    try {
      const data = soloConSaldo ? await getCuentasConSaldo() : await getCuentasCorrientes();
      setCuentas(data);
    } catch {
      showToast('Error al cargar cuentas corrientes', 'error');
    }
  };

  const cargarMovimientos = async (clienteId: number) => {
    try {
      const data = await getMovimientosCuenta(clienteId, desde || undefined, hasta || undefined);
      setMovimientos(data);
    } catch {
      showToast('Error al cargar movimientos', 'error');
    }
  };

  useEffect(() => {
    cargarCuentas();
    getFormasPagoActivas().then(setFormasPago);
    getLocales().then(setLocales);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarCuentas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloConSaldo]);

  useEffect(() => {
    if (seleccionada) {
      cargarMovimientos(seleccionada.clienteId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada, desde, hasta]);

  const seleccionar = (cuenta: CuentaCorrienteDto) => {
    setSeleccionada(cuenta);
    setDesde(unMesAtras);
    setHasta(hoy);
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada || !pagoMonto || !pagoFormaPagoId) return;
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
    <div className="flex gap-4 h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* Panel izquierdo - lista de cuentas */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-white rounded-lg shadow overflow-hidden">
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
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={soloConSaldo}
              onChange={e => setSoloConSaldo(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
            />
            Solo con saldo
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

      {/* Panel derecho - detalle */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
        {!seleccionada ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
            Selecciona un cliente para ver su cuenta corriente
          </div>
        ) : (
          <>
            {/* Header detalle */}
            <div className="bg-gradient-to-b from-slate-500 to-slate-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{seleccionada.clienteNombre}</h3>
                {seleccionada.clienteTelefono && (
                  <p className="text-sm text-slate-300">{seleccionada.clienteTelefono}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-300 uppercase tracking-wide">Saldo actual</div>
                <div className={`text-2xl font-bold ${seleccionada.saldoActual > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {formatMonto(seleccionada.saldoActual)}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 py-3 border-b flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowPago(true)}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Registrar Pago
              </button>
              <button
                onClick={() => setShowAjuste(true)}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Ajuste Manual
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 text-sm">
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
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {([
                      ['fechaMovimiento', 'Fecha', 'text-left'],
                      ['tipo', 'Tipo', 'text-left'],
                      ['monto', 'Monto', 'text-right'],
                      ['saldoResultante', 'Saldo', 'text-right'],
                      ['referencia', 'Referencia', 'text-left'],
                      ['usuarioNombre', 'Usuario', 'text-left'],
                      ['observaciones', 'Observaciones', 'text-left'],
                    ] as [string, string, string][]).map(([col, label, align]) => (
                      <th
                        key={col}
                        onClick={() => toggleOrden(col)}
                        className={`${align} px-4 py-2 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors`}
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
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatFechaHora(m.fechaMovimiento)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${tipoBadge(m.tipo)}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${m.tipo === 'Pago' ? 'text-green-600' : m.monto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {m.tipo === 'Pago' ? '+' : ''}{formatMonto(Math.abs(m.monto))}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${m.saldoResultante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMonto(m.saldoResultante)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {m.numeroTicket ? `Ticket #${m.numeroTicket}` : m.numeroVenta ? `Venta #${m.numeroVenta}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{m.usuarioNombre || '-'}</td>
                      <td className="px-4 py-2 text-gray-500 max-w-[200px] truncate" title={m.observaciones || ''}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={handlePago} className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold">Registrar Pago</h3>
              <p className="text-sm text-green-100">{seleccionada?.clienteNombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pagoMonto}
                  onChange={e => setPagoMonto(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label>
                <select
                  value={pagoFormaPagoId}
                  onChange={e => setPagoFormaPagoId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {formasPago.map(fp => (
                    <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                  ))}
                </select>
              </div>
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
            <div className="bg-amber-500 text-white px-6 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold">Ajuste Manual</h3>
              <p className="text-sm text-amber-100">{seleccionada?.clienteNombre}</p>
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ajusteAFavor}
                    onChange={e => setAjusteAFavor(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {ajusteAFavor ? 'A favor del cliente (reduce saldo)' : 'En contra del cliente (aumenta saldo)'}
                  </span>
                </label>
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
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {guardandoAjuste ? 'Guardando...' : 'Registrar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
