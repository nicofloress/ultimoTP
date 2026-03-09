import { useEffect, useState } from 'react';
import { CierreCaja, EstadoCaja } from '../../types';
import { getCajaAbierta, abrirCaja, cerrarCaja, getHistorialCajas } from '../../api/caja';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Toast, useToast } from '../../components/Toast';

export default function CajaPage() {
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [montoInicial, setMontoInicial] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [detalleExpandido, setDetalleExpandido] = useState<number | null>(null);
  const [mostrarConfirmCierre, setMostrarConfirmCierre] = useState(false);
  const { toast, mostrarToast, cerrarToast } = useToast();

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [caja, hist] = await Promise.all([getCajaAbierta(), getHistorialCajas()]);
      setCajaAbierta(caja);
      setHistorial(hist);
    } catch {
      // silenciar errores
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await abrirCaja({ montoInicial, observaciones: observaciones || undefined });
      setMontoInicial(0);
      setObservaciones('');
      await cargarDatos();
    } catch {
      mostrarToast('Error al abrir la caja', 'error');
    }
  };

  const handleCerrarCaja = () => {
    if (!cajaAbierta) return;
    setMostrarConfirmCierre(true);
  };

  const confirmarCierreCaja = async () => {
    if (!cajaAbierta) return;
    setMostrarConfirmCierre(false);
    try {
      await cerrarCaja(cajaAbierta.id, { observaciones: observacionesCierre || undefined });
      setObservacionesCierre('');
      await cargarDatos();
    } catch {
      mostrarToast('Error al cerrar la caja', 'error');
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de la Caja */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Estado de la Caja</h2>

        {!cajaAbierta ? (
          <form onSubmit={handleAbrirCaja} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">No hay una caja abierta actualmente.</p>
              <p className="text-yellow-600 text-sm mt-1">Abra una caja para comenzar a registrar ventas.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial</label>
              <input
                type="number"
                value={montoInicial}
                onChange={e => setMontoInicial(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 max-w-xs"
                min={0}
                step={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="w-full border rounded px-3 py-2 max-w-lg resize-none"
                rows={2}
                placeholder="Observaciones opcionales..."
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Abrir Caja
            </button>
          </form>
        ) : (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">Caja abierta</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Fecha Apertura</div>
                <div className="text-sm font-semibold mt-1">{formatFecha(cajaAbierta.fechaApertura)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Monto Inicial</div>
                <div className="text-sm font-semibold mt-1">${cajaAbierta.montoInicial.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Cant. Pedidos</div>
                <div className="text-sm font-semibold mt-1">{cajaAbierta.cantidadPedidos}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Ventas</div>
                <div className="text-lg font-bold mt-1 text-green-600">${cajaAbierta.totalVentas.toLocaleString()}</div>
              </div>
            </div>

            {/* Resumen por Forma de Pago */}
            {cajaAbierta.detalles && cajaAbierta.detalles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen por Forma de Pago</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Forma de Pago</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Cant. Operaciones</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cajaAbierta.detalles.map(d => (
                        <tr key={d.id}>
                          <td className="px-4 py-2 text-sm">{d.formaPagoNombre}</td>
                          <td className="px-4 py-2 text-sm text-right">{d.cantidadOperaciones}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">${d.montoTotal.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-2 text-sm">Total</td>
                        <td className="px-4 py-2 text-sm text-right">
                          {cajaAbierta.detalles.reduce((s, d) => s + d.cantidadOperaciones, 0)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          ${cajaAbierta.detalles.reduce((s, d) => s + d.montoTotal, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {cajaAbierta.observaciones && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-medium">Observaciones:</span> {cajaAbierta.observaciones}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de cierre</label>
                <textarea
                  value={observacionesCierre}
                  onChange={e => setObservacionesCierre(e.target.value)}
                  className="w-full border rounded px-3 py-2 max-w-lg resize-none"
                  rows={2}
                  placeholder="Observaciones opcionales al cerrar..."
                />
              </div>
              <button
                onClick={handleCerrarCaja}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Cerrar Caja
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Cierres */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Historial de Cierres</h2>
        {historial.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay registros de caja</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fecha Apertura</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fecha Cierre</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Monto Inicial</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Monto Final</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Cant. Pedidos</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Total Ventas</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historial.map(caja => (
                  <tr key={caja.id} className="group">
                    <td colSpan={7} className="p-0">
                      <button
                        onClick={() => setDetalleExpandido(detalleExpandido === caja.id ? null : caja.id)}
                        className="w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="px-4 py-3 text-sm flex-1">{formatFecha(caja.fechaApertura)}</div>
                          <div className="px-4 py-3 text-sm flex-1">{caja.fechaCierre ? formatFecha(caja.fechaCierre) : '-'}</div>
                          <div className="px-4 py-3 text-sm text-right flex-1">${caja.montoInicial.toLocaleString()}</div>
                          <div className="px-4 py-3 text-sm text-right flex-1">{caja.montoFinal != null ? `$${caja.montoFinal.toLocaleString()}` : '-'}</div>
                          <div className="px-4 py-3 text-sm text-right flex-1">{caja.cantidadPedidos}</div>
                          <div className="px-4 py-3 text-sm text-right font-medium flex-1">${caja.totalVentas.toLocaleString()}</div>
                          <div className="px-4 py-3 text-sm text-center flex-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              caja.estado === EstadoCaja.Abierta
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {caja.estado === EstadoCaja.Abierta ? 'Abierta' : 'Cerrada'}
                            </span>
                          </div>
                        </div>
                      </button>
                      {detalleExpandido === caja.id && caja.detalles && caja.detalles.length > 0 && (
                        <div className="bg-gray-50 px-8 py-4 border-t">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalle por Forma de Pago</h4>
                          <table className="w-full max-w-lg">
                            <thead>
                              <tr>
                                <th className="text-left text-xs font-medium text-gray-500 pb-1">Forma de Pago</th>
                                <th className="text-right text-xs font-medium text-gray-500 pb-1">Operaciones</th>
                                <th className="text-right text-xs font-medium text-gray-500 pb-1">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {caja.detalles.map(d => (
                                <tr key={d.id}>
                                  <td className="text-sm py-1">{d.formaPagoNombre}</td>
                                  <td className="text-sm py-1 text-right">{d.cantidadOperaciones}</td>
                                  <td className="text-sm py-1 text-right font-medium">${d.montoTotal.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {caja.observaciones && (
                            <p className="text-xs text-gray-500 mt-2">
                              <span className="font-medium">Obs:</span> {caja.observaciones}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmModal
        visible={mostrarConfirmCierre}
        titulo="Cerrar Caja"
        mensaje="Esta accion no se puede deshacer"
        tipo="warning"
        textoConfirmar="Cerrar Caja"
        onConfirmar={confirmarCierreCaja}
        onCancelar={() => setMostrarConfirmCierre(false)}
      />
      <Toast {...toast} onClose={cerrarToast} />
    </div>
  );
}
