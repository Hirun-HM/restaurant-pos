import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InputField } from '../../../../components/InputField';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';
import { FaWineBottle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

export default function LiquorPortionEditor({ liquorItem, onUpdatePortions, onClose }) {
  const [portions, setPortions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPortions, setEditingPortions] = useState({});

  useEffect(() => {
    if (liquorItem && liquorItem.portions) {
      setPortions(liquorItem.portions);
    }
  }, [liquorItem]);

  const handlePriceChange = (portionId, price) => {
    setPortions(prev => prev.map(portion => 
      portion._id === portionId 
        ? { ...portion, price: parseFloat(price) || 0 }
        : portion
    ));
  };

  const toggleEditPortion = (portionId) => {
    setEditingPortions(prev => ({
      ...prev,
      [portionId]: !prev[portionId]
    }));
  };

  const handleSavePortions = async () => {
    setIsLoading(true);
    try {
      await onUpdatePortions(liquorItem._id, portions);
      setEditingPortions({});
    } catch (error) {
      console.error('Error updating portions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}L`;
    }
    return `${volume}ml`;
  };

  const getPortionIcon = (portion) => {
    if (portion.volume >= 750) return '🍾'; // Full/Half bottle
    if (portion.volume >= 100) return '🥃'; // Large shots
    return '🥃'; // Regular shots
  };

  if (!liquorItem) return null;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={
        <div className="flex items-center space-x-2">
          <FaWineBottle className="text-blue-600" />
          <span>{liquorItem.name} - Portion Management</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Liquor Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Brand:</span>
              <span className="ml-2">{liquorItem.brand}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 capitalize">{liquorItem.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Bottle Size:</span>
              <span className="ml-2">{formatVolume(liquorItem.bottleVolume)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Stock:</span>
              <span className="ml-2">{liquorItem.bottlesInStock} bottles</span>
            </div>
          </div>
        </div>

        {/* Portions List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span>Available Portions</span>
            <span className="ml-2 text-sm text-gray-500">({portions.length} portions)</span>
          </h3>
          
          {portions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaWineBottle className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No portions available for this liquor</p>
              {liquorItem.type === 'beer' && (
                <p className="text-sm mt-1">Beer items don't have portions</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {portions.map((portion) => (
                <div 
                  key={portion._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPortionIcon(portion)}</span>
                      <div>
                        <h4 className="font-medium text-gray-800">{portion.name}</h4>
                        <p className="text-sm text-gray-600">
                          Volume: {formatVolume(portion.volume)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {editingPortions[portion._id] ? (
                        <div className="flex items-center space-x-2">
                          <InputField
                            label="Price (LKR)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={portion.price}
                            onChange={(e) => handlePriceChange(portion._id, e.target.value)}
                            className="w-24"
                            placeholder="0.00"
                          />
                          <Button
                            onClick={() => toggleEditPortion(portion._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                            title="Save price"
                          >
                            <FaSave />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-green-600">
                            LKR {portion.price?.toFixed(2) || '0.00'}
                          </span>
                          <Button
                            onClick={() => toggleEditPortion(portion._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Edit price"
                          >
                            <FaEdit />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="inline mr-1" />
            Close
          </Button>
          
          {portions.length > 0 && (
            <Button
              onClick={handleSavePortions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="inline mr-1" />
                  Save All Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

LiquorPortionEditor.propTypes = {
  liquorItem: PropTypes.object,
  onUpdatePortions: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
