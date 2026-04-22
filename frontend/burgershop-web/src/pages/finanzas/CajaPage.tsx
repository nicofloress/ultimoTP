import { useEffect, useState } from 'react';
import { CierreCaja, EstadoCaja, ResultadoRevision } from '../../types';
import { getCajaAbierta, abrirCaja, cerrarCaja, getHistorialCajas, getCaja, getPendientesRevision, revisarCaja, getVentasCaja, VentaCajaDto } from '../../api/caja';
import { crearMovimiento } from '../../api/movimientos';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { useLocalActivo } from '../../context/LocalContext';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import DetalleCajaModal from './caja/DetalleCajaModal';
import RevisionCajaModal from './caja/RevisionCajaModal';

const hoy = new Date();
const hace7Dias = new Date(hoy);
hace7Dias.setDate(hoy.getDate() - 7);
const toInputDate = (d: Date) => d.toISOString().split('T')[0];

export default function CajaPage() {
  const { localActivo } = useLocalActivo();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === RolUsuario.SuperAdmin || usuario?.rol === RolUsuario.Administrador;
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [pendientes, setPendientes] = useState<CierreCaja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [montoInicial, setMontoInicial] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [montoEfectivoReal, setMontoEfectivoReal] = useState(0);
  const [detalleExpandido, setDetalleExpandido] = useState<number | null>(null);
  const [mostrarConfirmCierre, setMostrarConfirmCierre] = useState(false);
  const [cajaDetalle, setCajaDetalle] = useState<CierreCaja | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const { showToast } = useGlobalToast();

  // Revisión (admin)
  const [cajaRevisando, setCajaRevisando] = useState<CierreCaja | null>(null);
  const [revResultado, setRevResultado] = useState<number>(0);
  const [revObservaciones, setRevObservaciones] = useState('');
  const [revGuardando, setRevGuardando] = useState(false);
  // Movimiento correctivo (admin)
  const [mostrarMovCorrectivo, setMostrarMovCorrectivo] = useState(false);
  const [movMonto, setMovMonto] = useState(0);
  const [movObs, setMovObs] = useState('');
  const [movTipo, setMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  // Ventas de la caja (desglose opcional)
  const [ventasCaja, setVentasCaja] = useState<VentaCajaDto[]>([]);
  const [formaPagoExpandida, setFormaPagoExpandida] = useState<string | null>(null);

  // Filtros historial
  const [fechaDesde, setFechaDesde] = useState(toInputDate(hace7Dias));
  const [fechaHasta, setFechaHasta] = useState(toInputDate(hoy));
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Ordenamiento historial
  const [sortField, setSortField] = useState<string>('fechaApertura');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const historialOrdenado = [...historial].sort((a, b) => {
    let valA: number | string = 0;
    let valB: number | string = 0;
    switch (sortField) {
      case 'fechaApertura': valA = a.fechaApertura; valB = b.fechaApertura; break;
      case 'fechaCierre': valA = a.fechaCierre ?? ''; valB = b.fechaCierre ?? ''; break;
      case 'montoInicial': valA = a.montoInicial; valB = b.montoInicial; break;
      case 'montoFinal': valA = a.montoFinal ?? 0; valB = b.montoFinal ?? 0; break;
      case 'cantidadTotal': valA = a.cantidadTotal; valB = b.cantidadTotal; break;
      case 'totalGeneral': valA = a.totalGeneral; valB = b.totalGeneral; break;
      case 'cantidadDomicilio': valA = a.cantidadDomicilio ?? 0; valB = b.cantidadDomicilio ?? 0; break;
      case 'totalDomicilio': valA = a.totalDomicilio ?? 0; valB = b.totalDomicilio ?? 0; break;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const hist = await getHistorialCajas(localActivo || undefined, fechaDesde, fechaHasta);
      setHistorial(hist);
    } catch {
      showToast('Error al cargar el historial', 'error');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const promises: Promise<unknown>[] = [
        getCajaAbierta(localActivo || undefined),
        getHistorialCajas(localActivo || undefined, fechaDesde, fechaHasta),
      ];
      if (esAdmin) promises.push(getPendientesRevision(localActivo || undefined));
      const [caja, hist, pend] = await Promise.all(promises);
      setCajaAbierta(caja as CierreCaja | null);
      setHistorial(hist as CierreCaja[]);
      if (esAdmin) setPendientes(pend as CierreCaja[]);
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
      showToast('Error al abrir la caja', 'error');
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
      await cerrarCaja(cajaAbierta.id, { montoEfectivoReal, observaciones: observacionesCierre || undefined });
      setObservacionesCierre('');
      setMontoEfectivoReal(0);
      await cargarDatos();
      showToast('Caja enviada a revision', 'success');
    } catch {
      showToast('Error al cerrar la caja', 'error');
    }
  };

  // Admin: revisar caja
  const handleRevisar = async () => {
    if (!cajaRevisando) return;
    setRevGuardando(true);
    try {
      await revisarCaja(cajaRevisando.id, { resultado: revResultado, observaciones: revObservaciones || undefined });
      showToast('Caja revisada correctamente', 'success');
      setCajaRevisando(null);
      setRevObservaciones('');
      setRevResultado(0);
      await cargarDatos();
    } catch {
      showToast('Error al revisar la caja', 'error');
    } finally {
      setRevGuardando(false);
    }
  };

  // Admin: movimiento correctivo
  const handleMovCorrectivo = async () => {
    if (!cajaRevisando || movMonto <= 0) return;
    try {
      const codigoAccionId = movTipo === 'ingreso' ? 6 : 7; // AJU_POS=6, AJU_NEG=7
      await crearMovimiento({
        codigoAccionId,
        localId: cajaRevisando.localId || localActivo || 1,
        cantidad: movMonto,
        precioUnitario: 1,
        fechaMovimiento: new Date().toISOString(),
        observaciones: `Ajuste correctivo caja #${cajaRevisando.id}: ${movObs}`,
      });
      showToast(`Movimiento ${movTipo} registrado`, 'success');
      setMostrarMovCorrectivo(false);
      setMovMonto(0);
      setMovObs('');
      // Recargar la caja revisando
      const updated = await getCaja(cajaRevisando.id);
      setCajaRevisando(updated);
    } catch {
      showToast('Error al registrar movimiento', 'error');
    }
  };

  const handleVerDetalle = async (id: number) => {
    setCargandoDetalle(true);
    try {
      const caja = await getCaja(id);
      setCajaDetalle(caja);
    } catch {
      showToast('Error al cargar detalle de caja', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const formatMonto = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Caja Diaria</h2>
      </div>
      {/* Estado de la Caja */}
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-6">
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
              className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-6 py-2 font-medium transition-colors"
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
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Fecha Apertura</div>
                <div className="text-sm font-semibold mt-1">{formatFecha(cajaAbierta.fechaApertura)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Monto Inicial</div>
                <div className="text-sm font-semibold mt-1">${cajaAbierta.montoInicial.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 shadow-md border border-green-200">
                <div className="text-xs text-green-600 uppercase tracking-wider">Ventas Mostrador</div>
                <div className="text-sm text-gray-600 mt-0.5">{cajaAbierta.cantidadMostrador ?? 0} ventas</div>
                <div className="text-lg font-bold text-green-600">${(cajaAbierta.totalMostrador ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 shadow-md border border-blue-200">
                <div className="text-xs text-blue-600 uppercase tracking-wider">Pedidos Domicilio</div>
                <div className="text-sm text-gray-600 mt-0.5">{cajaAbierta.cantidadDomicilio ?? 0} pedidos</div>
                <div className="text-lg font-bold text-blue-600">${(cajaAbierta.totalDomicilio ?? 0).toLocaleString()}</div>
              </div>
            </div>
            {(cajaAbierta.cantidadCtaCte ?? 0) > 0 && (
              <div className="bg-purple-50 rounded-lg p-3 shadow-md border border-purple-200 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-600 uppercase tracking-wider font-semibold">Cuenta Corriente</span>
                  <span className="text-sm text-gray-600 ml-2">{cajaAbierta.cantidadCtaCte} ventas a credito</span>
                </div>
                <span className="text-lg font-bold text-purple-600">${(cajaAbierta.totalCtaCte ?? 0).toLocaleString()}</span>
              </div>
            )}

            {cajaAbierta.observaciones && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-medium">Observaciones:</span> {cajaAbierta.observaciones}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo contado al cierre <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={montoEfectivoReal || ''}
                  onChange={e => setMontoEfectivoReal(Number(e.target.value))}
                  className="border rounded px-3 py-2 max-w-xs"
                  min={0}
                  step={100}
                  placeholder="Ingrese el efectivo contado..."
                />
              </div>
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
              <div className="flex gap-3">
                <button
                  onClick={handleCerrarCaja}
                  disabled={montoEfectivoReal <= 0}
                  className="text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 px-6 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cerrar Caja
                </button>
                <button
                  onClick={() => handleVerDetalle(cajaAbierta.id)}
                  className="text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 px-6 py-2 font-medium transition-colors"
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pendientes de Revisión (solo admin) */}
      {esAdmin && pendientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl border-2 border-amber-300 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            Cajas Pendientes de Revision
            <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{pendientes.length}</span>
          </h2>
          <div className="space-y-3">
            {pendientes.map(caja => {
              const dif = caja.diferenciaCaja ?? 0;
              const difColor = dif === 0 ? 'text-green-600' : dif > 0 ? 'text-blue-600' : 'text-red-600';
              return (
                <div key={caja.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm font-semibold">Caja #{caja.id} - {caja.localNombre || 'Local'}</div>
                    <div className="text-xs text-gray-500">{formatFecha(caja.fechaApertura)} → {caja.fechaCierre ? formatFecha(caja.fechaCierre) : '-'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Efectivo Esperado</div>
                    <div className="text-sm font-semibold">${formatMonto(caja.montoInicial + (caja.detalles.find(d => d.formaPagoNombre.toLowerCase() === 'efectivo')?.montoTotal ?? 0))}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Declarado</div>
                    <div className="text-sm font-semibold">${formatMonto(caja.montoEfectivoReal ?? 0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Diferencia</div>
                    <div className={`text-sm font-bold ${difColor}`}>${formatMonto(dif)}</div>
                  </div>
                  <button
                    onClick={async () => {
                      const [full, vtas] = await Promise.all([getCaja(caja.id), getVentasCaja(caja.id)]);
                      setCajaRevisando(full);
                      setVentasCaja(vtas);
                      setRevResultado(0);
                      setRevObservaciones('');
                      setFormaPagoExpandida(null);
                    }}
                    className="text-amber-700 bg-amber-100 border border-amber-400 rounded-md hover:bg-amber-200 px-4 py-2 text-sm font-semibold"
                  >
                    Revisar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de Cierres */}
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300 p-6">
        <h2 className="text-lg font-bold mb-4">Historial de Cierres</h2>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            className="px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1.5"
          >
            {cargandoHistorial ? (
              <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {cargandoHistorial ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {historialOrdenado.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay registros de caja en el período seleccionado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('fechaApertura')}
                    className="cursor-pointer text-left px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Fecha Apertura {sortField === 'fechaApertura' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('fechaCierre')}
                    className="cursor-pointer text-left px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none hidden sm:table-cell"
                  >
                    Fecha Cierre {sortField === 'fechaCierre' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('montoInicial')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none hidden md:table-cell"
                  >
                    Monto Inicial {sortField === 'montoInicial' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('montoFinal')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none hidden md:table-cell"
                  >
                    Monto Final {sortField === 'montoFinal' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('cantidadTotal')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none hidden sm:table-cell"
                  >
                    Cant. Ventas {sortField === 'cantidadTotal' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('totalGeneral')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Total Ventas {sortField === 'totalGeneral' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('cantidadDomicilio')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-blue-500 hover:text-blue-700 select-none hidden sm:table-cell"
                  >
                    Cant. Pedidos {sortField === 'cantidadDomicilio' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('totalDomicilio')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-blue-500 hover:text-blue-700 select-none hidden sm:table-cell"
                  >
                    Total Pedidos {sortField === 'totalDomicilio' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historialOrdenado.map(caja => (
                  <tr key={caja.id} className="group">
                    <td colSpan={9} className="p-0">
                      <button
                        onClick={() => setDetalleExpandido(detalleExpandido === caja.id ? null : caja.id)}
                        className="w-full text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="px-3 py-3 text-xs sm:text-sm" style={{ flex: '1 1 0' }}>{formatFecha(caja.fechaApertura)}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm hidden sm:block" style={{ flex: '1 1 0' }}>{caja.fechaCierre ? formatFecha(caja.fechaCierre) : '-'}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right hidden md:block" style={{ flex: '1 1 0' }}>${caja.montoInicial.toLocaleString()}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right hidden md:block" style={{ flex: '1 1 0' }}>{caja.montoFinal != null ? `$${caja.montoFinal.toLocaleString()}` : '-'}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right hidden sm:block" style={{ flex: '1 1 0' }}>{caja.cantidadTotal}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right font-medium" style={{ flex: '1 1 0' }}>${caja.totalGeneral.toLocaleString()}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right text-blue-700 hidden sm:block" style={{ flex: '1 1 0' }}>{caja.cantidadDomicilio ?? 0}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-right font-medium text-blue-700 hidden sm:block" style={{ flex: '1 1 0' }}>${(caja.totalDomicilio ?? 0).toLocaleString()}</div>
                          <div className="px-3 py-3 text-xs sm:text-sm text-center" style={{ flex: '1 1 0' }}>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              caja.estado === EstadoCaja.Abierta ? 'bg-green-100 text-green-800'
                              : caja.estado === EstadoCaja.PendienteRevision ? 'bg-amber-100 text-amber-800'
                              : caja.resultadoRevision === ResultadoRevision.SinDiferencia ? 'bg-green-100 text-green-700'
                              : caja.resultadoRevision === ResultadoRevision.DiferenciaLeve ? 'bg-yellow-100 text-yellow-800'
                              : caja.resultadoRevision === ResultadoRevision.DiferenciaGrave ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                            }`}>
                              {caja.estado === EstadoCaja.Abierta ? 'Abierta'
                              : caja.estado === EstadoCaja.PendienteRevision ? 'Pendiente'
                              : caja.resultadoRevision === ResultadoRevision.SinDiferencia ? 'OK'
                              : caja.resultadoRevision === ResultadoRevision.DiferenciaLeve ? 'Dif. Leve'
                              : caja.resultadoRevision === ResultadoRevision.DiferenciaGrave ? 'Dif. Grave'
                              : 'Cerrada'}
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
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVerDetalle(caja.id); }}
                              className="text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 px-4 py-1.5 text-sm font-medium transition-colors"
                            >
                              Ver Detalle
                            </button>
                            {esAdmin && caja.estado === EstadoCaja.Cerrada && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const [full, vtas] = await Promise.all([getCaja(caja.id), getVentasCaja(caja.id)]);
                                  setCajaRevisando(full);
                                  setVentasCaja(vtas);
                                  setRevResultado(full.resultadoRevision ?? 0);
                                  setRevObservaciones(full.observacionRevision ?? '');
                                  setFormaPagoExpandida(null);
                                }}
                                className="text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 px-4 py-1.5 text-sm font-medium transition-colors"
                              >
                                Editar Revision
                              </button>
                            )}
                          </div>
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

      {/* Modal Detalle de Caja */}
      <DetalleCajaModal
        caja={cajaDetalle}
        cargando={cargandoDetalle}
        onClose={() => setCajaDetalle(null)}
        formatMonto={formatMonto}
        formatFecha={formatFecha}
      />
      {/* Modal Revisión de Caja (admin) */}
      {cajaRevisando && (
        <RevisionCajaModal
          caja={cajaRevisando}
          ventasCaja={ventasCaja}
          revResultado={revResultado}
          setRevResultado={setRevResultado}
          revObservaciones={revObservaciones}
          setRevObservaciones={setRevObservaciones}
          revGuardando={revGuardando}
          mostrarMovCorrectivo={mostrarMovCorrectivo}
          setMostrarMovCorrectivo={setMostrarMovCorrectivo}
          movMonto={movMonto}
          setMovMonto={setMovMonto}
          movObs={movObs}
          setMovObs={setMovObs}
          movTipo={movTipo}
          setMovTipo={setMovTipo}
          formaPagoExpandida={formaPagoExpandida}
          setFormaPagoExpandida={setFormaPagoExpandida}
          onClose={() => { setCajaRevisando(null); setFormaPagoExpandida(null); }}
          onRevisar={handleRevisar}
          onMovCorrectivo={handleMovCorrectivo}
          formatMonto={formatMonto}
          formatFecha={formatFecha}
        />
      )}
    </div>
  );
}
