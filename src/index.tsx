import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Simple Error Boundary to prevent blank screen in production
class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Root error boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#111827' }}>Something went wrong</div>
            <div style={{ marginTop: 8, color: '#4b5563' }}>Please refresh the page. If the issue persists, try clearing site data.</div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

