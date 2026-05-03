import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  MovimientoDto,
  getMovimientosPorLocal,
  crearDevolucion,
} from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { buscarClientes } from '../../api/clientes';
import { getLocales, LocalDto } from '../../api/locales';
import { Producto, Combo, ClienteDto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { compareBy } from '../../utils/tableSort';
import { parseFechaUtc } from '../../utils/fechas';

const inputClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass =
  'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  return parseFechaUtc(fecha).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMonto(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

type SortDir = 'asc' | 'desc';

// Tipo unificado para el selector de producto/combo
interface ItemSeleccionable {
  id: number;
  nombre: string;
  precio: number;
  tipo: 'producto' | 'combo';
}

export default function DevolucionesPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  // --- Data ---
  const [movimientos, setMovimientos] = useState<MovimientoDto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [cargando, setCargando] = useState(false);

  // --- Locales ---
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));

  // --- Filtros ---
  const [fechaDesde, setFechaDesde] = useState(getHoy());
  const [fechaHasta, setFechaHasta] = useState(getHoy());
  const [filtroProducto, setFiltroProducto] = useState<number | ''>('');

  // --- Orden ---
  const [ordenCol, setOrdenCol] = useState<string>('fechaMovimiento');
  const [ordenDir, setOrdenDir] = useState<SortDir>('desc');

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Selector producto/combo
  const [buscadorItem, setBuscadorItem] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemSeleccionable | null>(null);
  const [mostrarListaItems, setMostrarListaItems] = useState(false);
  const refBuscadorItem = useRef<HTMLInputElement>(null);
  const refListaItems = useRef<HTMLDivElement>(null);

  // Selector cliente
  const [buscadorCliente, setBuscadorCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [sugerenciasClientes, setSugerenciasClientes] = useState<ClienteDto[]>([]);
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const refBuscadorCliente = useRef<HTMLInputElement>(null);

  // Otros campos del form
  const [formCantidad, setFormCantidad] = useState<string>('');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<string>('');
  const [formFecha, setFormFecha] = useState(getHoy());
  const [formMotivo, setFormMotivo] = useState('');

  // --- Items unificados (productos + combos) ---
  const itemsDisponibles = useMemo<ItemSeleccionable[]>(() => {
    const prods: ItemSeleccionable[] = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio ?? 0,
      tipo: 'producto',
    }));
    const combs: ItemSeleccionable[] = combos.map(c => ({
      id: c.id,
      nombre: c.nombre,
      precio: c.precio,
      tipo: 'combo',
    }));
    return [...prods, ...combs];
  }, [productos, combos]);

  const itemsFiltrados = useMemo<ItemSeleccionable[]>(() => {
    if (!buscadorItem.trim()) return itemsDisponibles;
    const term = buscadorItem.toLowerCase();
    return itemsDisponibles.filter(i => i.nombre.toLowerCase().includes(term));
  }, [itemsDisponibles, buscadorItem]);

  // --- Load catalogos ---
  useEffect(() => {
    getProductos().then(setProductos).catch(() => {});
    getCombos().then(setCombos).catch(() => {});
    getLocales().then(setLocales).catch(() => {});
  }, []);

  // --- Busqueda de clientes con debounce ---
  useEffect(() => {
    if (!buscadorCliente.trim() || buscadorCliente.length < 2) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      return;
    }
    setBuscandoClientes(true);
    const timer = setTimeout(() => {
      buscarClientes(buscadorCliente)
        .then(data => {
          setSugerenciasClientes(data.slice(0, 8));
          setMostrarSugerenciasClientes(true);
        })
        .catch(() => {})
        .finally(() => setBuscandoClientes(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [buscadorCliente]);

  // Cerrar lista items al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        refBuscadorItem.current && !refBuscadorItem.current.contains(e.target as Node) &&
        refListaItems.current && !refListaItems.current.contains(e.target as Node)
      ) {
        setMostrarListaItems(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Cargar movimientos ---
  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    try {
      const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
      let data: MovimientoDto[];
      if (localSeleccionado === 0) {
        const promises = locales.map(l => getMovimientosPorLocal(l.id, fechaDesde, hasta));
        const results = await Promise.all(promises);
        data = results.flat().sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime());
      } else {
        data = await getMovimientosPorLocal(localSeleccionado, fechaDesde, hasta);
      }
      // Filtrar solo devoluciones (DEV_CLI)
      setMovimientos(data.filter(m => m.codigoAccionCodigo === 'DEV_CLI'));
    } catch (err) {
      console.error('Error cargando devoluciones:', err);
      showToast('Error al cargar devoluciones', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, localSeleccionado, locales, showToast]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  // --- Filtrado local ---
  const movimientosFiltrados = useMemo(() => {
    let lista = [...movimientos];
    if (filtroProducto !== '') {
      lista = lista.filter((m) => m.productoId === filtroProducto);
    }
    lista.sort((a, b) => compareBy(a, b, ordenCol, ordenDir));
    return lista;
  }, [movimientos, filtroProducto, ordenCol, ordenDir]);

  // --- Resumen ---
  const montoTotal = useMemo(
    () => movimientosFiltrados.reduce((s, m) => s + Math.abs(m.montoTotal), 0),
    [movimientosFiltrados]
  );

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrdenCol(col);
      setOrdenDir('asc');
    }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? (
      <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
    ) : null;

  // --- Modal handlers ---
  const abrirModal = () => {
    setItemSeleccionado(null);
    setBuscadorItem('');
    setMostrarListaItems(false);
    setClienteSeleccionado(null);
    setBuscadorCliente('');
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setFormCantidad('');
    setFormPrecioUnitario('');
    setFormFecha(getHoy());
    setFormMotivo('');
    setModalOpen(true);
  };

  const seleccionarItem = (item: ItemSeleccionable) => {
    setItemSeleccionado(item);
    setBuscadorItem(item.nombre);
    setMostrarListaItems(false);
    if (item.precio > 0) {
      setFormPrecioUnitario(String(item.precio));
    }
  };

  const seleccionarCliente = (cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    setBuscadorCliente(cliente.nombre);
    setMostrarSugerenciasClientes(false);
    setSugerenciasClientes([]);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setBuscadorCliente('');
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
  };

  const guardarDevolucion = async () => {
    if (!itemSeleccionado) {
      showToast('Selecciona un producto o combo', 'error');
      return;
    }
    if (!formCantidad || parseFloat(formCantidad) <= 0) {
      showToast('Ingresa una cantidad valida', 'error');
      return;
    }
    if (!formPrecioUnitario || parseFloat(formPrecioUnitario) < 0) {
      showToast('Ingresa un precio unitario valido', 'error');
      return;
    }
    if (!formMotivo.trim()) {
      showToast('El motivo es obligatorio', 'error');
      return;
    }
    if (formFecha > getHoy()) {
      showToast('La fecha no puede ser futura', 'error');
      return;
    }

    const localId = localSeleccionado || (localDelUsuario || 1);

    setGuardando(true);
    try {
      await crearDevolucion({
        productoId: itemSeleccionado.tipo === 'producto' ? itemSeleccionado.id : undefined,
        comboId: itemSeleccionado.tipo === 'combo' ? itemSeleccionado.id : undefined,
        localId,
        cantidad: parseFloat(formCantidad),
        precioUnitario: parseFloat(formPrecioUnitario),
        fechaMovimiento: formFecha,
        motivo: formMotivo.trim(),
        clienteId: clienteSeleccionado?.id,
      });
      showToast('Devolucion registrada correctamente', 'success');
      setModalOpen(false);
      cargarMovimientos();
    } catch (err) {
      console.error('Error creando devolucion:', err);
      showToast('Error al registrar devolucion', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // --- Columnas de la tabla ---
  const columnas: { key: string; label: string; hide?: string }[] = [
    { key: 'fechaMovimiento', label: 'Fecha' },
    { key: 'localNombre', label: 'Local', hide: 'hidden sm:table-cell' },
    { key: 'productoNombre', label: 'Producto / Combo' },
    { key: 'clienteNombre', label: 'Cliente', hide: 'hidden sm:table-cell' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'precioUnitario', label: 'Precio Unit.', hide: 'hidden sm:table-cell' },
    { key: 'montoTotal', label: 'Monto Total' },
    { key: 'usuarioNombre', label: 'Usuario', hide: 'hidden md:table-cell' },
    { key: 'observaciones', label: 'Motivo', hide: 'hidden md:table-cell' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Devoluciones</h2>
      </div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select
                className={selectClass + ' w-full'}
                value={localSeleccionado}
                onChange={(e) => setLocalSeleccionado(Number(e.target.value))}
              >
                <option value={0}>Todos los locales</option>
                {locales.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localSeleccionado)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Desde</label>
            <input
              type="date"
              className={inputClass}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Hasta</label>
            <input
              type="date"
              className={inputClass}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
            <select
              className={selectClass}
              value={filtroProducto}
              onChange={(e) =>
                setFiltroProducto(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={cargarMovimientos}
            className="px-4 py-1.5 text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
          <button
            onClick={abrirModal}
            className="px-4 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Devolucion
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columnas.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 transition-colors ${col.hide ?? ''}`}
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
                  Cargando devoluciones...
                </td>
              </tr>
            ) : movimientosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="text-center py-8 text-gray-400">
                  No se encontraron devoluciones
                </td>
              </tr>
            ) : (
              movimientosFiltrados.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`border-b border-gray-100 hover:bg-amber-50/40 transition-colors ${
                    idx % 2 === 1 ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{formatFecha(m.fechaMovimiento)}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">{m.localNombre}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm">{m.productoNombre || (m.observaciones?.split(' - ')[0]) || '-'}</td>
                  <td className="px-3 py-2 text-xs sm:text-sm hidden sm:table-cell">{m.clienteNombre || 'Consumidor Final'}</td>
                  <td className="px-3 py-2 font-semibold whitespace-nowrap text-red-600 text-xs sm:text-sm">-{m.cantidad}</td>
                  <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">{formatMonto(m.precioUnitario)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold text-xs sm:text-sm">{formatMonto(Math.abs(m.montoTotal))}</td>
                  <td className="px-3 py-2 hidden md:table-cell">{m.usuarioNombre || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate hidden md:table-cell">
                    {m.observaciones || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-slate-500 to-slate-700 rounded-lg shadow p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total devoluciones:</span>
          <span className="text-sm font-bold text-white">{movimientosFiltrados.length}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Monto total:</span>
          <span className="text-sm font-bold text-red-400">{formatMonto(montoTotal)}</span>
        </div>
      </div>

      {/* Modal Nueva Devolucion */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">Nueva Devolucion</h3>
            </div>
            <div className="p-5 space-y-4">

              {/* Selector Producto / Combo con buscador */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Producto / Combo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={refBuscadorItem}
                    type="text"
                    className={`${inputClass} w-full pr-8`}
                    placeholder="Buscar producto o combo..."
                    value={buscadorItem}
                    onChange={(e) => {
                      setBuscadorItem(e.target.value);
                      setItemSeleccionado(null);
                      setMostrarListaItems(true);
                    }}
                    onFocus={() => setMostrarListaItems(true)}
                  />
                  {buscadorItem && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setBuscadorItem('');
                        setItemSeleccionado(null);
                        setFormPrecioUnitario('');
                        setMostrarListaItems(false);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {mostrarListaItems && itemsFiltrados.length > 0 && (
                    <div
                      ref={refListaItems}
                      className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-0.5 max-h-52 overflow-y-auto"
                    >
                      {itemsFiltrados.map((item) => (
                        <button
                          key={`${item.tipo}-${item.id}`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            seleccionarItem(item);
                          }}
                        >
                          <span className="truncate">{item.nombre}</span>
                          <span
                            className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold ${
                              item.tipo === 'combo'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.tipo === 'combo' ? 'COMBO' : 'PROD'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {mostrarListaItems && buscadorItem.trim() && itemsFiltrados.length === 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-0.5 px-3 py-2 text-sm text-gray-400">
                      Sin resultados
                    </div>
                  )}
                </div>
                {itemSeleccionado && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    {itemSeleccionado.tipo === 'combo' ? 'Combo' : 'Producto'} seleccionado
                  </p>
                )}
              </div>

              {/* Cliente (opcional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Cliente <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    ref={refBuscadorCliente}
                    type="text"
                    className={`${inputClass} w-full pr-8`}
                    placeholder="Buscar cliente por nombre..."
                    value={buscadorCliente}
                    onChange={(e) => {
                      setBuscadorCliente(e.target.value);
                      if (clienteSeleccionado) setClienteSeleccionado(null);
                    }}
                  />
                  {buscandoClientes && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">...</span>
                  )}
                  {!buscandoClientes && buscadorCliente && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={limpiarCliente}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {mostrarSugerenciasClientes && sugerenciasClientes.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-0.5 max-h-40 overflow-y-auto">
                      {sugerenciasClientes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b border-gray-50 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            seleccionarCliente(c);
                          }}
                        >
                          <span className="font-medium">{c.nombre}</span>
                          {c.telefono && (
                            <span className="ml-2 text-xs text-gray-400">{c.telefono}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {clienteSeleccionado ? (
                    <span className="text-emerald-600 font-medium">Cliente: {clienteSeleccionado.nombre}</span>
                  ) : (
                    'Sin cliente = Consumidor Final'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`${inputClass} w-full`}
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Precio Unitario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`${inputClass} w-full`}
                    value={formPrecioUnitario}
                    onChange={(e) => setFormPrecioUnitario(e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Fecha Movimiento
                </label>
                <input
                  type="date"
                  className={`${inputClass} w-full`}
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  max={getHoy()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`${inputClass} w-full`}
                  rows={2}
                  placeholder="Describe el motivo de la devolucion..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-amber-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDevolucion}
                disabled={guardando}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar Devolucion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
