import { useEffect, useState } from 'react';
import { EmpresaDto, getEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa } from '../../api/empresas';
import { ConfirmModal } from '../../components/ConfirmModal';

const condicionesIva = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'Responsable No Inscripto',
];

const emptyForm = {
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

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editando, setEditando] = useState<EmpresaDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getEmpresas().then(setEmpresas);

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } else {
      await crearEmpresa(data);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    cargar();
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

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await eliminarEmpresa(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Empresas</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm(emptyForm); }}
          className="bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 text-sm font-semibold transition-colors"
        >
          {showForm ? 'Cerrar' : 'Nueva Empresa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
          <input
            type="text"
            value={form.razonSocial}
            onChange={e => setForm({ ...form, razonSocial: e.target.value })}
            placeholder="Razon Social"
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            value={form.nombreFantasia}
            onChange={e => setForm({ ...form, nombreFantasia: e.target.value })}
            placeholder="Nombre Fantasia"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.cuit}
            onChange={e => setForm({ ...form, cuit: e.target.value })}
            placeholder="CUIT (ej: 20-12345678-9)"
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.condicionIva}
            onChange={e => setForm({ ...form, condicionIva: e.target.value })}
            className="border rounded px-3 py-2"
            required
          >
            <option value="">Condicion IVA...</option>
            {condicionesIva.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            value={form.direccionFiscal}
            onChange={e => setForm({ ...form, direccionFiscal: e.target.value })}
            placeholder="Direccion Fiscal"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.localidad}
            onChange={e => setForm({ ...form, localidad: e.target.value })}
            placeholder="Localidad"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.provincia}
            onChange={e => setForm({ ...form, provincia: e.target.value })}
            placeholder="Provincia"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.codigoPostal}
            onChange={e => setForm({ ...form, codigoPostal: e.target.value })}
            placeholder="Codigo Postal"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })}
            placeholder="Telefono"
            className="border rounded px-3 py-2"
          />
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            value={form.ingresosBrutos}
            onChange={e => setForm({ ...form, ingresosBrutos: e.target.value })}
            placeholder="Ingresos Brutos"
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={form.inicioActividades}
            onChange={e => setForm({ ...form, inicioActividades: e.target.value })}
            placeholder="Inicio Actividades"
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            value={form.puntoVenta}
            onChange={e => setForm({ ...form, puntoVenta: e.target.value })}
            placeholder="Punto de Venta AFIP"
            className="border rounded px-3 py-2"
          />
          <div className="col-span-3 flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Razon Social</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre Fantasia</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">CUIT</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Condicion IVA</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Telefono</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {empresas.map(emp => (
              <tr key={emp.id}>
                <td className="px-4 py-3 text-sm font-medium">{emp.razonSocial}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.nombreFantasia || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.cuit}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.condicionIva}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{emp.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button onClick={() => handleEditar(emp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => handleEliminar(emp.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay empresas registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Eliminar empresa"
        mensaje="¿Eliminar esta empresa?"
        tipo="danger"
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
