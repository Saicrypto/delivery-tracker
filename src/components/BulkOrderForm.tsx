import React, { useState } from 'react';
import { Store, Delivery } from '../types';
import { X, Plus, Trash2, FileText, Edit3 } from 'lucide-react';

interface BulkOrderFormProps {
  onSubmit: (deliveries: Omit<Delivery, 'id'>[]) => void;
  onAddStore: (store: Omit<Store, 'id'>) => Promise<Store>;
  onDeleteStore: (storeId: string) => Promise<void>;
  stores: Store[];
  onClose: () => void;
}

interface OrderData {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  itemDetails: string;
  orderNumber: string;
  deliveryStatus: 'pending pickup' | 'picked up' | 'delivered';
  orderPrice: number;
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

type ExtractedData = {
  name?: string;
  phone?: string;
  address?: string;
  items?: string[];
};

export const BulkOrderForm: React.FC<BulkOrderFormProps> = ({
  onSubmit,
  onAddStore,
  onDeleteStore,
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

  // Bulk orders
  const [orders, setOrders] = useState<OrderData[]>([
    {
      id: '1',
      customerName: '',
      phoneNumber: '',
      address: '',
      itemDetails: '',
      orderNumber: '',
      deliveryStatus: 'pending pickup',
      orderPrice: 0
    }
  ]);

  // Text parsing
  const [rawText, setRawText] = useState('');

  // Delete store handler
  const handleDeleteStore = async (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${store.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await onDeleteStore(storeId);
      if (selectedStoreId === storeId) {
        setSelectedStoreId('');
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
      alert('Failed to delete store. Please try again.');
    }
  };

  // Extract details using improved parsing logic
  const extractDetails = (input: string): ExtractedData => {
    const phoneRegex = /(\+91[-\s]?)?[0]?(91)?[6-9]\d{9}/g;
    const itemRegex = /\d+\s?(kg|litre|pack|bottle|dozen|x)?\s?[a-zA-Z ]+/gi;

    const phones = input.match(phoneRegex) || [];
    const items = input.match(itemRegex) || [];

    const lines = input.split(/\n|,/).map(l => l.trim()).filter(Boolean);

    // Pick name = first line without digits/keywords
    const name = lines.find(l =>
      !/\d/.test(l) &&
      !/(road|street|colony|apartment|flat|near|pincode)/i.test(l)
    );

    // Pick address = line with typical address words
    const address = lines.find(l =>
      /(road|street|colony|apartment|flat|near|pincode)/i.test(l)
    );

    return {
      name,
      phone: phones[0],
      address,
      items
    };
  };

  // Convert extracted data to ParsedData format
  const parseCustomerData = (text: string): ParsedData => {
    const extracted = extractDetails(text);

    // Extract order number separately
    const orderMatch = text.match(/(?:order|ord|#)\s*:?\s*([a-zA-Z0-9]+)/i);
    const orderNumber = orderMatch ? orderMatch[1] : '';

    // Extract price separately
    const priceMatch = text.match(/₹\s*(\d+(?:\.\d{2})?)|rs\s*(\d+(?:\.\d{2})?)|price\s*:?\s*(\d+(?:\.\d{2})?)/i);
    const orderPrice = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3] || '0') : 0;

    return {
      customerName: extracted.name || '',
      phoneNumber: extracted.phone ? extracted.phone.replace(/\D/g, '') : '',
      address: extracted.address || '',
      itemDetails: extracted.items ? extracted.items.join(', ') : '',
      orderNumber,
      deliveryStatus: 'pending pickup',
      orderPrice
    };
  };

  const handleParseText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length === 0) return;

    const newOrders: OrderData[] = [];
    let currentOrder: Partial<OrderData> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseCustomerData(line);

      // If we have a complete order (name and phone), save it
      if (parsed.customerName && parsed.phoneNumber) {
        if (Object.keys(currentOrder).length > 0) {
          newOrders.push({
            id: Date.now().toString() + Math.random(),
            customerName: currentOrder.customerName || '',
            phoneNumber: currentOrder.phoneNumber || '',
            address: currentOrder.address || '',
            itemDetails: currentOrder.itemDetails || '',
            orderNumber: currentOrder.orderNumber || '',
            deliveryStatus: currentOrder.deliveryStatus || 'pending pickup',
            orderPrice: currentOrder.orderPrice || 0
          });
        }

        currentOrder = parsed;
      } else {
        // Continue building current order
        if (parsed.customerName) currentOrder.customerName = parsed.customerName;
        if (parsed.phoneNumber) currentOrder.phoneNumber = parsed.phoneNumber;
        if (parsed.address) currentOrder.address = parsed.address;
        if (parsed.itemDetails) currentOrder.itemDetails = parsed.itemDetails;
        if (parsed.orderNumber) currentOrder.orderNumber = parsed.orderNumber;
        if (parsed.orderPrice) currentOrder.orderPrice = parsed.orderPrice;
      }
    }

    // Add the last order
    if (Object.keys(currentOrder).length > 0) {
      newOrders.push({
        id: Date.now().toString() + Math.random(),
        customerName: currentOrder.customerName || '',
        phoneNumber: currentOrder.phoneNumber || '',
        address: currentOrder.address || '',
        itemDetails: currentOrder.itemDetails || '',
        orderNumber: currentOrder.orderNumber || '',
        deliveryStatus: currentOrder.deliveryStatus || 'pending pickup',
        orderPrice: currentOrder.orderPrice || 0
      });
    }

    if (newOrders.length > 0) {
      // Auto-fill price from selected store if no price was parsed
      const selectedStore = stores.find(s => s.id === selectedStoreId);
      if (selectedStore?.pricePerOrder) {
        newOrders.forEach(order => {
          if (!order.orderPrice) {
            order.orderPrice = selectedStore.pricePerOrder || 0;
          }
        });
      }

      setOrders(newOrders);
      setActiveTab('form');
    }
  };

  // Auto-fill price when store is selected
  const handleStoreSelection = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (storeId) {
      const selectedStore = stores.find(s => s.id === storeId);
      if (selectedStore?.pricePerOrder) {
        setOrders(prev => prev.map(order => ({
          ...order,
          orderPrice: order.orderPrice || (selectedStore.pricePerOrder || 0)
        })));
      }
    }
  };

  const addOrder = () => {
    setOrders(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      customerName: '',
      phoneNumber: '',
      address: '',
      itemDetails: '',
      orderNumber: '',
      deliveryStatus: 'pending pickup',
      orderPrice: 0
    }]);
  };

  const removeOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const updateOrder = (orderId: string, field: keyof OrderData, value: any) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, [field]: value } : order
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoreId) {
      window.alert('Please select a store');
      return;
    }

    const validOrders = orders.filter(order =>
      order.customerName && order.phoneNumber
    );

    if (validOrders.length === 0) {
      window.alert('Please fill in at least one order with customer name and phone number');
      return;
    }

    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) return;

    const deliveries: Omit<Delivery, 'id'>[] = validOrders.map(order => ({
      storeId: store.id,
      storeName: store.name,
      date: new Date().toISOString().split('T')[0],
      customerName: order.customerName,
      phoneNumber: order.phoneNumber,
      address: order.address,
      itemDetails: order.itemDetails,
      orderNumber: order.orderNumber,
      deliveryStatus: order.deliveryStatus,
      orderPrice: order.orderPrice,
      totalDeliveries: 1,
      delivered: order.deliveryStatus === 'delivered' ? 1 : 0,
      pending: order.deliveryStatus === 'pending pickup' ? 1 : 0,
      bills: 1,
      paymentStatus: {
        total: order.orderPrice,
        paid: 0,
        pending: order.orderPrice,
        overdue: 0
      },
      notes: `Customer: ${order.customerName}\nPhone: ${order.phoneNumber}\nAddress: ${order.address}\nItems: ${order.itemDetails}\nOrder: ${order.orderNumber}\nPrice: ₹${order.orderPrice}`.trim()
    }));

    onSubmit(deliveries);
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
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Multiple Orders</h2>
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* Store Selection */}
          <div className="mb-6">
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
                    {store.name} {store.pricePerOrder ? `(₹${store.pricePerOrder})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewStoreForm(true)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                title="Add New Store"
              >
                <Plus className="h-5 w-5" />
              </button>
              {selectedStoreId && (
                <button
                  type="button"
                  onClick={() => handleDeleteStore(selectedStoreId)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  title="Delete Selected Store"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* New Store Form */}
          {showNewStoreForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Add New Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
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
            <div className="mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Multiple Customer Data
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Paste multiple customer information here, one per line. For example:
John Doe
+91 9876543210
123 Main Street, City
Order: ORD-001
2x Pizza, 1x Coke - ₹450

Jane Smith
+91 8765432109
456 Oak Avenue
Order: ORD-002
₹300`}
                />
              </div>
              <button
                type="button"
                onClick={handleParseText}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mt-3"
              >
                Parse & Fill Form
              </button>
            </div>
          )}

          {/* Bulk Orders Form */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Orders ({orders.length})
              </h3>
              <button
                type="button"
                onClick={addOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Order</span>
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.map((order, index) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Order {index + 1}</h4>
                    {orders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrder(order.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={order.customerName}
                        onChange={(e) => updateOrder(order.id, 'customerName', e.target.value)}
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
                        value={order.phoneNumber}
                        onChange={(e) => updateOrder(order.id, 'phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      value={order.address}
                      onChange={(e) => updateOrder(order.id, 'address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number
                      </label>
                      <input
                        type="text"
                        value={order.orderNumber}
                        onChange={(e) => updateOrder(order.id, 'orderNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Details
                      </label>
                      <input
                        type="text"
                        value={order.itemDetails}
                        onChange={(e) => updateOrder(order.id, 'itemDetails', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2x Pizza, 1x Coke"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Status
                      </label>
                      <select
                        value={order.deliveryStatus}
                        onChange={(e) => updateOrder(order.id, 'deliveryStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending pickup">Pending Pickup</option>
                        <option value="picked up">Picked Up</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={order.orderPrice}
                        onChange={(e) => updateOrder(order.id, 'orderPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add {orders.length} Order{orders.length !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
