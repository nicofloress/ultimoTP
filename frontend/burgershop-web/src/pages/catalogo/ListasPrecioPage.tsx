import { useEffect, useState } from 'react';
import { ListaPrecio, Producto } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  getListasPrecios,
  crearListaPrecio,
  actualizarListaPrecio,
  eliminarListaPrecio,
  upsertDetalle,
  eliminarDetalle,
  getListaPrecio,
} from '../../api/listasPrecios';
import { getProductos } from '../../api/productos';

export default function ListasPrecioPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState('');
  const [esDefault, setEsDefault] = useState(false);
  const [editando, setEditando] = useState<ListaPrecio | null>(null);
  const [seleccionada, setSeleccionada] = useState<ListaPrecio | null>(null);

  // Detalle form
  const [nuevoProductoId, setNuevoProductoId] = useState<number | ''>('');
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(0);
  const [editandoDetalleProductoId, setEditandoDetalleProductoId] = useState<number | null>(null);
  const [editandoDetallePrecio, setEditandoDetallePrecio] = useState<number>(0);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = async () => {
    const data = await getListasPrecios();
    setListas(data);
    if (seleccionada) {
      const actualizada = data.find(l => l.id === seleccionada.id);
      if (actualizada) setSeleccionada(actualizada);
    }
  };

  const cargarSeleccionada = async (id: number) => {
    const lista = await getListaPrecio(id);
    setSeleccionada(lista);
  };

  useEffect(() => {
    cargar();
    getProductos().then(setProductos);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await actualizarListaPrecio(editando.id, { nombre, esDefault, activa: editando.activa });
    } else {
      await crearListaPrecio({ nombre, esDefault });
    }
    setNombre('');
    setEsDefault(false);
    setEditando(null);
    cargar();
  };

  const handleEditar = (lista: ListaPrecio) => {
    setEditando(lista);
    setNombre(lista.nombre);
    setEsDefault(lista.esDefault);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarListaPrecio(confirmacion.id);
    if (seleccionada?.id === confirmacion.id) setSeleccionada(null);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const handleSeleccionar = (lista: ListaPrecio) => {
    if (seleccionada?.id === lista.id) {
      setSeleccionada(null);
    } else {
      cargarSeleccionada(lista.id);
    }
  };

  const handleAgregarDetalle = async () => {
    if (!seleccionada || !nuevoProductoId || nuevoPrecio <= 0) return;
    await upsertDetalle(seleccionada.id, { productoId: Number(nuevoProductoId), precio: nuevoPrecio });
    setNuevoProductoId('');
    setNuevoPrecio(0);
    cargarSeleccionada(seleccionada.id);
  };

  const handleGuardarDetalle = async (productoId: number) => {
    if (!seleccionada || editandoDetallePrecio <= 0) return;
    await upsertDetalle(seleccionada.id, { productoId, precio: editandoDetallePrecio });
    setEditandoDetalleProductoId(null);
    cargarSeleccionada(seleccionada.id);
  };

  const handleEliminarDetalle = async (productoId: number) => {
    if (!seleccionada) return;
    await eliminarDetalle(seleccionada.id, productoId);
    cargarSeleccionada(seleccionada.id);
  };

  const productosEnLista = seleccionada?.detalles.map(d => d.productoId) || [];
  const productosDisponibles = productos.filter(p => p.activo && !productosEnLista.includes(p.id));

  const getProductoPrecioBase = (productoId: number) => {
    const prod = productos.find(p => p.id === productoId);
    return prod?.precio ?? 0;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Listas de Precios</h1>

      {/* Formulario crear/editar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 items-end">
        <div className="flex-1">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre de la lista"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <label className="flex items-center gap-2 px-3 py-2">
          <input
            type="checkbox"
            checked={esDefault}
            onChange={e => setEsDefault(e.target.checked)}
          />
          <span className="text-sm">Default</span>
        </label>
        <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
          {editando ? 'Actualizar' : 'Crear'}
        </button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setNombre(''); setEsDefault(false); }} className="bg-gray-400 text-white px-4 py-2 rounded">
            Cancelar
          </button>
        )}
      </form>

      {/* Tabla de listas */}
      <div className="bg-white rounded-lg shadow mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Default</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {listas.map(lista => (
              <tr
                key={lista.id}
                className={`cursor-pointer ${seleccionada?.id === lista.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                onClick={() => handleSeleccionar(lista)}
              >
                <td className="px-4 py-3 text-sm">{lista.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{lista.nombre}</td>
                <td className="px-4 py-3 text-sm">
                  {lista.esDefault && (
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Default</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${lista.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {lista.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEditar(lista)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(lista.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {listas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No hay listas de precios</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Subpanel de detalles */}
      {seleccionada && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">
            Detalles: {seleccionada.nombre}
          </h2>

          {/* Agregar producto */}
          <div className="flex gap-2 mb-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Producto</label>
              <select
                value={nuevoProductoId}
                onChange={e => {
                  const pid = Number(e.target.value);
                  setNuevoProductoId(pid || '');
                  if (pid) {
                    const prod = productos.find(p => p.id === pid);
                    if (prod) setNuevoPrecio(prod.precio);
                  }
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Seleccionar producto...</option>
                {productosDisponibles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Precio</label>
              <input
                type="number"
                value={nuevoPrecio}
                onChange={e => setNuevoPrecio(Number(e.target.value))}
                className="border rounded px-3 py-2 w-32 text-sm"
                min={0}
                step={100}
              />
            </div>
            <button
              onClick={handleAgregarDetalle}
              disabled={!nuevoProductoId || nuevoPrecio <= 0}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>

          {/* Tabla de detalles */}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Producto</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Precio Base</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Precio Lista</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {seleccionada.detalles.map(det => (
                <tr key={det.productoId}>
                  <td className="px-4 py-3 text-sm font-medium">{det.productoNombre}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    ${getProductoPrecioBase(det.productoId).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {editandoDetalleProductoId === det.productoId ? (
                      <input
                        type="number"
                        value={editandoDetallePrecio}
                        onChange={e => setEditandoDetallePrecio(Number(e.target.value))}
                        className="border rounded px-2 py-1 w-28 text-sm text-right"
                        min={0}
                        step={100}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleGuardarDetalle(det.productoId);
                          if (e.key === 'Escape') setEditandoDetalleProductoId(null);
                        }}
                      />
                    ) : (
                      <span className={det.precio !== getProductoPrecioBase(det.productoId) ? 'text-amber-600 font-bold' : ''}>
                        ${det.precio.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {editandoDetalleProductoId === det.productoId ? (
                      <>
                        <button onClick={() => handleGuardarDetalle(det.productoId)} className="text-green-600 hover:underline mr-3">Guardar</button>
                        <button onClick={() => setEditandoDetalleProductoId(null)} className="text-gray-500 hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditandoDetalleProductoId(det.productoId);
                            setEditandoDetallePrecio(det.precio);
                          }}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          Editar
                        </button>
                        <button onClick={() => handleEliminarDetalle(det.productoId)} className="text-red-600 hover:underline">Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {seleccionada.detalles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No hay productos en esta lista</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar lista de precios"
        mensaje="¿Eliminar esta lista de precios?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
