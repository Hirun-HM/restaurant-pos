import React from 'react';
import PropTypes from 'prop-types';
import { SecondaryButton } from '../../../../components/Button';
import LiquorAnalyticsCard from '../../../../components/LiquorAnalyticsCard';

export default function LiquorItemCard({ 
  item, 
  onEdit, 
  onDelete
}) {
  const isLowStock = item.bottlesInStock <= item.minimumBottles;
  
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow h-fit">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.brand}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${(() => {
                if (item.type === 'beer') return 'bg-yellow-100 text-yellow-800';
                if (item.type === 'whiskey') return 'bg-amber-100 text-amber-800';
                if (item.type === 'vodka') return 'bg-blue-100 text-blue-800';
                if (item.type === 'rum') return 'bg-orange-100 text-orange-800';
                if (item.type === 'gin') return 'bg-green-100 text-green-800';
                return 'bg-gray-100 text-gray-800';
              })()}`}>
                {item.type.toUpperCase()}
              </span>
              {isLowStock && (
                <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                  LOW STOCK
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <SecondaryButton
              onClick={() => onEdit(item)}
              className="!px-3 !py-1.5 text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </SecondaryButton>
            <SecondaryButton
              onClick={() => onDelete(item)}
              className="!px-3 !py-1.5 text-sm !text-red-600 !border-red-600 hover:!bg-red-600 hover:!text-white"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 ">
        {/* Stock Information - Hide for beer and cigarettes */}
        {item.type !== 'beer' && item.type !== 'cigarettes' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Bottles in Stock</div>
                <div className={`text-lg font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.bottlesInStock}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bottle Volume</div>
                <div className="text-lg font-semibold text-gray-900">
                  {item.bottleVolume}ml
                </div>
              </div>
            </div>

            {/* Volume Information */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Total Remaining</div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(item.totalVolumeRemaining || 0)}ml
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Bottle</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {Math.round(item.currentBottleVolume || 0)}ml
                </div>
              </div>
            </div>

            {/* Sales and Waste Information */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Bottles Sold</div>
                <div className="text-lg font-semibold text-purple-600">
                  {item.totalSoldItems || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Wasted</div>
                <div className="text-lg font-semibold text-red-600">
                  {Math.round(item.wastedVolume || 0)}ml
                </div>
              </div>
            </div>
          </>
        )}

        {/* Portions Information */}
        {item.type !== 'beer' && item.portions && item.portions.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Available Portions</div>
            <div className="space-y-1">
              {item.portions.slice(0, 3).map((portion, index) => (
                <div key={portion._id || index} className="flex justify-between text-xs">
                  <span className="text-gray-600">{portion.name} ({portion.volume}ml)</span>
                  <span className="font-medium text-gray-900">${portion.price?.toFixed(2)}</span>
                </div>
              ))}
              {item.portions.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{item.portions.length - 3} more portions...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {item.alcoholPercentage && (
          <div className="mb-4">
            <div className="text-sm text-gray-600">Alcohol Content</div>
            <div className="text-sm font-medium text-gray-900">
              {item.alcoholPercentage}%
            </div>
          </div>
        )}

        {/* Analytics Card */}
        <LiquorAnalyticsCard liquor={item} />
      </div>
    </div>
  );
}

LiquorItemCard.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
