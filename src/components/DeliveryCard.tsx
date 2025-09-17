import React from 'react';
import { Delivery } from '../types';
import { Package, CheckCircle, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';

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
  const completionRate = delivery.totalDeliveries > 0 
    ? Math.round((delivery.delivered / delivery.totalDeliveries) * 100)
    : 0;

  const paymentRate = delivery.paymentStatus.total > 0
    ? Math.round((delivery.paymentStatus.paid / delivery.paymentStatus.total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{delivery.storeName}</h3>
          <p className="text-sm text-gray-600">
            {new Date(delivery.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(delivery)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(delivery.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delivery Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Deliveries</p>
            <p className="text-xl font-semibold text-gray-900">{delivery.totalDeliveries}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-xl font-semibold text-green-700">{delivery.delivered}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-semibold text-orange-700">{delivery.pending}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Bills</p>
            <p className="text-xl font-semibold text-purple-700">{delivery.bills}</p>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Delivery Progress</span>
            <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Payment Progress</span>
            <span className="text-sm font-medium text-gray-900">{paymentRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${paymentRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Status</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Total:</span>
            <span className="ml-2 font-medium">₹{delivery.paymentStatus.total.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Paid:</span>
            <span className="ml-2 font-medium text-green-700">₹{delivery.paymentStatus.paid.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Pending:</span>
            <span className="ml-2 font-medium text-orange-700">₹{delivery.paymentStatus.pending.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Overdue:</span>
            <span className="ml-2 font-medium text-red-700">₹{delivery.paymentStatus.overdue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {delivery.notes && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">{delivery.notes}</p>
        </div>
      )}
    </div>
  );
};
