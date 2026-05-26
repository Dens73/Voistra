import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';

import { App } from './App';
import './styles.css';

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unexpected error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Voistra renderer crash', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isRussian = navigator.language.toLowerCase().startsWith('ru');
      return (
        <div className="app-shell">
          <main className="workspace">
            <section className="empty-state panel">
              <h3>{isRussian ? 'Voistra восстановилась после ошибки интерфейса' : 'Voistra recovered from a renderer error'}</h3>
              <p>{this.state.message}</p>
              <button className="primary-button" type="button" onClick={this.handleReload}>
                {isRussian ? 'Перезагрузить' : 'Reload'}
              </button>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOMClient.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
