import { useEffect, useState, useMemo, useCallback } from 'react';
import { ArtiStockDto, getStockPorLocal, getStockBajo } from '../../api/stock';
import { getLocales, LocalDto } from '../../api/locales';
import { getCategorias } from '../../api/categorias';
import { getProductos } from '../../api/productos';
import { Categoria, Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function formatFecha(fecha: string) {
  const f = fecha.endsWith('Z') || fecha.includes('+') ? fecha : fecha + 'Z';
  return new Date(f).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

type SortDir = 'asc' | 'desc';

export default function StockPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  // --- Data ---
  const [stock, setStock] = useState<ArtiStockDto[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  // --- Filtros ---
  const [localId, setLocalId] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));
  const [megaFiltro, setMegaFiltro] = useState<string | null>(null);
  const [gramajesFiltro, setGramajesFiltro] = useState<number | null>(null);
  const [soloBajo, setSoloBajo] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // --- Orden ---
  const [ordenCol, setOrdenCol] = useState<string>('productoNombre');
  const [ordenDir, setOrdenDir] = useState<SortDir>('asc');

  // --- Load catalogos ---
  useEffect(() => {
    getLocales().then(setLocales).catch(() => {});
    getCategorias().then(setCategorias).catch(() => {});
    getProductos().then(setProductos).catch(() => {});
  }, []);

  // --- Cargar stock ---
  const cargarStock = useCallback(async () => {
    setCargando(true);
    try {
      let data: ArtiStockDto[];
      if (localId === 0) {
        const fn = soloBajo ? getStockBajo : getStockPorLocal;
        const promises = locales.map(l => fn(l.id));
        const results = await Promise.all(promises);
        data = results.flat();
      } else {
        data = soloBajo ? await getStockBajo(localId) : await getStockPorLocal(localId);
      }
      setStock(data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error cargando stock:', err);
      showToast('Error al cargar stock', 'error');
    } finally {
      setCargando(false);
    }
  }, [localId, soloBajo, locales, showToast]);

  useEffect(() => { cargarStock(); }, [cargarStock]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(cargarStock, 300000);
    return () => clearInterval(interval);
  }, [cargarStock]);

  // --- Mega-categorias: cada categoría raíz es un botón de filtro ---
  const megaCategorias = useMemo(() => {
    return categorias.filter(c => c.activa && !c.categoriaPadreId).map(rc => {
      const childIds = categorias.filter(c => c.categoriaPadreId === rc.id).map(c => c.id);
      return { key: `cat-${rc.id}`, label: rc.nombre, catIds: [rc.id, ...childIds] };
    });
  }, [categorias]);

  const megaActiva = megaCategorias.find(m => m.key === megaFiltro);

  // Sub-categorías de la mega seleccionada
  const lineasDisponibles = useMemo(() => {
    if (!megaActiva) return [];
    const rootId = parseInt(megaActiva.key.replace('cat-', ''));
    return categorias.filter(c => c.activa && c.categoriaPadreId === rootId).map(c => ({ id: c.id, nombre: c.nombre }));
  }, [megaActiva, categorias]);

  const [lineaFiltro, setLineaFiltro] = useState<number | null>(null);

  const gramajesDisponibles = useMemo(() => {
    if (!megaActiva) return [];
    return productos
      .filter(p => p.activo && (lineaFiltro ? p.categoriaId === lineaFiltro : megaActiva.catIds.includes(p.categoriaId)) && p.pesoGramos)
      .map(p => p.pesoGramos!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [productos, megaActiva, lineaFiltro]);

  // --- Producto IDs por mega-categoria ---
  const productoIdsPorMega = useMemo(() => {
    if (!megaFiltro || !megaActiva) return null;
    let lista = productos.filter(p => megaActiva.catIds.includes(p.categoriaId));
    if (lineaFiltro) {
      lista = lista.filter(p => p.categoriaId === lineaFiltro);
    }
    if (gramajesFiltro) {
      lista = lista.filter(p => p.pesoGramos === gramajesFiltro);
    }
    return new Set(lista.map(p => p.id));
  }, [megaFiltro, gramajesFiltro, lineaFiltro, megaCategorias, productos]);

  // --- Filtrado y orden ---
  const stockFiltrado = useMemo(() => {
    let lista = [...stock];
    if (productoIdsPorMega) {
      lista = lista.filter(s => productoIdsPorMega.has(s.productoId));
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(s => s.productoNombre.toLowerCase().includes(q));
    }
    lista.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[ordenCol];
      const valB = (b as unknown as Record<string, unknown>)[ordenCol];
      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') cmp = valA.localeCompare(valB);
      else if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB;
      else cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
      return ordenDir === 'asc' ? cmp : -cmp;
    });
    return lista;
  }, [stock, productoIdsPorMega, busqueda, ordenCol, ordenDir]);

  // --- Resumen ---
  const stockBajoCount = useMemo(
    () => stockFiltrado.filter(s => s.stockMinimo != null && s.stockFinal <= s.stockMinimo).length,
    [stockFiltrado]
  );
  const stockTotal = useMemo(
    () => stockFiltrado.reduce((sum, s) => sum + s.stockFinal, 0),
    [stockFiltrado]
  );

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrdenCol(col);
      setOrdenDir('asc');
    }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? (
      <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
    ) : null;

  const columnas: { key: string; label: string; align?: string }[] = [
    { key: 'productoNombre', label: 'Producto' },
    { key: 'localNombre', label: 'Local' },
    { key: 'ingresoLocal', label: 'Ingresos', align: 'text-right' },
    { key: 'egresoLocal', label: 'Egresos', align: 'text-right' },
    { key: 'ventaLocal', label: 'Ventas', align: 'text-right' },
    { key: 'stockFinal', label: 'Stock (Paq.)', align: 'text-right' },
    { key: 'bultos', label: 'Bultos', align: 'text-right' },
    { key: 'stockMinimo', label: 'Stock Min.', align: 'text-right' },
    { key: 'ultimaModificacion', label: 'Ultima Modificacion' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Stock por Local</h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select
                className={selectClass + ' w-full'}
                value={localId}
                onChange={e => setLocalId(Number(e.target.value))}
              >
                <option value={0}>Todos los locales</option>
                {locales.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localId)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="soloBajo"
              checked={soloBajo}
              onChange={e => setSoloBajo(e.target.checked)}
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="soloBajo" className="text-sm text-gray-700 font-medium">
              Solo stock bajo minimo
            </label>
          </div>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={`${inputClass} flex-1 min-w-[200px]`}
          />
          <span className="text-sm text-gray-500">
            {stockFiltrado.length} articulo{stockFiltrado.length !== 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          {ultimaActualizacion && (
            <span className="text-xs text-gray-400 italic">
              Actualizado: {ultimaActualizacion.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          )}
          <button
            onClick={cargarStock}
            disabled={cargando}
            className="px-2.5 py-1.5 text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {/* Mega-categorias bubbles */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setMegaFiltro(null); setGramajesFiltro(null); setLineaFiltro(null); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!megaFiltro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {megaCategorias.map(mc => (
            <button
              key={mc.key}
              onClick={() => { setMegaFiltro(mc.key); setGramajesFiltro(null); setLineaFiltro(null); }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${megaFiltro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {mc.label}
            </button>
          ))}
        </div>

        {/* Sub-filtro sub-categorías */}
        {lineasDisponibles.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1 self-center">Sub:</span>
            <button onClick={() => setLineaFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!lineaFiltro ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Todas</button>
            {lineasDisponibles.map(l => (
              <button key={l.id} onClick={() => setLineaFiltro(l.id)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lineaFiltro === l.id ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{l.nombre}</button>
            ))}
          </div>
        )}

        {/* Sub-filtro gramaje */}
        {gramajesDisponibles.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setGramajesFiltro(null)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!gramajesFiltro ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todos
            </button>
            {gramajesDisponibles.map(g => (
              <button
                key={g}
                onClick={() => setGramajesFiltro(g)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${gramajesFiltro === g ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {g >= 1000 ? `${(g / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg` : `${g} gr`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columnas.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 transition-colors ${col.align || ''}`}
                  onClick={() => toggleOrden(col.key)}
                >
                  {col.label}
                  <SortArrow col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  Cargando stock...
                </td>
              </tr>
            ) : stockFiltrado.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  No se encontraron articulos
                </td>
              </tr>
            ) : (
              stockFiltrado.map((s, idx) => {
                const esBajo = s.stockMinimo != null && s.stockFinal <= s.stockMinimo;
                const esNegativo = s.stockFinal < 0;
                return (
                  <tr
                    key={`${s.productoId}-${s.localId}`}
                    className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    <td className="px-3 py-2">{s.productoNombre}</td>
                    <td className="px-3 py-2">{s.localNombre}</td>
                    <td className="px-3 py-2 text-right">{s.ingresoLocal}</td>
                    <td className="px-3 py-2 text-right">{s.egresoLocal}</td>
                    <td className="px-3 py-2 text-right">{s.ventaLocal}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${
                      esNegativo ? 'text-red-600 font-bold' : esBajo ? 'text-red-600' : s.stockMinimo != null ? 'text-green-600' : ''
                    }`}>
                      {s.stockFinal}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 font-mono">
                      {s.bultos > 0 ? s.bultos : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {s.stockMinimo != null ? s.stockMinimo : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {s.ultimaModificacion ? formatFecha(s.ultimaModificacion) : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-slate-500 to-slate-700 rounded-lg shadow p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total articulos:</span>
          <span className="text-sm font-bold text-white">{stockFiltrado.length}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Con stock bajo:</span>
          <span className={`text-sm font-bold ${stockBajoCount > 0 ? 'text-red-400' : 'text-white'}`}>{stockBajoCount}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Stock total:</span>
          <span className="text-sm font-bold text-white">{stockTotal.toLocaleString('es-AR')}</span>
        </div>
      </div>
    </div>
  );
}
