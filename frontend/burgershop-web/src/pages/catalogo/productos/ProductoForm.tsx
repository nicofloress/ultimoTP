import { Categoria } from '../../../types';
import { MarcaDto } from '../../../api/marcas';
import { formatearNumero } from '../../../components/NumericInput';

export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: number;
  imagenUrl: string;
  numeroInterno: string;
  pesoGramos: number;
  unidadesPorBulto: number;
  marca: string;
  unidadesPorMedia: number;
  unidadMinima: number;
  esOfertaSemanal: boolean;
  precioCosto: number;
  precioVenta: number;
  alicuotaIVA: number;
  unidadMedida: string;
}

interface Props {
  form: ProductoFormData;
  setForm: (f: ProductoFormData) => void;
  categorias: Categoria[];
  marcas: MarcaDto[];
  unidadPeso: 'g' | 'kg' | 'ml' | 'L';
  setUnidadPeso: (u: 'g' | 'kg' | 'ml' | 'L') => void;
  editando: boolean;
  esSuperAdmin: boolean;
  guardando: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function ProductoForm({
  form, setForm, categorias, marcas,
  unidadPeso, setUnidadPeso,
  editando, esSuperAdmin, guardando,
  onSubmit, onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-3 sm:p-4 rounded-lg shadow mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
        <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 w-full" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
        <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: Number(e.target.value) })} className="border rounded px-3 py-2 w-full" required>
          <option value={0}>Seleccionar categoria</option>
          {(() => {
            const activas = categorias.filter(c => c.activa);
            const padres = activas.filter(c => !c.categoriaPadreId);
            const result: { id: number; label: string; disabled: boolean }[] = [];
            for (const p of padres) {
              const hijas = activas.filter(c => c.categoriaPadreId === p.id);
              if (hijas.length > 0) {
                result.push({ id: p.id, label: `${p.nombre}`, disabled: true });
                for (const h of hijas) result.push({ id: h.id, label: `  ${h.nombre}`, disabled: false });
              } else {
                result.push({ id: p.id, label: p.nombre, disabled: false });
              }
            }
            return result.map(r => <option key={r.id} value={r.id} disabled={r.disabled} className={r.disabled ? 'font-bold text-gray-400' : ''}>{r.label}</option>);
          })()}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
        <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2 w-full" />
      </div>
      {esSuperAdmin && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Precio Costo</label>
          <input type="number" value={form.precioCosto} onChange={e => setForm({ ...form, precioCosto: Number(e.target.value) })} placeholder="Precio de costo" className="border rounded px-3 py-2 w-full" min={0} step={0.01} />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Precio Venta</label>
        <input type="number" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: Number(e.target.value) })} placeholder="Precio de venta" className="border rounded px-3 py-2 w-full" min={0} step={0.01} required />
      </div>
      {esSuperAdmin && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Margen</label>
          <div className={`border rounded px-3 py-2 w-full text-sm font-medium ${form.precioVenta - form.precioCosto > 0 ? 'bg-green-50 text-green-700' : form.precioVenta - form.precioCosto < 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
            ${formatearNumero(form.precioVenta - form.precioCosto)} ({form.precioCosto > 0 ? ((form.precioVenta - form.precioCosto) / form.precioCosto * 100).toFixed(1) : '0'}%)
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Numero Interno</label>
        <input type="text" value={form.numeroInterno} onChange={e => setForm({ ...form, numeroInterno: e.target.value })} placeholder="Numero interno (ej: HAM-001)" className="border rounded px-3 py-2 w-full" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Marca {marcas.length > 0 && <span className="text-gray-400 text-[10px]">({marcas.length} cargadas)</span>}</label>
        <input
          type="text"
          list="marcas-datalist"
          value={form.marca}
          onChange={e => setForm({ ...form, marca: e.target.value })}
          placeholder="Escriba o seleccione una marca"
          className="border rounded px-3 py-2 w-full"
        />
        <datalist id="marcas-datalist">
          {marcas.map(m => (
            <option key={m.id} value={m.nombre}>{m.nombre}</option>
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Contenido / Peso</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={(unidadPeso === 'kg' || unidadPeso === 'L') ? (form.pesoGramos / 1000) : form.pesoGramos}
            onChange={e => {
              const val = parseFloat(e.target.value) || 0;
              const base = (unidadPeso === 'kg' || unidadPeso === 'L') ? Math.round(val * 1000) : Math.round(val);
              const um = (unidadPeso === 'ml' || unidadPeso === 'L') ? 'ml' : 'g';
              setForm({ ...form, pesoGramos: base, unidadMedida: um });
            }}
            placeholder={unidadPeso === 'kg' ? 'Ej: 2.5' : unidadPeso === 'L' ? 'Ej: 1.5' : 'Ej: 250'}
            className="border rounded px-3 py-2 flex-1"
            min={0}
            step={(unidadPeso === 'kg' || unidadPeso === 'L') ? 0.01 : 1}
          />
          <select
            value={unidadPeso}
            onChange={e => {
              const nuevaUnidad = e.target.value as 'g' | 'kg' | 'ml' | 'L';
              setUnidadPeso(nuevaUnidad);
              const um = (nuevaUnidad === 'ml' || nuevaUnidad === 'L') ? 'ml' : 'g';
              setForm({ ...form, unidadMedida: um });
            }}
            className="border rounded px-2 py-2 w-20 bg-white"
          >
            <optgroup label="Peso">
              <option value="g">g</option>
              <option value="kg">kg</option>
            </optgroup>
            <optgroup label="Liquido">
              <option value="ml">ml</option>
              <option value="L">L</option>
            </optgroup>
          </select>
        </div>
        {form.pesoGramos > 0 && (unidadPeso === 'kg' || unidadPeso === 'L') && (
          <div className="text-xs text-gray-500 mt-0.5">= {form.pesoGramos} {unidadPeso === 'L' ? 'ml' : 'gramos'}</div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Unidades por Bulto</label>
        <input type="number" value={form.unidadesPorBulto} onChange={e => setForm({ ...form, unidadesPorBulto: Number(e.target.value) })} placeholder="Unidades por bulto" className="border rounded px-3 py-2 w-full" min={1} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Unidades por Medio Bulto</label>
        <input type="number" value={form.unidadesPorMedia} onChange={e => setForm({ ...form, unidadesPorMedia: Number(e.target.value) })} placeholder="Unidades por media" className="border rounded px-3 py-2 w-full" min={0} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Unidad Minima (paquete)</label>
        <input type="number" value={form.unidadMinima} onChange={e => setForm({ ...form, unidadMinima: Number(e.target.value) })} placeholder="Ej: 2 hamburguesas, 6 salchichas" className="border rounded px-3 py-2 w-full" min={1} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Alicuota IVA</label>
        <select value={form.alicuotaIVA} onChange={e => setForm({ ...form, alicuotaIVA: Number(e.target.value) })} className="border rounded px-3 py-2 w-full">
          <option value={21}>21%</option>
          <option value={10.5}>10.5%</option>
          <option value={0}>0% (exento)</option>
        </select>
      </div>
      <div className="col-span-full">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.esOfertaSemanal} onChange={e => setForm({ ...form, esOfertaSemanal: e.target.checked })} className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
          Oferta Semanal
        </label>
      </div>
      <div className="col-span-full flex gap-2">
        <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
        <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
      </div>
    </form>
  );
}
