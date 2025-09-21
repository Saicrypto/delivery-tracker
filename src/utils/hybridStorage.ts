import { DailyData, Store, Delivery } from '../types';
import { StorageManager } from './storage';
import { MobileFix } from './mobileFix';
import { DatabaseService } from '../services/database';

export class HybridStorageManager {
  private static isOnline: boolean = true;
  private static dbInitialized: boolean = false;

  // Initialize database and check connection
  static async initialize(): Promise<void> {
    try {
      const isConnected = await DatabaseService.testConnection();
      this.isOnline = isConnected;
      
      if (isConnected && !this.dbInitialized) {
        await DatabaseService.initializeTables();
        this.dbInitialized = true;
        console.log('Database initialized successfully');
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.isOnline = false;
    }
  }

  // Store operations
  static async saveStore(store: Store): Promise<void> {
    // Always save to local storage first
    StorageManager.saveStores([...StorageManager.getStores(), store]);
    
    // Try to save to database if online
    if (this.isOnline) {
      try {
        await DatabaseService.saveStore(store);
        console.log('Store saved to database');
      } catch (error) {
        console.error('Failed to save store to database:', error);
        this.isOnline = false;
      }
    }
  }

  static async getStores(): Promise<Store[]> {
    // If online, try to get from database first
    if (this.isOnline) {
      try {
        const dbStores = await DatabaseService.getStores();
        if (dbStores.length > 0) {
          // Sync to local storage
          StorageManager.saveStores(dbStores);
          return dbStores;
        }
      } catch (error) {
        console.error('Failed to get stores from database:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to local storage
    return StorageManager.getStores();
  }


  // Delivery operations
  static async saveDelivery(delivery: Delivery): Promise<void> {
    // Always save to local storage first
    const today = MobileFix.getTodayString();
    const localData = StorageManager.getDailyData();
    const todayData = localData.find(d => d.date === today);
    
    if (todayData) {
      const updatedDeliveries = [...todayData.deliveries, delivery];
      const updatedSummary = StorageManager.calculateSummary(updatedDeliveries);
      const updatedTodayData = {
        ...todayData,
        deliveries: updatedDeliveries,
        summary: updatedSummary
      };
      StorageManager.updateDailyData(updatedTodayData);
    } else {
      const newTodayData = StorageManager.createEmptyDailyData(new Date());
      newTodayData.deliveries = [delivery];
      newTodayData.summary = StorageManager.calculateSummary([delivery]);
      StorageManager.updateDailyData(newTodayData);
    }
    
    // Try to save to database if online
    if (this.isOnline) {
      try {
        await DatabaseService.saveDelivery(delivery);
        console.log('Delivery saved to database');
      } catch (error) {
        console.error('Failed to save delivery to database:', error);
        this.isOnline = false;
      }
    }
  }

  static async getDailyData(): Promise<DailyData[]> {
    // If online, try to get from database first
    if (this.isOnline) {
      try {
        const dbData = await DatabaseService.getDailyData();
        if (dbData.length > 0) {
          // Sync to local storage
          StorageManager.saveDailyData(dbData);
          return dbData;
        }
      } catch (error) {
        console.error('Failed to get daily data from database:', error);
        this.isOnline = false;
      }
    }
    
    // Fallback to local storage
    return StorageManager.getDailyData();
  }


  // Sync all local data to database
  static async syncToDatabase(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot sync - database offline');
      return;
    }

    try {
      console.log('🔄 Syncing local data to database...');
      const localStores = StorageManager.getStores();
      const localData = StorageManager.getDailyData();
      
      // Sync stores
      for (const store of localStores) {
        await DatabaseService.saveStore(store);
      }
      
      // Sync deliveries
      for (const dayData of localData) {
        for (const delivery of dayData.deliveries) {
          await DatabaseService.saveDelivery(delivery);
        }
      }
      
      console.log('✅ Local data synced to database');
    } catch (error) {
      console.error('❌ Failed to sync local data to database:', error);
      this.isOnline = false;
    }
  }

  // Force refresh data from database (useful after deletions)
  static async forceRefreshFromDatabase(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot refresh - database offline');
      return;
    }

    try {
      console.log('🔄 Force refreshing data from database...');
      const { DataSyncManager } = await import('./dataSync');
      const { dailyData, stores } = await DataSyncManager.forceSyncFromDatabase();
      
      // Update local storage with fresh data
      StorageManager.saveStores(stores);
      dailyData.forEach(dayData => StorageManager.updateDailyData(dayData));
      
      console.log('✅ Data refreshed from database');
    } catch (error) {
      console.error('❌ Failed to refresh data from database:', error);
    }
  }

  // Get connection status
  static getConnectionStatus(): { isOnline: boolean; dbInitialized: boolean } {
    return {
      isOnline: this.isOnline,
      dbInitialized: this.dbInitialized
    };
  }

  // Reconnect to database
  static async reconnect(): Promise<void> {
    await this.initialize();
  }
}
