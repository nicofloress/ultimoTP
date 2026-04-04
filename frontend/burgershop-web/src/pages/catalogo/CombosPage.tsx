import { useEffect, useState, useMemo } from 'react';
import { Combo, Producto, Categoria } from '../../types';
import { getCombos, createCombo, updateCombo, deleteCombo } from '../../api/combos';
import { getProductos } from '../../api/productos';
import { getCategorias } from '../../api/categorias';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [gramajesFiltro, setGramajesFiltro] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Combo | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState(0);
  const [detalles, setDetalles] = useState<{ productoId: number; cantidad: number }[]>([]);
  const { usuario } = useAuth();
  const { showToast } = useGlobalToast();
  const esAdmin = usuario?.rol === RolUsuario.SuperAdmin || usuario?.rol === RolUsuario.Administrador;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => {
    getCombos().then(setCombos);
    getProductos().then(setProductos);
    getCategorias().then(setCategorias);
  };

  useEffect(() => { cargar(); }, []);

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
      { key: 'snacks', label: 'Snacks', catIds: categorias.filter(c => c.nombre === 'Snacks').map(c => c.id) },
    ];
  }, [categorias]);

  const tieneSubfiltro = filtro === 'eco' || filtro === 'premium';

  const gramajesDisponibles = useMemo(() => {
    if (!tieneSubfiltro) return [];
    const mc = megaCategorias.find(m => m.key === filtro);
    if (!mc) return [];
    return productos
      .filter(p => p.activo && mc.catIds.includes(p.categoriaId) && p.pesoGramos)
      .map(p => p.pesoGramos!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }, [productos, filtro, megaCategorias]);

  const combosFiltrados = useMemo(() => {
    let lista = combos.filter(c => c.activo);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(c => c.nombre.toLowerCase().includes(q) || c.descripcion?.toLowerCase().includes(q));
    }
    if (filtro) {
      const mc = megaCategorias.find(m => m.key === filtro);
      if (mc) {
        let prodsEnCat = productos.filter(p => mc.catIds.includes(p.categoriaId));
        if (tieneSubfiltro && gramajesFiltro) {
          prodsEnCat = prodsEnCat.filter(p => p.pesoGramos === gramajesFiltro);
        }
        const prodIds = new Set(prodsEnCat.map(p => p.id));
        lista = lista.filter(c => c.detalles.some(d => prodIds.has(d.productoId)));
      }
    }
    return lista;
  }, [combos, productos, busqueda, filtro, gramajesFiltro, megaCategorias]);

  const resetForm = () => {
    setNombre(''); setDescripcion(''); setPrecio(0); setDetalles([]); setEditando(null); setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await updateCombo(editando.id, { nombre, descripcion, precio, activo: true, detalles });
        showToast('Combo actualizado correctamente', 'success');
      } else {
        await createCombo({ nombre, descripcion, precio, detalles });
        showToast('Combo creado correctamente', 'success');
      }
      resetForm();
      cargar();
    } catch {
      showToast('Error al guardar el combo', 'error');
    }
  };

  const handleEditar = (c: Combo) => {
    setEditando(c); setNombre(c.nombre); setDescripcion(c.descripcion || ''); setPrecio(c.precio);
    setDetalles(c.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad })));
    setShowForm(true);
  };

  const confirmarDesactivar = async () => {
    try {
      await deleteCombo(confirmacion.id);
      showToast('Combo desactivado correctamente', 'success');
    } catch {
      showToast('Error al desactivar combo', 'error');
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const agregarDetalle = () => setDetalles([...detalles, { productoId: 0, cantidad: 1 }]);

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Combos</h2>
        {esAdmin && (
          <button onClick={() => { if (showForm) { resetForm(); } else { setNombre(''); setDescripcion(''); setPrecio(0); setDetalles([]); setEditando(null); setShowForm(true); } }} className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-1.5">
            {showForm ? 'Cerrar' : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo Combo</>)}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setFiltro(null); setGramajesFiltro(null); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!filtro ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {megaCategorias.map(mc => (
            <button key={mc.key} onClick={() => { setFiltro(mc.key); setGramajesFiltro(null); }} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filtro === mc.key ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{mc.label}</button>
          ))}
        </div>
        {tieneSubfiltro && gramajesDisponibles.length > 0 && (
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
                {g}gr
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar combo por nombre..."
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
        <span className="text-xs text-gray-400">{combosFiltrados.length} combo{combosFiltrados.length !== 1 ? 's' : ''}</span>
      </div>

      {showForm && esAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="border rounded px-3 py-2 w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio del Combo</label>
              <input type="number" value={precio} onChange={e => setPrecio(Number(e.target.value))} placeholder="Precio combo" className="border rounded px-3 py-2 w-full" min={0} step={0.01} required />
            </div>
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
        {combosFiltrados.map(c => (
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
