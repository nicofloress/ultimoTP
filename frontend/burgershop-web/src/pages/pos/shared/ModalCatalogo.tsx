import { Producto, Combo, ListaPrecio } from '../../../types';
import { formatGramaje } from '../../../utils/formatGramaje';
import { formatearNumero } from '../../../components/NumericInput';

interface MegaCategoria {
  key: string;
  label: string;
  catIds: number[];
}

interface LineaItem {
  id: number;
  nombre: string;
}

interface PrecioPromo {
  precioPromo: number;
}

interface Props {
  onClose: () => void;
  productos: Producto[];
  listasPrecios: ListaPrecio[];
  listaPrecioSeleccionada?: number;
  setListaPrecioSeleccionada: (v?: number) => void;
  categoriaFiltro: string | null;
  setCategoriaFiltro: (v: string | null) => void;
  gramajesFiltro: number | null;
  setGramajesFiltro: (v: number | null) => void;
  marcaFiltro: string | null;
  setMarcaFiltro: (v: string | null) => void;
  lineaFiltro: number | null;
  setLineaFiltro: (v: number | null) => void;
  megaCategorias: MegaCategoria[];
  lineasDisponibles: LineaItem[];
  marcasDisponibles: string[];
  gramajesDisponibles: number[];
  tieneSubfiltros: boolean;
  productosCatalogo: Producto[];
  combosCatalogo: Combo[];
  preciosLista: Map<number, number>;
  preciosListaCombos: Map<number, number>;
  preciosPromoProductos: Map<number, PrecioPromo>;
  preciosPromoCombos: Map<number, PrecioPromo>;
  agregarProducto: (p: Producto) => void;
  agregarCombo: (c: Combo) => void;
}

export default function ModalCatalogo({
  onClose,
  productos,
  listasPrecios,
  listaPrecioSeleccionada,
  setListaPrecioSeleccionada,
  categoriaFiltro,
  setCategoriaFiltro,
  gramajesFiltro,
  setGramajesFiltro,
  marcaFiltro,
  setMarcaFiltro,
  lineaFiltro,
  setLineaFiltro,
  megaCategorias,
  lineasDisponibles,
  marcasDisponibles,
  gramajesDisponibles,
  tieneSubfiltros,
  productosCatalogo,
  combosCatalogo,
  preciosLista,
  preciosListaCombos,
  preciosPromoProductos,
  preciosPromoCombos,
  agregarProducto,
  agregarCombo,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mr-auto">Catalogo de Productos</h2>
          <div className="flex items-center gap-1.5 bg-amber-50 border-2 border-amber-400 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 flex-shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-amber-700 whitespace-nowrap hidden sm:inline">Lista de Precios:</span>
            <select
              value={listaPrecioSeleccionada || ''}
              onChange={e => setListaPrecioSeleccionada(Number(e.target.value) || undefined)}
              className="border-2 border-amber-300 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-amber-800 min-w-[120px] sm:min-w-[180px]"
            >
              <option value="">Precio Base</option>
              {listasPrecios.filter(l => l.activa).map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Filtro por mega-categoria */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-200 flex gap-1.5 flex-wrap overflow-x-auto scrollbar-hide">
          <button onClick={() => { setCategoriaFiltro(null); setGramajesFiltro(null); setMarcaFiltro(null); setLineaFiltro(null); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!categoriaFiltro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {(preciosPromoProductos.size > 0 || preciosPromoCombos.size > 0) && (
            <button onClick={() => setCategoriaFiltro('promo')} className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === 'promo' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'}`}>Promos</button>
          )}
          {listaPrecioSeleccionada && (
            <button
              onClick={() => setCategoriaFiltro('descuento')}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === 'descuento' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'}`}
            >
              Con Descuento
            </button>
          )}
          <button
            onClick={() => setCategoriaFiltro('ofertas')}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === 'ofertas' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100'}`}
          >
            Oferta Semanal
          </button>
          <button onClick={() => setCategoriaFiltro('combos')} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === 'combos' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>Combos</button>
          {megaCategorias.map(mc => (
            <button key={mc.key} onClick={() => { setCategoriaFiltro(mc.key); setGramajesFiltro(null); setMarcaFiltro(null); setLineaFiltro(null); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{mc.label}</button>
          ))}
        </div>

        {/* Sub-filtro sub-categorías */}
        {lineasDisponibles.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Sub:</span>
            <button onClick={() => setLineaFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!lineaFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
            {lineasDisponibles.map(l => (
              <button key={l.id} onClick={() => setLineaFiltro(l.id)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lineaFiltro === l.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l.nombre}</button>
            ))}
          </div>
        )}

        {/* Sub-filtros: marca y gramaje */}
        {tieneSubfiltros && (marcasDisponibles.length > 1 || gramajesDisponibles.length > 0) && (
          <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
            {marcasDisponibles.length > 1 && (
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-500 font-medium mr-1">Marca:</span>
                <button
                  onClick={() => { setMarcaFiltro(null); setGramajesFiltro(null); }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!marcaFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Todas
                </button>
                {marcasDisponibles.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMarcaFiltro(m); setGramajesFiltro(null); }}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${marcaFiltro === m ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {gramajesDisponibles.length > 0 && (
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-500 font-medium mr-1">Gramaje:</span>
                <button
                  onClick={() => setGramajesFiltro(null)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!gramajesFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Todos
                </button>
                {gramajesDisponibles.map(g => (
                  <button
                    key={g}
                    onClick={() => setGramajesFiltro(g)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${gramajesFiltro === g ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {formatGramaje(g, productos)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grid de productos + combos relacionados */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 content-start">
          {categoriaFiltro !== 'combos' && productosCatalogo.map(p => (
            <button key={`prod-${p.id}`} onClick={() => { agregarProducto(p); onClose(); }} className={`relative border-2 rounded-lg p-2.5 text-left transition-all hover:shadow-md active:scale-[0.98] group ${
              preciosPromoProductos.has(p.id)
                ? 'bg-red-50 border-red-200 hover:border-red-400'
                : p.esOfertaSemanal
                  ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                  : 'bg-white border-gray-200 hover:border-amber-400'
            }`}>
              {preciosPromoProductos.has(p.id) && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
              )}
              {p.numeroInterno && <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>}
              <div className="font-medium text-sm text-gray-800 group-hover:text-amber-700 leading-tight">{p.nombre}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
              {preciosPromoProductos.has(p.id) ? (
                <div className="font-bold mt-0.5">
                  <span className="text-xs text-gray-400 line-through">${formatearNumero(preciosLista.get(p.id) ?? p.precio)}</span>
                  <span className="text-red-600 ml-1">${formatearNumero(preciosPromoProductos.get(p.id)!.precioPromo)}</span>
                </div>
              ) : (
                <div className={`font-bold mt-0.5 ${p.esOfertaSemanal ? 'text-orange-600' : 'text-amber-600'}`}>
                  ${formatearNumero(preciosLista.get(p.id) ?? p.precio)}
                  {preciosLista.has(p.id) && preciosLista.get(p.id) !== p.precio && (
                    <span className="text-xs text-gray-400 line-through ml-1">${formatearNumero(p.precio)}</span>
                  )}
                </div>
              )}
            </button>
          ))}
          {combosCatalogo.map(c => (
            <button key={`combo-${c.id}`} onClick={() => { agregarCombo(c); onClose(); }} className={`relative border-2 rounded-lg p-2.5 text-left hover:shadow-md active:scale-[0.98] transition-all group ${
              preciosPromoCombos.has(c.id)
                ? 'bg-red-50 border-red-200 hover:border-red-400'
                : 'bg-purple-50 border-purple-200 hover:border-purple-400'
            }`}>
              {preciosPromoCombos.has(c.id) && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
              )}
              <div className="font-medium text-sm text-gray-800 group-hover:text-purple-700">{c.nombre}</div>
              {preciosPromoCombos.has(c.id) ? (
                <div className="font-bold mt-0.5">
                  <span className="text-xs text-gray-400 line-through">${formatearNumero(c.precio)}</span>
                  <span className="text-red-600 ml-1">${formatearNumero(preciosPromoCombos.get(c.id)!.precioPromo)}</span>
                </div>
              ) : preciosListaCombos.has(c.id) && preciosListaCombos.get(c.id) !== c.precio ? (
                <div className="font-bold mt-0.5">
                  <span className="text-xs text-gray-400 line-through">${formatearNumero(c.precio)}</span>
                  <span className="text-green-600 ml-1">${formatearNumero(preciosListaCombos.get(c.id)!)}</span>
                </div>
              ) : (
                <div className="text-purple-600 font-bold mt-0.5">${formatearNumero(c.precio)}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
