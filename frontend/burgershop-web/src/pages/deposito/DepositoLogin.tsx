import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DepositoLogin({ error }: { error?: string | null }) {
  const { login } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login({ nombreUsuario, password });
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || 'Usuario o contraseña incorrectos');
    } finally {
      setSubmitting(false);
    }
  };

  const mensaje = error || localError;

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5"
      >
        <h1 className="text-3xl font-bold text-center mb-2">Depósito</h1>
        <p className="text-center text-gray-400 mb-4">Acceso a la pantalla de pedidos</p>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-300">Usuario</span>
          <input
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
            autoFocus
            className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-lg"
          />
        </label>

        {mensaje && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
            {mensaje}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-lg transition"
        >
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
