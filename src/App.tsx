import React, { useState, useEffect } from 'react';
import { Plus, Package, Download, Calendar } from 'lucide-react';
import { Header } from './components/Header';
import { SummaryDashboard } from './components/SummaryDashboard';
import { DeliveryCard } from './components/DeliveryCard';
import { GroupedDeliveries } from './components/GroupedDeliveries';
import { StoreForm } from './components/StoreForm';
import { BulkOrderForm } from './components/BulkOrderForm';
import { DebugInfo } from './components/DebugInfo';
import { DataManager } from './components/DataManager';
import { DatabaseInspector } from './components/DatabaseInspector';
import { useDeliveryData } from './hooks/useDeliveryData';
import { CleanupService } from './services/cleanupService';
import './App.css';

function App() {
  const {
    dailyData,
    stores,
    currentDate,
    viewMode,
    loading,
    setViewMode,
    getDataForView,
    getTodayData,
    addStore,
    deleteStore,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    refreshData,
    clearAndResync
  } = useDeliveryData();

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showBulkOrderForm, setShowBulkOrderForm] = useState(false);
  const [showCSVFilter, setShowCSVFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [showDatabaseInspector, setShowDatabaseInspector] = useState(false);

  // Initialize cleanup monitoring on app start
  useEffect(() => {
    CleanupService.initializeCleanupMonitoring();
  }, []);

  const currentData = getDataForView();
  const todayData = getTodayData();

  // Bulk add deliveries handler
  const handleBulkAddDeliveries = async (deliveries: any[]) => {
    try {
      for (const delivery of deliveries) {
        await addDelivery(delivery);
      }
      alert(`✅ Successfully added ${deliveries.length} deliveries!`);
    } catch (error) {
      console.error('Error adding bulk deliveries:', error);
      alert('❌ Error adding deliveries. Please check console for details.');
    }
  };

  // CSV Export handler
  const handleCSVExport = () => {
    setIsExporting(true);
    try {
      // Filter data by date range if provided
      let filteredData = dailyData;
      
      if (startDate || endDate) {
        filteredData = dailyData.filter(day => {
          const dayDate = new Date(day.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date('2100-12-31');
          
          return dayDate >= start && dayDate <= end;
        });
      }

      // Flatten all deliveries from filtered data
      const allDeliveries = filteredData.flatMap((day) => day.deliveries || []);

      if (allDeliveries.length === 0) {
        alert('No delivery data found for the selected date range');
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
      
      // Generate filename with date range
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : startDate 
        ? `from_${startDate}`
        : endDate
        ? `until_${endDate}`
        : new Date().toISOString().split('T')[0];
      
      a.download = `delivery-data-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ CSV exported successfully with ${allDeliveries.length} deliveries`);
      
      // Hide filter after successful export
      setShowCSVFilter(false);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDataManagerOpen={() => setShowDataManager(true)}
        onDataRefresh={refreshData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStoreForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Delivery
            </button>
            <button
              onClick={() => setShowBulkOrderForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Package className="h-5 w-5 mr-2" />
              Bulk Orders
            </button>
            <button
              onClick={() => setShowCSVFilter(!showCSVFilter)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {viewMode === 'daily' && (
              <span>Showing today's deliveries</span>
            )}
            {viewMode === 'weekly' && (
              <span>Showing this week's deliveries</span>
            )}
            {viewMode === 'monthly' && (
              <span>Showing this month's deliveries</span>
            )}
          </div>
        </div>

        {/* Summary Dashboard */}
        <SummaryDashboard data={currentData} viewMode={viewMode} />

        {/* CSV Date Filter (Collapsible) */}
        {showCSVFilter && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                CSV Export Options
              </h3>
              <button
                onClick={() => setShowCSVFilter(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCSVExport}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Exporting...' : 'Download'}</span>
                </button>
                
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              {startDate || endDate ? (
                <span>Export from {startDate || 'beginning'} to {endDate || 'present'}</span>
              ) : (
                <span>Export all delivery data (excludes item details)</span>
              )}
            </div>
          </div>
        )}

        {/* Deliveries Grid */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'daily' ? "Today's Deliveries" : 'Recent Deliveries'}
            </h2>
            <span className="text-sm text-gray-600">
              {viewMode === 'daily' 
                ? `${todayData.deliveries.length} deliveries today`
                : `${currentData.reduce((sum, day) => sum + day.deliveries.length, 0)} total deliveries`
              }
            </span>
          </div>

          {currentData.length === 0 || currentData.every(day => day.deliveries.length === 0) ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Plus className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first delivery record.
              </p>
              <button
                onClick={() => setShowStoreForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add First Delivery
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'daily' ? (
                <GroupedDeliveries
                  deliveries={todayData.deliveries}
                  onEdit={(delivery) => {
                    // For editing, you could open a form similar to StoreForm
                    console.log('Edit delivery:', delivery);
                  }}
                  onDelete={deleteDelivery}
                  onStatusChange={(deliveryId, newStatus) => {
                    const delivery = todayData.deliveries.find(d => d.id === deliveryId);
                    if (delivery) {
                      updateDelivery(deliveryId, { deliveryStatus: newStatus });
                    }
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {currentData.flatMap(dayData => 
                    dayData.deliveries.map(delivery => (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Store Form Modal */}
        {showStoreForm && (
          <StoreForm
            onSubmit={addDelivery}
            onAddStore={addStore}
            onDeleteStore={deleteStore}
            stores={stores}
            onClose={() => setShowStoreForm(false)}
          />
        )}

        {/* Bulk Order Form Modal */}
        {showBulkOrderForm && (
          <BulkOrderForm
            onSubmit={handleBulkAddDeliveries}
            onAddStore={addStore}
            onDeleteStore={deleteStore}
            stores={stores}
            onClose={() => setShowBulkOrderForm(false)}
          />
        )}

          {/* Data Manager Modal */}
          {showDataManager && (
            <DataManager
              onClose={() => setShowDataManager(false)}
              onDataChange={() => window.location.reload()}
              dailyData={dailyData}
              stores={stores}
            />
          )}

          {/* Database Inspector Modal */}
          {showDatabaseInspector && (
            <DatabaseInspector
              isVisible={showDatabaseInspector}
              onClose={() => setShowDatabaseInspector(false)}
            />
          )}

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p>Delivery Tracker - Track your daily deliveries and payments efficiently</p>
          </div>
        </footer>
      </main>

          {/* Debug Component */}
          <DebugInfo 
            isVisible={showDebug} 
            onToggle={() => setShowDebug(!showDebug)}
            onOpenDatabaseInspector={() => setShowDatabaseInspector(true)}
            onRefreshData={refreshData}
            onClearAndResync={clearAndResync}
            dailyData={dailyData}
            stores={stores}
          />
    </div>
  );
}

export default App;
