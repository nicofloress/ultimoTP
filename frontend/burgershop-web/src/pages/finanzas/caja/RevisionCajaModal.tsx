import { CierreCaja } from '../../../types';
import { VentaCajaDto } from '../../../api/caja';

interface Props {
  caja: CierreCaja;
  ventasCaja: VentaCajaDto[];
  revResultado: number;
  setRevResultado: (v: number) => void;
  revObservaciones: string;
  setRevObservaciones: (v: string) => void;
  revGuardando: boolean;
  mostrarMovCorrectivo: boolean;
  setMostrarMovCorrectivo: (v: boolean) => void;
  movMonto: number;
  setMovMonto: (v: number) => void;
  movObs: string;
  setMovObs: (v: string) => void;
  movTipo: 'ingreso' | 'egreso';
  setMovTipo: (v: 'ingreso' | 'egreso') => void;
  formaPagoExpandida: string | null;
  setFormaPagoExpandida: (v: string | null) => void;
  onClose: () => void;
  onRevisar: () => void;
  onMovCorrectivo: () => void;
  formatMonto: (n: number) => string;
  formatFecha: (f: string) => string;
}

export default function RevisionCajaModal({
  caja, ventasCaja,
  revResultado, setRevResultado,
  revObservaciones, setRevObservaciones,
  revGuardando,
  mostrarMovCorrectivo, setMostrarMovCorrectivo,
  movMonto, setMovMonto, movObs, setMovObs, movTipo, setMovTipo,
  formaPagoExpandida, setFormaPagoExpandida,
  onClose, onRevisar, onMovCorrectivo,
  formatMonto, formatFecha,
}: Props) {
  const efectivoVentas = caja.detalles.find(d => d.formaPagoNombre.toLowerCase() === 'efectivo')?.montoTotal ?? 0;
  const efectivoEsperado = caja.montoInicial + efectivoVentas;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => { onClose(); setFormaPagoExpandida(null); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-caja-title"
    >
      <div className="flex flex-col lg:flex-row gap-3 items-start w-full max-w-4xl mx-2 sm:mx-4 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-lg shadow-xl w-full lg:max-w-2xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div className="bg-slate-700 text-white px-4 sm:px-6 py-4 rounded-t-lg flex items-center justify-between">
            <h3 id="revision-caja-title" className="text-lg font-bold">Revisar Caja #{caja.id}</h3>
            <button onClick={onClose} className="text-white hover:text-gray-300 text-2xl" aria-label="Cerrar">&times;</button>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500">Local</div>
                <div className="font-semibold">{caja.localNombre || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500">Periodo</div>
                <div className="font-semibold text-xs">{formatFecha(caja.fechaApertura)} → {caja.fechaCierre ? formatFecha(caja.fechaCierre) : '-'}</div>
              </div>
            </div>

            {caja.fechaRevision && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-600">Revisada originalmente:</span>
                  <span className="font-medium text-blue-800">{formatFecha(caja.fechaRevision)}</span>
                </div>
                {caja.fechaUltimaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-blue-600">Ultima modificacion:</span>
                    <span className="font-medium text-blue-800">{formatFecha(caja.fechaUltimaModificacion)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <div className="text-xs text-blue-600">Efectivo Esperado</div>
                <div className="text-lg font-bold text-blue-800">${formatMonto(efectivoEsperado)}</div>
                <div className="text-[10px] text-blue-500 mt-0.5">Inicial ${formatMonto(caja.montoInicial)} + Vtas ${formatMonto(efectivoVentas)}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-center">
                <div className="text-xs text-amber-600">Efectivo Declarado</div>
                <div className="text-lg font-bold text-amber-800">${formatMonto(caja.montoEfectivoReal ?? 0)}</div>
              </div>
              <div className={`rounded p-3 text-center border ${
                (caja.diferenciaCaja ?? 0) === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-xs text-gray-600">Diferencia</div>
                <div className={`text-lg font-bold ${(caja.diferenciaCaja ?? 0) === 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${formatMonto(caja.diferenciaCaja ?? 0)}
                </div>
              </div>
            </div>

            {caja.detalles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalle por Forma de Pago <span className="text-[10px] text-gray-400 normal-case">(click para ver desglose)</span></h4>
                <table className="w-full text-sm border rounded">
                  <thead className="bg-gray-50"><tr>
                    <th className="text-left px-3 py-2 text-xs text-gray-500">Forma</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Operaciones</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Monto</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {caja.detalles.map(d => {
                      const activo = formaPagoExpandida === d.formaPagoNombre;
                      return (
                        <tr key={d.id} onClick={() => setFormaPagoExpandida(activo ? null : d.formaPagoNombre)} className={`cursor-pointer hover:bg-amber-50 transition-colors ${activo ? 'bg-amber-100' : ''}`}>
                          <td className="px-3 py-1.5">
                            <span className="inline-block w-3 text-gray-400">{activo ? '\u25B6' : '\u25BB'}</span> {d.formaPagoNombre}
                          </td>
                          <td className="px-3 py-1.5 text-right">{d.cantidadOperaciones}</td>
                          <td className="px-3 py-1.5 text-right font-medium">${formatMonto(d.montoTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-green-50 rounded p-2 text-center">
                <div className="text-xs text-green-600">Mostrador</div>
                <div className="font-bold text-green-700">{caja.cantidadMostrador} - ${formatMonto(caja.totalMostrador)}</div>
              </div>
              <div className="bg-blue-50 rounded p-2 text-center">
                <div className="text-xs text-blue-600">Domicilio</div>
                <div className="font-bold text-blue-700">{caja.cantidadDomicilio} - ${formatMonto(caja.totalDomicilio)}</div>
              </div>
              <div className="bg-purple-50 rounded p-2 text-center">
                <div className="text-xs text-purple-600">Cta Cte</div>
                <div className="font-bold text-purple-700">{caja.cantidadCtaCte} - ${formatMonto(caja.totalCtaCte)}</div>
              </div>
            </div>

            {caja.observaciones && (
              <div className="text-sm text-gray-600"><span className="font-medium">Obs. cierre:</span> {caja.observaciones}</div>
            )}

            <div className="border-t pt-4">
              <button
                onClick={() => setMostrarMovCorrectivo(!mostrarMovCorrectivo)}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {mostrarMovCorrectivo ? 'Ocultar' : 'Registrar movimiento correctivo'}
              </button>
              {mostrarMovCorrectivo && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <select value={movTipo} onChange={e => setMovTipo(e.target.value as 'ingreso' | 'egreso')} className="border rounded px-3 py-2 text-sm w-full sm:w-auto">
                      <option value="ingreso">Ingreso (ajuste +)</option>
                      <option value="egreso">Egreso (ajuste -)</option>
                    </select>
                    <input type="number" value={movMonto || ''} onChange={e => setMovMonto(Number(e.target.value))} placeholder="Monto" className="border rounded px-3 py-2 text-sm w-full sm:w-32" min={0} />
                    <input type="text" value={movObs} onChange={e => setMovObs(e.target.value)} placeholder="Motivo del ajuste" className="border rounded px-3 py-2 text-sm flex-1 w-full sm:min-w-[200px]" />
                    <button onClick={onMovCorrectivo} disabled={movMonto <= 0} className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-4 py-2 text-sm font-semibold disabled:opacity-50 w-full sm:w-auto">
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resultado de la revision</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: 1, label: 'Sin Diferencia', color: 'bg-green-100 text-green-800 border-green-300', active: 'bg-green-600 text-white' },
                    { val: 2, label: 'Diferencia Leve', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', active: 'bg-yellow-500 text-white' },
                    { val: 3, label: 'Diferencia Grave', color: 'bg-red-100 text-red-800 border-red-300', active: 'bg-red-600 text-white' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setRevResultado(opt.val)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold border transition-all ${revResultado === opt.val ? opt.active : opt.color}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de revision</label>
                <textarea value={revObservaciones} onChange={e => setRevObservaciones(e.target.value)} className="w-full border rounded px-3 py-2 text-sm resize-none" rows={2} placeholder="Notas del revisor..." />
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancelar</button>
            <button
              onClick={onRevisar}
              disabled={revGuardando || revResultado === 0}
              title={revResultado === 0 ? 'Seleccione un resultado de revision' : ''}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {revGuardando ? 'Guardando...' : 'Confirmar Revision'}
            </button>
          </div>
        </div>

        {formaPagoExpandida && (
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {(() => {
              const ventasForma = ventasCaja.filter(v => v.formaPagoNombre === formaPagoExpandida);
              const mostrador = ventasForma.filter(v => v.tipo === 1);
              const domicilio = ventasForma.filter(v => v.tipo === 2);
              const totalMostrador = mostrador.reduce((s, v) => s + v.total, 0);
              const totalDomicilio = domicilio.reduce((s, v) => s + v.total, 0);
              return (
                <>
                  <div className="bg-slate-700 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h3 className="text-lg font-bold">{formaPagoExpandida}</h3>
                    <button onClick={() => setFormaPagoExpandida(null)} className="text-white hover:text-gray-200 text-2xl leading-none" aria-label="Cerrar desglose">&times;</button>
                  </div>
                  <div className="p-4 bg-amber-50 border-b grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded px-3 py-2 border border-green-200">
                      <div className="text-xs text-green-600 font-medium">Mostrador</div>
                      <div className="font-bold text-green-700">{mostrador.length} - ${formatMonto(totalMostrador)}</div>
                    </div>
                    <div className="bg-white rounded px-3 py-2 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">Domicilio</div>
                      <div className="font-bold text-blue-700">{domicilio.length} - ${formatMonto(totalDomicilio)}</div>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="text-gray-600">
                          <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">Ticket</th>
                          <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">Tipo</th>
                          <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ventasForma.map((v, i) => (
                          <tr key={`${v.id}-${i}`} className="hover:bg-amber-50/50">
                            <td className="px-3 py-2 font-mono text-xs">{v.numeroTicket}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.tipo === 1 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {v.tipo === 1 ? 'Mostrador' : 'Domicilio'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">${formatMonto(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
