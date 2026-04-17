import { useEffect, useRef, useCallback } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import { useLocalActivo } from '../context/LocalContext';
import { useGlobalToast, ToastType } from '../components/Toast';
import { playNotificationSound } from '../utils/sound';

const API_URL = import.meta.env.VITE_API_URL || '';

interface SignalREvent {
  mensaje: string;
  localId?: number | null;
  [key: string]: unknown;
}

export function useSignalR() {
  const { token, isAuthenticated } = useAuth();
  const { localActivo } = useLocalActivo();
  const { showToast } = useGlobalToast();
  const connectionRef = useRef<HubConnection | null>(null);
  const localActivoRef = useRef(localActivo);

  // Mantener ref actualizada para que los callbacks de SignalR siempre lean el valor actual
  useEffect(() => {
    localActivoRef.current = localActivo;
  }, [localActivo]);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    playNotificationSound();
    showToast(message, type);
  }, [showToast]);

  const notifyIfLocal = useCallback((data: SignalREvent, type: ToastType = 'info') => {
    // Si la notificación trae localId, solo mostrar si coincide con el local activo
    if (data.localId != null && data.localId !== localActivoRef.current) return;
    notify(data.mensaje, type);
  }, [notify]);

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
      notifyIfLocal(data, 'info');
    });

    connection.on('PedidoAsignado', (data: SignalREvent) => {
      notify(data.mensaje, 'info');
    });

    connection.on('PedidoEntregado', (data: SignalREvent) => {
      notifyIfLocal(data, 'success');
    });

    connection.on('PedidoCancelado', (data: SignalREvent) => {
      notifyIfLocal(data, 'error');
    });

    connection.on('CambioEstado', (data: SignalREvent) => {
      notifyIfLocal(data, 'info');
    });

    // Mensajes
    connection.on('NuevoMensaje', (data: SignalREvent) => {
      notifyIfLocal(data, 'info');
    });

    // Reparto masivo (va directo al repartidor, no necesita filtro)
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
  }, [isAuthenticated, token, notify, notifyIfLocal]);

  return connectionRef;
}
