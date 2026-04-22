import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLocales, LocalDto } from '../api/locales';
import { useAuth } from './AuthContext';
import { RolUsuario } from '../types/auth';

interface LocalContextType {
  locales: LocalDto[];
  localActivo: number; // 0 = todos (solo SuperAdmin)
  setLocalActivo: (id: number) => void;
  esSuperAdmin: boolean;
  localNombre: string;
}

const LocalContext = createContext<LocalContextType | null>(null);

export function LocalProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.rol === RolUsuario.SuperAdmin;
  const [locales, setLocales] = useState<LocalDto[]>([]);
  const [localActivo, setLocalActivo] = useState<number>(
    esSuperAdmin ? (usuario?.localId || 1) : (usuario?.localId || 1)
  );

  useEffect(() => {
    if (!usuario) return;
    const rolesConAccesoLocales: RolUsuario[] = [
      RolUsuario.SuperAdmin,
      RolUsuario.Administrador,
      RolUsuario.Local,
    ];
    if (!rolesConAccesoLocales.includes(usuario.rol)) return;
    getLocales().then(setLocales).catch(() => {});
  }, [usuario?.id]);

  // Si el usuario cambia (login), resetear al local del usuario
  useEffect(() => {
    if (usuario?.localId) {
      setLocalActivo(usuario.localId);
    }
  }, [usuario?.id]);

  const localNombre = locales.find(l => l.id === localActivo)?.nombre || 'Local';

  return (
    <LocalContext.Provider value={{ locales, localActivo, setLocalActivo, esSuperAdmin, localNombre }}>
      {children}
    </LocalContext.Provider>
  );
}

export function useLocalActivo(): LocalContextType {
  const ctx = useContext(LocalContext);
  if (!ctx) {
    return { locales: [], localActivo: 1, setLocalActivo: () => {}, esSuperAdmin: false, localNombre: 'Local' };
  }
  return ctx;
}
