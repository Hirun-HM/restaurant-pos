import React from 'react'
import { FaPlusCircle, FaReceipt } from 'react-icons/fa'

export default function TableCard({ 
    tableNumber = "01", 
    isSelected = false,
    hasBill = false,
    onClick
}) {

    return (
        <div 
            onClick={onClick}
            className={`w-full bg-white h-[100px] md:h-[220px] rounded-[16px] p-4 flex flex-col items-center justify-center hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${
                isSelected ? 'border-primaryColor shadow-lg' : 'border-gray-200'
            }`}
        >
            {/* Table Info */}
            <div className="text-center flex flex-col items-center">
                <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-4">
                    Table No ({tableNumber})
                </h3>

                {/* Bill indicator */}
                {hasBill && (
                    <div className="flex items-center text-xs md:text-sm text-green-600">
                        <FaReceipt className="mr-1" />
                        <span>Has Bill</span>
                    </div>
                )}

                {/* Add icon for tables without bills */}
                {!hasBill && (
                    <FaPlusCircle size={24} className="text-gray-400"/>
                )}
            </div>
        </div>
    )
}
