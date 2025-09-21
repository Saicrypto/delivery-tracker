import React, { useState } from 'react';
import { Delivery, DeliveryStatus } from '../types';
import { Store, IndianRupee, ChevronDown, ChevronUp, Edit, Package, Truck, CheckCircle } from 'lucide-react';

interface GroupedDeliveriesProps {
  deliveries: Delivery[];
  onEdit?: (delivery: Delivery) => void;
  onStatusChange?: (deliveryId: string, newStatus: DeliveryStatus) => void;
}

interface StoreGroup {
  storeName: string;
  deliveries: Delivery[];
  totalAmount: number;
}

export const GroupedDeliveries: React.FC<GroupedDeliveriesProps> = ({
  deliveries,
  onEdit,
  onStatusChange
}) => {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  // Helper function to get status icon and color
  const getStatusDisplay = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending pickup':
        return { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100', text: 'Pending' };
      case 'picked up':
        return { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100', text: 'Picked Up' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Delivered' };
      default:
        return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  // Group deliveries by store name
  const storeGroups: StoreGroup[] = React.useMemo(() => {
    const groups = deliveries.reduce((acc, delivery) => {
      const storeName = delivery.storeName;
      if (!acc[storeName]) {
        acc[storeName] = {
          storeName,
          deliveries: [],
          totalAmount: 0
        };
      }
      acc[storeName].deliveries.push(delivery);
      acc[storeName].totalAmount += delivery.orderPrice || 0;
      return acc;
    }, {} as Record<string, StoreGroup>);

    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [deliveries]);

  const toggleStore = (storeName: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeName)) {
      newExpanded.delete(storeName);
    } else {
      newExpanded.add(storeName);
    }
    setExpandedStores(newExpanded);
  };

  if (storeGroups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Store className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
        <p className="text-gray-600">Get started by adding your first delivery record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {storeGroups.map((group) => {
        const isExpanded = expandedStores.has(group.storeName);
        const hasMultipleOrders = group.deliveries.length > 1;

        return (
          <div key={group.storeName} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Store Header */}
            <div 
              className={`flex items-center justify-between p-4 ${hasMultipleOrders ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
              onClick={() => hasMultipleOrders && toggleStore(group.storeName)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{group.storeName}</h3>
                  <p className="text-xs text-gray-500">
                    {group.deliveries.length} order{group.deliveries.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    ₹{group.totalAmount.toFixed(0)}
                  </span>
                </div>
                
                {/* Status summary for single orders */}
                {!hasMultipleOrders && (
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const statusDisplay = getStatusDisplay(group.deliveries[0].deliveryStatus);
                      const StatusIcon = statusDisplay.icon;
                      return (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${statusDisplay.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${statusDisplay.color}`} />
                          <span className={statusDisplay.color}>{statusDisplay.text}</span>
                        </div>
                      );
                    })()}
                    
                    {onStatusChange && (
                      <select
                        value={group.deliveries[0].deliveryStatus}
                        onChange={(e) => onStatusChange(group.deliveries[0].id, e.target.value as DeliveryStatus)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending pickup">Pending Pickup</option>
                        <option value="picked up">Picked Up</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    )}
                  </div>
                )}

                {hasMultipleOrders && (
                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                )}

                {/* Single order actions */}
                {!hasMultipleOrders && onEdit && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEdit(group.deliveries[0])}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Multiple Orders (Expanded) */}
            {hasMultipleOrders && isExpanded && (
              <div className="border-t border-gray-100">
                {group.deliveries.map((delivery, index) => (
                  <div key={delivery.id} className="flex items-center justify-between p-4 pl-12 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="text-xs text-gray-400 font-mono">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="h-3 w-3 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            ₹{delivery.paymentStatus.total.toFixed(0)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(delivery.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Customer Info */}
                      <div className="flex items-center space-x-2">
                        {delivery.customerName && (
                          <div className="max-w-xs">
                            <p className="text-xs text-gray-600 truncate" title={`Customer: ${delivery.customerName}`}>
                              {delivery.customerName}
                            </p>
                          </div>
                        )}
                        {delivery.orderNumber && (
                          <div className="text-xs text-gray-500 font-mono">
                            #{delivery.orderNumber}
                          </div>
                        )}
                      </div>
                      
                      {/* Status for multiple orders */}
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const statusDisplay = getStatusDisplay(delivery.deliveryStatus);
                          const StatusIcon = statusDisplay.icon;
                          return (
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${statusDisplay.bg}`}>
                              <StatusIcon className={`h-3 w-3 ${statusDisplay.color}`} />
                              <span className={statusDisplay.color}>{statusDisplay.text}</span>
                            </div>
                          );
                        })()}
                        
                        {onStatusChange && (
                          <select
                            value={delivery.deliveryStatus}
                            onChange={(e) => onStatusChange(delivery.id, e.target.value as DeliveryStatus)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending pickup">Pending Pickup</option>
                            <option value="picked up">Picked Up</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        )}
                      </div>

                      {onEdit && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onEdit(delivery)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single order customer details */}
            {!hasMultipleOrders && (group.deliveries[0].customerName || group.deliveries[0].itemDetails || group.deliveries[0].address) && (
              <div className="border-t border-gray-100 px-4 pb-3 pt-2 pl-8">
                {group.deliveries[0].customerName && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Customer:</span> {group.deliveries[0].customerName}
                  </p>
                )}
                {group.deliveries[0].itemDetails && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Items:</span> {group.deliveries[0].itemDetails}
                  </p>
                )}
                {group.deliveries[0].address && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Address:</span> {group.deliveries[0].address}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
