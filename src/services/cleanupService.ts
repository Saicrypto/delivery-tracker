import { DatabaseService } from './database';
import { StorageManager } from '../utils/storage';
import { MobileFix } from '../utils/mobileFix';

export class CleanupService {
  private static readonly LAST_CLEANUP_KEY = 'delivery-tracker-last-cleanup';
  private static readonly CLEANUP_HOUR = 23; // 11 PM - when day "ends"

  // Check if cleanup should run (new day detected)
  static shouldRunCleanup(): boolean {
    const today = MobileFix.getTodayString();
    const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
    
    console.log('🧹 Cleanup check:', { today, lastCleanup });
    
    // Run cleanup if:
    // 1. Never run before, OR
    // 2. Last cleanup was on a different day
    return !lastCleanup || lastCleanup !== today;
  }

  // Check if it's time for automatic cleanup (after cleanup hour)
  static isCleanupTime(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= this.CLEANUP_HOUR;
  }

  // Remove all delivered orders from today's data
  static async removeDeliveredOrders(): Promise<{
    removed: number;
    remaining: number;
  }> {
    try {
      console.log('🧹 Starting cleanup of delivered orders...');
      
      const today = MobileFix.getTodayString();
      let removedCount = 0;
      let remainingCount = 0;

      // Clean up local storage
      const dailyData = StorageManager.getDailyData();
      const updatedDailyData = dailyData.map(dayData => {
        if (dayData.date === today) {
          const deliveredOrders = dayData.deliveries.filter(d => d.deliveryStatus === 'delivered');
          const activeOrders = dayData.deliveries.filter(d => d.deliveryStatus !== 'delivered');
          
          removedCount += deliveredOrders.length;
          remainingCount += activeOrders.length;
          
          console.log(`📦 Day ${dayData.date}: Removing ${deliveredOrders.length} delivered, keeping ${activeOrders.length} active`);
          
          return {
            ...dayData,
            deliveries: activeOrders,
            summary: StorageManager.calculateSummary(activeOrders)
          };
        }
        return dayData;
      });

      // Save updated data to local storage
      StorageManager.saveDailyData(updatedDailyData);

      // Clean up database - remove delivered orders from today
      try {
        const allDeliveries = await DatabaseService.getDeliveries();
        const todayDeliveredOrders = allDeliveries.filter(
          d => d.date === today && d.deliveryStatus === 'delivered'
        );

        for (const delivery of todayDeliveredOrders) {
          await DatabaseService.deleteDelivery(delivery.id);
        }
        
        console.log(`🗑️ Removed ${todayDeliveredOrders.length} delivered orders from database`);
      } catch (error) {
        console.warn('⚠️ Database cleanup failed:', error);
        // Continue with local cleanup even if database fails
      }

      // Mark cleanup as completed for today
      localStorage.setItem(this.LAST_CLEANUP_KEY, today);
      
      console.log(`✅ Cleanup completed: ${removedCount} removed, ${remainingCount} remaining`);
      
      return { removed: removedCount, remaining: remainingCount };
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  // Force cleanup regardless of time/day (manual cleanup)
  static async forceCleanup(): Promise<{
    removed: number;
    remaining: number;
  }> {
    console.log('🧹 Force cleanup initiated by user');
    const result = await this.removeDeliveredOrders();
    
    // Don't update last cleanup date for manual cleanup
    // This allows automatic cleanup to still run at day end
    
    return result;
  }

  // Get cleanup status information
  static getCleanupStatus(): {
    lastCleanup: string | null;
    shouldRun: boolean;
    isCleanupTime: boolean;
    nextAutoCleanup: string;
  } {
    const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
    const shouldRun = this.shouldRunCleanup();
    const isCleanupTime = this.isCleanupTime();
    
    // Calculate next automatic cleanup time
    const now = new Date();
    const nextCleanup = new Date();
    
    if (now.getHours() >= this.CLEANUP_HOUR) {
      // After cleanup time, next cleanup is tomorrow
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }
    nextCleanup.setHours(this.CLEANUP_HOUR, 0, 0, 0);
    
    return {
      lastCleanup,
      shouldRun,
      isCleanupTime,
      nextAutoCleanup: nextCleanup.toLocaleString()
    };
  }

  // Initialize cleanup monitoring (call on app start)
  static initializeCleanupMonitoring(): void {
    console.log('🧹 Initializing cleanup monitoring...');
    
    // Check immediately on app start
    this.checkAndRunCleanup();
    
    // Set up periodic checks every hour
    setInterval(() => {
      this.checkAndRunCleanup();
    }, 60 * 60 * 1000); // Check every hour
    
    console.log('✅ Cleanup monitoring initialized');
  }

  // Internal method to check and run cleanup if needed
  private static async checkAndRunCleanup(): Promise<void> {
    try {
      const shouldRun = this.shouldRunCleanup();
      const isTime = this.isCleanupTime();
      
      console.log('🧹 Cleanup check:', { shouldRun, isTime });
      
      if (shouldRun && isTime) {
        console.log('🧹 Auto-cleanup triggered');
        const result = await this.removeDeliveredOrders();
        
        // Show a subtle notification
        if (result.removed > 0) {
          console.log(`🧹 Auto-cleanup: Removed ${result.removed} delivered orders`);
          
          // Could add a toast notification here if you have a notification system
          // toast.info(`Cleaned up ${result.removed} delivered orders`);
        }
      }
    } catch (error) {
      console.error('❌ Auto-cleanup failed:', error);
    }
  }

  // Get count of delivered orders for today
  static async getDeliveredOrdersCount(): Promise<number> {
    try {
      const today = MobileFix.getTodayString();
      const dailyData = StorageManager.getDailyData();
      const todayData = dailyData.find(d => d.date === today);
      
      if (!todayData) return 0;
      
      return todayData.deliveries.filter(d => d.deliveryStatus === 'delivered').length;
    } catch (error) {
      console.error('Error getting delivered orders count:', error);
      return 0;
    }
  }
}
