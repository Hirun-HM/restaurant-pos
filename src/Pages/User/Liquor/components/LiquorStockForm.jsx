import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InputField } from '../../../../components/InputField';
import SelectField from '../../../../components/SelectField';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import Modal from '../../../../components/Modal';

const LIQUOR_TYPES_FLAT = [
  // Single Hard Liquor option
  { value: 'hard_liquor', label: '🥃 Hard Liquor' },
  // Beer & Wine
  { value: 'beer', label: '🍺 Beer' },
  { value: 'wine', label: '🍷 Wine' },
  // Other Items
  { value: 'cigarettes', label: '🚬 Cigarettes' },
  { value: 'other', label: 'ℹ️ Other' }
];

// Hard liquor types that get portions and require bottle volume/alcohol %
const HARD_LIQUOR_TYPES = ['hard_liquor'];

// Types that need bottle volume (ONLY hard liquor now)
const BOTTLE_VOLUME_TYPES = ['hard_liquor'];

const BOTTLE_VOLUMES = [
  { value: 750, label: '750ml (Standard)' },
  { value: 1000, label: '1000ml (1 Liter)' }
];

export default function LiquorStockForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: '', // Start with empty type to force user selection
    bottleVolume: 750,
    bottlesInStock: 0,
    pricePerBottle: '',
    buyingPrice: '', // New field for buying price
    minimumBottles: 0,
    alcoholPercentage: '',
    customBottleVolume: '' // For custom bottle volume input
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        brand: item.brand || '',
        type: item.type || '',
        bottleVolume: item.bottleVolume || 750,
        bottlesInStock: item.bottlesInStock || 0,
        pricePerBottle: item.pricePerBottle || '',
        buyingPrice: item.buyingPrice || '', // Add buying price
        minimumBottles: item.minimumBottles || 2,
        alcoholPercentage: item.alcoholPercentage || '',
        customBottleVolume: ''
      });
    }
  }, [item]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Item type is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.pricePerBottle || formData.pricePerBottle <= 0) {
      newErrors.pricePerBottle = 'Valid price per bottle is required';
    }

    if (!formData.buyingPrice || formData.buyingPrice <= 0) {
      newErrors.buyingPrice = 'Valid buying price is required';
    }

    // Validate that selling price is higher than buying price
    if (formData.pricePerBottle && formData.buyingPrice && 
        parseFloat(formData.pricePerBottle) <= parseFloat(formData.buyingPrice)) {
      newErrors.pricePerBottle = 'Selling price must be higher than buying price';
    }

    if (formData.bottlesInStock < 0) {
      newErrors.bottlesInStock = 'Items in stock cannot be negative';
    }

    if (formData.minimumBottles < 0) {
      newErrors.minimumBottles = 'Minimum items cannot be negative';
    }

    // Only validate alcohol percentage for hard liquor
    if (HARD_LIQUOR_TYPES.includes(formData.type)) {
      if (formData.alcoholPercentage && (formData.alcoholPercentage < 0 || formData.alcoholPercentage > 100)) {
        newErrors.alcoholPercentage = 'Alcohol percentage must be between 0-100';
      }
    }

    // Validate custom bottle volume if selected (only for types that need bottle volume)
    if (BOTTLE_VOLUME_TYPES.includes(formData.type)) {
      if (formData.bottleVolume === 'custom' && (!formData.customBottleVolume || formData.customBottleVolume < 100)) {
        newErrors.customBottleVolume = 'Custom volume must be at least 100ml';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper functions to determine what fields to show
  const isHardLiquor = () => HARD_LIQUOR_TYPES.includes(formData.type);
  const needsBottleVolume = () => BOTTLE_VOLUME_TYPES.includes(formData.type);
  const isCigarettes = () => formData.type === 'cigarettes';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine final bottle volume
      const finalBottleVolume = formData.bottleVolume === 'custom' 
        ? parseInt(formData.customBottleVolume)
        : formData.bottleVolume;

      const submitData = {
        ...formData,
        bottleVolume: needsBottleVolume() ? finalBottleVolume : undefined,
        pricePerBottle: parseFloat(formData.pricePerBottle),
        buyingPrice: parseFloat(formData.buyingPrice), // Add buying price
        bottlesInStock: parseInt(formData.bottlesInStock),
        minimumBottles: parseInt(formData.minimumBottles),
        alcoholPercentage: isHardLiquor() && formData.alcoholPercentage ? parseFloat(formData.alcoholPercentage) : undefined
      };

      // Remove empty optional fields and custom volume field
      if (!submitData.alcoholPercentage) delete submitData.alcoholPercentage;
      if (!needsBottleVolume()) delete submitData.bottleVolume;
      delete submitData.customBottleVolume;
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save liquor item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    if (item) {
      return 'Update Stock';
    }
    return 'Add to Stock';
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={item ? "Edit Stock Item" : "Add New Stock Item"} size="xl">
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Header Information Card */}
          <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border border-yellow-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Item Details</h3>
                <p className="text-gray-600 text-sm">Complete the information below to manage your stock item</p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
              <span className="text-lg">ℹ️</span>
              <h4 className="text-lg font-semibold text-gray-800">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Item Name"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Jack Daniels, Marlboro Red"
                error={errors.name}
                required
              />

              <InputField
                label="Brand"
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="e.g., Jack Daniels, Marlboro"
                error={errors.brand}
                required
              />

              <div className="md:col-span-2">
                <SelectField
                  label="Item Type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  options={LIQUOR_TYPES_FLAT}
                  placeholder="Select item type"
                  error={errors.type}
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Specifications Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
              <span className="text-lg">⚙️</span>
              <h4 className="text-lg font-semibold text-gray-800">Product Specifications</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Show bottle volume only for items that need it (not cigarettes) */}
              {needsBottleVolume() && (
                <>
                  <SelectField
                    label="Bottle Volume"
                    value={formData.bottleVolume}
                    onChange={(e) => handleInputChange('bottleVolume', parseInt(e.target.value) || e.target.value)}
                    options={[
                      ...BOTTLE_VOLUMES,
                      { value: 'custom', label: 'Custom Volume' }
                    ]}
                    placeholder="Select bottle volume"
                    error={errors.bottleVolume}
                    required
                  />

                  {/* Custom volume input */}
                  {formData.bottleVolume === 'custom' && (
                    <InputField
                      label="Custom Volume (ml)"
                      id="customBottleVolume"
                      type="number"
                      min="100"
                      max="5000"
                      step="50"
                      value={formData.customBottleVolume}
                      onChange={(e) => handleInputChange('customBottleVolume', e.target.value)}
                      placeholder="e.g., 500"
                      error={errors.customBottleVolume}
                      required
                    />
                  )}
                </>
              )}

              {/* Show alcohol percentage only for hard liquor */}
              {isHardLiquor() && (
                <InputField
                  label="Alcohol Percentage"
                  id="alcoholPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.alcoholPercentage}
                  onChange={(e) => handleInputChange('alcoholPercentage', e.target.value)}
                  placeholder="e.g., 40"
                  error={errors.alcoholPercentage}
                  required
                />
              )}
            </div>
          </div>

          {/* Stock & Pricing Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
              <span className="text-lg">💰</span>
              <h4 className="text-lg font-semibold text-gray-800">Stock & Pricing</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <InputField
                label={`Buying Price per ${isCigarettes() ? 'Pack' : 'Bottle'}`}
                id="buyingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.buyingPrice}
                onChange={(e) => handleInputChange('buyingPrice', e.target.value)}
                placeholder="35.00"
                error={errors.buyingPrice}
                required
              />

              <InputField
                label={`Selling Price per ${isCigarettes() ? 'Pack' : 'Bottle'}`}
                id="pricePerBottle"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerBottle}
                onChange={(e) => handleInputChange('pricePerBottle', e.target.value)}
                placeholder="45.99"
                error={errors.pricePerBottle}
                required
              />

              <InputField
                label={`${isCigarettes() ? 'Packs' : 'Bottles'} in Stock`}
                id="bottlesInStock"
                type="text"
                value={formData.bottlesInStock}
                onChange={(e) => handleInputChange('bottlesInStock', parseInt(e.target.value) || 0)}
                error={errors.bottlesInStock}
                required
              />

              <InputField
                label={`Minimum ${isCigarettes() ? 'Packs' : 'Bottles'}`}
                id="minimumBottles"
                type="text"
                value={formData.minimumBottles}
                onChange={(e) => handleInputChange('minimumBottles', parseInt(e.target.value) || 0)}
                error={errors.minimumBottles}
                required
              />
            </div>
          </div>

          {/* Information panel based on item type - only show when type is selected */}
          {formData.type && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-lg">
                    {isHardLiquor() && '🥃'}
                    {(formData.type === 'beer' || formData.type === 'wine') && '🍺'}
                    {isCigarettes() && '🚬'}
                    {formData.type === 'other' && 'ℹ️'}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-yellow-800">
                  {isHardLiquor() && 'Hard Liquor Configuration'}
                  {(formData.type === 'beer' || formData.type === 'wine') && 'Beer/Wine Configuration'}
                  {isCigarettes() && 'Cigarettes Configuration'}
                  {formData.type === 'other' && 'Other Item Configuration'}
                </h4>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {isHardLiquor() && 'This item will have standard portions (25ml, 50ml, 75ml, 100ml, quarter, half, full bottle) automatically generated. Cashiers can set individual prices for each portion.'}
                  {(formData.type === 'beer' || formData.type === 'wine') && 'This item will be sold as whole bottles only. No portion pricing or bottle volume configuration needed.'}
                  {isCigarettes() && 'This item will be sold as individual packs. No bottle volume or alcohol percentage is required.'}
                  {formData.type === 'other' && 'This is a miscellaneous item that will be sold as whole units.'}
                </p>
                
                {/* Show which fields are required for this type */}
                <div className="flex items-center gap-2 text-xs bg-yellow-100 rounded-lg px-3 py-2">
                  <span className="font-semibold text-yellow-800">Required fields:</span>
                  <span className="text-yellow-700">
                    Name, Brand, Price, Stock
                    {needsBottleVolume() && ', Volume'}
                    {isHardLiquor() && ', Alcohol Percentage'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Show field preview when no type is selected */}
          {!formData.type && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-gray-600 font-medium mb-2">Select an Item Type</p>
              <p className="text-sm text-gray-500">
                Choose an item type above to see the relevant configuration fields
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <div className="flex justify-end gap-4">
              <SecondaryButton
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-8 py-3"
              >
                Cancel
              </SecondaryButton>
              
              <PrimaryButton
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  getSubmitButtonText()
                )}
              </PrimaryButton>
            </div>
          </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
      </form>
      </div>
    </Modal>
  );
}

LiquorStockForm.propTypes = {
  item: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
