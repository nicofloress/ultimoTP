import { useEffect, useState } from 'react';
import { Producto, Categoria, Combo, ListaPrecio } from '../../types';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import { getCombos } from '../../api/combos';
import { getListasPrecios } from '../../api/listasPrecios';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = { nombre: '', descripcion: '', precio: 0, categoriaId: 0, imagenUrl: '', numeroInterno: '', pesoGramos: 0, unidadesPorBulto: 1, marca: '', unidadesPorMedia: 0 };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [listaPrecioId, setListaPrecioId] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  const [verCombos, setVerCombos] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === RolUsuario.Administrador;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);

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

  useEffect(() => { cargar(); }, []);

  // Recargar productos cuando cambia la lista de precios
  useEffect(() => {
    getProductos(undefined, undefined, listaPrecioId ?? undefined).then(setProductos);
  }, [listaPrecioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await updateProducto(editando.id, { ...form, activo: editando.activo });
    } else {
      await createProducto(form);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
  };

  const handleEditar = (p: Producto) => {
    setEditando(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoriaId: p.categoriaId, imagenUrl: p.imagenUrl || '', numeroInterno: p.numeroInterno || '', pesoGramos: p.pesoGramos ?? 0, unidadesPorBulto: p.unidadesPorBulto ?? 1, marca: p.marca || '', unidadesPorMedia: p.unidadesPorMedia ?? 0 });
    setShowForm(true);
  };

  const confirmarDesactivar = async () => {
    await deleteProducto(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  // Obtener precio a mostrar según lista seleccionada
  const getPrecioMostrar = (p: Producto) => {
    if (listaPrecioId && p.precioLista != null) return p.precioLista;
    return p.precio;
  };

  const tienePrecioLista = (p: Producto) => listaPrecioId != null && p.precioLista != null;

  // Filtrado
  const productosFiltrados = productos.filter(p => {
    if (categoriaFiltro && p.categoriaId !== categoriaFiltro) return false;
    if (busqueda) {
      const term = busqueda.toLowerCase();
      return (p.numeroInterno?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term) || (p.descripcion?.toLowerCase().includes(term));
    }
    return true;
  });

  const combosFiltrados = busqueda
    ? combos.filter(c => c.activo && c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : combos.filter(c => c.activo);

  const listaSeleccionada = listas.find(l => l.id === listaPrecioId);

  // Obtener precio de combo en lista seleccionada
  const getPrecioCombo = (combo: Combo) => {
    if (!listaSeleccionada) return combo.precio;
    // Los combos no tienen precio por lista directamente, mostrar precio base
    return combo.precio;
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">Catálogo de Artículos</h1>
        <div className="flex items-center gap-3">
          {/* Selector de lista de precios */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Lista de precios:</label>
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
          {esAdmin && (
            <button onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }} className="bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-700 text-sm">
              {showForm ? 'Cerrar' : 'Nuevo Producto'}
            </button>
          )}
        </div>
      </div>

      {/* Form admin */}
      {showForm && esAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-3 grid grid-cols-2 gap-3 text-sm">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="border rounded px-3 py-2" required>
            <option value={0}>Seleccionar categoria</option>
            {categorias.filter(c => c.activa).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2" />
          <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="Precio" className="border rounded px-3 py-2" min={0} step={0.01} required />
          <input type="text" value={form.numeroInterno} onChange={e => setForm({ ...form, numeroInterno: e.target.value })} placeholder="Numero interno (ej: HAM-001)" className="border rounded px-3 py-2" />
          <input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Marca" className="border rounded px-3 py-2" />
          <input type="number" value={form.pesoGramos} onChange={e => setForm({ ...form, pesoGramos: Number(e.target.value) })} placeholder="Peso en gramos" className="border rounded px-3 py-2" min={0} />
          <input type="number" value={form.unidadesPorBulto} onChange={e => setForm({ ...form, unidadesPorBulto: Number(e.target.value) })} placeholder="Unidades por bulto" className="border rounded px-3 py-2" min={1} />
          <input type="number" value={form.unidadesPorMedia} onChange={e => setForm({ ...form, unidadesPorMedia: Number(e.target.value) })} placeholder="Unidades por media" className="border rounded px-3 py-2" min={0} />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editando ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {/* Buscador */}
      <input
        type="text"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por codigo, nombre o descripcion..."
        className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
      />

      {/* Chips de categorías */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <button
          onClick={() => { setCategoriaFiltro(null); setVerCombos(false); }}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!categoriaFiltro && !verCombos ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todos
        </button>
        {categorias.filter(c => c.activa).map(c => (
          <button
            key={c.id}
            onClick={() => { setCategoriaFiltro(c.id); setVerCombos(false); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${categoriaFiltro === c.id ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {c.nombre}
          </button>
        ))}
        <button
          onClick={() => { setVerCombos(true); setCategoriaFiltro(null); }}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${verCombos ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}
        >
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
        {verCombos ? (
          /* ---- COMBOS ---- */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {combosFiltrados.map(c => (
              <div
                key={`combo-${c.id}`}
                className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setProductoDetalle(null)}
              >
                <div className="font-medium text-sm text-gray-800">{c.nombre}</div>
                {c.descripcion && <div className="text-xs text-gray-500 mt-0.5">{c.descripcion}</div>}
                <div className="text-purple-600 font-bold mt-1">${getPrecioCombo(c).toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 mt-1">{c.detalles.length} productos</div>
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
                className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setProductoDetalle(p)}
              >
                {p.numeroInterno && (
                  <div className="text-[10px] text-gray-400 font-mono">{p.numeroInterno}</div>
                )}
                <div className="font-medium text-sm text-gray-800 group-hover:text-amber-700">{p.nombre}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{p.categoriaNombre}</div>
                {p.marca && <div className="text-[10px] text-gray-400">Marca: {p.marca}</div>}

                {/* Precios */}
                <div className="mt-1.5">
                  {tienePrecioLista(p) ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-amber-600">${getPrecioMostrar(p).toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 line-through">${p.precio.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-amber-600">${p.precio.toLocaleString()}</span>
                  )}
                </div>

                {p.unidadesPorMedia > 0 && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Media: {p.unidadesPorMedia} | Bulto: {p.unidadesPorBulto}
                  </div>
                )}

                {/* Botones admin */}
                {esAdmin && (
                  <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEditar(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => setConfirmacion({ visible: true, id: p.id })} className="text-xs text-red-600 hover:underline">Desactivar</button>
                  </div>
                )}
              </div>
            ))}
            {productosFiltrados.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">No hay productos</div>
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
    </div>
  );
}
