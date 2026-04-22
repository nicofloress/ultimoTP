import { useEffect, useRef, useState } from 'react';
import { Venta, EstadoVenta, estadoLabels, FormaPago } from '../../../types';
import { ClienteDto } from '../../../types/ventas';
import { Zona } from '../../../types/logistica';
import { actualizarDatosPedido, cambiarEstado, cambiarEstadoPedido } from '../../../api/pedidos';
import { buscarClientes, getCliente } from '../../../api/clientes';
import { useGlobalToast } from '../../../components/Toast';
import { useListNavigation } from '../../../hooks/useListNavigation';

interface Props {
  pedido: Venta;
  formasPago: FormaPago[];
  zonas: Zona[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass = inputClass;

const ESTADOS_EDITABLES: EstadoVenta[] = [
  EstadoVenta.Pendiente,
  EstadoVenta.Asignado,
  EstadoVenta.EnCamino,
  EstadoVenta.Entregado,
  EstadoVenta.NoEntregado,
  EstadoVenta.Cancelado,
];

export default function EditarPedidoModal({ pedido, formasPago, zonas, onClose, onSaved }: Props) {
  const { showToast } = useGlobalToast();

  const [cliente, setCliente] = useState<ClienteDto | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState(pedido.nombreCliente || '');
  const [sugerencias, setSugerencias] = useState<ClienteDto[]>([]);
  const [nombreCliente, setNombreCliente] = useState(pedido.nombreCliente || '');
  const [telefono, setTelefono] = useState(pedido.telefonoCliente || '');
  const [direccion, setDireccion] = useState(pedido.direccionEntrega || '');
  const [zonaId, setZonaId] = useState<number | ''>(pedido.zonaId || '');
  const [notaInterna, setNotaInterna] = useState(pedido.notaInterna || '');
  const [estaPago, setEstaPago] = useState(pedido.estaPago);
  const [estado, setEstado] = useState<EstadoVenta>(pedido.estado);
  const [formaPagoId, setFormaPagoId] = useState<number | '' | 'dividido'>(
    pedido.pagos && pedido.pagos.length > 1 ? 'dividido' : (pedido.formaPagoId || '')
  );
  const [montoEfectivo, setMontoEfectivo] = useState<string>(
    pedido.pagos?.find(p => p.formaPagoId === 1)?.monto?.toString() || ''
  );
  const [montoTransferencia, setMontoTransferencia] = useState<string>(
    pedido.pagos?.find(p => p.formaPagoId === 2)?.monto?.toString() || ''
  );
  const [motivoCancel, setMotivoCancel] = useState('');
  const [guardando, setGuardando] = useState(false);
  const clienteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pedido.clienteId) {
      getCliente(pedido.clienteId).then(setCliente).catch(() => {});
    }
  }, [pedido.clienteId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) {
        setSugerencias([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buscarClientesHandler = async (term: string) => {
    setBusquedaCliente(term);
    setNombreCliente(term);
    if (term.length >= 2) {
      try {
        const results = await buscarClientes(term);
        setSugerencias(results);
      } catch {
        setSugerencias([]);
      }
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarCliente = (c: ClienteDto) => {
    setCliente(c);
    setBusquedaCliente(c.nombre);
    setNombreCliente(c.nombre);
    setSugerencias([]);
    if (c.telefono) setTelefono(c.telefono);
    if (c.direccion) setDireccion(c.direccion);
    if (c.zonaId) setZonaId(c.zonaId);
  };

  const limpiarCliente = () => {
    setCliente(null);
    setBusquedaCliente('');
    setSugerencias([]);
  };

  const clientesNav = useListNavigation(sugerencias, {
    onSelect: seleccionarCliente,
    onEscape: () => setSugerencias([]),
    dataAttr: 'data-cliente-idx',
  });

  const guardar = async () => {
    if (estado === EstadoVenta.Cancelado && pedido.estado !== EstadoVenta.Cancelado && !motivoCancel.trim()) {
      showToast('Ingresa un motivo para cancelar', 'error');
      return;
    }
    setGuardando(true);
    try {
      await actualizarDatosPedido(pedido.id, {
        clienteId: cliente?.id ?? null,
        nombreCliente: nombreCliente || pedido.nombreCliente || 'Consumidor Final',
        telefonoCliente: telefono,
        direccionEntrega: direccion,
        zonaId: zonaId === '' ? null : zonaId,
        notaInterna,
        estaPago,
      });

      const eraDividido = (pedido.pagos?.length ?? 0) > 1;
      const esDividido = formaPagoId === 'dividido';
      const formaPagoCambio = esDividido
        ? !eraDividido || Number(montoEfectivo || 0) !== (pedido.pagos?.find(p => p.formaPagoId === 1)?.monto ?? 0)
          || Number(montoTransferencia || 0) !== (pedido.pagos?.find(p => p.formaPagoId === 2)?.monto ?? 0)
        : eraDividido || (formaPagoId || null) !== (pedido.formaPagoId || null);
      const estadoCambio = estado !== pedido.estado;

      const pagosDiv: { formaPagoId: number; monto: number }[] | undefined = esDividido
        ? (() => {
            const ef = parseFloat(montoEfectivo) || 0;
            const tr = parseFloat(montoTransferencia) || 0;
            const p: { formaPagoId: number; monto: number }[] = [];
            if (ef > 0) p.push({ formaPagoId: 1, monto: ef });
            if (tr > 0) p.push({ formaPagoId: 2, monto: tr });
            return p.length > 0 ? p : undefined;
          })()
        : undefined;

      if (esDividido && !pagosDiv) {
        showToast('Ingresa el detalle del pago dividido', 'error');
        setGuardando(false);
        return;
      }

      const formaPagoNumerica = typeof formaPagoId === 'number' ? formaPagoId : undefined;

      if (estadoCambio || formaPagoCambio) {
        if (estadoCambio && (estado === EstadoVenta.Entregado || estado === EstadoVenta.NoEntregado)) {
          await cambiarEstadoPedido(
            pedido.id,
            estado,
            estado === EstadoVenta.NoEntregado ? motivoCancel : undefined,
            formaPagoNumerica,
            pagosDiv,
          );
        } else if (estadoCambio) {
          await cambiarEstado(pedido.id, estado);
          if (formaPagoCambio && (formaPagoNumerica !== undefined || pagosDiv)) {
            await cambiarEstadoPedido(pedido.id, estado, undefined, formaPagoNumerica, pagosDiv);
          }
        } else if (formaPagoCambio) {
          await cambiarEstadoPedido(
            pedido.id,
            estado,
            undefined,
            formaPagoNumerica,
            pagosDiv,
          );
        }
      }

      showToast('Pedido actualizado correctamente', 'success');
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editar-pedido-title"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 bg-slate-700 rounded-t-xl flex items-center justify-between">
          <h3 id="editar-pedido-title" className="font-bold text-white text-base">
            Editar pedido <span className="text-amber-400">#{pedido.numeroTicket}</span>
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          {/* Cliente */}
          <div ref={clienteRef}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => buscarClientesHandler(e.target.value)}
                onKeyDown={clientesNav.handleKeyDown}
                placeholder="Buscar cliente..."
                className={inputClass}
              />
              {cliente && (
                <button
                  type="button"
                  onClick={limpiarCliente}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Limpiar cliente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {sugerencias.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-40 overflow-y-auto">
                  {sugerencias.map((c, idx) => (
                    <button
                      key={c.id}
                      data-cliente-idx={idx}
                      type="button"
                      onMouseEnter={() => clientesNav.setActiveIndex(idx)}
                      onClick={() => seleccionarCliente(c)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 text-left ${clientesNav.activeIndex === idx ? 'bg-amber-100' : 'hover:bg-amber-50'}`}
                    >
                      <span className="font-medium text-gray-800 truncate">{c.nombre}</span>
                      {c.telefono && <span className="text-gray-400 ml-2 text-xs">{c.telefono}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Teléfono + Dirección */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Zona</label>
              <select value={zonaId} onChange={e => setZonaId(e.target.value === '' ? '' : Number(e.target.value))} className={selectClass}>
                <option value="">— Sin zona —</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
            <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} className={inputClass} />
          </div>

          <hr className="border-gray-100" />

          {/* Estado + Forma pago */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
              <select value={estado} onChange={e => setEstado(Number(e.target.value) as EstadoVenta)} className={selectClass}>
                {ESTADOS_EDITABLES.map(est => (
                  <option key={est} value={est}>{estadoLabels[est]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Forma de pago</label>
              <select
                value={formaPagoId}
                onChange={e => {
                  const v = e.target.value;
                  setFormaPagoId(v === '' ? '' : v === 'dividido' ? 'dividido' : Number(v));
                  if (v !== 'dividido') { setMontoEfectivo(''); setMontoTransferencia(''); }
                }}
                className={selectClass}
              >
                <option value="">— Sin cambios —</option>
                {formasPago.map(fp => <option key={fp.id} value={fp.id}>{fp.nombre}</option>)}
                <option value="dividido">Dividido (Efectivo + Transferencia)</option>
              </select>
            </div>
          </div>

          {formaPagoId === 'dividido' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Efectivo</label>
                  <input
                    type="number"
                    value={montoEfectivo}
                    onChange={e => {
                      setMontoEfectivo(e.target.value);
                      const ef = parseFloat(e.target.value) || 0;
                      const resto = Math.max(0, pedido.total - ef);
                      setMontoTransferencia(resto > 0 ? resto.toString() : '');
                    }}
                    placeholder="$0"
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Transferencia</label>
                  <input
                    type="number"
                    value={montoTransferencia}
                    onChange={e => setMontoTransferencia(e.target.value)}
                    placeholder="$0"
                    min={0}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total pedido: <strong className="text-gray-800">${pedido.total.toLocaleString('es-AR')}</strong></span>
                <span>
                  Suma: <strong className={`${(parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0) === pedido.total ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${((parseFloat(montoEfectivo) || 0) + (parseFloat(montoTransferencia) || 0)).toLocaleString('es-AR')}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={estaPago} onChange={e => setEstaPago(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            <span className="text-gray-700 font-medium">Está pago</span>
          </label>

          {(estado === EstadoVenta.NoEntregado || (estado === EstadoVenta.Cancelado && pedido.estado !== EstadoVenta.Cancelado)) && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea value={motivoCancel} onChange={e => setMotivoCancel(e.target.value)} rows={2} className={inputClass} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nota interna</label>
            <textarea value={notaInterna} onChange={e => setNotaInterna(e.target.value)} rows={2} className={inputClass} />
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} disabled={guardando} className="px-4 py-1.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando} className="px-4 py-1.5 rounded bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
