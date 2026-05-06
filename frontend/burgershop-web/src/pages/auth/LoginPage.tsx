import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import logoHlp from '../../assets/logo-hlp.png';
import localHero from '../../assets/login-hero.png';

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
      await login({ nombreUsuario: nombreUsuario.trim(), password });
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
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Imagen del local full-bleed — desktop y mobile */}
      <img
        src={localHero}
        alt="Hamburguesas La Plata"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay oscurecedor + leve blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] lg:bg-black/40 lg:backdrop-blur-[2px] pointer-events-none" />

      {/* Panel de login */}
      <div className="relative h-full w-full flex items-center justify-center xl:justify-end p-6 xl:pr-16 2xl:pr-32 z-20">
        <div className="w-full max-w-sm xl:max-w-xs 2xl:max-w-sm">
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 border border-white/20 p-8 lg:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src={logoHlp}
                alt="Hamburguesas La Plata"
                className="h-24 lg:h-28 w-auto drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold tracking-[0.25em] text-white/80 mb-2">
                  USUARIO
                </label>
                <input
                  type="text"
                  value={nombreUsuario}
                  onChange={e => setNombreUsuario(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm transition-all"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-[0.25em] text-white/80 mb-2">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm transition-all"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-2.5">
                  <p className="text-red-100 text-center text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600/90 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/50 backdrop-blur-sm"
              >
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
            </form>

            <p className="text-white/40 text-[11px] text-center mt-8 tracking-[0.2em]">
              GESTIÓN HLP · v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
