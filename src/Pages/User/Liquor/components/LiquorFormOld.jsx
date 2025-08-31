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
      const initialPortions = generateStandardPortions(750); // Default to 750ml
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

    // For non-beer items, portions are required
    if (formData.type !== 'beer' && (!formData.portions || formData.portions.length === 0)) {
      newErrors.portions = 'At least one portion is required for liquor items (except beer)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePortionChange = (index, field, value) => {
    const newPortions = [...formData.portions];
    newPortions[index] = {
      ...newPortions[index],
      [field]: value
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
        portions: formData.portions.map(portion => ({
          ...portion,
          volume: parseFloat(portion.volume),
          price: parseFloat(portion.price)
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={item ? 'Edit Liquor Item' : 'Add New Liquor Item'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Name *"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter liquor name"
          />

          <InputField
            label="Brand *"
            name="brand"
            value={formData.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            error={errors.brand}
            placeholder="Enter brand name"
          />

          <SelectField
            label="Type *"
            name="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            options={LIQUOR_TYPES}
            error={errors.type}
          />

          <SelectField
            label="Bottle Volume *"
            name="bottleVolume"
            value={formData.bottleVolume}
            onChange={(e) => handleInputChange('bottleVolume', parseInt(e.target.value))}
            options={BOTTLE_VOLUMES}
            error={errors.bottleVolume}
          />

          <InputField
            label="Price per Bottle *"
            name="pricePerBottle"
            type="number"
            step="0.01"
            min="0"
            value={formData.pricePerBottle}
            onChange={(e) => handleInputChange('pricePerBottle', e.target.value)}
            error={errors.pricePerBottle}
            placeholder="0.00"
          />

          <InputField
            label="Bottles in Stock"
            name="bottlesInStock"
            type="number"
            min="0"
            value={formData.bottlesInStock}
            onChange={(e) => handleInputChange('bottlesInStock', parseInt(e.target.value) || 0)}
            error={errors.bottlesInStock}
            placeholder="0"
          />

          <InputField
            label="Minimum Stock Level"
            name="minimumBottles"
            type="number"
            min="0"
            value={formData.minimumBottles}
            onChange={(e) => handleInputChange('minimumBottles', parseInt(e.target.value) || 0)}
            error={errors.minimumBottles}
            placeholder="2"
          />

          <InputField
            label="Alcohol Percentage"
            name="alcoholPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.alcoholPercentage}
            onChange={(e) => handleInputChange('alcoholPercentage', e.target.value)}
            error={errors.alcoholPercentage}
            placeholder="40.0"
          />

          <InputField
            label="Supplier"
            name="supplier"
            value={formData.supplier}
            onChange={(e) => handleInputChange('supplier', e.target.value)}
            error={errors.supplier}
            placeholder="Enter supplier name"
          />
        </div>

        <InputField
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          placeholder="Enter description (optional)"
          rows={3}
        />

        {/* Portions Section */}
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
              {formData.portions.map((portion, index) => {
                const portionKey = portion._id || `portion-${index}`;
                return (
                  <div key={portionKey} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{portion.name}</div>
                      <div className="text-sm text-gray-500">{portion.volume}ml</div>
                    </div>
                    <div className="flex-1">
                      <InputField
                        label={index === 0 ? "Price (LKR)" : ""}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={portion.price || ''}
                        onChange={(e) => handlePortionChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="mb-0"
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {formData.portions.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No portions added yet. Click "Add Portion" to get started.</p>
                </div>
              )}
            </div>
          </div>
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
  onCancel: PropTypes.func.isRequired
};
