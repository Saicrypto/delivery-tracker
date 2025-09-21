import React, { useState } from 'react';
import { Download, RefreshCw, FileText } from 'lucide-react';
import { HybridStorageManager } from '../utils/hybridStorage';
import { Delivery } from '../types';

interface DataManagerProps {
  onClose: () => void;
  onDataChange: () => void;
  dailyData?: any[];
  stores?: any[];
}

export const DataManager: React.FC<DataManagerProps> = ({ 
  onClose, 
  onDataChange,
  dailyData = [],
  stores = []
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const exportData = () => {
    setIsExporting(true);
    try {
      const exportData = {
        dailyData,
        stores,
        exportDate: new Date().toISOString(),
        version: '2.0.0-database-only'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = () => {
    setIsExporting(true);
    try {
      // Flatten all deliveries from dailyData
      const allDeliveries: Delivery[] = dailyData.flatMap((day: any) => day.deliveries || []);

      if (allDeliveries.length === 0) {
        alert('No delivery data to export');
        setIsExporting(false);
        return;
      }

      // Create CSV headers (excluding itemDetails as requested)
      const headers = [
        'Date',
        'Store Name',
        'Customer Name',
        'Phone Number',
        'Address',
        'Order Number',
        'Order Price',
        'Delivery Status',
        'Total Deliveries',
        'Delivered',
        'Pending',
        'Bills',
        'Total Amount',
        'Paid Amount',
        'Pending Amount',
        'Overdue Amount'
      ];

      // Create CSV rows
      const rows = allDeliveries.map(delivery => [
        delivery.date,
        delivery.storeName,
        delivery.customerName,
        delivery.phoneNumber,
        delivery.address,
        delivery.orderNumber,
        delivery.orderPrice,
        delivery.deliveryStatus,
        delivery.totalDeliveries,
        delivery.delivered,
        delivery.pending,
        delivery.bills,
        delivery.paymentStatus.total,
        delivery.paymentStatus.paid,
        delivery.paymentStatus.pending,
        delivery.paymentStatus.overdue
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ CSV exported successfully with ${allDeliveries.length} deliveries`);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const testDatabaseConnection = async () => {
    setIsSyncing(true);
    try {
      const isConnected = await HybridStorageManager.testConnection();
      alert(isConnected ? 'Database connection successful!' : 'Database connection failed!');
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Database connection test failed!');
    } finally {
      setIsSyncing(false);
    }
  };

  const reconnectDatabase = async () => {
    setIsSyncing(true);
    try {
      await HybridStorageManager.reconnect();
      onDataChange(); // Refresh data after reconnection
      alert('Database reconnected successfully!');
    } catch (error) {
      console.error('Reconnection failed:', error);
      alert('Database reconnection failed!');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Database Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Database Status</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Daily Data: {dailyData.length} entries</div>
              <div>Stores: {stores.length} stores</div>
              <div>Mode: Database-only (no local storage)</div>
            </div>
          </div>

          {/* Export Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download your data as JSON or CSV format.
            </p>
            <div className="space-y-2">
              <button
                onClick={exportData}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export JSON Backup'}</span>
              </button>
              <button
                onClick={exportCSV}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full"
              >
                <FileText className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV Data'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              CSV export excludes item details as requested and includes all delivery information.
            </p>
          </div>

          {/* Database Management */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Database Management</h3>
            <div className="space-y-2">
              <button
                onClick={testDatabaseConnection}
                disabled={isSyncing}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 w-full"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{isSyncing ? 'Testing...' : 'Test Connection'}</span>
              </button>
              
              <button
                onClick={reconnectDatabase}
                disabled={isSyncing}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 w-full"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{isSyncing ? 'Reconnecting...' : 'Reconnect Database'}</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Database-Only Mode</h3>
            <p className="text-sm text-yellow-800">
              This app now operates exclusively with the Turso database. All data is stored online and synchronized across devices automatically. Local storage has been removed for better consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};