import { Producto } from '../../../types';
import { formatearNumero } from '../../../components/NumericInput';
import ProductoSelect from '../../../components/ProductoSelect';

export interface ComboDetalleForm {
  productoId: number;
  cantidad: number;
}

interface Props {
  nombre: string;
  setNombre: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  precio: number;
  setPrecio: (v: number) => void;
  detalles: ComboDetalleForm[];
  setDetalles: (v: ComboDetalleForm[]) => void;
  esOferta: boolean;
  setEsOferta: (v: boolean) => void;
  productos: Producto[];
  editando: boolean;
  esSuperAdmin: boolean;
  guardando: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function ComboForm({
  nombre, setNombre, descripcion, setDescripcion, precio, setPrecio,
  detalles, setDetalles, esOferta, setEsOferta, productos,
  editando, esSuperAdmin, guardando, onSubmit, onCancel,
}: Props) {
  const costoEstimado = detalles.reduce((sum, d) => {
    const prod = productos.find(p => p.id === d.productoId);
    return sum + (prod?.precioCosto ?? 0) * d.cantidad;
  }, 0);

  return (
    <form onSubmit={onSubmit} className="bg-white p-4 rounded-lg shadow mb-3 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del combo" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
          <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Precio Venta del Combo</label>
          <input type="number" value={precio} onChange={e => setPrecio(Number(e.target.value))} placeholder="Precio combo" className="border rounded px-3 py-2 w-full" min={0} step={0.01} required />
        </div>
      </div>
      {esSuperAdmin && detalles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700 flex items-center gap-4 flex-wrap">
          <span><span className="font-semibold">Costo estimado:</span> ${formatearNumero(costoEstimado)}</span>
          {precio > 0 && (
            <span><span className="font-semibold">Margen:</span> <span className={precio - costoEstimado > 0 ? 'text-green-700' : 'text-red-700'}>
              ${formatearNumero(precio - costoEstimado)}
            </span></span>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={esOferta} onChange={e => setEsOferta(e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
        Oferta Semanal
      </label>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-gray-600">Productos del combo</label>
          <button type="button" onClick={() => setDetalles([...detalles, { productoId: 0, cantidad: 1 }])} className="text-sm text-amber-600 hover:underline">+ Agregar producto</button>
        </div>
        {detalles.map((d, i) => {
          const prod = productos.find(p => p.id === d.productoId);
          const um = prod?.unidadMinima ?? 1;
          const totalUn = d.cantidad * um;
          return (
            <div key={i} className="flex flex-wrap gap-2 mb-2 items-center">
              <ProductoSelect
                productos={productos}
                onlyActivos={false}
                value={d.productoId || ''}
                onChange={id => { const n = [...detalles]; n[i].productoId = id === '' ? 0 : id; setDetalles(n); }}
                className="flex-1 min-w-[160px]"
                placeholder="Seleccionar producto"
                renderSuffix={p => `($${p.precio})`}
              />
              <div className="flex items-center gap-2">
                <input type="number" value={d.cantidad} onChange={e => { const n = [...detalles]; n[i].cantidad = Number(e.target.value); setDetalles(n); }} className="border rounded px-3 py-2 w-20" min={1} />
                {prod && d.cantidad > 0 && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">= {totalUn} un.</span>
                )}
                <button type="button" onClick={() => setDetalles(detalles.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 px-2" aria-label="Quitar producto">X</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className="text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar Combo' : 'Crear Combo')}</button>
        <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
      </div>
    </form>
  );
}
