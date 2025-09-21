import { useState, useEffect, useCallback } from 'react';
import { DailyData, Store, Delivery, ViewMode } from '../types';
import { HybridStorageManager } from '../utils/hybridStorage';
import { format } from 'date-fns';

export const useDeliveryData = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Load initial data from database only
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🌐 Database-only mode: Initializing connection...');
        
        // Initialize database connection
        await HybridStorageManager.initialize();
        const status = HybridStorageManager.getConnectionStatus();
        setIsOnline(status.isOnline);

        if (!status.isOnline) {
          throw new Error('Database connection required for application functionality');
        }

        console.log('📊 Loading data from database...');
        
        // Load data from database
        const [dbDailyData, dbStores] = await Promise.all([
          HybridStorageManager.getDailyData(),
          HybridStorageManager.getStores()
        ]);
        
        console.log(`✅ Loaded ${dbDailyData.length} days of data and ${dbStores.length} stores from database`);
        
        setDailyData(dbDailyData);
        setStores(dbStores);
        
        // Ensure today's data exists
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayExists = dbDailyData.some(data => data.date === today);
        
        if (!todayExists) {
          console.log('📅 Creating today\'s data entry...');
          const newTodayData: DailyData = {
            date: today,
            deliveries: [],
            summary: {
              totalStores: 0,
              totalDeliveries: 0,
              totalDelivered: 0,
              totalPending: 0,
              totalBills: 0,
              totalRevenue: 0,
              totalPaid: 0,
              totalOutstanding: 0
            }
          };
          setDailyData(prev => [newTodayData, ...prev]);
        }
        
        setLoading(false);
        console.log('✅ Database-only initialization completed');
        
      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        setLoading(false);
        setIsOnline(false);
        
        // Show user-friendly error
        setTimeout(() => {
          alert('Database connection failed. Please check your internet connection and refresh the page.');
        }, 100);
      }
    };

    loadData();
  }, []);

  // Periodic data refresh from database (every 60 seconds)
  useEffect(() => {
    if (!isOnline) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Periodic database refresh...');
        const [freshDailyData, freshStores] = await Promise.all([
          HybridStorageManager.getDailyData(),
          HybridStorageManager.getStores()
        ]);
        
        setDailyData(freshDailyData);
        setStores(freshStores);
        console.log('✅ Periodic refresh completed');
      } catch (error) {
        console.error('❌ Periodic refresh failed:', error);
        setIsOnline(false);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, [isOnline]);

  // Window focus refresh
  useEffect(() => {
    if (!isOnline) return;

    const handleWindowFocus = async () => {
      try {
        console.log('👁️ Window focused - refreshing data...');
        const [freshDailyData, freshStores] = await Promise.all([
          HybridStorageManager.getDailyData(),
          HybridStorageManager.getStores()
        ]);
        
        setDailyData(freshDailyData);
        setStores(freshStores);
        console.log('✅ Focus refresh completed');
      } catch (error) {
        console.error('❌ Focus refresh failed:', error);
        setIsOnline(false);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isOnline]);

  const getTodayData = useCallback((): DailyData => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayData = dailyData.find(d => d.date === today);
    
    if (!todayData) {
      console.log('📅 Creating new today data entry');
      const newData: DailyData = {
        date: today,
        deliveries: [],
        summary: {
          totalStores: 0,
          totalDeliveries: 0,
          totalDelivered: 0,
          totalPending: 0,
          totalBills: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0
        }
      };
      setDailyData(prev => [newData, ...prev]);
      return newData;
    }
    
    return todayData;
  }, [dailyData]);

  const addStore = useCallback(async (store: Omit<Store, 'id'>) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    const newStore: Store = {
      ...store,
      id: Date.now().toString()
    };
    
    try {
      await HybridStorageManager.saveStore(newStore);
      
      // Refresh stores from database
      const freshStores = await HybridStorageManager.getStores();
      setStores(freshStores);
      
      return newStore;
    } catch (error) {
      console.error('❌ Failed to add store:', error);
      throw error;
    }
  }, [isOnline]);

  const updateStore = useCallback(async (storeId: string, updates: Partial<Store>) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    const existingStore = stores.find(s => s.id === storeId);
    if (!existingStore) {
      throw new Error('Store not found');
    }

    const updatedStore = { ...existingStore, ...updates };
    
    try {
      await HybridStorageManager.saveStore(updatedStore);
      
      // Refresh stores from database
      const freshStores = await HybridStorageManager.getStores();
      setStores(freshStores);
    } catch (error) {
      console.error('❌ Failed to update store:', error);
      throw error;
    }
  }, [stores, isOnline]);

  const addDelivery = useCallback(async (delivery: Omit<Delivery, 'id'>) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    const newDelivery: Delivery = {
      ...delivery,
      id: Date.now().toString()
    };

    try {
      await HybridStorageManager.saveDelivery(newDelivery);
      
      // Refresh data from database
      const freshDailyData = await HybridStorageManager.getDailyData();
      setDailyData(freshDailyData);
      
      return newDelivery;
    } catch (error) {
      console.error('❌ Failed to add delivery:', error);
      throw error;
    }
  }, [isOnline]);

  const updateDelivery = useCallback(async (deliveryId: string, updates: Partial<Delivery>) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayData = dailyData.find(data => data.date === today);
    const existingDelivery = todayData?.deliveries.find(d => d.id === deliveryId);
    
    if (!existingDelivery) {
      console.warn(`⚠️ Attempted to update non-existent delivery: ${deliveryId}`);
      
      // Refresh data and check again
      try {
        const freshDailyData = await HybridStorageManager.getDailyData();
        setDailyData(freshDailyData);
        
        const freshTodayData = freshDailyData.find(data => data.date === today);
        const delivery = freshTodayData?.deliveries.find(d => d.id === deliveryId);
        
        if (!delivery) {
          alert('This order may have been deleted. Refreshing data...');
          return;
        }
        
        // Use the refreshed delivery data
        const updatedDelivery = { ...delivery, ...updates };
        
        try {
          await HybridStorageManager.updateDelivery(updatedDelivery);
          const updatedDailyData = await HybridStorageManager.getDailyData();
          setDailyData(updatedDailyData);
          return;
        } catch (updateError) {
          console.error('❌ Failed to update delivery after refresh:', updateError);
          throw updateError;
        }
      } catch (error) {
        console.error('Failed to verify delivery existence:', error);
        return;
      }
    }

    const updatedDelivery = { ...existingDelivery, ...updates };

    try {
      await HybridStorageManager.updateDelivery(updatedDelivery);
      
      // Refresh data from database
      const freshDailyData = await HybridStorageManager.getDailyData();
      setDailyData(freshDailyData);
    } catch (error) {
      console.error('❌ Failed to update delivery:', error);
      throw error;
    }
  }, [dailyData, isOnline]);

  const deleteDelivery = useCallback(async (deliveryId: string) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }
    
    console.log(`🗑️ Deleting delivery ${deliveryId}...`);
    
    try {
      await HybridStorageManager.deleteDelivery(deliveryId);
      
      // Refresh data from database
      const freshDailyData = await HybridStorageManager.getDailyData();
      setDailyData(freshDailyData);
      
      console.log('✅ Delivery deleted and data refreshed');
    } catch (error) {
      console.error('❌ Failed to delete delivery:', error);
      alert('Failed to delete delivery. Please try again.');
      throw error;
    }
  }, [isOnline]);

  const deleteStore = useCallback(async (storeId: string) => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    console.log(`🗑️ Deleting store ${storeId}...`);

    try {
      await HybridStorageManager.deleteStore(storeId);
      
      // Refresh stores from database
      const freshStores = await HybridStorageManager.getStores();
      setStores(freshStores);
      
      console.log('✅ Store deleted and data refreshed');
    } catch (error) {
      console.error('❌ Failed to delete store:', error);
      alert('Failed to delete store. Please try again.');
      throw error;
    }
  }, [isOnline]);

  const getDataForView = useCallback(() => {
    switch (viewMode) {
      case 'weekly':
        // Get last 7 days
        return dailyData.slice(0, 7);
      case 'monthly':
        // Get last 30 days
        return dailyData.slice(0, 30);
      default:
        return [getTodayData()];
    }
  }, [viewMode, dailyData, getTodayData]);

  const refreshData = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    try {
      console.log('🔄 Manual data refresh...');
      const [freshDailyData, freshStores] = await Promise.all([
        HybridStorageManager.getDailyData(),
        HybridStorageManager.getStores()
      ]);
      
      setDailyData(freshDailyData);
      setStores(freshStores);
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      throw error;
    }
  }, [isOnline]);

  const clearAndResync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Database connection required');
    }

    try {
      console.log('🔄 Clear and resync...');
      
      // Simply refresh from database (no local storage to clear)
      const [freshDailyData, freshStores] = await Promise.all([
        HybridStorageManager.getDailyData(),
        HybridStorageManager.getStores()
      ]);
      
      setDailyData(freshDailyData);
      setStores(freshStores);
      console.log('✅ Clear and resync completed');
    } catch (error) {
      console.error('❌ Clear and resync failed:', error);
      throw error;
    }
  }, [isOnline]);

  return {
    dailyData,
    stores,
    currentDate,
    viewMode,
    loading,
    isOnline,
    setViewMode,
    getTodayData,
    getDataForView,
    addStore,
    updateStore,
    deleteStore,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    refreshData,
    clearAndResync
  };
};