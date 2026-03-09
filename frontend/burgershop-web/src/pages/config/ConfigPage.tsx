import { useEffect, useState } from 'react';
import { Zona, Repartidor, FormaPago } from '../../types';
import { getZonas, createZona, updateZona, deleteZona, getRepartidores, createRepartidor, updateRepartidor, deleteRepartidor, asignarZonas } from '../../api/entregas';
import { getFormasPago, createFormaPago, updateFormaPago, deleteFormaPago } from '../../api/formasPago';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function ConfigPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [formasPagoList, setFormasPagoList] = useState<FormaPago[]>([]);
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; tipo: string; id: number; nombre: string }>({ visible: false, tipo: '', id: 0, nombre: '' });
  const [tab, setTab] = useState<'zonas' | 'repartidores' | 'formasPago'>('zonas');

  // Zona form
  const [zonaForm, setZonaForm] = useState({ nombre: '', descripcion: '', costoEnvio: 0 });
  const [editandoZona, setEditandoZona] = useState<Zona | null>(null);

  // Repartidor form
  const [repForm, setRepForm] = useState({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' });
  const [editandoRep, setEditandoRep] = useState<Repartidor | null>(null);
  const [zonasAsignar, setZonasAsignar] = useState<number[]>([]);

  // FormaPago form
  const [fpForm, setFpForm] = useState({ nombre: '', porcentajeRecargo: 0, activa: true });
  const [editandoFp, setEditandoFp] = useState<FormaPago | null>(null);
  const [showFpForm, setShowFpForm] = useState(false);

  // Configuracion de Impresion
  const [autoImprimir, setAutoImprimir] = useState(() => localStorage.getItem('autoImprimir') === 'true');
  const [papelTicket, setPapelTicket] = useState(() => localStorage.getItem('papelTicket') || '80mm');

  useEffect(() => {
    localStorage.setItem('autoImprimir', String(autoImprimir));
  }, [autoImprimir]);

  useEffect(() => {
    localStorage.setItem('papelTicket', papelTicket);
  }, [papelTicket]);

  const cargar = () => {
    getZonas().then(setZonas);
    getRepartidores().then(setRepartidores);
    getFormasPago().then(setFormasPagoList);
  };
  useEffect(() => { cargar(); }, []);

  // Zonas handlers
  const handleZonaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoZona) {
      await updateZona(editandoZona.id, { ...zonaForm, activa: editandoZona.activa });
    } else {
      await createZona(zonaForm);
    }
    setZonaForm({ nombre: '', descripcion: '', costoEnvio: 0 }); setEditandoZona(null); cargar();
  };

  // Repartidor handlers
  const handleRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoRep) {
      await updateRepartidor(editandoRep.id, { ...repForm, activo: editandoRep.activo, codigoAcceso: repForm.codigoAcceso || undefined });
    } else {
      await createRepartidor(repForm);
    }
    setRepForm({ nombre: '', telefono: '', vehiculo: '', codigoAcceso: '' }); setEditandoRep(null); cargar();
  };

  const handleAsignarZonas = async (repId: number) => {
    await asignarZonas(repId, zonasAsignar);
    setZonasAsignar([]); cargar();
  };

  // FormaPago handlers
  const handleFpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoFp) {
      await updateFormaPago(editandoFp.id, fpForm);
    } else {
      await createFormaPago(fpForm);
    }
    setFpForm({ nombre: '', porcentajeRecargo: 0, activa: true });
    setEditandoFp(null);
    setShowFpForm(false);
    cargar();
  };

  const handleConfirmacion = async () => {
    const { tipo, id } = confirmacion;
    if (tipo === 'zona') await deleteZona(id);
    else if (tipo === 'repartidor') await deleteRepartidor(id);
    else if (tipo === 'formaPago') await deleteFormaPago(id);
    setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' });
    cargar();
  };

  const tituloConfirmacion = confirmacion.tipo === 'zona'
    ? 'Desactivar zona'
    : confirmacion.tipo === 'repartidor'
      ? 'Desactivar repartidor'
      : 'Eliminar forma de pago';

  const mensajeConfirmacion = confirmacion.tipo === 'formaPago'
    ? `Se eliminara la forma de pago "${confirmacion.nombre}"`
    : `Se desactivara "${confirmacion.nombre}"`;

  const handleEditarFp = (fp: FormaPago) => {
    setEditandoFp(fp);
    setFpForm({ nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: fp.activa });
    setShowFpForm(true);
  };

  const handleToggleFpActiva = async (fp: FormaPago) => {
    await updateFormaPago(fp.id, { nombre: fp.nombre, porcentajeRecargo: fp.porcentajeRecargo, activa: !fp.activa });
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configuracion</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('zonas')} className={`px-4 py-2 rounded font-medium ${tab === 'zonas' ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}>Zonas</button>
        <button onClick={() => setTab('repartidores')} className={`px-4 py-2 rounded font-medium ${tab === 'repartidores' ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}>Repartidores</button>
        <button onClick={() => setTab('formasPago')} className={`px-4 py-2 rounded font-medium ${tab === 'formasPago' ? 'bg-amber-600 text-white' : 'bg-white shadow'}`}>Formas de Pago</button>
      </div>

      {/* Seccion Impresion */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Impresion</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Auto-imprimir al crear pedido</label>
            <button
              onClick={() => setAutoImprimir(!autoImprimir)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoImprimir ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoImprimir ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Tamano de papel</label>
            <select
              value={papelTicket}
              onChange={e => setPapelTicket(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="80mm">80mm</option>
              <option value="58mm">58mm</option>
            </select>
          </div>
        </div>
      </div>

      {tab === 'zonas' && (
        <div>
          <form onSubmit={handleZonaSubmit} className="flex gap-2 mb-6">
            <input type="text" value={zonaForm.nombre} onChange={e => setZonaForm({ ...zonaForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={zonaForm.descripcion} onChange={e => setZonaForm({ ...zonaForm, descripcion: e.target.value })} placeholder="Descripcion" className="border rounded px-3 py-2 flex-1" />
            <input type="number" value={zonaForm.costoEnvio} onChange={e => setZonaForm({ ...zonaForm, costoEnvio: Number(e.target.value) })} placeholder="Costo envio" className="border rounded px-3 py-2 w-32" min={0} step={100} />
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editandoZona ? 'Actualizar' : 'Crear'}</button>
          </form>
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Descripcion</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Costo Envio</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {zonas.map(z => (
                  <tr key={z.id}>
                    <td className="px-4 py-3 text-sm font-medium">{z.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{z.descripcion}</td>
                    <td className="px-4 py-3 text-sm">${z.costoEnvio.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => { setEditandoZona(z); setZonaForm({ nombre: z.nombre, descripcion: z.descripcion || '', costoEnvio: z.costoEnvio }); }} className="text-blue-600 hover:underline mr-3">Editar</button>
                      <button onClick={() => setConfirmacion({ visible: true, tipo: 'zona', id: z.id, nombre: z.nombre })} className="text-red-600 hover:underline">Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'repartidores' && (
        <div>
          <form onSubmit={handleRepSubmit} className="flex gap-2 mb-6 flex-wrap">
            <input type="text" value={repForm.nombre} onChange={e => setRepForm({ ...repForm, nombre: e.target.value })} placeholder="Nombre" className="border rounded px-3 py-2 flex-1" required />
            <input type="text" value={repForm.telefono} onChange={e => setRepForm({ ...repForm, telefono: e.target.value })} placeholder="Telefono" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.vehiculo} onChange={e => setRepForm({ ...repForm, vehiculo: e.target.value })} placeholder="Vehiculo" className="border rounded px-3 py-2" />
            <input type="text" value={repForm.codigoAcceso} onChange={e => setRepForm({ ...repForm, codigoAcceso: e.target.value })} placeholder="Codigo acceso" className="border rounded px-3 py-2 w-32" required={!editandoRep} />
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editandoRep ? 'Actualizar' : 'Crear'}</button>
          </form>
          <div className="space-y-4">
            {repartidores.map(r => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{r.nombre}</h3>
                    <p className="text-sm text-gray-600">{r.vehiculo} | {r.telefono}</p>
                    <p className="text-xs text-gray-400 mt-1">Zonas: {r.zonas.map(z => z.nombre).join(', ') || 'Sin asignar'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditandoRep(r); setRepForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '', codigoAcceso: '' }); }} className="text-sm text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => setConfirmacion({ visible: true, tipo: 'repartidor', id: r.id, nombre: r.nombre })} className="text-sm text-red-600 hover:underline">Desactivar</button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  <div className="flex gap-1 flex-wrap flex-1">
                    {zonas.filter(z => z.activa).map(z => (
                      <label key={z.id} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                        <input type="checkbox" checked={zonasAsignar.includes(z.id) || r.zonas.some(rz => rz.id === z.id)} onChange={e => {
                          const ids = r.zonas.map(rz => rz.id);
                          if (e.target.checked) setZonasAsignar([...new Set([...ids, z.id])]);
                          else setZonasAsignar(ids.filter(id => id !== z.id));
                        }} />
                        {z.nombre}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => handleAsignarZonas(r.id)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">Guardar Zonas</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'formasPago' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Formas de Pago</h2>
            <button
              onClick={() => { setShowFpForm(!showFpForm); setEditandoFp(null); setFpForm({ nombre: '', porcentajeRecargo: 0, activa: true }); }}
              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              {showFpForm ? 'Cerrar' : 'Nueva Forma de Pago'}
            </button>
          </div>

          {showFpForm && (
            <form onSubmit={handleFpSubmit} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={fpForm.nombre} onChange={e => setFpForm({ ...fpForm, nombre: e.target.value })} placeholder="Ej: Efectivo, Tarjeta, MercadoPago" className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recargo (%)</label>
                <input type="number" value={fpForm.porcentajeRecargo} onChange={e => setFpForm({ ...fpForm, porcentajeRecargo: Number(e.target.value) })} className="w-full border rounded px-3 py-2" min={0} max={100} step={0.5} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Activa</label>
                <input type="checkbox" checked={fpForm.activa} onChange={e => setFpForm({ ...fpForm, activa: e.target.checked })} className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">{editandoFp ? 'Actualizar' : 'Crear'}</button>
                <button type="button" onClick={() => { setShowFpForm(false); setEditandoFp(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow">
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
                {formasPagoList.map(fp => (
                  <tr key={fp.id} className={!fp.activa ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium">{fp.nombre}</td>
                    <td className="px-4 py-3 text-sm">{fp.porcentajeRecargo}%</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        onClick={() => handleToggleFpActiva(fp)}
                        className={`px-3 py-1 rounded text-xs font-medium ${fp.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {fp.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => handleEditarFp(fp)} className="text-blue-600 hover:underline mr-3">Editar</button>
                      <button onClick={() => setConfirmacion({ visible: true, tipo: 'formaPago', id: fp.id, nombre: fp.nombre })} className="text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {formasPagoList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay formas de pago configuradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo={tituloConfirmacion}
        mensaje={mensajeConfirmacion}
        tipo="danger"
        textoConfirmar={confirmacion.tipo === 'formaPago' ? 'Eliminar' : 'Desactivar'}
        onConfirmar={handleConfirmacion}
        onCancelar={() => setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' })}
      />
    </div>
  );
}
