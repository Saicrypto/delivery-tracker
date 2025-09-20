export interface Store {
  id: string;
  name: string;
  address?: string;
  contact?: string;
  pricePerOrder?: number; // Default price for orders from this store
}

export type DeliveryStatus = 'pending pickup' | 'picked up' | 'delivered';

export interface Delivery {
  id: string;
  storeId: string;
  storeName: string;
  date: string; // ISO date string
  // Simplified fields for new form
  customerName: string;
  phoneNumber: string;
  address: string;
  itemDetails: string;
  orderNumber: string;
  deliveryStatus: DeliveryStatus;
  orderPrice: number; // Price for this specific order
  // Legacy fields for backward compatibility
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

