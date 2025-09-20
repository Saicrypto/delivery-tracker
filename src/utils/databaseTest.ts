import { DatabaseService } from '../services/database';

export class DatabaseTester {
  static async testConnection(): Promise<{
    isConnected: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic connection
      const isConnected = await DatabaseService.testConnection();
      
      if (!isConnected) {
        const errorDetails = await DatabaseService.getConnectionError();
        return {
          isConnected: false,
          message: '❌ Database connection failed',
          details: errorDetails
        };
      }

      // Test table initialization
      await DatabaseService.initializeTables();
      
      // Test basic operations
      const stores = await DatabaseService.getStores();
      const deliveries = await DatabaseService.getDeliveries();
      
      return {
        isConnected: true,
        message: '✅ Database connected and working!',
        details: {
          storesCount: stores.length,
          deliveriesCount: deliveries.length,
          connectionUrl: 'libsql://delivery-update-saicrypto.aws-ap-south-1.turso.io'
        }
      };
      
    } catch (error) {
      console.error('Database test error:', error);
      return {
        isConnected: false,
        message: '❌ Database test failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async runFullTest(): Promise<void> {
    console.log('🚀 Running full database test...');
    
    const result = await this.testConnection();
    
    console.log('📊 Test Results:');
    console.log(`Status: ${result.message}`);
    console.log(`Connected: ${result.isConnected}`);
    
    if (result.details) {
      console.log('Details:', result.details);
    }
    
    // Test write operations
    if (result.isConnected) {
      try {
        console.log('📝 Testing write operations...');
        
        // Test store creation
        const testStore = {
          id: 'test-store-' + Date.now(),
          name: 'Test Store',
          address: 'Test Address',
          contact: 'Test Contact'
        };
        
        await DatabaseService.saveStore(testStore);
        console.log('✅ Store creation test passed');
        
        // Test delivery creation
        const testDelivery = {
          id: 'test-delivery-' + Date.now(),
          storeId: testStore.id,
          storeName: testStore.name,
          date: new Date().toISOString().split('T')[0],
          // New simplified fields
          customerName: 'Test Customer',
          phoneNumber: '9876543210',
          address: '123 Test Street',
          itemDetails: '2x Pizza, 1x Coke',
          orderNumber: 'ORD-001',
          // Legacy fields
          totalDeliveries: 5,
          delivered: 3,
          pending: 2,
          bills: 1,
          paymentStatus: {
            total: 1000,
            paid: 500,
            pending: 300,
            overdue: 200
          },
          notes: 'Test delivery'
        };
        
        await DatabaseService.saveDelivery(testDelivery);
        console.log('✅ Delivery creation test passed');
        
        // Clean up test data
        await DatabaseService.deleteStore(testStore.id);
        await DatabaseService.deleteDelivery(testDelivery.id);
        console.log('🧹 Test data cleaned up');
        
        console.log('🎉 All database tests passed!');
        
      } catch (error) {
        console.error('❌ Write operation test failed:', error);
      }
    }
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).DatabaseTester = DatabaseTester;
}
