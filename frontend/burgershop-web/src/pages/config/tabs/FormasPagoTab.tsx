import { useEffect, useState } from 'react';
import { FormaPago } from '../../../types';
import { getFormasPago, createFormaPago, updateFormaPago } from '../../../api/formasPago';
import { useGlobalToast } from '../../../components/Toast';

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function FormasPagoTab({ onConfirm }: Props) {
  const { showToast } = useGlobalToast();
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  const [form, setForm] = useState({ nombre: '', porcentajeRecargo: 0, activa: true });
  const [editando, setEditando] = useState<FormaPago | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getFormasPago().then(setFormasPago);
  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await updateFormaPago(editando.id, form);
        showToast('Forma de pago actualizada correctamente', 'success');
      } else {
        await createFormaPago(form);
        showToast('Forma de pago creada correctamente', 'success');
      }
      setForm({ nombre: '', porcentajeRecargo: 0, activa: true });
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar forma de pago', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (fp: FormaPago) => {
    setEditando(fp);
    setForm({ nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: fp.activa });
    setShowForm(true);
  };

  const handleToggleActiva = async (fp: FormaPago) => {
    try {
      await updateFormaPago(fp.id, { nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: !fp.activa });
      cargar();
    } catch {
      showToast('Error al actualizar estado', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Formas de Pago</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm({ nombre: '', porcentajeRecargo: 0, activa: true }); }}
          className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2"
        >
          {showForm ? 'Cerrar' : 'Nueva Forma de Pago'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Efectivo, Tarjeta, MercadoPago" className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recargo (%)</label>
            <input type="number" value={form.porcentajeRecargo} onChange={e => setForm({ ...form, porcentajeRecargo: Number(e.target.value) })} className="w-full border rounded px-3 py-2" min={0} max={100} step={0.5} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Activa</label>
            <input type="checkbox" checked={form.activa} onChange={e => setForm({ ...form, activa: e.target.checked })} className="w-5 h-5" />
          </div>
          <div className="flex gap-2">
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Recargo (%)</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Activa</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {formasPago.map(fp => (
              <tr key={fp.id} className={!fp.activa ? 'opacity-50' : ''}>
                <td className="px-4 py-3 text-sm font-medium">{fp.nombre}</td>
                <td className="px-4 py-3 text-sm">{fp.porcentajeRecargo}%</td>
                <td className="px-4 py-3 text-sm text-center">
                  <button
                    onClick={() => handleToggleActiva(fp)}
                    className={`px-3 py-1 rounded text-xs font-medium ${fp.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {fp.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(fp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('formaPago', fp.id, fp.nombre)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {formasPago.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay formas de pago configuradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
