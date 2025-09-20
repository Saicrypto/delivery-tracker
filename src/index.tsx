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

// Register service worker (in both development and production for PWA testing)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service worker update found');
        });
      })
      .catch((error) => {
        console.warn('❌ Service worker registration failed:', error);
      });
  });
}

// Add PWA install prompt handling (handled by PWAInstallButton component)
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA install prompt available');
  // Event handling is done in PWAInstallButton component
});

window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA was installed successfully');
});

