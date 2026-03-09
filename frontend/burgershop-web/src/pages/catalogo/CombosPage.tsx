import { useEffect, useState } from 'react';
import { Combo, Producto } from '../../types';
import { getCombos, createCombo, updateCombo, deleteCombo } from '../../api/combos';
import { getProductos } from '../../api/productos';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Combo | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState(0);
  const [detalles, setDetalles] = useState<{ productoId: number; cantidad: number }[]>([]);
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === RolUsuario.Administrador;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => {
    getCombos().then(setCombos);
    getProductos().then(setProductos);
  };

  useEffect(() => { cargar(); }, []);

  const resetForm = () => {
    setNombre(''); setDescripcion(''); setPrecio(0); setDetalles([]); setEditando(null); setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await updateCombo(editando.id, { nombre, descripcion, precio, activo: true, detalles });
    } else {
      await createCombo({ nombre, descripcion, precio, detalles });
    }
    resetForm();
    cargar();
  };

  const handleEditar = (c: Combo) => {
    setEditando(c); setNombre(c.nombre); setDescripcion(c.descripcion || ''); setPrecio(c.precio);
    setDetalles(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad })));
    setShowForm(true);
  };

  const confirmarDesactivar = async () => {
    await deleteCombo(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const agregarDetalle = () => setDetalles([...detalles, { productoId: 0, cantidad: 1 }]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Combos</h1>
        {esAdmin && (
          <button onClick={() => { setShowForm(!showForm); resetForm(); }} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
            {showForm ? 'Cerrar' : 'Nuevo Combo'}
          </button>
        )}
      </div>

      {showForm && esAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="border rounded px-3 py-2" required />
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripcion" className="border rounded px-3 py-2" />
            <input type="number" value={precio} onChange={e => setPrecio(Number(e.target.value))} placeholder="Precio combo" className="border rounded px-3 py-2" min={0} step={0.01} required />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Productos del combo</h3>
              <button type="button" onClick={agregarDetalle} className="text-sm text-amber-600 hover:underline">+ Agregar producto</button>
            </div>
            {detalles.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={d.productoId} onChange={e => { const n = [...detalles]; n[i].productoId = Number(e.target.value); setDetalles(n); }} className="border rounded px-3 py-2 flex-1">
                  <option value={0}>Seleccionar producto</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>)}
                </select>
                <input type="number" value={d.cantidad} onChange={e => { const n = [...detalles]; n[i].cantidad = Number(e.target.value); setDetalles(n); }} className="border rounded px-3 py-2 w-20" min={1} />
                <button type="button" onClick={() => setDetalles(detalles.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 px-2">X</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editando ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {combos.map(c => (
          <div key={c.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{c.nombre}</h3>
                {c.descripcion && <p className="text-sm text-gray-500">{c.descripcion}</p>}
              </div>
              <span className="text-lg font-bold text-amber-600">${c.precio.toLocaleString()}</span>
            </div>
            <ul className="text-sm text-gray-600 mb-3">
              {c.detalles.map(d => (
                <li key={d.productoId}>- {d.productoNombre} x{d.cantidad}</li>
              ))}
            </ul>
            {esAdmin && (
              <div className="flex gap-2">
                <button onClick={() => handleEditar(c)} className="text-sm text-blue-600 hover:underline">Editar</button>
                <button onClick={() => setConfirmacion({ visible: true, id: c.id })} className="text-sm text-red-600 hover:underline">Desactivar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Desactivar combo"
        mensaje="¿Desactivar este combo?"
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
