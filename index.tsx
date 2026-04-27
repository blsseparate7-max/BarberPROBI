
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * GBCortes7 - Bootstrap Seguro
 */
const initApp = () => {
  try {
    const container = document.getElementById('root');
    if (!container) return;

    // Se já estiver renderizado, não faz nada
    if (container.hasChildNodes()) return;

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Suaviza a saída da tela de carregamento
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      bootScreen.style.opacity = '0';
      setTimeout(() => {
        const el = document.getElementById('boot-screen');
        if (el) el.remove();
      }, 500);
    }
    
    console.log("GBCortes7: Interface carregada.");
  } catch (err) {
    console.error("Erro na renderização:", err);
    const status = document.getElementById('boot-status');
    if (status) status.innerText = "Erro ao renderizar dashboard.";
  }
};

// Inicialização imediata ou após o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
