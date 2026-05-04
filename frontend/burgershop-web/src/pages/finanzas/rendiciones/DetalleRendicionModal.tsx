import { useState, ReactNode } from 'react';
import { RendicionDto } from '../../../api/rendiciones';
import { Venta } from '../../../types';
import { getVenta } from '../../../api/pedidos';
import { useGlobalToast } from '../../../components/Toast';

interface Props {
  detalle: RendicionDto;
  estadoBadge: ReactNode;
  formatFecha: (fecha: string) => string;
  onClose: () => void;
  onAccion: (id: number, aprobar: boolean) => void;
}

export default function DetalleRendicionModal({ detalle, estadoBadge, formatFecha, onClose, onAccion }: Props) {
  const { showToast } = useGlobalToast();
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<number | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<Venta | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);

  const verDetallePedido = async (pedidoId: number) => {
    if (pedidoExpandidoId === pedidoId) {
      setPedidoExpandidoId(null);
      setPedidoExpandido(null);
      return;
    }
    setPedidoExpandidoId(pedidoId);
    setPedidoExpandido(null);
    setCargandoPedido(true);
    try {
      const data = await getVenta(pedidoId);
      setPedidoExpandido(data);
    } catch {
      showToast('Error al cargar detalle del pedido', 'error');
      setPedidoExpandidoId(null);
    } finally {
      setCargandoPedido(false);
    }
  };

  const handleCerrar = () => {
    setPedidoExpandidoId(null);
    setPedidoExpandido(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rendicion-detalle-title"
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-3 max-h-[85vh] w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* Panel izquierdo: Rendición */}
        <div className="bg-white rounded-xl shadow-2xl w-full lg:max-w-md lg:w-[28rem] overflow-hidden flex flex-col flex-1 min-h-0 lg:flex-none">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span id="rendicion-detalle-title" className="font-bold text-lg text-white">Rendicion #{detalle.id}</span>
                {estadoBadge}
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{detalle.repartidorNombre} - {formatFecha(detalle.fecha)}</p>
            </div>
            <button onClick={handleCerrar} className="text-slate-400 hover:text-white transition-colors p-1" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Efectivo</div>
                <div className="text-sm font-semibold mt-1">${detalle.totalEfectivo.toLocaleString('es-AR')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Transferencia</div>
                <div className="text-sm font-semibold mt-1">${detalle.totalTransferencia.toLocaleString('es-AR')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Efectivo Declarado</div>
                <div className="text-sm font-semibold mt-1">${detalle.efectivoDeclarado.toLocaleString('es-AR')}</div>
              </div>
              <div className={`rounded-lg p-3 ${detalle.diferencia !== 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Diferencia</div>
                <div className={`text-sm font-bold mt-1 ${detalle.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${detalle.diferencia.toLocaleString('es-AR')}
                </div>
              </div>
            </div>

            {detalle.montoInicialCambio > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-emerald-700 uppercase tracking-wider font-medium">Monto Inicial / Cambio</div>
                    <div className="text-xs text-emerald-600 mt-0.5">Efectivo entregado al repartidor al iniciar el reparto</div>
                  </div>
                  <div className="text-lg font-bold text-emerald-700">${detalle.montoInicialCambio.toLocaleString('es-AR')}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Entregados</div>
                <div className="text-sm font-semibold mt-1">{detalle.cantidadEntregados}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider">No Entregados</div>
                <div className="text-sm font-semibold mt-1">{detalle.cantidadNoEntregados}</div>
              </div>
            </div>

            {detalle.observaciones && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Observaciones del repartidor:</span> {detalle.observaciones}
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Pedidos incluidos</h4>
              <div className="space-y-2">
                {detalle.detalles.map(d => {
                  const isSelected = pedidoExpandidoId === d.ventaId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => verDetallePedido(d.ventaId)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                        isSelected ? 'bg-blue-100 border border-blue-300 ring-1 ring-blue-300' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm">{d.numeroTicket}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            d.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {d.estado}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.formaPago && <span className="text-xs text-gray-400">{d.formaPago}</span>}
                          <span className="text-sm text-gray-700 font-semibold">${d.total.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                      {(d.nombreCliente || d.direccionEntrega) && (
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                          {d.nombreCliente && <span className="font-medium text-gray-600">{d.nombreCliente}</span>}
                          {d.direccionEntrega && (
                            <span className="truncate max-w-[200px]" title={d.direccionEntrega}>{d.direccionEntrega}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {detalle.zonas && detalle.zonas.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Zonas del reparto</h4>
                <div className="space-y-1.5">
                  {detalle.zonas.map(z => (
                    <div key={z.zonaId} className="flex items-center justify-between text-sm bg-blue-50 rounded px-3 py-2">
                      <span className="font-medium text-gray-800">{z.zonaNombre}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">{z.totalEntregados} entregados</span>
                        <span className="text-red-600">{z.totalNoEntregados} no entreg.</span>
                        <span className="text-gray-500">{z.totalPedidos} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-amber-200 px-6 py-3 bg-amber-50 flex-shrink-0">
            <div className="flex justify-between font-bold text-base">
              <span className="text-amber-900">Total No Entregado</span>
              <span className="text-amber-700">${detalle.totalNoEntregado.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {!detalle.aprobada && !detalle.fechaAprobacion && (
            <div className="px-6 py-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => { handleCerrar(); onAccion(detalle.id, false); }}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => { handleCerrar(); onAccion(detalle.id, true); }}
                className="flex-[1.5] py-2.5 rounded-lg font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
              >
                Aprobar
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: Detalle del pedido */}
        {pedidoExpandido && (
          <div className="bg-white rounded-xl shadow-2xl w-full lg:w-[22rem] overflow-hidden flex flex-col flex-1 min-h-0 lg:flex-none animate-in slide-in-from-left-2">
            <div className="px-5 py-4 bg-slate-700 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="font-bold text-white">{pedidoExpandido.numeroTicket}</div>
                <div className="text-xs text-slate-300 mt-0.5">Detalle del pedido</div>
              </div>
              <button
                onClick={() => { setPedidoExpandidoId(null); setPedidoExpandido(null); }}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Cerrar detalle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="space-y-2">
                {pedidoExpandido.nombreCliente && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-gray-700 font-medium">{pedidoExpandido.nombreCliente}</span>
                  </div>
                )}
                {pedidoExpandido.telefonoCliente && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="text-gray-700">{pedidoExpandido.telefonoCliente}</span>
                  </div>
                )}
                {pedidoExpandido.direccionEntrega && (
                  <div className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-gray-700">{pedidoExpandido.direccionEntrega}</span>
                  </div>
                )}
                {pedidoExpandido.zonaNombre && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    <span className="text-gray-700">{pedidoExpandido.zonaNombre}</span>
                  </div>
                )}
              </div>

              {pedidoExpandido.notaInterna && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
                  <span className="font-medium">Nota:</span> {pedidoExpandido.notaInterna}
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Productos</h4>
                <div className="space-y-1.5">
                  {pedidoExpandido.lineas.map(l => (
                    <div key={l.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-blue-600 font-bold text-xs">{l.cantidad}x</span>
                        <span className="text-gray-700 truncate">{l.descripcion}</span>
                      </div>
                      <span className="text-gray-700 font-semibold flex-shrink-0 ml-2">${l.subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {pedidoExpandido.pagos && pedidoExpandido.pagos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Pagos</h4>
                  <div className="space-y-1">
                    {pedidoExpandido.pagos.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{p.formaPagoNombre}</span>
                        <span className="text-gray-700 font-medium">${p.totalACobrar.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex-shrink-0 space-y-1">
              {pedidoExpandido.descuento > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Descuento</span>
                  <span className="text-green-600 font-medium">-${pedidoExpandido.descuento.toLocaleString('es-AR')}</span>
                </div>
              )}
              {pedidoExpandido.recargo > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Recargo</span>
                  <span className="text-red-600 font-medium">+${pedidoExpandido.recargo.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">${pedidoExpandido.total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        )}

        {cargandoPedido && !pedidoExpandido && pedidoExpandidoId && (
          <div className="bg-white rounded-xl shadow-2xl w-full lg:w-[22rem] overflow-hidden flex items-center justify-center flex-1 min-h-0 lg:flex-none">
            <div className="text-gray-400 text-sm">Cargando pedido...</div>
          </div>
        )}
      </div>
    </div>
  );
}
