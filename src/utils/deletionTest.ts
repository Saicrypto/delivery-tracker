import { DatabaseService } from '../services/database';
import { HybridStorageManager } from './hybridStorage';

export class DeletionTest {
  static async testDeletionFlow(): Promise<void> {
    console.log('🧪 Testing deletion flow...');
    
    try {
      // Test 1: Check database connection
      const isConnected = await DatabaseService.testConnection();
      console.log('📡 Database connection:', isConnected ? '✅ Connected' : '❌ Failed');
      
      if (!isConnected) {
        throw new Error('Database not connected');
      }
      
      // Test 2: Get current deliveries
      const allDeliveries = await DatabaseService.getDeliveries();
      const today = new Date().toISOString().split('T')[0];
      const todayDeliveries = allDeliveries.filter(d => d.date === today);
      
      console.log(`📊 Current today's deliveries in DB: ${todayDeliveries.length}`);
      todayDeliveries.forEach(d => {
        console.log(`  - ${d.id}: ${d.customerName} (${d.storeName})`);
      });
      
      // Test 3: Test deletion if we have deliveries
      if (todayDeliveries.length > 0) {
        const testDelivery = todayDeliveries[0];
        console.log(`🗑️ Testing deletion of: ${testDelivery.id}`);
        
        // Delete from database directly
        await DatabaseService.deleteDelivery(testDelivery.id);
        console.log('✅ Direct database deletion successful');
        
        // Verify deletion
        const afterDeletion = await DatabaseService.getDeliveriesByDate(today);
        const stillExists = afterDeletion.find(d => d.id === testDelivery.id);
        
        if (stillExists) {
          console.log('❌ Deletion failed - delivery still exists in database');
        } else {
          console.log('✅ Deletion verified - delivery removed from database');
        }
      } else {
        console.log('ℹ️ No deliveries to test deletion with');
      }
      
      // Test 4: Test HybridStorageManager deletion
      console.log('🔄 Testing HybridStorageManager deletion...');
      const hybridStatus = HybridStorageManager.getConnectionStatus();
      console.log('🔗 HybridStorage status:', hybridStatus);
      
    } catch (error) {
      console.error('❌ Deletion test failed:', error);
    }
  }
  
  static async testCrossDeviceSync(): Promise<void> {
    console.log('🌐 Testing cross-device sync...');
    
    try {
      // Get current data from database
      const dbDeliveries = await DatabaseService.getDeliveries();
      const today = new Date().toISOString().split('T')[0];
      const dbToday = dbDeliveries.filter(d => d.date === today);
      
      console.log(`📊 Database today's deliveries: ${dbToday.length}`);
      
      // Force sync from database
      await HybridStorageManager.forceRefreshFromDatabase();
      console.log('✅ Force refresh completed');
      
      // Check local storage after sync
      const { StorageManager } = await import('./storage');
      const localData = StorageManager.getDailyData();
      const localToday = localData.find(d => d.date === today);
      
      console.log(`📱 Local today's deliveries: ${localToday?.deliveries.length || 0}`);
      
      if (localToday) {
        localToday.deliveries.forEach(d => {
          console.log(`  - ${d.id}: ${d.customerName} (${d.storeName})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Cross-device sync test failed:', error);
    }
  }
}

export {};
