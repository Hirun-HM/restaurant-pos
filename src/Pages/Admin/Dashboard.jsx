import React from 'react';
import { RiAdminFill } from 'react-icons/ri';
import { FaSignOutAlt, FaTools } from 'react-icons/fa';

export default function AdminDashboard() {
    const handleLogout = () => {
        // Add logout logic here
        window.location.href = '/restaurant-pos/';
    };

    return (
        <div className="min-h-scree font-poppins">
            {/* Header */}
            <header className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <RiAdminFill className="text-primaryColor text-xl" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">
                                Admin Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                        >
                            <FaSignOutAlt />
                            <span className='text-black'>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Under Construction Section */}
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="flex items-center justify-center mb-8">
                        <div className="bg-yellow-100 p-6 rounded-full">
                            <FaTools className="text-yellow-600 text-6xl" />
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Admin Dashboard
                    </h1>
                    
                    <h2 className="text-2xl font-semibold text-yellow-800 mb-6">
                        🚧 Under Construction 🚧
                    </h2>
                    
                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                        We're building something amazing for you! The admin dashboard is currently being developed. 
                        Soon you'll be able to manage users, view analytics, configure menus, and control all aspects of your restaurant.
                    </p>
                </div>
            </main>
        </div>
    );
}
