import React, { useState } from 'react';
import { Store, Delivery } from '../types';
import { X, Plus, FileText, Edit3 } from 'lucide-react';

interface StoreFormProps {
  onSubmit: (delivery: Omit<Delivery, 'id'>) => void;
  onAddStore: (store: Omit<Store, 'id'>) => Promise<Store>;
  stores: Store[];
  onClose: () => void;
}

interface ParsedData {
  customerName: string;
  phoneNumber: string;
  address: string;
  itemDetails: string;
  orderNumber: string;
  deliveryStatus: 'pending pickup' | 'picked up' | 'delivered';
  orderPrice: number;
}

export const StoreForm: React.FC<StoreFormProps> = ({
  onSubmit,
  onAddStore,
  stores,
  onClose
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'text'>('form');
  
  // New store form
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreContact, setNewStoreContact] = useState('');
  const [newStorePricePerOrder, setNewStorePricePerOrder] = useState<number>(0);
  
  // Simplified delivery form
  const [formData, setFormData] = useState<ParsedData>({
    customerName: '',
    phoneNumber: '',
    address: '',
    itemDetails: '',
    orderNumber: '',
    deliveryStatus: 'pending pickup',
    orderPrice: 0
  });

  // Text parsing
  const [rawText, setRawText] = useState('');

  // Smart text parser
  const parseCustomerData = (text: string): ParsedData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const result: ParsedData = {
      customerName: '',
      phoneNumber: '',
      address: '',
      itemDetails: '',
      orderNumber: '',
      deliveryStatus: 'pending pickup',
      orderPrice: 0
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Phone number patterns
      if (/(\+?[\d\s\-()]{8,15})/.test(line) && !result.phoneNumber) {
        const match = line.match(/(\+?[\d\s\-()]{8,15})/);
        if (match) result.phoneNumber = match[1].replace(/\D/g, '');
      }
      
      // Order number patterns
      else if (/(?:order|ord|#)\s*:?\s*([a-zA-Z0-9]+)/i.test(line) && !result.orderNumber) {
        const match = line.match(/(?:order|ord|#)\s*:?\s*([a-zA-Z0-9]+)/i);
        if (match) result.orderNumber = match[1];
      }
      
      // Address patterns (longer lines with address keywords)
      else if ((/address|addr|location|delivery/i.test(lowerLine) || line.length > 20) && !result.address && !/phone|order|name|item/i.test(lowerLine)) {
        result.address = line.replace(/address\s*:?\s*/i, '').trim();
      }
      
      // Item details (contains product/item keywords or has quantity/price indicators)
      else if ((/item|product|qty|quantity|price|₹|rs/i.test(lowerLine) || /\d+\s*x\s*/i.test(line)) && !result.itemDetails) {
        result.itemDetails = line.replace(/items?\s*:?\s*/i, '').trim();
        
        // Try to extract price from item details
        const priceMatch = line.match(/₹\s*(\d+(?:\.\d{2})?)|rs\s*(\d+(?:\.\d{2})?)|price\s*:?\s*(\d+(?:\.\d{2})?)/i);
        if (priceMatch && !result.orderPrice) {
          result.orderPrice = parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3] || '0');
        }
      }
      
      // Customer name (first non-matched line or contains name keywords)
      else if ((/name|customer/i.test(lowerLine) || (!result.customerName && line.length < 50 && !/\d/.test(line))) && !result.customerName) {
        result.customerName = line.replace(/(?:customer\s*)?name\s*:?\s*/i, '').trim();
      }
    }

    // Fallback: if name is empty, use first line
    if (!result.customerName && lines.length > 0) {
      result.customerName = lines[0];
    }

    return result;
  };

  const handleParseText = () => {
    if (rawText.trim()) {
      const parsed = parseCustomerData(rawText);
      // Auto-fill price from selected store if no price was parsed
      if (!parsed.orderPrice && selectedStoreId) {
        const selectedStore = stores.find(s => s.id === selectedStoreId);
        if (selectedStore?.pricePerOrder) {
          parsed.orderPrice = selectedStore.pricePerOrder;
        }
      }
      setFormData(parsed);
      setActiveTab('form');
    }
  };

  // Auto-fill price when store is selected
  const handleStoreSelection = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (storeId && formData.orderPrice === 0) {
      const selectedStore = stores.find(s => s.id === storeId);
      if (selectedStore?.pricePerOrder) {
        setFormData(prev => ({ ...prev, orderPrice: selectedStore.pricePerOrder || 0 }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId) {
      window.alert('Please select a store');
      return;
    }

    if (!formData.customerName || !formData.phoneNumber) {
      window.alert('Please fill in customer name and phone number');
      return;
    }

    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) return;

    const delivery: Omit<Delivery, 'id'> = {
      storeId: store.id,
      storeName: store.name,
      date: new Date().toISOString().split('T')[0],
      // New simplified fields
      customerName: formData.customerName,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      itemDetails: formData.itemDetails,
      orderNumber: formData.orderNumber,
      deliveryStatus: formData.deliveryStatus,
      orderPrice: formData.orderPrice,
      // Legacy fields for backward compatibility (set defaults)
      totalDeliveries: 1,
      delivered: formData.deliveryStatus === 'delivered' ? 1 : 0,
      pending: formData.deliveryStatus === 'pending pickup' ? 1 : 0,
      bills: 1,
      paymentStatus: {
        total: formData.orderPrice,
        paid: 0,
        pending: formData.orderPrice,
        overdue: 0
      },
      notes: `Customer: ${formData.customerName}\nPhone: ${formData.phoneNumber}\nAddress: ${formData.address}\nItems: ${formData.itemDetails}\nOrder: ${formData.orderNumber}\nPrice: ₹${formData.orderPrice}`.trim()
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
      contact: newStoreContact.trim() || undefined,
      pricePerOrder: newStorePricePerOrder || undefined
    });

    setSelectedStoreId(newStore.id);
    setShowNewStoreForm(false);
    setNewStoreName('');
    setNewStoreAddress('');
    setNewStoreContact('');
    setNewStorePricePerOrder(0);
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="h-4 w-4 inline mr-2" />
              Manual Form
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Paste & Parse
            </button>
          </nav>
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
                onChange={(e) => handleStoreSelection(e.target.value)}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <input
                  type="number"
                  placeholder="Price per Order (₹)"
                  min="0"
                  step="0.01"
                  value={newStorePricePerOrder}
                  onChange={(e) => setNewStorePricePerOrder(parseFloat(e.target.value) || 0)}
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

          {/* Text Parser Tab */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Customer Data
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Paste customer information here. For example:
John Doe
+91 9876543210
123 Main Street, City
Order: ORD-001
2x Pizza, 1x Coke - ₹450`}
                />
              </div>
              <button
                type="button"
                onClick={handleParseText}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Parse & Fill Form
              </button>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Customer name (first line or with "Name:" prefix)</li>
                  <li>Phone number (any line with 8-15 digits)</li>
                  <li>Address (line with "address" or longer text)</li>
                  <li>Order number (with "Order:", "Ord:" or "#" prefix)</li>
                  <li>Items (with quantities, prices, or "item" keyword)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Manual Form Tab */}
          {activeTab === 'form' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Details
                  </label>
                  <input
                    type="text"
                    value={formData.itemDetails}
                    onChange={(e) => setFormData({ ...formData, itemDetails: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2x Pizza, 1x Coke"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Status *
                  </label>
                  <select
                    value={formData.deliveryStatus}
                    onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending pickup">Pending Pickup</option>
                    <option value="picked up">Picked Up</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.orderPrice}
                    onChange={(e) => setFormData({ ...formData, orderPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

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