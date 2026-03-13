import { useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import { useGlobalToast, ToastType } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL || '';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

interface SignalREvent {
  mensaje: string;
  [key: string]: unknown;
}

export function useSignalR() {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useGlobalToast();
  const connectionRef = useRef<HubConnection | null>(null);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    playNotificationSound();
    showToast(message, type);
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const hubUrl = API_URL
      ? `${API_URL.replace(/\/api\/?$/, '')}/hubs/notificaciones`
      : `${window.location.origin}/hubs/notificaciones`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    // Pedidos
    connection.on('NuevoPedido', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    connection.on('PedidoAsignado', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    connection.on('PedidoEntregado', (data: SignalREvent) => {
      notify(data.mensaje, 'success');
    });

    connection.on('PedidoCancelado', (data: SignalREvent) => {
      notify(data.mensaje, 'error');
    });

    connection.on('CambioEstado', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    // Mensajes
    connection.on('NuevoMensaje', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    // Reparto masivo
    connection.on('RepartoIniciado', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    connection
      .start()
      .catch((err) => console.error('SignalR connection error:', err));

    connectionRef.current = connection;

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [isAuthenticated, token, notify]);

  return connectionRef;
}
