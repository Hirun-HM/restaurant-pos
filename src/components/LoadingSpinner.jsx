import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-amber-500"></div>
                <span className="text-gray-600 font-medium">Loading...</span>
            </div>
        </div>
    )
}
