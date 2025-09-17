import React from 'react';
import { StorageManager } from '../utils/storage';
import { HybridStorageManager } from '../utils/hybridStorage';

interface DebugInfoProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ isVisible, onToggle }) => {
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        Debug
      </button>
    );
  }

  const dailyData = StorageManager.getDailyData();
  const stores = StorageManager.getStores();
  const isLocalStorageAvailable = StorageManager.isLocalStorageAvailable();
  const dbStatus = HybridStorageManager.getConnectionStatus();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Debug Info</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>
          <strong>Database:</strong> {dbStatus.isOnline ? '✅ Connected' : '❌ Offline'}
        </div>
        <div>
          <strong>DB Initialized:</strong> {dbStatus.dbInitialized ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>localStorage:</strong> {isLocalStorageAvailable ? '✅ Available' : '❌ Not Available'}
        </div>
        <div>
          <strong>Daily Data:</strong> {dailyData.length} entries
        </div>
        <div>
          <strong>Stores:</strong> {stores.length} stores
        </div>
        <div>
          <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
        </div>
        <div>
          <strong>Screen:</strong> {window.screen.width}x{window.screen.height}
        </div>
        <div>
          <strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}
        </div>
        
        {dailyData.length > 0 && (
          <div className="mt-2">
            <strong>Recent Data:</strong>
            <div className="text-xs text-gray-600">
              {dailyData.slice(0, 2).map((data, index) => (
                <div key={index}>
                  {data.date}: {data.deliveries.length} deliveries
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
