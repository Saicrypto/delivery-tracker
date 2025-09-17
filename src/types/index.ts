export interface Store {
  id: string;
  name: string;
  address?: string;
  contact?: string;
}

export interface Delivery {
  id: string;
  storeId: string;
  storeName: string;
  date: string; // ISO date string
  // Some parts of the app use numberOfDeliveries; others use totalDeliveries.
  // Keep both for compatibility across devices and data sources.
  totalDeliveries: number;
  numberOfDeliveries?: number;
  delivered: number;
  pending: number;
  bills: number;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface PaymentStatus {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export interface DailyData {
  date: string;
  deliveries: Delivery[];
  summary: {
    totalStores: number;
    totalDeliveries: number;
    totalDelivered: number;
    totalPending: number;
    totalBills: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

export interface ChartData {
  date: string;
  deliveries: number;
  delivered: number;
  pending: number;
  revenue: number;
}

export type ViewMode = 'daily' | 'weekly' | 'monthly';

