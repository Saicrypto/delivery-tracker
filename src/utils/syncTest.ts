import { HybridStorageManager } from './hybridStorage';
import { DataSyncManager } from './dataSync';
import { StorageManager } from './storage';
import { Delivery } from '../types';

export class SyncTest {
  static async testSyncFunctionality(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log('🔄 Testing sync functionality...');

      // 1. Check database connection
      const dbStatus = HybridStorageManager.getConnectionStatus();
      if (!dbStatus.isOnline) {
        return {
          success: false,
          message: '❌ Database offline - sync cannot work',
          details: { dbStatus }
        };
      }

      // 2. Test local data
      const localData = StorageManager.getDailyData();
      const localStores = StorageManager.getStores();
      console.log(`📊 Local data: ${localData.length} days, ${localStores.length} stores`);

      // 3. Test database sync
      console.log('🔄 Testing database sync...');
      const syncedData = await DataSyncManager.forceSyncFromDatabase();
      console.log(`📊 Synced data: ${syncedData.dailyData.length} days, ${syncedData.stores.length} stores`);

      // 4. Compare local vs synced
      const localTodayDeliveries = localData.find(d => d.date === new Date().toISOString().split('T')[0])?.deliveries.length || 0;
      const syncedTodayDeliveries = syncedData.dailyData.find(d => d.date === new Date().toISOString().split('T')[0])?.deliveries.length || 0;

      console.log(`📊 Today: Local=${localTodayDeliveries}, Synced=${syncedTodayDeliveries}`);

      // 5. Test background sync
      console.log('🔄 Testing background sync...');
      await HybridStorageManager.syncToDatabase();

      return {
        success: true,
        message: '✅ Sync functionality working!',
        details: {
          dbStatus,
          localData: { days: localData.length, stores: localStores.length, todayDeliveries: localTodayDeliveries },
          syncedData: { days: syncedData.dailyData.length, stores: syncedData.stores.length, todayDeliveries: syncedTodayDeliveries },
          syncDifference: Math.abs(localTodayDeliveries - syncedTodayDeliveries)
        }
      };

    } catch (error) {
      console.error('❌ Sync test failed:', error);
      return {
        success: false,
        message: '❌ Sync test failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async testCrossDeviceSync(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log('🌐 Testing cross-device sync...');

      // Create a test delivery
      const testId = `cross-device-test-${Date.now()}`;
      const testDelivery = {
        id: testId,
        storeId: 'test-store',
        storeName: 'Cross Device Test Store',
        date: new Date().toISOString().split('T')[0],
        customerName: 'Cross Device Test',
        phoneNumber: '1234567890',
        address: 'Test Address',
        itemDetails: 'Test Item',
        orderNumber: `TEST-${Date.now()}`,
        deliveryStatus: 'pending pickup' as const,
        orderPrice: 100,
        totalDeliveries: 1,
        delivered: 0,
        pending: 1,
        bills: 1,
        paymentStatus: {
          total: 100,
          paid: 0,
          pending: 100,
          overdue: 0
        },
        notes: 'Cross device sync test'
      };

      // Save locally first
      console.log('💾 Saving test delivery locally...');
      const currentData = StorageManager.getDailyData();
      const today = new Date().toISOString().split('T')[0];
      const todayData = currentData.find(d => d.date === today);

      if (todayData) {
        todayData.deliveries.push(testDelivery);
        StorageManager.saveDailyData(currentData);
      } else {
        const newTodayData = {
          date: today,
          deliveries: [testDelivery],
          summary: StorageManager.calculateSummary([testDelivery])
        };
        StorageManager.saveDailyData([...currentData, newTodayData]);
      }

      // Sync to database
      console.log('🔄 Syncing to database...');
      await HybridStorageManager.syncToDatabase();

      // Verify in database
      console.log('🔍 Verifying in database...');
      const syncedData = await DataSyncManager.forceSyncFromDatabase();
      const foundInDb = syncedData.dailyData
        .flatMap(d => d.deliveries)
        .find((d: Delivery) => d.id === testId);

      if (!foundInDb) {
        const totalDeliveries = syncedData.dailyData.reduce((sum, d) => sum + d.deliveries.length, 0);
        return {
          success: false,
          message: '❌ Test delivery not found in database',
          details: { testId, totalDeliveriesInDb: totalDeliveries }
        };
      }

      // Note: Test data cleanup skipped - delete functionality removed
      console.log('ℹ️ Test data cleanup skipped - delete functionality has been removed from the application');

      return {
        success: true,
        message: '✅ Cross-device sync working!',
        details: {
          testId,
          foundInDatabase: !!foundInDb,
          deliveryStatus: foundInDb?.deliveryStatus,
          orderPrice: foundInDb?.orderPrice
        }
      };

    } catch (error) {
      console.error('❌ Cross-device sync test failed:', error);
      return {
        success: false,
        message: '❌ Cross-device sync test failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).SyncTest = SyncTest;
}

export {};
