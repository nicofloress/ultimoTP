import { useState, useEffect, useCallback } from 'react';
import { Pedido, EstadoPedido } from '../types';
import { getEntregasRepartidor } from '../api/entregas';

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

  const refresh = useCallback(async () => {
    if (!repartidorId) return;
    setIsRefreshing(true);
    try {
      const data = await getEntregasRepartidor(repartidorId);
      setEntregas(data);
      setLastRefresh(new Date());
    } catch {
      // silently fail on polling errors
    } finally {
      setIsRefreshing(false);
    }
  }, [repartidorId]);

  useEffect(() => {
    if (!repartidorId) return;
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
