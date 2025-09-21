import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { HybridStorageManager } from '../utils/hybridStorage';

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
              Download your data as a JSON file for backup purposes.
            </p>
            <button
              onClick={exportData}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </button>
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