import React, { useState } from 'react';
import { DatabaseService } from '../services/database';
import { X, Database, Eye, RefreshCw } from 'lucide-react';

interface DatabaseInspectorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DatabaseInspector: React.FC<DatabaseInspectorProps> = ({ isVisible, onClose }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const storesData = await DatabaseService.getStores();
      const deliveriesData = await DatabaseService.getDeliveries();
      
      setStores(storesData);
      setDeliveries(deliveriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // const runCustomQuery = async (query: string) => {
  //   setIsLoading(true);
  //   setError('');
  //   
  //   try {
  //     // This would need to be implemented in DatabaseService
  //     console.log('Custom query:', query);
  //     setError('Custom queries not implemented yet');
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Query failed');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Database Inspector</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {/* Controls */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stores Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Stores ({stores.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {stores.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No stores found</p>
                ) : (
                  <div className="space-y-2">
                    {stores.map((store, index) => (
                      <div key={store.id} className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">{store.name}</div>
                        {store.address && (
                          <div className="text-sm text-gray-600">📍 {store.address}</div>
                        )}
                        {store.contact && (
                          <div className="text-sm text-gray-600">📞 {store.contact}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">ID: {store.id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deliveries Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Deliveries ({deliveries.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {deliveries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No deliveries found</p>
                ) : (
                  <div className="space-y-2">
                    {deliveries.slice(0, 10).map((delivery, index) => (
                      <div key={delivery.id} className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">{delivery.storeName}</div>
                        <div className="text-sm text-gray-600">📅 {delivery.date}</div>
                        <div className="text-sm text-gray-600">
                          📦 {delivery.delivered}/{delivery.totalDeliveries} delivered
                        </div>
                        <div className="text-sm text-gray-600">
                          💰 ₹{delivery.paymentStatus.total} total
                        </div>
                        <div className="text-xs text-gray-400 mt-1">ID: {delivery.id}</div>
                      </div>
                    ))}
                    {deliveries.length > 10 && (
                      <div className="text-center text-gray-500 py-2">
                        ... and {deliveries.length - 10} more deliveries
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Database Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>URL:</strong> libsql://delivery-update-saicrypto.aws-ap-south-1.turso.io</div>
              <div><strong>Total Stores:</strong> {stores.length}</div>
              <div><strong>Total Deliveries:</strong> {deliveries.length}</div>
              <div><strong>Last Updated:</strong> {new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
