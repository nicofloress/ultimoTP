import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Producto, Combo, Categoria, CarritoItem, TipoVenta, FormaPago, TipoFactura, ClienteDto, ListaPrecio, CrearPagoDto, TipoCliente } from '../../types';
import { Zona } from '../../types/logistica';
import { parsearAtajo, filtrarCombosPorAtajo } from '../../utils/atajoCombo';
import { formatGramaje } from '../../utils/formatGramaje';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getCategorias } from '../../api/categorias';
import { crearVenta, enviarADeposito } from '../../api/pedidos';
import { TicketPrintProps } from '../../components/TicketPrint';
import ComprobanteXPrint from '../../components/ComprobanteXPrint';
import { getFormasPagoActivas } from '../../api/formasPago';
import { buscarClientes } from '../../api/clientes';
import { getListasPrecios } from '../../api/listasPrecios';
import { getZonas } from '../../api/zonas';
import { getTiposCliente } from '../../api/tiposCliente';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';
import { registrarCargo } from '../../api/cuentaCorriente';
import { useGlobalToast } from '../../components/Toast';
import PagoDivididoPanel from '../../components/PagoDivididoPanel';
import { getCajaAbierta, abrirCaja } from '../../api/caja';

import NumericInput, { formatearNumero } from '../../components/NumericInput';
import { getPromociones, PromocionDto } from '../../api/promociones';
import { useLocalActivo } from '../../context/LocalContext';

export default function POSPage() {
  const { showToast } = useGlobalToast();
  const { localActivo } = useLocalActivo();
  const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  // Data
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const [cajaAbiertaId, setCajaAbiertaId] = useState<number | null>(null);
  const [promociones, setPromociones] = useState<PromocionDto[]>([]);

  // Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [gramajesFiltro, setGramajesFiltro] = useState<number | null>(null);
  const [marcaFiltro, setMarcaFiltro] = useState<string | null>(null);

  // Cliente
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesSugeridos, setClientesSugeridos] = useState<ClienteDto[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  // Pedido
  const [tipoFactura, setTipoFactura] = useState<TipoFactura>(TipoFactura.FacturaB);
  const [notaInterna, setNotaInterna] = useState('');
  const [listaPrecioSeleccionada, setListaPrecioSeleccionada] = useState<number | undefined>();
  const [preciosLista, setPreciosLista] = useState<Map<number, number>>(new Map());

  // Pago
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<number | undefined>();
  const [modoPago, setModoPago] = useState<'total' | 'dividido' | 'cuentaCorriente'>('total');
  const [pagosDivididos, setPagosDivididos] = useState<CrearPagoDto[]>([]);
  const [montoPagado, setMontoPagado] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [tipoDescuento, setTipoDescuento] = useState<'$' | '%'>('$');

  // Tipo de cliente
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [tipoClienteSeleccionado, setTipoClienteSeleccionado] = useState<number | undefined>(1);

  // Envio a domicilio
  const [envioADomicilio, setEnvioADomicilio] = useState(false);
  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<number | undefined>();
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [mostrarSugerenciasDireccion, setMostrarSugerenciasDireccion] = useState(false);
  const { sugerencias: sugerenciasDireccion, buscarDirecciones, limpiarSugerencias } = useGooglePlaces();

  // Modal abrir caja
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [cajaMontoInicial, setCajaMontoInicial] = useState(0);
  const [cajaObservaciones, setCajaObservaciones] = useState('');

  // Loading
  const [guardando, setGuardando] = useState(false);

  // Estado post-creacion
  const [ticketCreado, setTicketCreado] = useState<string | null>(null);
  const [ventaCreadaId, setVentaCreadaId] = useState<number | null>(null);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<TicketPrintProps['ticket'] | null>(null);

  // Modales post-venta
  const [mostrarModalFacturar, setMostrarModalFacturar] = useState(false);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);
  const [mostrarComprobante, setMostrarComprobante] = useState(false);

  const busquedaRef = useRef<HTMLInputElement>(null);
  const [indiceBusqueda, setIndiceBusqueda] = useState(-1);

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
  const clienteInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductos().then(setProductos);
    getCombos().then(setCombos);
    getCategorias().then(setCategorias);
    getFormasPagoActivas().then(setFormasPago);
    getListasPrecios().then(setListasPrecios);
    getZonas().then(zs => setZonas(zs.filter(z => !localActivo || !z.localId || z.localId === localActivo)));
    getTiposCliente().then(setTiposCliente);
    getCajaAbierta(localActivo || undefined).then(caja => setCajaAbiertaId(caja?.id ?? null));
    getPromociones().then(setPromociones).catch(() => {});
  }, []);

  // Click outside para cerrar sugerencias de cliente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clienteInputRef.current && !clienteInputRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce busqueda de clientes
  useEffect(() => {
    if (busquedaCliente.length < 2) {
      setClientesSugeridos([]);
      return;
    }
    const timeout = setTimeout(() => {
      buscarClientes(busquedaCliente).then(r => setClientesSugeridos(r.filter(c => !localActivo || !c.localId || c.localId === localActivo)));
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaCliente]);

  // Resetear modo pago si el tipo de cliente no permite Cta Cte
  useEffect(() => {
    if (!tipoClienteSeleccionado) return;
    const tipo = tiposCliente.find(tc => tc.id === tipoClienteSeleccionado);
    if (!tipo?.permiteCuentaCorriente) {
      setModoPago(prev => prev === 'cuentaCorriente' ? 'total' : prev);
    }
  }, [tipoClienteSeleccionado, tiposCliente]);

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

  // --- Promociones vigentes ---
  const promosVigentes = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const tipoActual = envioADomicilio ? 2 : 1; // 1=Mostrador, 2=Domicilio
    return promociones.filter(p => {
      if (!p.activa) return false;
      const desde = p.fechaDesde.split('T')[0];
      const hasta = p.fechaHasta.split('T')[0];
      if (desde > hoy || hasta < hoy) return false;
      if (localActivo !== 0 && !p.locales.some(l => l.localId === localActivo)) return false;
      // Filtrar por tipo de venta: vacío = aplica a todos
      if (p.tiposVenta && p.tiposVenta.length > 0 && !p.tiposVenta.includes(tipoActual)) return false;
      return true;
    });
  }, [promociones, localActivo, envioADomicilio]);

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

  // --- Funciones de cliente ---
  const seleccionarCliente = (cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    setNombreCliente(cliente.nombre);
    setTelefonoCliente(cliente.telefono || '');
    if (cliente.tipoClienteId) setTipoClienteSeleccionado(cliente.tipoClienteId);
    if (cliente.listaPrecioId) setListaPrecioSeleccionada(cliente.listaPrecioId);
    setBusquedaCliente(cliente.nombre + (cliente.telefono ? ` - ${cliente.telefono}` : ''));
    setMostrarSugerencias(false);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setNombreCliente('');
    setTelefonoCliente('');
    setTipoClienteSeleccionado(1);
    setListaPrecioSeleccionada(undefined);
    setModoPago(prev => prev === 'cuentaCorriente' ? 'total' : prev);
  };

  // --- Funciones de carrito ---
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

  const actualizarItem = (index: number, field: keyof CarritoItem, value: number | string) => {
    setCarrito(carrito.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const eliminarItem = (index: number) => setCarrito(carrito.filter((_, i) => i !== index));

  // --- Calculos ---
  const subtotal = carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);

  const descuentoCalculado = tipoDescuento === '%'
    ? Math.round(subtotal * descuento / 100)
    : descuento;

  const formaPagoActual = formasPago.find(fp => fp.id === formaPagoSeleccionada);
  const recargosDivididos = modoPago === 'dividido'
    ? pagosDivididos.reduce((sum, p) => {
        const fp = formasPago.find(f => f.id === p.formaPagoId);
        return sum + (fp ? p.monto * fp.porcentajeRecargo / 100 : 0);
      }, 0)
    : 0;
  const recargo = modoPago === 'total'
    ? (formaPagoActual && formaPagoActual.porcentajeRecargo > 0
      ? Math.round((subtotal - descuentoCalculado) * formaPagoActual.porcentajeRecargo / 100)
      : 0)
    : Math.round(recargosDivididos);
  const total = subtotal - descuentoCalculado + recargo;
  const deuda = modoPago === 'total'
    ? total - montoPagado
    : total - pagosDivididos.reduce((sum, p) => sum + p.monto + (formasPago.find(f => f.id === p.formaPagoId)?.porcentajeRecargo ?? 0) * p.monto / 100, 0);

  // --- Busqueda de productos ---
  const productosFiltrados = productos.filter(p => {
    if (!p.activo) return false;
    if (busqueda) {
      const term = busqueda.toLowerCase();
      return (p.numeroInterno?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term);
    }
    return false;
  });

  const combosFiltrados = useMemo(() => {
    if (!busqueda) return [];
    // Intentar parsear como atajo de combo
    const atajo = parsearAtajo(busqueda);
    if (atajo) {
      return filtrarCombosPorAtajo(combos, atajo, productos, categorias);
    }
    // Búsqueda normal por nombre
    return combos.filter(c => c.activo && c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  }, [busqueda, combos, productos, categorias]);

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
      return prods.map(p => p.pesoGramos!).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    }
    if (!megaActiva) return [];
    return productos
      .filter(p => p.activo && (lineaFiltro ? p.categoriaId === lineaFiltro : megaActiva.catIds.includes(p.categoriaId)) && p.pesoGramos && (!marcaFiltro || p.marca === marcaFiltro))
      .map(p => p.pesoGramos!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [productos, combos, categoriaFiltro, marcaFiltro, megaActiva, lineaFiltro]);

  const marcasDisponibles = useMemo(() => {
    if (!tieneSubfiltros || !megaActiva) return [];
    return productos
      .filter(p => p.activo && megaActiva.catIds.includes(p.categoriaId) && p.marca)
      .map(p => p.marca!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [productos, tieneSubfiltros, megaActiva]);

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
  }, [productos, categoriaFiltro, gramajesFiltro, marcaFiltro, lineaFiltro, megaActiva, tieneSubfiltros, preciosLista, preciosPromoProductos]);

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
  }, [combos, productos, categoriaFiltro, gramajesFiltro, marcaFiltro, lineaFiltro, megaActiva, tieneSubfiltros, preciosPromoCombos]);

  // Navegación con teclado en resultados de búsqueda
  const resultadosBusqueda = busqueda.trim()
    ? [...productosFiltrados.slice(0, 6).map(p => ({ tipo: 'prod' as const, item: p })), ...combosFiltrados.slice(0, 6).map(c => ({ tipo: 'combo' as const, item: c }))]
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
      // Si hay item seleccionado con flechas, usar ese
      if (indiceBusqueda >= 0 && indiceBusqueda < resultadosBusqueda.length) {
        const sel = resultadosBusqueda[indiceBusqueda];
        if (sel.tipo === 'prod') agregarProducto(sel.item as Producto);
        else agregarCombo(sel.item as Combo);
        setBusqueda('');
        setIndiceBusqueda(-1);
        setTimeout(() => busquedaRef.current?.focus(), 0);
        return;
      }
      // Código exacto de barras
      const exacto = productos.find(p => p.activo && p.numeroInterno?.toLowerCase() === busqueda.trim().toLowerCase());
      if (exacto) { agregarProducto(exacto); setBusqueda(''); setTimeout(() => busquedaRef.current?.focus(), 0); return; }
      // Si hay un solo resultado (producto o combo), agregarlo
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

  const handlePagoTotal = () => {
    setMontoPagado(total);
  };

  // --- Crear pedido ---
  const handleCrearPedido = async () => {
    if (carrito.length === 0 || guardando) return;
    if (total <= 0) {
      showToast('El total de la venta debe ser mayor a 0', 'error');
      return;
    }
    if (!cajaAbiertaId) {
      showToast('Debe abrir la caja antes de registrar una venta', 'error');
      return;
    }
    if (modoPago === 'total' && !formaPagoSeleccionada) {
      showToast('Debe seleccionar una forma de pago', 'error');
      return;
    }
    if (modoPago === 'total' && montoPagado <= 0) {
      showToast('Debe ingresar el monto pagado', 'error');
      return;
    }
    const pagosValidos = pagosDivididos.filter(p => p.formaPagoId > 0 && p.monto > 0);
    if (modoPago === 'dividido' && pagosValidos.length === 0) {
      showToast('Debe agregar al menos un pago con forma de pago y monto', 'error');
      return;
    }
    if (modoPago === 'dividido' && deuda > 0) {
      showToast(`Faltan $${formatearNumero(deuda, 2)} por cubrir en pago dividido`, 'error');
      return;
    }
    if (modoPago === 'cuentaCorriente' && !clienteSeleccionado) {
      showToast('Debe seleccionar un cliente para venta a cuenta corriente', 'error');
      return;
    }
    // Validar fecha programada si es envío a domicilio
    if (envioADomicilio && fechaProgramada) {
      const fechaProg = new Date(fechaProgramada + 'T00:00:00');
      const hoyDate = new Date(hoy + 'T00:00:00');
      const maxDate = new Date(hoyDate);
      maxDate.setDate(maxDate.getDate() + 14);
      if (fechaProg < hoyDate || fechaProg > maxDate) {
        showToast('La fecha programada debe ser desde hoy y no mayor a 14 días', 'error');
        return;
      }
    }
    if (envioADomicilio && !direccionEnvio.trim()) {
      showToast('Debe ingresar una dirección de entrega', 'error');
      return;
    }
    if (envioADomicilio && !zonaSeleccionada) {
      showToast('Debe seleccionar una zona para el envío', 'error');
      return;
    }

    setGuardando(true);
    try {
      const detallesCarrito = carrito.map(item => ({
        productoId: item.productoId,
        comboId: item.comboId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        notas: item.notas,
      }));
      const esCtaCte = modoPago === 'cuentaCorriente';
      const ctaCteFormaPago = formasPago.find(fp => fp.nombre === 'Cuenta Corriente');

      // Crear Venta unificada (Mostrador o Domicilio)
      const venta = await crearVenta({
        tipo: envioADomicilio ? TipoVenta.Domicilio : TipoVenta.Mostrador,
        nombreCliente: nombreCliente || clienteSeleccionado?.nombre || 'Consumidor Final',
        telefonoCliente: telefonoCliente || undefined,
        direccionEntrega: envioADomicilio ? (direccionEnvio || undefined) : undefined,
        zonaId: envioADomicilio ? (zonaSeleccionada || undefined) : undefined,
        fechaProgramada: envioADomicilio && fechaProgramada ? fechaProgramada : undefined,
        localId: localActivo || undefined,
        formaPagoId: esCtaCte ? ctaCteFormaPago?.id : (modoPago === 'total' ? formaPagoSeleccionada : undefined),
        descuento: descuentoCalculado,
        notaInterna: notaInterna || undefined,
        tipoFactura,
        estaPago: true,
        clienteId: clienteSeleccionado?.id,
        pagos: modoPago === 'dividido' ? pagosDivididos.filter(p => p.formaPagoId > 0 && p.monto > 0).map(p => ({ formaPagoId: p.formaPagoId, monto: p.monto })) : undefined,
        lineas: detallesCarrito,
      });
      // Si es cuenta corriente, registrar cargo
      if (esCtaCte && clienteSeleccionado) {
        try {
          await registrarCargo({
            clienteId: clienteSeleccionado.id,
            monto: venta.total,
            ventaId: venta.id,
            observaciones: `Venta a crédito - ${venta.numeroTicket}`,
          });
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error desconocido';
          showToast(`Venta creada pero error al cargar a cuenta corriente: ${msg}`, 'error');
          console.error('Error registrar cargo cta cte:', err);
        }
      }

      setTicketCreado(venta.numeroTicket);
      setVentaCreadaId(venta.id);

      // Pre-armar ticket listo para imprimir
      const fpNombre = venta.formaPagoNombre
        || (venta.pagos && venta.pagos.length > 0 ? venta.pagos.map((p: { formaPagoNombre: string }) => p.formaPagoNombre).join(' / ') : undefined)
        || formasPago.find(f => f.id === formaPagoSeleccionada)?.nombre
        || 'Efectivo';
      const ticketListo = {
        numeroTicket: venta.numeroTicket || '',
        fecha: venta.fechaCreacion || new Date().toISOString(),
        tipo: venta.tipo ?? 1,
        nombreCliente: venta.nombreCliente || nombreCliente || undefined,
        direccionEntrega: undefined as string | undefined,
        zonaNombre: undefined as string | undefined,
        lineas: (venta.lineas && venta.lineas.length > 0)
          ? venta.lineas.map((d: { descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }) => ({
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal,
            }))
          : detallesCarrito.map(d => {
              const prod = productos.find(p => p.id === d.productoId);
              const combo = combos.find(c => c.id === d.comboId);
              return {
                descripcion: prod?.nombre || combo?.nombre || 'Item',
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                subtotal: d.cantidad * d.precioUnitario,
              };
            }),
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        recargo: venta.recargo,
        total: venta.total,
        formaPagoNombre: fpNombre,
        notaInterna: venta.notaInterna || undefined,
        tipoFactura: 0,
        pagos: venta.pagos?.map((p: { formaPagoNombre: string; monto: number; recargo: number; totalACobrar: number }) => ({
          formaPagoNombre: p.formaPagoNombre,
          monto: p.monto,
          recargo: p.recargo,
          totalACobrar: p.totalACobrar,
        })),
      };
      setTicketParaImprimir(ticketListo);

      showToast(esCtaCte ? 'Venta a crédito registrada' : envioADomicilio ? 'Venta registrada + pedido de envío creado' : 'Venta registrada correctamente', 'success');
      // Mostrar modal de facturación (ticket ya listo en memoria)
      setMostrarModalFacturar(true);
      // Reset
      setCarrito([]);
      setNombreCliente('');
      setTelefonoCliente('');
      setDescuento(0);
      setTipoDescuento('$');
      setFormaPagoSeleccionada(undefined);
      setNotaInterna('');
      setTipoFactura(TipoFactura.FacturaB);
      setClienteSeleccionado(null);
      setBusquedaCliente('');
      setModoPago('total');
      setPagosDivididos([]);
      setListaPrecioSeleccionada(undefined);
      setMontoPagado(0);
      setEnvioADomicilio(false);
      setDireccionEnvio('');
      setZonaSeleccionada(undefined);
      setFechaProgramada('');
      setTipoClienteSeleccionado(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al registrar la venta';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setCarrito([]);
    setNombreCliente('');
    setTelefonoCliente('');
    setDescuento(0);
    setTipoDescuento('$');
    setFormaPagoSeleccionada(undefined);
    setNotaInterna('');
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setModoPago('total');
    setPagosDivididos([]);
    setMontoPagado(0);
    setTicketCreado(null);
    setEnvioADomicilio(false);
    setDireccionEnvio('');
    setZonaSeleccionada(undefined);
    setFechaProgramada('');
    setTipoClienteSeleccionado(1);
    busquedaRef.current?.focus();
  };

  const handleImprimir = () => {
    if (ticketParaImprimir) {
      setMostrarComprobante(true);
    }
  };

  const tipoClienteActual = tiposCliente.find(tc => tc.id === tipoClienteSeleccionado);
  const permiteCuentaCorriente = !!tipoClienteActual?.permiteCuentaCorriente;

  // Shared input class for consistent sizing
  const inputClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors';
  const selectClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
  const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1';

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* ============ PANEL IZQUIERDO ============ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-1.5">
          <h2 className="text-lg font-bold text-white">Punto de Venta</h2>
        </div>
        {/* Header: Cliente + Tipo + Factura */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 mb-1.5 space-y-2">
          {/* Fila 1: Buscador de cliente */}
          <div className="relative" ref={clienteInputRef}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={clienteSeleccionado ? `${clienteSeleccionado.nombre}${clienteSeleccionado.telefono ? ` - ${clienteSeleccionado.telefono}` : ''}` : busquedaCliente}
                onChange={e => {
                  if (clienteSeleccionado) setClienteSeleccionado(null);
                  setBusquedaCliente(e.target.value);
                  setNombreCliente(e.target.value);
                  setMostrarSugerencias(true);
                }}
                onFocus={() => clientesSugeridos.length > 0 && setMostrarSugerencias(true)}
                placeholder="Buscar cliente por nombre o telefono..."
                className={`w-full border-2 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors ${clienteSeleccionado ? 'bg-amber-50 border-amber-400 font-medium' : 'border-gray-300'}`}
              />
              {clienteSeleccionado && (
                <button onClick={limpiarCliente} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {mostrarSugerencias && clientesSugeridos.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                {clientesSugeridos.map(c => (
                  <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full text-left px-3 py-2.5 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors">
                    <div className="font-medium text-gray-800">{c.nombre}</div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      {c.telefono && <span>{c.telefono}</span>}
                      {c.direccion && <span className="truncate">{c.direccion}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fila 2: Tipo Cliente + Factura */}
          <div className="flex items-center gap-2">
            <select
              value={tipoClienteSeleccionado || ''}
              onChange={e => setTipoClienteSeleccionado(Number(e.target.value) || undefined)}
              className={`${selectClass} flex-1 font-medium`}
            >
              <option value="">Tipo Cliente...</option>
              {tiposCliente.filter(tc => tc.activo).map(tc => (
                <option key={tc.id} value={tc.id}>{tc.nombre}</option>
              ))}
            </select>
            <select
              value={tipoFactura}
              onChange={e => setTipoFactura(Number(e.target.value))}
              className={`${selectClass} flex-1 font-medium`}
            >
              <option value={TipoFactura.FacturaA}>Factura A</option>
              <option value={TipoFactura.FacturaB}>Factura B</option>
              <option value={TipoFactura.FacturaC}>Factura C</option>
            </select>
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
                placeholder="Codigo de barras / Buscar producto..."
                className={`${inputClass} pl-8 text-base`}
                autoFocus
              />
            </div>
            <button
              onClick={() => setMostrarCatalogo(true)}
              className="bg-amber-50 text-amber-700 border border-amber-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-amber-100 active:bg-amber-200 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Ver catalogo
            </button>
          </div>

          {/* Resultados de busqueda rapida */}
          {busqueda && (productosFiltrados.length > 0 || combosFiltrados.length > 0) && (
            <div className="mt-1.5 border border-gray-200 rounded-md max-h-72 overflow-y-auto shadow-sm">
              {productosFiltrados.slice(0, 6).map((p, idx) => (
                <button
                  key={`p-${p.id}`}
                  data-busqueda-idx={idx}
                  onClick={() => agregarProducto(p)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-amber-50 active:bg-amber-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${indiceBusqueda === idx ? 'bg-amber-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {p.numeroInterno && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{p.numeroInterno}</span>}
                    <span className="text-gray-800">{p.nombre}</span>
                  </div>
                  <span className="font-semibold text-amber-600">
                    {preciosPromoProductos.has(p.id) ? (
                      <>
                        <span className="text-xs text-gray-400 line-through mr-1">${formatearNumero(preciosLista.get(p.id) ?? p.precio)}</span>
                        <span className="text-red-600">${formatearNumero(preciosPromoProductos.get(p.id)!.precioPromo)}</span>
                      </>
                    ) : (
                      <>${formatearNumero(preciosLista.get(p.id) ?? p.precio)}</>
                    )}
                  </span>
                </button>
              ))}
              {combosFiltrados.slice(0, 6).map((c, idx) => {
                const idxGlobal = productosFiltrados.slice(0, 6).length + idx;
                return (
                <button
                  key={`c-${c.id}`}
                  data-busqueda-idx={idxGlobal}
                  onClick={() => { agregarCombo(c); setBusqueda(''); busquedaRef.current?.focus(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-purple-50 active:bg-purple-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${indiceBusqueda === idxGlobal ? 'bg-purple-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">COMBO</span>
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

        {/* Tabla del carrito */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden min-h-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Cod</th>
                <th className="text-left px-2.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-center px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Cant</th>
                <th className="text-center px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Unidades</th>
                <th className="text-right px-1.5 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Precio</th>
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
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      <span className="text-sm">Busca un producto para agregarlo</span>
                    </td>
                  </tr>
                ) : (
                  carrito.map((item, i) => {
                    const prod = productos.find(p => p.id === item.productoId);
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-amber-50/40 transition-colors">
                        <td className="px-2.5 py-1.5 text-xs text-gray-400 font-mono w-20">
                          {prod?.numeroInterno || '-'}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <div className="font-medium text-gray-800 text-sm">{item.nombre}</div>
                          {item.notas && <div className="text-xs text-gray-400 italic">{item.notas}</div>}
                        </td>
                        <td className="px-1 py-1 w-14">
                          <NumericInput
                            value={item.cantidad}
                            onChange={v => actualizarItem(i, 'cantidad', Math.max(1, v))}
                            className="carrito-cant-input w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            min={1}
                          />
                        </td>
                        <td className="px-1 py-1 w-14 text-center text-xs text-amber-600 font-semibold">
                          {prod && prod.unidadMinima > 1 ? item.cantidad * prod.unidadMinima : '-'}
                        </td>
                        <td className="px-1 py-1 w-20">
                          <NumericInput
                            value={item.precioUnitario}
                            onChange={v => actualizarItem(i, 'precioUnitario', v)}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            min={0}
                            decimales
                          />
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-semibold text-gray-800 w-24">
                          ${formatearNumero(item.precioUnitario * item.cantidad)}
                        </td>
                        <td className="px-1 py-1.5 w-7">
                          <button onClick={() => eliminarItem(i)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota interna + Footer info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1.5 mt-1.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={notaInterna}
              onChange={e => setNotaInterna(e.target.value)}
              placeholder="Nota interna..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{carrito.length} items</span>
            {ticketCreado && (
              <>
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{ticketCreado}</span>
                <button onClick={handleImprimir} className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors text-xs whitespace-nowrap">
                  imprimir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ PANEL DERECHO: CAJA ============ */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white rounded-lg shadow-2xl border-2 border-slate-300 flex flex-col min-h-0 lg:max-h-full">
        {/* Caja info */}
        <div className={`px-3 py-2 rounded-t-lg flex items-center justify-between ${cajaAbiertaId ? 'bg-slate-800 text-white shadow-lg border-b-2 border-amber-500' : 'bg-red-50 border-b border-red-200'}`}>
          <div>
            <div className={`text-[10px] uppercase tracking-wider ${cajaAbiertaId ? 'text-slate-400' : 'text-red-400'}`}>Caja</div>
            <div className={`font-bold text-sm ${cajaAbiertaId ? 'text-white' : 'text-red-600'}`}>
              {cajaAbiertaId ? `Caja #${cajaAbiertaId}` : 'Caja Cerrada'}
            </div>
          </div>
          {!cajaAbiertaId && (
            <button
              onClick={() => setMostrarAbrirCaja(true)}
              className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 transition-colors"
            >
              Abrir Caja
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {/* Tipo de Pago toggle */}
          <div>
            <label className={labelClass}>Tipo de Pago</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setModoPago('total')}
                className={`flex-1 py-1.5 text-sm font-medium transition-all ${modoPago === 'total' ? 'bg-amber-500 text-white shadow-inner' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                Total
              </button>
              <button
                onClick={() => setModoPago('dividido')}
                className={`flex-1 py-1.5 text-sm font-medium transition-all border-l border-gray-300 ${modoPago === 'dividido' ? 'bg-amber-500 text-white shadow-inner' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                Dividido
              </button>
              {permiteCuentaCorriente && (
                <button
                  onClick={() => setModoPago('cuentaCorriente')}
                  className={`flex-1 py-1.5 text-sm font-medium transition-all border-l border-gray-300 ${modoPago === 'cuentaCorriente' ? 'bg-purple-600 text-white shadow-inner' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Cta Cte
                </button>
              )}
            </div>
          </div>

          {/* Modo total: forma de pago + monto */}
          {modoPago === 'total' ? (
            <>
              <div>
                <label className={labelClass}>Metodo</label>
                <select
                  value={formaPagoSeleccionada || ''}
                  onChange={e => setFormaPagoSeleccionada(Number(e.target.value) || undefined)}
                  className={selectClass}
                >
                  <option value="">Seleccionar...</option>
                  {formasPago.filter(fp => fp.nombre !== 'Cuenta Corriente').map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.nombre}{fp.porcentajeRecargo > 0 ? ` (+${fp.porcentajeRecargo}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Monto Pagado</label>
                <div className="flex gap-1.5">
                  <NumericInput
                    value={montoPagado}
                    onChange={v => setMontoPagado(v)}
                    className={`${inputClass} flex-1`}
                    min={0}
                    decimales
                  />
                  <button
                    onClick={handlePagoTotal}
                    className="bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-amber-200 active:bg-amber-300 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    Total
                  </button>
                </div>
              </div>
            </>
          ) : modoPago === 'dividido' ? (
            <PagoDivididoPanel
              formasPago={formasPago.filter(fp => fp.nombre !== 'Cuenta Corriente')}
              totalVenta={subtotal - descuentoCalculado}
              pagos={pagosDivididos}
              onChange={setPagosDivididos}
            />
          ) : (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-semibold text-purple-800">Cuenta Corriente</span>
              </div>
              <p className="text-xs text-purple-600">
                Se cargará ${formatearNumero(total)} a la cuenta de {clienteSeleccionado?.nombre || nombreCliente || 'cliente'}
              </p>
            </div>
          )}

          {/* Descuento */}
          <div>
            <label className={labelClass}>Descuento</label>
            <div className="flex gap-1.5">
              <select
                value={tipoDescuento}
                onChange={e => setTipoDescuento(e.target.value as '$' | '%')}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-14 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white font-medium"
              >
                <option value="$">$</option>
                <option value="%">%</option>
              </select>
              <NumericInput
                value={descuento}
                onChange={v => setDescuento(v)}
                className={`${inputClass} flex-1`}
                min={0}
                decimales
              />
            </div>
          </div>

        </div>

        {/* Resumen de totales */}
        <div className="border-t-4 border-amber-400 bg-gradient-to-t from-gray-100 to-gray-50 shadow-[0_-2px_6px_rgba(0,0,0,0.06)] px-3 py-1.5 space-y-0 flex-shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">${formatearNumero(subtotal, 2)}</span>
          </div>
          {descuentoCalculado > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Descuento</span>
              <span className="font-medium text-green-600">-${formatearNumero(descuentoCalculado, 2)}</span>
            </div>
          )}
          {recargo > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Recargo {modoPago === 'total' && formaPagoActual && formaPagoActual.porcentajeRecargo > 0 ? `(${formaPagoActual.porcentajeRecargo}%)` : ''}
              </span>
              <span className="font-medium text-orange-600">+${formatearNumero(recargo, 2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400">
            <span>IVA</span>
            <span>(incluido)</span>
          </div>
          <div className={`flex justify-between items-baseline pt-1.5 mt-1 border-t border-gray-300 ${carrito.length > 0 ? 'text-lg' : 'text-base'}`}>
            <span className="font-bold text-gray-800">Total</span>
            <span className={`font-bold ${carrito.length > 0 ? 'text-amber-600 text-xl' : 'text-gray-600'}`}>
              ${formatearNumero(total, 2)}
            </span>
          </div>
          {/* Toggle envio a domicilio */}
          <div className="mt-1.5 pt-1.5 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={envioADomicilio}
                onChange={e => {
                  setEnvioADomicilio(e.target.checked);
                  if (!e.target.checked) {
                    setDireccionEnvio('');
                    setZonaSeleccionada(undefined);
                    setFechaProgramada('');
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
              />
              <span className="text-sm font-medium text-gray-700">Enviar a domicilio</span>
            </label>
            {envioADomicilio && (
              <div className="mt-2 space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={direccionEnvio}
                    onChange={e => {
                      setDireccionEnvio(e.target.value);
                      buscarDirecciones(e.target.value);
                      setMostrarSugerenciasDireccion(true);
                    }}
                    onFocus={() => { if (sugerenciasDireccion.length > 0) setMostrarSugerenciasDireccion(true); }}
                    onBlur={() => { setTimeout(() => setMostrarSugerenciasDireccion(false), 200); }}
                    placeholder="Direccion de entrega..."
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                  {mostrarSugerenciasDireccion && sugerenciasDireccion.length > 0 && direccionEnvio.length >= 3 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                      {sugerenciasDireccion.map(s => (
                        <button
                          key={s.placeId}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setDireccionEnvio(s.descripcion);
                            setMostrarSugerenciasDireccion(false);
                            limpiarSugerencias();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50 active:bg-amber-100 text-sm text-left border-b border-gray-100 last:border-b-0 transition-colors"
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
                <div className="flex gap-1.5">
                  <select
                    value={zonaSeleccionada || ''}
                    onChange={e => setZonaSeleccionada(Number(e.target.value) || undefined)}
                    className="flex-1 border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    <option value="">Zona...</option>
                    {zonas.filter(z => z.activa).map(z => (
                      <option key={z.id} value={z.id}>{z.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={fechaProgramada}
                    onChange={e => setFechaProgramada(e.target.value)}
                    min={hoy}
                    max={(() => { const d = new Date(); d.setDate(d.getDate() + 14); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>
              </div>
            )}
          </div>
          <div className={`text-xs font-medium mt-1 ${envioADomicilio ? 'text-blue-600' : 'text-amber-600'}`}>
            {envioADomicilio ? 'Envio a domicilio' : 'Retiro en el local'}
          </div>
        </div>

        {/* Botones + Deuda */}
        <div className="border-t border-gray-200 px-3 py-2 flex-shrink-0">
          {/* Deuda */}
          <div className={`flex justify-between items-center text-sm font-semibold mb-2 px-2 py-1 rounded-md ${
            deuda > 0 ? 'bg-red-50 border border-red-200' : deuda === 0 && carrito.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-gray-600">Deuda</span>
            <span className={deuda > 0 ? 'text-red-600' : deuda === 0 && carrito.length > 0 ? 'text-green-600' : 'text-gray-500'}>
              {deuda <= 0 && carrito.length > 0 ? 'Listo' : `$${formatearNumero(Math.max(0, deuda), 2)}`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancelar}
              className="flex-1 bg-white text-red-600 border-2 border-red-300 py-2 rounded-lg font-bold text-sm hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrearPedido}
              disabled={carrito.length === 0 || guardando}
              className={`flex-[1.5] py-2 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                guardando
                  ? 'bg-slate-500 text-white cursor-wait'
                  : carrito.length > 0
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* ============ OVERLAY PROCESANDO ============ */}
      {guardando && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3">
            <svg className="animate-spin w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-lg font-semibold text-gray-700">Procesando venta...</span>
            <span className="text-sm text-gray-400">Por favor espere</span>
          </div>
        </div>
      )}

      {/* ============ MODAL CATALOGO ============ */}
      {mostrarCatalogo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 lg:p-6" onClick={() => setMostrarCatalogo(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Catalogo de Productos</h2>
              <div className="flex items-center gap-2 mx-auto bg-amber-50 border-2 border-amber-400 rounded-lg px-4 py-1.5">
                <span className="text-sm font-semibold text-amber-700 whitespace-nowrap">Lista de Precios:</span>
                <select
                  value={listaPrecioSeleccionada || ''}
                  onChange={e => setListaPrecioSeleccionada(Number(e.target.value) || undefined)}
                  className="border-2 border-amber-300 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-amber-800 min-w-[180px]"
                >
                  <option value="">Precio Base</option>
                  {listasPrecios.filter(l => l.activa).map(l => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setMostrarCatalogo(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Filtro por mega-categoria */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex gap-1.5 flex-wrap">
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
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 content-start">
              {/* Productos sueltos */}
              {categoriaFiltro !== 'combos' && productosCatalogo.map(p => (
                <button key={`prod-${p.id}`} onClick={() => { agregarProducto(p); setMostrarCatalogo(false); }} className={`relative border-2 rounded-lg p-2.5 text-left transition-all hover:shadow-md active:scale-[0.98] group ${
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
              {/* Combos (todos si chip Combos, o relacionados si mega-categoria) */}
              {(categoriaFiltro === 'combos' ? combos.filter(c => c.activo) : combosCatalogo).map(c => (
                <button key={`combo-${c.id}`} onClick={() => { agregarCombo(c); setMostrarCatalogo(false); }} className={`relative border-2 rounded-lg p-2.5 text-left hover:shadow-md active:scale-[0.98] transition-all group ${
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
      )}

      {/* Modal de impresion */}
      {mostrarComprobante && ticketParaImprimir && (
        <ComprobanteXPrint ticket={ticketParaImprimir} onClose={() => setMostrarComprobante(false)} />
      )}

      {/* ============ MODAL FACTURAR ============ */}
      {mostrarModalFacturar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 rounded-t-xl text-center">
              <h3 className="text-2xl font-bold text-gray-800 tracking-wide">FACTURAR</h3>
              <p className="text-blue-600 font-semibold mt-2 text-lg">DESEA EMITIR LA FACTURA DE AFIP?</p>
            </div>
            <div className="flex justify-center gap-4 p-6">
              <button
                onClick={() => {
                  setMostrarModalFacturar(false);
                  // TODO: Integración AFIP futura
                  showToast('Facturación AFIP: próximamente', 'success');
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Sí, facturar
              </button>
              <button
                onClick={() => {
                  setMostrarModalFacturar(false);
                  setMostrarModalAcciones(true);
                }}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors shadow-md border border-gray-300"
              >
                No facturar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL ACCIONES POST-VENTA ============ */}
      {mostrarModalAcciones && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 rounded-t-xl text-center border-b">
              <h3 className="text-xl font-bold text-gray-800 tracking-wide">ELIJA UNA ACCION</h3>
            </div>
            <div className="grid grid-cols-5 gap-4 p-8">
              {/* Imprimir A4 */}
              <button
                onClick={() => {
                  setMostrarModalAcciones(false);
                  setMostrarComprobante(true);
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-gray-700">IMPRIMIR</span>
                <span className="font-bold text-sm text-gray-700 -mt-2">A4</span>
                <span className="text-red-500 font-bold text-xs">(1)</span>
              </button>

              {/* Imprimir Ticket */}
              <button
                onClick={() => {
                  setMostrarModalAcciones(false);
                  setMostrarComprobante(true);
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-gray-700">IMPRIMIR</span>
                <span className="font-bold text-sm text-gray-700 -mt-2">TICKET</span>
                <span className="text-red-500 font-bold text-xs">(2)</span>
              </button>

              {/* Enviar Email */}
              <button
                onClick={() => {
                  setMostrarModalAcciones(false);
                  // TODO: Enviar por email
                  showToast('Envío por email: próximamente', 'success');
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <span className="font-bold text-sm text-gray-700">ENVIAR</span>
                <span className="font-bold text-sm text-gray-700 -mt-2">&nbsp;</span>
                <span className="text-red-500 font-bold text-xs">(3)</span>
              </button>

              {/* Enviar WhatsApp */}
              <button
                onClick={() => {
                  setMostrarModalAcciones(false);
                  // TODO: Enviar por WhatsApp
                  showToast('Envío por WhatsApp: próximamente', 'success');
                }}
                className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="font-bold text-sm text-gray-700">ENVIAR</span>
                <span className="font-bold text-sm text-gray-700 -mt-2">&nbsp;</span>
                <span className="text-red-500 font-bold text-xs">(4)</span>
              </button>

              {/* Enviar a Depósito */}
              {ventaCreadaId && (
                <button
                  onClick={async () => {
                    try {
                      await enviarADeposito(ventaCreadaId);
                      showToast('Enviado a depósito', 'success');
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || 'Error al enviar a depósito';
                      showToast(msg, 'error');
                    }
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-orange-50 transition-colors border-2 border-transparent hover:border-orange-300"
                >
                  <div className="w-16 h-16 flex items-center justify-center">
                    <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M2.25 14.25h1.5m0 0v-3.375c0-.621.504-1.125 1.125-1.125h4.5V14.25m-5.625 0h5.625m0 0v-6.375m0 6.375h6.75M12 7.875V3.375m0 0h4.5l2.25 3.375M12 3.375H7.5" />
                    </svg>
                  </div>
                  <span className="font-bold text-sm text-orange-600">ENVIAR A</span>
                  <span className="font-bold text-sm text-orange-600 -mt-2">DEPOSITO</span>
                  <span className="text-red-500 font-bold text-xs">(5)</span>
                </button>
              )}
            </div>
            {/* Cerrar */}
            <div className="border-t px-8 py-4 text-center">
              <button
                onClick={() => setMostrarModalAcciones(false)}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm"
              >
                Cerrar sin acción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL ABRIR CAJA ============ */}
      {mostrarAbrirCaja && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMostrarAbrirCaja(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-green-600 px-5 py-4 rounded-t-xl">
              <h3 className="text-white font-bold text-lg">Abrir Caja</h3>
              <p className="text-green-100 text-sm">Ingrese el monto inicial para comenzar</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const caja = await abrirCaja({ montoInicial: cajaMontoInicial, observaciones: cajaObservaciones || undefined });
                setCajaAbiertaId(caja.id);
                setCajaMontoInicial(0);
                setCajaObservaciones('');
                setMostrarAbrirCaja(false);
              } catch {
                // Si ya hay caja abierta, recargar
                getCajaAbierta(localActivo || undefined).then(c => { if (c) setCajaAbiertaId(c.id); });
                setMostrarAbrirCaja(false);
              }
            }} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial *</label>
                <NumericInput
                  value={cajaMontoInicial}
                  onChange={v => setCajaMontoInicial(v)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  min={0}
                  decimales
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={cajaObservaciones}
                  onChange={e => setCajaObservaciones(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 resize-none"
                  rows={2}
                  placeholder="Observaciones opcionales..."
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Abrir Caja
                </button>
                <button type="button" onClick={() => setMostrarAbrirCaja(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
