import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginRequest, RolUsuario } from '../types/auth';
import { login as apiLogin, getMe } from '../api/auth';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: RolUsuario[]) => boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Safari private mode */ }
}

function safeRemoveItem(key: string) {
  try { localStorage.removeItem(key); } catch { /* Safari private mode */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(safeGetItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => setUsuario(res.data))
        .catch(() => {
          safeRemoveItem('token');
          safeRemoveItem('usuario');
          setToken(null);
          setUsuario(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginFn = async (data: LoginRequest) => {
    const res = await apiLogin(data);
    const { token: newToken, usuario: newUsuario } = res.data;
    safeSetItem('token', newToken);
    safeSetItem('usuario', JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const logout = () => {
    safeRemoveItem('token');
    safeRemoveItem('usuario');
    setToken(null);
    setUsuario(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles: RolUsuario[]) => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      isAuthenticated: !!usuario && !!token,
      isLoading,
      login: loginFn,
      logout,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
