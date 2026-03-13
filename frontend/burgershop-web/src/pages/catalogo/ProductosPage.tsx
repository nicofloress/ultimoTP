import { useEffect, useState } from 'react';
import { Producto, Categoria } from '../../types';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';

const emptyForm = { nombre: '', descripcion: '', precio: 0, categoriaId: 0, imagenUrl: '', numeroInterno: '', pesoGramos: 0, unidadesPorBulto: 1, marca: '', unidadesPorMedia: 0 };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === RolUsuario.Administrador;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => {
    getProductos().then(setProductos);
    getCategorias().then(setCategorias);
  };

  useEffect(() => { cargar(); }, []);

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

  const productosFiltrados = busqueda
    ? productos.filter(p => {
        const term = busqueda.toLowerCase();
        return (p.numeroInterno?.toLowerCase().includes(term)) || p.nombre.toLowerCase().includes(term) || (p.descripcion?.toLowerCase().includes(term));
      })
    : productos;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        {esAdmin && (
          <button onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
            {showForm ? 'Cerrar' : 'Nuevo Producto'}
          </button>
        )}
      </div>

      {showForm && esAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="border rounded px-3 py-2" required>
            <option value={0}>Seleccionar categoria</option>
            {categorias.filter(c => c.activa).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2" />
          <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="Precio" className="border rounded px-3 py-2" min={0} step={0.01} required />
          <input type="text" value={form.numeroInterno} onChange={e => setForm({ ...form, numeroInterno: e.target.value })} placeholder="Numero interno (ej: HAM-001)" className="border rounded px-3 py-2" />
          <input type="text" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Marca (ej: La Conquista, Finexcor...)" className="border rounded px-3 py-2" />
          <input type="number" value={form.pesoGramos} onChange={e => setForm({ ...form, pesoGramos: Number(e.target.value) })} placeholder="Peso en gramos" className="border rounded px-3 py-2" min={0} />
          <input type="number" value={form.unidadesPorBulto} onChange={e => setForm({ ...form, unidadesPorBulto: Number(e.target.value) })} placeholder="Unidades por bulto" className="border rounded px-3 py-2" min={1} />
          <input type="number" value={form.unidadesPorMedia} onChange={e => setForm({ ...form, unidadesPorMedia: Number(e.target.value) })} placeholder="Unidades por media" className="border rounded px-3 py-2" min={0} />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editando ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por codigo o nombre..." className="w-full border rounded px-3 py-2 mb-4 text-sm" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productosFiltrados.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{p.nombre}</h3>
                <p className="text-sm text-gray-500">{p.categoriaNombre}</p>
                {p.numeroInterno && <p className="text-xs text-gray-400">{p.numeroInterno}</p>}
                {p.marca && <p className="text-xs text-gray-400">Marca: {p.marca}</p>}
                {p.unidadesPorMedia > 0 && <p className="text-xs text-gray-400">Media: {p.unidadesPorMedia} | Bulto: {p.unidadesPorBulto}</p>}
                {p.descripcion && <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>}
              </div>
              <span className="text-lg font-bold text-amber-600">${p.precio.toLocaleString()}</span>
            </div>
            {esAdmin && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleEditar(p)} className="text-sm text-blue-600 hover:underline">Editar</button>
                <button onClick={() => setConfirmacion({ visible: true, id: p.id })} className="text-sm text-red-600 hover:underline">Desactivar</button>
              </div>
            )}
          </div>
        ))}
      </div>

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
