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
import { useGlobalToast } from '../../components/Toast';

const hoy = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const formatFecha = (f: string) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatFechaHora = (f: string) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatMonto = (m: number) =>
  m.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export default function CuentaCorrientePage() {
  const { showToast } = useGlobalToast();

  const [cuentas, setCuentas] = useState<CuentaCorrienteDto[]>([]);
  const [soloConSaldo, setSoloConSaldo] = useState(true);
  const [seleccionada, setSeleccionada] = useState<CuentaCorrienteDto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuentaCorrienteDto[]>([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

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
    setDesde('');
    setHasta('');
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
        localId: 1,
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
        <div className="px-4 py-2 border-b flex items-center gap-2">
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
          {cuentas.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No hay cuentas corrientes</div>
          )}
          {cuentas.map(c => (
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
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors"
              >
                Registrar Pago
              </button>
              <button
                onClick={() => setShowAjuste(true)}
                className="bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 text-sm font-semibold transition-colors"
              >
                Ajuste Manual
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-sm">
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
            </div>

            {/* Tabla movimientos */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Fecha</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Tipo</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Monto</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Saldo</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Referencia</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Usuario</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatFechaHora(m.fechaMovimiento)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${tipoBadge(m.tipo)}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${m.monto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMonto(m.monto)}
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
