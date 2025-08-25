import React from 'react'
import { MdOutlineTableRestaurant } from "react-icons/md";
import { MdInventory } from "react-icons/md";

const items = [
    { icon: MdOutlineTableRestaurant, title: 'Table'},
    { icon: MdInventory, title: 'Stocks'},
]
export default function Header() {

    const active = true;
    return (
        <div className='gap-5 flex'>
            {
                items.map((item) => (
                    <div className='flex flex-col text-center'>
                        <div className={`h-16 w-16 flex items-center justify-center rounded-full ${active ? 'bg-primaryColor text-white': 'text-black'}`}>
                            <item.icon size={36}/>            
                        </div>
                        <h1 className='text-[16px] mt-1 font-semibold'>{item.title}</h1>
                    </div>
                ))
            }
        </div>
    )
}
