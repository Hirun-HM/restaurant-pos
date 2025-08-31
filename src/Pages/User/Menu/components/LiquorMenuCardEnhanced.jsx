import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaBoxes, FaSave, FaTimes } from 'react-icons/fa';
import { InputField } from '../../../../components/InputField';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import LiquorService from '../../../../services/liquorService';

export default function LiquorMenuCard({ liquorItem, onUpdatePortions, onEdit, onDelete }) {
  const [editingPortions, setEditingPortions] = useState(false);
  const [portionPrices, setPortionPrices] = useState(() => {
    // Initialize portion prices from the existing data
    const prices = {};
    if (liquorItem.portions && liquorItem.portions.length > 0) {
      liquorItem.portions.forEach(portion => {
        prices[portion._id] = portion.price || 0;
      });
    }
    return prices;
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Update portion prices when liquorItem changes
  useEffect(() => {
    const prices = {};
    if (liquorItem.portions && liquorItem.portions.length > 0) {
      liquorItem.portions.forEach(portion => {
        prices[portion._id] = portion.price || 0;
      });
    }
    setPortionPrices(prices);
  }, [liquorItem.portions, liquorItem.name]);

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}L`;
    }
    return `${volume}ml`;
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
      beer: '🍺',
      wine: '🍷',
      cigarettes: '🚬',
      other: '📦'
    };
    return icons[type] || '🥃';
  };

  const handlePriceChange = (portionId, value) => {
    // Parse the value and ensure it's a valid number
    const numericValue = parseFloat(value) || 0;
    setPortionPrices(prev => ({
      ...prev,
      [portionId]: numericValue
    }));
  };

  const handleSavePortionPrices = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      // Create updated portions array with new prices
      const updatedPortions = liquorItem.portions.map(portion => ({
        ...portion,
        price: portionPrices[portion._id] || 0
      }));

      // Call the API to update portions
      await LiquorService.updateLiquorPortions(liquorItem._id, { portions: updatedPortions });
      
      setSaveMessage('Prices saved successfully!');
      setEditingPortions(false);
      
      // Callback to refresh the parent component
      if (onUpdatePortions) {
        onUpdatePortions(liquorItem._id, updatedPortions);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving portion prices:', error);
      setSaveMessage('Error saving prices. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset prices to original values
    const originalPrices = {};
    if (liquorItem.portions) {
      liquorItem.portions.forEach(portion => {
        originalPrices[portion._id] = portion.price || 0;
      });
    }
    setPortionPrices(originalPrices);
    setEditingPortions(false);
    setSaveMessage('');
  };

  const hasPortions = liquorItem.portions && liquorItem.portions.length > 0;
  const portionCount = hasPortions ? liquorItem.portions.length : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-fit">
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
                {liquorItem.type === 'hard_liquor' && liquorItem.bottleVolume && (
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

      {/* Content - Dynamic padding and layout based on liquor type */}
      <div className={liquorItem.type === 'hard_liquor' ? "p-4" : "p-3"}>
        {/* Price and Alcohol Info - Dynamic grid layout */}
        <div className={liquorItem.type === 'hard_liquor' ? "grid grid-cols-2 gap-4 mb-4" : "mb-3"}>
          <div>
            <span className="text-sm font-medium text-gray-700">Price per {liquorItem.type === 'cigarettes' ? 'Pack' : 'Bottle'}:</span>
            <p className="text-lg font-semibold text-green-600">
              LKR {liquorItem.pricePerBottle ? liquorItem.pricePerBottle.toFixed(2) : '0.00'}
            </p>
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

        {/* Save Message - Dynamic spacing */}
        {saveMessage && (
          <div className={`${liquorItem.type === 'hard_liquor' ? 'mb-4' : 'mb-2'} p-3 rounded-lg text-sm font-medium ${
            saveMessage.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Portion Management */}
        {liquorItem.type === 'hard_liquor' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Portion Pricing:</span>
                <p className="text-sm text-gray-600">
                  {hasPortions ? `${portionCount} portion sizes configured` : 'No portions configured yet'}
                </p>
              </div>
              {hasPortions && !editingPortions && (
                <PrimaryButton
                  onClick={() => setEditingPortions(true)}
                  className="text-sm px-3 py-1"
                >
                  <FaEdit className="mr-1" />
                  Edit Prices
                </PrimaryButton>
              )}
            </div>

            {/* Portion Price Editing */}
            {hasPortions && editingPortions && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Edit Portion Prices:</h4>
                {liquorItem.portions.map((portion) => (
                  <div key={portion._id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        {portion.name} ({formatVolume(portion.volume)})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">LKR</span>
                      <InputField
                        type="number"
                        value={portionPrices[portion._id] || ''}
                        onChange={(e) => handlePriceChange(portion._id, e.target.value)}
                        className="w-20 text-center"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <SecondaryButton
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2"
                  >
                    <FaTimes className="mr-1" />
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSavePortionPrices}
                    disabled={saving}
                    className="px-4 py-2"
                  >
                    <FaSave className="mr-1" />
                    {saving ? 'Saving...' : 'Save Prices'}
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Display Current Prices */}
            {hasPortions && !editingPortions && (
              <div className="space-y-2">
                {liquorItem.portions.map((portion) => (
                  <div key={portion._id} className="flex justify-between items-center bg-white rounded-lg p-2 border">
                    <span className="text-sm text-gray-700">
                      {portion.name} ({formatVolume(portion.volume)})
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      LKR {(portion.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* For non-hard liquor items - Minimal styling */}
        {liquorItem.type !== 'hard_liquor' && (
          <div className="bg-gray-50 rounded p-2 text-center">
            <span className="text-xs text-gray-600">
              {(() => {
                if (liquorItem.type === 'beer' || liquorItem.type === 'wine') {
                  return 'Sold as whole bottles only';
                } 
                if (liquorItem.type === 'cigarettes') {
                  return 'Sold as whole packs only';
                }
                return 'No portion pricing available';
              })()}
            </span>
          </div>
        )}

       
       
      </div>
    </div>
  );
}

LiquorMenuCard.propTypes = {
  liquorItem: PropTypes.object.isRequired,
  onUpdatePortions: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};
