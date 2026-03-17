import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Producto, Combo, Categoria, CarritoItem, TipoPedido, FormaPago, TipoFactura, ClienteDto, ListaPrecio, CrearPagoDto } from '../../types';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getCategorias } from '../../api/categorias';
import { crearPedido, getTicket } from '../../api/pedidos';
import TicketPrint, { TicketPrintProps } from '../../components/TicketPrint';
import { getFormasPagoActivas } from '../../api/formasPago';
import { buscarClientes } from '../../api/clientes';
import { getListasPrecios } from '../../api/listasPrecios';
import PagoDivididoPanel from '../../components/PagoDivididoPanel';
import { getCajaAbierta, abrirCaja } from '../../api/caja';
import { OFERTAS_SEMANALES_CATEGORIA_ID } from '../../utils/constants';

export default function POSPage() {
  // Data
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([]);
  const [cajaAbiertaId, setCajaAbiertaId] = useState<number | null>(null);

  // Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

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
  const [modoPago, setModoPago] = useState<'total' | 'dividido'>('total');
  const [pagosDivididos, setPagosDivididos] = useState<CrearPagoDto[]>([]);
  const [montoPagado, setMontoPagado] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [tipoDescuento, setTipoDescuento] = useState<'$' | '%'>('$');

  // Modal abrir caja
  const [mostrarAbrirCaja, setMostrarAbrirCaja] = useState(false);
  const [cajaMontoInicial, setCajaMontoInicial] = useState(0);
  const [cajaObservaciones, setCajaObservaciones] = useState('');

  // Estado post-creacion
  const [ticketCreado, setTicketCreado] = useState<string | null>(null);
  const [ultimoPedidoId, setUltimoPedidoId] = useState<number | null>(null);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<TicketPrintProps['ticket'] | null>(null);

  const busquedaRef = useRef<HTMLInputElement>(null);
  const clienteInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductos().then(setProductos);
    getCombos().then(setCombos);
    getCategorias().then(setCategorias);
    getFormasPagoActivas().then(setFormasPago);
    getListasPrecios().then(setListasPrecios);
    getCajaAbierta().then(caja => setCajaAbiertaId(caja?.id ?? null));
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
      buscarClientes(busquedaCliente).then(setClientesSugeridos);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaCliente]);

  // Precios segun lista seleccionada
  useEffect(() => {
    if (listaPrecioSeleccionada) {
      const lista = listasPrecios.find(l => l.id === listaPrecioSeleccionada);
      if (lista) {
        const map = new Map<number, number>();
        lista.detalles.forEach(d => map.set(d.productoId, d.precio));
        setPreciosLista(map);
      }
    } else {
      setPreciosLista(new Map());
    }
  }, [listaPrecioSeleccionada, listasPrecios]);

  // --- Funciones de cliente ---
  const seleccionarCliente = (cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    setNombreCliente(cliente.nombre);
    setTelefonoCliente(cliente.telefono || '');
    if (cliente.listaPrecioId) setListaPrecioSeleccionada(cliente.listaPrecioId);
    setBusquedaCliente(cliente.nombre + (cliente.telefono ? ` - ${cliente.telefono}` : ''));
    setMostrarSugerencias(false);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setNombreCliente('');
    setTelefonoCliente('');
  };

  // --- Funciones de carrito ---
  const agregarProducto = useCallback((p: Producto) => {
    const precioFinal = preciosLista.get(p.id) ?? p.precio;
    const existente = carrito.find(i => i.productoId === p.id);
    if (existente) {
      setCarrito(carrito.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1, precioUnitario: precioFinal } : i));
    } else {
      setCarrito([...carrito, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: precioFinal }]);
    }
    setBusqueda('');
    busquedaRef.current?.focus();
  }, [carrito, preciosLista]);

  const agregarCombo = (c: Combo) => {
    const existente = carrito.find(i => i.comboId === c.id);
    if (existente) {
      setCarrito(carrito.map(i => i.comboId === c.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { comboId: c.id, nombre: c.nombre, cantidad: 1, precioUnitario: c.precio }]);
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

  // ===== MEGA-CATEGORIAS PARA MODAL CATALOGO =====
  const megaCategorias = useMemo(() => {
    const econId = categorias.find(c => c.nombre === 'Económica')?.id;
    const premiumId = categorias.find(c => c.nombre === 'Premium')?.id;
    return [
      { key: 'eco', label: 'Hamburguesas Eco', catIds: categorias.filter(c => c.categoriaPadreId === econId).map(c => c.id) },
      { key: 'premium', label: 'Hamburguesas Premium', catIds: categorias.filter(c => c.categoriaPadreId === premiumId).map(c => c.id) },
      { key: 'salch-corta', label: 'Salchichas Cortas', catIds: categorias.filter(c => c.nombre === 'Salchicha Corta').map(c => c.id) },
      { key: 'salch-larga', label: 'Salchichas Largas', catIds: categorias.filter(c => c.nombre === 'Salchicha Larga').map(c => c.id) },
      { key: 'pan', label: 'Pan', catIds: categorias.filter(c => c.nombre.startsWith('Pan ')).map(c => c.id) },
      { key: 'aderezos', label: 'Aderezos', catIds: categorias.filter(c => c.nombre === 'Aderezos').map(c => c.id) },
    ];
  }, [categorias]);

  const getMegaCatIds = (key: string) => megaCategorias.find(m => m.key === key)?.catIds ?? [];

  const productosCatalogo = useMemo(() => {
    const activos = productos.filter(p => p.activo);
    if (!categoriaFiltro || categoriaFiltro === 'combos') return activos;
    if (categoriaFiltro === 'ofertas') return activos.filter(p => p.categoriaId === OFERTAS_SEMANALES_CATEGORIA_ID);
    if (categoriaFiltro === 'descuento') return activos.filter(p => preciosLista.has(p.id) && preciosLista.get(p.id) !== p.precio);
    const catIds = getMegaCatIds(categoriaFiltro);
    return activos.filter(p => catIds.includes(p.categoriaId));
  }, [productos, categoriaFiltro, megaCategorias, preciosLista]);

  const combosCatalogo = useMemo(() => {
    const activos = combos.filter(c => c.activo);
    if (!categoriaFiltro || categoriaFiltro === 'combos') return categoriaFiltro === 'combos' ? activos : [];
    if (categoriaFiltro === 'ofertas' || categoriaFiltro === 'descuento') return [];
    const catIds = getMegaCatIds(categoriaFiltro);
    const prodIdsEnCat = new Set(productos.filter(p => catIds.includes(p.categoriaId)).map(p => p.id));
    return activos.filter(c => c.detalles.some(d => prodIdsEnCat.has(d.productoId)));
  }, [combos, productos, categoriaFiltro, megaCategorias]);

  // Auto-agregar producto si busca por codigo exacto y Enter
  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      const exacto = productos.find(p => p.activo && p.numeroInterno?.toLowerCase() === busqueda.trim().toLowerCase());
      if (exacto) {
        agregarProducto(exacto);
        return;
      }
      if (productosFiltrados.length === 1) {
        agregarProducto(productosFiltrados[0]);
      }
    }
  };

  const handlePagoTotal = () => {
    setMontoPagado(total);
  };

  // --- Crear pedido ---
  const handleCrearPedido = async () => {
    if (carrito.length === 0) return;
    const pedido = await crearPedido({
      tipo: TipoPedido.ParaLlevar,
      nombreCliente: nombreCliente || undefined,
      telefonoCliente: telefonoCliente || undefined,
      descuento: descuentoCalculado,
      formaPagoId: modoPago === 'total' ? formaPagoSeleccionada : undefined,
      clienteId: clienteSeleccionado?.id,
      notaInterna: notaInterna || undefined,
      tipoFactura,
      pagos: modoPago === 'dividido' ? pagosDivididos : undefined,
      lineas: carrito.map(item => ({
        productoId: item.productoId,
        comboId: item.comboId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        notas: item.notas,
      })),
    });
    setTicketCreado(pedido.numeroTicket);
    setUltimoPedidoId(pedido.id);
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
    setUltimoPedidoId(null);
    busquedaRef.current?.focus();
  };

  const handleImprimir = async () => {
    if (!ultimoPedidoId) return;
    const ticket = await getTicket(ultimoPedidoId);
    setTicketParaImprimir(ticket);
  };

  const listoParaGuardar = carrito.length > 0 && deuda <= 0;

  // Shared input class for consistent sizing
  const inputClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors';
  const selectClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
  const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1';

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* ============ PANEL IZQUIERDO ============ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header: Cliente + Factura */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-1.5">
          <div className="flex items-center gap-2">
            {/* Buscar cliente */}
            <div className="flex-1 relative" ref={clienteInputRef}>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  placeholder="Buscar cliente..."
                  className={`${inputClass} pl-8 ${clienteSeleccionado ? 'bg-amber-50 border-amber-300' : ''}`}
                />
                {clienteSeleccionado && (
                  <button onClick={limpiarCliente} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              {mostrarSugerencias && clientesSugeridos.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-md shadow-lg max-h-48 overflow-y-auto">
                  {clientesSugeridos.map(c => (
                    <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors">
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

            {/* Tipo Factura */}
            <select
              value={tipoFactura}
              onChange={e => setTipoFactura(Number(e.target.value))}
              className={`${selectClass} w-auto min-w-[120px] font-medium`}
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
                onChange={e => setBusqueda(e.target.value)}
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
          {busqueda && productosFiltrados.length > 0 && (
            <div className="mt-1.5 border border-gray-200 rounded-md max-h-40 overflow-y-auto shadow-sm">
              {productosFiltrados.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-amber-50 active:bg-amber-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {p.numeroInterno && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{p.numeroInterno}</span>}
                    <span className="text-gray-800">{p.nombre}</span>
                  </div>
                  <span className="font-semibold text-amber-600">${(preciosLista.get(p.id) ?? p.precio).toLocaleString()}</span>
                </button>
              ))}
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
                    <td colSpan={6} className="text-center py-6 text-gray-400">
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
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={e => actualizarItem(i, 'cantidad', Math.max(1, Number(e.target.value)))}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            min={1}
                          />
                        </td>
                        <td className="px-1 py-1 w-20">
                          <input
                            type="number"
                            value={item.precioUnitario}
                            onChange={e => actualizarItem(i, 'precioUnitario', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            min={0}
                            step={100}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-semibold text-gray-800 w-24">
                          ${(item.precioUnitario * item.cantidad).toLocaleString()}
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
      <div className="w-full lg:w-80 xl:w-[340px] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0 lg:max-h-full">
        {/* Caja info */}
        <div className={`px-3 py-2 rounded-t-lg flex items-center justify-between ${cajaAbiertaId ? 'bg-slate-800 text-white' : 'bg-red-50 border-b border-red-200'}`}>
          <div>
            <div className={`text-[10px] uppercase tracking-wider ${cajaAbiertaId ? 'text-slate-400' : 'text-red-400'}`}>Caja</div>
            <div className={`font-bold text-sm ${cajaAbiertaId ? 'text-white' : 'text-red-600'}`}>
              {cajaAbiertaId ? `Caja #${cajaAbiertaId}` : 'Caja Cerrada'}
            </div>
          </div>
          {!cajaAbiertaId && (
            <button
              onClick={() => setMostrarAbrirCaja(true)}
              className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors"
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
                  {formasPago.map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.nombre}{fp.porcentajeRecargo > 0 ? ` (+${fp.porcentajeRecargo}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Monto Pagado</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={montoPagado}
                    onChange={e => setMontoPagado(Number(e.target.value))}
                    className={`${inputClass} flex-1`}
                    min={0}
                    step={100}
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
          ) : (
            <PagoDivididoPanel
              formasPago={formasPago}
              totalVenta={subtotal - descuentoCalculado}
              pagos={pagosDivididos}
              onChange={setPagosDivididos}
            />
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
              <input
                type="number"
                value={descuento}
                onChange={e => setDescuento(Number(e.target.value))}
                className={`${inputClass} flex-1`}
                min={0}
                step={tipoDescuento === '%' ? 1 : 100}
              />
            </div>
          </div>

        </div>

        {/* Resumen de totales */}
        <div className="border-t-2 border-gray-200 bg-gray-50 px-3 py-1.5 space-y-0 flex-shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
          {descuentoCalculado > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Descuento</span>
              <span className="font-medium text-green-600">-${descuentoCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {recargo > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Recargo {modoPago === 'total' && formaPagoActual && formaPagoActual.porcentajeRecargo > 0 ? `(${formaPagoActual.porcentajeRecargo}%)` : ''}
              </span>
              <span className="font-medium text-orange-600">+${recargo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400">
            <span>IVA</span>
            <span>(incluido)</span>
          </div>
          <div className={`flex justify-between items-baseline pt-1.5 mt-1 border-t border-gray-300 ${carrito.length > 0 ? 'text-lg' : 'text-base'}`}>
            <span className="font-bold text-gray-800">Total</span>
            <span className={`font-bold ${carrito.length > 0 ? 'text-amber-600 text-xl' : 'text-gray-600'}`}>
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-xs text-amber-600 font-medium mt-0.5">Retiro en el local</div>
        </div>

        {/* Botones + Deuda */}
        <div className="border-t border-gray-200 px-3 py-2 flex-shrink-0">
          {/* Deuda */}
          <div className={`flex justify-between items-center text-sm font-semibold mb-2 px-2 py-1 rounded-md ${
            deuda > 0 ? 'bg-red-50 border border-red-200' : deuda === 0 && carrito.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-gray-600">Deuda</span>
            <span className={deuda > 0 ? 'text-red-600' : deuda === 0 && carrito.length > 0 ? 'text-green-600' : 'text-gray-500'}>
              {deuda <= 0 && carrito.length > 0 ? 'Listo' : `$${Math.max(0, deuda).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
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
              disabled={carrito.length === 0}
              className={`flex-[1.5] py-2 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                listoParaGuardar
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500 shadow-md shadow-green-600/20'
                  : carrito.length > 0
                    ? 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ============ MODAL CATALOGO ============ */}
      {mostrarCatalogo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 lg:p-6" onClick={() => setMostrarCatalogo(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Catalogo de Productos</h2>
              <button onClick={() => setMostrarCatalogo(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Filtro por mega-categoria */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex gap-1.5 flex-wrap">
              <button onClick={() => setCategoriaFiltro(null)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!categoriaFiltro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
              {listaPrecioSeleccionada && (
                <button
                  onClick={() => setCategoriaFiltro('descuento')}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === 'descuento' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'}`}
                >
                  Con Descuento
                </button>
              )}
              {megaCategorias.map(mc => (
                <button key={mc.key} onClick={() => setCategoriaFiltro(mc.key)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{mc.label}</button>
              ))}
              <button
                onClick={() => setCategoriaFiltro('ofertas')}
                className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === 'ofertas' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100'}`}
              >
                Ofertas
              </button>
              <button onClick={() => setCategoriaFiltro('combos')} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === 'combos' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>Combos</button>
            </div>

            {/* Grid de productos + combos relacionados */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 content-start">
              {/* Productos sueltos */}
              {categoriaFiltro !== 'combos' && productosCatalogo.map(p => (
                <button key={`prod-${p.id}`} onClick={() => { agregarProducto(p); setMostrarCatalogo(false); }} className={`border-2 rounded-lg p-2.5 text-left transition-all hover:shadow-md active:scale-[0.98] group ${
                  p.categoriaId === OFERTAS_SEMANALES_CATEGORIA_ID
                    ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                    : 'bg-white border-gray-200 hover:border-amber-400'
                }`}>
                  {p.numeroInterno && <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>}
                  <div className="font-medium text-sm text-gray-800 group-hover:text-amber-700 leading-tight">{p.nombre}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
                  <div className={`font-bold mt-0.5 ${p.categoriaId === OFERTAS_SEMANALES_CATEGORIA_ID ? 'text-orange-600' : 'text-amber-600'}`}>
                    ${(preciosLista.get(p.id) ?? p.precio).toLocaleString()}
                    {preciosLista.has(p.id) && preciosLista.get(p.id) !== p.precio && (
                      <span className="text-xs text-gray-400 line-through ml-1">${p.precio.toLocaleString()}</span>
                    )}
                  </div>
                </button>
              ))}
              {/* Combos (todos si chip Combos, o relacionados si mega-categoria) */}
              {(categoriaFiltro === 'combos' ? combos.filter(c => c.activo) : combosCatalogo).map(c => (
                <button key={`combo-${c.id}`} onClick={() => { agregarCombo(c); setMostrarCatalogo(false); }} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-2.5 text-left hover:border-purple-400 hover:shadow-md active:bg-purple-100 transition-all group">
                  <div className="font-medium text-sm text-gray-800 group-hover:text-purple-700">{c.nombre}</div>
                  <div className="text-purple-600 font-bold mt-0.5">${c.precio.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de impresion */}
      {ticketParaImprimir && (
        <TicketPrint ticket={ticketParaImprimir} onClose={() => setTicketParaImprimir(null)} />
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
                getCajaAbierta().then(c => { if (c) setCajaAbiertaId(c.id); });
                setMostrarAbrirCaja(false);
              }
            }} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial *</label>
                <input
                  type="number"
                  value={cajaMontoInicial}
                  onChange={e => setCajaMontoInicial(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  min={0}
                  step={100}
                  required
                  autoFocus
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
