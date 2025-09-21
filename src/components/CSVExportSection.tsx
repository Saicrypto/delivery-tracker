import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { DailyData, Delivery } from '../types';
import { format, parseISO } from 'date-fns';

interface CSVExportSectionProps {
  dailyData: DailyData[];
}

export const CSVExportSection: React.FC<CSVExportSectionProps> = ({ dailyData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = () => {
    setIsExporting(true);
    try {
      // Filter data by date range if provided
      let filteredData = dailyData;
      
      if (startDate || endDate) {
        filteredData = dailyData.filter(day => {
          const dayDate = new Date(day.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date('2100-12-31');
          
          return dayDate >= start && dayDate <= end;
        });
      }

      // Flatten all deliveries from filtered data
      const allDeliveries: Delivery[] = filteredData.flatMap((day: DailyData) => day.deliveries || []);

      if (allDeliveries.length === 0) {
        alert('No delivery data found for the selected date range');
        setIsExporting(false);
        return;
      }

      // Create CSV headers (excluding itemDetails as requested)
      const headers = [
        'Date',
        'Store Name',
        'Customer Name',
        'Phone Number',
        'Address',
        'Order Number',
        'Order Price',
        'Delivery Status',
        'Total Deliveries',
        'Delivered',
        'Pending',
        'Bills',
        'Total Amount',
        'Paid Amount',
        'Pending Amount',
        'Overdue Amount'
      ];

      // Create CSV rows
      const rows = allDeliveries.map(delivery => [
        delivery.date,
        delivery.storeName,
        delivery.customerName,
        delivery.phoneNumber,
        delivery.address,
        delivery.orderNumber,
        delivery.orderPrice,
        delivery.deliveryStatus,
        delivery.totalDeliveries,
        delivery.delivered,
        delivery.pending,
        delivery.bills,
        delivery.paymentStatus.total,
        delivery.paymentStatus.paid,
        delivery.paymentStatus.pending,
        delivery.paymentStatus.overdue
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with date range
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : startDate 
        ? `from_${startDate}`
        : endDate
        ? `until_${endDate}`
        : format(new Date(), 'yyyy-MM-dd');
      
      a.download = `delivery-data-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ CSV exported successfully with ${allDeliveries.length} deliveries`);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Download className="h-5 w-5 mr-2 text-blue-600" />
          Export Delivery Data
        </h2>
      </div>

      <div className="space-y-4">
        {/* Date Filter Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range Filter (Optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Export Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startDate || endDate ? (
              <span>
                Export data from {startDate || 'beginning'} to {endDate || 'present'}
              </span>
            ) : (
              <span>Export all delivery data</span>
            )}
          </div>
          
          <button
            onClick={exportCSV}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
          <p className="font-medium text-blue-800 mb-1">Export includes:</p>
          <p>Date, Store, Customer, Phone, Address, Order Number, Price, Status, and Payment details</p>
          <p className="mt-1"><strong>Note:</strong> Item details are excluded as requested</p>
        </div>
      </div>
    </div>
  );
};
