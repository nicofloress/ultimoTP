import { useEffect, useState } from 'react';
import { EmpresaDto, getEmpresas, crearEmpresa, actualizarEmpresa } from '../../../api/empresas';
import { useGlobalToast } from '../../../components/Toast';
import { useGooglePlaces } from '../../../hooks/useGooglePlaces';

const condicionesIva = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'Responsable No Inscripto',
];

const empEmptyForm = {
  razonSocial: '',
  nombreFantasia: '',
  cuit: '',
  condicionIva: '',
  direccionFiscal: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
  telefono: '',
  email: '',
  ingresosBrutos: '',
  inicioActividades: '',
  puntoVenta: '',
};

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function EmpresasTab({ onConfirm }: Props) {
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(empEmptyForm);
  const [editando, setEditando] = useState<EmpresaDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);
  const { sugerencias: sugDirFiscal, buscarDirecciones: buscarDirFiscal } = useGooglePlaces();
  const [mostrarSugDirFiscal, setMostrarSugDirFiscal] = useState(false);

  const cargar = () => getEmpresas().then(setEmpresas);
  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        razonSocial: form.razonSocial,
        nombreFantasia: form.nombreFantasia || undefined,
        cuit: form.cuit,
        condicionIva: form.condicionIva,
        direccionFiscal: form.direccionFiscal || undefined,
        localidad: form.localidad || undefined,
        provincia: form.provincia || undefined,
        codigoPostal: form.codigoPostal || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        ingresosBrutos: form.ingresosBrutos || undefined,
        inicioActividades: form.inicioActividades || undefined,
        puntoVenta: form.puntoVenta ? Number(form.puntoVenta) : undefined,
      };
      if (editando) {
        await actualizarEmpresa(editando.id, { ...data, activa: editando.activa });
        showToast('Empresa actualizada correctamente', 'success');
      } else {
        await crearEmpresa(data);
        showToast('Empresa creada correctamente', 'success');
      }
      setForm(empEmptyForm);
      setEditando(null);
      setShowForm(false);
      cargar();
    } catch {
      showToast('Error al guardar empresa', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (emp: EmpresaDto) => {
    setEditando(emp);
    setForm({
      razonSocial: emp.razonSocial,
      nombreFantasia: emp.nombreFantasia || '',
      cuit: emp.cuit,
      condicionIva: emp.condicionIva,
      direccionFiscal: emp.direccionFiscal || '',
      localidad: emp.localidad || '',
      provincia: emp.provincia || '',
      codigoPostal: emp.codigoPostal || '',
      telefono: emp.telefono || '',
      email: emp.email || '',
      ingresosBrutos: emp.ingresosBrutos || '',
      inicioActividades: emp.inicioActividades || '',
      puntoVenta: emp.puntoVenta ? String(emp.puntoVenta) : '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Empresas</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(empEmptyForm); }}
          className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2"
        >
          {showForm ? 'Cerrar' : 'Nueva Empresa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <input type="text" value={form.razonSocial} onChange={e => setForm({ ...form, razonSocial: e.target.value })} placeholder="Razon Social" className="border rounded px-3 py-2" required />
          <input type="text" value={form.nombreFantasia} onChange={e => setForm({ ...form, nombreFantasia: e.target.value })} placeholder="Nombre Fantasia" className="border rounded px-3 py-2" />
          <input type="text" value={form.cuit} onChange={e => setForm({ ...form, cuit: e.target.value })} placeholder="CUIT (ej: 20-12345678-9)" className="border rounded px-3 py-2" required />
          <select value={form.condicionIva} onChange={e => setForm({ ...form, condicionIva: e.target.value })} className="border rounded px-3 py-2" required>
            <option value="">Condicion IVA...</option>
            {condicionesIva.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="relative">
            <input type="text" value={form.direccionFiscal} onChange={e => { setForm({ ...form, direccionFiscal: e.target.value }); buscarDirFiscal(e.target.value); setMostrarSugDirFiscal(true); }} onFocus={() => { if (sugDirFiscal.length > 0) setMostrarSugDirFiscal(true); }} onBlur={() => setTimeout(() => setMostrarSugDirFiscal(false), 200)} placeholder="Direccion Fiscal" className="border rounded px-3 py-2 w-full" />
            {mostrarSugDirFiscal && sugDirFiscal.length > 0 && form.direccionFiscal.length >= 3 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {sugDirFiscal.map(s => (
                  <button key={s.placeId} type="button" onClick={() => { setForm({ ...form, direccionFiscal: s.descripcion }); setMostrarSugDirFiscal(false); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-b-0">{s.descripcion}</button>
                ))}
              </div>
            )}
          </div>
          <input type="text" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} placeholder="Localidad" className="border rounded px-3 py-2" />
          <input type="text" value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} placeholder="Provincia" className="border rounded px-3 py-2" />
          <input type="text" value={form.codigoPostal} onChange={e => setForm({ ...form, codigoPostal: e.target.value })} placeholder="Codigo Postal" className="border rounded px-3 py-2" />
          <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Telefono" className="border rounded px-3 py-2" />
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded px-3 py-2" />
          <input type="text" value={form.ingresosBrutos} onChange={e => setForm({ ...form, ingresosBrutos: e.target.value })} placeholder="Ingresos Brutos" className="border rounded px-3 py-2" />
          <input type="date" value={form.inicioActividades} onChange={e => setForm({ ...form, inicioActividades: e.target.value })} placeholder="Inicio Actividades" className="border rounded px-3 py-2" />
          <input type="number" value={form.puntoVenta} onChange={e => setForm({ ...form, puntoVenta: e.target.value })} placeholder="Punto de Venta AFIP" className="border rounded px-3 py-2" />
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Razon Social</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Nombre Fantasia</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">CUIT</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">Condicion IVA</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Telefono</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {empresas.map(emp => (
              <tr key={emp.id}>
                <td className="px-4 py-3 text-sm font-medium">{emp.razonSocial}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{emp.nombreFantasia || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{emp.cuit}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{emp.condicionIva}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{emp.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <button onClick={() => handleEditar(emp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => onConfirm('empresa', emp.id, emp.razonSocial)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay empresas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
