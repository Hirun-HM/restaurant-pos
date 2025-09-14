import React from 'react'
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { MdOutlineTableRestaurant, MdInventory, MdLocalBar, MdRestaurantMenu } from "react-icons/md";
import { FaSignOutAlt, FaLock } from "react-icons/fa";

const items = [
    { icon: MdOutlineTableRestaurant, title: 'Table'},
    { icon: MdRestaurantMenu, title: 'Menu'},
    { icon: MdLocalBar, title: 'Liquor'},
    { icon: MdInventory, title: 'Stocks'},
]
export default function Header({ active, setActive, isAuthenticated, onLogout }) {    
    const navigate = useNavigate();
    const restrictedSections = ['Menu', 'Liquor', 'Stocks'];

    const handleActive = (item) => {
        setActive(item);
    }

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            // Fallback if onLogout is not provided
            navigate('/');
        }
    }

    return (
        <div className='gap-2 sm:gap-3 md:gap-5 flex items-center flex-wrap justify-center'>
            {
                items.map((item, i) => {
                    const isRestricted = restrictedSections.includes(item.title);
                    const isAuth = isAuthenticated ? isAuthenticated(item.title) : true;
                    const showLockIcon = isRestricted && !isAuth;
                    
                    return (
                        <button 
                            key={item.title}
                            onClick={() => handleActive(item.title)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleActive(item.title);
                                }
                            }}
                            className='flex flex-col text-center cursor-pointer relative bg-transparent border-0 p-0'
                            tabIndex={0}
                            aria-label={`Navigate to ${item.title} section`}
                        >
                            <div className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex items-center justify-center rounded-full relative ${
                                active === item.title ? 'bg-primaryColor text-white' : 'text-other1 border'
                            } ${isRestricted && !isAuth ? 'opacity-75' : ''}`}>
                                <item.icon size={24} className="sm:hidden"/>
                                <item.icon size={28} className="hidden sm:block md:hidden"/>
                                <item.icon size={36} className="hidden md:block"/>
                                
                                {/* Lock overlay for restricted sections */}
                                {showLockIcon && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                        <FaLock size={10} />
                                    </div>
                                )}
                            </div>
                            <h1 className={`text-xs sm:text-sm md:text-base mt-1 font-semibold ${
                                isRestricted && !isAuth ? 'text-gray-400' : 'text-other1'
                            }`}>
                                {item.title}
                                {showLockIcon && <FaLock className="inline ml-1" size={10} />}
                            </h1>
                        </button>
                    );
                })
            }
            {/* Logout Button */}
            <div className='ml-4 sm:ml-6 md:ml-8'>
                <button
                    onClick={handleLogout}
                    className='flex flex-col items-center text-center cursor-pointer group'
                >
                    <div className='h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex items-center justify-center rounded-full bg-red text-white hover:bg-other2 transition-colors'>
                        <FaSignOutAlt size={24} className="sm:hidden"/>
                        <FaSignOutAlt size={28} className="hidden sm:block md:hidden"/>
                        <FaSignOutAlt size={36} className="hidden md:block"/>            
                    </div>
                    <h1 className='text-xs sm:text-sm md:text-base mt-1 font-semibold text-red group-hover:text-other2'>Logout</h1>
                </button>
            </div>
        </div>
    )
}

Header.propTypes = {
    active: PropTypes.string.isRequired,
    setActive: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.func,
    onLogout: PropTypes.func
};
