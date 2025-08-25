import React from 'react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { MdInventory } from "react-icons/md";
import { MdLocalBar } from "react-icons/md";

const items = [
    { icon: MdOutlineTableRestaurant, title: 'Table'},
    { icon: MdInventory, title: 'Stocks'},
    { icon: MdLocalBar, title: 'Liquor'},
]
export default function Header({ active, setActive}) {    

    const handleActive = (item) => {
        setActive(item)
    }

    return (
        <div className='gap-5 flex'>
            {
                items.map((item, i) => (
                    <div 
                        key={i}
                        onClick={ () => handleActive(item.title)}
                        className='flex flex-col text-center cursor-pointer'>
                        <div className={`h-16 w-16 flex items-center justify-center rounded-full ${active === item.title ? 'bg-primaryColor text-white': 'text-black border'}`}>
                            <item.icon size={36}/>            
                        </div>
                        <h1 className='text-[16px] mt-1 font-semibold'>{item.title}</h1>
                    </div>
                ))
            }
        </div>
    )
}
