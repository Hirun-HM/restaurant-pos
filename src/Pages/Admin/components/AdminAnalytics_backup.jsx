import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaDownload, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { MdMonetizationOn, MdTrendingUp, MdRestaurant } from 'react-icons/md';
import AnimatedNumber from '../../../components/AnimatedNumber';

function AdminAnalytics({ bills = {}, menuItems = [] }) {
    const [analytics, setAnalytics] = useState(null);
    const [dateRange, setDateRange] = useState('today');

    // Calculate analytics based on date range
    const calculateAnalytics = useCallback(() => {
        const now = new Date();
        const closedBills = Object.values(bills).filter(bill => bill.status === 'closed');
        
        // Filter bills based on date range
        let filteredBills = closedBills;
        if (dateRange === 'today') {
            const today = now.toDateString();
            filteredBills = closedBills.filter(bill => 
                new Date(bill.closedAt || bill.createdAt).toDateString() === today
            );
        } else if (dateRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredBills = closedBills.filter(bill => 
                new Date(bill.closedAt || bill.createdAt) >= weekAgo
            );
        } else if (dateRange === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredBills = closedBills.filter(bill => 
                new Date(bill.closedAt || bill.createdAt) >= monthAgo
            );
        }

        // Calculate revenue
        const totalRevenue = filteredBills.reduce((sum, bill) => {
            const serviceCharge = bill.serviceCharge ? bill.total * 0.1 : 0;
            return sum + bill.total + serviceCharge;
        }, 0);

        // Calculate average order value
        const avgOrderValue = filteredBills.length > 0 ? totalRevenue / filteredBills.length : 0;

        // Top selling items
        const itemSales = {};
        filteredBills.forEach(bill => {
            bill.items.forEach(item => {
                const key = item.name;
                if (!itemSales[key]) {
                    itemSales[key] = { name: item.name, quantity: 0, revenue: 0 };
                }
                itemSales[key].quantity += item.quantity;
                itemSales[key].revenue += item.price * item.quantity;
            });
        });

        const topItems = Object.values(itemSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Revenue by hour (for today)
        const revenueByHour = Array.from({ length: 24 }, (_, hour) => {
            const hourRevenue = filteredBills
                .filter(bill => {
                    const billHour = new Date(bill.closedAt || bill.createdAt).getHours();
                    return billHour === hour;
                })
                .reduce((sum, bill) => {
                    const serviceCharge = bill.serviceCharge ? bill.total * 0.1 : 0;
                    return sum + bill.total + serviceCharge;
                }, 0);
            
            return { hour, revenue: hourRevenue };
        });

        // Revenue by day (for week/month)
        const revenueByDay = [];
        if (dateRange === 'week') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayRevenue = filteredBills
                    .filter(bill => 
                        new Date(bill.closedAt || bill.createdAt).toDateString() === date.toDateString()
                    )
                    .reduce((sum, bill) => {
                        const serviceCharge = bill.serviceCharge ? bill.total * 0.1 : 0;
                        return sum + bill.total + serviceCharge;
                    }, 0);
                
                revenueByDay.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    revenue: dayRevenue
                });
            }
        }

        // Category breakdown
        const categoryRevenue = {};
        filteredBills.forEach(bill => {
            bill.items.forEach(item => {
                const menuItem = menuItems.find(mi => mi.name === item.name);
                const category = menuItem ? menuItem.category : 'Other';
                if (!categoryRevenue[category]) {
                    categoryRevenue[category] = 0;
                }
                categoryRevenue[category] += item.price * item.quantity;
            });
        });

        const categoryBreakdown = Object.entries(categoryRevenue)
            .map(([category, revenue]) => ({
                category,
                revenue,
                percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue);

        setAnalytics({
            revenue: { total: totalRevenue, trend: 0 },
            orders: { total: filteredBills.length, trend: 0 },
            avgOrderValue: { value: avgOrderValue, trend: 0 },
            topItems,
            revenueByHour,
            revenueByDay,
            categoryBreakdown
        });
    }, [bills, menuItems, dateRange]);

    useEffect(() => {
        calculateAnalytics();
    }, [calculateAnalytics]);

    // Memoized key metrics configuration
    const keyMetrics = useMemo(() => [
        {
            id: 'revenue',
            title: 'Total Revenue',
            value: analytics?.revenue.total || 0,
            isNumber: true,
            prefix: 'LKR ',
            icon: <MdMonetizationOn className="h-8 w-8 text-green-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 0
        },
        {
            id: 'orders',
            title: 'Total Orders',
            value: analytics?.orders.total || 0,
            isNumber: true,
            icon: <FaShoppingCart className="h-8 w-8 text-blue-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 100
        },
        {
            id: 'avgOrder',
            title: 'Avg Order Value',
            value: analytics?.avgOrderValue.value || 0,
            isNumber: true,
            prefix: 'LKR ',
            icon: <MdTrendingUp className="h-8 w-8 text-purple-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 200
        }
    ], [analytics]);

    // Memoized date range options
    const dateRangeOptions = useMemo(() => [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'all', label: 'All Time' }
    ], []);

    // Handle date range change
    const handleDateRangeChange = useCallback((e) => {
        setDateRange(e.target.value);
    }, []);

    // Render key metric card
    const renderMetricCard = useCallback(({ title, value, isNumber, prefix, icon, className, delay }) => (
        <div className={className}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
                    <p className="text-2xl font-bold text-other1 mt-2">
                        {isNumber ? (
                            <AnimatedNumber 
                                value={value} 
                                prefix={prefix}
                                formatDecimals={title.includes('Avg') ? 2 : 0}
                                delay={delay}
                            />
                        ) : value}
                    </p>
                    <div className="flex items-center mt-2 text-green-600">
                        <MdTrendingUp className="h-4 w-4" />
                        <span className="text-sm ml-1">+0%</span>
                    </div>
                </div>
                {icon}
            </div>
        </div>
    ), []);

    // Chart components (simplified versions)
    const BarChart = ({ data, title, xKey, yKey, color = 'bg-blue-500' }) => {
        const maxValue = Math.max(...data.map(item => item[yKey]));
        
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-16 text-xs text-gray-600 text-right">
                                {item[xKey]}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                                <div
                                    className={`${color} h-4 rounded-full transition-all duration-500`}
                                    style={{ width: `${maxValue > 0 ? (item[yKey] / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="w-20 text-xs text-gray-600">
                                {typeof item[yKey] === 'number' ? 
                                    (yKey === 'revenue' ? `LKR ${item[yKey].toFixed(0)}` : item[yKey]) : 
                                    item[yKey]
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Memoized chart configurations
    const chartConfigs = useMemo(() => {
        if (!analytics) return [];
        
        const configs = [];
        
        // Revenue by Hour (for today)
        if (dateRange === 'today' && analytics.revenueByHour.length > 0) {
            configs.push({
                id: 'revenueByHour',
                data: analytics.revenueByHour.filter(item => item.revenue > 0),
                title: "Revenue by Hour",
                xKey: "hour",
                yKey: "revenue",
                color: "bg-blue-500"
            });
        }
        
        // Revenue by Day (for week)
        if (dateRange === 'week' && analytics.revenueByDay.length > 0) {
            configs.push({
                id: 'revenueByDay',
                data: analytics.revenueByDay,
                title: "Revenue by Day",
                xKey: "date",
                yKey: "revenue",
                color: "bg-green-500"
            });
        }

        return configs;
    }, [analytics, dateRange]);

    // Memoized top items charts
    const topItemsCharts = useMemo(() => {
        if (!analytics || !analytics.topItems.length) return [];
        
        return [
            {
                id: 'topItemsByQuantity',
                data: analytics.topItems,
                title: "Top Selling Items",
                xKey: "name",
                yKey: "quantity",
                color: "bg-orange-500"
            }
        ];
    }, [analytics]);

    if (!analytics) {
        return <div className="p-6 text-center">Loading analytics...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        {dateRangeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                        <FaDownload className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {keyMetrics.map(metric => (
                    <div key={metric.id}>
                        {renderMetricCard(metric)}
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartConfigs.map(config => (
                    <BarChart key={config.id} {...config} />
                ))}
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {topItemsCharts.map(config => (
                    <BarChart key={config.id} {...config} />
                ))}
            </div>

            {/* Performance Summary Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Performance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Percentage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analytics.categoryBreakdown.map((category, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-other1">
                                        {category.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        LKR {category.revenue.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {category.percentage.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminAnalytics;
