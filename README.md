# Delivery Tracker Web App

A comprehensive web application for tracking daily deliveries, managing store data, monitoring payment status, and analyzing delivery performance with interactive charts.

## Features

### 📦 Delivery Management
- **Daily Delivery Tracking**: Record deliveries for each store with detailed metrics
- **Store Management**: Add and manage store information (name, address, contact)
- **Delivery Status**: Track total deliveries, completed, and pending items
- **Bill Tracking**: Monitor bill counts for each delivery session

### 💰 Payment Management
- **Payment Status Tracking**: Track total amounts, paid amounts, pending, and overdue payments
- **Payment Analytics**: Visual representation of payment collection rates
- **Outstanding Amount Monitoring**: Keep track of pending and overdue payments

### 📊 Analytics & Charts
- **Delivery Trends**: Line charts showing delivery patterns over time
- **Store Performance**: Bar charts comparing store performance
- **Payment Status**: Pie charts for payment distribution
- **Revenue Trends**: Track revenue patterns across time periods
- **Store Rankings**: Tabular view of top-performing stores

### 🗓️ Time Management
- **Daily View**: Focus on today's deliveries and performance
- **Weekly View**: Analyze week-to-date performance
- **Monthly View**: Review monthly trends and patterns
- **Automatic Date Sync**: Data automatically organizes by date
- **Historical Data**: Access past delivery records

### 💾 Data Persistence
- **Local Storage**: All data persists in browser's local storage
- **Auto-Save**: Changes are automatically saved
- **Data Export**: View and analyze historical data

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000` to access the application.

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## How to Use

### Adding Your First Delivery

1. **Click "Add Delivery"** button on the main dashboard
2. **Select or Add a Store**:
   - Choose from existing stores in the dropdown
   - Or click the "+" button to add a new store
3. **Enter Delivery Details**:
   - Total deliveries planned
   - Number delivered
   - Number pending
   - Bill count
4. **Add Payment Information**:
   - Total amount
   - Amount paid
   - Pending amount
   - Overdue amount
5. **Optional**: Add notes for additional context
6. **Submit** to save the delivery record

### Viewing Analytics

1. **Click "Show Analytics"** to display charts and graphs
2. **Switch View Modes**:
   - **Daily**: See today's performance
   - **Weekly**: View current week's data
   - **Monthly**: Analyze month-to-date trends
3. **Review Store Rankings**: See which stores perform best
4. **Monitor Payment Status**: Track collection rates

### Managing Data

- **Edit Deliveries**: Click the edit icon on delivery cards
- **Delete Records**: Use the trash icon to remove entries
- **View Historical Data**: Switch to weekly/monthly views
- **Track Progress**: Monitor completion and payment rates

## Key Metrics Tracked

### Delivery Metrics
- Total deliveries assigned
- Successfully completed deliveries
- Pending/incomplete deliveries
- Delivery completion rate

### Financial Metrics
- Total revenue generated
- Amount collected
- Outstanding payments
- Overdue amounts
- Payment collection rate

### Store Performance
- Individual store delivery volumes
- Store success rates
- Revenue per store
- Store rankings and comparisons

## Data Structure

### Stores
- Store ID and name
- Address and contact information
- Performance history

### Daily Deliveries
- Date and store association
- Delivery counts (total, completed, pending)
- Bill information
- Payment status breakdown
- Optional notes

### Analytics
- Historical trends
- Performance comparisons
- Payment tracking
- Success rate calculations

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts library
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Storage**: Browser LocalStorage
- **Build Tool**: Create React App

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Security

- All data is stored locally in your browser
- No data is sent to external servers
- Regular browser data backup recommended

## Tips for Best Results

1. **Consistent Daily Entry**: Enter data daily for accurate trends
2. **Accurate Payment Tracking**: Keep payment status updated
3. **Store Information**: Maintain complete store details
4. **Regular Review**: Use analytics to identify patterns
5. **Backup Data**: Export important data periodically

## Troubleshooting

### Data Not Saving
- Check browser localStorage is enabled
- Clear browser cache and try again

### Charts Not Loading
- Ensure all required data is entered
- Refresh the page

### Performance Issues
- Clear old data if storage becomes full
- Use latest browser version

## Future Enhancements

- Export data to CSV/Excel
- Print-friendly reports
- Email notifications for overdue payments
- Multi-user support
- Cloud data synchronization
- Mobile app version

## Support

For issues or questions, please check the browser console for error messages and ensure all required fields are properly filled when entering data.

---

**Version**: 1.0.0  
**Last Updated**: September 2025
