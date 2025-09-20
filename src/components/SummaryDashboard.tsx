import React, { useState } from 'react';
import { DailyData } from '../types';
import { Package, CheckCircle, Clock, DollarSign, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SummaryDashboardProps {
  data: DailyData[];
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  data,
  viewMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const aggregateData = React.useMemo(() => {
    return data.reduce((acc, dayData) => ({
      totalStores: acc.totalStores + dayData.summary.totalStores,
      totalDeliveries: acc.totalDeliveries + dayData.summary.totalDeliveries,
      totalDelivered: acc.totalDelivered + dayData.summary.totalDelivered,
      totalPending: acc.totalPending + dayData.summary.totalPending,
      totalBills: acc.totalBills + dayData.summary.totalBills,
      totalRevenue: acc.totalRevenue + dayData.summary.totalRevenue,
      totalPaid: acc.totalPaid + dayData.summary.totalPaid,
      totalOutstanding: acc.totalOutstanding + dayData.summary.totalOutstanding
    }), {
      totalStores: 0,
      totalDeliveries: 0,
      totalDelivered: 0,
      totalPending: 0,
      totalBills: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0
    });
  }, [data]);

  const deliveryRate = aggregateData.totalDeliveries > 0 
    ? Math.round((aggregateData.totalDelivered / aggregateData.totalDeliveries) * 100)
    : 0;

  const paymentRate = aggregateData.totalRevenue > 0
    ? Math.round((aggregateData.totalPaid / aggregateData.totalRevenue) * 100)
    : 0;

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return 'Summary';
    }
  };

  const stats = [
    {
      label: 'Total Stores',
      value: aggregateData.totalStores,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Deliveries',
      value: aggregateData.totalDeliveries,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Delivered',
      value: aggregateData.totalDelivered,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Pending',
      value: aggregateData.totalPending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      label: 'Bills Issued',
      value: aggregateData.totalBills,
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      label: 'Total Revenue',
      value: `₹${aggregateData.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Amount Paid',
      value: `₹${aggregateData.totalPaid.toFixed(2)}`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Outstanding',
      value: `₹${aggregateData.totalOutstanding.toFixed(2)}`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div 
        className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold text-gray-900">
          {getViewModeLabel()} Summary
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Delivery Rate: {deliveryRate}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Payment Rate: {paymentRate}%</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Delivery Progress</span>
                  <span className="text-sm text-gray-600">{deliveryRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{aggregateData.totalDelivered} delivered</span>
                  <span>{aggregateData.totalDeliveries} total</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Payment Collection Progress</span>
                  <span className="text-sm text-gray-600">{paymentRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹{aggregateData.totalPaid.toFixed(2)} collected</span>
                  <span>₹{aggregateData.totalRevenue.toFixed(2)} total</span>
                </div>
              </div>
            </div>

            {/* Additional Metrics for Weekly/Monthly Views */}
            {viewMode !== 'daily' && data.length > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h3>
                <div className="space-y-2">
                  {data.slice(0, 7).map((dayData, index) => (
                    <div key={dayData.date} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">
                        {new Date(dayData.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-gray-600">
                          {dayData.summary.totalDelivered}/{dayData.summary.totalDeliveries} delivered
                        </span>
                        <span className="text-gray-600">
                          ₹{dayData.summary.totalRevenue.toFixed(2)} revenue
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};