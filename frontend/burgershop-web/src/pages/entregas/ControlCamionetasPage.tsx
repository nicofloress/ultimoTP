import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getControlCamioneta, RepartidorTally, CompletaMedia, descargarControlCamioneta,
  getControlCamionetaHistorial, ControlCamionetaHistorialItem
} from '../../api/entregas';
import { useLocalActivo } from '../../context/LocalContext';
import { useGlobalToast } from '../../components/Toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function formatCantidad(count: number): string {
  if (count <= 0) return '';
  return count.toString();
}

function getStorageKey(repartidorId: number): string {
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  return `control-camioneta-checks-${today}-${repartidorId}`;
}

function loadChecks(repartidorId: number): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(getStorageKey(repartidorId));
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveChecks(repartidorId: number, checks: Record<string, boolean>) {
  localStorage.setItem(getStorageKey(repartidorId), JSON.stringify(checks));
}

// Color classes matching Excel
const colors = {
  dorado: 'bg-amber-200',
  verde: 'bg-green-300',
  azulCielo: 'bg-blue-200',
  naranja: 'bg-orange-200',
  gris: 'bg-gray-200',
  amarillo: 'bg-yellow-200',
  azulSolido: 'bg-blue-600 text-white',
  headerFila1: 'bg-blue-200',
};

interface CheckRowProps {
  id: string;
  checked: boolean;
  onChange: (id: string, v: boolean) => void;
  label: string;
  value: string;
  bg?: string;
  readonly?: boolean;
}

function CheckRow({ id, checked, onChange, label, value, bg, readonly = false }: CheckRowProps) {
  if (!value) return null;
  const cellBg = checked ? 'bg-gray-300 text-gray-500 line-through' : '';
  const rowBg = checked ? '' : (bg || '');
  return (
    <tr className={rowBg}>
      <td className={`px-3 py-1.5 border border-gray-300 ${cellBg}`}>
        {readonly
          ? <span className="inline-block w-4 h-4" />
          : <input type="checkbox" checked={checked} onChange={(e) => onChange(id, e.target.checked)} className="w-4 h-4" />
        }
      </td>
      <td className={`px-3 py-1.5 border border-gray-300 font-medium text-sm ${cellBg}`}>{label}</td>
      <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm ${cellBg}`}>{value}</td>
    </tr>
  );
}

function TallySection({ title, bg, colSpan = 3, children }: { title: string; bg: string; colSpan?: number; children: React.ReactNode }) {
  return (
    <>
      <tr className={bg}>
        <td colSpan={colSpan} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">{title}</td>
      </tr>
      {children}
    </>
  );
}

function RepartidorPanel({ tally, readonly = false }: { tally: RepartidorTally; readonly?: boolean }) {
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    readonly ? {} : loadChecks(tally.repartidorId)
  );

  const toggle = useCallback((id: string, v: boolean) => {
    if (readonly) return;
    setChecks(prev => {
      const next = { ...prev, [id]: v };
      saveChecks(tally.repartidorId, next);
      return next;
    });
  }, [tally.repartidorId, readonly]);

  const renderCompletaMediaRow = (prefix: string, peso: string, cm: CompletaMedia) => {
    if (cm.completa <= 0 && cm.media <= 0 && cm.sueltos <= 0) return null;
    const idC = `${prefix}-${peso}-completa`;
    const idM = `${prefix}-${peso}-media`;
    const isChecked = !!checks[idC] && !!checks[idM];
    const cellBg = isChecked ? 'bg-gray-300 text-gray-500 line-through' : '';
    return (
      <tr key={`${prefix}-${peso}`}>
        <td className={`px-3 py-1.5 border border-gray-300 ${cellBg}`}>
          {readonly
            ? <span className="inline-block w-4 h-4" />
            : <input type="checkbox" checked={isChecked} onChange={(e) => { toggle(idC, e.target.checked); toggle(idM, e.target.checked); }} className="w-4 h-4" />
          }
        </td>
        <td className={`px-3 py-1.5 border border-gray-300 font-medium text-sm ${cellBg}`}>{peso} GR</td>
        <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBg}`}>{cm.completa > 0 ? formatCantidad(cm.completa) : '-'}</td>
        <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBg}`}>{cm.media > 0 ? formatCantidad(cm.media) : '-'}</td>
        <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBg}`}>{cm.sueltos > 0 ? cm.sueltos : '-'}</td>
      </tr>
    );
  };

  const renderPan = (prefix: string, panes: Record<string, number>, bg?: string) => {
    return Object.entries(panes).sort(([a], [b]) => Number(a) - Number(b)).map(([qty, count]) => {
      if (count <= 0) return null;
      const id = `${prefix}-${qty}`;
      return <CheckRow key={id} id={id} checked={!!checks[id]} onChange={toggle} label={`${qty} un.`} value={formatCantidad(count)} bg={bg} readonly={readonly} />;
    });
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT COLUMN - Carnes */}
      <div>
        <table className="w-full border-collapse">
          <thead>
            <tr className={colors.headerFila1}>
              <th className="w-10 px-2 py-2 border border-gray-300"></th>
              <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold">Producto</th>
              <th className="px-3 py-2 border border-gray-300 text-center text-sm font-bold">COMPLETA</th>
              <th className="px-3 py-2 border border-gray-300 text-center text-sm font-bold">MEDIA</th>
              <th className="px-3 py-2 border border-gray-300 text-center text-sm font-bold">SUELTOS</th>
            </tr>
          </thead>
          <tbody>
            {/* Medallones Eco */}
            {Object.keys(tally.medallones).length > 0 && (
              <>
                <tr className={colors.dorado}>
                  <td colSpan={5} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">Medallones (Linea Economica)</td>
                </tr>
                {Object.entries(tally.medallones).sort(([a], [b]) => Number(a) - Number(b)).map(([peso, cm]) =>
                  renderCompletaMediaRow('med', peso, cm)
                )}
              </>
            )}

            {/* Premium */}
            {Object.keys(tally.premium).length > 0 && (
              <>
                <tr className={colors.verde}>
                  <td colSpan={5} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">Hamburguesas (Linea Premium)</td>
                </tr>
                {Object.entries(tally.premium).sort(([a], [b]) => Number(a) - Number(b)).map(([peso, cm]) =>
                  renderCompletaMediaRow('prem', peso, cm)
                )}
              </>
            )}

          </tbody>
        </table>

        {/* Salchichas Cortas + Largas - tabla separada de 6 columnas */}
        {(Object.keys(tally.salchichaCorta).length > 0 || Object.keys(tally.salchichaLarga).length > 0) && (
          <table className="w-full border-collapse mt-1">
            <thead>
              <tr className={colors.azulCielo}>
                <th className="w-8 px-2 py-2 border border-gray-300"></th>
                <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold" colSpan={2}>Salchichas Cortas</th>
                <th className="w-8 px-2 py-2 border border-gray-300"></th>
                <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold" colSpan={2}>Salchichas Largas</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const cortasKeys = Object.keys(tally.salchichaCorta).map(Number).sort((a, b) => (a < 0 ? 99999 : a) - (b < 0 ? 99999 : b));
                const largasKeys = Object.keys(tally.salchichaLarga).map(Number).sort((a, b) => (a < 0 ? 99999 : a) - (b < 0 ? 99999 : b));
                const maxRows = Math.max(cortasKeys.length, largasKeys.length, 1);
                return Array.from({ length: maxRows }, (_, i) => {
                  const ck = cortasKeys[i];
                  const lk = largasKeys[i];
                  const cortaChk = ck != null && !!checks[`sc-${ck}`];
                  const largaChk = lk != null && !!checks[`sl-${lk}`];
                  const cellBgC = cortaChk ? 'bg-gray-300 text-gray-500 line-through' : '';
                  const cellBgL = largaChk ? 'bg-gray-300 text-gray-500 line-through' : '';
                  return (
                    <tr key={`sal-${i}`}>
                      <td className={`px-2 py-1.5 border border-gray-300 text-center ${cellBgC}`}>
                        {ck != null && (readonly
                          ? <span className="inline-block w-4 h-4" />
                          : <input type="checkbox" checked={!!checks[`sc-${ck}`]} onChange={(e) => toggle(`sc-${ck}`, e.target.checked)} className="w-4 h-4" />
                        )}
                      </td>
                      <td className={`px-3 py-1.5 border border-gray-300 font-medium text-sm ${cellBgC}`}>{ck != null ? (ck < 0 ? 'Caja' : `${ck} un.`) : ''}</td>
                      <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBgC}`}>{ck != null ? formatCantidad(tally.salchichaCorta[ck.toString()]) : '-'}</td>
                      <td className={`px-2 py-1.5 border border-gray-300 text-center ${cellBgL}`}>
                        {lk != null && (readonly
                          ? <span className="inline-block w-4 h-4" />
                          : <input type="checkbox" checked={!!checks[`sl-${lk}`]} onChange={(e) => toggle(`sl-${lk}`, e.target.checked)} className="w-4 h-4" />
                        )}
                      </td>
                      <td className={`px-3 py-1.5 border border-gray-300 font-medium text-sm ${cellBgL}`}>{lk != null ? (lk < 0 ? 'Caja' : `${lk} un.`) : ''}</td>
                      <td className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBgL}`}>{lk != null ? formatCantidad(tally.salchichaLarga[lk.toString()]) : '-'}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        )}

        {/* Otros - debajo de salchichas */}
        {Object.keys(tally.otros).length > 0 && (
          <table className="w-full border-collapse mt-1">
            <thead>
              <tr className={colors.azulSolido}>
                <th className="w-10 px-2 py-2 border border-gray-300"></th>
                <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold" colSpan={4}>Otros</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tally.otros).sort(([a], [b]) => a.localeCompare(b)).map(([nombre, cantidad]) => {
                const id = `otros-${nombre}`;
                const cellBg = checks[id] ? 'bg-gray-300 text-gray-500 line-through' : '';
                return (
                  <tr key={id}>
                    <td className={`px-3 py-1.5 border border-gray-300 ${cellBg}`}>
                      {readonly
                        ? <span className="inline-block w-4 h-4" />
                        : <input type="checkbox" checked={!!checks[id]} onChange={(e) => toggle(id, e.target.checked)} className="w-4 h-4" />
                      }
                    </td>
                    <td colSpan={2} className={`px-3 py-1.5 border border-gray-300 font-medium text-sm ${cellBg}`}>{nombre}</td>
                    <td colSpan={2} className={`px-3 py-1.5 border border-gray-300 font-mono text-sm text-center ${cellBg}`}>{cantidad}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* RIGHT COLUMN - Panes + Aderezos */}
      <div>
        <table className="w-full border-collapse">
          <thead>
            <tr className={colors.headerFila1}>
              <th className="w-10 px-2 py-2 border border-gray-300"></th>
              <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold">Panes / Aderezos</th>
              <th className="px-3 py-2 border border-gray-300 text-left text-sm font-bold">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {/* Pan Tradicional */}
            {Object.keys(tally.panTradicional).length > 0 && (
              <TallySection title="Pan Tradicional" bg={colors.dorado}>
                {renderPan('pt', tally.panTradicional)}
              </TallySection>
            )}

            {/* Pan Maxi */}
            {Object.keys(tally.panMaxi).length > 0 && (
              <TallySection title="Pan Maxihamburguesa" bg={colors.verde}>
                {renderPan('pm', tally.panMaxi)}
              </TallySection>
            )}

            {/* Pan Pancho */}
            {Object.keys(tally.panPancho).length > 0 && (
              <TallySection title="Pan Pancho" bg={colors.azulCielo}>
                {renderPan('pp', tally.panPancho)}
              </TallySection>
            )}

            {/* Pan SuperPancho */}
            {Object.keys(tally.panSuperPancho).length > 0 && (
              <TallySection title="Pan SuperPancho" bg={colors.naranja}>
                {renderPan('psp', tally.panSuperPancho)}
              </TallySection>
            )}

            {/* Aderezos */}
            {Object.keys(tally.aderezos).length > 0 && (
              <TallySection title="Aderezos / Salsas" bg={colors.amarillo}>
                {Object.entries(tally.aderezos).sort(([a], [b]) => a.localeCompare(b)).map(([nombre, cantidad]) => {
                  const id = `ade-${nombre}`;
                  return <CheckRow key={id} id={id} checked={!!checks[id]} onChange={toggle} label={nombre} value={cantidad.toString()} readonly={readonly} />;
                })}
              </TallySection>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ─── Componente de historial ─────────────────────────────────────────────────

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function HistorialItem({ item }: { item: ControlCamionetaHistorialItem }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Cabecera del ítem */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-semibold text-gray-800">{item.repartidorNombre}</span>
            {item.repartidorVehiculo && (
              <span className="ml-2 text-xs text-gray-500">— {item.repartidorVehiculo}</span>
            )}
          </div>
          <span className="text-xs text-gray-400">Zona: {item.zonaNombre}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex gap-3 text-xs">
            <span className="text-green-700 font-medium">{item.totalEntregados} entregados</span>
            {item.totalNoEntregados > 0 && (
              <span className="text-red-600 font-medium">{item.totalNoEntregados} no entregados</span>
            )}
            {item.totalCancelados > 0 && (
              <span className="text-gray-500">{item.totalCancelados} cancelados</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {formatHora(item.fechaInicio)} — {item.fechaFinalizacion ? formatHora(item.fechaFinalizacion) : '?'}
          </div>
          <button
            onClick={() => setExpandido(v => !v)}
            disabled={!item.tally}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              item.tally
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!item.tally ? 'Sin tally' : expandido ? 'Ocultar tally' : 'Ver tally'}
          </button>
        </div>
      </div>

      {/* Tally expandido */}
      {expandido && item.tally && (
        <div className="p-4 opacity-80">
          <RepartidorPanel tally={item.tally} readonly />
        </div>
      )}
    </div>
  );
}

function SeccionHistorial({ localActivo }: { localActivo: number | null }) {
  const hoy = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [fecha, setFecha] = useState(hoy);
  const [items, setItems] = useState<ControlCamionetaHistorialItem[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHistorial = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const res = await getControlCamionetaHistorial(f);
      const filtrados = localActivo
        ? res.items.filter(i => !i.repartidorLocalId || i.repartidorLocalId === localActivo)
        : res.items;
      setItems(filtrados);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [localActivo]);

  useEffect(() => {
    cargarHistorial(fecha);
  }, [fecha, cargarHistorial]);

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Historial de repartos finalizados</h3>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="text-sm border border-slate-300 rounded px-2 py-1 bg-white text-gray-700"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border px-4 py-8 text-center text-gray-400 text-sm">
          No hay repartos finalizados para esta fecha
        </div>
      )}

      {!loading && items.map(item => (
        <HistorialItem key={item.repartoZonaId} item={item} />
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ControlCamionetasPage() {
  const { localActivo } = useLocalActivo();
  const { showToast } = useGlobalToast();
  const [data, setData] = useState<RepartidorTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const tallyRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const descargarPDF = async () => {
    if (!tallyRef.current) return;
    setGenerandoPDF(true);
    try {
      const canvas = await html2canvas(tallyRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: tallyRef.current.scrollWidth,
        windowHeight: tallyRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const margin = 5;
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;
      const ratio = Math.min(availW / imgProps.width, availH / imgProps.height);
      const w = imgProps.width * ratio;
      const h = imgProps.height * ratio;
      pdf.addImage(imgData, 'PNG', (pageWidth - w) / 2, margin, w, h);
      const fecha = new Date().toISOString().slice(0, 10);
      const nombre = activeTally?.nombre?.replace(/\s+/g, '_') ?? 'Control';
      pdf.save(`ControlCamionetas_${nombre}_${fecha}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      showToast('Error al generar el PDF', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await getControlCamioneta();
      setData(localActivo ? res.repartidores.filter(r => !r.repartidorLocalId || r.repartidorLocalId === localActivo) : res.repartidores);
    } catch (err) {
      console.error('Error cargando control camioneta:', err);
      showToast('Error al cargar el control de camioneta', 'error');
    } finally {
      setLoading(false);
    }
  }, [localActivo]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  const activeTally = data[activeTab] ?? null;

  return (
    <div className="space-y-6">
      {/* ── Sección activos ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5">
          <h2 className="text-lg font-bold text-white">Control de Camionetas</h2>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-14 h-14 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.75M3.375 14.25h17.25M21 11.25V8.625c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v2.625" />
            </svg>
            <p className="font-medium">No hay repartos activos en este momento</p>
            <p className="text-sm text-gray-400 mt-1">Los repartos en curso apareceran aqui</p>
          </div>
        ) : (
          <>
            {/* Tabs + botón Excel */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {data.map((rep, idx) => (
                  <button
                    key={rep.repartidorId}
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      idx === activeTab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {rep.nombre}
                    <span className="ml-2 text-xs text-gray-400">({rep.totalPedidos} ped.)</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => descargarControlCamioneta([])}
                  className="px-4 py-2 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Descargar Excel
                </button>
                <button
                  onClick={descargarPDF}
                  disabled={generandoPDF}
                  className="px-4 py-2 text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {generandoPDF ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </div>

            {/* Info repartidor activo */}
            <div ref={tallyRef} className="bg-white">
              {activeTally && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Repartidor:</span>
                      <span className="ml-2 font-semibold">{activeTally.nombre}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Camioneta:</span>
                      <span className="ml-2 font-semibold">{activeTally.vehiculo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <span className="ml-2 font-semibold">{activeTally.fecha}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tally activo */}
              {activeTally && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
                  <RepartidorPanel key={activeTally.repartidorId} tally={activeTally} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Sección historial ───────────────────────────────────────────── */}
      <SeccionHistorial localActivo={localActivo} />
    </div>
  );
}
