import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Si el error parece de chunk load (deploy reciente), recargar sola
    const msg = error?.message || '';
    if (msg.includes('Loading chunk') || msg.includes('dynamically imported module') || msg.includes('ChunkLoadError')) {
      setTimeout(() => window.location.reload(), 500);
    }
  }

  handleReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch { /* ignore */ }
    window.location.href = window.location.pathname + '?_v=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="text-5xl mb-3">{'\u26A0\uFE0F'}</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Algo salio mal</h1>
            <p className="text-sm text-gray-600 mb-4">La aplicacion tuvo un problema. Tocá el boton para reiniciar.</p>
            <button
              onClick={this.handleReload}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg"
            >
              Reiniciar aplicacion
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
