import { useEffect, useState } from 'react';
import { getLocales, LocalDto } from '../../api/locales';
import { getProductos } from '../../api/productos';
import { getCombos } from '../../api/combos';
import { getFormasPagoActivas } from '../../api/formasPago';
import { FormaPago, Producto, Combo } from '../../types';
import {
  getPromociones,
  crearPromocion,
  actualizarPromocion,
  desactivarPromocion,
  eliminarPromocion,
  PromocionDto,
  CrearPromocionItemDto,
  TipoBeneficio,
  TipoCondicion,
  CrearPromocionCondicionDto,
} from '../../api/promociones';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';
import ProductoSelect from '../../components/ProductoSelect';

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

const TIPO_BENEFICIO_LABEL: Record<number, string> = {
  [TipoBeneficio.PorcentajeDescuento]: 'Descuento porcentual',
  [TipoBeneficio.MontoFijoDescuento]: 'Descuento monto fijo',
  [TipoBeneficio.PrecioFijoItems]: 'Precio fijo en items',
  [TipoBeneficio.ReintegroPorcentaje]: 'Reintegro porcentual',
  [TipoBeneficio.ReintegroMonto]: 'Reintegro monto fijo',
};

const TIPO_CONDICION_LABEL: Record<number, string> = {
  [TipoCondicion.DiaSemana]: 'Día de la semana',
  [TipoCondicion.FormaPago]: 'Forma de pago',
  [TipoCondicion.MontoMinimo]: 'Monto mínimo',
  [TipoCondicion.Horario]: 'Horario',
  [TipoCondicion.CantidadMinima]: 'Cantidad mínima de items',
};

const CONDICIONES_DISPONIBLES = [
  TipoCondicion.DiaSemana,
  TipoCondicion.FormaPago,
  TipoCondicion.MontoMinimo,
  TipoCondicion.Horario,
  TipoCondicion.CantidadMinima,
];

const DIAS_SEMANA = [
  { num: 0, nombre: 'Dom' },
  { num: 1, nombre: 'Lun' },
  { num: 2, nombre: 'Mar' },
  { num: 3, nombre: 'Mié' },
  { num: 4, nombre: 'Jue' },
  { num: 5, nombre: 'Vie' },
  { num: 6, nombre: 'Sáb' },
];

interface ItemFila {
  tipo: 'producto' | 'combo';
  productoId?: number;
  comboId?: number;
  precioPromo?: number | '';
}

interface CondicionFila {
  tipo: TipoCondicion;
  valor: string;
}

function valorPorDefecto(tipo: TipoCondicion): string {
  switch (tipo) {
    case TipoCondicion.DiaSemana: return '[]';
    case TipoCondicion.FormaPago: return '[]';
    case TipoCondicion.MontoMinimo: return '0';
    case TipoCondicion.Horario: return JSON.stringify({ desde: '00:00', hasta: '23:59' });
    case TipoCondicion.CantidadMinima: return '1';
    default: return '';
  }
}

export default function PromocionesPage() {
  const { showToast } = useGlobalToast();

  const [promociones, setPromociones] = useState<PromocionDto[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<PromocionDto | null>(null);

  // Bloque general
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [localIds, setLocalIds] = useState<number[]>([]);
  const [tiposVenta, setTiposVenta] = useState<number[]>([]);

  // Bloque beneficio
  const [tipoBeneficio, setTipoBeneficio] = useState<TipoBeneficio>(TipoBeneficio.PorcentajeDescuento);
  const [valorBeneficio, setValorBeneficio] = useState<number | ''>('');
  const [topeMaximo, setTopeMaximo] = useState<number | ''>('');

  // Bloque condiciones
  const [condiciones, setCondiciones] = useState<CondicionFila[]>([]);

  // Bloque items
  const [items, setItems] = useState<ItemFila[]>([]);

  // Avanzado
  const [acumulable, setAcumulable] = useState<boolean>(true);
  const [prioridad, setPrioridad] = useState<number>(0);
  const [showAvanzado, setShowAvanzado] = useState(false);

  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number; tipo: 'desactivar' | 'eliminar' }>({ visible: false, id: 0, tipo: 'desactivar' });
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    getPromociones().then(setPromociones).catch(() => {});
  };

  useEffect(() => {
    cargar();
    getLocales().then(setLocales).catch(() => {});
    getProductos().then(setProductos).catch(() => {});
    getCombos().then(setCombos).catch(() => {});
    getFormasPagoActivas().then(setFormasPago).catch(() => {});
  }, []);

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setFechaDesde('');
    setFechaHasta('');
    setLocalIds([]);
    setTiposVenta([]);
    setTipoBeneficio(TipoBeneficio.PorcentajeDescuento);
    setValorBeneficio('');
    setTopeMaximo('');
    setCondiciones([]);
    setItems([]);
    setAcumulable(true);
    setPrioridad(0);
    setShowAvanzado(false);
    setEditando(null);
    setShowForm(false);
  };

  const handleEditar = (p: PromocionDto) => {
    setEditando(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setFechaDesde(p.fechaDesde.split('T')[0]);
    setFechaHasta(p.fechaHasta.split('T')[0]);
    setLocalIds(p.locales.map(l => l.localId));
    setTiposVenta(p.tiposVenta ?? []);
    setTipoBeneficio(p.tipoBeneficio);
    setValorBeneficio(p.valorBeneficio);
    setTopeMaximo(p.topeMaximo ?? '');
    setCondiciones((p.condiciones ?? []).map(c => ({ tipo: c.tipo, valor: c.valor })));
    setItems(
      p.items.map(it => ({
        tipo: it.productoId ? 'producto' as const : 'combo' as const,
        productoId: it.productoId || undefined,
        comboId: it.comboId || undefined,
        precioPromo: it.precioPromo ?? '',
      }))
    );
    setAcumulable(p.acumulable);
    setPrioridad(p.prioridad);
    setShowAvanzado(!p.acumulable || p.prioridad !== 0);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiereValor = tipoBeneficio !== TipoBeneficio.PrecioFijoItems;
    if (!nombre || !fechaDesde || !fechaHasta || (requiereValor && valorBeneficio === '')) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    if (tipoBeneficio === TipoBeneficio.PrecioFijoItems && items.filter(it => it.productoId || it.comboId).length === 0) {
      showToast('Agregá al menos un item con su precio promo', 'error');
      return;
    }
    const itemsDto: CrearPromocionItemDto[] = items
      .filter(it => it.productoId || it.comboId)
      .map(it => ({
        productoId: it.tipo === 'producto' ? it.productoId : undefined,
        comboId: it.tipo === 'combo' ? it.comboId : undefined,
        precioPromo: it.precioPromo !== '' ? Number(it.precioPromo) : undefined,
      }));

    const condicionesDto: CrearPromocionCondicionDto[] = condiciones.map(c => ({
      tipo: c.tipo,
      valor: c.valor,
    }));

    const payloadComun = {
      nombre,
      descripcion: descripcion || undefined,
      fechaDesde,
      fechaHasta,
      tipoBeneficio,
      valorBeneficio: tipoBeneficio === TipoBeneficio.PrecioFijoItems ? 0 : Number(valorBeneficio),
      topeMaximo: tipoBeneficio === TipoBeneficio.PrecioFijoItems || topeMaximo === '' ? undefined : Number(topeMaximo),
      acumulable,
      prioridad,
      items: itemsDto,
      localIds,
      tiposVenta: tiposVenta.length > 0 ? tiposVenta : undefined,
      condiciones: condicionesDto.length > 0 ? condicionesDto : undefined,
    };

    setGuardando(true);
    try {
      if (editando) {
        await actualizarPromocion(editando.id, { ...payloadComun, activa: editando.activa });
        showToast('Promocion actualizada correctamente', 'success');
      } else {
        await crearPromocion(payloadComun);
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

  const confirmarAccion = async () => {
    setGuardando(true);
    try {
      if (confirmacion.tipo === 'eliminar') {
        await eliminarPromocion(confirmacion.id);
        showToast('Promocion eliminada correctamente', 'success');
      } else {
        await desactivarPromocion(confirmacion.id);
        showToast('Promocion desactivada correctamente', 'success');
      }
    } catch {
      showToast(`Error al ${confirmacion.tipo} la promocion`, 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, id: 0, tipo: 'desactivar' });
    cargar();
  };

  const toggleLocal = (id: number) => {
    setLocalIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleTipoVenta = (tv: number) => {
    setTiposVenta(prev => prev.includes(tv) ? prev.filter(t => t !== tv) : [...prev, tv]);
  };

  const agregarItem = () => {
    setItems([...items, { tipo: 'producto', productoId: undefined, comboId: undefined, precioPromo: '' }]);
  };

  const actualizarItem = (idx: number, campo: Partial<ItemFila>) => {
    const nuevos = [...items];
    nuevos[idx] = { ...nuevos[idx], ...campo };
    if (campo.tipo) {
      nuevos[idx].productoId = undefined;
      nuevos[idx].comboId = undefined;
    }
    setItems(nuevos);
  };

  const quitarItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  // Condiciones
  const agregarCondicion = (tipo: TipoCondicion) => {
    setCondiciones([...condiciones, { tipo, valor: valorPorDefecto(tipo) }]);
  };

  const actualizarCondicion = (idx: number, valor: string) => {
    const nuevas = [...condiciones];
    nuevas[idx] = { ...nuevas[idx], valor };
    setCondiciones(nuevas);
  };

  const quitarCondicion = (idx: number) => setCondiciones(condiciones.filter((_, i) => i !== idx));

  const descuentoTexto = (p: PromocionDto) => {
    switch (p.tipoBeneficio) {
      case TipoBeneficio.PorcentajeDescuento: return `${p.valorBeneficio}% OFF`;
      case TipoBeneficio.MontoFijoDescuento: return `$${p.valorBeneficio.toLocaleString()} OFF`;
      case TipoBeneficio.PrecioFijoItems: return 'Precio fijo';
      case TipoBeneficio.ReintegroPorcentaje: return `${p.valorBeneficio}% reintegro`;
      case TipoBeneficio.ReintegroMonto: return `$${p.valorBeneficio.toLocaleString()} reintegro`;
      default: return '';
    }
  };

  const renderEditorCondicion = (cond: CondicionFila, idx: number) => {
    switch (cond.tipo) {
      case TipoCondicion.DiaSemana: {
        let dias: number[] = [];
        try { dias = JSON.parse(cond.valor || '[]'); } catch { dias = []; }
        const toggleDia = (n: number) => {
          const nuevos = dias.includes(n) ? dias.filter(d => d !== n) : [...dias, n].sort();
          actualizarCondicion(idx, JSON.stringify(nuevos));
        };
        return (
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map(d => (
              <label key={d.num} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={dias.includes(d.num)} onChange={() => toggleDia(d.num)} className="rounded" />
                {d.nombre}
              </label>
            ))}
          </div>
        );
      }
      case TipoCondicion.FormaPago: {
        let ids: number[] = [];
        try { ids = JSON.parse(cond.valor || '[]'); } catch { ids = []; }
        const toggleFp = (id: number) => {
          const nuevos = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id].sort();
          actualizarCondicion(idx, JSON.stringify(nuevos));
        };
        return (
          <div className="flex flex-wrap gap-2">
            {formasPago.map(fp => (
              <label key={fp.id} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={ids.includes(fp.id)} onChange={() => toggleFp(fp.id)} className="rounded" />
                {fp.nombre}
              </label>
            ))}
          </div>
        );
      }
      case TipoCondicion.MontoMinimo:
        return (
          <input
            type="number"
            value={cond.valor}
            onChange={e => actualizarCondicion(idx, e.target.value)}
            placeholder="$ mínimo"
            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32"
            min={0}
          />
        );
      case TipoCondicion.CantidadMinima:
        return (
          <input
            type="number"
            value={cond.valor}
            onChange={e => actualizarCondicion(idx, e.target.value)}
            placeholder="N° items"
            className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24"
            min={1}
          />
        );
      case TipoCondicion.Horario: {
        let rango = { desde: '00:00', hasta: '23:59' };
        try { rango = JSON.parse(cond.valor); } catch { /* default */ }
        const setRango = (campo: 'desde' | 'hasta', val: string) => {
          actualizarCondicion(idx, JSON.stringify({ ...rango, [campo]: val }));
        };
        return (
          <div className="flex items-center gap-2">
            <input type="time" value={rango.desde} onChange={e => setRango('desde', e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm" />
            <span className="text-xs text-gray-500">a</span>
            <input type="time" value={rango.hasta} onChange={e => setRango('hasta', e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm" />
          </div>
        );
      }
      default:
        return <span className="text-xs text-gray-400">Editor no implementado</span>;
    }
  };

  const renderResumenCondicion = (c: { tipo: TipoCondicion; valor: string }) => {
    try {
      switch (c.tipo) {
        case TipoCondicion.DiaSemana: {
          const dias = JSON.parse(c.valor || '[]') as number[];
          if (dias.length === 0) return 'todos los días';
          return dias.map(n => DIAS_SEMANA.find(d => d.num === n)?.nombre).join(', ');
        }
        case TipoCondicion.FormaPago: {
          const ids = JSON.parse(c.valor || '[]') as number[];
          if (ids.length === 0) return 'todas';
          return ids.map(id => formasPago.find(fp => fp.id === id)?.nombre || `#${id}`).join(', ');
        }
        case TipoCondicion.MontoMinimo: return `≥ $${Number(c.valor).toLocaleString()}`;
        case TipoCondicion.CantidadMinima: return `≥ ${c.valor} items`;
        case TipoCondicion.Horario: {
          const r = JSON.parse(c.valor);
          return `${r.desde} - ${r.hasta}`;
        }
        default: return c.valor;
      }
    } catch { return c.valor; }
  };

  const tiposCondicionFaltantes = CONDICIONES_DISPONIBLES.filter(t => !condiciones.some(c => c.tipo === t));

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-lg font-bold text-white">Promociones</h2>
        <button
          onClick={() => { if (showForm) { resetForm(); } else { resetForm(); setShowForm(true); } }}
          className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-4 py-1.5 text-sm font-semibold transition-colors flex items-center gap-1.5"
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

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 space-y-5">
          {/* General */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Datos generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
                <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Desde *</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Hasta *</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Locales</label>
              <div className="flex flex-wrap gap-3">
                {locales.map(l => (
                  <label key={l.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={localIds.includes(l.id)} onChange={() => toggleLocal(l.id)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                    {l.nombre}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Venta</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={tiposVenta.includes(1)} onChange={() => toggleTipoVenta(1)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                  Mostrador
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={tiposVenta.includes(2)} onChange={() => toggleTipoVenta(2)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                  Domicilio
                </label>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Si no se selecciona ninguno, aplica a todos los tipos de venta</p>
            </div>
          </section>

          {/* Beneficio */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Beneficio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select value={tipoBeneficio} onChange={e => setTipoBeneficio(Number(e.target.value) as TipoBeneficio)} className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  {Object.entries(TIPO_BENEFICIO_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor {tipoBeneficio === TipoBeneficio.PrecioFijoItems ? '' : '*'}</label>
                <input
                  type="number"
                  value={tipoBeneficio === TipoBeneficio.PrecioFijoItems ? '' : valorBeneficio}
                  onChange={e => setValorBeneficio(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  min={0}
                  step="any"
                  required={tipoBeneficio !== TipoBeneficio.PrecioFijoItems}
                  disabled={tipoBeneficio === TipoBeneficio.PrecioFijoItems}
                  placeholder={tipoBeneficio === TipoBeneficio.PrecioFijoItems ? 'No aplica' : ''}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tope máximo (opcional)</label>
                <input
                  type="number"
                  value={tipoBeneficio === TipoBeneficio.PrecioFijoItems ? '' : topeMaximo}
                  onChange={e => setTopeMaximo(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  min={0}
                  step="any"
                  placeholder={tipoBeneficio === TipoBeneficio.PrecioFijoItems ? 'No aplica' : 'Sin tope'}
                  disabled={tipoBeneficio === TipoBeneficio.PrecioFijoItems}
                />
              </div>
            </div>
          </section>

          {/* Condiciones */}
          <section className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Condiciones</h3>
              {tiposCondicionFaltantes.length > 0 && (
                <select onChange={e => { if (e.target.value) { agregarCondicion(Number(e.target.value) as TipoCondicion); e.target.value = ''; } }} className="text-sm border border-amber-300 rounded-md px-2 py-1 bg-amber-50 text-amber-700">
                  <option value="">+ Agregar condición</option>
                  {tiposCondicionFaltantes.map(t => (
                    <option key={t} value={t}>{TIPO_CONDICION_LABEL[t]}</option>
                  ))}
                </select>
              )}
            </div>
            {condiciones.length === 0 && (
              <p className="text-xs text-gray-400">Sin condiciones — la promo aplica siempre dentro de la vigencia y locales.</p>
            )}
            <div className="space-y-2">
              {condiciones.map((cond, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700 min-w-[140px]">{TIPO_CONDICION_LABEL[cond.tipo]}</span>
                  <div className="flex-1 min-w-0">{renderEditorCondicion(cond, idx)}</div>
                  <button type="button" onClick={() => quitarCondicion(idx)} className="text-red-500 hover:text-red-700 px-1 font-bold">X</button>
                </div>
              ))}
            </div>
          </section>

          {/* Items */}
          <section className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Items afectados (opcional)</h3>
              <button type="button" onClick={agregarItem} className="text-sm text-amber-600 hover:underline font-medium">+ Agregar item</button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700">
              Si está vacío, el beneficio se aplica al total del pedido. Si tiene items, solo cuando estén en el carrito.
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-center">
                <select value={item.tipo} onChange={e => actualizarItem(idx, { tipo: e.target.value as 'producto' | 'combo' })} className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-28">
                  <option value="producto">Producto</option>
                  <option value="combo">Combo</option>
                </select>
                {item.tipo === 'producto' ? (
                  <ProductoSelect productos={productos} value={item.productoId || ''} onChange={id => actualizarItem(idx, { productoId: id === '' ? undefined : id })} className="flex-1 min-w-[160px]" renderSuffix={p => `($${p.precio})`} />
                ) : (
                  <select value={item.comboId || ''} onChange={e => actualizarItem(idx, { comboId: e.target.value ? Number(e.target.value) : undefined })} className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 min-w-[160px]">
                    <option value="">Seleccionar combo...</option>
                    {combos.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (${c.precio})</option>
                    ))}
                  </select>
                )}
                <input type="number" value={item.precioPromo} onChange={e => actualizarItem(idx, { precioPromo: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Precio promo (opc)" className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-amber-400" min={0} step="any" />
                <button type="button" onClick={() => quitarItem(idx)} className="text-red-500 hover:text-red-700 px-2 font-bold">X</button>
              </div>
            ))}
          </section>

          {/* Avanzado */}
          <section className="border-t pt-4">
            <button type="button" onClick={() => setShowAvanzado(!showAvanzado)} className="text-sm font-bold text-slate-700 uppercase tracking-wide hover:text-amber-600">
              {showAvanzado ? '▾' : '▸'} Avanzado
            </button>
            {showAvanzado && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={acumulable} onChange={e => setAcumulable(e.target.checked)} className="rounded" />
                  Acumulable con otras promociones
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad</label>
                  <input type="number" value={prioridad} onChange={e => setPrioridad(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-32" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Mayor número gana entre no acumulables.</p>
                </div>
              </div>
            )}
          </section>

          <div className="flex gap-2 border-t pt-4">
            <button type="submit" disabled={guardando} className="text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {guardando ? 'Guardando...' : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {editando ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {promociones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No hay promociones registradas</div>
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    {p.descripcion && <p className="text-sm text-gray-500">{p.descripcion}</p>}
                  </div>
                  <span className="text-lg font-bold text-amber-600 whitespace-nowrap ml-2">{descuentoTexto(p)}</span>
                </div>

                <div className="text-xs text-gray-500 mb-2">Del {formatFechaCorta(p.fechaDesde)} al {formatFechaCorta(p.fechaHasta)}</div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {p.locales.map(l => (
                    <span key={l.localId} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">{l.localNombre}</span>
                  ))}
                  {p.tiposVenta && p.tiposVenta.length > 0 ? (
                    p.tiposVenta.map(tv => (
                      <span key={tv} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">{tv === 1 ? 'Mostrador' : tv === 2 ? 'Domicilio' : `Tipo ${tv}`}</span>
                    ))
                  ) : (
                    <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">Todos los tipos</span>
                  )}
                </div>

                {/* Condiciones resumen */}
                {p.condiciones && p.condiciones.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {p.condiciones.map((c, i) => (
                      <div key={i} className="text-xs text-slate-600">
                        <span className="font-semibold">{TIPO_CONDICION_LABEL[c.tipo] || `Tipo ${c.tipo}`}:</span> {renderResumenCondicion(c)}
                      </div>
                    ))}
                  </div>
                )}

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

                <div className="flex gap-3">
                  <button onClick={() => handleEditar(p)} className="text-sm text-blue-600 hover:underline">Editar</button>
                  {p.activa ? (
                    <button onClick={() => setConfirmacion({ visible: true, id: p.id, tipo: 'desactivar' })} className="text-sm text-amber-600 hover:underline flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await actualizarPromocion(p.id, {
                            ...p,
                            activa: true,
                            localIds: p.locales?.map(l => l.localId) || [],
                            items: p.items?.map(i => ({ productoId: i.productoId, comboId: i.comboId, precioPromo: i.precioPromo })) || [],
                            tiposVenta: p.tiposVenta?.length ? p.tiposVenta : undefined,
                            condiciones: p.condiciones?.length ? p.condiciones.map(c => ({ tipo: c.tipo, valor: c.valor })) : undefined,
                          });
                          showToast('Promocion activada', 'success');
                          cargar();
                        } catch { showToast('Error al activar', 'error'); }
                      }}
                      className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Activar
                    </button>
                  )}
                  <button onClick={() => setConfirmacion({ visible: true, id: p.id, tipo: 'eliminar' })} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo={confirmacion.tipo === 'eliminar' ? 'Eliminar promocion' : 'Desactivar promocion'}
        mensaje={confirmacion.tipo === 'eliminar' ? 'Esta accion no se puede deshacer. ¿Eliminar esta promocion?' : '¿Desactivar esta promocion?'}
        tipo={confirmacion.tipo === 'eliminar' ? 'danger' : 'warning'}
        textoConfirmar={confirmacion.tipo === 'eliminar' ? 'Eliminar' : 'Desactivar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmacion({ visible: false, id: 0, tipo: 'desactivar' })}
      />
    </div>
  );
}
