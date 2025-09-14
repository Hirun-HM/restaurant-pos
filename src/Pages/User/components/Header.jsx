import React from 'react'
import { useNavigate } from 'react-router-dom';
import { MdOutlineTableRestaurant } from "react-icons/md";
import { MdInventory } from "react-icons/md";
import { MdLocalBar } from "react-icons/md";
import { MdRestaurantMenu } from "react-icons/md";
import { FaSignOutAlt } from "react-icons/fa";

const items = [
    { icon: MdOutlineTableRestaurant, title: 'Table'},
    { icon: MdRestaurantMenu, title: 'Menu'},
    { icon: MdLocalBar, title: 'Liquor'},
    { icon: MdInventory, title: 'Stocks'},
]
export default function Header({ active, setActive}) {    
    const navigate = useNavigate();

    const handleActive = (item) => {
        setActive(item)
    }

    const handleLogout = () => {
        // Clear any stored data and navigate to home
        navigate('/');
    }

    return (
        <div className='gap-2 sm:gap-3 md:gap-5 flex items-center flex-wrap justify-center'>
            {
                items.map((item, i) => (
                    <div 
                        key={i}
                        onClick={ () => handleActive(item.title)}
                        className='flex flex-col text-center cursor-pointer'>
                        <div className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex items-center justify-center rounded-full ${active === item.title ? 'bg-primaryColor text-white': 'text-other1 border'}`}>
                            <item.icon size={24} className="sm:hidden"/>
                            <item.icon size={28} className="hidden sm:block md:hidden"/>
                            <item.icon size={36} className="hidden md:block"/>            
                        </div>
                        <h1 className='text-xs sm:text-sm md:text-base mt-1 font-semibold text-other1'>{item.title}</h1>
                    </div>
                ))
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
