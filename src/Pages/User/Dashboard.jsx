import React from 'react';
import { FaUser, FaSignOutAlt, FaTools } from 'react-icons/fa';
import Header from './components/Header';

export default function UserDashboard() {
    const handleLogout = () => {
        // Add logout logic here
        window.location.href = '/restaurant-pos/';
    };

    return (
        <div className="min-h-screen font-poppins p-6">
            <div className='flex items-center justify-center'>
                <Header/>
            </div>
            <div className='grid grid-cols-3 gap-2 h-full md:h-[78vh] mt-5'>

                {/* for tables */}
                <div className='p-6 w-full overflow-hidden bg-fourthColor rounded-[32px]'>
                    <h1 className='text-[24px] font-[500]'>1. Table List</h1>
                    <div className='grid grid-cols-1 md:grid-cols-2'>

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
