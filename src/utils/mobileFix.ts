// Mobile-specific fixes and utilities

export class MobileFix {
  // Check if we're on mobile
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if we're in a mobile browser
  static isMobileBrowser(): boolean {
    return this.isMobile() || window.innerWidth <= 768;
  }

  // Force refresh data for mobile
  static async forceRefreshData(): Promise<void> {
    try {
      // Clear any cached data
      if (typeof window !== 'undefined' && window.localStorage) {
        // Force reload from database
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('delivery-tracker')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Reload the page to force fresh data load
      window.location.reload();
    } catch (error) {
      console.error('Error forcing refresh:', error);
    }
  }

  // Enhanced localStorage check for mobile
  static isLocalStorageWorking(): boolean {
    try {
      const testKey = '__mobile_test__';
      const testValue = 'test_value_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
    } catch (error) {
      console.error('localStorage test failed:', error);
      return false;
    }
  }

  // Get mobile-specific debug info
  static getMobileDebugInfo(): any {
    return {
      isMobile: this.isMobile(),
      isMobileBrowser: this.isMobileBrowser(),
      localStorageWorking: this.isLocalStorageWorking(),
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      localStorageAvailable: typeof Storage !== 'undefined',
      timestamp: new Date().toISOString()
    };
  }

  // Fix for mobile date handling
  static getTodayString(): string {
    const now = new Date();
    // Ensure we're using the correct timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Mobile-friendly data loading
  static async loadDataWithRetry(maxRetries: number = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait a bit between retries
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
        
        // Try to load data
        const data = localStorage.getItem('delivery-tracker-daily-data');
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error(`Data load attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
    return [];
  }
}
