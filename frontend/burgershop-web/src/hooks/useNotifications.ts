import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedido, EstadoPedido } from '../types';
import { getEntregasRepartidor } from '../api/entregas';
import { useGlobalToast } from '../components/Toast';

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

interface UseNotificationsReturn {
  pendingCount: number;
  entregas: Pedido[];
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
  isRefreshing: boolean;
}

export function useNotifications(repartidorId: number | null, pollingInterval = 15000): UseNotificationsReturn {
  const [entregas, setEntregas] = useState<Pedido[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevIdsRef = useRef<Set<number>>(new Set());
  const initialLoadRef = useRef(true);
  const { showToast } = useGlobalToast();

  const refresh = useCallback(async () => {
    if (!repartidorId) return;
    setIsRefreshing(true);
    try {
      const data = await getEntregasRepartidor(repartidorId);
      setEntregas(data);
      setLastRefresh(new Date());

      const activeOrders = data.filter(
        p => p.estado === EstadoPedido.Asignado || p.estado === EstadoPedido.EnCamino
      );
      const currentIds = new Set(activeOrders.map(p => p.id));

      if (!initialLoadRef.current) {
        const newOrders = activeOrders.filter(p => !prevIdsRef.current.has(p.id));
        if (newOrders.length > 0) {
          playNotificationSound();
          newOrders.forEach(p => {
            showToast(
              `Nuevo reparto: ${p.numeroTicket}${p.direccionEntrega ? ' - ' + p.direccionEntrega : ''}`,
              'info'
            );
          });
        }
      }

      prevIdsRef.current = currentIds;
      initialLoadRef.current = false;
    } catch {
      // silently fail on polling errors
    } finally {
      setIsRefreshing(false);
    }
  }, [repartidorId, showToast]);

  useEffect(() => {
    if (!repartidorId) return;
    initialLoadRef.current = true;
    prevIdsRef.current = new Set();
    refresh();
  }, [repartidorId, refresh]);

  useEffect(() => {
    if (!repartidorId) return;
    const interval = setInterval(refresh, pollingInterval);
    return () => clearInterval(interval);
  }, [repartidorId, pollingInterval, refresh]);

  const pendingCount = entregas.filter(
    e => e.estado === EstadoPedido.Asignado || e.estado === EstadoPedido.EnCamino
  ).length;

  return { pendingCount, entregas, refresh, lastRefresh, isRefreshing };
}
