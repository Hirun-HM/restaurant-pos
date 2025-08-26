import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaTools } from 'react-icons/fa';
import Header from './components/Header';
import TableCard from './Tables/Components/TableCard';
import TableManagement from './Tables/TableManagement';
import StockManager from './Stocks/StockManager';
import LiquorManager from './Liquor/LiquorManager';
import MenuManager from './Menu/MenuManager';

const tableList = [
    { id: 1, tableNumber: "01", status: "available", customerCount: 0, orderTime: null },
    { id: 2, tableNumber: "02", status: "occupied", customerCount: 4, orderTime: "15:30" },
    { id: 3, tableNumber: "03", status: "reserved", customerCount: 0, orderTime: null },
    { id: 4, tableNumber: "04", status: "available", customerCount: 0, orderTime: null },
    { id: 5, tableNumber: "05", status: "occupied", customerCount: 2, orderTime: "16:15" },
    { id: 6, tableNumber: "06", status: "available", customerCount: 0, orderTime: null },
    { id: 7, tableNumber: "07", status: "occupied", customerCount: 6, orderTime: "14:45" },
];

export default function UserDashboard() {
    const navigate = useNavigate();

    const [active, setActive] = useState('Table');

    const handleLogout = () => {
        // Add logout logic here
        navigate('/');
    };

    return (
        <div className="min-h-screen font-poppins p-6">
            <div className='flex items-center justify-center'>
                <Header active={active} setActive={setActive}/>
            </div>
            {
                active === 'Table' && (
                    <TableManagement tableList={tableList}/>
                )
            }
            {
                active === 'Stocks' && (
                    <StockManager/>
                )
            }
            {
                active === 'Liquor' && (
                    <LiquorManager/>
                )
            }
            {
                active === 'Menu' && (
                    <MenuManager/>
                )
            }
        </div>
    );
}
