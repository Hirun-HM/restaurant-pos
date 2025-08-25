import React, { useState, useEffect } from 'react';
import { InputField } from '../../../components/InputField';
import Select from '../../../components/Select';
import { PrimaryButton, SecondaryButton } from '../../../components/Button';
import { validateForm } from '../../../core/validattion';

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

    const existingItemOptions = existingItems.map(item => ({
        value: item.id?.toString() || '',
        label: `${item.name || 'Unknown'} (${item.category || 'No category'})`
    }));

    useEffect(() => {
        if (editingItem) {
            setFormData({
                mode: 'update',
                selectedItemId: editingItem.id?.toString() || '',
                name: editingItem.name || '',
                category: editingItem.category || '',
                quantity: '', // Always start with empty quantity for updates
                unit: editingItem.unit || '',
                price: editingItem.price ? editingItem.price.toString() : ''
            });
            // Clear any existing errors when editing
            setErrors({});
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
        const selectedItem = existingItems.find(item => item.id.toString() === itemId);
        
        if (selectedItem) {
            setFormData({
                ...formData,
                selectedItemId: itemId,
                name: selectedItem.name || '',
                category: selectedItem.category || '',
                quantity: '',
                unit: selectedItem.unit || '',
                price: selectedItem.price ? selectedItem.price.toString() : ''
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const validated = validateForm(formData, setErrors);
        
        if (validated) {
            const submissionData = {
                mode: formData.mode,
                id: formData.mode === 'update' ? (formData.selectedItemId ? parseInt(formData.selectedItemId) : null) : null,
                name: formData.name.trim(),
                category: formData.category,
                quantity: parseInt(formData.quantity) || 0,
                unit: formData.unit,
                price: parseFloat(formData.price) || 0
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
                <div className='w-full md:w-1/2 grid grid-cols-2 gap-4'>
                    {/* Mode Selection */}
                    {!editingItem && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Action <span className="text-red">*</span>
                            </label>
                            
                                <Select
                                    value={formData.mode}
                                    onChange={handleModeChange}
                                    options={[
                                        { value: 'new', label: 'Add New Item' },
                                        { value: 'update', label: 'Update Existing Item' }
                                    ]}
                                />
                            
                        </div>
                    )}

                    {/* Existing Item Selection */}
                    {formData.mode === 'update' && !editingItem && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Item to Update <span className="text-red">*</span>
                            </label>
                            <Select
                                value={formData.selectedItemId}
                                onChange={handleExistingItemSelect}
                                options={[
                                    { value: '', label: 'Choose an existing item' },
                                    ...existingItemOptions
                                ]}
                            />
                            {errors.selectedItemId && <p className="mt-1 text-sm text-red">{errors.selectedItemId}</p>}
                        </div>
                    )}
                </div>

                {/* Item Details */}
                <div className="w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Item Name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter item name"
                        required
                        error={errors.name}
                        disabled={editingItem ? true : (formData.mode === 'update' && formData.selectedItemId)}
                    />

                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red">*</span>
                        </label>
                        <Select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            options={[
                                { value: '', label: 'Select category' },
                                ...categories
                            ]}
                            isDisabled={editingItem ? true : (formData.mode === 'update' && formData.selectedItemId)}
                        />
                        {errors.category && <p className="mt-1 text-sm text-red">{errors.category}</p>}
                    </div>
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

                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit <span className="text-red">*</span>
                        </label>
                        <Select
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            options={[
                                { value: '', label: 'Select unit' },
                                ...units
                            ]}
                            isDisabled={editingItem ? true : (formData.mode === 'update' && formData.selectedItemId)}
                        />
                        {errors.unit && <p className="mt-1 text-sm text-red">{errors.unit}</p>}
                    </div>

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
