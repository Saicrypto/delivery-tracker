import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Package, Settings, Trash2 } from 'lucide-react';
import { ViewMode } from '../types';
import { CleanupService } from '../services/cleanupService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onDataManagerOpen?: () => void;
  onDataRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  currentDate,
  onDataManagerOpen,
  onDataRefresh
}) => {
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Get delivered orders count
  useEffect(() => {
    const updateDeliveredCount = async () => {
      const count = await CleanupService.getDeliveredOrdersCount();
      setDeliveredCount(count);
    };
    updateDeliveredCount();
  }, []);

  const handleCleanup = async () => {
    if (deliveredCount === 0) {
      window.alert('No delivered orders to clean up');
      return;
    }

    const confirmed = window.confirm(
      `Remove ${deliveredCount} delivered order${deliveredCount > 1 ? 's' : ''} from today? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsCleaningUp(true);
    try {
      const result = await CleanupService.forceCleanup();
      window.alert(`Cleanup completed! Removed ${result.removed} delivered orders.`);
      setDeliveredCount(0);
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Cleanup failed:', error);
      window.alert('Cleanup failed. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Tracker</h1>
              <p className="text-sm text-gray-600">{formatDate(currentDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* PWA Install Button */}
            <PWAInstallButton />
            
            {/* Cleanup Button */}
            {viewMode === 'daily' && deliveredCount > 0 && (
              <button
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Clean up ${deliveredCount} delivered order${deliveredCount > 1 ? 's' : ''}`}
              >
                <Trash2 className="h-4 w-4" />
                <span>{isCleaningUp ? 'Cleaning...' : `Clean ${deliveredCount}`}</span>
              </button>
            )}
            
            {onDataManagerOpen && (
              <button
                onClick={onDataManagerOpen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Data Management"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('daily')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                Daily
              </button>
              <button
                onClick={() => onViewModeChange('weekly')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'weekly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Weekly
              </button>
              <button
                onClick={() => onViewModeChange('monthly')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Monthly
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

