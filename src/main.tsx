import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Registro do Service Worker para permitir instalação como PWA e empacotamento Android.
 * A aplicação continua usando a origem HTTPS do Firebase Hosting; não há cache offline
 * que possa devolver dados antigos de estudo.
 */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("[NEXO PWA] Não foi possível registrar o Service Worker:", error);
    });
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
