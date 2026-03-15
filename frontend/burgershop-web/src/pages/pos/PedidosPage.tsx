import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Pedido, EstadoPedido, estadoLabels, estadoColores,
  Producto, Combo, Categoria, CarritoItem, TipoPedido,
  FormaPago, Zona, TipoFactura,
} from '../../types';
import { getPedidos, crearPedido, cambiarEstado, cancelarPedido, actualizarPedido } from '../../api/pedidos';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getCategorias } from '../../api/categorias';
import { getFormasPagoActivas } from '../../api/formasPago';
import { getZonas } from '../../api/zonas';
import { getRepartidores } from '../../api/repartidores';
import { Repartidor } from '../../types/logistica';
import { useGooglePlaces } from '../../hooks/useGooglePlaces';
import { GoogleMap } from '../../components/GoogleMap';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { es } from 'date-fns/locale';
import { addDays, format } from 'date-fns';
import { OFERTAS_SEMANALES_CATEGORIA_ID } from '../../utils/constants';

const inputClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors';
const selectClass = 'w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

// Estados activos para filtrar en el panel derecho (entregas se ven en pantalla Entregas)
const estadosFiltro = [
  EstadoPedido.Pendiente,
  EstadoPedido.Entregado,
  EstadoPedido.Cancelado,
  EstadoPedido.NoEntregado,
];

export default function PedidosPage() {
  // ===== DATA =====
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);

  // ===== PANEL DERECHO: PEDIDOS =====
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | null>(null);
  const [busquedaTicket, setBusquedaTicket] = useState('');

  // ===== PANEL IZQUIERDO: FORMULARIO =====
  const [editandoPedido, setEditandoPedido] = useState<Pedido | null>(null);
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<number | undefined>();
  const [notaInterna, setNotaInterna] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<number | undefined>();
  const [descuento, setDescuento] = useState(0);
  const [esProgramado, setEsProgramado] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [popoverCalendarioAbierto, setPopoverCalendarioAbierto] = useState(false);
  const [yaPago, setYaPago] = useState(false);
  const [mostrarExtras, setMostrarExtras] = useState(false);

  // ===== MODAL ASIGNAR REPARTIDOR =====
  const [mostrarAsignarRepartidor, setMostrarAsignarRepartidor] = useState<Pedido | null>(null);

  // ===== MODAL CANCELAR PEDIDO =====
  const [pedidoCancelar, setPedidoCancelar] = useState<Pedido | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const busquedaRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const { sugerencias: sugerenciasDireccion, coordenadas, buscarDirecciones, limpiarSugerencias, geocodificar, geocodificarDireccion, limpiarCoordenadas } = useGooglePlaces();
  const [mostrarSugerenciasDireccion, setMostrarSugerenciasDireccion] = useState(false);

  // ===== CARGAR DATOS INICIALES =====
  useEffect(() => {
    getProductos().then(setProductos);
    getCombos().then(setCombos);
    getCategorias().then(setCategorias);
    getFormasPagoActivas().then(setFormasPago);
    getZonas().then(setZonas);
    getRepartidores().then(setRepartidores);
  }, []);

  // ===== CARGAR PEDIDOS =====
  const cargarPedidos = useCallback(() => {
    const params: { estado?: number } = {};
    if (filtroEstado) params.estado = filtroEstado;
    getPedidos(undefined, params.estado).then(setPedidos);
  }, [filtroEstado]);

  useEffect(() => { cargarPedidos(); }, [cargarPedidos]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const interval = setInterval(cargarPedidos, 15000);
    return () => clearInterval(interval);
  }, [cargarPedidos]);

  // ===== FUNCIONES DE CARRITO =====
  const agregarProducto = useCallback((p: Producto) => {
    const existente = carrito.find(i => i.productoId === p.id);
    if (existente) {
      setCarrito(carrito.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: p.precio }]);
    }
    setBusqueda('');
    busquedaRef.current?.focus();
  }, [carrito]);

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

  // ===== CALCULOS =====
  const subtotal = carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  const formaPagoActual = formasPago.find(fp => fp.id === formaPagoSeleccionada);
  const recargo = formaPagoActual && formaPagoActual.porcentajeRecargo > 0
    ? Math.round((subtotal - descuento) * formaPagoActual.porcentajeRecargo / 100)
    : 0;
  const total = subtotal - descuento + recargo;

  // ===== BUSQUEDA DE PRODUCTOS =====
  const productosFiltrados = productos.filter(p => {
    if (!p.activo) return false;
    if (busqueda) {
      const term = busqueda.toLowerCase();
      return (p.numeroInterno?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term);
    }
    return false;
  });

  const productosCatalogo = productos.filter(p => {
    if (!p.activo) return false;
    if (categoriaFiltro && categoriaFiltro > 0 && p.categoriaId !== categoriaFiltro) return false;
    return true;
  });

  const categoriasNormales = categorias.filter(c => c.activa && c.id !== OFERTAS_SEMANALES_CATEGORIA_ID);
  const categoriaOfertas = categorias.find(c => c.id === OFERTAS_SEMANALES_CATEGORIA_ID && c.activa);

  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      const exacto = productos.find(p => p.activo && p.numeroInterno?.toLowerCase() === busqueda.trim().toLowerCase());
      if (exacto) { agregarProducto(exacto); return; }
      if (productosFiltrados.length === 1) agregarProducto(productosFiltrados[0]);
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
  const cargarPedidoEnFormulario = (pedido: Pedido) => {
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
    setMostrarExtras(false);
    limpiarCoordenadas();
    busquedaRef.current?.focus();
  };

  // ===== VALIDACION =====
  const telefonoDigitos = telefono.replace(/[^0-9]/g, '');
  const telefonoValido = telefonoDigitos.length >= 8;
  const formularioValido = carrito.length > 0 && direccion.trim() !== '' && telefonoValido && !!zonaSeleccionada;

  // ===== CREAR PEDIDO =====
  const handleCrearPedido = async () => {
    if (!formularioValido) return;
    await crearPedido({
      tipo: TipoPedido.Domicilio,
      direccionEntrega: direccion || undefined,
      telefonoCliente: telefono || undefined,
      zonaId: zonaSeleccionada,
      descuento,
      formaPagoId: formaPagoSeleccionada,
      notaInterna: notaInterna || undefined,
      tipoFactura: TipoFactura.FacturaB,
      fechaProgramada: esProgramado && fechaProgramada ? fechaProgramada : undefined,
      estaPago: yaPago,
      lineas: carrito.map(item => ({
        productoId: item.productoId,
        comboId: item.comboId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        notas: item.notas,
      })),
    });
    limpiarFormulario();
    cargarPedidos();
  };

  // ===== GUARDAR CAMBIOS (EDITAR) =====
  const handleGuardarCambios = async () => {
    if (!editandoPedido || !formularioValido) return;
    await actualizarPedido(editandoPedido.id, {
      nombreCliente: editandoPedido.nombreCliente || undefined,
      telefonoCliente: telefono || undefined,
      direccionEntrega: direccion || undefined,
      zonaId: zonaSeleccionada || undefined,
      descuento,
      formaPagoId: formaPagoSeleccionada || undefined,
      notaInterna: notaInterna || undefined,
      tipoFactura: editandoPedido.tipoFactura,
      fechaProgramada: esProgramado && fechaProgramada ? fechaProgramada : undefined,
      estaPago: yaPago,
      lineas: carrito.map(item => ({
        productoId: item.productoId || undefined,
        comboId: item.comboId || undefined,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        notas: item.notas || undefined,
      })),
    });
    limpiarFormulario();
    cargarPedidos();
  };

  // ===== CAMBIAR ESTADO =====
  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoPedido) => {
    await cambiarEstado(id, nuevoEstado);
    cargarPedidos();
    if (editandoPedido?.id === id) limpiarFormulario();
  };

  const handleCancelar = (pedido: Pedido) => {
    setPedidoCancelar(pedido);
    setMotivoCancelacion('');
  };

  const confirmarCancelacion = async () => {
    if (!pedidoCancelar || !motivoCancelacion.trim()) return;
    const id = pedidoCancelar.id;
    const motivo = motivoCancelacion.trim();
    setPedidoCancelar(null);
    setMotivoCancelacion('');
    await cancelarPedido(id, motivo);
    cargarPedidos();
    if (editandoPedido?.id === id) limpiarFormulario();
  };

  const siguienteEstado = (_estado: EstadoPedido): EstadoPedido | null => {
    // Ya no hay transición manual de estado desde PedidosPage
    // Los pedidos pasan a Asignado desde EntregasPage (Empezar Reparto)
    return null;
  };

  // ===== ASIGNAR REPARTIDOR =====
  const handleAsignarRepartidor = async (pedido: Pedido, _repartidorId: number) => {
    // Asignar = cambiar estado a Asignado y luego EnCamino, o directamente poner repartidorId via update
    await cambiarEstado(pedido.id, EstadoPedido.Asignado);
    setMostrarAsignarRepartidor(null);
    cargarPedidos();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-7.5rem)] overflow-hidden">
      {/* ============ PANEL IZQUIERDO: FORMULARIO ============ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Zona superior: datos del pedido (izq) + mapa (der) */}
        <div className="flex gap-2 mb-1.5 flex-shrink-0">
          {/* Columna izquierda: Header + Direccion + Telefono + Programar */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {/* Header: Nro Pedido + Estado */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {editandoPedido
                    ? <span>Pedido <span className="text-amber-600">#{editandoPedido.numeroTicket}</span></span>
                    : 'Nuevo Pedido'
                  }
                </h2>
                {editandoPedido && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColores[editandoPedido.estado]}`}>
                    {estadoLabels[editandoPedido.estado]}
                  </span>
                )}
              </div>
            </div>

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
                  placeholder="Domicilio / Direccion de entrega..."
                  className={`${inputClass} pl-8`}
                />
                {mostrarSugerenciasDireccion && sugerenciasDireccion.length > 0 && direccion.length >= 3 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                    {sugerenciasDireccion.map(s => (
                      <button
                        key={s.placeId}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setDireccion(s.descripcion);
                          setMostrarSugerenciasDireccion(false);
                          limpiarSugerencias();
                          geocodificar(s.placeId);
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
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
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

          {/* Columna derecha: Mapa interactivo (ocupa toda la altura) */}
          <div className="w-72 flex-shrink-0">
            {coordenadas && direccion ? (
              <div className="relative h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <GoogleMap coordenadas={coordenadas} className="h-full" />
                <button
                  onClick={limpiarCoordenadas}
                  className="absolute top-2 right-2 bg-white/90 text-gray-400 hover:text-gray-600 rounded-full p-1 shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="h-full bg-white rounded-lg shadow-sm border border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs text-gray-400">Ingresa una direccion<br />para ver el mapa</span>
                </div>
              </div>
            )}
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
                placeholder="Codigo / Buscar producto..."
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
                  <span className="font-semibold text-amber-600">${p.precio.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabla del carrito (Detalle de productos) */}
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

        {/* Footer: Zona + Ya pago + Subtotal + Extras + Botones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 mt-1.5 flex-shrink-0 space-y-1.5">
          {/* Fila 1: Zona (select) + Ya esta pago + Subtotal */}
          <div className="flex items-center gap-3">
            <select
              value={zonaSeleccionada || ''}
              onChange={e => setZonaSeleccionada(Number(e.target.value) || undefined)}
              className={`${selectClass} w-48`}
            >
              <option value="">Zona...</option>
              {zonas.filter(z => z.activa).map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={yaPago}
                onChange={e => setYaPago(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400"
              />
              <span className="text-sm text-gray-700 font-medium whitespace-nowrap">Ya esta pago</span>
            </label>
            {/* Icono expandir extras (nota + descuento) */}
            <button
              onClick={() => setMostrarExtras(!mostrarExtras)}
              className={`p-1.5 rounded-md transition-colors ${mostrarExtras ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-amber-400"
                  min={0}
                  step={100}
                />
              </div>
              <input
                value={notaInterna}
                onChange={e => setNotaInterna(e.target.value)}
                placeholder="Nota interna..."
                className={`${inputClass} flex-1`}
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
                  ? 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {editandoPedido ? 'Guardar Cambios' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>

      {/* ============ PANEL DERECHO: PEDIDOS DEL DIA ============ */}
      <div className="w-full lg:w-96 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        {/* Header con fecha */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-sm font-bold text-gray-800">Pedidos del dia</h2>
            <span className="text-xs text-gray-500 font-medium">
              {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-1 flex-wrap mb-1.5 items-center">
            <button
              onClick={() => setFiltroEstado(null)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                !filtroEstado ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {estadosFiltro.map(est => (
              <button
                key={est}
                onClick={() => setFiltroEstado(filtroEstado === est ? null : est)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                  filtroEstado === est ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {estadoLabels[est]}
              </button>
            ))}
            {/* Preparar Todos eliminado - ya no se usa EnPreparacion */}
          </div>

          {/* Busqueda por ticket */}
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={busquedaTicket}
              onChange={e => setBusquedaTicket(e.target.value)}
              placeholder="Buscar ticket..."
              className="w-full border border-gray-300 rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
          {pedidosFiltrados.length === 0 && (
            <p className="text-gray-400 text-center py-8 text-sm">No hay pedidos</p>
          )}
          {pedidosFiltrados.map(p => (
            <div
              key={p.id}
              onClick={() => cargarPedidoEnFormulario(p)}
              className={`bg-white rounded-lg border p-2.5 cursor-pointer hover:border-amber-400 transition-all ${
                editandoPedido?.id === p.id ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/30' : 'border-gray-200 hover:shadow-sm'
              }`}
            >
              {/* Fila 1: Ticket + Estado + Hora */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">{p.numeroTicket}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${estadoColores[p.estado]}`}>
                    {estadoLabels[p.estado]}
                  </span>
                  {p.fechaProgramada && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                      Programado: {new Date(p.fechaProgramada.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{new Date(p.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Fila 2: Direccion + Zona */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                {p.direccionEntrega && (
                  <span className="truncate flex-1" title={p.direccionEntrega}>
                    <svg className="w-3 h-3 inline-block mr-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {p.direccionEntrega}
                  </span>
                )}
                {p.zonaNombre && (
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                    {p.zonaNombre}
                  </span>
                )}
              </div>

              {/* Fila 3: Total + Pago + Acciones */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600 text-sm">${p.total.toLocaleString()}</span>
                  {p.estaPago ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Pago</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">No pago</span>
                  )}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {siguienteEstado(p.estado) && p.estado !== EstadoPedido.Cancelado && p.estado !== EstadoPedido.Entregado && p.estado !== EstadoPedido.NoEntregado && (
                    <button
                      onClick={() => handleCambiarEstado(p.id, siguienteEstado(p.estado)!)}
                      className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors font-medium"
                    >
                      {estadoLabels[siguienteEstado(p.estado)!]}
                    </button>
                  )}
                  {p.estado === EstadoPedido.Listo && (
                    <button
                      onClick={() => setMostrarAsignarRepartidor(p)}
                      className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-100 transition-colors font-medium"
                    >
                      Repartidor
                    </button>
                  )}
                  {p.estado !== EstadoPedido.Cancelado && p.estado !== EstadoPedido.Entregado && p.estado !== EstadoPedido.NoEntregado && (
                    <button
                      onClick={() => handleCancelar(p)}
                      className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded hover:bg-red-100 transition-colors font-medium"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>

              {/* Repartidor asignado */}
              {p.repartidorNombre && (
                <div className="text-[10px] text-purple-600 mt-0.5 font-medium">
                  Repartidor: {p.repartidorNombre}
                </div>
              )}
              {/* Motivo cancelacion */}
              {(p.estado === EstadoPedido.Cancelado || p.estado === EstadoPedido.NoEntregado) && p.motivoCancelacion && (
                <div className="text-[10px] text-red-600 mt-0.5 italic">
                  Motivo: {p.motivoCancelacion}
                </div>
              )}
            </div>
          ))}
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

            {/* Filtro por categoria */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex gap-1.5 flex-wrap">
              <button onClick={() => setCategoriaFiltro(null)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!categoriaFiltro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
              {categoriasNormales.map(c => (
                <button key={c.id} onClick={() => setCategoriaFiltro(c.id)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === c.id ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.nombre}</button>
              ))}
              {categoriaOfertas && (
                <button
                  onClick={() => setCategoriaFiltro(categoriaFiltro === OFERTAS_SEMANALES_CATEGORIA_ID ? null : OFERTAS_SEMANALES_CATEGORIA_ID)}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${categoriaFiltro === OFERTAS_SEMANALES_CATEGORIA_ID ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100'}`}
                >
                  Ofertas
                </button>
              )}
              <button onClick={() => setCategoriaFiltro(-1)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === -1 ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>Combos</button>
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 content-start">
              {categoriaFiltro === -1 ? (
                combos.map(c => (
                  <button key={`combo-${c.id}`} onClick={() => { agregarCombo(c); setMostrarCatalogo(false); }} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-2.5 text-left hover:border-purple-400 hover:shadow-md active:bg-purple-100 transition-all group">
                    <div className="font-medium text-sm text-gray-800 group-hover:text-purple-700">{c.nombre}</div>
                    <div className="text-purple-600 font-bold mt-0.5">${c.precio.toLocaleString()}</div>
                  </button>
                ))
              ) : (
                productosCatalogo.map(p => (
                  <button key={`prod-${p.id}`} onClick={() => { agregarProducto(p); setMostrarCatalogo(false); }} className={`border-2 rounded-lg p-2.5 text-left transition-all hover:shadow-md active:scale-[0.98] group ${
                    p.categoriaId === OFERTAS_SEMANALES_CATEGORIA_ID
                      ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                      : 'bg-white border-gray-200 hover:border-amber-400'
                  }`}>
                    {p.numeroInterno && <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>}
                    <div className="font-medium text-sm text-gray-800 group-hover:text-amber-700 leading-tight">{p.nombre}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
                    <div className={`font-bold mt-0.5 ${p.categoriaId === OFERTAS_SEMANALES_CATEGORIA_ID ? 'text-orange-600' : 'text-amber-600'}`}>
                      ${p.precio.toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL CANCELAR PEDIDO ============ */}
      {pedidoCancelar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPedidoCancelar(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 px-5 py-3 rounded-t-xl">
              <h3 className="text-white font-bold">Cancelar pedido</h3>
              <p className="text-red-100 text-sm">#{pedidoCancelar.numeroTicket}</p>
            </div>
            <div className="px-5 py-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo de cancelacion *</label>
              <textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Ingresa el motivo..."
                rows={3}
                className={`${inputClass} resize-none`}
                autoFocus
              />
            </div>
            <div className="px-5 py-3 flex gap-3 border-t border-gray-200">
              <button
                onClick={() => { setPedidoCancelar(null); setMotivoCancelacion(''); }}
                className="flex-1 py-2 rounded-lg font-semibold text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                disabled={!motivoCancelacion.trim()}
                className="flex-1 py-2 rounded-lg font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Cancelar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preparar Todos eliminado */}

      {/* ============ MODAL ASIGNAR REPARTIDOR ============ */}
      {mostrarAsignarRepartidor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMostrarAsignarRepartidor(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-800">Asignar Repartidor</h2>
              <button onClick={() => setMostrarAsignarRepartidor(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {repartidores.filter(r => r.activo).map(r => (
                <button
                  key={r.id}
                  onClick={() => handleAsignarRepartidor(mostrarAsignarRepartidor, r.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-sm"
                >
                  <div className="font-medium text-gray-800">{r.nombre}</div>
                  {r.telefono && <div className="text-xs text-gray-500">{r.telefono}</div>}
                  {r.vehiculo && <div className="text-xs text-gray-400">{r.vehiculo}</div>}
                </button>
              ))}
              {repartidores.filter(r => r.activo).length === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">No hay repartidores activos</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
