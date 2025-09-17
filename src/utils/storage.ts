import { DailyData, Store, Delivery } from '../types';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { MobileFix } from './mobileFix';

const STORAGE_KEYS = {
  DAILY_DATA: 'delivery-tracker-daily-data',
  STORES: 'delivery-tracker-stores',
  SETTINGS: 'delivery-tracker-settings'
};

export class StorageManager {
  // Check if localStorage is available (important for mobile)
  static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  static getDailyData(): DailyData[] {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, returning empty data');
        return [];
      }
      
      // Enhanced mobile compatibility
      if (MobileFix.isMobileBrowser()) {
        console.log('Mobile browser detected, using enhanced data loading');
      }
      
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_DATA);
      if (!data) {
        console.log('No daily data found in localStorage');
        return [];
      }
      
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.length} daily data entries`);
      return parsed;
    } catch (error) {
      console.error('Error loading daily data:', error);
      return [];
    }
  }

  static saveDailyData(data: DailyData[]): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, cannot save data');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.DAILY_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving daily data:', error);
    }
  }

  static getStores(): Store[] {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, returning empty stores');
        return [];
      }
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading stores:', error);
      return [];
    }
  }

  static saveStores(stores: Store[]): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage not available, cannot save stores');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    } catch (error) {
      console.error('Error saving stores:', error);
    }
  }

  static getTodayData(): DailyData | null {
    const allData = this.getDailyData();
    const today = format(new Date(), 'yyyy-MM-dd');
    return allData.find(data => data.date === today) || null;
  }

  static getWeekData(): DailyData[] {
    const allData = this.getDailyData();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    return allData.filter(data => {
      const dataDate = new Date(data.date);
      return isWithinInterval(dataDate, { start: weekStart, end: weekEnd });
    });
  }

  static createEmptyDailyData(date: Date): DailyData {
    return {
      date: format(date, 'yyyy-MM-dd'),
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
  }

  static updateDailyData(updatedData: DailyData): void {
    const allData = this.getDailyData();
    const existingIndex = allData.findIndex(data => data.date === updatedData.date);
    
    if (existingIndex >= 0) {
      allData[existingIndex] = updatedData;
    } else {
      allData.push(updatedData);
    }
    
    // Sort by date descending
    allData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.saveDailyData(allData);
  }

  static calculateSummary(deliveries: Delivery[]): DailyData['summary'] {
    return deliveries.reduce((summary, delivery) => ({
      totalStores: summary.totalStores + 1,
      totalDeliveries: summary.totalDeliveries + delivery.totalDeliveries,
      totalDelivered: summary.totalDelivered + delivery.delivered,
      totalPending: summary.totalPending + delivery.pending,
      totalBills: summary.totalBills + delivery.bills,
      totalRevenue: summary.totalRevenue + delivery.paymentStatus.total,
      totalPaid: summary.totalPaid + delivery.paymentStatus.paid,
      totalOutstanding: summary.totalOutstanding + delivery.paymentStatus.pending + delivery.paymentStatus.overdue
    }), {
      totalStores: 0,
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
