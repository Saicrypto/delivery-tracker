import React, { useState } from 'react';
import { StorageManager } from '../utils/storage';
import { HybridStorageManager } from '../utils/hybridStorage';
import { DatabaseTester } from '../utils/databaseTest';

interface DebugInfoProps {
  isVisible: boolean;
  onToggle: () => void;
  onOpenDatabaseInspector?: () => void;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ isVisible, onToggle, onOpenDatabaseInspector }) => {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

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

  const runDatabaseTest = async () => {
    setIsTesting(true);
    setTestResult('');
    
    try {
      const result = await DatabaseTester.testConnection();
      setTestResult(`${result.message}\n${JSON.stringify(result.details, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

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
        
        {/* Database Test Section */}
        <div className="mt-3 pt-2 border-t border-gray-200 space-y-2">
          <button
            onClick={runDatabaseTest}
            disabled={isTesting}
            className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Database Connection'}
          </button>
          
          {onOpenDatabaseInspector && (
            <button
              onClick={onOpenDatabaseInspector}
              className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Open Database Inspector
            </button>
          )}
          
          {testResult && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
