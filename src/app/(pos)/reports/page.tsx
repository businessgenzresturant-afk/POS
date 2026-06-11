import { useState, useEffect } from 'react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';

export default async function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch report data when date range changes
    const fetchReportData = async () => {
      if (!dateRange.start || !dateRange.end) return;
      
      setLoading(true);
      try {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        // Fetch bills for the date range
        const bills = await prisma.bill.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'paid'
          },
          include: {
            order: {
              include: {
                table: true,
                items: {
                  include: {
                    menuItem: true
                  }
                }
              }
            }
          }
        });
        
        // Calculate statistics
        const totalSales = bills.reduce((sum, bill) => sum + bill.finalAmount, 0);
        const totalTax = bills.reduce((sum, bill) => sum + bill.taxAmount, 0);
        const totalDiscount = bills.reduce((sum, bill) => sum + bill.discountAmount, 0);
        const totalBills = bills.length;
        
        // Group by payment method
        const paymentMethodStats = bills.reduce((acc, bill) => {
          const method = bill.paymentMethod || 'cash';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {});
        
        // Group by menu item popularity
        const itemPopularity: Record<string, { name: string; quantity: number; revenue: number }> = {};
        
        bills.forEach(bill => {
          bill.order.items.forEach((item: any) => {
            const itemId = item.menuItem.id;
            if (!itemPopularity[itemId]) {
              itemPopularity[itemId] = {
                name: item.menuItem.name,
                quantity: 0,
                revenue: 0
              };
            }
            itemPopularity[itemId].quantity += item.quantity;
            itemPopularity[itemId].revenue += (item.quantity * item.unitPrice);
          });
        });
        
        // Sort items by quantity sold
        const sortedItems = Object.values(itemPopularity)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10); // Top 10 items
        
        // Group by hour of day for sales trend
        const hourlySales: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
          hourlySales[i] = 0;
        }
        
        bills.forEach(bill => {
          const hour = new Date(bill.createdAt).getHours();
          hourlySales[hour] = (hourlySales[hour] || 0) + bill.finalAmount;
        });
        
        const hourlyData = Object.entries(hourlySales)
          .map(([hour, amount]) => ({
            hour: parseInt(hour),
            amount
          }))
          .sort((a, b) => a.hour - b.hour);
        
        setReportData({
          dateRange: {
            start: dateRange.start,
            end: dateRange.end
          },
          totals: {
            sales: totalSales,
            tax: totalTax,
            discount: totalDiscount,
            bills: totalBills
          },
          paymentMethods: paymentMethodStats,
          topItems: sortedItems,
          hourlySales: hourlyData
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange.start, dateRange.end]);

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zm8 0v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2h2a2 2 0 012 2z"></path></svg>
          </div>
          <p className="text-xl font-medium text-gray-600">
            Select a date range to view sales reports
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Reports show paid bills, sales totals, and popular menu items
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <p className="text-sm text-gray-500">
          View and analyze your restaurant's sales performance
        </p>
      </div>
      
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <Button 
              onClick={() => {
                // Trigger report refresh by updating state
                setDateRange(prev => prev);
              }}
              className="w-full bg-primary text-white"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-gray-500">Generating report...</p>
        </div>
      )}
      
      {/* Report Data */}
      {reportData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2">Total Sales</h3>
              <p className="text-2xl font-bold text-green-600">₹{reportData.totals.sales.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {reportData.totals.bills} bills
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2">Tax Collected</h3>
              <p className="text-2xl font-bold text-yellow-600">₹{reportData.totals.tax.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {((reportData.totals.tax / reportData.totals.sales) * 100).toFixed(1)}% of sales
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2">Discounts Given</h3>
              <p className="text-2xl font-bold text-red-600">-₹{reportData.totals.discount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {((reportData.totals.discount / reportData.totals.sales) * 100).toFixed(1)}% of sales
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-2">Average Bill Value</h3>
              <p className="text-2xl font-bold text-blue-600">₹{(reportData.totals.sales / Math.max(1, reportData.totals.bills)).toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Per bill
              </p>
            </div>
          </div>
          
          {/* Payment Methods Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            {Object.keys(reportData.paymentMethods).length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No payment data available
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(reportData.paymentMethods).map(([method, count]) => (
                  <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{method.toUpperCase()}</span>
                    </div>
                    <div className="text-right space-x-3">
                      <span className="font-medium">{count}</span>
                      <span className="text-xs text-gray-500">bills</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top Selling Items</h2>
            {reportData.topItems.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No sales data available
              </p>
            ) : (
              <div className="space-y-4">
                {reportData.topItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-start p-3 border-t border-gray-200">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">#{index + 1} {item.name}</span>
                        <span className="text-xs text-gray-500">{item.quantity} sold</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Revenue: ₹{item.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right space-x-3">
                      <span className="text-lg font-medium">₹{item.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Hourly Sales Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sales by Hour of Day</h2>
            {reportData.hourlySales.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No sales data available
              </p>
            ) : (
              <div className="space-y-4">
                {reportData.hourlySales.map((hourData) => (
                  <div key={hourData.hour} className="flex justify-between items-start p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">
                        {hourData.hour.toString().padStart(2, '0')}:00 - 
                        {(hourData.hour + 1).toString().padStart(2, '0')}:00
                      </span>
                    </div>
                    <div className="text-right space-x-3">
                      <span className="font-medium">₹{hourData.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
