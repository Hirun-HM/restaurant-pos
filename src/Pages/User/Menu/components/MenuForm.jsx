import React, { useState, useCallback, memo, useMemo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { InputField } from '../../../../components/InputField';
import Select from '../../../../components/Select';

// Memoize categories array to prevent recreation
const categories = [
    { value: 'Foods', label: 'Foods' },
    { value: 'Liquor', label: 'Liquor' },
    { value: 'Cigarettes', label: 'Cigarettes' },
    { value: 'Bites', label: 'Bites' },
    { value: 'Others', label: 'Others' }
];

export default memo(function MenuForm({ item, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        price: item?.price || '',
        category: item?.category || 'Foods',
        description: item?.description || '',
        volume: item?.volume || 750,
        unitsPerPack: item?.unitsPerPack || 20,
        portionTracking: item?.portionTracking || false,
        stockId: item?.stockId || ''
    });
    
    const [errors, setErrors] = useState({});
    
    const handleInputChange = useCallback((name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [errors]);
    
    const validateForm = useCallback(() => {
        const newErrors = {};

        // Validate required fields
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.price) {
            newErrors.price = 'Price is required';
        } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
            newErrors.price = 'Price must be a valid positive number';
        }
        
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 5) {
            newErrors.description = 'Description must be at least 5 characters';
        }

        // Category-specific validation
        if (formData.category === 'Liquor') {
            if (!formData.volume || formData.volume <= 0) {
                newErrors.volume = 'Valid volume in milliliters is required';
            }
        }

        if (formData.category === 'Cigarettes') {
            if (!formData.unitsPerPack || formData.unitsPerPack <= 0) {
                newErrors.unitsPerPack = 'Valid number of units per pack is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);
    
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        if (validateForm()) {
            const submitData = {
                ...formData,
                name: formData.name.trim(),
                price: Number(formData.price),
                description: formData.description.trim()
            };
            onSubmit(submitData);
        }
    }, [formData, validateForm, onSubmit]);
    
    // Memoize preview component to prevent unnecessary re-renders
    const previewComponent = useMemo(() => {
        if (!formData.name || !formData.price) return null;
        
        return (
            <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-gray-800">{formData.name}</h4>
                    <p className="text-sm text-gray-600">{formData.category}</p>
                    <p className="text-xs text-gray-500 mt-1">{formData.description}</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="font-medium text-gray-800">LKR {formData.price}</span>
                        <span className="text-xs bg-primaryColor text-white px-2 py-1 rounded">
                            {formData.category}
                        </span>
                    </div>
                </div>
            </div>
        );
    }, [formData.name, formData.price, formData.category, formData.description]);
    
    return (
        <div className="p-6">
            <div className="mb-6">
                <p className="text-gray-600">
                    {item ? 'Update the details of this menu item' : 'Fill in the details to add a new item to the menu'}
                </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item Name */}
                    <div>
                        <InputField
                            label="Item Name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter item name"
                            error={errors.name}
                            required
                        />
                    </div>
                    
                    {/* Price */}
                    <div>
                        <InputField
                            label="Price (LKR)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                            placeholder="Enter price"
                            error={errors.price}
                            required
                        />
                    </div>
                </div>
                
                {/* Category */}
                <div>
                    <Select
                        label="Category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        options={categories}
                        error={errors.category}
                        required
                    />
                </div>

                {/* Liquor-specific fields */}
                {formData.category === 'Liquor' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Volume (ml) <span className="text-red-500">*</span>
                        </label>
                        <InputField
                            type="number"
                            name="volume"
                            value={formData.volume}
                            onChange={(e) => handleInputChange('volume', e.target.value)}
                            placeholder="Enter volume in ml"
                            error={errors.volume}
                            required
                        />
                    </div>
                )}

                {/* Cigarette-specific fields */}
                {formData.category === 'Cigarettes' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Units Per Pack <span className="text-red-500">*</span>
                        </label>
                        <InputField
                            type="number"
                            name="unitsPerPack"
                            value={formData.unitsPerPack}
                            onChange={(e) => handleInputChange('unitsPerPack', e.target.value)}
                            placeholder="Enter units per pack"
                            error={errors.unitsPerPack}
                            required
                        />
                    </div>
                )}
                
                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter item description"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primaryColor focus:border-primaryColor focus:outline-none resize-none ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        style={{ 
                            borderColor: errors.description ? '#ef4444' : '#d1d5db',
                            outline: 'none'
                        }}
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                </div>
                
                {/* Preview */}
                {previewComponent}
                
                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                    <PrimaryButton type="submit" className="flex-1">
                        {item ? 'Update Item' : 'Add Item'}
                    </PrimaryButton>
                    <SecondaryButton type="button" onClick={onCancel} className="flex-1">
                        Cancel
                    </SecondaryButton>
                </div>
            </form>
        </div>
    );
});
