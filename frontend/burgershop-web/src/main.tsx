import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Fix iOS PWA: cuando la app vuelve del background via bfcache, puede quedar en blanco
// El evento pageshow con event.persisted=true indica que viene del cache de navegacion
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// Manejo global de errores no capturados que podrian dejar la app en blanco
window.addEventListener('error', (event) => {
  // Si el error es de carga de un chunk JS (comun despues de deploy), recargar
  const msg = event.message || '';
  if (msg.includes('Loading chunk') || msg.includes('dynamically imported module') || msg.includes('ChunkLoadError')) {
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || '');
  if (msg.includes('Loading chunk') || msg.includes('dynamically imported module') || msg.includes('ChunkLoadError')) {
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
