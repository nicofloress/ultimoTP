import { useEffect, useState, useMemo } from 'react';
import { Producto, Categoria, Combo, ListaPrecio } from '../../types';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import { getCombos, createCombo, updateCombo, deleteCombo } from '../../api/combos';
import { getListasPrecios } from '../../api/listasPrecios';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import { getPromociones, PromocionDto, TipoBeneficio } from '../../api/promociones';
import { useLocalActivo } from '../../context/LocalContext';
import { getMarcasActivas, MarcaDto } from '../../api/marcas';
import { formatGramaje } from '../../utils/formatGramaje';
import { formatearNumero } from '../../components/NumericInput';
import ProductoForm from './productos/ProductoForm';
import ComboForm from './productos/ComboForm';
import ProductoDetalleModal from './productos/ProductoDetalleModal';

const emptyForm = { nombre: '', descripcion: '', precio: 0, categoriaId: 0, imagenUrl: '', codigo: '', pesoGramos: 0, unidadesPorBulto: 1, marca: '', unidadesPorMedia: 0, unidadMinima: 1, esOfertaSemanal: false, precioCosto: 0, precioVenta: 0, alicuotaIVA: 21, unidadMedida: 'g' };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [listaPrecioId, setListaPrecioId] = useState<number | null>(null);
  const [megaFiltro, setMegaFiltro] = useState<string | null>(null);
  const [gramajesFiltro, setGramajesFiltro] = useState<number | null>(null);
  const [verCombos, setVerCombos] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [unidadPeso, setUnidadPeso] = useState<'g' | 'kg' | 'ml' | 'L'>('g');
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [confirmacionCombo, setConfirmacionCombo] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const [showFormCombo, setShowFormCombo] = useState(false);
  const [editandoCombo, setEditandoCombo] = useState<Combo | null>(null);
  const [comboCodigo, setComboCodigo] = useState('');
  const [comboNombre, setComboNombre] = useState('');
  const [comboDescripcion, setComboDescripcion] = useState('');
  const [comboPrecio, setComboPrecio] = useState(0);
  const [comboDetalles, setComboDetalles] = useState<{ productoId: number; cantidad: number }[]>([]);
  const [comboEsOferta, setComboEsOferta] = useState(false);
  const [promociones, setPromociones] = useState<PromocionDto[]>([]);
  const [marcas, setMarcas] = useState<MarcaDto[]>([]);
  const { localActivo } = useLocalActivo();

  const cargar = async () => {
    const [prods, cats, cmbs, lstas] = await Promise.all([
      getProductos(undefined, undefined, listaPrecioId ?? undefined),
      getCategorias(),
      getCombos(),
      getListasPrecios(),
    ]);
    setProductos(prods);
    setCategorias(cats);
    setCombos(cmbs);
    setListas(lstas);
  };

  useEffect(() => {
    cargar();
    getPromociones().then(setPromociones).catch(() => {});
    getMarcasActivas().then(setMarcas).catch(() => {});
  }, []);

  // Recargar productos cuando cambia la lista de precios
  useEffect(() => {
    getProductos(undefined, undefined, listaPrecioId ?? undefined).then(setProductos);
  }, [listaPrecioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await updateProducto(editando.id, { ...form, activo: editando.activo });
        showToast('Articulo actualizado correctamente', 'success');
      } else {
        await createProducto(form);
        showToast('Articulo creado correctamente', 'success');
      }
      setForm(emptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar articulo', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (p: Producto) => {
    setEditando(p);
    // Detectar unidad de medida según lo guardado
    const um = p.unidadMedida || 'g';
    const peso = p.pesoGramos ?? 0;
    if (um === 'ml') {
      setUnidadPeso(peso >= 1000 ? 'L' : 'ml');
    } else {
      setUnidadPeso(peso >= 1000 ? 'kg' : 'g');
    }
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoriaId: p.categoriaId, imagenUrl: p.imagenUrl || '', codigo: p.codigo || '', pesoGramos: peso, unidadesPorBulto: p.unidadesPorBulto ?? 1, marca: p.marca || '', unidadesPorMedia: p.unidadesPorMedia ?? 0, unidadMinima: p.unidadMinima ?? 1, esOfertaSemanal: p.esOfertaSemanal ?? false, precioCosto: p.precioCosto ?? 0, precioVenta: p.precioVenta ?? 0, alicuotaIVA: p.alicuotaIVA ?? 21, unidadMedida: um });
    setShowForm(true);
  };

  const confirmarDesactivar = async () => {
    setGuardando(true);
    try {
      await deleteProducto(confirmacion.id);
      showToast('Articulo desactivado correctamente', 'success');
    } catch {
      showToast('Error al desactivar articulo', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const abrirFormProducto = () => {
    setShowFormCombo(false); setEditandoCombo(null);
    setShowForm(true); setEditando(null); setForm({ ...emptyForm }); setUnidadPeso('g');
  };

  const abrirFormCombo = () => {
    setShowForm(false); setEditando(null);
    setShowFormCombo(true); setEditandoCombo(null);
    setComboCodigo(''); setComboNombre(''); setComboDescripcion(''); setComboPrecio(0); setComboDetalles([]); setComboEsOferta(false);
  };

  const handleEditarCombo = (c: Combo) => {
    setShowForm(false); setEditando(null);
    setEditandoCombo(c);
    setComboCodigo(c.codigo || ''); setComboNombre(c.nombre); setComboDescripcion(c.descripcion || ''); setComboPrecio(c.precio);
    setComboDetalles(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad })));
    setComboEsOferta(c.esOfertaSemanal ?? false);
    setShowFormCombo(true);
  };

  const handleDuplicarCombo = (c: Combo) => {
    setShowForm(false); setEditando(null);
    setEditandoCombo(null); // null = crear nuevo
    setComboCodigo('');
    setComboNombre(c.nombre + ' (copia)');
    setComboDescripcion(c.descripcion || '');
    setComboPrecio(c.precio);
    setComboDetalles(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad })));
    setComboEsOferta(c.esOfertaSemanal ?? false);
    setShowFormCombo(true);
  };

  const comboYaExiste = (detalles: { productoId: number; cantidad: number }[], excluirId?: number) => {
    const key = (ds: { productoId: number; cantidad: number }[]) =>
      ds.filter(d => d.productoId > 0).map(d => `${d.productoId}:${d.cantidad}`).sort().join('|');
    const nuevaKey = key(detalles);
    if (!nuevaKey) return null;
    return combos.find(c => c.activo && c.id !== excluirId && key(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad }))) === nuevaKey);
  };

  const handleSubmitCombo = async (e: React.FormEvent) => {
    e.preventDefault();

    // El combo debe tener al menos un producto en el detalle
    const detallesValidos = comboDetalles.filter(d => d.productoId > 0 && d.cantidad > 0);
    if (detallesValidos.length === 0) {
      showToast('Debe agregar al menos un producto al combo', 'error');
      return;
    }

    // Verificar duplicado
    const duplicado = comboYaExiste(comboDetalles, editandoCombo?.id);
    if (duplicado) {
      showToast(`Ya existe un combo con los mismos productos y cantidades: "${duplicado.nombre}"`, 'error');
      return;
    }

    setGuardando(true);
    try {
      const codigoSan = comboCodigo.trim() || undefined;
      if (editandoCombo) {
        await updateCombo(editandoCombo.id, { codigo: codigoSan, nombre: comboNombre, descripcion: comboDescripcion, precio: comboPrecio, activo: true, esOfertaSemanal: comboEsOferta, detalles: comboDetalles });
        showToast('Combo actualizado correctamente', 'success');
      } else {
        await createCombo({ codigo: codigoSan, nombre: comboNombre, descripcion: comboDescripcion, precio: comboPrecio, esOfertaSemanal: comboEsOferta, detalles: comboDetalles });
        showToast('Combo creado correctamente', 'success');
      }
      setShowFormCombo(false); setEditandoCombo(null);
      cargar();
    } catch {
      showToast('Error al guardar combo', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarDesactivarCombo = async () => {
    setGuardando(true);
    try {
      await deleteCombo(confirmacionCombo.id);
      showToast('Combo desactivado correctamente', 'success');
    } catch {
      showToast('Error al desactivar combo', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacionCombo({ visible: false, id: 0 });
    cargar();
  };

  // Obtener precio a mostrar según lista seleccionada
  const getPrecioMostrar = (p: Producto) => {
    if (listaPrecioId && p.precioLista != null) return p.precioLista;
    return p.precio;
  };

  const tienePrecioLista = (p: Producto) => listaPrecioId != null && p.precioLista != null;

  // Mega-categorías: cada categoría raíz es un botón de filtro
  const megaCategorias = useMemo(() => {
    return categorias.filter(c => c.activa && !c.categoriaPadreId).map(rc => {
      const childIds = categorias.filter(c => c.categoriaPadreId === rc.id).map(c => c.id);
      return { key: `cat-${rc.id}`, label: rc.nombre, catIds: [rc.id, ...childIds] };
    });
  }, [categorias]);

  const megaActiva = megaCategorias.find(m => m.key === megaFiltro);

  const lineasDisponibles = useMemo(() => {
    if (!megaActiva) return [];
    const rootId = parseInt(megaActiva.key.replace('cat-', ''));
    return categorias.filter(c => c.activa && c.categoriaPadreId === rootId).map(c => ({ id: c.id, nombre: c.nombre }));
  }, [megaActiva, categorias]);

  const [lineaFiltro, setLineaFiltro] = useState<number | null>(null);

  const gramajesDisponibles = useMemo(() => {
    if (verCombos) {
      const prodIdsEnCombos = new Set(combos.filter(c => c.activo).flatMap(c => c.detalles.map(d => d.productoId)));
      let prods = productos.filter(p => prodIdsEnCombos.has(p.id) && p.pesoGramos);
      if (lineaFiltro) prods = prods.filter(p => p.categoriaId === lineaFiltro);
      return prods.map(p => p.pesoGramos!).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    }
    if (!megaActiva) return [];
    let prods = productos.filter(p => p.activo && (lineaFiltro ? p.categoriaId === lineaFiltro : megaActiva.catIds.includes(p.categoriaId)) && p.pesoGramos);
    return prods.map(p => p.pesoGramos!).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  }, [productos, combos, megaActiva, verCombos, lineaFiltro]);

  // Promos vigentes
  const promosVigentes = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return promociones.filter(p => {
      if (!p.activa) return false;
      const desde = p.fechaDesde.split('T')[0];
      const hasta = p.fechaHasta.split('T')[0];
      if (desde > hoy || hasta < hoy) return false;
      if (localActivo !== 0 && !p.locales.some(l => l.localId === localActivo)) return false;
      return true;
    });
  }, [promociones, localActivo]);

  // Aplica un beneficio sobre un precio base. Devuelve null si la promo no
  // afecta el precio mostrado del item (ej: reintegro, envio gratis).
  const aplicarBeneficio = (precioBase: number, promo: PromocionDto): number | null => {
    switch (promo.tipoBeneficio) {
      case TipoBeneficio.PorcentajeDescuento:
        return precioBase * (1 - promo.valorBeneficio / 100);
      case TipoBeneficio.MontoFijoDescuento:
        return Math.max(0, precioBase - promo.valorBeneficio);
      default:
        // PrecioFijoItems se maneja arriba via item.precioPromo.
        // Reintegros, EnvioGratis y ProductoGratis no modifican el precio mostrado.
        return null;
    }
  };

  const preciosPromoProductos = useMemo(() => {
    const map = new Map<number, { precioPromo: number; nombrePromo: string }>();
    for (const promo of promosVigentes) {
      for (const item of promo.items) {
        if (item.productoId) {
          let precio: number | null;
          if (item.precioPromo != null) {
            precio = item.precioPromo;
          } else {
            const prod = productos.find(p => p.id === item.productoId);
            if (!prod) continue;
            precio = aplicarBeneficio(prod.precio, promo);
          }
          if (precio == null) continue;
          map.set(item.productoId, { precioPromo: Math.round(precio * 100) / 100, nombrePromo: promo.nombre });
        }
      }
    }
    return map;
  }, [promosVigentes, productos]);

  const preciosPromoCombos = useMemo(() => {
    const map = new Map<number, { precioPromo: number; nombrePromo: string }>();
    for (const promo of promosVigentes) {
      for (const item of promo.items) {
        if (item.comboId) {
          let precio: number | null;
          if (item.precioPromo != null) {
            precio = item.precioPromo;
          } else {
            const combo = combos.find(c => c.id === item.comboId);
            if (!combo) continue;
            precio = aplicarBeneficio(combo.precio, promo);
          }
          if (precio == null) continue;
          map.set(item.comboId, { precioPromo: Math.round(precio * 100) / 100, nombrePromo: promo.nombre });
        }
      }
    }
    return map;
  }, [promosVigentes, combos]);

  // Filtrado
  const productosFiltrados = useMemo(() => {
    let lista = productos.filter(p => p.activo);
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      lista = lista.filter(p =>
        (p.codigo?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term) || (p.descripcion?.toLowerCase().includes(term))
      );
    }
    if (megaFiltro === 'promo') {
      lista = lista.filter(p => preciosPromoProductos.has(p.id));
    } else if (megaFiltro === 'ofertas') {
      lista = lista.filter(p => p.esOfertaSemanal);
    } else if (megaActiva) {
      lista = lista.filter(p => megaActiva.catIds.includes(p.categoriaId));
      if (lineaFiltro) {
        lista = lista.filter(p => p.categoriaId === lineaFiltro);
      }
      if (gramajesFiltro) {
        lista = lista.filter(p => p.pesoGramos === gramajesFiltro);
      }
    }
    return lista;
  }, [productos, busqueda, megaFiltro, gramajesFiltro, lineaFiltro, megaActiva, preciosPromoProductos]);

  const combosFiltrados = useMemo(() => {
    let lista = combos.filter(c => c.activo);
    if (busqueda.trim()) {
      lista = lista.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }
    if (megaFiltro === 'promo') {
      lista = lista.filter(c => preciosPromoCombos.has(c.id));
    } else if (megaFiltro === 'ofertas') {
      lista = lista.filter(c => c.esOfertaSemanal);
    } else if (megaActiva) {
      let prodsEnCat = productos.filter(p => megaActiva.catIds.includes(p.categoriaId));
      if (lineaFiltro) prodsEnCat = prodsEnCat.filter(p => p.categoriaId === lineaFiltro);
      if (gramajesFiltro) prodsEnCat = prodsEnCat.filter(p => p.pesoGramos === gramajesFiltro);
      const prodIdsEnCat = new Set(prodsEnCat.map(p => p.id));
      lista = lista.filter(c => c.detalles.some(d => prodIdsEnCat.has(d.productoId)));
    }
    // Cuando verCombos, filtrar por línea y gramaje
    if (verCombos && (lineaFiltro || gramajesFiltro)) {
      let prods = productos;
      if (lineaFiltro) prods = prods.filter(p => p.categoriaId === lineaFiltro);
      if (gramajesFiltro) prods = prods.filter(p => p.pesoGramos === gramajesFiltro);
      const prodIds = new Set(prods.map(p => p.id));
      lista = lista.filter(c => c.detalles.some(d => prodIds.has(d.productoId)));
    }
    return lista;
  }, [combos, productos, busqueda, megaFiltro, lineaFiltro, gramajesFiltro, megaActiva, preciosPromoCombos, verCombos]);

  const listaSeleccionada = listas.find(l => l.id === listaPrecioId);

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-3 flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-lg font-bold text-white">Articulos</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de lista de precios */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-gray-200 whitespace-nowrap">Lista:</label>
            <select
              value={listaPrecioId ?? ''}
              onChange={e => setListaPrecioId(e.target.value ? Number(e.target.value) : null)}
              className="border rounded-lg px-2 sm:px-3 py-1.5 text-sm bg-white min-w-[130px] sm:min-w-[180px]"
            >
              <option value="">Precio Base</option>
              {listas.filter(l => l.activa).map(l => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>
          {esSuperAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => abrirFormProducto()} className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                <span className="hidden sm:inline">Nuevo </span>Producto
              </button>
              <button onClick={() => abrirFormCombo()} className="text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                <span className="hidden sm:inline">Nuevo </span>Combo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form admin */}
      {showForm && esSuperAdmin && (
        <ProductoForm
          form={form}
          setForm={setForm}
          categorias={categorias}
          marcas={marcas}
          unidadPeso={unidadPeso}
          setUnidadPeso={setUnidadPeso}
          editando={!!editando}
          esSuperAdmin={esSuperAdmin}
          guardando={guardando}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditando(null); }}
        />
      )}

      {/* Form combo */}
      {showFormCombo && esSuperAdmin && (
        <ComboForm
          codigo={comboCodigo}
          setCodigo={setComboCodigo}
          nombre={comboNombre}
          setNombre={setComboNombre}
          descripcion={comboDescripcion}
          setDescripcion={setComboDescripcion}
          precio={comboPrecio}
          setPrecio={setComboPrecio}
          detalles={comboDetalles}
          setDetalles={setComboDetalles}
          esOferta={comboEsOferta}
          setEsOferta={setComboEsOferta}
          productos={productos}
          editando={!!editandoCombo}
          esSuperAdmin={esSuperAdmin}
          guardando={guardando}
          onSubmit={handleSubmitCombo}
          onCancel={() => { setShowFormCombo(false); setEditandoCombo(null); }}
        />
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setMegaFiltro(null); setGramajesFiltro(null); setLineaFiltro(null); setVerCombos(false); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!megaFiltro && !verCombos ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {(preciosPromoProductos.size > 0 || preciosPromoCombos.size > 0) && (
            <button onClick={() => { setMegaFiltro('promo'); setGramajesFiltro(null); setVerCombos(false); }} className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${megaFiltro === 'promo' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'}`}>Promos</button>
          )}
          <button onClick={() => { setMegaFiltro('ofertas'); setGramajesFiltro(null); setLineaFiltro(null); setVerCombos(false); }} className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${megaFiltro === 'ofertas' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100'}`}>Oferta Semanal</button>
          <button onClick={() => { setVerCombos(true); setMegaFiltro(null); setGramajesFiltro(null); setLineaFiltro(null); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${verCombos ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>Combos</button>
          {megaCategorias.map(mc => (
            <button key={mc.key} onClick={() => { setMegaFiltro(mc.key); setGramajesFiltro(null); setLineaFiltro(null); setVerCombos(false); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${megaFiltro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{mc.label}</button>
          ))}
        </div>
        {lineasDisponibles.length > 0 && (
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Sub:</span>
            <button onClick={() => setLineaFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!lineaFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
            {lineasDisponibles.map(l => (
              <button key={l.id} onClick={() => setLineaFiltro(l.id)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lineaFiltro === l.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l.nombre}</button>
            ))}
          </div>
        )}
        {gramajesDisponibles.length > 0 && (
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Gramaje:</span>
            <button onClick={() => setGramajesFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!gramajesFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
            {gramajesDisponibles.map(g => (
              <button key={g} onClick={() => setGramajesFiltro(g)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${gramajesFiltro === g ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{formatGramaje(g, productos)}</button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por codigo, nombre o descripcion..."
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <span className="text-xs text-gray-400">
          {verCombos ? `${combosFiltrados.length} combo${combosFiltrados.length !== 1 ? 's' : ''}`
            : `${productosFiltrados.length} articulo${productosFiltrados.length !== 1 ? 's' : ''} + ${combosFiltrados.length} combo${combosFiltrados.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Combos toggle legacy - hidden, replaced by chip above */}
      <div className="hidden">
        <button>
          Combos
        </button>
      </div>

      {/* Badge lista seleccionada */}
      {listaSeleccionada && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
            Mostrando precios: {listaSeleccionada.nombre}
          </span>
          <button onClick={() => setListaPrecioId(null)} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Volver a precio base
          </button>
        </div>
      )}

      {/* Grid de productos/combos */}
      <div className="flex-1 overflow-y-auto">
        {(verCombos || megaFiltro === 'promo' || megaFiltro === 'ofertas') ? (
          /* ---- COMBOS (o Promos: ambos) ---- */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {(megaFiltro === 'promo' || megaFiltro === 'ofertas') && productosFiltrados.map(p => (
              <div
                key={`prod-${p.id}`}
                className="relative bg-red-50 border-2 border-red-200 rounded-lg p-3 hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setProductoDetalle(p)}
              >
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                {p.codigo && <div className="text-[10px] text-gray-400 font-mono">{p.codigo}</div>}
                <div className="font-medium text-sm text-gray-800">{p.nombre}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
                <div className="font-bold mt-1">
                  <span className="text-xs text-gray-400 line-through">${formatearNumero(p.precio)}</span>
                  <span className="text-red-600 ml-1">${formatearNumero(preciosPromoProductos.get(p.id)!.precioPromo)}</span>
                </div>
              </div>
            ))}
            {combosFiltrados.map(c => (
              <div
                key={`combo-${c.id}`}
                className={`relative border-2 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${preciosPromoCombos.has(c.id) ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-purple-50 border-purple-200 hover:border-purple-400'}`}
                onClick={() => setProductoDetalle(null)}
              >
                {preciosPromoCombos.has(c.id) && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                )}
                {!preciosPromoCombos.has(c.id) && c.esOfertaSemanal && (
                  <span className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">OFERTA</span>
                )}
                <div className="font-medium text-sm text-gray-800">{c.nombre}</div>
                {c.descripcion && <div className="text-xs text-gray-500 mt-0.5">{c.descripcion}</div>}
                {preciosPromoCombos.has(c.id) ? (
                  <div className="font-bold mt-1">
                    <span className="text-xs text-gray-400 line-through">${formatearNumero(c.precio)}</span>
                    <span className="text-red-600 ml-1">${formatearNumero(preciosPromoCombos.get(c.id)!.precioPromo)}</span>
                  </div>
                ) : (
                  <div className="text-purple-600 font-bold mt-1">${formatearNumero(c.precio)}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">{c.detalles.length} productos</div>
                {esSuperAdmin && (
                  <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditarCombo(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDuplicarCombo(c)} className="text-xs text-purple-600 hover:underline">Duplicar</button>
                    <button onClick={() => setConfirmacionCombo({ visible: true, id: c.id })} className="text-xs text-red-600 hover:underline">Desactivar</button>
                  </div>
                )}
              </div>
            ))}
            {combosFiltrados.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">No hay combos</div>
            )}
          </div>
        ) : (
          /* ---- PRODUCTOS ---- */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {productosFiltrados.map(p => (
              <div
                key={p.id}
                className={`relative border-2 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer group ${preciosPromoProductos.has(p.id) ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-white border-gray-200 hover:border-amber-400'}`}
                onClick={() => setProductoDetalle(p)}
              >
                {preciosPromoProductos.has(p.id) && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                )}
                {p.codigo && (
                  <div className="text-[10px] text-gray-400 font-mono">{p.codigo}</div>
                )}
                <div className="font-medium text-sm text-gray-800 group-hover:text-amber-700">{p.nombre}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
                {p.marca && <div className="text-[10px] text-gray-400">Marca: {p.marca}</div>}

                {/* Precios */}
                <div className="mt-1.5">
                  {preciosPromoProductos.has(p.id) ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-gray-400 line-through">${formatearNumero(getPrecioMostrar(p))}</span>
                      <span className="font-bold text-red-600">${formatearNumero(preciosPromoProductos.get(p.id)!.precioPromo)}</span>
                    </div>
                  ) : tienePrecioLista(p) ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-amber-600">${formatearNumero(getPrecioMostrar(p))}</span>
                      <span className="text-[10px] text-gray-400 line-through">${formatearNumero(p.precio)}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-amber-600">${formatearNumero(p.precio)}</span>
                  )}
                </div>

                {p.unidadesPorMedia > 0 && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Media: {p.unidadesPorMedia} | Bulto: {p.unidadesPorBulto}
                  </div>
                )}

                {/* Precios costo/venta - solo SuperAdmin */}
                {esSuperAdmin && (p.precioCosto ?? 0) > 0 && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Costo: ${formatearNumero(p.precioCosto)} | Margen: <span className={(p.diferenciaPrecioCosto ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}>${formatearNumero(p.diferenciaPrecioCosto)}</span>
                  </div>
                )}

                {/* Botones admin */}
                {esSuperAdmin && (
                  <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditar(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => setConfirmacion({ visible: true, id: p.id })} className="text-xs text-red-600 hover:underline">Desactivar</button>
                  </div>
                )}
              </div>
            ))}
            {/* Combos que coinciden con la búsqueda */}
            {combosFiltrados.map(c => (
              <div
                key={`combo-${c.id}`}
                className={`relative border-2 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${preciosPromoCombos.has(c.id) ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-purple-50 border-purple-200 hover:border-purple-400'}`}
              >
                {preciosPromoCombos.has(c.id) && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                )}
                {!preciosPromoCombos.has(c.id) && c.esOfertaSemanal && (
                  <span className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">OFERTA</span>
                )}
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">COMBO</span>
                <div className="font-medium text-sm text-gray-800 mt-1">{c.nombre}</div>
                {c.descripcion && <div className="text-xs text-gray-500 mt-0.5">{c.descripcion}</div>}
                {preciosPromoCombos.has(c.id) ? (
                  <div className="font-bold mt-1">
                    <span className="text-xs text-gray-400 line-through">${formatearNumero(c.precio)}</span>
                    <span className="text-red-600 ml-1">${formatearNumero(preciosPromoCombos.get(c.id)!.precioPromo)}</span>
                  </div>
                ) : (
                  <div className="text-purple-600 font-bold mt-1">${formatearNumero(c.precio)}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">{c.detalles.length} productos</div>
                {esSuperAdmin && (
                  <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditarCombo(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDuplicarCombo(c)} className="text-xs text-purple-600 hover:underline">Duplicar</button>
                    <button onClick={() => setConfirmacionCombo({ visible: true, id: c.id })} className="text-xs text-red-600 hover:underline">Desactivar</button>
                  </div>
                )}
              </div>
            ))}
            {productosFiltrados.length === 0 && combosFiltrados.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">No hay resultados</div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle producto */}
      {productoDetalle && (
        <ProductoDetalleModal producto={productoDetalle} listas={listas} onClose={() => setProductoDetalle(null)} />
      )}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Desactivar producto"
        mensaje="¿Desactivar este producto?"
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />

      <ConfirmModal
        visible={confirmacionCombo.visible}
        titulo="Desactivar combo"
        mensaje="¿Desactivar este combo?"
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivarCombo}
        onCancelar={() => setConfirmacionCombo({ visible: false, id: 0 })}
      />
    </div>
  );
}
