import { CierreCaja, EstadoCaja } from '../../../types';

interface Props {
  caja: CierreCaja | null;
  cargando: boolean;
  onClose: () => void;
  formatMonto: (n: number) => string;
  formatFecha: (f: string) => string;
}

export default function DetalleCajaModal({ caja, cargando, onClose, formatMonto, formatFecha }: Props) {
  if (!caja && !cargando) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => !cargando && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-caja-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4" onClick={e => e.stopPropagation()}>
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500">Cargando detalle...</div>
          </div>
        ) : caja && (() => {
          const esAbierta = caja.estado === EstadoCaja.Abierta;
          const detalleEfectivo = caja.detalles.find(d => d.formaPagoNombre.toLowerCase() === 'efectivo');
          const ventasEfectivo = detalleEfectivo?.montoTotal ?? 0;
          const plataformas = caja.detalles.filter(d => d.formaPagoNombre.toLowerCase() !== 'efectivo');
          const dineroEnCaja = caja.montoInicial + ventasEfectivo;
          const diferenciaCaja = caja.montoFinal != null ? caja.montoFinal - dineroEnCaja : 0;
          const totalGeneralGeneral = caja.detalles.reduce((s, d) => s + d.montoTotal, 0);

          return (
            <>
              <div className="bg-slate-700 text-white px-4 sm:px-6 py-4 rounded-t-lg flex items-center justify-between">
                <h3 id="detalle-caja-title" className="text-lg font-bold">Caja #{caja.id}</h3>
                <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors text-2xl leading-none" aria-label="Cerrar">&times;</button>
              </div>

              <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Desde: {formatFecha(caja.fechaApertura)} hs.
                    {' - '}
                    Hasta: {caja.fechaCierre ? `${formatFecha(caja.fechaCierre)} hs.` : 'Abierta'}
                  </span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    esAbierta ? 'bg-green-100 text-green-800 border border-green-300'
                    : caja.estado === EstadoCaja.PendienteRevision ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {esAbierta ? 'CAJA ABIERTA' : caja.estado === EstadoCaja.PendienteRevision ? 'PENDIENTE REVISION' : 'CAJA CERRADA'}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="ml-auto text-slate-600 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir
                  </button>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Efectivo</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Detalle</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2 text-sm">Monto inicial</td>
                          <td className="px-4 py-2 text-sm text-right">${formatMonto(caja.montoInicial)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-green-700">+ Ingresos</td>
                          <td className="px-4 py-2 text-sm text-right text-green-700">${formatMonto(0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-red-600">- Retiros</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">${formatMonto(0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-green-700">+ Ventas</td>
                          <td className="px-4 py-2 text-sm text-right text-green-700">${formatMonto(ventasEfectivo)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-red-600">- Compras</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">${formatMonto(0)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm text-red-600">- Gastos</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">${formatMonto(0)}</td>
                        </tr>
                        <tr className="bg-amber-50 border-t-2 border-amber-200">
                          <td className="px-4 py-2 text-sm font-bold">Dinero en caja</td>
                          <td className="px-4 py-2 text-sm text-right font-bold">${formatMonto(dineroEnCaja)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-sm">Diferencia de caja</td>
                          <td className={`px-4 py-2 text-sm text-right font-medium ${diferenciaCaja < 0 ? 'text-red-600' : diferenciaCaja > 0 ? 'text-green-700' : ''}`}>
                            ${formatMonto(diferenciaCaja)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Plataformas de Pago</h4>
                  {plataformas.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4">Sin operaciones en otras plataformas</p>
                  ) : (
                    <div className="space-y-4">
                      {plataformas.map(p => (
                        <div key={p.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b">
                            <span className="text-sm font-semibold text-slate-700">{p.formaPagoNombre}</span>
                          </div>
                          <div className="divide-y">
                            <div className="flex justify-between px-4 py-2">
                              <span className="text-sm text-green-700">Ventas {p.formaPagoNombre}</span>
                              <span className="text-sm text-green-700">${formatMonto(p.montoTotal)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2">
                              <span className="text-sm text-red-600">Compras</span>
                              <span className="text-sm text-red-600">${formatMonto(0)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-2 bg-amber-50 border-t border-amber-200">
                              <span className="text-sm font-bold">Total</span>
                              <span className="text-sm font-bold">${formatMonto(p.montoTotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                {(caja.totalNeto != null && caja.totalNeto > 0) && (
                  <div className="mb-3 border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Desglose Fiscal</span>
                    </div>
                    <div className="divide-y">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-600">Total Neto (sin IVA)</span>
                        <span className="text-sm font-medium text-gray-800">${formatMonto(caja.totalNeto)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-600">IVA Debito Fiscal</span>
                        <span className="text-sm font-medium text-gray-800">${formatMonto(caja.totalIVA ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-800">
                    TOTAL VENTAS: <span className="text-green-700">${formatMonto(totalGeneralGeneral)}</span>
                  </div>
                </div>
                {caja.observaciones && (
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium">Observaciones:</span> {caja.observaciones}
                  </p>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
