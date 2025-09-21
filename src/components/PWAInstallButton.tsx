import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('💾 PWA install prompt available');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA was installed successfully');
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setIsInstalling(false);
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      console.log('📱 App is already running in standalone mode');
      setShowInstallButton(false);
      return;
    }

    // Show install button for Brave and other browsers even without beforeinstallprompt
    const userAgent = navigator.userAgent.toLowerCase();
    const isBrave = (navigator as any).brave !== undefined;
    const isChromium = userAgent.includes('chrome') || userAgent.includes('chromium') || userAgent.includes('brave');
    
    console.log('🔍 Browser detection:', { isBrave, isChromium, userAgent: userAgent.substring(0, 50) });
    
    // For Brave and other Chromium browsers, show install button even without prompt
    if (isChromium || isBrave) {
      setShowInstallButton(true);
      console.log('🦁 Brave/Chromium detected - showing install button');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Enhanced fallback for different browsers
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isBrave = (navigator as any).brave !== undefined;
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (isIOS) {
        window.alert('📱 To install on iOS/Safari:\n1. Tap the Share button (⬆️)\n2. Scroll down and select "Add to Home Screen"\n3. Tap "Add" to install');
      } else if (isAndroid) {
        window.alert('📱 To install on Android:\n1. Tap the menu (⋮) in top-right\n2. Select "Add to Home screen" or "Install app"\n3. Tap "Install" to confirm');
      } else if (isBrave || userAgent.includes('brave')) {
        window.alert('🦁 To install in Brave Browser:\n1. Click the menu (☰) in top-right\n2. Select "Install Delivery Tracker..."\n3. Click "Install" to add to desktop\n\nOr look for the install icon (⬇️) in the address bar!');
      } else if (userAgent.includes('chrome')) {
        window.alert('🌐 To install in Chrome:\n1. Look for the install icon (⬇️) in the address bar\n2. Or click menu (⋮) → "Install Delivery Tracker..."\n3. Click "Install" to add to desktop');
      } else if (userAgent.includes('edge')) {
        window.alert('🌐 To install in Edge:\n1. Click the menu (...) in top-right\n2. Select "Apps" → "Install this site as an app"\n3. Click "Install" to add to desktop');
      } else {
        window.alert('🌐 To install this app:\n1. Look for the install icon (⬇️) in your browser\'s address bar\n2. Or check your browser\'s menu for "Install" or "Add to Home Screen" option\n3. Follow the prompts to install');
      }
      return;
    }

    setIsInstalling(true);
    
    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setIsInstalling(false);
    }
  };

  // Don't show the button if PWA installation isn't available
  if (!showInstallButton) {
    return null;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isBrave = (navigator as any).brave !== undefined;
  const browserName = isBrave || userAgent.includes('brave') ? 'Brave' : 
                     userAgent.includes('chrome') ? 'Chrome' :
                     userAgent.includes('edge') ? 'Edge' :
                     userAgent.includes('firefox') ? 'Firefox' : 'Browser';

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 hover:border-blue-300"
      title={`Install Delivery Tracker as an app on ${browserName}`}
    >
      {isInstalling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span>Installing...</span>
        </>
      ) : (
        <>
          <Smartphone className="h-4 w-4" />
          <Download className="h-4 w-4" />
          <span>Install on {browserName}</span>
        </>
      )}
    </button>
  );
};
