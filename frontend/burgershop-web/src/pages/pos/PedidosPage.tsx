import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Venta, EstadoVenta, estadoLabels, estadoColores,
  Producto, Combo, Categoria, CarritoItem, TipoVenta,
  FormaPago, Zona, TipoFactura, ListaPrecio, TipoCliente,
} from '../../types';
import { getVentas, crearVenta, cambiarEstado, cancelarVenta, actualizarVenta } from '../../api/pedidos';
import { buscarProductos, buscarCombos, construirIndiceProductos, construirIndiceCombos } from '../../utils/buscarItems';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getCategorias } from '../../api/categorias';
import { getFormasPagoActivas } from '../../api/formasPago';
import { getTiposCliente } from '../../api/tiposCliente';
import { getZonas } from '../../api/zonas';
import { buscarClientes } from '../../api/clientes';
import { ClienteDto } from '../../types/ventas';
import { getRepartidores } from '../../api/repartidores';
import { getListasPrecios } from '../../api/listasPrecios';
import { Repartidor } from '../../types/logistica';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';
import { useListNavigation } from '../../hooks/useListNavigation';
import { GoogleMap } from '../../components/GoogleMap';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { es } from 'date-fns/locale';
import { addDays, format } from 'date-fns';

import { useGlobalToast } from '../../components/Toast';
import { getPromociones, PromocionDto } from '../../api/promociones';
import { useLocalActivo } from '../../context/LocalContext';
import { formatearNumero } from '../../components/NumericInput';
import ModalCancelarPedido from './pedidos/ModalCancelarPedido';
import ModalAsignarRepartidor from './pedidos/ModalAsignarRepartidor';
import ModalMapaGrande from './pedidos/ModalMapaGrande';
import PedidosDelDiaPanel from './pedidos/PedidosDelDiaPanel';
import ModalCatalogo from './shared/ModalCatalogo';

const inputClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors';
const selectClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

// Estados para filtrar pedidos (EnPreparacion y Listo no se usan en el flujo actual)
const estadosFiltro = [
  EstadoVenta.Pendiente,
  EstadoVenta.Asignado,
  EstadoVenta.EnCamino,
  EstadoVenta.Entregado,
  EstadoVenta.Cancelado,
  EstadoVenta.NoEntregado,
];

export default function PedidosPage() {
  const { showToast: addToast } = useGlobalToast();
  const { localActivo, locales } = useLocalActivo();
  // ===== DATA =====
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const [listaPrecioSeleccionada, setListaPrecioSeleccionada] = useState<number | undefined>();
  const [preciosLista, setPreciosLista] = useState<Map<number, number>>(new Map());
  const [promociones, setPromociones] = useState<PromocionDto[]>([]);

  // ===== PANEL DERECHO: PEDIDOS =====
  const [pedidos, setPedidos] = useState<Venta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoVenta | null>(null);
  const [busquedaTicket, setBusquedaTicket] = useState('');

  // ===== PANEL IZQUIERDO: FORMULARIO =====
  const [editandoPedido, setEditandoPedido] = useState<Venta | null>(null);
  // Asignado permite edición completa igual que Pendiente
  const esEdicionLimitada = false;
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mostrarMapaGrande, setMostrarMapaGrande] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [gramajesFiltro, setGramajesFiltro] = useState<number | null>(null);
  const [marcaFiltro, setMarcaFiltro] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  // Ctrl+Space: focus en cantidad del último item del carrito
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space' && carrito.length > 0) {
        e.preventDefault();
        const inputs = document.querySelectorAll<HTMLInputElement>('.carrito-cant-input');
        const last = inputs[inputs.length - 1];
        if (last) { last.focus(); last.select(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [carrito.length]);

  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<number | undefined>();
  const [notaInterna, setNotaInterna] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<number | undefined>();
  const [descuento, setDescuento] = useState(0);
  const [esProgramado, setEsProgramado] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [popoverCalendarioAbierto, setPopoverCalendarioAbierto] = useState(false);
  const [yaPago, setYaPago] = useState(false);
  const [esCtaCte, setEsCtaCte] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);
  const [creandoPedido, setCreandoPedido] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [sugerenciasCliente, setSugerenciasCliente] = useState<ClienteDto[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const clienteInputRef = useRef<HTMLDivElement>(null);

  // ===== MODAL ASIGNAR REPARTIDOR =====
  const [mostrarAsignarRepartidor, setMostrarAsignarRepartidor] = useState<Venta | null>(null);

  // ===== MODAL CANCELAR PEDIDO =====
  const [pedidoCancelar, setPedidoCancelar] = useState<Venta | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const busquedaRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const { sugerencias: sugerenciasDireccion, coordenadas, setCoordenadas, buscarDirecciones, limpiarSugerencias, geocodificar, geocodificarDireccion, limpiarCoordenadas } = useGooglePlaces();
  const [mostrarSugerenciasDireccion, setMostrarSugerenciasDireccion] = useState(false);
  const [coordenadasLocal, setCoordenadasLocal] = useState<{ lat: number; lng: number } | null>(null);

  // Geocodificar la dirección del local activo para usar como centro por defecto del mapa
  useEffect(() => {
    const local = locales.find(l => l.id === localActivo);
    const direccionLocal = local?.direccion;
    if (!direccionLocal) { setCoordenadasLocal(null); return; }
    if (!window.google?.maps) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: direccionLocal, componentRestrictions: { country: 'ar' } }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const loc = results[0].geometry.location;
        setCoordenadasLocal({ lat: loc.lat(), lng: loc.lng() });
      } else {
        setCoordenadasLocal(null);
      }
    });
  }, [localActivo, locales]);

  // ===== CARGAR DATOS INICIALES =====
  useEffect(() => {
    getProductos().then(setProductos);
    getCombos().then(setCombos);
    getCategorias().then(setCategorias);
    getFormasPagoActivas().then(setFormasPago);
    getTiposCliente().then(setTiposCliente);
    getZonas().then(zs => setZonas(zs.filter(z => !localActivo || !z.localId || z.localId === localActivo)));
    getRepartidores().then(setRepartidores);
    getListasPrecios().then(setListasPrecios);
    getPromociones().then(setPromociones);
  }, []);

  const [preciosListaCombos, setPreciosListaCombos] = useState<Map<number, number>>(new Map());

  // Precios segun lista seleccionada
  useEffect(() => {
    if (listaPrecioSeleccionada) {
      const lista = listasPrecios.find(l => l.id === listaPrecioSeleccionada);
      if (lista) {
        const mapProd = new Map<number, number>();
        const mapCombo = new Map<number, number>();
        lista.detalles.forEach(d => {
          if (d.productoId) mapProd.set(d.productoId, d.precio);
          if (d.comboId) mapCombo.set(d.comboId, d.precio);
        });
        setPreciosLista(mapProd);
        setPreciosListaCombos(mapCombo);
      }
    } else {
      setPreciosLista(new Map());
      setPreciosListaCombos(new Map());
    }
  }, [listaPrecioSeleccionada, listasPrecios]);

  // --- Promociones vigentes (filtradas para Domicilio) ---
  const promosVigentes = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return promociones.filter(p => {
      if (!p.activa) return false;
      const desde = p.fechaDesde.split('T')[0];
      const hasta = p.fechaHasta.split('T')[0];
      if (desde > hoy || hasta < hoy) return false;
      if (localActivo !== 0 && !p.locales.some(l => l.localId === localActivo)) return false;
      // Filtrar por tipo de venta: vacío = aplica a todos, sino debe incluir Domicilio (2)
      if (p.tiposVenta && p.tiposVenta.length > 0 && !p.tiposVenta.includes(2)) return false;
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
            const prod = productos.find(pr => pr.id === item.productoId);
            if (!prod) continue;
            const precioBase = preciosLista.get(prod.id) ?? prod.precio;
            precio = promo.tipoDescuento === 1
              ? precioBase * (1 - promo.valorDescuento / 100)
              : Math.max(0, precioBase - promo.valorDescuento);
          }
          map.set(item.productoId, { precioPromo: Math.round(precio * 100) / 100, nombrePromo: promo.nombre });
        }
      }
    }
    return map;
  }, [promosVigentes, productos, preciosLista]);

  const preciosPromoCombos = useMemo(() => {
    const map = new Map<number, { precioPromo: number; nombrePromo: string }>();
    for (const promo of promosVigentes) {
      for (const item of promo.items) {
        if (item.comboId) {
          let precio: number;
          if (item.precioPromo != null) {
            precio = item.precioPromo;
          } else {
            const combo = combos.find(cb => cb.id === item.comboId);
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

  // ===== CARGAR PEDIDOS =====
  const cargarPedidos = useCallback(() => {
    const params: { estado?: number } = {};
    if (filtroEstado) params.estado = filtroEstado;
    getVentas(undefined, params.estado, undefined, localActivo || undefined)
      .then(ventas => setPedidos(ventas.filter(v => v.tipo === TipoVenta.Domicilio)));
  }, [filtroEstado, localActivo]);

  useEffect(() => { cargarPedidos(); }, [cargarPedidos]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(cargarPedidos, 15000);
    return () => clearInterval(interval);
  }, [cargarPedidos]);

  // ===== FUNCIONES DE CARRITO =====
  const agregarProducto = useCallback((p: Producto) => {
    const promoProducto = preciosPromoProductos.get(p.id);
    const precioFinal = promoProducto ? promoProducto.precioPromo : (preciosLista.get(p.id) ?? p.precio);
    const existente = carrito.find(i => i.productoId === p.id);
    if (existente) {
      setCarrito(carrito.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1, precioUnitario: precioFinal } : i));
    } else {
      setCarrito([...carrito, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: precioFinal }]);
    }
    setBusqueda('');
    busquedaRef.current?.focus();
  }, [carrito, preciosLista, preciosPromoProductos]);

  const agregarCombo = (c: Combo) => {
    const promoCombo = preciosPromoCombos.get(c.id);
    const precioFinal = promoCombo ? promoCombo.precioPromo : (preciosListaCombos.get(c.id) ?? c.precio);
    const existente = carrito.find(i => i.comboId === c.id);
    if (existente) {
      setCarrito(carrito.map(i => i.comboId === c.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { comboId: c.id, nombre: c.nombre, cantidad: 1, precioUnitario: precioFinal }]);
    }
  };

  // ===== BUSCAR CLIENTE =====
  const handleBuscarCliente = async (term: string) => {
    if (clienteSeleccionado) limpiarCliente();
    setBusquedaCliente(term);
    if (term.length >= 2) {
      const results = await buscarClientes(term);
      setSugerenciasCliente(results.filter(c => !localActivo || !c.localId || c.localId === localActivo));
    } else {
      setSugerenciasCliente([]);
    }
  };

  const seleccionarCliente = (c: ClienteDto) => {
    setClienteSeleccionado(c);
    setBusquedaCliente(c.nombre + (c.telefono ? ` - ${c.telefono}` : ''));
    setSugerenciasCliente([]);
    if (c.telefono) setTelefono(c.telefono);
    if (c.direccion) {
      setDireccion(c.direccion);
      geocodificarDireccion(c.direccion);
    }
    if (c.zonaId) setZonaSeleccionada(c.zonaId);
    if (c.listaPrecioId) setListaPrecioSeleccionada(c.listaPrecioId);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setSugerenciasCliente([]);
    setTelefono('');
    setDireccion('');
    setZonaSeleccionada(undefined);
    setListaPrecioSeleccionada(undefined);
    setEsCtaCte(false);
  };

  const clientesNav = useListNavigation(sugerenciasCliente, {
    onSelect: seleccionarCliente,
    onEscape: () => setSugerenciasCliente([]),
    dataAttr: 'data-cliente-idx',
    enabled: !clienteSeleccionado,
  });

  const seleccionarSugerenciaDireccion = (s: { descripcion: string; placeId: string }) => {
    setDireccion(s.descripcion);
    setMostrarSugerenciasDireccion(false);
    limpiarSugerencias();
    geocodificar(s.placeId);
  };

  const direccionNav = useListNavigation(sugerenciasDireccion, {
    onSelect: seleccionarSugerenciaDireccion,
    onEscape: () => setMostrarSugerenciasDireccion(false),
    dataAttr: 'data-dir-idx',
    enabled: mostrarSugerenciasDireccion && direccion.length >= 3,
  });

  const actualizarItem = (index: number, field: keyof CarritoItem, value: number | string) => {
    setCarrito(carrito.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const eliminarItem = (index: number) => setCarrito(carrito.filter((_, i) => i !== index));

  // ===== CUENTA CORRIENTE =====
  const tipoClienteActual = tiposCliente.find(tc => tc.id === clienteSeleccionado?.tipoClienteId);
  const permiteCuentaCorriente = !!tipoClienteActual?.permiteCuentaCorriente;
  const ctaCteFormaPago = formasPago.find(fp => fp.nombre === 'Cuenta Corriente');

  // ===== CALCULOS =====
  const subtotalLinea = (item: CarritoItem) => {
    const desc = item.descuentoPorcentaje ?? 0;
    return item.precioUnitario * item.cantidad * (1 - desc / 100);
  };
  const subtotal = carrito.reduce((sum, item) => sum + subtotalLinea(item), 0);
  const formaPagoActual = formasPago.find(fp => fp.id === formaPagoSeleccionada);
  const recargo = formaPagoActual && formaPagoActual.porcentajeRecargo > 0
    ? Math.round((subtotal - descuento) * formaPagoActual.porcentajeRecargo / 100)
    : 0;
  const total = subtotal - descuento + recargo;

  // ===== BUSQUEDA DE PRODUCTOS / COMBOS =====
  const indiceProductos = useMemo(() => construirIndiceProductos(productos), [productos]);
  const indiceCombos = useMemo(() => construirIndiceCombos(combos), [combos]);

  const productosFiltrados = useMemo(
    () => (busqueda ? buscarProductos(productos, indiceProductos, busqueda) : []),
    [productos, indiceProductos, busqueda],
  );

  const combosFiltrados = useMemo(
    () => (busqueda ? buscarCombos(combos, productos, categorias, indiceCombos, busqueda) : []),
    [busqueda, combos, productos, categorias, indiceCombos],
  );

  // ===== MEGA-CATEGORIAS: cada categoría raíz es un botón de filtro =====
  const megaCategorias = useMemo(() => {
    return categorias.filter(c => c.activa && !c.categoriaPadreId).map(rc => {
      const childIds = categorias.filter(c => c.categoriaPadreId === rc.id).map(c => c.id);
      return { key: `cat-${rc.id}`, label: rc.nombre, catIds: [rc.id, ...childIds] };
    });
  }, [categorias]);

  const megaActiva = megaCategorias.find(m => m.key === categoriaFiltro);

  // Sub-categorías de la mega seleccionada
  const lineasDisponibles = useMemo(() => {
    if (!megaActiva) return [];
    const rootId = parseInt(megaActiva.key.replace('cat-', ''));
    return categorias.filter(c => c.activa && c.categoriaPadreId === rootId).map(c => ({ id: c.id, nombre: c.nombre }));
  }, [megaActiva, categorias]);

  const tieneSubfiltros = !!megaActiva || categoriaFiltro === 'combos';

  const [lineaFiltro, setLineaFiltro] = useState<number | null>(null);

  const gramajesDisponibles = useMemo(() => {
    if (categoriaFiltro === 'combos') {
      const prodIdsEnCombos = new Set(combos.filter(c => c.activo).flatMap(c => c.detalles.map(d => d.productoId)));
      let prods = productos.filter(p => prodIdsEnCombos.has(p.id) && p.pesoGramos);
      if (lineaFiltro) prods = prods.filter(p => p.categoriaId === lineaFiltro);
      return prods.map(p => p.pesoGramos!).filter((v, i, a) => v <= 200 && a.indexOf(v) === i).sort((a, b) => a - b);
    }
    if (!megaActiva) return [];
    return productos
      .filter(p => p.activo && (lineaFiltro ? p.categoriaId === lineaFiltro : megaActiva.catIds.includes(p.categoriaId)) && p.pesoGramos && (!marcaFiltro || p.marca === marcaFiltro))
      .map(p => p.pesoGramos!)
      .filter((v, i, a) => v <= 200 && a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [productos, combos, categoriaFiltro, marcaFiltro, megaActiva, lineaFiltro]);

  const marcasDisponibles = useMemo(() => {
    if (!megaActiva) return [];
    return productos
      .filter(p => p.activo && megaActiva.catIds.includes(p.categoriaId) && p.marca)
      .map(p => p.marca!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [productos, megaActiva]);

  const productosCatalogo = useMemo(() => {
    const activos = productos.filter(p => p.activo);
    if (!categoriaFiltro || categoriaFiltro === 'combos') return activos;
    if (categoriaFiltro === 'promo') return activos.filter(p => preciosPromoProductos.has(p.id));
    if (categoriaFiltro === 'ofertas') return activos.filter(p => p.esOfertaSemanal);
    if (categoriaFiltro === 'descuento') return activos.filter(p => preciosLista.has(p.id));
    if (!megaActiva) return activos;
    let filtered = activos.filter(p => megaActiva.catIds.includes(p.categoriaId));
    if (lineaFiltro) {
      filtered = filtered.filter(p => p.categoriaId === lineaFiltro);
    }
    if (tieneSubfiltros && marcaFiltro) {
      filtered = filtered.filter(p => p.marca === marcaFiltro);
    }
    if (tieneSubfiltros && gramajesFiltro) {
      filtered = filtered.filter(p => p.pesoGramos === gramajesFiltro);
    }
    return filtered;
  }, [productos, categoriaFiltro, gramajesFiltro, marcaFiltro, lineaFiltro, megaActiva, preciosLista, preciosPromoProductos]);

  const combosCatalogo = useMemo(() => {
    const activos = combos.filter(c => c.activo);
    if (!categoriaFiltro) return [];
    if (categoriaFiltro === 'combos') {
      if (!lineaFiltro && !gramajesFiltro) return activos;
      let prods = productos;
      if (lineaFiltro) prods = prods.filter(p => p.categoriaId === lineaFiltro);
      if (gramajesFiltro) prods = prods.filter(p => p.pesoGramos === gramajesFiltro);
      const prodIds = new Set(prods.map(p => p.id));
      return activos.filter(c => c.detalles.some(d => prodIds.has(d.productoId)));
    }
    if (categoriaFiltro === 'promo') return activos.filter(c => preciosPromoCombos.has(c.id));
    if (categoriaFiltro === 'ofertas') return activos.filter(c => c.esOfertaSemanal);
    if (categoriaFiltro === 'descuento') return activos.filter(c => preciosListaCombos.has(c.id));
    if (!megaActiva) return [];
    let prodsEnCat = productos.filter(p => megaActiva.catIds.includes(p.categoriaId));
    if (lineaFiltro) {
      prodsEnCat = prodsEnCat.filter(p => p.categoriaId === lineaFiltro);
    }
    if (tieneSubfiltros && marcaFiltro) {
      prodsEnCat = prodsEnCat.filter(p => p.marca === marcaFiltro);
    }
    if (tieneSubfiltros && gramajesFiltro) {
      prodsEnCat = prodsEnCat.filter(p => p.pesoGramos === gramajesFiltro);
    }
    const prodIdsEnCat = new Set(prodsEnCat.map(p => p.id));
    return activos.filter(c => c.detalles.some(d => prodIdsEnCat.has(d.productoId)));
  }, [combos, productos, categoriaFiltro, gramajesFiltro, marcaFiltro, lineaFiltro, megaActiva, preciosPromoCombos]);

  const [indiceBusqueda, setIndiceBusqueda] = useState(-1);

  const resultadosBusqueda = busqueda.trim()
    ? [...productosFiltrados.slice(0, 50).map(p => ({ tipo: 'prod' as const, item: p })), ...combosFiltrados.slice(0, 50).map(c => ({ tipo: 'combo' as const, item: c }))]
    : [];

  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceBusqueda(prev => {
        const next = Math.min(prev + 1, resultadosBusqueda.length - 1);
        document.querySelector(`[data-busqueda-idx="${next}"]`)?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceBusqueda(prev => {
        const next = Math.max(prev - 1, -1);
        if (next >= 0) document.querySelector(`[data-busqueda-idx="${next}"]`)?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Escape') {
      setBusqueda('');
      setIndiceBusqueda(-1);
    } else if (e.key === 'Enter' && busqueda.trim()) {
      if (indiceBusqueda >= 0 && indiceBusqueda < resultadosBusqueda.length) {
        const sel = resultadosBusqueda[indiceBusqueda];
        if (sel.tipo === 'prod') agregarProducto(sel.item as Producto);
        else agregarCombo(sel.item as Combo);
        setBusqueda('');
        setIndiceBusqueda(-1);
        setTimeout(() => busquedaRef.current?.focus(), 0);
        return;
      }
      const exacto = productos.find(p => p.activo && p.codigo?.toLowerCase() === busqueda.trim().toLowerCase());
      if (exacto) { agregarProducto(exacto); setBusqueda(''); setTimeout(() => busquedaRef.current?.focus(), 0); return; }
      if (resultadosBusqueda.length === 1) {
        const sel = resultadosBusqueda[0];
        if (sel.tipo === 'prod') agregarProducto(sel.item as Producto);
        else agregarCombo(sel.item as Combo);
        setBusqueda('');
        setIndiceBusqueda(-1);
        setTimeout(() => busquedaRef.current?.focus(), 0);
      }
    }
  };

  // ===== FILTRAR PEDIDOS PANEL DERECHO =====
  const pedidosFiltrados = pedidos.filter(p => {
    if (busquedaTicket) {
      return p.numeroTicket.toLowerCase().includes(busquedaTicket.toLowerCase());
    }
    return true;
  });

  // ===== CARGAR PEDIDO EN FORMULARIO (EDITAR) =====
  const cargarPedidoEnFormulario = (pedido: Venta) => {
    if (pedido.estado !== EstadoVenta.Pendiente && pedido.estado !== EstadoVenta.Asignado) {
      addToast('Solo se pueden editar pedidos en estado Pendiente o Asignado', 'info');
      return;
    }
    setEditandoPedido(pedido);
    setDireccion(pedido.direccionEntrega || '');
    setTelefono(pedido.telefonoCliente || '');
    setZonaSeleccionada(pedido.zonaId || undefined);
    setFormaPagoSeleccionada(pedido.formaPagoId || undefined);
    setNotaInterna(pedido.notaInterna || '');
    setDescuento(pedido.descuento || 0);
    setYaPago(pedido.estaPago || false);
    if (pedido.fechaProgramada) {
      setEsProgramado(true);
      setFechaProgramada(pedido.fechaProgramada.substring(0, 10));
    } else {
      setEsProgramado(false);
      setFechaProgramada('');
    }
    // Geocodificar direccion para mostrar en mapa
    if (pedido.direccionEntrega) {
      geocodificarDireccion(pedido.direccionEntrega);
    } else {
      limpiarCoordenadas();
    }
    // Convertir lineas del pedido a carrito
    setCarrito(pedido.lineas.map(l => ({
      productoId: l.productoId || undefined,
      comboId: l.comboId || undefined,
      nombre: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      notas: l.notas,
    })));
  };

  // ===== LIMPIAR FORMULARIO =====
  const limpiarFormulario = () => {
    setEditandoPedido(null);
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setSugerenciasCliente([]);
    setDireccion('');
    setTelefono('');
    setCarrito([]);
    setFormaPagoSeleccionada(undefined);
    setNotaInterna('');
    setZonaSeleccionada(undefined);
    setDescuento(0);
    setEsProgramado(false);
    setFechaProgramada('');
    setPopoverCalendarioAbierto(false);
    setBusqueda('');
    setYaPago(false);
    setEsCtaCte(false);
    setMostrarExtras(false);
    limpiarCoordenadas();
    busquedaRef.current?.focus();
  };

  // ===== VALIDACION =====
  const telefonoDigitos = telefono.replace(/[^0-9]/g, '');
  const telefonoValido = telefonoDigitos.length >= 8;
  const formularioValido = esEdicionLimitada
    ? true
    : carrito.length > 0 && direccion.trim() !== '' && telefonoValido && !!zonaSeleccionada && (!yaPago || !!formaPagoSeleccionada);

  // ===== CREAR PEDIDO =====
  const handleCrearPedido = async () => {
    if (!formularioValido) return;
    setCreandoPedido(true);
    try {
    await crearVenta({
      tipo: TipoVenta.Domicilio,
      clienteId: clienteSeleccionado?.id,
      nombreCliente: clienteSeleccionado?.nombre || 'Consumidor Final',
      direccionEntrega: direccion || undefined,
      telefonoCliente: telefono || undefined,
      zonaId: zonaSeleccionada,
      descuento,
      formaPagoId: esCtaCte ? ctaCteFormaPago?.id : (yaPago ? formaPagoSeleccionada : undefined),
      notaInterna: notaInterna || undefined,
      tipoFactura: TipoFactura.FacturaB,
      fechaProgramada: esProgramado && fechaProgramada ? fechaProgramada : undefined,
      estaPago: esCtaCte ? true : yaPago,
      localId: localActivo || undefined,
      lineas: carrito.map(item => ({
        productoId: item.productoId,
        comboId: item.comboId,
        cantidad: item.cantidad,
        precioUnitario: Math.round(item.precioUnitario * (1 - (item.descuentoPorcentaje ?? 0) / 100) * 100) / 100,
        notas: (item.descuentoPorcentaje ?? 0) > 0
          ? `${item.notas ? item.notas + ' | ' : ''}Desc ${item.descuentoPorcentaje}% (precio original $${item.precioUnitario})`
          : item.notas,
      })),
    });
    addToast('Pedido creado correctamente', 'success');
    limpiarFormulario();
    cargarPedidos();
    } catch {
      addToast('Error al crear pedido', 'error');
    } finally {
      setCreandoPedido(false);
    }
  };

  // ===== GUARDAR CAMBIOS (EDITAR) =====
  const handleGuardarCambios = async () => {
    if (!editandoPedido || !formularioValido) return;
    try {
      // Si el pedido ERA programado (tenía fechaProgramada original) y el usuario
      // destilda "Programar" en uno con fecha de creación anterior a hoy,
      // forzar fechaProgramada=hoy para que siga apareciendo en la lista del día.
      // Si el pedido nunca fue programado, no tocar nada (mantener undefined).
      let fechaProgramadaAEnviar: string | undefined;
      if (esProgramado && fechaProgramada) {
        fechaProgramadaAEnviar = fechaProgramada;
      } else if (editandoPedido.fechaProgramada && editandoPedido.fechaCreacion) {
        const creacion = new Date(editandoPedido.fechaCreacion);
        const hoy = new Date();
        creacion.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);
        if (creacion.getTime() < hoy.getTime()) {
          fechaProgramadaAEnviar = hoy.toISOString().substring(0, 10);
        }
      }

      await actualizarVenta(editandoPedido.id, {
        nombreCliente: editandoPedido.nombreCliente || 'Consumidor Final',
        telefonoCliente: telefono || undefined,
        direccionEntrega: direccion || undefined,
        zonaId: zonaSeleccionada || undefined,
        descuento,
        formaPagoId: formaPagoSeleccionada || undefined,
        notaInterna: notaInterna || undefined,
        tipoFactura: editandoPedido.tipoFactura,
        fechaProgramada: fechaProgramadaAEnviar,
        estaPago: yaPago,
        lineas: carrito.map(item => ({
          productoId: item.productoId || undefined,
          comboId: item.comboId || undefined,
          cantidad: item.cantidad,
          precioUnitario: Math.round(item.precioUnitario * (1 - (item.descuentoPorcentaje ?? 0) / 100) * 100) / 100,
          notas: (item.descuentoPorcentaje ?? 0) > 0
            ? `${item.notas ? item.notas + ' | ' : ''}Desc ${item.descuentoPorcentaje}% (precio original $${item.precioUnitario})`
            : (item.notas || undefined),
        })),
      });
      addToast('Pedido actualizado correctamente', 'success');
      limpiarFormulario();
      cargarPedidos();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al guardar cambios';
      addToast(msg, 'error');
    }
  };

  // ===== CAMBIAR ESTADO =====
  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoVenta) => {
    await cambiarEstado(id, nuevoEstado);
    cargarPedidos();
    if (editandoPedido?.id === id) limpiarFormulario();
  };

  const handleCancelar = (pedido: Venta) => {
    setPedidoCancelar(pedido);
    setMotivoCancelacion('');
  };

  const confirmarCancelacion = async () => {
    if (!pedidoCancelar || !motivoCancelacion.trim()) return;
    const id = pedidoCancelar.id;
    const motivo = motivoCancelacion.trim();
    setPedidoCancelar(null);
    setMotivoCancelacion('');
    await cancelarVenta(id, motivo);
    cargarPedidos();
    if (editandoPedido?.id === id) limpiarFormulario();
  };

  const siguienteEstado = (_estado: EstadoVenta): EstadoVenta | null => {
    // Ya no hay transición manual de estado desde PedidosPage
    // Los pedidos pasan a Asignado desde EntregasPage (Empezar Reparto)
    return null;
  };

  // ===== ASIGNAR REPARTIDOR =====
  const handleAsignarRepartidor = async (pedido: Venta, _repartidorId: number) => {
    // Asignar = cambiar estado a Asignado y luego EnCamino, o directamente poner repartidorId via update
    await cambiarEstado(pedido.id, EstadoVenta.Asignado);
    setMostrarAsignarRepartidor(null);
    cargarPedidos();
  };

  const [panelMovil, setPanelMovil] = useState<'formulario' | 'pedidos'>('formulario');

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 h-[calc(100vh-5rem)] lg:h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* Tabs móvil para alternar entre formulario y pedidos */}
      <div className="flex lg:hidden gap-1 flex-shrink-0">
        <button
          onClick={() => setPanelMovil('formulario')}
          className={`flex-1 py-2 rounded-t-lg text-sm font-bold transition-colors ${panelMovil === 'formulario' ? 'bg-white text-amber-700 border-b-2 border-amber-500' : 'bg-gray-200 text-gray-500'}`}
        >
          Nuevo Pedido
        </button>
        <button
          onClick={() => setPanelMovil('pedidos')}
          className={`flex-1 py-2 rounded-t-lg text-sm font-bold transition-colors ${panelMovil === 'pedidos' ? 'bg-white text-amber-700 border-b-2 border-amber-500' : 'bg-gray-200 text-gray-500'}`}
        >
          Pedidos ({pedidos.length})
        </button>
      </div>

      {/* ============ PANEL IZQUIERDO: FORMULARIO ============ */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${panelMovil !== 'formulario' ? 'hidden lg:flex' : ''}`}>
        {/* Zona superior: datos del pedido (izq) + mapa (der) */}
        <div className="flex gap-2 mb-1.5 flex-shrink-0">
          {/* Columna izquierda: Header + Direccion + Telefono + Programar */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {/* Header: Nro Pedido + Estado */}
            <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {editandoPedido
                    ? <span>Pedido <span className="text-amber-400">#{editandoPedido.numeroTicket}</span></span>
                    : 'Nuevo Pedido'
                  }
                </h2>
                {editandoPedido && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColores[editandoPedido.estado]}`}>
                    {estadoLabels[editandoPedido.estado]}
                  </span>
                )}
              </div>
              {esEdicionLimitada && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mt-1">
                  Solo se puede editar: telefono, si esta pago y forma de pago
                </p>
              )}
            </div>

            {/* Buscador de Cliente */}
            {!esEdicionLimitada && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2" ref={clienteInputRef}>
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    value={busquedaCliente}
                    onChange={e => handleBuscarCliente(e.target.value)}
                    onKeyDown={clientesNav.handleKeyDown}
                    placeholder="Buscar cliente por nombre o telefono..."
                    className={`${inputClass} pl-8`}
                  />
                  {clienteSeleccionado && (
                    <button onClick={limpiarCliente} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {sugerenciasCliente.length > 0 && !clienteSeleccionado && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                      {sugerenciasCliente.map((c, idx) => (
                        <button
                          key={c.id}
                          data-cliente-idx={idx}
                          onMouseEnter={() => clientesNav.setActiveIndex(idx)}
                          onClick={() => seleccionarCliente(c)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${clientesNav.activeIndex === idx ? 'bg-amber-100' : 'hover:bg-amber-50'}`}
                        >
                          <div>
                            <span className="font-medium text-gray-800">{c.nombre}</span>
                            {c.telefono && <span className="text-gray-400 ml-2">{c.telefono}</span>}
                          </div>
                          {c.direccion && <span className="text-xs text-gray-400 max-w-[200px] truncate">{c.direccion}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direccion */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  ref={direccionRef}
                  type="text"
                  value={direccion}
                  onChange={e => {
                    setDireccion(e.target.value);
                    buscarDirecciones(e.target.value);
                    setMostrarSugerenciasDireccion(true);
                  }}
                  onFocus={() => { if (sugerenciasDireccion.length > 0) setMostrarSugerenciasDireccion(true); }}
                  onBlur={() => { setTimeout(() => setMostrarSugerenciasDireccion(false), 200); }}
                  onKeyDown={direccionNav.handleKeyDown}
                  placeholder="Domicilio / Direccion de entrega..."
                  disabled={esEdicionLimitada}
                  className={`${inputClass} pl-8 pr-10 lg:pr-2.5${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                />
                {/* Boton mapa en mobile */}
                <button
                  onClick={() => setMostrarMapaGrande(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-700 lg:hidden"
                  title="Abrir mapa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
                {mostrarSugerenciasDireccion && sugerenciasDireccion.length > 0 && direccion.length >= 3 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                    {sugerenciasDireccion.map((s, idx) => (
                      <button
                        key={s.placeId}
                        data-dir-idx={idx}
                        onMouseDown={e => e.preventDefault()}
                        onMouseEnter={() => direccionNav.setActiveIndex(idx)}
                        onClick={() => seleccionarSugerenciaDireccion(s)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-b border-gray-100 last:border-b-0 transition-colors ${direccionNav.activeIndex === idx ? 'bg-amber-100' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                      >
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700 truncate">{s.descripcion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Telefono */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9\-+() ]/g, '');
                    setTelefono(val);
                  }}
                  placeholder="Ej: 1155667788"
                  maxLength={15}
                  className={`${inputClass} pl-8${telefono.trim() !== '' && telefono.replace(/[^0-9]/g, '').length < 8 ? ' border-red-400 focus:ring-red-400' : ''}`}
                />
                {telefono.trim() !== '' && telefono.replace(/[^0-9]/g, '').length < 8 && (
                  <p className="text-xs text-red-500 mt-1 pl-8">Minimo 8 digitos</p>
                )}
              </div>
            </div>

            {/* Programar para otro dia */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className={`flex items-center gap-1.5 select-none ${esEdicionLimitada ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={esProgramado}
                    onChange={e => {
                      setEsProgramado(e.target.checked);
                      if (!e.target.checked) {
                        setFechaProgramada('');
                        setPopoverCalendarioAbierto(false);
                      }
                    }}
                    disabled={esEdicionLimitada}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                  />
                  <span className="text-sm text-gray-700 font-medium">Programar</span>
                </label>
                {esProgramado && (
                  <Popover open={popoverCalendarioAbierto} onOpenChange={setPopoverCalendarioAbierto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`justify-start text-left font-normal gap-2 h-8 text-xs ${!fechaProgramada ? 'text-gray-400' : 'text-gray-800'}`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>
                          {fechaProgramada
                            ? new Date(fechaProgramada + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
                            : 'Elegir fecha...'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaProgramada ? new Date(fechaProgramada + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFechaProgramada(format(date, 'yyyy-MM-dd'));
                            setPopoverCalendarioAbierto(false);
                          }
                        }}
                        disabled={(date) => {
                          const hoy = new Date();
                          hoy.setHours(0, 0, 0, 0);
                          return date <= hoy || date > addDays(hoy, 14);
                        }}
                        locale={es}
                        defaultMonth={fechaProgramada ? new Date(fechaProgramada + 'T00:00:00') : addDays(new Date(), 1)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {esProgramado && fechaProgramada && (
                  <span className="text-xs text-purple-600 font-medium">
                    {new Date(fechaProgramada + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Mapa interactivo (oculto en mobile) */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="relative h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <GoogleMap
                coordenadas={coordenadas || coordenadasLocal || { lat: -34.6037, lng: -58.3816 }}
                className="h-full"
                onClick={(coords, dir) => {
                  setCoordenadas(coords);
                  setDireccion(dir);
                }}
              />
              {/* Botón expandir mapa */}
              <button
                onClick={() => setMostrarMapaGrande(true)}
                className="absolute top-2 left-2 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-800 rounded-md p-1.5 shadow-sm transition-colors"
                title="Ampliar mapa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
              {coordenadas && (
                <button
                  onClick={() => { limpiarCoordenadas(); setDireccion(''); }}
                  className="absolute top-2 right-2 bg-white/90 text-gray-400 hover:text-gray-600 rounded-full p-1 shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {!coordenadas && (
                <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                  <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">Hace click en el mapa para seleccionar ubicacion</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buscador de productos + boton catalogo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={busquedaRef}
                type="text"
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setIndiceBusqueda(-1); }}
                onKeyDown={handleBusquedaKeyDown}
                placeholder="Codigo / Buscar producto..."
                disabled={esEdicionLimitada}
                className={`${inputClass} pl-8 text-base${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                autoFocus
              />
            </div>
            <button
              onClick={() => setMostrarCatalogo(true)}
              disabled={esEdicionLimitada}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-400 ${esEdicionLimitada ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 active:bg-amber-200'}`}
            >
              Ver catalogo
            </button>
          </div>

          {/* Resultados de busqueda rapida */}
          {busqueda && (productosFiltrados.length > 0 || combosFiltrados.length > 0) && (
            <div className="mt-1.5 border border-gray-200 rounded-md max-h-40 overflow-y-auto shadow-sm">
              {productosFiltrados.slice(0, 50).map((p, idx) => (
                <button
                  key={p.id}
                  data-busqueda-idx={idx}
                  onClick={() => agregarProducto(p)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-amber-50 active:bg-amber-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${indiceBusqueda === idx ? 'bg-amber-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {p.codigo && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{p.codigo}</span>}
                    <span className="text-gray-800">{p.nombre}</span>
                  </div>
                  <span className="font-semibold text-amber-600">
                    {preciosPromoProductos.has(p.id) ? (
                      <>
                        <span className="text-xs text-gray-400 line-through mr-1">${formatearNumero(preciosLista.get(p.id) ?? p.precio)}</span>
                        <span className="text-red-600">${formatearNumero(preciosPromoProductos.get(p.id)!.precioPromo)}</span>
                      </>
                    ) : (
                      <>${(preciosLista.get(p.id) ?? p.precio).toLocaleString()}</>
                    )}
                  </span>
                </button>
              ))}
              {combosFiltrados.slice(0, 50).map((c, idx) => {
                const idxGlobal = productosFiltrados.slice(0, 50).length + idx;
                return (
                <button
                  key={`c-${c.id}`}
                  data-busqueda-idx={idxGlobal}
                  onClick={() => { agregarCombo(c); setBusqueda(''); busquedaRef.current?.focus(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-purple-50 active:bg-purple-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${indiceBusqueda === idxGlobal ? 'bg-purple-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">COMBO</span>
                    {c.codigo && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{c.codigo}</span>}
                    <span className="text-gray-800">{c.nombre}</span>
                  </div>
                  <span className="font-semibold text-purple-600">
                    {preciosPromoCombos.has(c.id) ? (
                      <>
                        <span className="text-xs text-gray-400 line-through mr-1">${formatearNumero(c.precio)}</span>
                        <span className="text-red-600">${formatearNumero(preciosPromoCombos.get(c.id)!.precioPromo)}</span>
                      </>
                    ) : preciosListaCombos.has(c.id) && preciosListaCombos.get(c.id) !== c.precio ? (
                      <>
                        <span className="text-xs text-gray-400 line-through mr-1">${formatearNumero(c.precio)}</span>
                        <span className="text-green-600">${formatearNumero(preciosListaCombos.get(c.id)!)}</span>
                      </>
                    ) : (
                      <>${formatearNumero(c.precio)}</>
                    )}
                  </span>
                </button>
                );
              })}
            </div>
          )}

          {/* Lista de precios */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-500 whitespace-nowrap">Lista:</span>
            <select
              value={listaPrecioSeleccionada || ''}
              onChange={e => setListaPrecioSeleccionada(Number(e.target.value) || undefined)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            >
              <option value="">Precio Base</option>
              {listasPrecios.filter(l => l.activa).map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla del carrito (Detalle de productos) */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 flex-1 flex flex-col overflow-hidden min-h-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 hidden lg:table-cell">Cod</th>
                <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-center px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Cant</th>
                <th className="text-center px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14 hidden xl:table-cell">Unidades</th>
                <th className="text-right px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 hidden sm:table-cell">Precio</th>
                <th className="text-center px-1 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 hidden sm:table-cell">Desc%</th>
                <th className="text-right px-2.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">SubTotal</th>
                <th className="w-7 px-1"></th>
              </tr>
            </thead>
          </table>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {carrito.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      <span className="text-sm">Busca un producto para agregarlo</span>
                    </td>
                  </tr>
                ) : (
                  carrito.map((item, i) => {
                    const prod = productos.find(p => p.id === item.productoId);
                    const cmb = item.comboId ? combos.find(c => c.id === item.comboId) : undefined;
                    const cod = prod?.codigo || cmb?.codigo || '-';
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-amber-50/40 transition-colors">
                        <td className="px-2.5 py-1.5 text-xs text-gray-400 font-mono w-20 hidden lg:table-cell">
                          {cod}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <div className="font-medium text-gray-800 text-sm">{item.nombre}</div>
                          {item.notas && <div className="text-xs text-gray-400 italic">{item.notas}</div>}
                        </td>
                        <td className="px-1 py-1 w-14">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={e => actualizarItem(i, 'cantidad', Math.max(1, Number(e.target.value)))}
                            disabled={esEdicionLimitada}
                            className={`carrito-cant-input w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            min={1}
                          />
                        </td>
                        <td className="px-1 py-1 w-14 text-center text-xs text-amber-600 font-semibold hidden xl:table-cell">
                          {prod && prod.unidadMinima > 1 ? item.cantidad * prod.unidadMinima : '-'}
                        </td>
                        <td className="px-1 py-1 w-20 hidden sm:table-cell">
                          <input
                            type="number"
                            value={item.precioUnitario}
                            onChange={e => actualizarItem(i, 'precioUnitario', Number(e.target.value))}
                            disabled={esEdicionLimitada}
                            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            min={0}
                            step={100}
                          />
                        </td>
                        <td className="px-1 py-1 w-16 hidden sm:table-cell">
                          <input
                            type="number"
                            value={item.descuentoPorcentaje ?? 0}
                            onChange={e => {
                              const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              actualizarItem(i, 'descuentoPorcentaje', v);
                            }}
                            disabled={esEdicionLimitada}
                            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            min={0}
                            max={100}
                            step={1}
                            title="Descuento % por artículo"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-semibold text-gray-800 w-24">
                          {(item.descuentoPorcentaje ?? 0) > 0 ? (
                            <div className="flex flex-col items-end leading-tight">
                              <span className="text-xs text-gray-400 line-through">${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                              <span className="text-green-700">${Math.round(subtotalLinea(item)).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span>${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-1 py-1.5 w-7">
                          {!esEdicionLimitada && (
                          <button onClick={() => eliminarItem(i)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer: Zona + Ya pago + Subtotal + Extras + Botones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 mt-1.5 flex-shrink-0 space-y-1.5">
          {/* Fila 1: Zona + Ya esta pago + Total */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={zonaSeleccionada || ''}
              onChange={e => setZonaSeleccionada(Number(e.target.value) || undefined)}
              disabled={esEdicionLimitada}
              className={`${selectClass} w-32 sm:w-48${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            >
              <option value="">Zona...</option>
              {zonas.filter(z => z.activa).map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={yaPago && !esCtaCte}
                onChange={e => {
                  setYaPago(e.target.checked);
                  if (e.target.checked) setEsCtaCte(false);
                  if (!e.target.checked) setFormaPagoSeleccionada(undefined);
                }}
                disabled={esCtaCte}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400 disabled:opacity-50"
              />
              <span className="text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">Pago</span>
            </label>
            {yaPago && !esCtaCte && (
              <select
                value={formaPagoSeleccionada || ''}
                onChange={e => setFormaPagoSeleccionada(Number(e.target.value) || undefined)}
                className={`${selectClass} w-32 sm:w-40`}
              >
                <option value="">Forma pago...</option>
                {formasPago.filter(fp => fp.nombre !== 'Cuenta Corriente').map(fp => (
                  <option key={fp.id} value={fp.id}>{fp.nombre}</option>
                ))}
              </select>
            )}
            {!esEdicionLimitada && permiteCuentaCorriente && (
              <label className="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={esCtaCte}
                  onChange={e => {
                    setEsCtaCte(e.target.checked);
                    if (e.target.checked) {
                      setYaPago(false);
                      setFormaPagoSeleccionada(undefined);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400"
                />
                <span className="text-xs sm:text-sm text-purple-700 font-medium whitespace-nowrap">Cta Cte</span>
              </label>
            )}
            <button
              onClick={() => setMostrarExtras(!mostrarExtras)}
              className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${mostrarExtras ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Nota interna y descuento"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <div className="ml-auto text-right">
              {descuento > 0 && <span className="text-xs text-green-600 mr-2">-${descuento.toLocaleString()}</span>}
              <span className="font-bold text-lg text-amber-600">${total.toLocaleString()}</span>
            </div>
          </div>

          {/* Fila expandible: Nota interna + Descuento */}
          {mostrarExtras && (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 w-36">
                <span className="text-xs text-gray-500 whitespace-nowrap">Desc $</span>
                <input
                  type="number"
                  value={descuento}
                  onChange={e => setDescuento(Number(e.target.value))}
                  disabled={esEdicionLimitada}
                  className={`border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-amber-400${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  min={0}
                  step={100}
                />
              </div>
              <input
                value={notaInterna}
                onChange={e => setNotaInterna(e.target.value)}
                placeholder="Nota interna..."
                disabled={esEdicionLimitada}
                className={`${inputClass} flex-1${esEdicionLimitada ? ' bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={limpiarFormulario}
              className="flex-1 bg-white text-red-600 border-2 border-red-300 py-2 rounded-lg font-bold text-sm hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cancelar
            </button>
            <button
              onClick={editandoPedido ? handleGuardarCambios : handleCrearPedido}
              disabled={!formularioValido}
              className={`flex-[2] py-2 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                formularioValido
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {editandoPedido ? 'Guardar Cambios' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>

      {/* ============ PANEL DERECHO: PEDIDOS DEL DIA ============ */}
      <div className={`w-full lg:w-96 flex flex-col min-h-0 ${panelMovil !== 'pedidos' ? 'hidden lg:flex' : ''}`}>
      <PedidosDelDiaPanel
        pedidos={pedidos}
        pedidosFiltrados={pedidosFiltrados}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        busquedaTicket={busquedaTicket}
        setBusquedaTicket={setBusquedaTicket}
        estadosFiltro={estadosFiltro}
        editandoPedidoId={editandoPedido?.id}
        siguienteEstado={siguienteEstado}
        onCargarPedido={cargarPedidoEnFormulario}
        onCambiarEstado={handleCambiarEstado}
        onAsignarRepartidor={(p) => setMostrarAsignarRepartidor(p)}
        onCancelar={handleCancelar}
      />
      </div>
      {/* ============ OVERLAY PROCESANDO ============ */}
      {creandoPedido && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3">
            <svg className="animate-spin w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-lg font-semibold text-gray-700">Procesando pedido...</span>
            <span className="text-sm text-gray-400">Por favor espere</span>
          </div>
        </div>
      )}

      {/* ============ MODAL MAPA GRANDE ============ */}
      {mostrarMapaGrande && (
        <ModalMapaGrande
          coordenadas={coordenadas}
          coordenadasLocal={coordenadasLocal}
          direccion={direccion}
          setCoordenadas={setCoordenadas}
          setDireccion={setDireccion}
          limpiarCoordenadas={limpiarCoordenadas}
          onCerrar={() => setMostrarMapaGrande(false)}
        />
      )}

      {/* ============ MODAL CATALOGO ============ */}
      {mostrarCatalogo && (
        <ModalCatalogo
          onClose={() => setMostrarCatalogo(false)}
          productos={productos}
          listasPrecios={listasPrecios}
          listaPrecioSeleccionada={listaPrecioSeleccionada}
          setListaPrecioSeleccionada={setListaPrecioSeleccionada}
          categoriaFiltro={categoriaFiltro}
          setCategoriaFiltro={setCategoriaFiltro}
          gramajesFiltro={gramajesFiltro}
          setGramajesFiltro={setGramajesFiltro}
          marcaFiltro={marcaFiltro}
          setMarcaFiltro={setMarcaFiltro}
          lineaFiltro={lineaFiltro}
          setLineaFiltro={setLineaFiltro}
          megaCategorias={megaCategorias}
          lineasDisponibles={lineasDisponibles}
          marcasDisponibles={marcasDisponibles}
          gramajesDisponibles={gramajesDisponibles}
          tieneSubfiltros={tieneSubfiltros}
          productosCatalogo={productosCatalogo}
          combosCatalogo={combosCatalogo}
          preciosLista={preciosLista}
          preciosListaCombos={preciosListaCombos}
          preciosPromoProductos={preciosPromoProductos}
          preciosPromoCombos={preciosPromoCombos}
          categorias={categorias}
          todosLosCombos={combos}
          agregarProducto={agregarProducto}
          agregarCombo={agregarCombo}
        />
      )}

      {/* ============ MODAL CANCELAR PEDIDO ============ */}
      {pedidoCancelar && (
        <ModalCancelarPedido
          pedido={pedidoCancelar}
          motivoCancelacion={motivoCancelacion}
          setMotivoCancelacion={setMotivoCancelacion}
          onConfirmar={confirmarCancelacion}
          onCerrar={() => { setPedidoCancelar(null); setMotivoCancelacion(""); }}
          inputClass={inputClass}
        />
      )}

      {/* Modal Preparar Todos eliminado */}

      {/* ============ MODAL ASIGNAR REPARTIDOR ============ */}
      {mostrarAsignarRepartidor && (
        <ModalAsignarRepartidor
          pedido={mostrarAsignarRepartidor}
          repartidores={repartidores}
          onAsignar={handleAsignarRepartidor}
          onCerrar={() => setMostrarAsignarRepartidor(null)}
        />
      )}
    </div>
  );
}
