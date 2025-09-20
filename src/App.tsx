import React, { useState, useEffect } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { Header } from './components/Header';
import { SummaryDashboard } from './components/SummaryDashboard';
import { DeliveryCard } from './components/DeliveryCard';
import { StoreForm } from './components/StoreForm';
import { ChartsSection } from './components/ChartsSection';
import { DebugInfo } from './components/DebugInfo';
import { DataManager } from './components/DataManager';
import { DatabaseInspector } from './components/DatabaseInspector';
import { InstallPrompt, FloatingInstallButton } from './components/InstallPrompt';
import { useDeliveryData } from './hooks/useDeliveryData';
import { PWAManager } from './utils/pwa';
import './App.css';

function App() {
  const {
    stores,
    currentDate,
    viewMode,
    loading,
    setViewMode,
    getDataForView,
    getTodayData,
    addStore,
    addDelivery,
    deleteDelivery,
    refreshData,
    clearAndResync
  } = useDeliveryData();

  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [showDatabaseInspector, setShowDatabaseInspector] = useState(false);

  // Initialize PWA features
  useEffect(() => {
    PWAManager.initialize().catch(console.error);
  }, []);

  const currentData = getDataForView();
  const todayData = getTodayData();

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
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Install App Prompt */}
        <InstallPrompt className="mb-6" />
        
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
              onClick={() => setShowCharts(!showCharts)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                showCharts
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              {showCharts ? 'Hide Charts' : 'Show Analytics'}
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

        {/* Charts Section */}
        {showCharts && (
          <div className="mb-6">
            <ChartsSection data={currentData} viewMode={viewMode} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewMode === 'daily' 
                ? todayData.deliveries.map(delivery => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onEdit={(delivery) => {
                        // For editing, you could open a form similar to StoreForm
                        console.log('Edit delivery:', delivery);
                      }}
                      onDelete={deleteDelivery}
                    />
                  ))
                : currentData.flatMap(dayData => 
                    dayData.deliveries.map(delivery => (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery}
                        onDelete={deleteDelivery}
                      />
                    ))
                  )
              }
            </div>
          )}
        </div>

        {/* Store Form Modal */}
        {showStoreForm && (
          <StoreForm
            onSubmit={addDelivery}
            onAddStore={addStore}
            stores={stores}
            onClose={() => setShowStoreForm(false)}
          />
        )}

          {/* Data Manager Modal */}
          {showDataManager && (
            <DataManager
              onClose={() => setShowDataManager(false)}
              onDataChange={() => window.location.reload()}
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
          />

          {/* Floating Install Button */}
          <FloatingInstallButton />
    </div>
  );
}

export default App;
