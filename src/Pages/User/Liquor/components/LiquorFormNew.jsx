import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InputField } from '../../../../components/InputField';
import SelectField from '../../../../components/SelectField';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';

const LIQUOR_TYPES = [
  { value: 'whiskey', label: 'Whiskey' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'rum', label: 'Rum' },
  { value: 'gin', label: 'Gin' },
  { value: 'brandy', label: 'Brandy' },
  { value: 'tequila', label: 'Tequila' },
  { value: 'beer', label: 'Beer' },
  { value: 'wine', label: 'Wine' },
  { value: 'other', label: 'Other' }
];

const BOTTLE_VOLUMES = [
  { value: 750, label: '750ml (Standard)' },
  { value: 1000, label: '1000ml (1 Liter)' }
];

// Generate standard portions for a bottle volume
const generateStandardPortions = (bottleVolume) => {
  return [
    { name: '25ml Shot', volume: 25, price: 0 },
    { name: '50ml Shot', volume: 50, price: 0 },
    { name: '75ml Shot', volume: 75, price: 0 },
    { name: '100ml Shot', volume: 100, price: 0 },
    { name: 'Quarter Bottle', volume: bottleVolume / 4, price: 0 },
    { name: 'Half Bottle', volume: bottleVolume / 2, price: 0 },
    { name: 'Full Bottle', volume: bottleVolume, price: 0 }
  ];
};

export default function LiquorForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'whiskey',
    bottleVolume: 750,
    bottlesInStock: 0,
    pricePerBottle: '',
    minimumBottles: 2,
    supplier: '',
    alcoholPercentage: '',
    description: '',
    portions: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        mode: 'edit',
        id: item._id,
        name: item.name || '',
        brand: item.brand || '',
        type: item.type || 'whiskey',
        bottleVolume: item.bottleVolume || 750,
        bottlesInStock: item.bottlesInStock || 0,
        pricePerBottle: item.pricePerBottle?.toString() || '',
        minimumBottles: item.minimumBottles || 2,
        supplier: item.supplier || '',
        alcoholPercentage: item.alcoholPercentage?.toString() || '',
        description: item.description || '',
        portions: item.portions || []
      });
    } else {
      const initialPortions = generateStandardPortions(750);
      setFormData({
        mode: 'new',
        name: '',
        brand: '',
        type: 'whiskey',
        bottleVolume: 750,
        bottlesInStock: 0,
        pricePerBottle: '',
        minimumBottles: 2,
        supplier: '',
        alcoholPercentage: '',
        description: '',
        portions: initialPortions
      });
    }
    setErrors({});
  }, [item]);

  // Auto-generate portions when bottle volume changes for new items
  useEffect(() => {
    if (formData.mode === 'new' && formData.type !== 'beer') {
      const newPortions = generateStandardPortions(formData.bottleVolume);
      setFormData(prev => ({
        ...prev,
        portions: newPortions
      }));
    }
  }, [formData.bottleVolume, formData.type]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.pricePerBottle || parseFloat(formData.pricePerBottle) <= 0) {
      newErrors.pricePerBottle = 'Price per bottle must be greater than 0';
    }

    if (formData.bottlesInStock < 0) {
      newErrors.bottlesInStock = 'Bottles in stock cannot be negative';
    }

    if (formData.minimumBottles < 0) {
      newErrors.minimumBottles = 'Minimum bottles cannot be negative';
    }

    if (formData.alcoholPercentage && (parseFloat(formData.alcoholPercentage) < 0 || parseFloat(formData.alcoholPercentage) > 100)) {
      newErrors.alcoholPercentage = 'Alcohol percentage must be between 0 and 100';
    }

    // For non-beer items, validate portion prices
    if (formData.type !== 'beer') {
      const invalidPortions = formData.portions.filter(portion => 
        !portion.price || parseFloat(portion.price) <= 0
      );
      if (invalidPortions.length > 0) {
        newErrors.portions = 'All portion prices must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handlePortionPriceChange = (index, price) => {
    const newPortions = [...formData.portions];
    newPortions[index] = {
      ...newPortions[index],
      price: parseFloat(price) || 0
    };
    setFormData(prev => ({
      ...prev,
      portions: newPortions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        pricePerBottle: parseFloat(formData.pricePerBottle),
        bottlesInStock: parseInt(formData.bottlesInStock),
        minimumBottles: parseInt(formData.minimumBottles),
        alcoholPercentage: formData.alcoholPercentage ? parseFloat(formData.alcoholPercentage) : undefined,
        portions: formData.type === 'beer' ? [] : formData.portions.map(portion => ({
          ...portion,
          price: parseFloat(portion.price)
        }))
      };

      // Remove empty optional fields
      if (!submitData.supplier) delete submitData.supplier;
      if (!submitData.description) delete submitData.description;
      if (!submitData.alcoholPercentage) delete submitData.alcoholPercentage;

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save liquor item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={item ? "Edit Liquor Item" : "Add New Liquor Item"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Liquor Name"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Jack Daniels"
            error={errors.name}
            required
          />

          <InputField
            label="Brand"
            id="brand"
            value={formData.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            placeholder="e.g., Jack Daniels"
            error={errors.brand}
            required
          />

          <SelectField
            label="Liquor Type"
            id="type"
            value={formData.type}
            onChange={(value) => handleInputChange('type', value)}
            error={errors.type}
            required
          >
            {LIQUOR_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </SelectField>

          <SelectField
            label="Bottle Volume"
            id="bottleVolume"
            value={formData.bottleVolume}
            onChange={(value) => handleInputChange('bottleVolume', parseInt(value))}
            error={errors.bottleVolume}
            required
          >
            {BOTTLE_VOLUMES.map(vol => (
              <option key={vol.value} value={vol.value}>{vol.label}</option>
            ))}
          </SelectField>

          <InputField
            label="Price per Bottle (Rs.)"
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
            label="Bottles in Stock"
            id="bottlesInStock"
            type="number"
            min="0"
            value={formData.bottlesInStock}
            onChange={(e) => handleInputChange('bottlesInStock', parseInt(e.target.value) || 0)}
            error={errors.bottlesInStock}
            required
          />

          <InputField
            label="Minimum Bottles"
            id="minimumBottles"
            type="number"
            min="0"
            value={formData.minimumBottles}
            onChange={(e) => handleInputChange('minimumBottles', parseInt(e.target.value) || 0)}
            error={errors.minimumBottles}
            required
          />

          <InputField
            label="Alcohol Percentage"
            id="alcoholPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.alcoholPercentage}
            onChange={(e) => handleInputChange('alcoholPercentage', e.target.value)}
            placeholder="40"
            error={errors.alcoholPercentage}
          />
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <InputField
            label="Supplier (Optional)"
            id="supplier"
            value={formData.supplier}
            onChange={(e) => handleInputChange('supplier', e.target.value)}
            placeholder="Supplier name"
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional details about this liquor..."
            />
          </div>
        </div>

        {/* Standard Portions Section */}
        {formData.type !== 'beer' && (
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Standard Portion Prices</h3>
              <p className="text-sm text-gray-600">Set prices for each standard portion size</p>
            </div>

            {errors.portions && (
              <div className="text-red-600 text-sm mb-4">{errors.portions}</div>
            )}

            <div className="space-y-3">
              {formData.portions.map((portion, index) => (
                <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">{portion.name}</div>
                    <div className="text-sm text-gray-500">{portion.volume}ml</div>
                  </div>
                  <div className="flex-1">
                    <InputField
                      label={index === 0 ? "Price (Rs.)" : ""}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={portion.price || ''}
                      onChange={(e) => handlePortionPriceChange(index, e.target.value)}
                      className="mb-0"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="text-red-600 text-sm">{errors.submit}</div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : item ? 'Update Liquor' : 'Add Liquor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

LiquorForm.propTypes = {
  item: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
