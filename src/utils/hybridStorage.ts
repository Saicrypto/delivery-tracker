import { DailyData, Store, Delivery } from '../types';
import { DatabaseService } from '../services/database';
import { format } from 'date-fns';

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
        console.log('✅ Database-only storage initialized successfully');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.isOnline = false;
      throw new Error('Database is required for application functionality');
    }
  }

  // Store operations - Database only
  static async saveStore(store: Store): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      await DatabaseService.saveStore(store);
      console.log('✅ Store saved to database');
    } catch (error) {
      console.error('❌ Failed to save store to database:', error);
      this.isOnline = false;
      throw error;
    }
  }

  static async getStores(): Promise<Store[]> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      const dbStores = await DatabaseService.getStores();
      console.log(`📊 Retrieved ${dbStores.length} stores from database`);
      return dbStores;
    } catch (error) {
      console.error('❌ Failed to get stores from database:', error);
      this.isOnline = false;
      throw error;
    }
  }

  // Delivery operations - Database only
  static async saveDelivery(delivery: Delivery): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      await DatabaseService.saveDelivery(delivery);
      console.log('✅ Delivery saved to database');
    } catch (error) {
      console.error('❌ Failed to save delivery to database:', error);
      this.isOnline = false;
      throw error;
    }
  }

  static async getDailyData(): Promise<DailyData[]> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      const dbData = await DatabaseService.getDailyData();
      console.log(`📊 Retrieved ${dbData.length} days of data from database`);
      return dbData;
    } catch (error) {
      console.error('❌ Failed to get daily data from database:', error);
      this.isOnline = false;
      throw error;
    }
  }

  static async getDeliveriesByDate(date: string): Promise<Delivery[]> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      const deliveries = await DatabaseService.getDeliveriesByDate(date);
      console.log(`📊 Retrieved ${deliveries.length} deliveries for ${date} from database`);
      return deliveries;
    } catch (error) {
      console.error(`❌ Failed to get deliveries for ${date} from database:`, error);
      this.isOnline = false;
      throw error;
    }
  }

  // Delete operations - Database only
  static async deleteDelivery(deliveryId: string): Promise<void> {
    console.log(`🗑️ Deleting delivery ${deliveryId} from database...`);
    
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      // Get delivery info before deletion for logging
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayDeliveries = await DatabaseService.getDeliveriesByDate(today);
      const deliveryToDelete = todayDeliveries.find(d => d.id === deliveryId);
      
      if (deliveryToDelete) {
        console.log(`📋 Deleting: ${deliveryToDelete.customerName || 'Unknown'} (${deliveryToDelete.storeName})`);
      }

      await DatabaseService.deleteDelivery(deliveryId);
      console.log(`✅ Delivery ${deliveryId} deleted from database successfully`);
      
      // Verify deletion
      const afterDeliveries = await DatabaseService.getDeliveriesByDate(today);
      const stillExists = afterDeliveries.find(d => d.id === deliveryId);
      
      if (stillExists) {
        console.log(`⚠️ Warning: Delivery ${deliveryId} still exists in database after deletion`);
        throw new Error('Deletion verification failed');
      } else {
        console.log(`✅ Verified: Delivery ${deliveryId} successfully removed from database`);
        console.log(`📊 Database now has ${afterDeliveries.length} deliveries for today`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete delivery ${deliveryId} from database:`, error);
      this.isOnline = false;
      throw error;
    }
  }

  static async deleteStore(storeId: string): Promise<void> {
    console.log(`🗑️ Deleting store ${storeId} from database...`);
    
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      await DatabaseService.deleteStore(storeId);
      console.log(`✅ Store ${storeId} deleted from database successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete store ${storeId} from database:`, error);
      this.isOnline = false;
      throw error;
    }
  }

  // Update delivery - Database only
  static async updateDelivery(delivery: Delivery): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Database connection required');
    }

    try {
      await DatabaseService.saveDelivery(delivery); // saveDelivery handles both insert and update
      console.log('✅ Delivery updated in database');
    } catch (error) {
      console.error('❌ Failed to update delivery in database:', error);
      this.isOnline = false;
      throw error;
    }
  }

  // Get connection status
  static getConnectionStatus(): { isOnline: boolean; dbInitialized: boolean } {
    return {
      isOnline: this.isOnline,
      dbInitialized: this.dbInitialized
    };
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      const isConnected = await DatabaseService.testConnection();
      this.isOnline = isConnected;
      return isConnected;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  // Reconnect to database
  static async reconnect(): Promise<void> {
    console.log('🔄 Reconnecting to database...');
    await this.initialize();
  }

  // Calculate summary from deliveries (moved from StorageManager)
  static calculateSummary(deliveries: Delivery[]): DailyData['summary'] {
    const storeIds = new Set(deliveries.map(d => d.storeId));
    
    return deliveries.reduce((acc, delivery) => {
      const num = delivery.numberOfDeliveries ?? delivery.totalDeliveries ?? 0;
      acc.totalDeliveries += num;
      acc.totalDelivered += delivery.delivered ?? 0;
      acc.totalPending += delivery.pending ?? 0;
      acc.totalBills += delivery.bills ?? 0;
      acc.totalRevenue += delivery.paymentStatus?.total ?? 0;
      acc.totalPaid += delivery.paymentStatus?.paid ?? 0;
      acc.totalOutstanding += (delivery.paymentStatus?.pending ?? 0) + (delivery.paymentStatus?.overdue ?? 0);
      return acc;
    }, {
      totalStores: storeIds.size,
      totalDeliveries: 0,
      totalDelivered: 0,
      totalPending: 0,
      totalBills: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0
    });
  }
}