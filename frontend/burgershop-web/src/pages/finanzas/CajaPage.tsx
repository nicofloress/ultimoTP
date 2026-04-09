import { useEffect, useState } from 'react';
import { CierreCaja, EstadoCaja } from '../../types';
import { getCajaAbierta, abrirCaja, cerrarCaja, getHistorialCajas, getCaja } from '../../api/caja';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { useLocalActivo } from '../../context/LocalContext';

const hoy = new Date();
const hace7Dias = new Date(hoy);
hace7Dias.setDate(hoy.getDate() - 7);
const toInputDate = (d: Date) => d.toISOString().split('T')[0];

export default function CajaPage() {
  const { localActivo } = useLocalActivo();
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [montoInicial, setMontoInicial] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [detalleExpandido, setDetalleExpandido] = useState<number | null>(null);
  const [mostrarConfirmCierre, setMostrarConfirmCierre] = useState(false);
  const [cajaDetalle, setCajaDetalle] = useState<CierreCaja | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const { showToast } = useGlobalToast();

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
      case 'cantidadPedidos': valA = a.cantidadPedidos; valB = b.cantidadPedidos; break;
      case 'totalVentas': valA = a.totalVentas; valB = b.totalVentas; break;
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
      const [caja, hist] = await Promise.all([
        getCajaAbierta(localActivo || undefined),
        getHistorialCajas(localActivo || undefined, fechaDesde, fechaHasta),
      ]);
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
      await cerrarCaja(cajaAbierta.id, { observaciones: observacionesCierre || undefined });
      setObservacionesCierre('');
      await cargarDatos();
    } catch {
      showToast('Error al cerrar la caja', 'error');
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
    return new Date(fecha).toLocaleString('es-AR', {
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Fecha Apertura</div>
                <div className="text-sm font-semibold mt-1">{formatFecha(cajaAbierta.fechaApertura)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Monto Inicial</div>
                <div className="text-sm font-semibold mt-1">${cajaAbierta.montoInicial.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Cant. Ventas</div>
                <div className="text-sm font-semibold mt-1">{cajaAbierta.cantidadPedidos}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Ventas</div>
                <div className="text-lg font-bold mt-1 text-green-600">${cajaAbierta.totalVentas.toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 shadow-md border border-blue-200">
                <div className="text-xs text-blue-500 uppercase tracking-wider">Cant. Pedidos</div>
                <div className="text-sm font-semibold mt-1">{cajaAbierta.cantidadDomicilio ?? 0}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 shadow-md border border-blue-200">
                <div className="text-xs text-blue-500 uppercase tracking-wider">Total Pedidos</div>
                <div className="text-lg font-bold mt-1 text-blue-600">${(cajaAbierta.totalDomicilio ?? 0).toLocaleString()}</div>
              </div>
            </div>

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
              <div className="flex gap-3">
                <button
                  onClick={handleCerrarCaja}
                  className="text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 px-6 py-2 font-medium transition-colors"
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
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
                    className="cursor-pointer text-left px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Fecha Cierre {sortField === 'fechaCierre' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('montoInicial')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Monto Inicial {sortField === 'montoInicial' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('montoFinal')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Monto Final {sortField === 'montoFinal' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('cantidadPedidos')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Cant. Ventas {sortField === 'cantidadPedidos' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('totalVentas')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 select-none"
                  >
                    Total Ventas {sortField === 'totalVentas' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('cantidadDomicilio')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-blue-500 hover:text-blue-700 select-none"
                  >
                    Cant. Pedidos {sortField === 'cantidadDomicilio' && <span className="text-amber-500">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th
                    onClick={() => handleSort('totalDomicilio')}
                    className="cursor-pointer text-right px-4 py-3 text-sm font-medium text-blue-500 hover:text-blue-700 select-none"
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
                          <div className="px-4 py-3 text-sm" style={{ flex: '1 1 0' }}>{formatFecha(caja.fechaApertura)}</div>
                          <div className="px-4 py-3 text-sm" style={{ flex: '1 1 0' }}>{caja.fechaCierre ? formatFecha(caja.fechaCierre) : '-'}</div>
                          <div className="px-4 py-3 text-sm text-right" style={{ flex: '1 1 0' }}>${caja.montoInicial.toLocaleString()}</div>
                          <div className="px-4 py-3 text-sm text-right" style={{ flex: '1 1 0' }}>{caja.montoFinal != null ? `$${caja.montoFinal.toLocaleString()}` : '-'}</div>
                          <div className="px-4 py-3 text-sm text-right" style={{ flex: '1 1 0' }}>{caja.cantidadPedidos}</div>
                          <div className="px-4 py-3 text-sm text-right font-medium" style={{ flex: '1 1 0' }}>${caja.totalVentas.toLocaleString()}</div>
                          <div className="px-4 py-3 text-sm text-right text-blue-700" style={{ flex: '1 1 0' }}>{caja.cantidadDomicilio ?? 0}</div>
                          <div className="px-4 py-3 text-sm text-right font-medium text-blue-700" style={{ flex: '1 1 0' }}>${(caja.totalDomicilio ?? 0).toLocaleString()}</div>
                          <div className="px-4 py-3 text-sm text-center" style={{ flex: '1 1 0' }}>
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
                          <div className="mt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVerDetalle(caja.id); }}
                              className="text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 px-4 py-1.5 text-sm font-medium transition-colors"
                            >
                              Ver Detalle
                            </button>
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
      {(cajaDetalle || cargandoDetalle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !cargandoDetalle && setCajaDetalle(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            {cargandoDetalle ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500">Cargando detalle...</div>
              </div>
            ) : cajaDetalle && (() => {
              const esAbierta = cajaDetalle.estado === EstadoCaja.Abierta;
              const detalleEfectivo = cajaDetalle.detalles.find(d => d.formaPagoNombre.toLowerCase() === 'efectivo');
              const ventasEfectivo = detalleEfectivo?.montoTotal ?? 0;
              const plataformas = cajaDetalle.detalles.filter(d => d.formaPagoNombre.toLowerCase() !== 'efectivo');
              const dineroEnCaja = cajaDetalle.montoInicial + ventasEfectivo;
              const diferenciaCaja = cajaDetalle.montoFinal != null ? cajaDetalle.montoFinal - dineroEnCaja : 0;
              const totalVentasGeneral = cajaDetalle.detalles.reduce((s, d) => s + d.montoTotal, 0);

              return (
                <>
                  {/* Header */}
                  <div className="bg-slate-700 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h3 className="text-lg font-bold">Caja #{cajaDetalle.id}</h3>
                    <button onClick={() => setCajaDetalle(null)} className="text-white hover:text-gray-300 transition-colors text-2xl leading-none">&times;</button>
                  </div>

                  {/* Info superior */}
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-gray-600">
                        Desde: {formatFecha(cajaDetalle.fechaApertura)} hs.
                        {' - '}
                        Hasta: {cajaDetalle.fechaCierre ? `${formatFecha(cajaDetalle.fechaCierre)} hs.` : 'Abierta'}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        esAbierta ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {esAbierta ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
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

                  {/* Cuerpo - 2 columnas */}
                  <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna izquierda - Efectivo */}
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
                              <td className="px-4 py-2 text-sm text-right">${formatMonto(cajaDetalle.montoInicial)}</td>
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

                    {/* Columna derecha - Plataformas de pago */}
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

                  {/* Footer */}
                  <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-800">
                        TOTAL VENTAS: <span className="text-green-700">${formatMonto(totalVentasGeneral)}</span>
                      </div>
                    </div>
                    {cajaDetalle.observaciones && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Observaciones:</span> {cajaDetalle.observaciones}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
