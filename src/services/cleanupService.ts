import { HybridStorageManager } from '../utils/hybridStorage';
import { format } from 'date-fns';

export class CleanupService {
  private static readonly CLEANUP_HOUR = 23; // 11 PM - when day "ends"

  // Check if it's time for automatic cleanup (after cleanup hour)
  static isCleanupTime(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= this.CLEANUP_HOUR;
  }

  // Remove all delivered orders from today's data using database
  static async removeDeliveredOrders(): Promise<{
    removed: number;
    remaining: number;
  }> {
    try {
      console.log('🧹 Starting cleanup of delivered orders...');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      let removedCount = 0;
      let remainingCount = 0;

      // Get today's deliveries from database
      const todayDeliveries = await HybridStorageManager.getDeliveriesByDate(today);
      
      const deliveredOrders = todayDeliveries.filter(d => d.deliveryStatus === 'delivered');
      const activeOrders = todayDeliveries.filter(d => d.deliveryStatus !== 'delivered');
      
      removedCount = deliveredOrders.length;
      remainingCount = activeOrders.length;
      
      console.log(`📦 Day ${today}: Found ${deliveredOrders.length} delivered orders to remove, keeping ${activeOrders.length} active`);
      
      // Delete delivered orders from database
      for (const order of deliveredOrders) {
        try {
          await HybridStorageManager.deleteDelivery(order.id);
          console.log(`🗑️ Removed delivered order: ${order.customerName || 'Unknown'} (${order.storeName})`);
        } catch (error) {
          console.error(`❌ Failed to remove order ${order.id}:`, error);
        }
      }
      
      console.log(`✅ Cleanup completed: ${removedCount} removed, ${remainingCount} remaining`);
      
      return { removed: removedCount, remaining: remainingCount };
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  // Force cleanup regardless of time (manual cleanup)
  static async forceCleanup(): Promise<{
    removed: number;
    remaining: number;
  }> {
    console.log('🧹 Force cleanup initiated by user');
    return await this.removeDeliveredOrders();
  }

  // Get cleanup status information
  static getCleanupStatus(): {
    isCleanupTime: boolean;
    nextAutoCleanup: string;
  } {
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
      isCleanupTime,
      nextAutoCleanup: nextCleanup.toLocaleString()
    };
  }

  // Initialize cleanup monitoring (call on app start)
  static initializeCleanupMonitoring(): void {
    console.log('🧹 Initializing database-only cleanup monitoring...');
    
    // Check immediately on app start
    this.checkAndRunCleanup();
    
    // Set up periodic checks every hour
    setInterval(() => {
      this.checkAndRunCleanup();
    }, 60 * 60 * 1000); // Check every hour
    
    console.log('✅ Database-only cleanup monitoring initialized');
  }

  // Internal method to check and run cleanup if needed
  private static async checkAndRunCleanup(): Promise<void> {
    try {
      const isTime = this.isCleanupTime();
      
      console.log('🧹 Database cleanup check:', { isTime });
      
      if (isTime) {
        console.log('🧹 Auto-cleanup triggered');
        const result = await this.removeDeliveredOrders();
        
        // Show a subtle notification
        if (result.removed > 0) {
          console.log(`🧹 Auto-cleanup: Removed ${result.removed} delivered orders`);
        }
      }
    } catch (error) {
      console.error('❌ Auto-cleanup failed:', error);
    }
  }

  // Get count of delivered orders for today
  static async getDeliveredOrdersCount(): Promise<number> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayDeliveries = await HybridStorageManager.getDeliveriesByDate(today);
      
      return todayDeliveries.filter(d => d.deliveryStatus === 'delivered').length;
    } catch (error) {
      console.error('Error getting delivered orders count:', error);
      return 0;
    }
  }
}