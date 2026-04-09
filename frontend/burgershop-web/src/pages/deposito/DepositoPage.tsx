import { useEffect, useRef, useState } from 'react';
import { getVentasDeposito } from '../../api/deposito';
import type { Venta } from '../../types';

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 200);
  } catch {
    // ignore
  }
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const formatMMSS = (segundos: number) => {
  const s = Math.max(0, Math.floor(segundos));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const formatMoney = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

/** Tiempo visible en segundos según cantidad de líneas: <=2 → 5min, >=3 → 10min */
const getTiempoVenta = (lineas: number) => lineas >= 3 ? 600 : 300;

export default function DepositoPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [fadingOutId, setFadingOutId] = useState<number | null>(null);
  const [descartadas, setDescartadas] = useState<Set<number>>(new Set());
  const idsAnterioresRef = useRef<Set<number>>(new Set());
  const primeraCargaRef = useRef(true);

  // Fetch + polling
  useEffect(() => {
    let cancelado = false;

    const fetchVentas = async () => {
      try {
        const data = await getVentasDeposito();
        if (cancelado) return;
        const idsActuales = new Set(data.map(v => v.id));
        if (!primeraCargaRef.current) {
          const hayNueva = data.some(v => !idsAnterioresRef.current.has(v.id));
          if (hayNueva) playBeep();
        }
        idsAnterioresRef.current = idsActuales;
        primeraCargaRef.current = false;
        // Ordenar por fecha ascendente (más vieja arriba)
        const ordenadas = [...data].sort(
          (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
        );
        setVentas(ordenadas);
      } catch (e) {
        // ignore
      }
    };

    fetchVentas();
    const interval = setInterval(fetchVentas, 10000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, []);

  // Reloj y timer del primero (cada segundo)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detectar ventas cuyo timer llegó a 0 -> fade-out + remover
  useEffect(() => {
    if (ventasVisibles.length === 0) return;
    for (const v of ventasVisibles) {
      const tiempo = getTiempoVenta(v.lineas.length);
      const transcurridos = (now.getTime() - new Date(v.fechaCreacion).getTime()) / 1000;
      const restante = tiempo - transcurridos;
      if (restante <= 0 && fadingOutId !== v.id) {
        setFadingOutId(v.id);
        setTimeout(() => {
          setDescartadas(prev => new Set(prev).add(v.id));
          setFadingOutId(null);
        }, 1000);
        break; // una a la vez
      }
    }
  }, [now, ventas, fadingOutId, descartadas]);

  const ventasVisibles = ventas.filter(v => !descartadas.has(v.id));

  const descartarManual = (id: number) => {
    setFadingOutId(id);
    setTimeout(() => {
      setDescartadas(prev => new Set(prev).add(id));
      setFadingOutId(null);
    }, 500);
  };

  const primeroId = ventasVisibles[0]?.id;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-950 border-b-4 border-orange-500 px-8 py-5 flex items-center justify-between">
        <h1 className="text-5xl font-extrabold tracking-wide">DEPOSITO</h1>
        <div className="text-6xl font-mono font-bold text-orange-400">{formatTime(now)}</div>
        <div className="text-3xl font-bold">
          <span className="text-slate-400">Pedidos: </span>
          <span className="text-white">{ventasVisibles.length}</span>
        </div>
      </header>

      <main className="px-8 py-6">
        {ventasVisibles.length === 0 ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-5xl text-slate-500 font-semibold">Sin pedidos pendientes</div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {ventasVisibles.map(v => {
              const esPrimero = v.id === primeroId;
              const fading = fadingOutId === v.id;
              const tiempo = getTiempoVenta(v.lineas.length);
              const segundosTranscurridos =
                (now.getTime() - new Date(v.fechaCreacion).getTime()) / 1000;
              const restante = tiempo - segundosTranscurridos;

              return (
                <div
                  key={v.id}
                  className={[
                    'relative rounded-2xl p-8 shadow-2xl transition-opacity duration-1000',
                    fading ? 'opacity-0' : 'opacity-100',
                    esPrimero
                      ? 'bg-slate-800 border-8 border-orange-500 ring-4 ring-yellow-400/40'
                      : 'bg-slate-800 border-2 border-slate-700',
                  ].join(' ')}
                >
                  {/* Boton X para descartar */}
                  <button
                    onClick={() => descartarManual(v.id)}
                    className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition-colors text-3xl font-bold leading-none"
                  >
                    &times;
                  </button>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-6xl font-extrabold text-orange-400">
                        #{v.numeroTicket}
                      </div>
                      <div className="text-2xl text-slate-300 mt-2">
                        Hora: <span className="font-bold text-white">{formatHora(v.fechaCreacion)}</span>
                        <span className="ml-4 text-lg text-slate-500">({v.lineas.length >= 3 ? '10' : '5'} min)</span>
                      </div>
                    </div>
                    {esPrimero && (
                      <div className="text-right">
                        <div className="text-2xl text-yellow-300 uppercase font-bold">Tiempo</div>
                        <div
                          className={[
                            'font-mono font-extrabold text-7xl',
                            restante <= 60 ? 'text-red-500 animate-pulse' : 'text-yellow-300',
                          ].join(' ')}
                        >
                          {formatMMSS(restante)}
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="divide-y divide-slate-700 border-t border-b border-slate-700">
                    {v.lineas.map(d => (
                      <li key={d.id} className="py-3 flex items-baseline gap-6 text-3xl">
                        <span className="font-extrabold text-orange-300 w-20">{d.cantidad}x</span>
                        <span className="flex-1 font-semibold">{d.descripcion}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-end mt-4">
                    <div className="text-3xl">
                      <span className="text-slate-400 mr-3">Total:</span>
                      <span className="font-extrabold text-white">{formatMoney(v.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
