import React from 'react';
import { Delivery } from '../types';
import { Store, IndianRupee, Edit, Trash2 } from 'lucide-react';

interface DeliveryCardProps {
  delivery: Delivery;
  onEdit?: (delivery: Delivery) => void;
  onDelete?: (deliveryId: string) => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {/* Store Info */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Store className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{delivery.storeName}</h3>
            <p className="text-xs text-gray-500">
              {new Date(delivery.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <IndianRupee className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">
              ₹{delivery.paymentStatus.total.toFixed(0)}
            </span>
          </div>

          {/* Notes (if any) */}
          {delivery.notes && (
            <div className="max-w-xs">
              <p className="text-xs text-gray-600 truncate" title={delivery.notes}>
                {delivery.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-1">
            {onEdit && (
              <button
                onClick={() => onEdit(delivery)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(delivery.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
