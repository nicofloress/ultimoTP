import { useState } from 'react';
import { deleteZona } from '../../api/zonas';
import { eliminarRepartidor as deleteRepartidor } from '../../api/repartidores';
import { deleteFormaPago } from '../../api/formasPago';
import { eliminarTipoCliente } from '../../api/tiposCliente';
import { deleteCategoria } from '../../api/categorias';
import { eliminarEmpresa } from '../../api/empresas';
import { eliminarLocal } from '../../api/locales';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useGlobalToast } from '../../components/Toast';

import ZonasTab from './tabs/ZonasTab';
import RepartidoresTab from './tabs/RepartidoresTab';
import FormasPagoTab from './tabs/FormasPagoTab';
import TiposClienteTab from './tabs/TiposClienteTab';
import CategoriasTab from './tabs/CategoriasTab';
import EmpresasTab from './tabs/EmpresasTab';
import LocalesTab from './tabs/LocalesTab';
import ImpresionConfig from './tabs/ImpresionConfig';

type TabType = 'zonas' | 'repartidores' | 'formasPago' | 'tiposCliente' | 'categorias' | 'empresas' | 'locales';

export default function ConfigPage() {
  const { showToast } = useGlobalToast();
  const [tab, setTab] = useState<TabType>('zonas');
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; tipo: string; id: number; nombre: string }>({ visible: false, tipo: '', id: 0, nombre: '' });
  const [guardando, setGuardando] = useState(false);
  const [subTabKey, setSubTabKey] = useState(0);

  const handleSubTabConfirm = (tipo: string, id: number, nombre: string) => {
    setConfirmacion({ visible: true, tipo, id, nombre });
  };

  const handleConfirmacion = async () => {
    const { tipo, id } = confirmacion;
    setGuardando(true);
    try {
      if (tipo === 'zona') await deleteZona(id);
      else if (tipo === 'repartidor') await deleteRepartidor(id);
      else if (tipo === 'formaPago') await deleteFormaPago(id);
      else if (tipo === 'tipoCliente') await eliminarTipoCliente(id);
      else if (tipo === 'categoria') await deleteCategoria(id);
      else if (tipo === 'empresa') await eliminarEmpresa(id);
      else if (tipo === 'local') await eliminarLocal(id);

      const mensajes: Record<string, string> = {
        zona: 'Zona desactivada correctamente',
        repartidor: 'Repartidor desactivado correctamente',
        formaPago: 'Forma de pago eliminada correctamente',
        tipoCliente: 'Tipo de cliente eliminado correctamente',
        categoria: 'Categoria desactivada correctamente',
        empresa: 'Empresa eliminada correctamente',
        local: 'Local eliminado correctamente',
      };
      showToast(mensajes[tipo] || 'Eliminado correctamente', 'success');
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setGuardando(false);
    }
    setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' });
    setSubTabKey(k => k + 1);
  };

  const tituloConfirmacion = confirmacion.tipo === 'zona'
    ? 'Desactivar zona'
    : confirmacion.tipo === 'repartidor'
      ? 'Desactivar repartidor'
      : confirmacion.tipo === 'formaPago'
        ? 'Eliminar forma de pago'
        : confirmacion.tipo === 'tipoCliente'
          ? 'Eliminar tipo de cliente'
          : confirmacion.tipo === 'categoria'
            ? 'Desactivar categoria'
            : confirmacion.tipo === 'empresa'
              ? 'Eliminar empresa'
              : 'Eliminar local';

  const mensajeConfirmacion = confirmacion.tipo === 'zona' || confirmacion.tipo === 'repartidor'
    ? `Se desactivara "${confirmacion.nombre}"`
    : confirmacion.tipo === 'categoria'
      ? `Se desactivara la categoria "${confirmacion.nombre}"`
      : `Se eliminara "${confirmacion.nombre}"`;

  const textoBotonConfirmar = (confirmacion.tipo === 'zona' || confirmacion.tipo === 'repartidor' || confirmacion.tipo === 'categoria')
    ? 'Desactivar'
    : 'Eliminar';

  const tabBtn = (key: TabType, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`flex-shrink-0 px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap ${tab === key ? 'text-amber-700 bg-amber-50 border border-amber-300' : 'bg-white shadow border border-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Configuracion</h2>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabBtn('zonas', 'Zonas')}
        {tabBtn('repartidores', 'Repartidores')}
        {tabBtn('formasPago', 'Formas de Pago')}
        {tabBtn('tiposCliente', 'Tipos de Cliente')}
        {tabBtn('categorias', 'Categorias')}
        {tabBtn('empresas', 'Empresas')}
        {tabBtn('locales', 'Locales')}
      </div>

      <ImpresionConfig />

      {tab === 'zonas' && <ZonasTab key={`zon-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'repartidores' && <RepartidoresTab key={`rep-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'formasPago' && <FormasPagoTab key={`fp-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'tiposCliente' && <TiposClienteTab key={`tc-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'categorias' && <CategoriasTab key={`cat-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'empresas' && <EmpresasTab key={`emp-${subTabKey}`} onConfirm={handleSubTabConfirm} />}
      {tab === 'locales' && <LocalesTab key={`loc-${subTabKey}`} onConfirm={handleSubTabConfirm} />}

      <ConfirmModal
        visible={confirmacion.visible}
        titulo={tituloConfirmacion}
        mensaje={mensajeConfirmacion}
        tipo="danger"
        textoConfirmar={textoBotonConfirmar}
        cargando={guardando}
        onConfirmar={handleConfirmacion}
        onCancelar={() => setConfirmacion({ visible: false, tipo: '', id: 0, nombre: '' })}
      />
    </div>
  );
}
