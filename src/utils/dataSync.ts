import { DailyData, Store, Delivery } from '../types';
import { StorageManager } from './storage';
import { DatabaseService } from '../services/database';
import { MobileFix } from './mobileFix';

export class DataSyncManager {
  // Force sync all data from database to local storage
  static async forceSyncFromDatabase(): Promise<{ dailyData: DailyData[]; stores: Store[] }> {
    try {
      console.log('🔄 Starting force sync from database...');
      
      // Get all data from database
      const dbStores = await DatabaseService.getStores();
      const dbDeliveries = await DatabaseService.getDeliveries();
      
      console.log(`📊 Found ${dbStores.length} stores and ${dbDeliveries.length} deliveries in database`);
      
      // Group deliveries by date
      const deliveriesByDate: Record<string, Delivery[]> = {};
      dbDeliveries.forEach(delivery => {
        if (!deliveriesByDate[delivery.date]) {
          deliveriesByDate[delivery.date] = [];
        }
        deliveriesByDate[delivery.date].push(delivery);
      });
      
      // Create DailyData objects
      const dailyData: DailyData[] = Object.entries(deliveriesByDate).map(([date, deliveries]) => {
        const summary = StorageManager.calculateSummary(deliveries);
        return {
          date,
          deliveries,
          summary
        };
      });
      
      // Sort by date (newest first)
      dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Save to local storage
      StorageManager.saveDailyData(dailyData);
      StorageManager.saveStores(dbStores);
      
      console.log(`✅ Synced ${dailyData.length} days of data and ${dbStores.length} stores to local storage`);
      
      // Log today's data specifically
      const today = MobileFix.getTodayString();
      const todayData = dailyData.find(d => d.date === today);
      console.log(`📅 Today (${today}) has ${todayData?.deliveries.length || 0} deliveries`);
      
      return { dailyData, stores: dbStores };
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      throw error;
    }
  }
  
  // Ensure today's data exists and is properly structured
  static ensureTodayData(dailyData: DailyData[]): DailyData[] {
    const today = MobileFix.getTodayString();
    const todayExists = dailyData.some(data => data.date === today);
    
    if (!todayExists) {
      console.log(`📅 Creating today's data entry for ${today}`);
      const newTodayData = StorageManager.createEmptyDailyData(new Date());
      const updatedData = [newTodayData, ...dailyData];
      StorageManager.saveDailyData(updatedData);
      return updatedData;
    }
    
    console.log(`📅 Today's data (${today}) already exists with ${dailyData.find(d => d.date === today)?.deliveries.length || 0} deliveries`);
    return dailyData;
  }
  
  // Get debug information about data state
  static getDebugInfo(): any {
    const today = MobileFix.getTodayString();
    const dailyData = StorageManager.getDailyData();
    const stores = StorageManager.getStores();
    const todayData = dailyData.find(d => d.date === today);
    
    return {
      today,
      totalDays: dailyData.length,
      totalStores: stores.length,
      todayDeliveries: todayData?.deliveries.length || 0,
      todayExists: !!todayData,
      allDates: dailyData.map(d => d.date),
      localStorageWorking: MobileFix.isLocalStorageWorking(),
      timestamp: new Date().toISOString()
    };
  }
  
  // Clear all data and force fresh sync
  static async clearAndResync(): Promise<{ dailyData: DailyData[]; stores: Store[] }> {
    try {
      console.log('🗑️ Clearing all local data for fresh sync...');
      
      // Clear local storage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('delivery-tracker')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Force sync from database
      return await this.forceSyncFromDatabase();
    } catch (error) {
      console.error('❌ Clear and resync failed:', error);
      throw error;
    }
  }
}
