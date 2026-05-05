import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Repartidor, Mensaje } from '../../types';
import { getRepartidores } from '../../api/repartidores';
import {
  getMensajesRepartidor,
  enviarMensajeAdmin,
  marcarLeidos,
  getNoLeidosBulk,
} from '../../api/mensajes';
import { useGlobalToast } from '../../components/Toast';
import { useLocalActivo } from '../../context/LocalContext';
import { parseFechaUtc } from '../../utils/fechas';
import { playNotificationSound } from '../../utils/sound';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

const PLANTILLAS = [
  '¿Dónde estás?',
  'Volvé al local',
  'Llevate cambio',
  'Llamame',
  'Esperá unos minutos',
  'Listo, gracias',
];

interface ChatNuevoMensajeDetail {
  esDeAdmin?: boolean;
  repartidorId?: number;
  localId?: number | null;
}

export default function AdminChat({ abierto, onCerrar }: Props) {
  const { showToast } = useGlobalToast();
  const { localActivo, esSuperAdmin } = useLocalActivo();
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [seleccionado, setSeleccionado] = useState<Repartidor | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [noLeidos, setNoLeidos] = useState<Map<number, number>>(new Map());
  const [plantillasAbiertas, setPlantillasAbiertas] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seleccionadoRef = useRef<Repartidor | null>(null);

  useEffect(() => {
    seleccionadoRef.current = seleccionado;
  }, [seleccionado]);

  // Lista visible filtrada por local activo (SuperAdmin ve todos)
  const repartidoresVisibles = useMemo(() => {
    return repartidores.filter(r => {
      if (!r.activo) return false;
      if (esSuperAdmin) return true;
      return r.localId === localActivo;
    });
  }, [repartidores, esSuperAdmin, localActivo]);

  const cargarRepartidores = useCallback(async () => {
    try {
      const reps = await getRepartidores();
      setRepartidores(reps);
    } catch (err) {
      console.error('Error cargando repartidores:', err);
      showToast('Error al cargar repartidores', 'error');
    }
  }, [showToast]);

  const cargarNoLeidos = useCallback(async () => {
    try {
      const localId = esSuperAdmin ? null : localActivo;
      const counts = await getNoLeidosBulk(localId, true);
      const map = new Map<number, number>();
      counts.forEach(c => {
        if (c.count > 0) map.set(c.repartidorId, c.count);
      });
      setNoLeidos(map);
    } catch (err) {
      console.error('Error cargando no leidos:', err);
    }
  }, [localActivo, esSuperAdmin]);

  const cargarMensajes = useCallback(async (rep: Repartidor) => {
    try {
      const msgs = await getMensajesRepartidor(rep.id);
      setMensajes(msgs);
      await marcarLeidos(rep.id, true);
      setNoLeidos(prev => {
        if (!prev.has(rep.id)) return prev;
        const next = new Map(prev);
        next.delete(rep.id);
        return next;
      });
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      showToast('Error al cargar mensajes', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (abierto) {
      cargarRepartidores();
      cargarNoLeidos();
    } else {
      // Reset al cerrar
      setSeleccionado(null);
      setMensajes([]);
      setTexto('');
      setPlantillasAbiertas(false);
    }
  }, [abierto, cargarRepartidores, cargarNoLeidos]);

  // Si cambia el local activo, deseleccionar conversacion para evitar mostrar de otro local
  useEffect(() => {
    setSeleccionado(null);
    setMensajes([]);
  }, [localActivo]);

  // Polling de fallback (30s) por si SignalR se desconecta
  useEffect(() => {
    if (!abierto) return;
    const interval = setInterval(() => {
      cargarNoLeidos();
      const sel = seleccionadoRef.current;
      if (sel) cargarMensajes(sel);
    }, 30000);
    return () => clearInterval(interval);
  }, [abierto, cargarNoLeidos, cargarMensajes]);

  // Cargar mensajes cuando se selecciona repartidor
  useEffect(() => {
    if (seleccionado) {
      cargarMensajes(seleccionado);
    }
  }, [seleccionado, cargarMensajes]);

  // Suscripcion a evento SignalR (real-time, sin polling)
  useEffect(() => {
    if (!abierto) return;

    const handler = (e: Event) => {
      const evt = e as CustomEvent<ChatNuevoMensajeDetail>;
      const data = evt.detail || {};
      // Solo nos interesan los mensajes que recibe el admin (los enviados por el repartidor)
      if (data.esDeAdmin === true) return;
      // Filtrar por local activo si no es SuperAdmin
      if (!esSuperAdmin && data.localId != null && data.localId !== localActivo) return;

      const sel = seleccionadoRef.current;
      const repId = data.repartidorId;

      if (sel && repId === sel.id) {
        // Conversacion abierta: refrescar mensajes (no incrementa contador)
        cargarMensajes(sel);
      } else {
        // Conversacion no abierta: refrescar contadores y avisar
        cargarNoLeidos();
        playNotificationSound();
      }
    };

    window.addEventListener('chat:nuevo-mensaje', handler);
    return () => window.removeEventListener('chat:nuevo-mensaje', handler);
  }, [abierto, esSuperAdmin, localActivo, cargarMensajes, cargarNoLeidos]);

  // Scroll al final cuando cambian mensajes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Focus input al seleccionar
  useEffect(() => {
    if (seleccionado && inputRef.current) {
      inputRef.current.focus();
    }
  }, [seleccionado]);

  const enviarTexto = async (txt: string) => {
    const limpio = txt.trim();
    if (!limpio || !seleccionado || enviando) return;
    setEnviando(true);
    try {
      await enviarMensajeAdmin(seleccionado.id, limpio);
      setTexto('');
      setPlantillasAbiertas(false);
      await cargarMensajes(seleccionado);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      showToast('Error al enviar el mensaje', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviar = () => enviarTexto(texto);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const totalNoLeidos = Array.from(noLeidos.values()).reduce((sum, c) => sum + c, 0);

  const formatHora = (fecha: string) =>
    parseFechaUtc(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label="Chat con repartidores"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] sm:h-[85vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel lateral - Lista de repartidores
            En mobile: oculto cuando hay conversacion seleccionada */}
        <div
          className={`${seleccionado ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 border-r border-gray-200 flex-col bg-gray-50 flex-shrink-0`}
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-b from-slate-500 to-slate-700 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-white text-sm">Chat Repartidores</h3>
            <div className="flex items-center gap-2">
              {totalNoLeidos > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalNoLeidos}
                </span>
              )}
              <button
                onClick={onCerrar}
                className="text-white/80 hover:text-white sm:hidden p-1"
                aria-label="Cerrar chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {repartidoresVisibles.map(r => {
              const cantidad = noLeidos.get(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setSeleccionado(r)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    seleccionado?.id === r.id ? 'bg-slate-100 border-l-4 border-l-slate-500' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-800 truncate">{r.nombre}</div>
                    {r.vehiculo && <div className="text-xs text-gray-400 truncate">{r.vehiculo}</div>}
                  </div>
                  {cantidad ? (
                    <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      {cantidad}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {repartidoresVisibles.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8 px-4">
                No hay repartidores activos en este local
              </p>
            )}
          </div>
        </div>

        {/* Panel de chat */}
        <div className={`${seleccionado ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`}>
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-white flex-shrink-0">
            {seleccionado && (
              <button
                onClick={() => setSeleccionado(null)}
                className="sm:hidden text-gray-500 hover:text-gray-700 p-1 -ml-1"
                aria-label="Volver a la lista"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              {seleccionado ? (
                <>
                  <div className="font-bold text-gray-800 truncate">{seleccionado.nombre}</div>
                  {seleccionado.vehiculo && (
                    <div className="text-xs text-gray-400 truncate">{seleccionado.vehiculo}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm">Seleccioná un repartidor</div>
              )}
            </div>
            <button
              onClick={onCerrar}
              className="hidden sm:block text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          {seleccionado ? (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {mensajes.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No hay mensajes aún. Iniciá la conversación.
                  </p>
                ) : (
                  mensajes.map(m => (
                    <div key={m.id} className={`flex ${m.esDeAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                          m.esDeAdmin
                            ? 'bg-slate-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                        <div
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            m.esDeAdmin ? 'text-slate-300 justify-end' : 'text-gray-400'
                          }`}
                        >
                          {formatHora(m.fechaEnvio)}
                          {m.esDeAdmin && <span>{m.leido ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input + plantillas */}
              <div className="border-t border-gray-200 bg-white flex-shrink-0 relative">
                {plantillasAbiertas && (
                  <div className="absolute bottom-full left-0 right-0 bg-white border-t border-x border-gray-200 rounded-t-lg shadow-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {PLANTILLAS.map(p => (
                      <button
                        key={p}
                        onClick={() => enviarTexto(p)}
                        disabled={enviando}
                        className="text-left text-sm px-3 py-2 rounded hover:bg-slate-100 transition-colors text-gray-700 disabled:opacity-50"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-3 flex gap-2 items-center">
                  <button
                    onClick={() => setPlantillasAbiertas(v => !v)}
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      plantillasAbiertas
                        ? 'bg-slate-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label="Plantillas rápidas"
                    title="Plantillas rápidas"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    disabled={enviando}
                  />
                  <button
                    onClick={handleEnviar}
                    disabled={!texto.trim() || enviando}
                    className="bg-slate-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Enviar mensaje"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400 px-6">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-medium">Seleccioná un repartidor</p>
                <p className="text-sm mt-1">para iniciar una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
