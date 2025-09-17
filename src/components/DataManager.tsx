import React, { useState } from 'react';
import { Download, Upload, Trash2, Share2, Copy } from 'lucide-react';
import { StorageManager } from '../utils/storage';
import { URLDataSharing } from '../utils/cloudStorage';

interface DataManagerProps {
  onClose: () => void;
  onDataChange: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ onClose, onDataChange }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const exportData = () => {
    setIsExporting(true);
    try {
      const dailyData = StorageManager.getDailyData();
      const stores = StorageManager.getStores();
      
      const exportData = {
        dailyData,
        stores,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delivery-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (importData.dailyData && importData.stores) {
          StorageManager.saveDailyData(importData.dailyData);
          StorageManager.saveStores(importData.stores);
          onDataChange();
          alert('Data imported successfully!');
        } else {
          alert('Invalid data format');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data');
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
      try {
        StorageManager.saveDailyData([]);
        StorageManager.saveStores([]);
        onDataChange();
        alert('All data cleared successfully!');
      } catch (error) {
        console.error('Clear error:', error);
        alert('Failed to clear data');
      }
    }
  };

  const generateShareLink = () => {
    try {
      const dailyData = StorageManager.getDailyData();
      const stores = StorageManager.getStores();
      
      const shareData = {
        dailyData,
        stores,
        shareDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const url = URLDataSharing.shareData(shareData);
      setShareUrl(url);
      
      // Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Share link copied to clipboard!');
      }).catch(() => {
        alert('Share link generated! Copy it manually.');
      });
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to generate share link');
    }
  };

  const loadSharedData = () => {
    try {
      const sharedData = URLDataSharing.loadSharedData();
      if (sharedData && sharedData.dailyData && sharedData.stores) {
        StorageManager.saveDailyData(sharedData.dailyData);
        StorageManager.saveStores(sharedData.stores);
        onDataChange();
        alert('Shared data loaded successfully!');
      } else {
        alert('No shared data found in URL');
      }
    } catch (error) {
      console.error('Load shared data error:', error);
      alert('Failed to load shared data');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download all your delivery data as a backup file.
            </p>
            <button
              onClick={exportData}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          {/* Import Data */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Import Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload a backup file to restore your data.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              disabled={isImporting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {isImporting && (
              <p className="text-sm text-blue-600 mt-2">Importing data...</p>
            )}
          </div>

          {/* Share Data */}
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Share Data</h3>
            <p className="text-sm text-blue-600 mb-3">
              Generate a shareable link to sync data across devices.
            </p>
            <button
              onClick={generateShareLink}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </button>
            {shareUrl && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Share this link:</p>
                <div className="flex">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-l-md"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="px-2 py-1 bg-gray-200 border border-gray-300 rounded-r-md hover:bg-gray-300"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Load Shared Data */}
          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Load Shared Data</h3>
            <p className="text-sm text-green-600 mb-3">
              Load data from a shared link (if URL contains shared data).
            </p>
            <button
              onClick={loadSharedData}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Load from Shared Link
            </button>
          </div>

          {/* Clear Data */}
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">Clear All Data</h3>
            <p className="text-sm text-red-600 mb-3">
              Permanently delete all delivery data and stores.
            </p>
            <button
              onClick={clearAllData}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
