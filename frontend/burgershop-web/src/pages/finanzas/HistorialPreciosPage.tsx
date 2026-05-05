import { useEffect, useState, useMemo } from 'react';
import { getHistorialRecientes, HistorialPrecioDto } from '../../api/historialPrecios';
import { parseFechaUtc } from '../../utils/fechas';

const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

export default function HistorialPreciosPage() {
  const [historial, setHistorial] = useState<HistorialPrecioDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sentido, setSentido] = useState<'' | 'aumento' | 'baja'>('');

  useEffect(() => {
    setCargando(true);
    getHistorialRecientes(500)
      .then(setHistorial)
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    let items = historial;
    if (tipoFiltro) items = items.filter(h => h.tipoEntidad === tipoFiltro);
    if (busqueda) {
      const term = busqueda.toLowerCase();
      items = items.filter(h =>
        (h.nombreEntidad || '').toLowerCase().includes(term) ||
        h.entidadId.toString().includes(term)
      );
    }
    if (fechaDesde) {
      const desde = new Date(fechaDesde + 'T00:00:00');
      items = items.filter(h => parseFechaUtc(h.fechaCambio) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta + 'T23:59:59');
      items = items.filter(h => parseFechaUtc(h.fechaCambio) <= hasta);
    }
    if (sentido === 'aumento') items = items.filter(h => h.precioNuevo > h.precioAnterior);
    if (sentido === 'baja') items = items.filter(h => h.precioNuevo < h.precioAnterior);
    return items;
  }, [historial, tipoFiltro, busqueda, fechaDesde, fechaHasta, sentido]);

  const formatFecha = (fecha: string) =>
    parseFechaUtc(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">Historial de Precios</h2>
        <span className="text-sm text-slate-300">{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select className={selectClass} value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="Combo">Combos</option>
          <option value="Producto">Productos</option>
        </select>
        <select className={selectClass} value={sentido} onChange={e => setSentido(e.target.value as '' | 'aumento' | 'baja')}>
          <option value="">Aumentos y bajas</option>
          <option value="aumento">Solo aumentos</option>
          <option value="baja">Solo bajas</option>
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-medium">Desde</span>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={selectClass} />
          <span className="text-xs text-gray-500 font-medium">Hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={selectClass} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className={`${selectClass} flex-1 min-w-[200px]`}
        />
        {cargando && (
          <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-lg border-2 border-gray-300 shadow-xl">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-12">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-base font-medium">No hay registros de cambios de precio</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold text-right">Anterior</th>
                <th className="px-4 py-3 font-semibold text-right">Nuevo</th>
                <th className="px-4 py-3 font-semibold text-right">Diferencia</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(h => {
                const dif = h.precioNuevo - h.precioAnterior;
                const pct = h.precioAnterior > 0
                  ? ((dif / h.precioAnterior) * 100).toFixed(1)
                  : '—';
                return (
                  <tr key={h.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatFecha(h.fechaCambio)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        h.tipoEntidad === 'Combo' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {h.tipoEntidad}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium max-w-[250px] truncate" title={h.nombreEntidad || ''}>
                      {h.nombreEntidad || `#${h.entidadId}`}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400 line-through">
                      ${h.precioAnterior.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      ${h.precioNuevo.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${dif > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {dif > 0 ? '+' : ''}{dif.toLocaleString('es-AR')}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">({pct}%)</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">
                      {h.usuarioNombre || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
