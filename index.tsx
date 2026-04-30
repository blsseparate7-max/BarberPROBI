
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * GBCortes7 - Bootstrap Seguro
 */
console.log("Bootstrap: index.tsx carregado e avaliado.");

(window as any).APP_HEARTBEAT = Date.now();

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff', minHeight: '100vh' }}>
          <h2>Erro no Frontend</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>Recarregar App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const initApp = () => {
    console.log("Bootstrap: Iniciando em", new Date().toISOString());
    try {
      const container = document.getElementById('root');
      if (!container) {
        throw new Error("Elemento root não encontrado");
      }
  
      console.log("Bootstrap: Container root encontrado. Configurando React...");
      const root = createRoot(container);
      
      console.log("Bootstrap: Renderizando componente principal <App />");
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      );
    
    (window as any).__APP_STARTED__ = true;
    console.log("Bootstrap: Renderização disparada com sucesso.");

    // Remove boot screen gracefully
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      console.log("Bootstrap: Removendo tela de boot em 500ms");
      bootScreen.style.opacity = '0';
      setTimeout(() => {
        bootScreen.remove();
        console.log("Bootstrap: Tela de boot removida.");
      }, 500);
    }
  } catch (err) {
    console.error("Bootstrap: Erro fatal detectado:", err);
    const status = document.getElementById('boot-status');
    if (status) status.innerText = "Erro Crítico no Bootstrap. Verifique o console.";
  }
};

// Executa imediatamente
initApp();
