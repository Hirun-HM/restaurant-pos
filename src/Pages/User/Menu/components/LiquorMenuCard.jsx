import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaBoxes, FaEye } from 'react-icons/fa';
import Button from '../../../../components/Button';

export default function LiquorMenuCard({ liquorItem, onManagePortions }) {
  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}L`;
    }
    return `${volume}ml`;
  };

  const getPortionText = () => {
    if (liquorItem.type === 'beer') {
      return 'Sold as whole bottles only';
    }
    if (liquorItem.type === 'cigarettes') {
      return 'Sold as whole packs only';
    }
    return hasPortions 
      ? `${portionCount} portion sizes configured`
      : 'No portions configured yet';
  };

  const getStockStatusColor = () => {
    if (liquorItem.bottlesInStock <= liquorItem.minimumBottles) {
      return 'text-red-600 bg-red-50';
    }
    if (liquorItem.bottlesInStock <= liquorItem.minimumBottles * 2) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getTypeIcon = (type) => {
    const icons = {
      hard_liquor: '🥃',
      beer: '�',
      wine: '�',
      cigarettes: '🚬',
      other: '📦'
    };
    return icons[type] || '🥃';
  };

  const hasPortions = liquorItem.portions && liquorItem.portions.length > 0;
  const portionCount = hasPortions ? liquorItem.portions.length : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">{getTypeIcon(liquorItem.type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{liquorItem.name}</h3>
              <p className="text-sm text-gray-600">{liquorItem.brand}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                  {liquorItem.type === 'cigarettes' ? 'Cigarettes' : liquorItem.type.replace('_', ' ')}
                </span>
                {/* Only show volume for hard liquor */}
                {liquorItem.type === 'hard_liquor' && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {formatVolume(liquorItem.bottleVolume)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Stock Status */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStockStatusColor()}`}>
            <FaBoxes className="inline mr-1 text-xs" />
            {liquorItem.bottlesInStock} {liquorItem.type === 'cigarettes' ? 'packs' : 'bottles'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {liquorItem.type === 'cigarettes' ? 'Price per Pack:' : 'Price per Bottle:'}
            </span>
            <p className="text-lg font-semibold text-green-600">LKR {liquorItem.pricePerBottle?.toFixed(2) || '0.00'}</p>
          </div>
          {/* Only show alcohol percentage for hard liquor */}
          {liquorItem.type === 'hard_liquor' && (
            <div>
              <span className="text-sm font-medium text-gray-700">Alcohol %:</span>
              <p className="text-lg font-semibold text-blue-600">
                {liquorItem.alcoholPercentage ? `${liquorItem.alcoholPercentage}%` : 'N/A'}
              </p>
            </div>
          )}
        </div>

        {/* Portion Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Available Portions:</span>
              <p className="text-sm text-gray-600">
                {getPortionText()}
              </p>
            </div>
            {hasPortions && (
              <span className="text-2xl text-green-500">✓</span>
            )}
          </div>

          {/* Show some portion examples */}
          {hasPortions && (
            <div className="mt-2 flex flex-wrap gap-1">
              {liquorItem.portions.slice(0, 3).map((portion) => (
                <span 
                  key={portion._id}
                  className="px-2 py-1 text-xs bg-white text-gray-600 rounded border"
                >
                  {formatVolume(portion.volume)} - LKR {portion.price?.toFixed(2) || '0.00'}
                </span>
              ))}
              {portionCount > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{portionCount - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stock Details - Only for Hard Liquor */}
        {liquorItem.type === 'hard_liquor' && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-xs text-blue-600 font-medium">Total Volume</p>
              <p className="text-sm font-semibold text-blue-800">
                {formatVolume(liquorItem.totalVolumeRemaining || (liquorItem.bottlesInStock * liquorItem.bottleVolume))}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-xs text-green-600 font-medium">Sold</p>
              <p className="text-sm font-semibold text-green-800">
                {formatVolume(liquorItem.totalSoldVolume || 0)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-600 font-medium">Wasted</p>
              <p className="text-sm font-semibold text-red-800">
                {formatVolume(liquorItem.wastedVolume || 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        <Button
          onClick={() => onManagePortions(liquorItem)}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          disabled={liquorItem.type === 'beer'}
        >
          {liquorItem.type === 'beer' ? (
            <>
              <FaEye />
              <span>View Details</span>
            </>
          ) : (
            <>
              <FaEdit />
              <span>Manage Portions & Prices</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

LiquorMenuCard.propTypes = {
  liquorItem: PropTypes.object.isRequired,
  onManagePortions: PropTypes.func.isRequired
};
