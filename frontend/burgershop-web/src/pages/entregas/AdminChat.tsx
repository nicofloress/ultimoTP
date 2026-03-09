import { useState, useEffect, useRef, useCallback } from 'react';
import { Repartidor, Mensaje } from '../../types';
import { getRepartidores } from '../../api/entregas';
import { getMensajesRepartidor, enviarMensajeAdmin, marcarLeidos, getNoLeidos } from '../../api/mensajes';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function AdminChat({ abierto, onCerrar }: Props) {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [seleccionado, setSeleccionado] = useState<Repartidor | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [noLeidos, setNoLeidos] = useState<Map<number, number>>(new Map());
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cargarRepartidores = useCallback(async () => {
    try {
      const reps = await getRepartidores();
      setRepartidores(reps.filter(r => r.activo));
    } catch (err) {
      console.error('Error cargando repartidores:', err);
    }
  }, []);

  const cargarNoLeidos = useCallback(async () => {
    try {
      const reps = repartidores.length > 0 ? repartidores : await getRepartidores().then(r => r.filter(rep => rep.activo));
      const counts = new Map<number, number>();
      for (const r of reps) {
        const count = await getNoLeidos(r.id, true);
        if (count > 0) counts.set(r.id, count);
      }
      setNoLeidos(counts);
    } catch (err) {
      console.error('Error cargando no leidos:', err);
    }
  }, [repartidores]);

  const cargarMensajes = useCallback(async () => {
    if (!seleccionado) return;
    try {
      const msgs = await getMensajesRepartidor(seleccionado.id);
      setMensajes(msgs);
      await marcarLeidos(seleccionado.id, true);
      setNoLeidos(prev => {
        const next = new Map(prev);
        next.delete(seleccionado.id);
        return next;
      });
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  }, [seleccionado]);

  useEffect(() => {
    if (abierto) {
      cargarRepartidores();
    }
  }, [abierto, cargarRepartidores]);

  useEffect(() => {
    if (abierto) {
      cargarNoLeidos();
      const interval = setInterval(cargarNoLeidos, 5000);
      return () => clearInterval(interval);
    }
  }, [abierto, cargarNoLeidos]);

  useEffect(() => {
    if (seleccionado) {
      cargarMensajes();
      const interval = setInterval(cargarMensajes, 5000);
      return () => clearInterval(interval);
    }
  }, [seleccionado, cargarMensajes]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  useEffect(() => {
    if (seleccionado && inputRef.current) {
      inputRef.current.focus();
    }
  }, [seleccionado]);

  const handleEnviar = async () => {
    if (!texto.trim() || !seleccionado || enviando) return;
    setEnviando(true);
    try {
      await enviarMensajeAdmin(seleccionado.id, texto.trim());
      setTexto('');
      await cargarMensajes();
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const totalNoLeidos = Array.from(noLeidos.values()).reduce((sum, c) => sum + c, 0);

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel lateral - Lista de repartidores */}
        <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-amber-600">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Chat con Repartidores</h3>
              {totalNoLeidos > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalNoLeidos}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {repartidores.map(r => (
              <button
                key={r.id}
                onClick={() => setSeleccionado(r)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-amber-50 transition-colors flex items-center justify-between ${
                  seleccionado?.id === r.id ? 'bg-amber-100 border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-gray-800 truncate">{r.nombre}</div>
                  {r.vehiculo && <div className="text-xs text-gray-400">{r.vehiculo}</div>}
                </div>
                {noLeidos.get(r.id) ? (
                  <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                    {noLeidos.get(r.id)}
                  </span>
                ) : null}
              </button>
            ))}
            {repartidores.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No hay repartidores activos</p>
            )}
          </div>
        </div>

        {/* Panel de chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header del chat */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0">
            {seleccionado ? (
              <div>
                <div className="font-bold text-gray-800">{seleccionado.nombre}</div>
                {seleccionado.vehiculo && (
                  <div className="text-xs text-gray-400">{seleccionado.vehiculo}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">Selecciona un repartidor</div>
            )}
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                  <p className="text-gray-400 text-sm text-center py-8">No hay mensajes aun. Inicia la conversacion.</p>
                ) : (
                  mensajes.map(m => (
                    <div
                      key={m.id}
                      className={`flex ${m.esDeAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                          m.esDeAdmin
                            ? 'bg-amber-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                          m.esDeAdmin ? 'text-amber-100 justify-end' : 'text-gray-400'
                        }`}>
                          {formatHora(m.fechaEnvio)}
                          {m.esDeAdmin && (
                            <span>{m.leido ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    disabled={enviando}
                  />
                  <button
                    onClick={handleEnviar}
                    disabled={!texto.trim() || enviando}
                    className="bg-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-medium">Selecciona un repartidor</p>
                <p className="text-sm mt-1">para iniciar una conversacion</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
