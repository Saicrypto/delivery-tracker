import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DailyData, ChartData } from '../types';

interface ChartsSectionProps {
  data: DailyData[];
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  data,
  viewMode
}) => {
  const chartData = useMemo((): ChartData[] => {
    return data.map(dayData => ({
      date: new Date(dayData.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      deliveries: dayData.summary.totalDeliveries,
      delivered: dayData.summary.totalDelivered,
      pending: dayData.summary.totalPending,
      revenue: dayData.summary.totalRevenue
    })).reverse(); // Reverse to show chronological order
  }, [data]);

  const storePerformanceData = useMemo(() => {
    const storeMap = new Map();
    
    data.forEach(dayData => {
      dayData.deliveries.forEach(delivery => {
        const existing = storeMap.get(delivery.storeName) || {
          storeName: delivery.storeName,
          totalDeliveries: 0,
          delivered: 0,
          pending: 0,
          revenue: 0
        };
        
        storeMap.set(delivery.storeName, {
          ...existing,
          totalDeliveries: existing.totalDeliveries + delivery.totalDeliveries,
          delivered: existing.delivered + delivery.delivered,
          pending: existing.pending + delivery.pending,
          revenue: existing.revenue + delivery.paymentStatus.total
        });
      });
    });
    
    return Array.from(storeMap.values()).sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }, [data]);

  const paymentStatusData = useMemo(() => {
    const totals = data.reduce((acc, dayData) => ({
      paid: acc.paid + dayData.summary.totalPaid,
      pending: acc.pending + (dayData.summary.totalRevenue - dayData.summary.totalPaid),
      overdue: acc.overdue + dayData.deliveries.reduce((sum, d) => sum + d.paymentStatus.overdue, 0)
    }), { paid: 0, pending: 0, overdue: 0 });

    return [
      { name: 'Paid', value: totals.paid, color: '#10B981' },
      { name: 'Pending', value: totals.pending, color: '#F59E0B' },
      { name: 'Overdue', value: totals.overdue, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [data]);


  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">No data available for charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delivery Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="deliveries" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Deliveries"
              />
              <Line 
                type="monotone" 
                dataKey="delivered" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Delivered"
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Pending"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storePerformanceData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="storeName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="delivered" fill="#10B981" name="Delivered" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Payment Summary */}
          <div className="mt-4 space-y-2">
            {paymentStatusData.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ₹{item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Ranking Table */}
      {storePerformanceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Rankings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storePerformanceData.slice(0, 10).map((store, index) => {
                  const successRate = store.totalDeliveries > 0 
                    ? Math.round((store.delivered / store.totalDeliveries) * 100)
                    : 0;
                  
                  return (
                    <tr key={store.storeName}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {store.storeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {store.totalDeliveries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {store.delivered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          successRate >= 90 ? 'bg-green-100 text-green-800' :
                          successRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{store.revenue.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
