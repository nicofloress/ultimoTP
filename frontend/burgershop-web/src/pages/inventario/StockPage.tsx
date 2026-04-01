import { useEffect, useState, useMemo } from 'react';
import { ArtiStockDto, getStockPorLocal, getStockBajo } from '../../api/stock';
import { getLocales, LocalDto } from '../../api/locales';
import { getCategorias } from '../../api/categorias';
import { getProductos } from '../../api/productos';
import { Categoria, Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-AR', {
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

  // --- Data ---
  const [stock, setStock] = useState<ArtiStockDto[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);

  // --- Filtros ---
  const [localId, setLocalId] = useState<number>(1);
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
  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const data = soloBajo
          ? await getStockBajo(localId)
          : await getStockPorLocal(localId);
        setStock(data);
      } catch (err) {
        console.error('Error cargando stock:', err);
        showToast('Error al cargar stock', 'error');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [localId, soloBajo, showToast]);

  // --- Mega-categorias ---
  const megaCategorias = useMemo(() => {
    const econId = categorias.find(c => c.nombre === 'Economica' || c.nombre === 'Económica')?.id;
    const premiumId = categorias.find(c => c.nombre === 'Premium')?.id;
    return [
      { key: 'eco', label: 'Hamburguesas Eco', catIds: categorias.filter(c => c.categoriaPadreId === econId).map(c => c.id) },
      { key: 'premium', label: 'Hamburguesas Premium', catIds: categorias.filter(c => c.categoriaPadreId === premiumId).map(c => c.id) },
      { key: 'salch-corta', label: 'Salchichas Cortas', catIds: categorias.filter(c => c.nombre === 'Salchicha Corta').map(c => c.id) },
      { key: 'salch-larga', label: 'Salchichas Largas', catIds: categorias.filter(c => c.nombre === 'Salchicha Larga').map(c => c.id) },
      { key: 'pan', label: 'Pan', catIds: categorias.filter(c => c.nombre.startsWith('Pan ')).map(c => c.id) },
      { key: 'aderezos', label: 'Aderezos', catIds: categorias.filter(c => c.nombre === 'Aderezos').map(c => c.id) },
      { key: 'snacks', label: 'Snacks', catIds: categorias.filter(c => c.nombre === 'Snacks').map(c => c.id) },
    ];
  }, [categorias]);

  const tieneSubfiltro = megaFiltro === 'eco' || megaFiltro === 'premium' || megaFiltro === 'snacks';

  const gramajesDisponibles = useMemo(() => {
    if (!tieneSubfiltro) return [];
    const mc = megaCategorias.find(m => m.key === megaFiltro);
    if (!mc) return [];
    return productos
      .filter(p => p.activo && mc.catIds.includes(p.categoriaId) && p.pesoGramos)
      .map(p => p.pesoGramos!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [productos, megaFiltro, megaCategorias, tieneSubfiltro]);

  // --- Producto IDs por mega-categoria ---
  const productoIdsPorMega = useMemo(() => {
    if (!megaFiltro) return null;
    const mc = megaCategorias.find(m => m.key === megaFiltro);
    if (!mc) return null;
    let lista = productos.filter(p => mc.catIds.includes(p.categoriaId));
    if (gramajesFiltro) {
      lista = lista.filter(p => p.pesoGramos === gramajesFiltro);
    }
    return new Set(lista.map(p => p.id));
  }, [megaFiltro, gramajesFiltro, megaCategorias, productos]);

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
    { key: 'ingresoLocal', label: 'Ingresos', align: 'text-right' },
    { key: 'egresoLocal', label: 'Egresos', align: 'text-right' },
    { key: 'ventaLocal', label: 'Ventas', align: 'text-right' },
    { key: 'stockFinal', label: 'Stock Final', align: 'text-right' },
    { key: 'stockMinimo', label: 'Stock Minimo', align: 'text-right' },
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            <select
              className={selectClass}
              value={localId}
              onChange={e => setLocalId(Number(e.target.value))}
            >
              {locales.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
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
          {cargando && (
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        {/* Mega-categorias bubbles */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setMegaFiltro(null); setGramajesFiltro(null); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!megaFiltro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {megaCategorias.map(mc => (
            <button
              key={mc.key}
              onClick={() => { setMegaFiltro(mc.key); setGramajesFiltro(null); }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${megaFiltro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {mc.label}
            </button>
          ))}
        </div>

        {/* Sub-filtro gramaje */}
        {tieneSubfiltro && gramajesDisponibles.length > 0 && (
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
                {g}gr
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
                    <td className="px-3 py-2 text-right">{s.ingresoLocal}</td>
                    <td className="px-3 py-2 text-right">{s.egresoLocal}</td>
                    <td className="px-3 py-2 text-right">{s.ventaLocal}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${
                      esNegativo ? 'text-red-600 font-bold' : esBajo ? 'text-red-600' : s.stockMinimo != null ? 'text-green-600' : ''
                    }`}>
                      {s.stockFinal}
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
