import { useEffect, useState, useCallback, useRef } from 'react';
import { LogEntry, LogNivel, LogPagedResult, getLogs, limpiarLogs } from '../../api/logs';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400';
const selectClass =
  'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white';

const NIVEL_LABELS: Record<LogNivel, string> = {
  [LogNivel.Info]: 'Info',
  [LogNivel.Warning]: 'Warning',
  [LogNivel.Error]: 'Error',
  [LogNivel.Critical]: 'Critical',
};

const NIVEL_BADGE: Record<LogNivel, string> = {
  [LogNivel.Info]: 'bg-blue-100 text-blue-700 border-blue-200',
  [LogNivel.Warning]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [LogNivel.Error]: 'bg-red-100 text-red-700 border-red-200',
  [LogNivel.Critical]: 'bg-purple-100 text-purple-800 border-purple-300',
};

const PAGE_SIZE = 50;
const AUTO_REFRESH_MS = 30_000;

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatHora(date: Date): string {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export default function LogsPage() {
  const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const { showToast } = useGlobalToast();

  // Filters
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState('');
  const [nivel, setNivel] = useState<number | ''>('');
  const [busqueda, setBusqueda] = useState('');

  // Data
  const [resultado, setResultado] = useState<LogPagedResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [page, setPage] = useState(1);

  // Expanded row
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Auto refresh
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpiar modal
  const [mostrarLimpiar, setMostrarLimpiar] = useState(false);
  const [diasLimpiar, setDiasLimpiar] = useState(30);
  const [limpiando, setLimpiando] = useState(false);

  const cargarLogs = useCallback(
    async (pagina: number = page) => {
      setCargando(true);
      try {
        const data = await getLogs({
          desde: desde || undefined,
          hasta: hasta || undefined,
          nivel: nivel !== '' ? nivel : undefined,
          busqueda: busqueda || undefined,
          page: pagina,
          pageSize: PAGE_SIZE,
        });
        setResultado(data);
        setLastRefresh(new Date());
      } catch {
        showToast('Error al cargar los logs', 'error');
      } finally {
        setCargando(false);
      }
    },
    [desde, hasta, nivel, busqueda, page, showToast]
  );

  // Initial load + auto-refresh
  useEffect(() => {
    cargarLogs(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      cargarLogs(page);
    }, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cargarLogs, page]);

  const handleBuscar = () => {
    setPage(1);
    setExpandedId(null);
    cargarLogs(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const handleLimpiar = async () => {
    setLimpiando(true);
    try {
      const res = await limpiarLogs(diasLimpiar);
      showToast(`Se eliminaron ${res.eliminados} logs`, 'success');
      setMostrarLimpiar(false);
      cargarLogs(1);
      setPage(1);
    } catch {
      showToast('Error al limpiar logs', 'error');
    } finally {
      setLimpiando(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Pagination helpers
  const totalPages = resultado?.totalPages ?? 1;
  const totalCount = resultado?.totalCount ?? 0;
  const items = resultado?.items ?? [];
  const rangoInicio = items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangoFin = rangoInicio + items.length - 1;

  const paginasVisibles = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Registros del Sistema</h2>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nivel</label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value === '' ? '' : Number(e.target.value))}
              className={selectClass}
            >
              <option value="">Todos</option>
              <option value={LogNivel.Info}>Info</option>
              <option value={LogNivel.Warning}>Warning</option>
              <option value={LogNivel.Error}>Error</option>
              <option value={LogNivel.Critical}>Critical</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Origen, mensaje, usuario, ruta..."
              className={inputClass}
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={cargando}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60"
          >
            Buscar
          </button>
          <button
            onClick={() => setMostrarLimpiar(true)}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Limpiar Logs
          </button>
        </div>
        {/* Last refresh indicator */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span
            className={`inline-block w-2 h-2 rounded-full ${cargando ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}
          />
          Ultima actualizacion: {formatHora(lastRefresh)} &middot; auto-refresh cada 30s
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Fecha/Hora
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Nivel
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Origen
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Mensaje</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Usuario
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Ruta
                </th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 whitespace-nowrap">
                  Duracion
                </th>
              </tr>
            </thead>
            <tbody>
              {cargando && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <svg
                      className="animate-spin h-6 w-6 mx-auto mb-2 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Cargando logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <svg
                      className="mx-auto mb-2 w-10 h-10 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    No se encontraron logs para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                items.map((log, idx) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    odd={idx % 2 === 1}
                    expanded={expandedId === log.id}
                    onToggle={() => toggleExpand(log.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
            <span className="text-gray-500">
              Mostrando {rangoInicio}-{rangoFin} de {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              {paginasVisibles().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded border transition-colors ${
                    p === page
                      ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Limpiar Modal */}
      <ConfirmModal
        visible={mostrarLimpiar}
        titulo="Limpiar Logs"
        mensaje={`Se eliminaran logs con mas de ${diasLimpiar} dias de antiguedad.`}
        detalle={
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Dias de antiguedad a conservar
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={diasLimpiar}
              onChange={(e) => setDiasLimpiar(Math.max(1, Number(e.target.value)))}
              className={inputClass + ' w-32'}
            />
            <p className="text-xs text-gray-500">
              Los logs mas recientes que {diasLimpiar} dias se mantendran.
            </p>
          </div>
        }
        tipo="danger"
        textoConfirmar="Eliminar"
        cargando={limpiando}
        onConfirmar={handleLimpiar}
        onCancelar={() => setMostrarLimpiar(false)}
      />
    </div>
  );
}

// ==========================================
// Log Row + Expanded Detail
// ==========================================

function LogRow({
  log,
  odd,
  expanded,
  onToggle,
}: {
  log: LogEntry;
  odd: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusColor = log.statusCode
    ? log.statusCode >= 500
      ? 'text-red-600 font-semibold'
      : log.statusCode >= 400
        ? 'text-yellow-600 font-semibold'
        : 'text-green-600'
    : 'text-gray-400';

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-amber-50/50 ${
          odd ? 'bg-gray-50/60' : 'bg-white'
        } ${expanded ? 'bg-amber-50' : ''}`}
      >
        <td className="px-4 py-2 whitespace-nowrap text-gray-600">{formatFecha(log.fecha)}</td>
        <td className="px-4 py-2 whitespace-nowrap">
          <NivelBadge nivel={log.nivel} />
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-gray-700 font-medium max-w-[160px] truncate">
          {log.origen}
        </td>
        <td className="px-4 py-2 text-gray-600 max-w-[300px]">
          <span className="block truncate">{truncate(log.mensaje, 80)}</span>
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-gray-600">
          {log.usuarioNombre || <span className="text-gray-300">-</span>}
        </td>
        <td className="px-4 py-2 whitespace-nowrap text-gray-600 max-w-[200px] truncate">
          {log.httpMethod && log.ruta ? (
            <span>
              <span className="font-semibold text-gray-500">{log.httpMethod}</span>{' '}
              {truncate(log.ruta, 30)}
            </span>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>
        <td className={`px-4 py-2 text-center whitespace-nowrap ${statusColor}`}>
          {log.statusCode ?? <span className="text-gray-300">-</span>}
        </td>
        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-600">
          {log.duracionMs != null ? `${log.duracionMs}ms` : <span className="text-gray-300">-</span>}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <LogDetail log={log} />
          </td>
        </tr>
      )}
    </>
  );
}

function NivelBadge({ nivel }: { nivel: LogNivel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${NIVEL_BADGE[nivel]}`}
    >
      {nivel === LogNivel.Critical && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
        </span>
      )}
      {NIVEL_LABELS[nivel]}
    </span>
  );
}

function LogDetail({ log }: { log: LogEntry }) {
  const fields: { label: string; value: React.ReactNode }[] = [
    { label: 'ID', value: log.id },
    { label: 'Fecha', value: formatFecha(log.fecha) },
    { label: 'Nivel', value: <NivelBadge nivel={log.nivel} /> },
    { label: 'Origen', value: log.origen },
    ...(log.usuarioNombre
      ? [{ label: 'Usuario', value: `${log.usuarioNombre} (ID: ${log.usuarioId})` }]
      : []),
    ...(log.rol ? [{ label: 'Rol', value: log.rol }] : []),
    ...(log.httpMethod ? [{ label: 'Metodo HTTP', value: log.httpMethod }] : []),
    ...(log.ruta ? [{ label: 'Ruta', value: log.ruta }] : []),
    ...(log.statusCode != null ? [{ label: 'Status Code', value: log.statusCode }] : []),
    ...(log.duracionMs != null ? [{ label: 'Duracion', value: `${log.duracionMs}ms` }] : []),
    ...(log.ip ? [{ label: 'IP', value: log.ip }] : []),
    ...(log.userAgent ? [{ label: 'User Agent', value: log.userAgent }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
        {fields.map((f) => (
          <div key={f.label}>
            <span className="text-xs font-semibold text-gray-400 uppercase">{f.label}</span>
            <div className="text-sm text-gray-700 break-all">{f.value}</div>
          </div>
        ))}
      </div>

      {/* Mensaje completo */}
      <div>
        <span className="text-xs font-semibold text-gray-400 uppercase">Mensaje Completo</span>
        <div className="mt-1 bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
          {log.mensaje}
        </div>
      </div>

      {/* Stack trace */}
      {log.stackTrace && (
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase">Stack Trace</span>
          <pre className="mt-1 bg-slate-800 text-green-300 rounded-md p-3 text-xs overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
            {log.stackTrace}
          </pre>
        </div>
      )}
    </div>
  );
}
