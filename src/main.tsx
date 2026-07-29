import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToasts';
import { ToastViewport } from './components/ui/ToastViewport';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root non trovato in index.html');

/**
 * App installabile.
 *
 * Solo in produzione: in sviluppo un service worker servirebbe file dalla
 * cache mentre Vite li sta ricostruendo, e le modifiche sembrerebbero non
 * avere effetto. La registrazione aspetta il `load` per non contendere banda
 * al primo disegno della pagina.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.warn('[fantasia] service worker non registrato:', error));
  });
}

createRoot(container).render(
  <StrictMode>
    {/* Senza questa protezione qualunque errore di render lasciava schermo bianco. */}
    <ErrorBoundary>
      <ToastProvider>
        <App />
        <ToastViewport />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
