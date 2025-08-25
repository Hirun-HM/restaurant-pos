import React, { useState, useEffect } from 'react';
import { InputField } from './InputField';
import SelectField from './SelectField';
import { PrimaryButton, SecondaryButton } from './Button';

export default function StockForm({ 
    existingItems = [], 
    editingItem = null, 
    onSubmit, 
    onCancel 
}) {
    const [formData, setFormData] = useState({
        mode: 'new', // 'new' or 'update'
        selectedItemId: '',
        name: '',
        category: '',
        quantity: '',
        unit: '',
        price: ''
    });

    const [errors, setErrors] = useState({});

    const categories = [
        { value: 'food', label: 'Food Items' },
        { value: 'drinks', label: 'Drinks & Beverages' },
        { value: 'ingredients', label: 'Ingredients' },
        { value: 'supplies', label: 'Kitchen Supplies' }
    ];

    const units = [
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'g', label: 'Grams (g)' },
        { value: 'l', label: 'Liters (l)' },
        { value: 'ml', label: 'Milliliters (ml)' },
        { value: 'pcs', label: 'Pieces (pcs)' },
        { value: 'box', label: 'Boxes' },
        { value: 'bottle', label: 'Bottles' }
    ];

    const existingItemOptions = existingItems.map(item => ({
        value: item.id,
        label: `${item.name} (${item.category})`
    }));

    useEffect(() => {
        if (editingItem) {
            setFormData({
                mode: 'update',
                selectedItemId: editingItem.id,
                name: editingItem.name,
                category: editingItem.category,
                quantity: editingItem.quantity.toString(),
                unit: editingItem.unit,
                price: editingItem.price.toString()
            });
        }
    }, [editingItem]);

    const handleModeChange = (e) => {
        const mode = e.target.value;
        setFormData({
            ...formData,
            mode,
            selectedItemId: '',
            name: '',
            category: '',
            quantity: '',
            unit: '',
            price: ''
        });
        setErrors({});
    };

    const handleExistingItemSelect = (e) => {
        const itemId = e.target.value;
        const selectedItem = existingItems.find(item => item.id === parseInt(itemId));
        
        if (selectedItem) {
            setFormData({
                ...formData,
                selectedItemId: itemId,
                name: selectedItem.name,
                category: selectedItem.category,
                quantity: '',
                unit: selectedItem.unit,
                price: selectedItem.price.toString()
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (formData.mode === 'update' && !formData.selectedItemId) {
            newErrors.selectedItemId = 'Please select an item to update';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Item name is required';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.quantity || formData.quantity <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }

        if (!formData.unit) {
            newErrors.unit = 'Unit is required';
        }

        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Price must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            const submissionData = {
                mode: formData.mode,
                id: formData.mode === 'update' ? parseInt(formData.selectedItemId) : null,
                name: formData.name.trim(),
                category: formData.category,
                quantity: parseInt(formData.quantity),
                unit: formData.unit,
                price: parseFloat(formData.price)
            };

            onSubmit(submissionData);
            
            // Reset form
            setFormData({
                mode: 'new',
                selectedItemId: '',
                name: '',
                category: '',
                quantity: '',
                unit: '',
                price: ''
            });
            setErrors({});
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingItem ? 'Update Stock Item' : 'Stock Management'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mode Selection */}
                {!editingItem && (
                    <SelectField
                        label="Action"
                        value={formData.mode}
                        onChange={handleModeChange}
                        options={[
                            { value: 'new', label: 'Add New Item' },
                            { value: 'update', label: 'Update Existing Item' }
                        ]}
                        required
                    />
                )}

                {/* Existing Item Selection */}
                {formData.mode === 'update' && !editingItem && (
                    <SelectField
                        label="Select Item to Update"
                        value={formData.selectedItemId}
                        onChange={handleExistingItemSelect}
                        options={existingItemOptions}
                        placeholder="Choose an existing item"
                        required
                        error={errors.selectedItemId}
                    />
                )}

                {/* Item Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Item Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter item name"
                        required
                        error={errors.name}
                        disabled={formData.mode === 'update' && formData.selectedItemId}
                    />

                    <SelectField
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        options={categories}
                        placeholder="Select category"
                        required
                        error={errors.category}
                        disabled={formData.mode === 'update' && formData.selectedItemId}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label={formData.mode === 'update' ? 'Add Quantity' : 'Quantity'}
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0"
                        min="1"
                        required
                        error={errors.quantity}
                    />

                    <SelectField
                        label="Unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        options={units}
                        placeholder="Select unit"
                        required
                        error={errors.unit}
                        disabled={formData.mode === 'update' && formData.selectedItemId}
                    />

                    <InputField
                        label="Price per Unit"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        error={errors.price}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <PrimaryButton type="submit">
                        {formData.mode === 'new' ? 'Add Item' : 'Update Stock'}
                    </PrimaryButton>
                    {onCancel && (
                        <SecondaryButton type="button" onClick={onCancel}>
                            Cancel
                        </SecondaryButton>
                    )}
                </div>
            </form>
        </div>
    );
}
