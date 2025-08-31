import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/Modal';
import { InputField } from '../../../../components/InputField';
import Button from '../../../../components/Button';

export default function LiquorStockManager({ 
  liquorItem, 
  onClose, 
  onAddBottles, 
  onConsumeLiquor 
}) {
  const [addBottlesCount, setAddBottlesCount] = useState('');
  const [consumeVolume, setConsumeVolume] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBottles = async (e) => {
    e.preventDefault();
    const bottles = parseInt(addBottlesCount);
    if (!bottles || bottles <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBottles(bottles);
      setAddBottlesCount('');
    } catch (error) {
      console.error('Error adding bottles:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsumeLiquor = async (e) => {
    e.preventDefault();
    const volume = parseFloat(consumeVolume);
    if (!volume || volume <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConsumeLiquor(volume);
      setConsumeVolume('');
    } catch (error) {
      console.error('Error consuming liquor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLowStock = liquorItem.bottlesInStock <= liquorItem.minimumBottles;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Stock Management - ${liquorItem.name}`}
      size="large"
    >
      <div className="space-y-6">
        {/* Current Stock Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Stock Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{liquorItem.bottlesInStock}</div>
              <div className="text-sm text-gray-600">Bottles in Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(liquorItem.totalVolumeRemaining || 0)}ml
              </div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(liquorItem.currentBottleVolume || 0)}ml
              </div>
              <div className="text-sm text-gray-600">Current Bottle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(liquorItem.totalSoldVolume || 0)}ml
              </div>
              <div className="text-sm text-gray-600">Total Sold</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {Math.round(liquorItem.wastedVolume || 0)}ml
              </div>
              <div className="text-sm text-gray-600">Total Wasted</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">
                {liquorItem.minimumBottles}
              </div>
              <div className="text-sm text-gray-600">Minimum Stock</div>
            </div>
          </div>

          {/* Stock Alert */}
          {isLowStock && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Low Stock Alert</p>
                  <p className="text-sm text-red-700">
                    Stock is below minimum level. Consider reordering soon.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Bottles Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Bottles to Stock</h3>
          <form onSubmit={handleAddBottles} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <InputField
                  label="Number of Bottles"
                  type="number"
                  min="1"
                  value={addBottlesCount}
                  onChange={(value) => setAddBottlesCount(value)}
                  placeholder="Enter number of bottles to add"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !addBottlesCount}>
                {isSubmitting ? 'Adding...' : 'Add Bottles'}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Each bottle contains {liquorItem.bottleVolume}ml. Adding {addBottlesCount || 0} bottles will add{' '}
              {(parseInt(addBottlesCount) || 0) * liquorItem.bottleVolume}ml to your stock.
            </div>
          </form>
        </div>

        {/* Manual Consumption Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Volume Consumption</h3>
          <form onSubmit={handleConsumeLiquor} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <InputField
                  label="Volume to Consume (ml)"
                  type="number"
                  min="1"
                  max={liquorItem.totalVolumeRemaining}
                  value={consumeVolume}
                  onChange={(value) => setConsumeVolume(value)}
                  placeholder="Enter volume in milliliters"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !consumeVolume}>
                {isSubmitting ? 'Consuming...' : 'Consume Volume'}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Use this for manual adjustments, spills, or testing. Maximum available: {Math.round(liquorItem.totalVolumeRemaining || 0)}ml
            </div>
          </form>
        </div>

        {/* Bottle Breakdown */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Breakdown</h3>
          <div className="space-y-3">
            {liquorItem.bottlesInStock > 1 && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Full Bottles</span>
                <span className="font-medium text-green-700">
                  {liquorItem.bottlesInStock - 1} × {liquorItem.bottleVolume}ml = {(liquorItem.bottlesInStock - 1) * liquorItem.bottleVolume}ml
                </span>
              </div>
            )}
            {liquorItem.bottlesInStock > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Current Bottle</span>
                <span className="font-medium text-blue-700">
                  {Math.round(liquorItem.currentBottleVolume || 0)}ml remaining
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Available</span>
              <span className="font-bold text-gray-900">
                {Math.round(liquorItem.totalVolumeRemaining || 0)}ml
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

LiquorStockManager.propTypes = {
  liquorItem: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddBottles: PropTypes.func.isRequired,
  onConsumeLiquor: PropTypes.func.isRequired
};
