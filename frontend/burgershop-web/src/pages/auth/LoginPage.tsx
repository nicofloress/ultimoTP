import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';

export default function LoginPage() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ nombreUsuario, password });
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        if (usuario.rol === RolUsuario.Repartidor) {
          navigate('/repartidor', { replace: true });
        } else if (usuario.rol === RolUsuario.Deposito) {
          navigate('/deposito', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setPassword('');
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 400) {
          setError('Usuario o contraseña incorrectos');
        } else if (status && status >= 500) {
          setError('El servidor no está respondiendo. Intente nuevamente en unos minutos');
        } else if (!err.response) {
          setError('No se pudo conectar con el servidor. Verifique su conexión');
        } else {
          setError('Ocurrió un error inesperado. Intente nuevamente');
        }
      } else {
        setError('Ocurrió un error inesperado. Intente nuevamente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-500 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo y nombre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <svg className="w-16 h-16" viewBox="0 0 32 32" fill="none">
              <path d="M4 14h24c0-6-5.4-10-12-10S4 8 4 14z" fill="#F59E0B" />
              <ellipse cx="11" cy="9" rx="1.2" ry="0.8" fill="#FEF3C7" />
              <ellipse cx="17" cy="7.5" rx="1.2" ry="0.8" fill="#FEF3C7" />
              <ellipse cx="22" cy="10" rx="1.2" ry="0.8" fill="#FEF3C7" />
              <path d="M3 14.5c1.5 1.5 3 0 4.5 1.5s3 0 4.5 1.5 3 0 4.5 1.5 3 0 4.5-1.5 3 0 4.5-1.5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="3.5" y="17" width="25" height="3.5" rx="1.5" fill="#92400E" />
              <path d="M3 17l2-1.5h22l2 1.5" fill="#FBBF24" />
              <rect x="4" y="21" width="24" height="4" rx="2" fill="#D97706" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestion HLP</h1>
          <p className="text-slate-400 mt-1">Sistema de gestion integral</p>
        </div>

        {/* Card de login */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-lg font-semibold text-white text-center mb-6">Iniciar Sesion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Usuario</label>
              <input
                type="text"
                value={nombreUsuario}
                onChange={e => setNombreUsuario(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full bg-white/10 border-2 border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contrasena"
                className="w-full bg-white/10 border-2 border-slate-500 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2">
                <p className="text-red-300 text-center text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/25"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">Gestion HLP v1.0</p>
      </div>
    </div>
  );
}
