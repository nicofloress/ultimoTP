import { useEffect, useRef, useState } from 'react';
import { getVentasDeposito, marcarVencidoDeposito } from '../../api/deposito';
import type { Venta } from '../../types';
import { parseFechaUtc } from '../../utils/fechas';

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
  const d = parseFechaUtc(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const formatMoney = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

const TIEMPO_POCO = 300; // 5 minutos en segundos (<=2 items)
const TIEMPO_MUCHO = 600; // 10 minutos en segundos (>2 items)

/** Tiempo limite (en segundos) segun la cantidad de lineas de la venta */
const getTiempoLimite = (v: Venta) => (v.lineas.length <= 2 ? TIEMPO_POCO : TIEMPO_MUCHO);

/** Fecha de referencia para el timer: usa fechaEnvioDeposito si existe, sino fechaCreacion */
const getFechaReferencia = (v: Venta) => v.fechaEnvioDeposito || v.fechaCreacion;

/** Segundos transcurridos desde la fecha de referencia, clampeado a >=0
 *  (pedidos con fecha futura/programada arrancan en 0) */
const getSegundosTranscurridos = (v: Venta, now: Date) =>
  Math.max(0, (now.getTime() - parseFechaUtc(getFechaReferencia(v)).getTime()) / 1000);

/** Formato cuenta atras MM:SS */
const formatTiempoRestante = (restanteSegs: number) => {
  const total = Math.max(0, Math.floor(restanteSegs));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function DepositoPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [fadingOutId, setFadingOutId] = useState<number | null>(null);
  const venciendoRef = useRef<Set<number>>(new Set());
  const idsAnterioresRef = useRef<Set<number>>(new Set());
  const primeraCargaRef = useRef(true);

  const marcarVencido = async (id: number) => {
    if (venciendoRef.current.has(id)) return;
    venciendoRef.current.add(id);
    setFadingOutId(id);
    try {
      await marcarVencidoDeposito(id);
    } catch {
      // ignore
    }
    setTimeout(() => {
      setVentas(prev => prev.filter(v => v.id !== id));
      setFadingOutId(null);
      venciendoRef.current.delete(id);
    }, 800);
  };

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
        // Ordenar por fecha de referencia ascendente (más vieja arriba)
        const ordenadas = [...data].sort(
          (a, b) => parseFechaUtc(getFechaReferencia(a)).getTime() - parseFechaUtc(getFechaReferencia(b)).getTime()
        );
        setVentas(ordenadas);
      } catch {
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

  // Reloj cada segundo
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detectar ventas cuyo timer llegó a 0 -> marcar vencido en BD
  useEffect(() => {
    if (ventas.length === 0) return;
    for (const v of ventas) {
      const transcurridos = getSegundosTranscurridos(v, now);
      const restante = getTiempoLimite(v) - transcurridos;
      if (restante <= 0 && !venciendoRef.current.has(v.id)) {
        marcarVencido(v.id);
        break; // una a la vez
      }
    }
  }, [now, ventas]);

  const primeroId = ventas[0]?.id;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-950 border-b-4 border-orange-500 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-5xl font-extrabold tracking-wide">DEPOSITO</h1>
        <div className="text-3xl sm:text-6xl font-mono font-bold text-orange-400">{formatTime(now)}</div>
        <div className="text-lg sm:text-3xl font-bold">
          <span className="text-slate-400">Pedidos: </span>
          <span className="text-white">{ventas.length}</span>
        </div>
      </header>

      <main className="px-4 sm:px-8 py-4 sm:py-6">
        {ventas.length === 0 ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-5xl text-slate-500 font-semibold">Sin pedidos pendientes</div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {ventas.map(v => {
              const esPrimero = v.id === primeroId;
              const fading = fadingOutId === v.id;
              const segundosTranscurridos = getSegundosTranscurridos(v, now);
              const restante = getTiempoLimite(v) - segundosTranscurridos;

              return (
                <div
                  key={v.id}
                  className={[
                    'relative rounded-2xl p-4 sm:p-8 shadow-2xl transition-opacity duration-700',
                    fading ? 'opacity-0' : 'opacity-100',
                    esPrimero
                      ? 'bg-slate-800 border-8 border-orange-500 ring-4 ring-yellow-400/40'
                      : 'bg-slate-800 border-2 border-slate-700',
                  ].join(' ')}
                >
                  {/* Boton X para descartar */}
                  <button
                    onClick={() => marcarVencido(v.id)}
                    className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition-colors text-3xl font-bold leading-none"
                  >
                    &times;
                  </button>

                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div>
                      <div className="text-4xl sm:text-6xl font-extrabold text-orange-400">
                        #{v.numeroTicket}
                      </div>
                      <div className="text-lg sm:text-2xl text-slate-300 mt-2">
                        Hora: <span className="font-bold text-white">{formatHora(getFechaReferencia(v))}</span>
                      </div>
                    </div>
                    {esPrimero && (
                      <div className="text-right">
                        <div className="text-lg sm:text-2xl text-yellow-300 uppercase font-bold">Tiempo</div>
                        <div
                          className={[
                            'font-mono font-extrabold text-5xl sm:text-7xl tabular-nums',
                            restante <= 60 ? 'text-red-500 animate-pulse' : 'text-yellow-300',
                          ].join(' ')}
                        >
                          {formatTiempoRestante(restante)}
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="divide-y divide-slate-700 border-t border-b border-slate-700">
                    {v.lineas.map(d => (
                      <li key={d.id} className="py-3 flex items-baseline gap-4 text-xl sm:text-3xl">
                        <span className="font-extrabold text-orange-300 w-14 sm:w-20">{d.cantidad}x</span>
                        <span className="flex-1 font-semibold">{d.descripcion}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-end mt-4">
                    <div className="text-xl sm:text-3xl">
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
