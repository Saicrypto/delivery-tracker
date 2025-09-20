import React, { useState, useEffect } from 'react';
import { PWAManager } from '../utils/pwa';

interface InstallPromptProps {
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check initial status
    const status = PWAManager.getInstallationStatus();
    setCanInstall(status.canInstall);
    setIsInstalled(status.isInstalled);

    // Listen for PWA events
    const handleInstallable = () => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const result = await PWAManager.promptInstall();
      console.log('Install result:', result);
      
      if (result === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Install App</h3>
            <p className="text-sm text-blue-600">Install Delivery Tracker as an app for quick access</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInstalling ? 'Installing...' : 'Install'}
        </button>
      </div>
    </div>
  );
};

// Floating install button for mobile
export const FloatingInstallButton: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check initial status
    const status = PWAManager.getInstallationStatus();
    setCanInstall(status.canInstall);
    setIsInstalled(status.isInstalled);

    // Show after a delay if can install
    if (status.canInstall && !status.isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for PWA events
    const handleInstallable = () => {
      setCanInstall(true);
      setTimeout(() => setIsVisible(true), 1000);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setIsVisible(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    try {
      const result = await PWAManager.promptInstall();
      if (result === 'accepted') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || isInstalled || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600 mt-1">Get quick access to your delivery tracker</p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleInstall}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
