import { StorageManager } from './storage';
import { HybridStorageManager } from './hybridStorage';
import { DataSyncManager } from './dataSync';
import { DatabaseService } from '../services/database';
import { MobileFix } from './mobileFix';

export class SyncDebug {
  static async debugTodayDeliveries(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log('🔍 Debugging today\'s deliveries sync...');

      const today = MobileFix.getTodayString();
      console.log(`📅 Today is: ${today}`);

      // Check local storage
      const localData = StorageManager.getDailyData();
      const localToday = localData.find(d => d.date === today);
      console.log(`💾 Local storage: ${localData.length} days total`);
      console.log(`💾 Local today: ${localToday?.deliveries.length || 0} deliveries`);

      // Check database connection
      const dbStatus = HybridStorageManager.getConnectionStatus();
      console.log(`🗄️ Database: ${dbStatus.isOnline ? 'Connected' : 'Offline'}`);

      if (dbStatus.isOnline) {
        // Check database directly
        const dbDeliveries = await DatabaseService.getDeliveries();
        const dbToday = dbDeliveries.filter(d => d.date === today);
        console.log(`🗄️ Database total: ${dbDeliveries.length} deliveries`);
        console.log(`🗄️ Database today: ${dbToday.length} deliveries`);

        // Check sync
        const syncedData = await DataSyncManager.forceSyncFromDatabase();
        const syncedToday = syncedData.dailyData.find(d => d.date === today);
        console.log(`🔄 Synced today: ${syncedToday?.deliveries.length || 0} deliveries`);

        return {
          success: true,
          message: 'Sync debug completed',
          details: {
            today,
            local: {
              totalDays: localData.length,
              todayDeliveries: localToday?.deliveries.length || 0
            },
            database: {
              connected: dbStatus.isOnline,
              totalDeliveries: dbDeliveries.length,
              todayDeliveries: dbToday.length
            },
            synced: {
              totalDays: syncedData.dailyData.length,
              todayDeliveries: syncedToday?.deliveries.length || 0
            }
          }
        };
      } else {
        return {
          success: false,
          message: 'Database offline - cannot sync',
          details: { today, localToday: localToday?.deliveries.length || 0 }
        };
      }

    } catch (error) {
      console.error('❌ Sync debug failed:', error);
      return {
        success: false,
        message: 'Sync debug failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async forceResyncToday(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('🔄 Force resyncing today\'s data...');

      // Get today's data
      const today = MobileFix.getTodayString();
      const localData = StorageManager.getDailyData();
      const localToday = localData.find(d => d.date === today);

      if (localToday && localToday.deliveries.length > 0) {
        console.log(`📤 Syncing ${localToday.deliveries.length} local deliveries to database...`);

        // Sync each delivery to database
        for (const delivery of localToday.deliveries) {
          await HybridStorageManager.saveDelivery(delivery);
          console.log(`✅ Synced delivery: ${delivery.id}`);
        }

        console.log('🔄 Running full sync...');
        await DataSyncManager.forceSyncFromDatabase();

        return {
          success: true,
          message: `Force synced ${localToday.deliveries.length} deliveries`
        };
      } else {
        return {
          success: false,
          message: 'No local deliveries to sync'
        };
      }

    } catch (error) {
      console.error('❌ Force resync failed:', error);
      return {
        success: false,
        message: `Force resync failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).SyncDebug = SyncDebug;
}

export {};
