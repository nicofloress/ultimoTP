import { useEffect, useState } from 'react';
import { ListaPrecio, Producto, Combo } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import {
  getListasPrecios,
  crearListaPrecio,
  actualizarListaPrecio,
  eliminarListaPrecio,
  upsertDetalle,
  eliminarDetalle,
  eliminarDetalleCombo,
  getListaPrecio,
} from '../../api/listasPrecios';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';

export default function ListasPrecioPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState<ListaPrecio | null>(null);
  const [seleccionada, setSeleccionada] = useState<ListaPrecio | null>(null);

  // Detalle form
  const [tipoDetalle, setTipoDetalle] = useState<'producto' | 'combo'>('producto');
  const [nuevoItemId, setNuevoItemId] = useState<number | ''>('');
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(0);
  const [editandoDetalleKey, setEditandoDetalleKey] = useState<string | null>(null);
  const [editandoDetallePrecio, setEditandoDetallePrecio] = useState<number>(0);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

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
    getCombos().then(setCombos);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await actualizarListaPrecio(editando.id, { nombre, esDefault: false, activa: editando.activa });
        showToast('Lista de precios actualizada correctamente', 'success');
      } else {
        await crearListaPrecio({ nombre, esDefault: false });
        showToast('Lista de precios creada correctamente', 'success');
      }
      setNombre('');
      setEditando(null);
      cargar();
    } catch {
      showToast('Error al guardar lista de precios', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (lista: ListaPrecio) => {
    setEditando(lista);
    setNombre(lista.nombre);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    try {
      await eliminarListaPrecio(confirmacion.id);
      if (seleccionada?.id === confirmacion.id) setSeleccionada(null);
      showToast('Lista de precios eliminada correctamente', 'success');
    } catch {
      showToast('Error al eliminar lista de precios', 'error');
    } finally {
      setGuardando(false);
    }
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
    if (!seleccionada || !nuevoItemId || nuevoPrecio <= 0) return;
    const dto = tipoDetalle === 'combo'
      ? { comboId: Number(nuevoItemId), precio: nuevoPrecio }
      : { productoId: Number(nuevoItemId), precio: nuevoPrecio };
    await upsertDetalle(seleccionada.id, dto);
    setNuevoItemId('');
    setNuevoPrecio(0);
    cargarSeleccionada(seleccionada.id);
  };

  const handleGuardarDetalle = async (det: { productoId?: number; comboId?: number }) => {
    if (!seleccionada || editandoDetallePrecio <= 0) return;
    const dto = det.comboId
      ? { comboId: det.comboId, precio: editandoDetallePrecio }
      : { productoId: det.productoId, precio: editandoDetallePrecio };
    await upsertDetalle(seleccionada.id, dto);
    setEditandoDetalleKey(null);
    cargarSeleccionada(seleccionada.id);
  };

  const handleEliminarDetalle = async (det: { productoId?: number; comboId?: number }) => {
    if (!seleccionada) return;
    if (det.comboId) {
      await eliminarDetalleCombo(seleccionada.id, det.comboId);
    } else if (det.productoId) {
      await eliminarDetalle(seleccionada.id, det.productoId);
    }
    cargarSeleccionada(seleccionada.id);
  };

  const productosEnLista = seleccionada?.detalles.filter(d => d.productoId).map(d => d.productoId!) || [];
  const combosEnLista = seleccionada?.detalles.filter(d => d.comboId).map(d => d.comboId!) || [];
  const productosDisponibles = productos.filter(p => p.activo && !productosEnLista.includes(p.id));
  const combosDisponibles = combos.filter(c => c.activo && !combosEnLista.includes(c.id));

  const getPrecioBase = (det: { productoId?: number; comboId?: number }) => {
    if (det.comboId) {
      const combo = combos.find(c => c.id === det.comboId);
      return combo?.precio ?? 0;
    }
    const prod = productos.find(p => p.id === det.productoId);
    return prod?.precio ?? 0;
  };

  const detalleKey = (det: { productoId?: number; comboId?: number }) =>
    det.comboId ? `combo-${det.comboId}` : `prod-${det.productoId}`;

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Listas de Precios</h2>
      </div>

      {/* Formulario crear/editar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la Lista</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre de la lista"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
        </button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setNombre(''); }} className="bg-gray-400 text-white px-4 py-2 rounded">
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
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No hay listas de precios</td>
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

          {/* Agregar producto o combo */}
          <div className="flex gap-2 mb-4 items-end">
            <div className="w-32">
              <label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
              <select
                value={tipoDetalle}
                onChange={e => { setTipoDetalle(e.target.value as 'producto' | 'combo'); setNuevoItemId(''); setNuevoPrecio(0); }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="producto">Producto</option>
                <option value="combo">Combo</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">{tipoDetalle === 'combo' ? 'Combo' : 'Producto'}</label>
              <select
                value={nuevoItemId}
                onChange={e => {
                  const id = Number(e.target.value);
                  setNuevoItemId(id || '');
                  if (id) {
                    if (tipoDetalle === 'combo') {
                      const c = combos.find(x => x.id === id);
                      if (c) setNuevoPrecio(c.precio);
                    } else {
                      const p = productos.find(x => x.id === id);
                      if (p) setNuevoPrecio(p.precio);
                    }
                  }
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Seleccionar {tipoDetalle}...</option>
                {tipoDetalle === 'combo'
                  ? combosDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (${c.precio.toLocaleString()})</option>
                    ))
                  : productosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString()})</option>
                    ))
                }
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
              disabled={!nuevoItemId || nuevoPrecio <= 0}
              className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-4 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>

          {/* Tabla de detalles */}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Precio Base</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Precio Lista</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {seleccionada.detalles.map(det => {
                const key = detalleKey(det);
                const esCombo = !!det.comboId;
                const nombreItem = esCombo ? (det.comboNombre || '') : (det.productoNombre || '');
                const precioBase = getPrecioBase(det);
                return (
                  <tr key={key}>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${esCombo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {esCombo ? 'Combo' : 'Producto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{nombreItem}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                      ${precioBase.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {editandoDetalleKey === key ? (
                        <input
                          type="number"
                          value={editandoDetallePrecio}
                          onChange={e => setEditandoDetallePrecio(Number(e.target.value))}
                          className="border rounded px-2 py-1 w-28 text-sm text-right"
                          min={0}
                          step={100}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleGuardarDetalle(det);
                            if (e.key === 'Escape') setEditandoDetalleKey(null);
                          }}
                        />
                      ) : (
                        <span className={det.precio !== precioBase ? 'text-amber-600 font-bold' : ''}>
                          ${det.precio.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {editandoDetalleKey === key ? (
                        <>
                          <button onClick={() => handleGuardarDetalle(det)} className="text-green-600 hover:underline mr-3">Guardar</button>
                          <button onClick={() => setEditandoDetalleKey(null)} className="text-gray-500 hover:underline">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditandoDetalleKey(key);
                              setEditandoDetallePrecio(det.precio);
                            }}
                            className="text-blue-600 hover:underline mr-3"
                          >
                            Editar
                          </button>
                          <button onClick={() => handleEliminarDetalle(det)} className="text-red-600 hover:underline">Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {seleccionada.detalles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No hay productos ni combos en esta lista</td>
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
