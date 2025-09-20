import { createClient } from '@libsql/client';
import { DailyData, Store, Delivery } from '../types';

// Initialize Turso client
const client = createClient({
  url: 'libsql://delivery-update-saicrypto.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxMzgzOTIsImlkIjoiZTQyMzRlNzctZGU5OS00MzFhLTg5MzUtNmY5NzIzZmI5YmY0IiwicmlkIjoiZmM2ZWZhZjYtMzRlZS00ZGU0LWJiZDYtMDA0ZjM1MGZmODY2In0.G9XEg8zG_rieLV0hzIDZz7SZO2rjhxRX7sDQD9tObLAOUI6B6A399dxJr8NCH6PMWIsTPf68Rvh5OLPQZBkLCQ'
});

export class DatabaseService {
  // Wrap DB operations and self-heal on missing schema
  private static async withSelfHealing<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('no such table') ||
        message.includes('no such column') ||
        message.includes('no such database')
      ) {
        console.warn('Database schema missing. Re-initializing tables and retrying operation...');
        try {
          await this.initializeTables();
          return await operation();
        } catch (retryError) {
          console.error('Retry after schema initialization failed:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  }
  // Initialize database tables
  static async initializeTables() {
    try {
      // Create stores table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          contact TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create deliveries table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS deliveries (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          store_name TEXT NOT NULL,
          date TEXT NOT NULL,
          total_deliveries INTEGER NOT NULL DEFAULT 0,
          delivered INTEGER NOT NULL DEFAULT 0,
          pending INTEGER NOT NULL DEFAULT 0,
          bills INTEGER NOT NULL DEFAULT 0,
          payment_total REAL NOT NULL DEFAULT 0,
          payment_paid REAL NOT NULL DEFAULT 0,
          payment_pending REAL NOT NULL DEFAULT 0,
          payment_overdue REAL NOT NULL DEFAULT 0,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores (id)
        )
      `);

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  // Store operations
  static async saveStore(store: Store): Promise<void> {
    try {
      await this.withSelfHealing(async () => {
        await client.execute({
          sql: `
            INSERT OR REPLACE INTO stores (id, name, address, contact)
            VALUES (?, ?, ?, ?)
          `,
          args: [store.id, store.name, store.address || null, store.contact || null]
        });
      });
    } catch (error) {
      console.error('Error saving store:', error);
      throw error;
    }
  }

  static async getStores(): Promise<Store[]> {
    try {
      const result = await this.withSelfHealing(async () => {
        return await client.execute('SELECT * FROM stores ORDER BY name');
      });
      return result.rows.map(row => ({
        id: row.id as string,
        name: row.name as string,
        address: row.address as string || undefined,
        contact: row.contact as string || undefined
      }));
    } catch (error) {
      console.error('Error getting stores:', error);
      return [];
    }
  }

  static async deleteStore(storeId: string): Promise<void> {
    try {
      await this.withSelfHealing(async () => {
        await client.execute({
          sql: 'DELETE FROM stores WHERE id = ?',
          args: [storeId]
        });
      });
    } catch (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  }

  // Delivery operations
  static async saveDelivery(delivery: Delivery): Promise<void> {
    try {
      await this.withSelfHealing(async () => {
        await client.execute({
          sql: `
            INSERT OR REPLACE INTO deliveries (
              id, store_id, store_name, date, total_deliveries, delivered, pending, bills,
              payment_total, payment_paid, payment_pending, payment_overdue, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            delivery.id,
            delivery.storeId,
            delivery.storeName,
            delivery.date,
            // Use numberOfDeliveries if present; fallback to totalDeliveries for backward-compat
            (delivery as any).numberOfDeliveries ?? (delivery as any).totalDeliveries ?? 0,
            delivery.delivered,
            delivery.pending,
            delivery.bills,
            delivery.paymentStatus.total,
            delivery.paymentStatus.paid,
            delivery.paymentStatus.pending,
            delivery.paymentStatus.overdue,
            delivery.notes || null
          ]
        });
      });
    } catch (error) {
      console.error('Error saving delivery:', error);
      throw error;
    }
  }

  static async getDeliveries(): Promise<Delivery[]> {
    try {
      const result = await this.withSelfHealing(async () => {
        return await client.execute('SELECT * FROM deliveries ORDER BY date DESC');
      });
      return result.rows.map(row => ({
        id: row.id as string,
        storeId: row.store_id as string,
        storeName: row.store_name as string,
        date: row.date as string,
        // Map DB total_deliveries to both fields for compatibility
        numberOfDeliveries: (row.total_deliveries as number) ?? 0,
        totalDeliveries: (row.total_deliveries as number) ?? 0,
        delivered: row.delivered as number,
        pending: row.pending as number,
        bills: row.bills as number,
        paymentStatus: {
          total: row.payment_total as number,
          paid: row.payment_paid as number,
          pending: row.payment_pending as number,
          overdue: row.payment_overdue as number
        },
        notes: row.notes as string || undefined
      }));
    } catch (error) {
      console.error('Error getting deliveries:', error);
      return [];
    }
  }

  static async getDeliveriesByDate(date: string): Promise<Delivery[]> {
    try {
      const result = await this.withSelfHealing(async () => {
        return await client.execute({
          sql: 'SELECT * FROM deliveries WHERE date = ? ORDER BY created_at DESC',
          args: [date]
        });
      });
      return result.rows.map(row => ({
        id: row.id as string,
        storeId: row.store_id as string,
        storeName: row.store_name as string,
        date: row.date as string,
        numberOfDeliveries: (row.total_deliveries as number) ?? 0,
        totalDeliveries: (row.total_deliveries as number) ?? 0,
        delivered: row.delivered as number,
        pending: row.pending as number,
        bills: row.bills as number,
        paymentStatus: {
          total: row.payment_total as number,
          paid: row.payment_paid as number,
          pending: row.payment_pending as number,
          overdue: row.payment_overdue as number
        },
        notes: row.notes as string || undefined
      }));
    } catch (error) {
      console.error('Error getting deliveries by date:', error);
      return [];
    }
  }

  static async deleteDelivery(deliveryId: string): Promise<void> {
    try {
      await this.withSelfHealing(async () => {
        await client.execute({
          sql: 'DELETE FROM deliveries WHERE id = ?',
          args: [deliveryId]
        });
      });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      throw error;
    }
  }

  // Get daily data with summary
  static async getDailyData(): Promise<DailyData[]> {
    try {
      const deliveries = await this.getDeliveries();
      // const stores = await this.getStores(); // Not used in this function
      
      // Group deliveries by date
      const deliveriesByDate = deliveries.reduce((acc, delivery) => {
        if (!acc[delivery.date]) {
          acc[delivery.date] = [];
        }
        acc[delivery.date].push(delivery);
        return acc;
      }, {} as Record<string, Delivery[]>);

      // Create DailyData objects
      const dailyData: DailyData[] = Object.entries(deliveriesByDate).map(([date, dayDeliveries]) => {
        const summary: DailyData['summary'] = dayDeliveries.reduce((acc: DailyData['summary'], delivery: any) => {
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
          totalStores: 0,
          totalDeliveries: 0,
          totalDelivered: 0,
          totalPending: 0,
          totalBills: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0
        });

        return {
          date,
          deliveries: dayDeliveries,
          summary
        };
      });

      return dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting daily data:', error);
      return [];
    }
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      await client.execute('SELECT 1');
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      console.log('This might be due to missing authentication token or network issues');
      return false;
    }
  }

  // Get connection error details
  static async getConnectionError(): Promise<string> {
    try {
      await client.execute('SELECT 1');
      return 'No error - connection successful';
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return 'Authentication required - need Turso auth token';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          return 'Network error - check internet connection';
        } else {
          return `Database error: ${error.message}`;
        }
      }
      return `Unknown error: ${String(error)}`;
    }
  }
}
