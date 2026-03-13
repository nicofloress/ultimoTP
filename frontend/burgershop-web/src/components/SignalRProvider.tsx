import { ReactNode } from 'react';
import { useSignalR } from '../hooks/useSignalR';

export function SignalRProvider({ children }: { children: ReactNode }) {
  useSignalR();
  return <>{children}</>;
}
