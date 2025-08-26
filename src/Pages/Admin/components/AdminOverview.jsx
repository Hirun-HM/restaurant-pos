import React, { useState, useEffect, useMemo } from 'react';
import { FaUsers, FaUtensils, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import { MdInventory, MdLocalBar, MdTableRestaurant } from 'react-icons/md';

export default function AdminOverview() {
    const [stats, setStats] = useState({
        totalTables: 0,
        activeBills: 0,
        totalRevenue: 0,
        menuItems: 0,
        stockItems: 0,
        liquorItems: 0
    });

    // Get data from localStorage
    useEffect(() => {
        const bills = JSON.parse(localStorage.getItem('restaurant-bills') || '{}');
        const menuItems = JSON.parse(localStorage.getItem('restaurant-menu-items') || '[]');
        const stockItems = JSON.parse(localStorage.getItem('restaurant-stocks') || '[]');
        const liquorItems = JSON.parse(localStorage.getItem('restaurant-liquor') || '[]');

        const activeBills = Object.values(bills).filter(bill => bill.status === 'active');
        const totalRevenue = Object.values(bills)
            .filter(bill => bill.status === 'closed')
            .reduce((sum, bill) => {
                const serviceCharge = bill.serviceCharge ? bill.total * 0.1 : 0;
                return sum + bill.total + serviceCharge;
            }, 0);

        setStats({
            totalTables: 7, // Static for now
            activeBills: activeBills.length,
            totalRevenue: totalRevenue,
            menuItems: menuItems.length,
            stockItems: stockItems.length,
            liquorItems: liquorItems.length
        });
    }, []);

    const statsCards = useMemo(() => [
        {
            title: 'Active Tables',
            value: stats.activeBills,
            icon: MdTableRestaurant,
            color: 'bg-primaryColor',
            subtitle: `${stats.totalTables - stats.activeBills} Available`
        },
        {
            title: 'Menu Items',
            value: stats.menuItems,
            icon: FaUtensils,
            color: 'bg-green',
            subtitle: 'Total Menu Items'
        },
        {
            title: 'Stock Items',
            value: stats.stockItems,
            icon: MdInventory,
            color: 'bg-other2',
            subtitle: 'Inventory Items'
        },
        {
            title: 'Liquor Items',
            value: stats.liquorItems,
            icon: MdLocalBar,
            color: 'bg-other1',
            subtitle: 'Liquor Inventory'
        },
        {
            title: 'Total Revenue',
            value: `LKR ${stats.totalRevenue.toFixed(2)}`,
            icon: FaMoneyBillWave,
            color: 'bg-green',
            subtitle: 'Completed Bills'
        },
        {
            title: 'Active Bills',
            value: stats.activeBills,
            icon: FaChartLine,
            color: 'bg-red',
            subtitle: 'Pending Orders'
        }
    ], [stats]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-other1">Admin Overview</h1>
                <div className="text-sm text-darkestGray">
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-darkestGray uppercase tracking-wide">
                                    {stat.title}
                                </h3>
                                <p className="text-2xl font-bold text-other1 mt-2">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-text mt-1">
                                    {stat.subtitle}
                                </p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-full`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                <h2 className="text-xl font-semibold text-other1 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="p-4 bg-thirdPartyColor rounded-lg border border-border hover:bg-primaryColor hover:text-white transition-colors">
                        <MdInventory className="h-8 w-8 text-other1 mx-auto mb-2" />
                        <p className="text-sm font-medium text-other1">Manage Stocks</p>
                    </button>
                    <button className="p-4 bg-thirdPartyColor rounded-lg border border-border hover:bg-primaryColor hover:text-white transition-colors">
                        <MdLocalBar className="h-8 w-8 text-other1 mx-auto mb-2" />
                        <p className="text-sm font-medium text-other1">Liquor Inventory</p>
                    </button>
                    <button className="p-4 bg-thirdPartyColor rounded-lg border border-border hover:bg-primaryColor hover:text-white transition-colors">
                        <FaChartLine className="h-8 w-8 text-other1 mx-auto mb-2" />
                        <p className="text-sm font-medium text-other1">View Analytics</p>
                    </button>
                    <button className="p-4 bg-thirdPartyColor rounded-lg border border-border hover:bg-primaryColor hover:text-white transition-colors">
                        <FaUsers className="h-8 w-8 text-other1 mx-auto mb-2" />
                        <p className="text-sm font-medium text-other1">User Management</p>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                <h2 className="text-xl font-semibold text-other1 mb-4">System Status</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-fourthColor rounded-lg">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-other1">System Online</span>
                        </div>
                        <span className="text-xs text-darkestGray">All services running</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-fourthColor rounded-lg">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-primaryColor rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-other1">Database Connected</span>
                        </div>
                        <span className="text-xs text-darkestGray">LocalStorage active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-fourthColor rounded-lg">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-other2 rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-other1">Backup Status</span>
                        </div>
                        <span className="text-xs text-darkestGray">Manual backup required</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
