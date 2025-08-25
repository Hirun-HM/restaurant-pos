import React from 'react'
import { FaUsers, FaClock, FaPlusCircle } from 'react-icons/fa'

export default function TableCard({ tableNumber = "01", }) {
    const empty = true;
    return (
        <div className='w-full bg-white h-[100px] md:h-[220px] rounded-[16px] p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow duration-200 cursor-pointer'>

            {/* Table Info */}
            <div className="text-center flex flex-col items-center">
                <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-1">
                    Table No ({tableNumber})
                </h3>
                {
                    empty && (
                            <FaPlusCircle size={24}/>
                    )
                }
            </div>
        </div>
    )
}
