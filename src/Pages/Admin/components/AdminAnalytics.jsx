import React, { useState, useEffect, useMemo } from 'react';
import { FaChartLine, FaChartBar, FaChartPie, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { MdTrendingUp, MdTrendingDown, MdMonetizationOn, MdRestaurant } from 'react-icons/md';

export default function AdminAnalytics() {
    const [bills, setBills] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [dateRange, setDateRange] = useState('today');
    const [analytics, setAnalytics] = useState({
        revenue: { total: 0, trend: 0 },
        orders: { total: 0, trend: 0 },
        avgOrderValue: { value: 0, trend: 0 },
        topItems: [],
        revenueByHour: [],
        revenueByDay: [],
        categoryBreakdown: []
    });

    // Load data from localStorage
    useEffect(() => {
        const savedBills = JSON.parse(localStorage.getItem('restaurant-bills') || '{}');
        const savedMenuItems = JSON.parse(localStorage.getItem('restaurant-menu-items') || '[]');
        setBills(savedBills);
        setMenuItems(savedMenuItems);
    }, []);

    // Calculate analytics based on date range
    useEffect(() => {
        const calculateAnalytics = () => {
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
        };

        calculateAnalytics();
    }, [bills, menuItems, dateRange]);

    // Chart components
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

    const LineChart = ({ data, title, xKey, yKey }) => {
        const maxValue = Math.max(...data.map(item => item[yKey]));
        const minValue = Math.min(...data.map(item => item[yKey]));
        const range = maxValue - minValue || 1;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="relative h-64">
                    <svg width="100%" height="100%" className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(percent => (
                            <line
                                key={percent}
                                x1="0"
                                y1={`${percent}%`}
                                x2="100%"
                                y2={`${percent}%`}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                            />
                        ))}
                        
                        {/* Line */}
                        <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            points={data.map((item, index) => {
                                const x = (index / (data.length - 1)) * 100;
                                const y = 100 - ((item[yKey] - minValue) / range) * 100;
                                return `${x},${y}`;
                            }).join(' ')}
                        />
                        
                        {/* Points */}
                        {data.map((item, index) => {
                            const x = (index / (data.length - 1)) * 100;
                            const y = 100 - ((item[yKey] - minValue) / range) * 100;
                            return (
                                <circle
                                    key={index}
                                    cx={`${x}%`}
                                    cy={`${y}%`}
                                    r="3"
                                    fill="#3b82f6"
                                />
                            );
                        })}
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 mt-2">
                        {data.map((item, index) => (
                            <span key={index}>{item[xKey]}</span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const PieChart = ({ data, title }) => {
        const total = data.reduce((sum, item) => sum + item.revenue, 0);
        let currentAngle = 0;
        
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
        ];

        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <svg width="200" height="200" className="transform -rotate-90">
                            {data.map((item, index) => {
                                const percentage = total > 0 ? (item.revenue / total) * 100 : 0;
                                const angle = (percentage / 100) * 360;
                                const x1 = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180);
                                const y1 = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180);
                                const x2 = 100 + 80 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                                const y2 = 100 + 80 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                                
                                currentAngle += angle;
                                
                                return (
                                    <path
                                        key={index}
                                        d={pathData}
                                        fill={colors[index % colors.length]}
                                    />
                                );
                            })}
                        </svg>
                    </div>
                    <div className="space-y-2">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                ></div>
                                <span className="text-sm text-gray-700">{item.category}</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                        <FaDownload className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Total Revenue</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                LKR {analytics.revenue.total.toFixed(2)}
                            </p>
                            <div className="flex items-center mt-2 text-green-600">
                                <MdTrendingUp className="h-4 w-4" />
                                <span className="text-sm ml-1">+{analytics.revenue.trend}%</span>
                            </div>
                        </div>
                        <MdMonetizationOn className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Total Orders</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{analytics.orders.total}</p>
                            <div className="flex items-center mt-2 text-blue-600">
                                <MdTrendingUp className="h-4 w-4" />
                                <span className="text-sm ml-1">+{analytics.orders.trend}%</span>
                            </div>
                        </div>
                        <MdRestaurant className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Avg Order Value</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                LKR {analytics.avgOrderValue.value.toFixed(2)}
                            </p>
                            <div className="flex items-center mt-2 text-purple-600">
                                <MdTrendingUp className="h-4 w-4" />
                                <span className="text-sm ml-1">+{analytics.avgOrderValue.trend}%</span>
                            </div>
                        </div>
                        <FaChartLine className="h-8 w-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dateRange === 'today' && analytics.revenueByHour.length > 0 && (
                    <LineChart
                        data={analytics.revenueByHour.filter(item => item.revenue > 0)}
                        title="Revenue by Hour"
                        xKey="hour"
                        yKey="revenue"
                    />
                )}
                
                {dateRange === 'week' && analytics.revenueByDay.length > 0 && (
                    <BarChart
                        data={analytics.revenueByDay}
                        title="Revenue by Day"
                        xKey="date"
                        yKey="revenue"
                        color="bg-green-500"
                    />
                )}

                {analytics.categoryBreakdown.length > 0 && (
                    <PieChart
                        data={analytics.categoryBreakdown}
                        title="Revenue by Category"
                    />
                )}
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.topItems.length > 0 && (
                    <BarChart
                        data={analytics.topItems}
                        title="Top Selling Items"
                        xKey="name"
                        yKey="quantity"
                        color="bg-orange-500"
                    />
                )}

                {analytics.topItems.length > 0 && (
                    <BarChart
                        data={analytics.topItems.map(item => ({
                            ...item,
                            revenueFormatted: item.revenue
                        }))}
                        title="Top Revenue Items"
                        xKey="name"
                        yKey="revenue"
                        color="bg-purple-500"
                    />
                )}
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Performance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Revenue</td>
                                <td className="px-6 py-4 text-sm text-gray-900">LKR {analytics.revenue.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-green-600">+{analytics.revenue.trend}%</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        Good
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Orders</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{analytics.orders.total}</td>
                                <td className="px-6 py-4 text-sm text-blue-600">+{analytics.orders.trend}%</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        Active
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">Average Order Value</td>
                                <td className="px-6 py-4 text-sm text-gray-900">LKR {analytics.avgOrderValue.value.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-purple-600">+{analytics.avgOrderValue.trend}%</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                        Stable
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
