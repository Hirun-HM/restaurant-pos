import React, { useState } from 'react';
import { FaUser, FaSignOutAlt, FaTools } from 'react-icons/fa';
import Header from './components/Header';
import TableCard from './components/TableCard';

const tableList = [
    { id: 1, tableNumber: "01", status: "available", customerCount: 0, orderTime: null },
    { id: 2, tableNumber: "02", status: "occupied", customerCount: 4, orderTime: "15:30" },
    { id: 3, tableNumber: "03", status: "reserved", customerCount: 0, orderTime: null },
    { id: 4, tableNumber: "04", status: "available", customerCount: 0, orderTime: null },
    { id: 5, tableNumber: "05", status: "occupied", customerCount: 2, orderTime: "16:15" },
    { id: 6, tableNumber: "06", status: "available", customerCount: 0, orderTime: null },
    { id: 7, tableNumber: "07", status: "occupied", customerCount: 6, orderTime: "14:45" },
    { id: 8, tableNumber: "08", status: "reserved", customerCount: 0, orderTime: null },
    { id: 9, tableNumber: "09", status: "available", customerCount: 0, orderTime: null },
    { id: 10, tableNumber: "10", status: "occupied", customerCount: 3, orderTime: "17:00" }
];

export default function UserDashboard() {

    const [active, setActive] = useState('Table');

    const handleLogout = () => {
        // Add logout logic here
        window.location.href = '/restaurant-pos/';
    };

    return (
        <div className="min-h-screen font-poppins p-6">
            <div className='flex items-center justify-center'>
                <Header active={active} setActive={setActive}/>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2 h-full md:h-[78vh] mt-5'>

                {/* for tables */}
                <div className='p-6 w-full overflow-y-auto bg-fourthColor rounded-[32px]'>
                    <h1 className='text-[24px] font-[500]'>1. Table List</h1>
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                        {
                            tableList.map((table) => (
                                <TableCard
                                    key={table.id}
                                    tableNumber={table.tableNumber}
                                    status={table.status}
                                    customerCount={table.customerCount}
                                    orderTime={table.orderTime}
                                />
                            ))
                        }
                    </div>
                </div>

                {/* for food items */}
                <div className='p-6 w-full overflow-hidden bg-fourthColor rounded-[32px]'>
                    <h1 className='text-[24px] font-[500]'>2. Food Menu</h1>
                </div>

                {/* for liquor items */}
                <div className='p-6 w-full overflow-hidden bg-fourthColor rounded-[32px]'>
                    <h1 className='text-[24px] font-[500]'>3. Liquor Menu</h1>
                </div>
            </div>
        </div>
    );
}
