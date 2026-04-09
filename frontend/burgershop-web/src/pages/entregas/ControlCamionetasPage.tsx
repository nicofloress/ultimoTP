import { useState, useEffect, useCallback } from 'react';
import { getControlCamioneta, RepartidorTally, CompletaMedia, descargarControlCamioneta } from '../../api/entregas';
import { useLocalActivo } from '../../context/LocalContext';

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
}

function CheckRow({ id, checked, onChange, label, value, bg }: CheckRowProps) {
  if (!value) return null;
  const rowClass = checked ? 'bg-gray-300 text-gray-500 line-through' : (bg || '');
  return (
    <tr className={rowClass}>
      <td className="px-3 py-1.5 border border-gray-300">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(id, e.target.checked)} className="w-4 h-4" />
      </td>
      <td className="px-3 py-1.5 border border-gray-300 font-medium text-sm">{label}</td>
      <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm">{value}</td>
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

function RepartidorPanel({ tally }: { tally: RepartidorTally }) {
  const [checks, setChecks] = useState<Record<string, boolean>>(() => loadChecks(tally.repartidorId));

  const toggle = useCallback((id: string, v: boolean) => {
    setChecks(prev => {
      const next = { ...prev, [id]: v };
      saveChecks(tally.repartidorId, next);
      return next;
    });
  }, [tally.repartidorId]);

  const renderCompletaMediaRow = (prefix: string, peso: string, cm: CompletaMedia) => {
    if (cm.completa <= 0 && cm.media <= 0 && cm.sueltos <= 0) return null;
    const idC = `${prefix}-${peso}-completa`;
    const idM = `${prefix}-${peso}-media`;
    const isChecked = !!checks[idC] && !!checks[idM];
    const rowClass = isChecked ? 'bg-gray-300 text-gray-500 line-through' : '';
    return (
      <tr key={`${prefix}-${peso}`} className={rowClass}>
        <td className="px-3 py-1.5 border border-gray-300">
          <input type="checkbox" checked={isChecked} onChange={(e) => { toggle(idC, e.target.checked); toggle(idM, e.target.checked); }} className="w-4 h-4" />
        </td>
        <td className="px-3 py-1.5 border border-gray-300 font-medium text-sm">{peso} GR</td>
        <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{cm.completa > 0 ? formatCantidad(cm.completa) : '-'}</td>
        <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{cm.media > 0 ? formatCantidad(cm.media) : '-'}</td>
        <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{cm.sueltos > 0 ? cm.sueltos : '-'}</td>
      </tr>
    );
  };

  const renderPan = (prefix: string, panes: Record<string, number>, bg?: string) => {
    return Object.entries(panes).sort(([a], [b]) => Number(a) - Number(b)).map(([qty, count]) => {
      if (count <= 0) return null;
      const id = `${prefix}-${qty}`;
      return <CheckRow key={id} id={id} checked={!!checks[id]} onChange={toggle} label={`${qty} un.`} value={formatCantidad(count)} bg={bg} />;
    });
  };

  const totalChecks = Object.keys(checks).length;
  const checkedCount = Object.values(checks).filter(Boolean).length;

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

            {/* Salchichas Cortas + Largas combinadas */}
            {(Object.keys(tally.salchichaCorta).length > 0 || Object.keys(tally.salchichaLarga).length > 0) && (
              <>
                <tr className={colors.azulCielo}>
                  <td colSpan={3} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">Salchichas Cortas</td>
                  <td colSpan={2} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">Salchichas Largas</td>
                </tr>
                {(() => {
                  const cortasKeys = Object.keys(tally.salchichaCorta).map(Number).sort((a, b) => a - b);
                  const largasKeys = Object.keys(tally.salchichaLarga).map(Number).sort((a, b) => a - b);
                  const maxRows = Math.max(cortasKeys.length, largasKeys.length, 1);
                  return Array.from({ length: maxRows }, (_, i) => {
                    const ck = cortasKeys[i];
                    const lk = largasKeys[i];
                    return (
                      <tr key={`sal-${i}`}>
                        <td className="px-3 py-1.5 border border-gray-300">
                          {ck != null && <input type="checkbox" checked={!!checks[`sc-${ck}`]} onChange={(e) => toggle(`sc-${ck}`, e.target.checked)} className="w-4 h-4" />}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-300 font-medium text-sm">{ck != null ? `${ck} un.` : ''}</td>
                        <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{ck != null ? formatCantidad(tally.salchichaCorta[ck.toString()]) : '-'}</td>
                        <td className="px-3 py-1.5 border border-gray-300 font-medium text-sm">{lk != null ? `${lk} un.` : ''}</td>
                        <td className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{lk != null ? formatCantidad(tally.salchichaLarga[lk.toString()]) : '-'}</td>
                      </tr>
                    );
                  });
                })()}
              </>
            )}

            {/* Otros */}
            {Object.keys(tally.otros).length > 0 && (
              <>
                <tr className={colors.azulSolido}>
                  <td colSpan={5} className="px-3 py-2 border border-gray-300 font-bold text-sm uppercase">Otros</td>
                </tr>
                {Object.entries(tally.otros).sort(([a], [b]) => a.localeCompare(b)).map(([nombre, cantidad]) => {
                  const id = `otros-${nombre}`;
                  return (
                    <tr key={id} className={checks[id] ? 'bg-gray-300 text-gray-500 line-through' : ''}>
                      <td className="px-3 py-1.5 border border-gray-300">
                        <input type="checkbox" checked={!!checks[id]} onChange={(e) => toggle(id, e.target.checked)} className="w-4 h-4" />
                      </td>
                      <td colSpan={2} className="px-3 py-1.5 border border-gray-300 font-medium text-sm">{nombre}</td>
                      <td colSpan={2} className="px-3 py-1.5 border border-gray-300 font-mono text-sm text-center">{cantidad}</td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
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
                  return <CheckRow key={id} id={id} checked={!!checks[id]} onChange={toggle} label={nombre} value={cantidad.toString()} />;
                })}
              </TallySection>
            )}
          </tbody>
        </table>
      </div>

      {/* Progress bar */}
      {totalChecks > 0 && (
        <div className="lg:col-span-2 mt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(checkedCount / totalChecks) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{checkedCount}/{totalChecks} verificados</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ControlCamionetasPage() {
  const { localActivo } = useLocalActivo();
  const [data, setData] = useState<RepartidorTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await getControlCamioneta();
      setData(localActivo ? res.repartidores.filter(r => !r.repartidorLocalId || r.repartidorLocalId === localActivo) : res.repartidores);
    } catch (err) {
      console.error('Error cargando control camioneta:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.75M3.375 14.25h17.25M21 11.25V8.625c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v2.625" />
        </svg>
        <p className="text-lg font-medium">No hay repartos activos hoy</p>
        <p className="text-sm text-gray-400 mt-1">Los repartos con estado Asignado o En Camino apareceran aqui</p>
      </div>
    );
  }

  const activeTally = data[activeTab];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg px-4 py-2.5">
        <h2 className="text-lg font-bold text-white">Control de Camionetas</h2>
      </div>
      {/* Header with tabs and download button */}
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
              {rep.finalizado && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Finalizado</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            descargarControlCamioneta([]);
          }}
          className="px-4 py-2 text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-md hover:bg-emerald-100 text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar Excel
        </button>
      </div>

      {/* Repartidor info header */}
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

      {/* Finalizado banner */}
      {activeTally?.finalizado && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-green-700">Reparto finalizado — todos los pedidos fueron entregados o cerrados</span>
        </div>
      )}

      {/* Tally content */}
      {activeTally && (
        <div className={`bg-white rounded-lg shadow-sm border p-4${activeTally.finalizado ? ' opacity-60' : ''}`}>
          <RepartidorPanel key={activeTally.repartidorId} tally={activeTally} />
        </div>
      )}
    </div>
  );
}
