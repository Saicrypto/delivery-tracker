// PWA utilities for installation and service worker management

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAManager {
  private static installPromptEvent: BeforeInstallPromptEvent | null = null;
  private static isInstallable = false;

  // Register service worker
  static async registerServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 New service worker version available');
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker is ready');
        
        return true;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return false;
      }
    } else {
      console.log('⚠️ Service Workers not supported');
      return false;
    }
  }

  // Setup install prompt listeners
  static setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Before install prompt triggered');
      e.preventDefault();
      this.installPromptEvent = e as BeforeInstallPromptEvent;
      this.isInstallable = true;
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPromptEvent = null;
      this.isInstallable = false;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  }

  // Check if app can be installed
  static canInstall(): boolean {
    return this.isInstallable && this.installPromptEvent !== null;
  }

  // Trigger install prompt
  static async promptInstall(): Promise<'accepted' | 'dismissed' | 'not-available'> {
    if (!this.canInstall() || !this.installPromptEvent) {
      return 'not-available';
    }

    try {
      await this.installPromptEvent.prompt();
      const result = await this.installPromptEvent.userChoice;
      
      console.log('Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.installPromptEvent = null;
        this.isInstallable = false;
      }
      
      return result.outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return 'dismissed';
    }
  }

  // Check if app is already installed
  static isInstalled(): boolean {
    // Check if running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Get installation status
  static getInstallationStatus(): {
    isInstalled: boolean;
    canInstall: boolean;
    isStandalone: boolean;
  } {
    return {
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    };
  }

  // Initialize PWA features
  static async initialize(): Promise<void> {
    console.log('Initializing PWA features...');
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup install prompt
    this.setupInstallPrompt();
    
    // Log current status
    const status = this.getInstallationStatus();
    console.log('PWA Status:', status);
  }
}
