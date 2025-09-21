import { useState, useEffect, useCallback } from 'react';
import { DailyData, Store, Delivery, ViewMode } from '../types';
import { StorageManager } from '../utils/storage';
import { HybridStorageManager } from '../utils/hybridStorage';
import { URLDataSharing } from '../utils/cloudStorage';
import { DataSyncManager } from '../utils/dataSync';
import { DeploymentFix } from '../utils/deploymentFix';
import { format } from 'date-fns';
import { MobileFix } from '../utils/mobileFix';

export const useDeliveryData = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Production-safe initialization
        if (DeploymentFix.isVercel() || DeploymentFix.isProduction()) {
          console.log('🌐 Production environment detected, using safe loading...');
          
          // Use safe data loading for production
          const safeData = await DeploymentFix.safeDataLoad();
          setDailyData(safeData.dailyData);
          setStores(safeData.stores);
          
          // Ensure today's data exists
          const today = MobileFix.getTodayString();
          const todayExists = safeData.dailyData.some((data: any) => data.date === today);
          
          if (!todayExists) {
            const newTodayData = StorageManager.createEmptyDailyData(new Date());
            setDailyData(prev => [newTodayData, ...prev]);
          }
          
          setLoading(false);

          // Non-blocking DB init + background sync in production
          setTimeout(async () => {
            try {
              console.log('🌐 Prod: initializing DB and syncing in background...');
              await HybridStorageManager.initialize();
              const statusProd = HybridStorageManager.getConnectionStatus();
              setIsOnline(statusProd.isOnline);

              if (statusProd.isOnline) {
                const syncedData = await DataSyncManager.forceSyncFromDatabase();
                const finalDailyData = DataSyncManager.ensureTodayData(syncedData.dailyData);
                setDailyData(finalDailyData);
                setStores(syncedData.stores);
                console.log('✅ Prod background sync completed');
              } else {
                console.warn('⚠️ Prod: DB offline, using local-only data');
              }
            } catch (err) {
              console.warn('⚠️ Prod background init/sync failed:', err);
            }
          }, 800);

          return;
        }

        // Development environment - full initialization
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

        // Load data safely with proper error handling
        try {
          console.log('📱 Loading data from local storage...');
          
          // Load from local storage first (safe approach)
          const storedDailyData = StorageManager.getDailyData();
          const storedStores = StorageManager.getStores();
          
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
          
          // Try to sync with database in background (non-blocking)
          setTimeout(async () => {
            try {
              console.log('🔄 Background sync from database...');
              const syncedData = await DataSyncManager.forceSyncFromDatabase();
              const finalDailyData = DataSyncManager.ensureTodayData(syncedData.dailyData);
              
              setDailyData(finalDailyData);
              setStores(syncedData.stores);
              
              console.log('✅ Background sync completed');
            } catch (error) {
              console.warn('⚠️ Background sync failed:', error);
            }
          }, 1000);
          
        } catch (error) {
          console.error('❌ Error loading local data:', error);
          // Set empty data to prevent crash
          setDailyData([]);
          setStores([]);
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

  // Periodic sync for cross-device updates
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;
    
    const setupPeriodicSync = async () => {
      // Only setup periodic sync if we're online and have data
      if (!isOnline || dailyData.length === 0) {
        return;
      }

      console.log('🔄 Setting up periodic cross-device sync...');
      
      // Sync every 30 seconds to catch cross-device changes
      syncInterval = setInterval(async () => {
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          
          // Get current deliveries from database
          const { DatabaseService } = await import('../services/database');
          const dbDeliveries = await DatabaseService.getDeliveriesByDate(today);
          
          // Get current local deliveries
          const currentTodayData = dailyData.find(d => d.date === today);
          const localDeliveries = currentTodayData?.deliveries || [];
          
          // Check if there are differences
          const dbIds = new Set(dbDeliveries.map(d => d.id));
          const localIds = new Set(localDeliveries.map(d => d.id));
          
          const hasChanges = dbIds.size !== localIds.size || 
                           Array.from(dbIds).some(id => !localIds.has(id)) ||
                           Array.from(localIds).some(id => !dbIds.has(id));
          
          if (hasChanges) {
            console.log('📊 Cross-device changes detected, syncing...');
            console.log(`Database: ${dbDeliveries.length} deliveries, Local: ${localDeliveries.length} deliveries`);
            console.log('Database delivery IDs:', Array.from(dbIds));
            console.log('Local delivery IDs:', Array.from(localIds));
            
            // Update today's data with database state
            const updatedDailyData = dailyData.map(dayData => {
              if (dayData.date === today) {
                // Database is the source of truth - use it as the primary source
                // Only add local deliveries that are truly new (not in database yet)
                const newLocalDeliveries = localDeliveries.filter(local => {
                  // Only keep local deliveries that don't exist in database
                  return !dbIds.has(local.id);
                });
                
                console.log(`🔄 Merging: ${dbDeliveries.length} from DB + ${newLocalDeliveries.length} new local = ${dbDeliveries.length + newLocalDeliveries.length} total`);
                
                const mergedDeliveries = [...dbDeliveries, ...newLocalDeliveries];
                const updatedSummary = StorageManager.calculateSummary(mergedDeliveries);
                
                // Update local storage to match the merged state
                const updatedTodayData = {
                  ...dayData,
                  deliveries: mergedDeliveries,
                  summary: updatedSummary
                };
                StorageManager.updateDailyData(updatedTodayData);
                
                return updatedTodayData;
              }
              return dayData;
            });
            
            setDailyData(updatedDailyData);
            console.log('✅ Cross-device sync completed');
          } else {
            console.log('🔄 No cross-device changes detected');
          }
        } catch (error) {
          console.error('❌ Periodic sync failed:', error);
        }
      }, 60000); // 60 seconds (reduced frequency to avoid too many syncs)
    };

    // Start periodic sync after a short delay
    const timer = setTimeout(() => {
      setupPeriodicSync();
    }, 10000); // Wait 10 seconds after initial load

    return () => {
      if (syncInterval) {
        console.log('🔄 Cleaning up periodic sync');
        clearInterval(syncInterval);
      }
      clearTimeout(timer);
    };
  }, [isOnline, dailyData]);

  // Immediate sync when window gets focus (for better cross-device sync)
  useEffect(() => {
    const handleWindowFocus = async () => {
      if (!isOnline || dailyData.length === 0) return;
      
      try {
        console.log('🔄 Window focused, checking for cross-device changes...');
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Get current deliveries from database
        const { DatabaseService } = await import('../services/database');
        const dbDeliveries = await DatabaseService.getDeliveriesByDate(today);
        
        // Get current local deliveries
        const currentTodayData = dailyData.find(d => d.date === today);
        const localDeliveries = currentTodayData?.deliveries || [];
        
        // Check if there are differences
        const dbIds = new Set(dbDeliveries.map(d => d.id));
        const localIds = new Set(localDeliveries.map(d => d.id));
        
        const hasChanges = dbIds.size !== localIds.size || 
                         Array.from(dbIds).some(id => !localIds.has(id)) ||
                         Array.from(localIds).some(id => !dbIds.has(id));
        
        if (hasChanges) {
          console.log('📊 Focus sync: Cross-device changes detected!');
          console.log(`Database: ${dbDeliveries.length} deliveries, Local: ${localDeliveries.length} deliveries`);
          
          // Update today's data with database state
          const updatedDailyData = dailyData.map(dayData => {
            if (dayData.date === today) {
              // Database is the source of truth - use it as the primary source
              // Only add local deliveries that are truly new (not in database yet)
              const newLocalDeliveries = localDeliveries.filter(local => {
                // Only keep local deliveries that don't exist in database
                return !dbIds.has(local.id);
              });
              
              console.log(`🔄 Focus sync merging: ${dbDeliveries.length} from DB + ${newLocalDeliveries.length} new local = ${dbDeliveries.length + newLocalDeliveries.length} total`);
              
              const mergedDeliveries = [...dbDeliveries, ...newLocalDeliveries];
              const updatedSummary = StorageManager.calculateSummary(mergedDeliveries);
              
              // Update local storage to match the merged state
              const updatedTodayData = {
                ...dayData,
                deliveries: mergedDeliveries,
                summary: updatedSummary
              };
              StorageManager.updateDailyData(updatedTodayData);
              
              return updatedTodayData;
            }
            return dayData;
          });
          
          setDailyData(updatedDailyData);
          console.log('✅ Focus sync completed');
        }
      } catch (error) {
        console.error('❌ Focus sync failed:', error);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isOnline, dailyData]);

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

  const updateDelivery = useCallback(async (deliveryId: string, updates: Partial<Delivery>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // First check if the delivery exists locally
    const todayData = dailyData.find(data => data.date === today);
    const existingDelivery = todayData?.deliveries.find(d => d.id === deliveryId);
    
    if (!existingDelivery) {
      console.warn(`⚠️ Attempted to update non-existent delivery: ${deliveryId}`);
      console.log('🔄 Triggering sync to refresh data...');
      
      // Delivery doesn't exist locally - trigger a sync to refresh data
      try {
        const { DatabaseService } = await import('../services/database');
        const dbDeliveries = await DatabaseService.getDeliveriesByDate(today);
        const dbDelivery = dbDeliveries.find(d => d.id === deliveryId);
        
        if (!dbDelivery) {
          console.log('❌ Delivery not found in database either - it may have been deleted');
          window.alert('This order may have been deleted. Refreshing data...');
          // Force a full refresh to clean up stale UI references
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error('Failed to verify delivery existence:', error);
      }
      return;
    }

    console.log(`📝 Updating delivery ${deliveryId} with:`, updates);

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
    
    const newTodayData = updatedDailyData.find(data => data.date === today);
    if (newTodayData) {
      StorageManager.updateDailyData(newTodayData);
    }

    // Update in database using HybridStorageManager
    try {
      const updatedDelivery = newTodayData?.deliveries.find(d => d.id === deliveryId);
      if (updatedDelivery) {
        await HybridStorageManager.saveDelivery(updatedDelivery);
        console.log('✅ Delivery updated in both local storage and database');
      }
    } catch (error) {
      console.error('❌ Failed to update delivery in database:', error);
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
    console.log('🔄 Force refreshing data from database...');
    try {
      const syncedData = await DataSyncManager.forceSyncFromDatabase();
      const finalDailyData = DataSyncManager.ensureTodayData(syncedData.dailyData);
      
      setDailyData(finalDailyData);
      setStores(syncedData.stores);
      
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      throw error;
    }
  }, []);

  const clearAndResync = useCallback(async () => {
    console.log('🗑️ Clearing all data and resyncing...');
    try {
      const syncedData = await DataSyncManager.clearAndResync();
      const finalDailyData = DataSyncManager.ensureTodayData(syncedData.dailyData);
      
      setDailyData(finalDailyData);
      setStores(syncedData.stores);
      
      console.log('✅ Clear and resync completed');
    } catch (error) {
      console.error('❌ Clear and resync failed:', error);
      throw error;
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
    addDelivery,
    updateDelivery,
    refreshData,
    clearAndResync
  };
};
