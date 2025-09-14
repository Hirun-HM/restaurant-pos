import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import TableManagement from './Tables/TableManagement';
import StockManagerWithAPI from './Stocks/StockManagerWithAPI';
import LiquorManagerWithAPI from './Liquor/LiquorManagerWithAPI';
import MenuManager from './Menu/MenuManager';
import PasswordModal from '../../components/PasswordModal';
import { usePasswordAuth } from '../../hooks/usePasswordAuth';

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
    
    const {
        requestAccess,
        handlePasswordSuccess,
        handlePasswordCancel,
        clearAuthentication,
        isAuthenticated,
        showPasswordModal,
        pendingSection
    } = usePasswordAuth();

    const handleSectionChange = (sectionName) => {
        // Request access to the section (this will handle authentication)
        if (requestAccess(sectionName)) {
            setActive(sectionName);
        }
        // If access is denied, the password modal will be shown automatically
    };

    const onPasswordSuccess = () => {
        handlePasswordSuccess();
        // After successful authentication, set the pending section as active
        if (pendingSection) {
            setActive(pendingSection);
        }
    };

    const handleLogout = () => {
        // Clear authentication when logging out
        clearAuthentication();
        navigate('/');
    };

    return (
        <div className="min-h-screen font-poppins p-3 sm:p-4 md:p-6">
            <div className='flex items-center justify-center'>
                <Header 
                    active={active} 
                    setActive={handleSectionChange}
                    isAuthenticated={isAuthenticated}
                    onLogout={handleLogout}
                />
            </div>
            
            {/* Password Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={handlePasswordCancel}
                onSuccess={onPasswordSuccess}
                sectionName={pendingSection || ''}
            />
            
            {active === 'Table' && (
                <TableManagement tableList={tableList}/>
            )}
            {active === 'Stocks' && isAuthenticated('Stocks') && (
                <StockManagerWithAPI/>
            )}
            {active === 'Liquor' && isAuthenticated('Liquor') && (
                <LiquorManagerWithAPI/>
            )}
            {active === 'Menu' && isAuthenticated('Menu') && (
                <MenuManager/>
            )}
        </div>
    );
}
