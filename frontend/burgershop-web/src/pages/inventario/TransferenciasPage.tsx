import { useEffect, useState, useMemo, useCallback } from 'react';
import { MovimientoDto, getMovimientosPorLocal, crearTransferencia } from '../../api/movimientos';
import { getProductos } from '../../api/productos';
import { getLocales, LocalDto } from '../../api/locales';
import { Producto } from '../../types';
import { useGlobalToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { compareBy } from '../../utils/tableSort';
import ProductoSelect from '../../components/ProductoSelect';
import { parseFechaUtc } from '../../utils/fechas';

const inputClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';
const selectClass = 'border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white';

function getHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha: string) {
  return parseFechaUtc(fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

type SortDir = 'asc' | 'desc';

export default function TransferenciasPage() {
  const { showToast } = useGlobalToast();
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const localDelUsuario = usuario?.localId;

  const [movimientos, setMovimientos] = useState<MovimientoDto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [cargando, setCargando] = useState(false);

  // Filtros
  const [localFiltro, setLocalFiltro] = useState<number>(esSuperAdmin ? 0 : (localDelUsuario || 1));
  const [fechaDesde, setFechaDesde] = useState(getHoy());
  const [fechaHasta, setFechaHasta] = useState(getHoy());
  const [ordenCol, setOrdenCol] = useState<string>('fechaMovimiento');
  const [ordenDir, setOrdenDir] = useState<SortDir>('desc');
  const [filtrosMobileVisibles, setFiltrosMobileVisibles] = useState(false);

  const hoyStr = getHoy();
  const cantidadFiltrosActivos =
    (fechaDesde !== hoyStr ? 1 : 0) +
    (fechaHasta !== hoyStr ? 1 : 0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formProductoId, setFormProductoId] = useState<number | ''>('');
  const [formLocalOrigen, setFormLocalOrigen] = useState<number>(localDelUsuario || 1);
  const [formLocalDestino, setFormLocalDestino] = useState<number | ''>('');
  const [formBultos, setFormBultos] = useState<string>('');
  const [formUnidades, setFormUnidades] = useState<string>('');
  const [formObservaciones, setFormObservaciones] = useState('');

  useEffect(() => {
    getProductos().then(setProductos).catch(() => {});
    getLocales().then(setLocales).catch(() => {});
  }, []);

  const productoSel = useMemo(() => {
    if (formProductoId === '') return null;
    return productos.find(p => p.id === formProductoId) || null;
  }, [formProductoId, productos]);

  const upb = productoSel?.unidadesPorBulto || 1;
  const um = productoSel?.unidadMinima || 1;
  const cantBultos = parseInt(formBultos) || 0;
  const cantUnidades = parseInt(formUnidades) || 0;
  const paqDeBultos = cantBultos * upb;
  const paqDeUnidades = um > 0 ? cantUnidades / um : 0;
  const totalPaq = paqDeBultos + paqDeUnidades;
  const totalUn = cantBultos * upb * um + cantUnidades;

  // Cargar
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const hasta = fechaHasta && fechaHasta !== fechaDesde ? fechaHasta : undefined;
      let data: MovimientoDto[];
      if (localFiltro === 0) {
        const results = await Promise.all(locales.map(l => getMovimientosPorLocal(l.id, fechaDesde, hasta)));
        data = results.flat();
      } else {
        data = await getMovimientosPorLocal(localFiltro, fechaDesde, hasta);
      }
      setMovimientos(data.filter(m => m.codigoAccionCodigo === 'ING_TRF' || m.codigoAccionCodigo === 'EGR_TRF'));
    } catch {
      showToast('Error al cargar transferencias', 'error');
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, localFiltro, locales, showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const movFiltrados = useMemo(() => {
    const lista = [...movimientos];
    lista.sort((a, b) => compareBy(a, b, ordenCol, ordenDir));
    return lista;
  }, [movimientos, ordenCol, ordenDir]);

  const toggleOrden = (col: string) => {
    if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setOrdenCol(col); setOrdenDir('asc'); }
  };

  const SortArrow = ({ col }: { col: string }) =>
    ordenCol === col ? <span className="text-amber-400 ml-1">{ordenDir === 'asc' ? '\u25B2' : '\u25BC'}</span> : null;

  const abrirModal = () => {
    setFormProductoId('');
    setFormLocalOrigen(esSuperAdmin ? (locales[0]?.id || 1) : (localDelUsuario || 1));
    setFormLocalDestino('');
    setFormBultos('');
    setFormUnidades('');
    setFormObservaciones('');
    setModalOpen(true);
  };

  const guardar = async () => {
    if (formProductoId === '' || formLocalDestino === '') {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }
    if (formLocalOrigen === formLocalDestino) {
      showToast('El local origen y destino no pueden ser el mismo', 'error');
      return;
    }
    if (cantBultos <= 0 && cantUnidades <= 0) {
      showToast('Ingresa una cantidad en bultos y/o unidades', 'error');
      return;
    }
    setGuardando(true);
    try {
      await crearTransferencia({
        productoId: formProductoId as number,
        localOrigenId: formLocalOrigen,
        localDestinoId: formLocalDestino as number,
        cantidadBultos: cantBultos,
        cantidadUnidades: cantUnidades || undefined,
        observaciones: formObservaciones || undefined,
      });
      showToast('Transferencia registrada correctamente', 'success');
      setModalOpen(false);
      cargar();
    } catch {
      showToast('Error al registrar transferencia', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5 mb-4">
        <h2 className="text-lg font-bold text-white">Transferencias entre Locales</h2>
      </div>

      {/* Barra compacta mobile */}
      <div className="sm:hidden bg-white rounded-lg shadow p-2 flex items-center gap-2">
        <button
          onClick={() => setFiltrosMobileVisibles(v => !v)}
          className={`px-2.5 py-2 rounded-md border flex items-center justify-center gap-1 transition-colors ${
            filtrosMobileVisibles || cantidadFiltrosActivos > 0
              ? 'text-amber-700 bg-amber-50 border-amber-300'
              : 'text-gray-700 bg-white border-gray-300'
          }`}
          aria-label="Filtros"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {cantidadFiltrosActivos > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {cantidadFiltrosActivos}
            </span>
          )}
        </button>
        <button
          onClick={cargar}
          disabled={cargando}
          className="px-2.5 py-2 rounded-md border border-blue-300 bg-blue-50 text-blue-700 flex items-center justify-center disabled:opacity-50"
          aria-label="Buscar"
        >
          <svg className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={abrirModal}
          className="px-2.5 py-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center"
          aria-label="Nueva transferencia"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500 whitespace-nowrap">{movFiltrados.length} mov.</span>
      </div>

      {/* Filtros */}
      <div className={(filtrosMobileVisibles ? 'block' : 'hidden') + ' sm:block bg-white rounded-lg shadow p-4'}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Local</label>
            {esSuperAdmin ? (
              <select className={selectClass + ' w-full'} value={localFiltro} onChange={e => setLocalFiltro(Number(e.target.value))}>
                <option value={0}>Todos los locales</option>
                {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            ) : (
              <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                {locales.find(l => l.id === localFiltro)?.nombre || 'Mi Local'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
            <input type="date" className={inputClass} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
            <input type="date" className={inputClass} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <button onClick={cargar} className="hidden sm:block px-4 py-1.5 text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 text-sm font-semibold">Buscar</button>
          <button onClick={abrirModal} className="hidden sm:flex px-4 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-semibold items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nueva Transferencia
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {([
                ['fechaMovimiento', 'Fecha/Hora', ''],
                ['codigoAccionNombre', 'Tipo', ''],
                ['localNombre', 'Local', 'hidden sm:table-cell'],
                ['productoNombre', 'Producto', ''],
                ['cantidad', 'Cantidad', ''],
                ['usuarioNombre', 'Usuario', 'hidden md:table-cell'],
                ['observaciones', 'Observaciones', 'hidden md:table-cell'],
              ] as [string, string, string][]).map(([col, label, hide]) => (
                <th key={col} className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-200 ${hide}`} onClick={() => toggleOrden(col)}>
                  {label}
                  <SortArrow col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : movFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No se encontraron transferencias</td></tr>
            ) : (
              movFiltrados.map((m, idx) => {
                const esEgreso = m.codigoAccionCodigo === 'EGR_TRF';
                return (
                  <tr key={m.id} className={`border-b border-gray-100 hover:bg-amber-50/40 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{formatFecha(m.fechaMovimiento)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${esEgreso ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {esEgreso ? 'Envio' : 'Recepcion'}
                      </span>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">{m.localNombre}</td>
                    <td className="px-3 py-2 text-xs sm:text-sm">{m.productoNombre || '-'}</td>
                    <td className={`px-3 py-2 font-semibold text-xs sm:text-sm ${esEgreso ? 'text-red-600' : 'text-green-600'}`}>
                      {esEgreso ? '-' : '+'}{m.cantidad} paq.
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">{m.usuarioNombre || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[250px] truncate hidden md:table-cell">{m.observaciones || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-slate-500 to-slate-700 rounded-lg shadow p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-200">Total movimientos:</span>
          <span className="text-sm font-bold text-white">{movFiltrados.length}</span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200 bg-slate-700 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">Nueva Transferencia</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Producto */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Producto <span className="text-red-500">*</span></label>
                <ProductoSelect
                  productos={productos}
                  value={formProductoId}
                  onChange={setFormProductoId}
                  renderSuffix={p => `(${p.unidadesPorBulto} paq/bulto)`}
                />
              </div>

              {/* Locales origen y destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Local Origen <span className="text-red-500">*</span></label>
                  {esSuperAdmin ? (
                    <select className={`${selectClass} w-full`} value={formLocalOrigen} onChange={e => setFormLocalOrigen(Number(e.target.value))}>
                      {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                  ) : (
                    <div className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-gray-100 text-gray-700">
                      {locales.find(l => l.id === formLocalOrigen)?.nombre || 'Mi Local'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Local Destino <span className="text-red-500">*</span></label>
                  <select className={`${selectClass} w-full`} value={formLocalDestino} onChange={e => setFormLocalDestino(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">Seleccionar...</option>
                    {locales.filter(l => l.id !== formLocalOrigen).map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info bulto */}
              {productoSel && (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-700">
                  1 bulto = <strong>{upb} paquetes</strong> de {um} un. c/u ({upb * um} unidades por bulto)
                </div>
              )}

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad <span className="text-red-500">*</span> <span className="text-[10px] text-gray-400 font-normal">(bultos y/o unidades)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      className={`${inputClass} w-full`}
                      value={formBultos}
                      onChange={e => setFormBultos(e.target.value)}
                      min="0"
                      step="1"
                      placeholder="Bultos"
                    />
                    <div className="text-[10px] text-gray-400 mt-0.5">Bultos</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      className={`${inputClass} w-full`}
                      value={formUnidades}
                      onChange={e => setFormUnidades(e.target.value)}
                      min="0"
                      step="1"
                      placeholder="Unidades"
                    />
                    <div className="text-[10px] text-gray-400 mt-0.5">Unidades sueltas</div>
                  </div>
                </div>
                {productoSel && (cantBultos > 0 || cantUnidades > 0) && (
                  <div className="text-xs text-gray-500 mt-1.5">
                    Total: <strong className="text-blue-600">{totalPaq % 1 === 0 ? totalPaq : totalPaq.toFixed(2)} paquetes</strong> / <strong className="text-blue-600">{totalUn} unidades</strong>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                <textarea className={`${inputClass} w-full`} rows={2} value={formObservaciones} onChange={e => setFormObservaciones(e.target.value)} />
              </div>

              {/* Resumen */}
              {(cantBultos > 0 || cantUnidades > 0) && productoSel && formLocalDestino !== '' && (
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
                  <div className="font-semibold text-amber-800">
                    Transferir{' '}
                    {cantBultos > 0 && <>{cantBultos} bulto{cantBultos !== 1 ? 's' : ''}</>}
                    {cantBultos > 0 && cantUnidades > 0 && <> + </>}
                    {cantUnidades > 0 && <>{cantUnidades} un.</>}
                    {' '}({totalPaq % 1 === 0 ? totalPaq : totalPaq.toFixed(2)} paq.) de <strong>{locales.find(l => l.id === formLocalOrigen)?.nombre}</strong> a <strong>{locales.find(l => l.id === formLocalDestino)?.nombre}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 bg-amber-50 rounded-b-lg flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md">
                {guardando ? 'Guardando...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
