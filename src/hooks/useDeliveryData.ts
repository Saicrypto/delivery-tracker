import { useState, useEffect, useCallback } from 'react';
import { DailyData, Store, Delivery, ViewMode } from '../types';
import { StorageManager } from '../utils/storage';
import { HybridStorageManager } from '../utils/hybridStorage';
import { URLDataSharing } from '../utils/cloudStorage';
import { format } from 'date-fns';
import { MobileFix } from '../utils/mobileFix';

export const useDeliveryData = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [loading, setLoading] = useState(true);
  const [, setIsOnline] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize database connection
        await HybridStorageManager.initialize();
        const status = HybridStorageManager.getConnectionStatus();
        setIsOnline(status.isOnline);

        // Check for shared data first
        if (URLDataSharing.hasSharedData()) {
          const sharedData = URLDataSharing.loadSharedData();
          if (sharedData && sharedData.dailyData && sharedData.stores) {
            StorageManager.saveDailyData(sharedData.dailyData);
            StorageManager.saveStores(sharedData.stores);
            setDailyData(sharedData.dailyData);
            setStores(sharedData.stores);
            setLoading(false);
            return;
          }
        }

        // Load data using hybrid storage (database + local fallback)
        const storedDailyData = await HybridStorageManager.getDailyData();
        const storedStores = await HybridStorageManager.getStores();
        
        console.log('Loaded daily data:', storedDailyData.length, 'entries');
        console.log('Loaded stores:', storedStores.length, 'stores');
        
        setDailyData(storedDailyData);
        setStores(storedStores);
        
        // Create today's data if it doesn't exist
        const today = MobileFix.getTodayString();
        const todayExists = storedDailyData.some(data => data.date === today);
        
        if (!todayExists) {
          console.log('Creating today\'s data entry:', today);
          const newTodayData = StorageManager.createEmptyDailyData(new Date());
          StorageManager.updateDailyData(newTodayData);
          setDailyData(prev => [newTodayData, ...prev]);
        } else {
          const todayData = storedDailyData.find(data => data.date === today);
          console.log('Today\'s data already exists:', today, 'with', todayData?.deliveries.length || 0, 'deliveries');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to local storage only
        const storedDailyData = StorageManager.getDailyData();
        const storedStores = StorageManager.getStores();
        setDailyData(storedDailyData);
        setStores(storedStores);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getTodayData = useCallback((): DailyData => {
    const today = MobileFix.getTodayString();
    const todayData = dailyData.find(data => data.date === today);
    
    console.log('getTodayData called for date:', today);
    console.log('Available daily data dates:', dailyData.map(d => d.date));
    console.log('Today data found:', !!todayData);
    
    if (!todayData) {
      console.log('Creating new today data entry');
      const newData = StorageManager.createEmptyDailyData(new Date());
      setDailyData(prev => [newData, ...prev]);
      return newData;
    }
    
    console.log('Today data has', todayData.deliveries.length, 'deliveries');
    return todayData;
  }, [dailyData]);

  const addStore = useCallback(async (store: Omit<Store, 'id'>) => {
    const newStore: Store = {
      ...store,
      id: Date.now().toString()
    };
    
    const updatedStores = [...stores, newStore];
    setStores(updatedStores);
    
    // Save using hybrid storage (database + local)
    await HybridStorageManager.saveStore(newStore);
    
    return newStore;
  }, [stores]);

  const updateStore = useCallback((storeId: string, updates: Partial<Store>) => {
    const updatedStores = stores.map(store =>
      store.id === storeId ? { ...store, ...updates } : store
    );
    
    setStores(updatedStores);
    StorageManager.saveStores(updatedStores);
  }, [stores]);

  const deleteStore = useCallback((storeId: string) => {
    const updatedStores = stores.filter(store => store.id !== storeId);
    setStores(updatedStores);
    StorageManager.saveStores(updatedStores);
  }, [stores]);

  const addDelivery = useCallback(async (delivery: Omit<Delivery, 'id'>) => {
    const newDelivery: Delivery = {
      ...delivery,
      id: Date.now().toString()
    };

    console.log('Adding delivery:', newDelivery);

    const today = MobileFix.getTodayString();
    let updatedDailyData = dailyData.map(data => {
      if (data.date === today) {
        const updatedDeliveries = [...data.deliveries, newDelivery];
        const updatedSummary = StorageManager.calculateSummary(updatedDeliveries);
        
        console.log('Updated today data with', updatedDeliveries.length, 'deliveries');
        return {
          ...data,
          deliveries: updatedDeliveries,
          summary: updatedSummary
        };
      }
      return data;
    });

    // If today's data doesn't exist, create it
    const todayExists = updatedDailyData.some(data => data.date === today);
    if (!todayExists) {
      console.log('Creating today data entry for new delivery');
      const newTodayData = StorageManager.createEmptyDailyData(new Date());
      newTodayData.deliveries = [newDelivery];
      newTodayData.summary = StorageManager.calculateSummary([newDelivery]);
      updatedDailyData = [newTodayData, ...updatedDailyData];
    }

    setDailyData(updatedDailyData);
    
    const todayData = updatedDailyData.find(data => data.date === today);
    if (todayData) {
      StorageManager.updateDailyData(todayData);
      console.log('Saved today data to local storage');
    }

    // Save using hybrid storage (database + local)
    await HybridStorageManager.saveDelivery(newDelivery);
    console.log('Saved delivery to hybrid storage');

    return newDelivery;
  }, [dailyData]);

  const updateDelivery = useCallback((deliveryId: string, updates: Partial<Delivery>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedDailyData = dailyData.map(data => {
      if (data.date === today) {
        const updatedDeliveries = data.deliveries.map(delivery =>
          delivery.id === deliveryId ? { ...delivery, ...updates } : delivery
        );
        const updatedSummary = StorageManager.calculateSummary(updatedDeliveries);
        
        return {
          ...data,
          deliveries: updatedDeliveries,
          summary: updatedSummary
        };
      }
      return data;
    });

    setDailyData(updatedDailyData);
    
    const todayData = updatedDailyData.find(data => data.date === today);
    if (todayData) {
      StorageManager.updateDailyData(todayData);
    }
  }, [dailyData]);

  const deleteDelivery = useCallback((deliveryId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedDailyData = dailyData.map(data => {
      if (data.date === today) {
        const updatedDeliveries = data.deliveries.filter(delivery => delivery.id !== deliveryId);
        const updatedSummary = StorageManager.calculateSummary(updatedDeliveries);
        
        return {
          ...data,
          deliveries: updatedDeliveries,
          summary: updatedSummary
        };
      }
      return data;
    });

    setDailyData(updatedDailyData);
    
    const todayData = updatedDailyData.find(data => data.date === today);
    if (todayData) {
      StorageManager.updateDailyData(todayData);
    }
  }, [dailyData]);

  const getDataForView = useCallback(() => {
    switch (viewMode) {
      case 'weekly':
        return StorageManager.getWeekData();
      case 'monthly':
        return dailyData.slice(0, 30); // Last 30 days
      default:
        return [getTodayData()];
    }
  }, [viewMode, dailyData, getTodayData]);

  const refreshData = useCallback(async () => {
    console.log('Refreshing data from database...');
    try {
      const storedDailyData = await HybridStorageManager.getDailyData();
      const storedStores = await HybridStorageManager.getStores();
      
      console.log('Refreshed daily data:', storedDailyData.length, 'entries');
      console.log('Refreshed stores:', storedStores.length, 'stores');
      
      setDailyData(storedDailyData);
      setStores(storedStores);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  return {
    dailyData,
    stores,
    currentDate,
    viewMode,
    loading,
    setViewMode,
    getTodayData,
    getDataForView,
    addStore,
    updateStore,
    deleteStore,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    refreshData
  };
};
