import { useEffect, useState } from 'react';
import { Producto, Categoria } from '../../types';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../api/productos';
import { getCategorias } from '../../api/categorias';

const emptyForm = { nombre: '', descripcion: '', precio: 0, categoriaId: 0, imagenUrl: '' };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoriaId: p.categoriaId, imagenUrl: p.imagenUrl || '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
          {showForm ? 'Cerrar' : 'Nuevo Producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="border rounded px-3 py-2" required>
            <option value={0}>Seleccionar categoría</option>
            {categorias.filter(c => c.activa).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className="border rounded px-3 py-2" />
          <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="Precio" className="border rounded px-3 py-2" min={0} step={0.01} required />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editando ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{p.nombre}</h3>
                <p className="text-sm text-gray-500">{p.categoriaNombre}</p>
                {p.descripcion && <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>}
              </div>
              <span className="text-lg font-bold text-amber-600">${p.precio.toLocaleString()}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => handleEditar(p)} className="text-sm text-blue-600 hover:underline">Editar</button>
              <button onClick={async () => { if (confirm('¿Desactivar?')) { await deleteProducto(p.id); cargar(); } }} className="text-sm text-red-600 hover:underline">Desactivar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
