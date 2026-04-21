import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RendicionDto,
  RepartidorPendienteRendicionDto,
  getRendiciones,
  aprobarRendicion,
  getRepartidoresPendientes,
  crearRendicion,
} from '../../api/rendiciones';
import { getVenta, cambiarEstadoPedido } from '../../api/pedidos';
import { getFormasPagoActivas } from '../../api/formasPago';
import { Venta, FormaPago } from '../../types';
import { EstadoVenta } from '../../types/ventas';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import NuevaRendicionModal from './rendiciones/NuevaRendicionModal';
import EditarEstadoPedidoModal from './rendiciones/EditarEstadoPedidoModal';
import DetalleRendicionModal from './rendiciones/DetalleRendicionModal';

type FiltroEstado = 'todas' | 'pendientes' | 'aprobadas' | 'rechazadas';

export default function RendicionesPage() {
  const [rendiciones, setRendiciones] = useState<RendicionDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(hoy);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(hoy);
  const [ordenCol, setOrdenCol] = useState<string>('fecha');
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<{ id: number; aprobar: boolean } | null>(null);
  const [obsAdmin, setObsAdmin] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { showToast } = useGlobalToast();

  // Nueva Rendicion modal state
  const [mostrarNuevaRendicion, setMostrarNuevaRendicion] = useState(false);
  const [repartidoresPendientes, setRepartidoresPendientes] = useState<RepartidorPendienteRendicionDto[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<RepartidorPendienteRendicionDto | null>(null);
  const [efectivoDeclarado, setEfectivoDeclarado] = useState('');
  const [obsNueva, setObsNueva] = useState('');
  const [creandoRendicion, setCreandoRendicion] = useState(false);
  const [, setMostrarPedidosReparto] = useState(false);

  // Detalle de pedido expandido dentro del modal de rendición
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState<number | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<Venta | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);

  // Edición de estado de pedido (solo admin/superadmin)
  const { hasRole } = useAuth();
  const puedeEditarEstado = hasRole(RolUsuario.SuperAdmin, RolUsuario.Administrador);
  const [editandoEstadoPedidoId, setEditandoEstadoPedidoId] = useState<number | null>(null);
  const [nuevoEstadoPedido, setNuevoEstadoPedido] = useState<EstadoVenta>(EstadoVenta.Entregado);
  const [motivoNoEntregado, setMotivoNoEntregado] = useState('');
  const [nuevaFormaPagoId, setNuevaFormaPagoId] = useState<number | '' | 'dividido'>('');
  const [montoEfectivoRend, setMontoEfectivoRend] = useState('');
  const [montoTransferenciaRend, setMontoTransferenciaRend] = useState('');
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [guardandoEstadoPedido, setGuardandoEstadoPedido] = useState(false);

  useEffect(() => {
    if (!puedeEditarEstado) return;
    getFormasPagoActivas()
      .then(setFormasPago)
      .catch(() => { /* ignore */ });
  }, [puedeEditarEstado]);

  const abrirEditarEstado = (pedidoId: number, estadoActual: string, formaPagoActual?: string) => {
    setEditandoEstadoPedidoId(pedidoId);
    const estadoMap: Record<string, EstadoVenta> = {
      'Entregado': EstadoVenta.Entregado,
      'NoEntregado': EstadoVenta.NoEntregado,
      'EnCamino': EstadoVenta.EnCamino,
      'Asignado': EstadoVenta.Asignado,
    };
    setNuevoEstadoPedido(estadoMap[estadoActual] ?? EstadoVenta.Entregado);
    setMotivoNoEntregado('');
    // Pre-seleccionar forma de pago actual si matchea por nombre
    const fpMatch = formaPagoActual
      ? formasPago.find(fp => fp.nombre === formaPagoActual)
      : undefined;
    setNuevaFormaPagoId(fpMatch?.id ?? '');
  };

  const cerrarEditarEstado = () => {
    setEditandoEstadoPedidoId(null);
    setMotivoNoEntregado('');
    setNuevaFormaPagoId('');
    setMontoEfectivoRend('');
    setMontoTransferenciaRend('');
  };

  const confirmarCambioEstado = async () => {
    if (!editandoEstadoPedidoId) return;
    if (nuevoEstadoPedido === EstadoVenta.NoEntregado && !motivoNoEntregado.trim()) {
      showToast('El motivo es obligatorio para No Entregado', 'error');
      return;
    }
    setGuardandoEstadoPedido(true);
    try {
      const pagosDiv = nuevaFormaPagoId === 'dividido'
        ? (() => {
            const ef = parseFloat(montoEfectivoRend) || 0;
            const tr = parseFloat(montoTransferenciaRend) || 0;
            const p: { formaPagoId: number; monto: number }[] = [];
            if (ef > 0) p.push({ formaPagoId: 1, monto: ef });
            if (tr > 0) p.push({ formaPagoId: 2, monto: tr });
            return p.length > 0 ? p : undefined;
          })()
        : undefined;

      await cambiarEstadoPedido(
        editandoEstadoPedidoId,
        nuevoEstadoPedido,
        nuevoEstadoPedido === EstadoVenta.NoEntregado ? motivoNoEntregado.trim() : undefined,
        typeof nuevaFormaPagoId === 'number' ? nuevaFormaPagoId : undefined,
        pagosDiv
      );
      showToast('Pedido actualizado', 'success');
      cerrarEditarEstado();
      if (repartidorSeleccionado) {
        try {
          const data = await getRepartidoresPendientes();
          setRepartidoresPendientes(data);
          const actualizado = data.find(r =>
            r.repartidorId === repartidorSeleccionado.repartidorId &&
            r.repartoZonaId === repartidorSeleccionado.repartoZonaId
          );
          if (actualizado) setRepartidorSeleccionado(actualizado);
        } catch { /* ignore */ }
      }
    } catch {
      showToast('Error al actualizar el pedido', 'error');
    } finally {
      setGuardandoEstadoPedido(false);
    }
  };

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

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await getRendiciones(filtroFechaDesde || undefined, filtroFechaHasta || undefined);
      setRendiciones(data);
    } catch {
      // silenciar errores
    } finally {
      setCargando(false);
    }
  };

  // Cantidad de rendiciones pendientes de crear (para notificación)
  const [cantPendientes, setCantPendientes] = useState(0);

  const cargarPendientesCount = async () => {
    try {
      const data = await getRepartidoresPendientes();
      setCantPendientes(data.length);
    } catch { /* silenciar */ }
  };

  // Cargar al montar solo
  useEffect(() => {
    cargarDatos();
    cargarPendientesCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNuevaRendicion = useCallback(async () => {
    setMostrarNuevaRendicion(true);
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
    setCargandoPendientes(true);
    try {
      const data = await getRepartidoresPendientes();
      setRepartidoresPendientes(data);
    } catch {
      showToast('Error al cargar repartidores pendientes', 'error');
    } finally {
      setCargandoPendientes(false);
    }
  }, [showToast]);

  const cerrarNuevaRendicion = () => {
    setMostrarNuevaRendicion(false);
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
    setMostrarPedidosReparto(false);
  };

  const seleccionarRepartidor = (r: RepartidorPendienteRendicionDto) => {
    setRepartidorSeleccionado(r);
    setEfectivoDeclarado('');
    setObsNueva('');
  };

  const volverASeleccion = () => {
    setRepartidorSeleccionado(null);
    setEfectivoDeclarado('');
    setObsNueva('');
    setMostrarPedidosReparto(false);
  };

  const efectivoDeclaradoNum = parseFloat(efectivoDeclarado) || 0;
  const diferenciaPreview = repartidorSeleccionado
    ? efectivoDeclaradoNum - repartidorSeleccionado.totalEfectivo
    : 0;

  const pedidosPagoPendiente = repartidorSeleccionado?.pedidos.filter(
    p => p.estado === 'Entregado' && !p.formaPago
  ) ?? [];

  const handleCrearRendicion = async () => {
    if (!repartidorSeleccionado) return;
    if (pedidosPagoPendiente.length > 0) {
      showToast(`Hay ${pedidosPagoPendiente.length} pedido(s) con pago pendiente. Asignales una forma de pago antes de crear la rendicion.`, 'error');
      return;
    }
    setCreandoRendicion(true);
    try {
      await crearRendicion({
        repartidorId: repartidorSeleccionado.repartidorId,
        repartoZonaId: repartidorSeleccionado.repartoZonaId,
        efectivoDeclarado: efectivoDeclaradoNum,
        observaciones: obsNueva || undefined,
      });
      showToast('Rendicion creada correctamente', 'success');
      cerrarNuevaRendicion();
      await cargarDatos();
      await cargarPendientesCount();
    } catch {
      showToast('Error al crear la rendicion', 'error');
    } finally {
      setCreandoRendicion(false);
    }
  };

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  const rendicionesFiltradas = useMemo(() => {
    let lista = rendiciones;
    if (filtroEstado !== 'todas') {
      lista = lista.filter(r => {
        if (filtroEstado === 'pendientes') return !r.aprobada && !r.fechaAprobacion;
        if (filtroEstado === 'aprobadas') return r.aprobada;
        if (filtroEstado === 'rechazadas') return !r.aprobada && !!r.fechaAprobacion;
        return true;
      });
    }
    const dir = ordenDir === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (ordenCol) {
        case 'fecha': va = a.fecha; vb = b.fecha; break;
        case 'repartidorNombre': va = a.repartidorNombre; vb = b.repartidorNombre; break;
        case 'pedidos': va = a.cantidadEntregados + a.cantidadNoEntregados; vb = b.cantidadEntregados + b.cantidadNoEntregados; break;
        case 'efectivo': va = a.totalEfectivo; vb = b.totalEfectivo; break;
        case 'transferencia': va = a.totalTransferencia; vb = b.totalTransferencia; break;
        case 'declarado': va = a.efectivoDeclarado; vb = b.efectivoDeclarado; break;
        case 'diferencia': va = a.diferencia; vb = b.diferencia; break;
        case 'estado': va = a.aprobada ? 2 : a.fechaAprobacion ? 0 : 1; vb = b.aprobada ? 2 : b.fechaAprobacion ? 0 : 1; break;
        default: return 0;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rendiciones, filtroEstado, ordenCol, ordenDir]);

  const resumen = useMemo(() => {
    const pendientes = rendiciones.filter(r => !r.aprobada && !r.fechaAprobacion);
    const aprobadas = rendiciones.filter(r => r.aprobada);
    const totalEfectivo = rendiciones.reduce((s, r) => s + r.totalEfectivo, 0);
    const totalTransferencia = rendiciones.reduce((s, r) => s + r.totalTransferencia, 0);
    return { pendientes: pendientes.length, aprobadas: aprobadas.length, totalEfectivo, totalTransferencia };
  }, [rendiciones]);

  const [resultadoRevision, setResultadoRevision] = useState<number | null>(null);

  const handleAccion = (id: number, aprobar: boolean) => {
    setAccionPendiente({ id, aprobar });
    setObsAdmin('');
    setResultadoRevision(null);
  };

  const confirmarAccion = async () => {
    if (!accionPendiente) return;
    if (accionPendiente.aprobar && !resultadoRevision) {
      showToast('Selecciona el resultado de la revision', 'error');
      return;
    }
    setProcesando(true);
    try {
      await aprobarRendicion(accionPendiente.id, {
        aprobada: accionPendiente.aprobar,
        observaciones: obsAdmin || undefined,
        resultadoRevision: accionPendiente.aprobar ? resultadoRevision : undefined,
      });
      showToast(
        accionPendiente.aprobar ? 'Rendicion aprobada' : 'Rendicion rechazada',
        accionPendiente.aprobar ? 'success' : 'error'
      );
      setAccionPendiente(null);
      await cargarDatos();
    } catch {
      showToast('Error al procesar la rendicion', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    const f = fecha.endsWith('Z') || fecha.includes('+') ? fecha : fecha + 'Z';
    return new Date(f).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getResultadoBadge = (resultado?: number | null) => {
    if (resultado === 1) return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Sin Diferencia</span>;
    if (resultado === 2) return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">Dif. Leve</span>;
    if (resultado === 3) return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Dif. Grave</span>;
    return null;
  };

  const getEstadoBadge = (r: RendicionDto) => {
    if (r.aprobada) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Aprobada</span>
          {getResultadoBadge(r.resultadoRevision)}
        </div>
      );
    }
    if (r.fechaAprobacion) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Rechazada</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
  };

  const detalle = detalleId ? rendiciones.find(r => r.id === detalleId) : null;

  if (cargando && rendiciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Rendiciones</h2>
      </div>
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-lg shadow-lg p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Pendientes</div>
          <div className="text-2xl font-bold mt-1 text-yellow-400">{resumen.pendientes}</div>
        </div>
        <div className="bg-slate-700 rounded-lg shadow-lg p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Aprobadas</div>
          <div className="text-2xl font-bold mt-1 text-green-400">{resumen.aprobadas}</div>
        </div>
        <div className="bg-slate-700 rounded-lg shadow-lg p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Efectivo</div>
          <div className="text-lg font-bold mt-1 text-white">${resumen.totalEfectivo.toLocaleString('es-AR')}</div>
        </div>
        <div className="bg-slate-700 rounded-lg shadow-lg p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Transferencia</div>
          <div className="text-lg font-bold mt-1 text-white">${resumen.totalTransferencia.toLocaleString('es-AR')}</div>
        </div>
      </div>

      {/* Banner pendientes */}
      {cantPendientes > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-1.5">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-green-800">
            {cantPendientes === 1 ? 'Hay 1 reparto pendiente de rendicion' : `Hay ${cantPendientes} repartos pendientes de rendicion`}
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={e => setFiltroFechaDesde(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={e => setFiltroFechaHasta(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value as FiltroEstado)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="aprobadas">Aprobadas</option>
              <option value="rechazadas">Rechazadas</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1.5"
            >
              {cargando ? (
                <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={() => { setFiltroFechaDesde(hoy); setFiltroFechaHasta(hoy); setFiltroEstado('todas'); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="ml-auto flex items-end gap-3">
            <button
              onClick={abrirNuevaRendicion}
              className="px-4 py-2 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Rendicion
              {cantPendientes > 0 && (
                <span className="bg-white text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{cantPendientes}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de rendiciones */}
      <div className="bg-white rounded-lg shadow p-6">
        {rendicionesFiltradas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay rendiciones para mostrar</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {([
                    ['fecha', 'Fecha', 'text-left'],
                    ['repartidorNombre', 'Repartidor', 'text-left'],
                    ['pedidos', 'Pedidos', 'text-right'],
                    ['efectivo', 'Efectivo', 'text-right'],
                    ['transferencia', 'Transferencia', 'text-right'],
                    ['declarado', 'Declarado', 'text-right'],
                    ['diferencia', 'Diferencia', 'text-right'],
                    ['estado', 'Estado', 'text-center'],
                  ] as [string, string, string][]).map(([col, label, align]) => (
                    <th
                      key={col}
                      onClick={() => toggleOrden(col)}
                      className={`${align} px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors`}
                    >
                      {label}
                      {ordenCol === col && (
                        <span className="ml-1 text-amber-600">{ordenDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rendicionesFiltradas.map(r => {
                  const esPendiente = !r.aprobada && !r.fechaAprobacion;
                  return (
                    <tr key={r.id} className={esPendiente ? 'bg-yellow-50/50' : ''}>
                      <td className="px-4 py-3 text-sm">{formatFecha(r.fecha)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{r.repartidorNombre}</td>
                      <td className="px-4 py-3 text-sm text-right">{r.cantidadEntregados + r.cantidadNoEntregados}</td>
                      <td className="px-4 py-3 text-sm text-right">${r.totalEfectivo.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-right">${r.totalTransferencia.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${r.efectivoDeclarado.toLocaleString('es-AR')}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${r.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${r.diferencia.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{getEstadoBadge(r)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetalleId(r.id)}
                            className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200"
                          >
                            Ver
                          </button>
                          {esPendiente && (
                            <>
                              <button
                                onClick={() => handleAccion(r.id, true)}
                                className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors border border-green-200"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleAccion(r.id, false)}
                                className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors border border-red-200"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      {detalle && (
        <DetalleRendicionModal
          detalle={detalle}
          estadoBadge={getEstadoBadge(detalle)}
          formatFecha={formatFecha}
          onClose={() => setDetalleId(null)}
          onAccion={handleAccion}
        />
      )}
      {/* Modal Nueva Rendicion */}
      {mostrarNuevaRendicion && (
        <NuevaRendicionModal
          repartidoresPendientes={repartidoresPendientes}
          repartidorSeleccionado={repartidorSeleccionado}
          cargandoPendientes={cargandoPendientes}
          efectivoDeclarado={efectivoDeclarado}
          setEfectivoDeclarado={setEfectivoDeclarado}
          diferenciaPreview={diferenciaPreview}
          obsNueva={obsNueva}
          setObsNueva={setObsNueva}
          creandoRendicion={creandoRendicion}
          puedeEditarEstado={puedeEditarEstado}
          pedidosPagoPendienteCount={pedidosPagoPendiente.length}
          onSeleccionarRepartidor={seleccionarRepartidor}
          onVolverASeleccion={volverASeleccion}
          onCerrar={cerrarNuevaRendicion}
          onCrearRendicion={handleCrearRendicion}
          onEditarPedido={abrirEditarEstado}
        />
      )}
      {/* Modal Editar Estado Pedido */}
      {editandoEstadoPedidoId && (
        <EditarEstadoPedidoModal
          nuevoEstado={nuevoEstadoPedido}
          setNuevoEstado={setNuevoEstadoPedido}
          nuevaFormaPagoId={nuevaFormaPagoId}
          setNuevaFormaPagoId={setNuevaFormaPagoId}
          montoEfectivo={montoEfectivoRend}
          setMontoEfectivo={setMontoEfectivoRend}
          montoTransferencia={montoTransferenciaRend}
          setMontoTransferencia={setMontoTransferenciaRend}
          motivoNoEntregado={motivoNoEntregado}
          setMotivoNoEntregado={setMotivoNoEntregado}
          formasPago={formasPago}
          totalPedido={repartidorSeleccionado?.pedidos.find(p => p.id === editandoEstadoPedidoId)?.total ?? 0}
          guardando={guardandoEstadoPedido}
          onCancel={cerrarEditarEstado}
          onConfirm={confirmarCambioEstado}
        />
      )}
      {/* Modal Confirmar Accion */}
      <ConfirmModal
        visible={!!accionPendiente}
        titulo={accionPendiente?.aprobar ? 'Aprobar Rendicion' : 'Rechazar Rendicion'}
        mensaje={accionPendiente?.aprobar
          ? 'Se aprobara esta rendicion del repartidor'
          : 'Se rechazara esta rendicion. El repartidor debera corregirla.'
        }
        tipo={accionPendiente?.aprobar ? 'success' : 'danger'}
        textoConfirmar={accionPendiente?.aprobar ? 'Aprobar' : 'Rechazar'}
        cargando={procesando}
        detalle={
          <div className="space-y-3">
            {accionPendiente?.aprobar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resultado de la revision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: 'Sin Diferencia', inactive: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100', active: 'bg-green-600 text-white border-green-600' },
                    { val: 2, label: 'Dif. Leve', inactive: 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100', active: 'bg-yellow-500 text-white border-yellow-500' },
                    { val: 3, label: 'Dif. Grave', inactive: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100', active: 'bg-red-600 text-white border-red-600' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setResultadoRevision(opt.val)}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${resultadoRevision === opt.val ? opt.active : opt.inactive}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
              <textarea
                value={obsAdmin}
                onChange={e => setObsAdmin(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="Observaciones para el repartidor..."
              />
            </div>
          </div>
        }
        onConfirmar={confirmarAccion}
        onCancelar={() => setAccionPendiente(null)}
      />
    </div>
  );
}
