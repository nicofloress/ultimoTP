import { useEffect, useState } from 'react';
import { getLocales, LocalDto } from '../../api/locales';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { Producto, Combo } from '../../types';
import {
  getPromociones,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  PromocionDto,
  CrearPromocionItemDto,
} from '../../api/promociones';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFechaCorta(fecha: string) {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function getBadgeEstado(p: PromocionDto) {
  const hoy = getHoy();
  const desde = p.fechaDesde.split('T')[0];
  const hasta = p.fechaHasta.split('T')[0];
  if (!p.activa) return { label: 'Inactiva', cls: 'bg-gray-100 text-gray-600' };
  if (hoy < desde) return { label: 'Proxima', cls: 'bg-blue-100 text-blue-700' };
  if (hoy > hasta) return { label: 'Vencida', cls: 'bg-red-100 text-red-700' };
  return { label: 'Vigente', cls: 'bg-green-100 text-green-700' };
}

interface ItemFila {
  tipo: 'producto' | 'combo';
  productoId?: number;
  comboId?: number;
  precioPromo?: number | '';
}

export default function PromocionesPage() {
  const { showToast } = useGlobalToast();

  // Data
  const [promociones, setPromociones] = useState<PromocionDto[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);

  // Form toggle
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<PromocionDto | null>(null);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<number>(1);
  const [valorDescuento, setValorDescuento] = useState<number | ''>('');
  const [localIds, setLocalIds] = useState<number[]>([]);
  const [items, setItems] = useState<ItemFila[]>([]);

  // Confirm modal
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    getPromociones().then(setPromociones).catch(() => {});
  };

  useEffect(() => {
    cargar();
    getLocales().then(setLocales).catch(() => {});
    getProductos().then(setProductos).catch(() => {});
    getCombos().then(setCombos).catch(() => {});
  }, []);

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setFechaDesde('');
    setFechaHasta('');
    setTipoDescuento(1);
    setValorDescuento('');
    setLocalIds([]);
    setItems([]);
    setEditando(null);
    setShowForm(false);
  };

  const handleEditar = (p: PromocionDto) => {
    setEditando(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setFechaDesde(p.fechaDesde.split('T')[0]);
    setFechaHasta(p.fechaHasta.split('T')[0]);
    setTipoDescuento(p.tipoDescuento);
    setValorDescuento(p.valorDescuento);
    setLocalIds(p.locales.map(l => l.localId));
    setItems(
      p.items.map(it => ({
        tipo: it.productoId ? 'producto' as const : 'combo' as const,
        productoId: it.productoId || undefined,
        comboId: it.comboId || undefined,
        precioPromo: it.precioPromo ?? '',
      }))
    );
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !fechaDesde || !fechaHasta || valorDescuento === '') {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    const itemsDto: CrearPromocionItemDto[] = items
      .filter(it => it.productoId || it.comboId)
      .map(it => ({
        productoId: it.tipo === 'producto' ? it.productoId : undefined,
        comboId: it.tipo === 'combo' ? it.comboId : undefined,
        precioPromo: it.precioPromo !== '' ? Number(it.precioPromo) : undefined,
      }));

    setGuardando(true);
    try {
      if (editando) {
        await actualizarPromocion(editando.id, {
          nombre,
          descripcion: descripcion || undefined,
          fechaDesde,
          fechaHasta,
          tipoDescuento,
          valorDescuento: Number(valorDescuento),
          items: itemsDto,
          localIds,
          activa: editando.activa,
        });
        showToast('Promocion actualizada correctamente', 'success');
      } else {
        await crearPromocion({
          nombre,
          descripcion: descripcion || undefined,
          fechaDesde,
          fechaHasta,
          tipoDescuento,
          valorDescuento: Number(valorDescuento),
          items: itemsDto,
          localIds,
        });
        showToast('Promocion creada correctamente', 'success');
      }
      resetForm();
      cargar();
    } catch {
      showToast('Error al guardar la promocion', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarDesactivar = async () => {
    setGuardando(true);
    try {
      await eliminarPromocion(confirmacion.id);
      showToast('Promocion desactivada correctamente', 'success');
    } catch {
      showToast('Error al desactivar la promocion', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  const toggleLocal = (id: number) => {
    setLocalIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const agregarItem = () => {
    setItems([...items, { tipo: 'producto', productoId: undefined, comboId: undefined, precioPromo: '' }]);
  };

  const actualizarItem = (idx: number, campo: Partial<ItemFila>) => {
    const nuevos = [...items];
    nuevos[idx] = { ...nuevos[idx], ...campo };
    // Reset ids al cambiar tipo
    if (campo.tipo) {
      nuevos[idx].productoId = undefined;
      nuevos[idx].comboId = undefined;
    }
    setItems(nuevos);
  };

  const quitarItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const descuentoTexto = (p: PromocionDto) =>
    p.tipoDescuento === 1 ? `${p.valorDescuento}% OFF` : `$${p.valorDescuento.toLocaleString()} OFF`;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Promociones</h2>
        <button
          onClick={() => { if (showForm) { resetForm(); } else { resetForm(); setShowForm(true); } }}
          className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-1.5"
        >
          {showForm ? 'Cerrar' : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Promocion
            </>
          )}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Desde *</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Hasta *</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Descuento</label>
              <select
                value={tipoDescuento}
                onChange={e => setTipoDescuento(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value={1}>Porcentaje</option>
                <option value={2}>Monto Fijo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor Descuento *</label>
              <input
                type="number"
                value={valorDescuento}
                onChange={e => setValorDescuento(e.target.value === '' ? '' : Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                min={0}
                step="any"
                required
              />
            </div>
          </div>

          {/* Locales - checkboxes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Locales</label>
            <div className="flex flex-wrap gap-3">
              {locales.map(l => (
                <label key={l.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localIds.includes(l.id)}
                    onChange={() => toggleLocal(l.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                  />
                  {l.nombre}
                </label>
              ))}
            </div>
          </div>

          {/* Info descuento */}
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700">
            <span className="font-semibold">Descuento general</span> se aplica a todos los productos/combos de la promo.
            Si un item tiene <span className="font-semibold">Precio Promo</span>, ese precio fijo reemplaza al descuento general para ese item.
          </div>

          {/* Items de la promo */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-gray-600">Items de la Promocion</label>
              <button
                type="button"
                onClick={agregarItem}
                className="text-sm text-amber-600 hover:underline font-medium"
              >
                + Agregar item
              </button>
            </div>
            {items.length === 0 && (
              <p className="text-xs text-gray-400">No hay items. Agrega productos o combos a la promocion.</p>
            )}
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  value={item.tipo}
                  onChange={e => actualizarItem(idx, { tipo: e.target.value as 'producto' | 'combo' })}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-28"
                >
                  <option value="producto">Producto</option>
                  <option value="combo">Combo</option>
                </select>
                {item.tipo === 'producto' ? (
                  <select
                    value={item.productoId || ''}
                    onChange={e => actualizarItem(idx, { productoId: e.target.value ? Number(e.target.value) : undefined })}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.filter(p => p.activo).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={item.comboId || ''}
                    onChange={e => actualizarItem(idx, { comboId: e.target.value ? Number(e.target.value) : undefined })}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1"
                  >
                    <option value="">Seleccionar combo...</option>
                    {combos.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (${c.precio})</option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  value={item.precioPromo}
                  onChange={e => actualizarItem(idx, { precioPromo: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="Precio promo (opc)"
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  min={0}
                  step="any"
                />
                <button
                  type="button"
                  onClick={() => quitarItem(idx)}
                  className="text-red-500 hover:text-red-700 px-2 font-bold"
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando...' : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {editando ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de promociones como cards */}
      {promociones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No hay promociones registradas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promociones.map(p => {
            const badge = getBadgeEstado(p);
            return (
              <div key={p.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{p.nombre}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    {p.descripcion && <p className="text-sm text-gray-500">{p.descripcion}</p>}
                  </div>
                  <span className="text-lg font-bold text-amber-600 whitespace-nowrap ml-2">
                    {descuentoTexto(p)}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  Del {formatFechaCorta(p.fechaDesde)} al {formatFechaCorta(p.fechaHasta)}
                </div>

                {/* Locales badges */}
                {p.locales.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.locales.map(l => (
                      <span key={l.localId} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {l.localNombre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Items */}
                {p.items.length > 0 && (
                  <ul className="text-sm text-gray-600 mb-3">
                    {p.items.map((it, idx) => (
                      <li key={idx}>
                        - {it.productoNombre || it.comboNombre}
                        {it.precioPromo != null && it.precioPromo > 0 && (
                          <span className="text-amber-600 font-semibold ml-1">(${it.precioPromo.toLocaleString()})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handleEditar(p)} className="text-sm text-blue-600 hover:underline">
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmacion({ visible: true, id: p.id })}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Desactivar promocion"
        mensaje="¿Desactivar esta promocion?"
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
