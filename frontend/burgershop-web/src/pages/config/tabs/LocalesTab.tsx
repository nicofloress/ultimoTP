import { useEffect, useState } from 'react';
import { LocalDto, getLocales, crearLocal, actualizarLocal } from '../../../api/locales';
import { EmpresaDto, getEmpresas } from '../../../api/empresas';
import { useGlobalToast } from '../../../components/Toast';
import { useGooglePlaces } from '../../../hooks/useGooglePlaces';

const locEmptyForm = { nombre: '', direccion: '', empresaId: '' as string, esPuntoVenta: false };

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function LocalesTab({ onConfirm }: Props) {
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(locEmptyForm);
  const [editando, setEditando] = useState<LocalDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const { sugerencias: sugDirLocal, buscarDirecciones: buscarDirLocal } = useGooglePlaces();
  const [mostrarSugDirLocal, setMostrarSugDirLocal] = useState(false);

  const cargar = () => getLocales().then(setLocales);
  useEffect(() => { cargar(); getEmpresas().then(setEmpresas); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        direccion: form.direccion || undefined,
        empresaId: form.empresaId ? Number(form.empresaId) : undefined,
        esPuntoVenta: form.esPuntoVenta,
      };
      if (editando) {
        await actualizarLocal(editando.id, { ...data, activo: editando.activo });
        showToast('Local actualizado correctamente', 'success');
      } else {
        await crearLocal(data);
        showToast('Local creado correctamente', 'success');
      }
      setForm(locEmptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar local', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (loc: LocalDto) => {
    setEditando(loc);
    setForm({
      nombre: loc.nombre,
      direccion: loc.direccion || '',
      empresaId: loc.empresaId ? String(loc.empresaId) : '',
      esPuntoVenta: loc.esPuntoVenta,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Locales</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(locEmptyForm); }}
          className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2"
        >
          {showForm ? 'Cerrar' : 'Nuevo Local'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2" required />
          <div className="relative">
            <input type="text" value={form.direccion} onChange={e => { setForm({ ...form, direccion: e.target.value }); buscarDirLocal(e.target.value); setMostrarSugDirLocal(true); }} onFocus={() => { if (sugDirLocal.length > 0) setMostrarSugDirLocal(true); }} onBlur={() => setTimeout(() => setMostrarSugDirLocal(false), 200)} placeholder="Direccion" className="border rounded px-3 py-2 w-full" />
            {mostrarSugDirLocal && sugDirLocal.length > 0 && form.direccion.length >= 3 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {sugDirLocal.map(s => (
                  <button key={s.placeId} type="button" onClick={() => { setForm({ ...form, direccion: s.descripcion }); setMostrarSugDirLocal(false); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0">{s.descripcion}</button>
                ))}
              </div>
            )}
          </div>
          <select value={form.empresaId} onChange={e => setForm({ ...form, empresaId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Sin empresa</option>
            {empresas.filter(emp => emp.activa).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.esPuntoVenta} onChange={e => setForm({ ...form, esPuntoVenta: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
            <span className="text-sm font-medium text-gray-700">Es Punto de Venta</span>
          </label>
          <div className="col-span-full flex gap-2">
            <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Direccion</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Empresa</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Punto de Venta</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {locales.map(loc => (
              <tr key={loc.id}>
                <td className="px-4 py-3 text-sm font-medium">{loc.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{loc.direccion || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{loc.empresaNombre || '-'}</td>
                <td className="px-4 py-3 text-sm text-center hidden sm:table-cell">
                  {loc.esPuntoVenta
                    ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Si</span>
                    : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <button onClick={() => handleEditar(loc)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('local', loc.id, loc.nombre)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {locales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay locales registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
