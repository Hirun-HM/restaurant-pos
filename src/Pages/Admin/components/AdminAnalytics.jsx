import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaDownload, FaShoppingCart } from 'react-icons/fa';
import { MdTrendingUp, MdMonetizationOn, MdWarning } from 'react-icons/md';
import AnimatedNumber from '../../../components/AnimatedNumber';
import Select from '../../../components/Select';
import LoadingSpinner from '../../../components/LoadingSpinner';
import AdminService from '../../../services/adminService';

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('today');
    const [analytics, setAnalytics] = useState({
        revenue: { total: 0, foodRevenue: 0, liquorRevenue: 0, trend: 0 },
        profit: { total: 0, foodProfit: 0, liquorProfit: 0, margin: 0 },
        orders: { total: 0, trend: 0 },
        avgOrderValue: { value: 0, trend: 0 },
        topItems: [],
        revenueByHour: [],
        categoryBreakdown: []
    });

    // Date range options
    const dateRangeOptions = useMemo(() => [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' }
    ], []);

    // Key metrics configuration
    const keyMetrics = useMemo(() => [
        {
            id: 'revenue',
            title: 'Total Revenue',
            value: analytics.revenue.total,
            isNumber: true,
            prefix: 'LKR ',
            icon: <MdMonetizationOn className="h-8 w-8 text-green-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 0,
            subtitle: `Food: LKR ${(analytics.revenue.foodRevenue || 0).toFixed(0)} | Liquor: LKR ${(analytics.revenue.liquorRevenue || 0).toFixed(0)}`
        },
        {
            id: 'profit',
            title: 'Total Profit',
            value: analytics.profit.total,
            isNumber: true,
            prefix: 'LKR ',
            icon: <MdTrendingUp className="h-8 w-8 text-blue-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 100,
            subtitle: `Margin: ${(analytics.profit.margin || 0).toFixed(1)}%`
        },
        {
            id: 'orders',
            title: 'Total Orders',
            value: analytics.orders.total,
            isNumber: true,
            icon: <FaShoppingCart className="h-8 w-8 text-purple-600" />,
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-200',
            delay: 200
        }
    ], [analytics]);

    // Handle date range change
    const handleDateRangeChange = useCallback((value) => {
        setDateRange(value);
    }, []);

    // Render key metric card
    const renderMetricCard = useCallback(({ title, value, isNumber, prefix, icon, className, delay, subtitle }) => (
        <div className={className}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
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
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                    <div className="flex items-center mt-2 text-green-600">
                        <MdTrendingUp className="h-4 w-4" />
                        <span className="text-sm ml-1">+0%</span>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    {icon}
                </div>
            </div>
        </div>
    ), []);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        { key: 'category', label: 'Category' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'percentage', label: 'Percentage' }
    ], []);

    // Fetch analytics data from API
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [analyticsData, breakdown] = await Promise.all([
                    AdminService.getAnalyticsData(dateRange),
                    AdminService.getFoodLiquorBreakdown(dateRange)
                ]);

                setAnalytics({
                    revenue: analyticsData.revenue || { total: 0, foodRevenue: 0, liquorRevenue: 0, trend: 0 },
                    profit: analyticsData.profit || { total: 0, foodProfit: 0, liquorProfit: 0, margin: 0 },
                    orders: analyticsData.orders || { total: 0, trend: 0 },
                    avgOrderValue: { 
                        value: analyticsData.orders?.total > 0 ? analyticsData.revenue.total / analyticsData.orders.total : 0,
                        trend: 0 
                    },
                    topItems: breakdown.topItems || [],
                    revenueByHour: breakdown.hourly || [],
                    categoryBreakdown: breakdown.categoryBreakdown || []
                });
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setError('Failed to load analytics data');
                // Set fallback empty data
                setAnalytics({
                    revenue: { total: 0, foodRevenue: 0, liquorRevenue: 0, trend: 0 },
                    profit: { total: 0, foodProfit: 0, liquorProfit: 0, margin: 0 },
                    orders: { total: 0, trend: 0 },
                    avgOrderValue: { value: 0, trend: 0 },
                    topItems: [],
                    revenueByHour: [],
                    categoryBreakdown: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange]);

    // Show loading spinner
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error && analytics.revenue.total === 0) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <MdWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-other1">Analytics & Reports</h1>
                <div className="flex items-center gap-4">
                    <Select
                        options={dateRangeOptions}
                        value={dateRange}
                        onChange={handleDateRangeChange}
                    />
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

            {/* Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simple chart placeholders for now */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trends</h3>
                    <p className="text-gray-600">Chart coming soon...</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Items</h3>
                    <div className="space-y-2">
                        {analytics.topItems.slice(0, 5).map((item) => (
                            <div key={`top-item-${item.id || item.name}`} className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">{item.name}</span>
                                <span className="text-sm font-medium">{item.quantity} sold</span>
                            </div>
                        ))}
                    </div>
                </div>
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
                                {tableColumns.map(column => (
                                    <th 
                                        key={column.key}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analytics.categoryBreakdown.map((category) => (
                                <tr key={`category-${category.category}`} className="hover:bg-gray-50 transition-colors">
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
