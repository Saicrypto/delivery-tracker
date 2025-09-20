// Deployment fixes for production environment

export class DeploymentFix {
  // Check if we're in production
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // Check if we're on Vercel
  static isVercel(): boolean {
    return typeof window !== 'undefined' && 
           (window.location.hostname.includes('vercel.app') || 
            window.location.hostname.includes('vercel.com'));
  }

  // Safe database initialization for production
  static async safeDatabaseInit(): Promise<boolean> {
    try {
      // In production, we might not have database access initially
      if (this.isProduction() || this.isVercel()) {
        console.log('🌐 Production environment detected');
        
        // Try database connection with timeout
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ Database connection timeout in production');
            resolve(false);
          }, 5000); // 5 second timeout
          
          // Try to connect
          import('../services/database').then(({ DatabaseService }) => {
            DatabaseService.testConnection()
              .then((connected) => {
                clearTimeout(timeout);
                console.log(connected ? '✅ Database connected in production' : '❌ Database failed in production');
                resolve(connected);
              })
              .catch(() => {
                clearTimeout(timeout);
                console.warn('❌ Database connection failed in production');
                resolve(false);
              });
          }).catch(() => {
            clearTimeout(timeout);
            console.warn('❌ Database service import failed in production');
            resolve(false);
          });
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Safe database init failed:', error);
      return false;
    }
  }

  // Production-safe data loading
  static async safeDataLoad(): Promise<{ dailyData: any[]; stores: any[] }> {
    try {
      // Always try local storage first in production
      const { StorageManager } = await import('../utils/storage');
      
      const dailyData = StorageManager.getDailyData();
      const stores = StorageManager.getStores();
      
      console.log(`📱 Loaded ${dailyData.length} days and ${stores.length} stores from local storage`);
      
      return { dailyData, stores };
    } catch (error) {
      console.error('❌ Safe data load failed:', error);
      return { dailyData: [], stores: [] };
    }
  }

  // Get deployment info
  static getDeploymentInfo(): any {
    return {
      isProduction: this.isProduction(),
      isVercel: this.isVercel(),
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}
