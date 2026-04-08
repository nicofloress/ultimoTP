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
import { getPromociones, PromocionDto } from '../../api/promociones';
import { useLocalActivo } from '../../context/LocalContext';
import { formatearNumero } from '../../components/NumericInput';

const emptyForm = { nombre: '', descripcion: '', precio: 0, categoriaId: 0, imagenUrl: '', numeroInterno: '', pesoGramos: 0, unidadesPorBulto: 1, marca: '', unidadesPorMedia: 0, esOfertaSemanal: false, precioCosto: 0, precioVenta: 0 };

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
  const [comboNombre, setComboNombre] = useState('');
  const [comboDescripcion, setComboDescripcion] = useState('');
  const [comboPrecio, setComboPrecio] = useState(0);
  const [comboDetalles, setComboDetalles] = useState<{ productoId: number; cantidad: number }[]>([]);
  const [comboEsOferta, setComboEsOferta] = useState(false);
  const [promociones, setPromociones] = useState<PromocionDto[]>([]);
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

  useEffect(() => { cargar(); getPromociones().then(setPromociones).catch(() => {}); }, []);

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
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoriaId: p.categoriaId, imagenUrl: p.imagenUrl || '', numeroInterno: p.numeroInterno || '', pesoGramos: p.pesoGramos ?? 0, unidadesPorBulto: p.unidadesPorBulto ?? 1, marca: p.marca || '', unidadesPorMedia: p.unidadesPorMedia ?? 0, esOfertaSemanal: p.esOfertaSemanal ?? false, precioCosto: p.precioCosto ?? 0, precioVenta: p.precioVenta ?? 0 });
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
    setShowForm(true); setEditando(null); setForm(emptyForm);
  };

  const abrirFormCombo = () => {
    setShowForm(false); setEditando(null);
    setShowFormCombo(true); setEditandoCombo(null);
    setComboNombre(''); setComboDescripcion(''); setComboPrecio(0); setComboDetalles([]); setComboEsOferta(false);
  };

  const handleEditarCombo = (c: Combo) => {
    setShowForm(false); setEditando(null);
    setEditandoCombo(c);
    setComboNombre(c.nombre); setComboDescripcion(c.descripcion || ''); setComboPrecio(c.precio);
    setComboDetalles(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad })));
    setComboEsOferta(c.esOfertaSemanal ?? false);
    setShowFormCombo(true);
  };

  const handleDuplicarCombo = (c: Combo) => {
    setShowForm(false); setEditando(null);
    setEditandoCombo(null); // null = crear nuevo
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

    // Verificar duplicado
    const duplicado = comboYaExiste(comboDetalles, editandoCombo?.id);
    if (duplicado) {
      showToast(`Ya existe un combo con los mismos productos y cantidades: "${duplicado.nombre}"`, 'error');
      return;
    }

    setGuardando(true);
    try {
      if (editandoCombo) {
        await updateCombo(editandoCombo.id, { nombre: comboNombre, descripcion: comboDescripcion, precio: comboPrecio, activo: true, esOfertaSemanal: comboEsOferta, detalles: comboDetalles });
        showToast('Combo actualizado correctamente', 'success');
      } else {
        await createCombo({ nombre: comboNombre, descripcion: comboDescripcion, precio: comboPrecio, esOfertaSemanal: comboEsOferta, detalles: comboDetalles });
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

  // Mega-categorías
  const megaCategorias = useMemo(() => {
    const byTipo = (tipo: number) => categorias.filter(c => c.activa && c.tipoMegaCategoria === tipo).map(c => c.id);
    return [
      { key: 'hamburguesa', label: 'Hamburguesas', catIds: byTipo(1) },
      { key: 'salchicha', label: 'Salchichas', catIds: byTipo(2) },
      { key: 'pan', label: 'Pan', catIds: byTipo(3) },
      { key: 'aderezos', label: 'Aderezos', catIds: byTipo(4) },
      { key: 'snacks', label: 'Snacks', catIds: byTipo(5) },
    ];
  }, [categorias]);

  const tieneSubfiltro = megaFiltro === 'hamburguesa' || megaFiltro === 'snacks' || verCombos;

  const lineasDisponibles = useMemo(() => {
    if (megaFiltro !== 'hamburguesa' && !verCombos) return [];
    // Mostrar líneas de hamburguesa (las categorías que tienen tipo Hamburguesa)
    const mc = megaCategorias.find(m => m.key === 'hamburguesa');
    if (!mc) return [];
    return categorias.filter(c => c.activa && mc.catIds.includes(c.id)).map(c => ({ id: c.id, nombre: c.nombre }));
  }, [megaFiltro, megaCategorias, categorias, verCombos]);

  const [lineaFiltro, setLineaFiltro] = useState<number | null>(null);

  const gramajesDisponibles = useMemo(() => {
    if (!tieneSubfiltro) return [];
    if (verCombos) {
      // Gramajes de productos contenidos en combos activos
      const prodIdsEnCombos = new Set(combos.filter(c => c.activo).flatMap(c => c.detalles.map(d => d.productoId)));
      let prods = productos.filter(p => prodIdsEnCombos.has(p.id) && p.pesoGramos);
      if (lineaFiltro) prods = prods.filter(p => p.categoriaId === lineaFiltro);
      return prods.map(p => p.pesoGramos!).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    }
    const mc = megaCategorias.find(m => m.key === megaFiltro);
    if (!mc) return [];
    let prods = productos.filter(p => p.activo && (lineaFiltro ? p.categoriaId === lineaFiltro : mc.catIds.includes(p.categoriaId)) && p.pesoGramos);
    return prods.map(p => p.pesoGramos!).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  }, [productos, combos, megaFiltro, megaCategorias, verCombos, lineaFiltro]);

  void useMemo(() => {
    if (!tieneSubfiltro) return [];
    const mc = megaCategorias.find(m => m.key === megaFiltro);
    if (!mc) return [];
    return productos
      .filter(p => p.activo && mc.catIds.includes(p.categoriaId) && p.marca)
      .map(p => p.marca!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [productos, megaFiltro, megaCategorias]);

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

  const preciosPromoProductos = useMemo(() => {
    const map = new Map<number, { precioPromo: number; nombrePromo: string }>();
    for (const promo of promosVigentes) {
      for (const item of promo.items) {
        if (item.productoId) {
          let precio: number;
          if (item.precioPromo != null) {
            precio = item.precioPromo;
          } else {
            const prod = productos.find(p => p.id === item.productoId);
            if (!prod) continue;
            precio = promo.tipoDescuento === 1
              ? prod.precio * (1 - promo.valorDescuento / 100)
              : Math.max(0, prod.precio - promo.valorDescuento);
          }
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
          let precio: number;
          if (item.precioPromo != null) {
            precio = item.precioPromo;
          } else {
            const combo = combos.find(c => c.id === item.comboId);
            if (!combo) continue;
            precio = promo.tipoDescuento === 1
              ? combo.precio * (1 - promo.valorDescuento / 100)
              : Math.max(0, combo.precio - promo.valorDescuento);
          }
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
        (p.numeroInterno?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term) || (p.descripcion?.toLowerCase().includes(term))
      );
    }
    if (megaFiltro === 'promo') {
      lista = lista.filter(p => preciosPromoProductos.has(p.id));
    } else if (megaFiltro === 'ofertas') {
      lista = lista.filter(p => p.esOfertaSemanal);
    } else if (megaFiltro) {
      const mc = megaCategorias.find(m => m.key === megaFiltro);
      if (mc) {
        lista = lista.filter(p => mc.catIds.includes(p.categoriaId));
        if (megaFiltro === 'hamburguesa' && lineaFiltro) {
          lista = lista.filter(p => p.categoriaId === lineaFiltro);
        }
        if (gramajesFiltro) {
          lista = lista.filter(p => p.pesoGramos === gramajesFiltro);
        }
      }
    }
    return lista;
  }, [productos, busqueda, megaFiltro, gramajesFiltro, lineaFiltro, megaCategorias, preciosPromoProductos]);

  const combosFiltrados = useMemo(() => {
    let lista = combos.filter(c => c.activo);
    if (busqueda.trim()) {
      lista = lista.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }
    if (megaFiltro === 'promo') {
      lista = lista.filter(c => preciosPromoCombos.has(c.id));
    } else if (megaFiltro === 'ofertas') {
      lista = lista.filter(c => c.esOfertaSemanal);
    } else if (megaFiltro && megaFiltro !== 'promo') {
      const mc = megaCategorias.find(m => m.key === megaFiltro);
      if (mc) {
        let prodsEnCat = productos.filter(p => mc.catIds.includes(p.categoriaId));
        if (lineaFiltro) prodsEnCat = prodsEnCat.filter(p => p.categoriaId === lineaFiltro);
        if (gramajesFiltro) prodsEnCat = prodsEnCat.filter(p => p.pesoGramos === gramajesFiltro);
        const prodIdsEnCat = new Set(prodsEnCat.map(p => p.id));
        lista = lista.filter(c => c.detalles.some(d => prodIdsEnCat.has(d.productoId)));
      }
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
  }, [combos, productos, busqueda, megaFiltro, lineaFiltro, gramajesFiltro, megaCategorias, preciosPromoCombos, verCombos]);

  const listaSeleccionada = listas.find(l => l.id === listaPrecioId);

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Articulos</h2>
        <div className="flex items-center gap-3">
          {/* Selector de lista de precios */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-200">Lista de precios:</label>
            <select
              value={listaPrecioId ?? ''}
              onChange={e => setListaPrecioId(e.target.value ? Number(e.target.value) : null)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white min-w-[180px]"
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
              <button onClick={() => abrirFormProducto()} className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-3 py-1.5 text-sm font-semibold transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo Producto
              </button>
              <button onClick={() => abrirFormCombo()} className="text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100 px-3 py-1.5 text-sm font-semibold transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo Combo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form admin */}
      {showForm && esSuperAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
            <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="border rounded px-3 py-2 w-full" required>
              <option value={0}>Seleccionar categoria</option>
              {categorias.filter(c => c.activa).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
            <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
          </div>
          {esSuperAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio Costo</label>
              <input type="number" value={form.precioCosto} onChange={e => setForm({ ...form, precioCosto: Number(e.target.value) })} placeholder="Precio de costo" className="border rounded px-3 py-2 w-full" min={0} step={0.01} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio Venta</label>
            <input type="number" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: Number(e.target.value) })} placeholder="Precio de venta" className="border rounded px-3 py-2 w-full" min={0} step={0.01} required />
          </div>
          {esSuperAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Margen</label>
              <div className={`border rounded px-3 py-2 w-full text-sm font-medium ${form.precioVenta - form.precioCosto > 0 ? 'bg-green-50 text-green-700' : form.precioVenta - form.precioCosto < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
                ${formatearNumero(form.precioVenta - form.precioCosto)} ({form.precioCosto > 0 ? ((form.precioVenta - form.precioCosto) / form.precioCosto * 100).toFixed(1) : '0'}%)
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numero Interno</label>
            <input type="text" value={form.numeroInterno} onChange={e => setForm({ ...form, numeroInterno: e.target.value })} placeholder="Numero interno (ej: HAM-001)" className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
            <input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Marca" className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Peso (gramos)</label>
            <input type="number" value={form.pesoGramos} onChange={e => setForm({ ...form, pesoGramos: Number(e.target.value) })} placeholder="Peso en gramos" className="border rounded px-3 py-2 w-full" min={0} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidades por Bulto</label>
            <input type="number" value={form.unidadesPorBulto} onChange={e => setForm({ ...form, unidadesPorBulto: Number(e.target.value) })} placeholder="Unidades por bulto" className="border rounded px-3 py-2 w-full" min={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidades por Medio Bulto</label>
            <input type="number" value={form.unidadesPorMedia} onChange={e => setForm({ ...form, unidadesPorMedia: Number(e.target.value) })} placeholder="Unidades por media" className="border rounded px-3 py-2 w-full" min={0} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.esOfertaSemanal} onChange={e => setForm({ ...form, esOfertaSemanal: e.target.checked })} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
              Oferta Semanal
            </label>
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {/* Form combo */}
      {showFormCombo && esSuperAdmin && (
        <form onSubmit={handleSubmitCombo} className="bg-white p-4 rounded-lg shadow mb-3 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={comboNombre} onChange={e => setComboNombre(e.target.value)} placeholder="Nombre del combo" className="border rounded px-3 py-2 w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
              <input type="text" value={comboDescripcion} onChange={e => setComboDescripcion(e.target.value)} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio Venta del Combo</label>
              <input type="number" value={comboPrecio} onChange={e => setComboPrecio(Number(e.target.value))} placeholder="Precio combo" className="border rounded px-3 py-2 w-full" min={0} step={0.01} required />
            </div>
          </div>
          {esSuperAdmin && comboDetalles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700 flex items-center gap-4">
              <span><span className="font-semibold">Costo estimado:</span> ${formatearNumero(comboDetalles.reduce((sum, d) => {
                const prod = productos.find(p => p.id === d.productoId);
                return sum + (prod?.precioCosto ?? 0) * d.cantidad;
              }, 0))}</span>
              {comboPrecio > 0 && (
                <span><span className="font-semibold">Margen:</span> <span className={comboPrecio - comboDetalles.reduce((sum, d) => { const prod = productos.find(p => p.id === d.productoId); return sum + (prod?.precioCosto ?? 0) * d.cantidad; }, 0) > 0 ? 'text-green-700' : 'text-red-700'}>
                  ${formatearNumero(comboPrecio - comboDetalles.reduce((sum, d) => { const prod = productos.find(p => p.id === d.productoId); return sum + (prod?.precioCosto ?? 0) * d.cantidad; }, 0))}
                </span></span>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={comboEsOferta} onChange={e => setComboEsOferta(e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            Oferta Semanal
          </label>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-600">Productos del combo</label>
              <button type="button" onClick={() => setComboDetalles([...comboDetalles, { productoId: 0, cantidad: 1 }])} className="text-sm text-amber-600 hover:underline">+ Agregar producto</button>
            </div>
            {comboDetalles.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={d.productoId} onChange={e => { const n = [...comboDetalles]; n[i].productoId = Number(e.target.value); setComboDetalles(n); }} className="border rounded px-3 py-2 flex-1">
                  <option value={0}>Seleccionar producto</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>)}
                </select>
                <input type="number" value={d.cantidad} onChange={e => { const n = [...comboDetalles]; n[i].cantidad = Number(e.target.value); setComboDetalles(n); }} className="border rounded px-3 py-2 w-20" min={1} />
                <button type="button" onClick={() => setComboDetalles(comboDetalles.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 px-2">X</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={guardando} className="text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editandoCombo ? 'Actualizar Combo' : 'Crear Combo')}</button>
            <button type="button" onClick={() => { setShowFormCombo(false); setEditandoCombo(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
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
        {(megaFiltro === 'hamburguesa' || verCombos) && lineasDisponibles.length > 1 && (
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Linea:</span>
            <button onClick={() => setLineaFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!lineaFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
            {lineasDisponibles.map(l => (
              <button key={l.id} onClick={() => setLineaFiltro(l.id)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lineaFiltro === l.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l.nombre.replace('Hamburguesa ', '')}</button>
            ))}
          </div>
        )}
        {tieneSubfiltro && gramajesDisponibles.length > 0 && (
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Gramaje:</span>
            <button onClick={() => setGramajesFiltro(null)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${!gramajesFiltro ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
            {gramajesDisponibles.map(g => (
              <button key={g} onClick={() => setGramajesFiltro(g)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${gramajesFiltro === g ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{g}gr</button>
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
                {p.numeroInterno && <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>}
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
                {p.numeroInterno && (
                  <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setProductoDetalle(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-slate-700 text-white px-5 py-4 rounded-t-xl">
              <h3 className="font-bold text-lg">{productoDetalle.nombre}</h3>
              {productoDetalle.numeroInterno && (
                <span className="text-slate-300 text-xs font-mono">{productoDetalle.numeroInterno}</span>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Categoría</span>
                <span className="font-medium">{productoDetalle.categoriaNombre}</span>
              </div>
              {productoDetalle.marca && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Marca</span>
                  <span className="font-medium">{productoDetalle.marca}</span>
                </div>
              )}
              {productoDetalle.pesoGramos != null && productoDetalle.pesoGramos > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Peso</span>
                  <span className="font-medium">{productoDetalle.pesoGramos}g</span>
                </div>
              )}
              {productoDetalle.unidadesPorMedia > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unidades por media</span>
                    <span className="font-medium">{productoDetalle.unidadesPorMedia}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unidades por bulto</span>
                    <span className="font-medium">{productoDetalle.unidadesPorBulto}</span>
                  </div>
                </>
              )}
              {productoDetalle.descripcion && (
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Descripción</span>
                  <span className="text-gray-700">{productoDetalle.descripcion}</span>
                </div>
              )}

              {/* Precios */}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Precio base</span>
                  <span className="font-bold text-lg">${productoDetalle.precio.toLocaleString()}</span>
                </div>

                {/* Precios de todas las listas */}
                {listas.filter(l => l.activa).map(lista => {
                  const detalle = lista.detalles.find(d => d.productoId === productoDetalle.id);
                  if (!detalle) return null;
                  return (
                    <div key={lista.id} className="flex justify-between items-center mt-1">
                      <span className="text-gray-500 text-sm">{lista.nombre}</span>
                      <span className={`font-bold text-lg ${detalle.precio !== productoDetalle.precio ? 'text-amber-600' : ''}`}>
                        ${detalle.precio.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setProductoDetalle(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
