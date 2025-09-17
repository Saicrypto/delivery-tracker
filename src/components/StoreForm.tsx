import React, { useState } from 'react';
import { Store, Delivery } from '../types';
import { X, Plus } from 'lucide-react';

interface StoreFormProps {
  onSubmit: (delivery: Omit<Delivery, 'id'>) => void;
  onAddStore: (store: Omit<Store, 'id'>) => Promise<Store>;
  stores: Store[];
  onClose: () => void;
}

export const StoreForm: React.FC<StoreFormProps> = ({
  onSubmit,
  onAddStore,
  stores,
  onClose
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreContact, setNewStoreContact] = useState('');
  
  const [formData, setFormData] = useState({
    totalDeliveries: 0,
    delivered: 0,
    pending: 0,
    bills: 0,
    paymentTotal: 0,
    paymentPaid: 0,
    paymentPending: 0,
    paymentOverdue: 0,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId) {
      alert('Please select a store');
      return;
    }

    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) return;

    const delivery: Omit<Delivery, 'id'> = {
      storeId: store.id,
      storeName: store.name,
      date: new Date().toISOString().split('T')[0],
      totalDeliveries: formData.totalDeliveries,
      delivered: formData.delivered,
      pending: formData.pending,
      bills: formData.bills,
      paymentStatus: {
        total: formData.paymentTotal,
        paid: formData.paymentPaid,
        pending: formData.paymentPending,
        overdue: formData.paymentOverdue
      },
      notes: formData.notes
    };

    onSubmit(delivery);
    onClose();
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStoreName.trim()) {
      window.alert('Please enter store name');
      return;
    }

    const newStore = await onAddStore({
      name: newStoreName.trim(),
      address: newStoreAddress.trim() || undefined,
      contact: newStoreContact.trim() || undefined
    });

    setSelectedStoreId(newStore.id);
    setShowNewStoreForm(false);
    setNewStoreName('');
    setNewStoreAddress('');
    setNewStoreContact('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Delivery Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewStoreForm(true)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* New Store Form */}
          {showNewStoreForm && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">Add New Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Store Name *"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact"
                  value={newStoreContact}
                  onChange={(e) => setNewStoreContact(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                placeholder="Address"
                value={newStoreAddress}
                onChange={(e) => setNewStoreAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleAddStore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Store
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewStoreForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Deliveries
              </label>
              <input
                type="number"
                min="0"
                value={formData.totalDeliveries}
                onChange={(e) => setFormData({ ...formData, totalDeliveries: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivered
              </label>
              <input
                type="number"
                min="0"
                max={formData.totalDeliveries}
                value={formData.delivered}
                onChange={(e) => setFormData({ ...formData, delivered: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pending
              </label>
              <input
                type="number"
                min="0"
                value={formData.pending}
                onChange={(e) => setFormData({ ...formData, pending: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bills Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.bills}
              onChange={(e) => setFormData({ ...formData, bills: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentTotal}
                  onChange={(e) => setFormData({ ...formData, paymentTotal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={formData.paymentTotal}
                  value={formData.paymentPaid}
                  onChange={(e) => setFormData({ ...formData, paymentPaid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pending Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentPending}
                  onChange={(e) => setFormData({ ...formData, paymentPending: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overdue Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentOverdue}
                  onChange={(e) => setFormData({ ...formData, paymentOverdue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
