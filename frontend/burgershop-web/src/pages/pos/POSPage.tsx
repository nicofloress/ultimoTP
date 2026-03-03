import { useEffect, useState } from 'react';
import { Producto, Combo, Categoria, CarritoItem, TipoPedido, Zona } from '../../types';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getCategorias } from '../../api/categorias';
import { crearPedido } from '../../api/pedidos';
import { getZonas } from '../../api/entregas';

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [tipo, setTipo] = useState<TipoPedido>(TipoPedido.ParaLlevar);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [zonaId, setZonaId] = useState<number | undefined>();
  const [descuento, setDescuento] = useState(0);
  const [ticketCreado, setTicketCreado] = useState<string | null>(null);

  useEffect(() => {
    getProductos().then(setProductos);
    getCombos().then(setCombos);
    getCategorias().then(setCategorias);
    getZonas().then(setZonas);
  }, []);

  const agregarProducto = (p: Producto) => {
    const existente = carrito.find(i => i.productoId === p.id);
    if (existente) {
      setCarrito(carrito.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: p.precio }]);
    }
  };

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

  const subtotal = carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  const total = subtotal - descuento;

  const handleCrearPedido = async () => {
    if (carrito.length === 0) return;
    const pedido = await crearPedido({
      tipo,
      nombreCliente: nombreCliente || undefined,
      telefonoCliente: telefonoCliente || undefined,
      direccionEntrega: tipo === TipoPedido.Domicilio ? direccionEntrega : undefined,
      zonaId: tipo === TipoPedido.Domicilio ? zonaId : undefined,
      descuento,
      lineas: carrito.map(item => ({
        productoId: item.productoId,
        comboId: item.comboId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        notas: item.notas,
      })),
    });
    setTicketCreado(pedido.numeroTicket);
    setCarrito([]);
    setNombreCliente('');
    setTelefonoCliente('');
    setDireccionEntrega('');
    setZonaId(undefined);
    setDescuento(0);
  };

  const productosFiltrados = categoriaFiltro
    ? productos.filter(p => p.categoriaId === categoriaFiltro)
    : productos;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Panel izquierdo: Catálogo */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <h2 className="text-xl font-bold mb-3">Catálogo</h2>

        {/* Filtro por categoría */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setCategoriaFiltro(null)} className={`px-3 py-1 rounded text-sm ${!categoriaFiltro ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>Todos</button>
          {categorias.filter(c => c.activa).map(c => (
            <button key={c.id} onClick={() => setCategoriaFiltro(c.id)} className={`px-3 py-1 rounded text-sm ${categoriaFiltro === c.id ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>{c.nombre}</button>
          ))}
          <button onClick={() => setCategoriaFiltro(-1)} className={`px-3 py-1 rounded text-sm ${categoriaFiltro === -1 ? 'bg-amber-600 text-white' : 'bg-purple-100 text-purple-800'}`}>Combos</button>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
          {categoriaFiltro === -1 ? (
            combos.map(c => (
              <button key={`combo-${c.id}`} onClick={() => agregarCombo(c)} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-left hover:border-purple-400 transition-colors">
                <div className="font-medium text-sm">{c.nombre}</div>
                <div className="text-purple-600 font-bold">${c.precio.toLocaleString()}</div>
              </button>
            ))
          ) : (
            productosFiltrados.map(p => (
              <button key={`prod-${p.id}`} onClick={() => agregarProducto(p)} className="bg-white border-2 border-gray-200 rounded-lg p-3 text-left hover:border-amber-400 transition-colors">
                <div className="font-medium text-sm">{p.nombre}</div>
                <div className="text-xs text-gray-500">{p.categoriaNombre}</div>
                <div className="text-amber-600 font-bold">${p.precio.toLocaleString()}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Panel derecho: Carrito */}
      <div className="w-96 bg-white rounded-lg shadow flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Carrito</h2>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setTipo(TipoPedido.ParaLlevar)} className={`flex-1 py-1 rounded text-sm ${tipo === TipoPedido.ParaLlevar ? 'bg-amber-600 text-white' : 'bg-gray-100'}`}>Para Llevar</button>
            <button onClick={() => setTipo(TipoPedido.Domicilio)} className={`flex-1 py-1 rounded text-sm ${tipo === TipoPedido.Domicilio ? 'bg-amber-600 text-white' : 'bg-gray-100'}`}>Domicilio</button>
          </div>
        </div>

        {/* Info cliente */}
        <div className="p-4 border-b space-y-2">
          <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Nombre del cliente" className="w-full border rounded px-2 py-1 text-sm" />
          <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} placeholder="Teléfono" className="w-full border rounded px-2 py-1 text-sm" />
          {tipo === TipoPedido.Domicilio && (
            <>
              <input type="text" value={direccionEntrega} onChange={e => setDireccionEntrega(e.target.value)} placeholder="Dirección de entrega" className="w-full border rounded px-2 py-1 text-sm" />
              <select value={zonaId || ''} onChange={e => setZonaId(Number(e.target.value) || undefined)} className="w-full border rounded px-2 py-1 text-sm">
                <option value="">Seleccionar zona</option>
                {zonas.filter(z => z.activa).map(z => <option key={z.id} value={z.id}>{z.nombre} (+${z.costoEnvio})</option>)}
              </select>
            </>
          )}
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4">
          {carrito.length === 0 && <p className="text-gray-400 text-center text-sm">Agregá productos al carrito</p>}
          {carrito.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-3 pb-3 border-b">
              <div className="flex-1">
                <div className="text-sm font-medium">{item.nombre}</div>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" value={item.cantidad} onChange={e => actualizarItem(i, 'cantidad', Number(e.target.value))} className="border rounded w-14 px-1 py-0.5 text-sm text-center" min={1} />
                  <span className="text-xs text-gray-500">x</span>
                  <input type="number" value={item.precioUnitario} onChange={e => actualizarItem(i, 'precioUnitario', Number(e.target.value))} className="border rounded w-24 px-1 py-0.5 text-sm text-right" min={0} step={100} />
                </div>
                <input type="text" value={item.notas || ''} onChange={e => actualizarItem(i, 'notas', e.target.value)} placeholder="Notas..." className="mt-1 w-full border rounded px-1 py-0.5 text-xs" />
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">${(item.precioUnitario * item.cantidad).toLocaleString()}</div>
                <button onClick={() => eliminarItem(i)} className="text-red-500 text-xs hover:underline">Quitar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Totales y botón */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-1 items-center">
            <span>Descuento</span>
            <input type="number" value={descuento} onChange={e => setDescuento(Number(e.target.value))} className="border rounded w-24 px-2 py-0.5 text-sm text-right" min={0} step={100} />
          </div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
            <span>Total</span>
            <span className="text-amber-600">${total.toLocaleString()}</span>
          </div>
          <button onClick={handleCrearPedido} disabled={carrito.length === 0} className="w-full mt-3 bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
            Crear Pedido
          </button>
          {ticketCreado && (
            <div className="mt-2 text-center text-green-700 bg-green-50 rounded py-2 text-sm font-medium">
              Pedido creado: {ticketCreado}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
