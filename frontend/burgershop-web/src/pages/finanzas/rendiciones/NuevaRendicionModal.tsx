import { RepartidorPendienteRendicionDto } from '../../../api/rendiciones';
import { parseFechaLocal, esDiaAnterior } from '../../../utils/fechas';

interface Props {
  repartidoresPendientes: RepartidorPendienteRendicionDto[];
  repartidorSeleccionado: RepartidorPendienteRendicionDto | null;
  cargandoPendientes: boolean;
  efectivoDeclarado: string;
  setEfectivoDeclarado: (v: string) => void;
  diferenciaPreview: number;
  obsNueva: string;
  setObsNueva: (v: string) => void;
  creandoRendicion: boolean;
  puedeEditarEstado: boolean;
  pedidosPagoPendienteCount: number;
  onSeleccionarRepartidor: (r: RepartidorPendienteRendicionDto) => void;
  onVolverASeleccion: () => void;
  onCerrar: () => void;
  onCrearRendicion: () => void;
  onEditarPedido: (id: number, estado: string, formaPago?: string) => void;
}

export default function NuevaRendicionModal({
  repartidoresPendientes, repartidorSeleccionado, cargandoPendientes,
  efectivoDeclarado, setEfectivoDeclarado, diferenciaPreview,
  obsNueva, setObsNueva, creandoRendicion, puedeEditarEstado,
  pedidosPagoPendienteCount,
  onSeleccionarRepartidor, onVolverASeleccion, onCerrar,
  onCrearRendicion, onEditarPedido,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCerrar} role="dialog" aria-modal="true" aria-labelledby="nueva-rendicion-title">
      <div className={`flex flex-col lg:flex-row gap-4 max-h-[85vh] ${repartidorSeleccionado ? 'w-full max-w-4xl' : 'w-full max-w-xl'}`} onClick={e => e.stopPropagation()}>
        {/* Panel izquierdo: Formulario */}
        <div className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col ${repartidorSeleccionado ? 'w-full lg:w-1/2' : 'w-full'}`}>
          {/* Header */}
          <div className="px-6 py-4 bg-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {repartidorSeleccionado && (
                <button
                  onClick={onVolverASeleccion}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  aria-label="Volver a seleccionar repartidor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 id="nueva-rendicion-title" className="font-bold text-lg text-white">
                {repartidorSeleccionado ? 'Crear Rendicion' : 'Nueva Rendicion'}
              </h3>
            </div>
            <button
              onClick={onCerrar}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!repartidorSeleccionado ? (
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona un reparto finalizado para crear la rendicion:
                </p>
                {cargandoPendientes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-400">Cargando repartidores...</div>
                  </div>
                ) : repartidoresPendientes.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-400 font-medium">No hay repartidores pendientes de rendicion</p>
                    <p className="text-gray-300 text-sm mt-1">Todos los repartidores ya tienen su rendicion de hoy o no finalizaron sus zonas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repartidoresPendientes.map(rp => {
                      const fechaReparto = rp.fecha ? parseFechaLocal(rp.fecha) : null;
                      const esDeDiaAnterior = rp.fecha ? esDiaAnterior(rp.fecha) : false;
                      return (
                        <button
                          key={rp.repartoZonaId}
                          onClick={() => onSeleccionarRepartidor(rp)}
                          className={`w-full text-left border rounded-lg p-4 transition-colors group ${
                            esDeDiaAnterior
                              ? 'bg-amber-50/60 hover:bg-amber-50 border-amber-300 hover:border-amber-400'
                              : 'bg-gray-50 hover:bg-amber-50 border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800 group-hover:text-amber-800 flex items-center gap-2">
                                {rp.repartidorNombre}
                                {esDeDiaAnterior && fechaReparto && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-900">
                                    ⚠ {fechaReparto.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                <span className="text-blue-600 font-medium">{rp.zonaNombre}</span>
                                <span className="text-green-600">{rp.totalEntregados} entregados</span>
                                {rp.totalNoEntregados > 0 && (
                                  <span className="text-red-500">{rp.totalNoEntregados} no entreg.</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-700">
                                ${(rp.totalEfectivo + rp.totalTransferencia).toLocaleString('es-AR')}
                              </div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="font-semibold text-amber-900">{repartidorSeleccionado.repartidorNombre}</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    {repartidorSeleccionado.zonas.map(z => z.zonaNombre).join(', ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Entregados</div>
                    <div className="text-base font-bold mt-0.5 text-green-700">{repartidorSeleccionado.totalEntregados}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">No Entregados</div>
                    <div className="text-base font-bold mt-0.5 text-red-600">{repartidorSeleccionado.totalNoEntregados}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Efectivo</div>
                    <div className="text-base font-bold mt-0.5 text-gray-800">${repartidorSeleccionado.totalEfectivo.toLocaleString('es-AR')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Transferencia</div>
                    <div className="text-base font-bold mt-0.5 text-gray-800">${repartidorSeleccionado.totalTransferencia.toLocaleString('es-AR')}</div>
                  </div>
                </div>

                {repartidorSeleccionado.montoInicialCambio > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-800">Monto Inicial / Cambio entregado</span>
                      <span className="text-lg font-bold text-emerald-700">${repartidorSeleccionado.montoInicialCambio.toLocaleString('es-AR')}</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-0.5">Efectivo entregado al repartidor al iniciar el reparto</p>
                  </div>
                )}

                {repartidorSeleccionado.totalNoEntregado > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-amber-800">Total No Entregado</span>
                      <span className="text-lg font-bold text-amber-700">${repartidorSeleccionado.totalNoEntregado.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Efectivo Declarado</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      value={efectivoDeclarado}
                      onChange={e => setEfectivoDeclarado(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-right"
                      min={0}
                      step="0.01"
                    />
                  </div>
                </div>

                {efectivoDeclarado !== '' && (
                  <div className={`rounded-xl p-4 border-2 ${
                    diferenciaPreview === 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${diferenciaPreview === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        Diferencia
                      </span>
                      <span className={`text-xl font-bold ${diferenciaPreview === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {diferenciaPreview > 0 ? '+' : ''}${diferenciaPreview.toLocaleString('es-AR')}
                      </span>
                    </div>
                    {diferenciaPreview !== 0 && (
                      <p className="text-xs mt-1 text-red-500">
                        {diferenciaPreview > 0 ? 'Sobra efectivo respecto al esperado' : 'Falta efectivo respecto al esperado'}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                  <textarea
                    value={obsNueva}
                    onChange={e => setObsNueva(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none"
                    rows={2}
                    placeholder="Notas adicionales sobre esta rendicion..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {repartidorSeleccionado && (
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-gray-50">
              <button
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={creandoRendicion}
              >
                Cancelar
              </button>
              <button
                onClick={onCrearRendicion}
                disabled={creandoRendicion || efectivoDeclarado === '' || pedidosPagoPendienteCount > 0}
                className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pedidosPagoPendienteCount > 0
                  ? `${pedidosPagoPendienteCount} pago(s) pendiente(s)`
                  : creandoRendicion ? 'Creando...' : 'Crear Rendicion'}
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: Pedidos del reparto */}
        {repartidorSeleccionado && repartidorSeleccionado.pedidos && repartidorSeleccionado.pedidos.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xl w-full lg:w-1/2 overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-700 flex-shrink-0">
              <h3 className="font-bold text-white text-sm">
                Pedidos del Reparto ({repartidorSeleccionado.pedidos.length})
              </h3>
              <p className="text-slate-300 text-xs mt-0.5">{repartidorSeleccionado.zonaNombre}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {repartidorSeleccionado.pedidos.map(p => (
                <div key={p.id} className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-700">#{p.numeroTicket}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        p.estado === 'Entregado' ? 'bg-green-100 text-green-700' :
                        p.estado === 'NoEntregado' ? 'bg-red-100 text-red-700' :
                        p.estado === 'Cancelado' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-100 text-blue-700'
                      }`}>{p.estado}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.formaPago ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          p.formaPago.toLowerCase().includes('efectivo')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>{p.formaPago}</span>
                      ) : p.estado === 'Entregado' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-700 border border-orange-300">
                          Pago Pendiente
                        </span>
                      ) : null}
                      <span className="text-sm font-bold text-gray-800">${p.total.toLocaleString('es-AR')}</span>
                      {puedeEditarEstado && (
                        <button
                          onClick={() => onEditarPedido(p.id, p.estado, p.formaPago ?? undefined)}
                          className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar pedido"
                          aria-label="Editar pedido"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{p.nombreCliente || 'Sin cliente'}</span>
                    {p.direccionEntrega && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">{p.direccionEntrega}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
