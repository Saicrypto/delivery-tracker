import { useState, useEffect, useCallback } from 'react';
import { DailyData, Store, Delivery, ViewMode } from '../types';
import { StorageManager } from '../utils/storage';
import { HybridStorageManager } from '../utils/hybridStorage';
import { URLDataSharing } from '../utils/cloudStorage';
import { format } from 'date-fns';

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
        
        setDailyData(storedDailyData);
        setStores(storedStores);
        
        // Create today's data if it doesn't exist
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayExists = storedDailyData.some(data => data.date === today);
        
        if (!todayExists) {
          console.log('Creating today\'s data entry:', today);
          const newTodayData = StorageManager.createEmptyDailyData(new Date());
          StorageManager.updateDailyData(newTodayData);
          setDailyData(prev => [newTodayData, ...prev]);
        } else {
          console.log('Today\'s data already exists:', today);
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
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayData = dailyData.find(data => data.date === today);
    
    if (!todayData) {
      const newData = StorageManager.createEmptyDailyData(new Date());
      setDailyData(prev => [newData, ...prev]);
      return newData;
    }
    
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

    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedDailyData = dailyData.map(data => {
      if (data.date === today) {
        const updatedDeliveries = [...data.deliveries, newDelivery];
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

    // Save using hybrid storage (database + local)
    await HybridStorageManager.saveDelivery(newDelivery);

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
    deleteDelivery
  };
};
