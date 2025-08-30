import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InputField } from '../../../../components/InputField';
import Select from '../../../../components/Select';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { validateLiquorForm } from '../../../../core/liquorValidation';

// Memoized static configuration data
const liquorCategories = [
    { value: 'beer', label: 'Beer' },
    { value: 'hard_liquor', label: 'Hard Liquor' },
    { value: 'cigarette', label: 'Cigarette' }
];

const cigaretteTypes = [
    { value: 'dunhill_blue', label: 'Dunhill Blue' },
    { value: 'dunhill_tube', label: 'Dunhill Tube' },
    { value: 'john_player_gold_leaf_20', label: 'John Player Gold Leaf (20\'s)' },
    { value: 'john_player_gold_leaf_12', label: 'John Player Gold Leaf (12\'s)' },
    { value: 'john_player_gold_pro', label: 'John Player Gold Pro' }
];

const units = [
    { value: 'bottle', label: 'Bottles' },
    { value: 'can', label: 'Cans' },
    { value: 'pack', label: 'Packs' },
    { value: 'carton', label: 'Cartons' },
    { value: 'case', label: 'Cases' }
];



export default function LiquorForm({ 
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
        cigaretteType: '', // for cigarettes only
        quantity: '',
        unit: '',
        pricePerUnit: '',
        volume: '' // for liquor items (always in ml)
    });

    const [errors, setErrors] = useState({});

    // Memoized existing item options to prevent recalculation
    const existingItemOptions = useMemo(() => 
        existingItems.map(item => ({
            value: item.id?.toString() || '',
            label: `${item.name || 'Unknown'} (${item.category || 'No category'})`
        })), [existingItems]
    );

    // Memoized select options configurations
    const selectOptions = useMemo(() => ({
        mode: [
            { value: 'new', label: 'Add New Item' },
            { value: 'update', label: 'Update Existing Item' }
        ],
        category: [
            { value: '', label: 'Select category' },
            ...liquorCategories
        ],
        cigaretteType: [
            { value: '', label: 'Select cigarette type' },
            ...cigaretteTypes
        ],
        unit: [
            { value: '', label: 'Select unit' },
            ...units
        ],

        existingItems: [
            { value: '', label: 'Choose an existing item' },
            ...existingItemOptions
        ]
    }), [existingItemOptions]);

    // Memoized form reset data
    const initialFormData = useMemo(() => ({
        mode: 'new',
        selectedItemId: '',
        name: '',
        category: '',
        cigaretteType: '',
        quantity: '',
        unit: '',
        pricePerUnit: ''
    }), []);

    // Memoized callback for form data updates
    const updateFormData = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    // Memoized callback for clearing errors
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);


    // Memoized callback for editing item setup
    const setupEditingItem = useCallback((item) => {
        setFormData({
            mode: 'update',
            selectedItemId: item.id?.toString() || '',
            name: item.name || '',
            category: item.category || '',
            cigaretteType: item.cigaretteType || '',
            quantity: '', // Always start with empty quantity for updates
            unit: item.unit || '',
            pricePerUnit: item.pricePerUnit ? item.pricePerUnit.toString() : '',
            volume: item.volume ? item.volume.toString() : '',
            volumeUnit: item.volumeUnit || 'ml'
        });
        clearErrors();
    }, [clearErrors]);

    useEffect(() => {
        if (editingItem) {
            setupEditingItem(editingItem);
        }
    }, [editingItem, setupEditingItem]);

    // Memoized callback for mode change
    const handleModeChange = useCallback((e) => {
        const mode = e.target.value;
        setFormData({
            ...initialFormData,
            mode
        });
        clearErrors();
    }, [initialFormData, clearErrors]);

    // Memoized callback for category change
    const handleCategoryChange = useCallback((e) => {
        const category = e.target.value;
        updateFormData({
            category,
            cigaretteType: category === 'cigarette' ? '' : '', // Reset cigarette type when category changes
            unit: category === 'cigarette' ? 'pack' : '' // Default unit for cigarettes
        });
    }, [updateFormData]);

    // Memoized callback for existing item selection
    const handleExistingItemSelect = useCallback((e) => {
        const itemId = e.target.value;
        const selectedItem = existingItems.find(item => item.id.toString() === itemId);
        
        if (selectedItem) {
            updateFormData({
                selectedItemId: itemId,
                name: selectedItem.name || '',
                category: selectedItem.category || '',
                cigaretteType: selectedItem.cigaretteType || '',
                quantity: '',
                unit: selectedItem.unit || '',
                pricePerUnit: selectedItem.pricePerUnit ? selectedItem.pricePerUnit.toString() : ''
            });
        }
    }, [existingItems, updateFormData]);

    // Memoized form field handlers
    const formHandlers = useMemo(() => ({
        name: (e) => updateFormData({ name: e.target.value }),
        cigaretteType: (e) => updateFormData({ cigaretteType: e.target.value }),
        quantity: (e) => updateFormData({ quantity: e.target.value }),
        unit: (e) => updateFormData({ unit: e.target.value }),
        pricePerUnit: (e) => updateFormData({ pricePerUnit: e.target.value }),
        volume: (e) => updateFormData({ volume: e.target.value })
    }), [updateFormData]);

    // Memoized form submission handler
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        const validated = validateLiquorForm(formData, setErrors);
        
        if (validated) {
            const submissionData = {
                mode: formData.mode,
                id: formData.mode === 'update' ? (formData.selectedItemId ? parseInt(formData.selectedItemId) : null) : null,
                name: formData.name.trim(),
                category: formData.category,
                cigaretteType: formData.category === 'cigarette' ? formData.cigaretteType : '',
                quantity: parseInt(formData.quantity) || 0,
                unit: formData.unit,
                pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
                ...(formData.category === 'liquor' && {
                    volume: parseInt(formData.volume) || 0
                })
            };

            onSubmit(submissionData);
            
            // Reset form
            setFormData(initialFormData);
            clearErrors();
        }
    }, [formData, onSubmit, initialFormData, clearErrors]);

    // Memoized field disabled state
    const isFieldDisabled = useMemo(() => {
        return editingItem ? true : (formData.mode === 'update' && formData.selectedItemId);
    }, [editingItem, formData.mode, formData.selectedItemId]);

    // Memoized form title
    const formTitle = useMemo(() => {
        return editingItem ? 'Update Liquor Item' : 'Liquor Management';
    }, [editingItem]);

    // Memoized button text
    const submitButtonText = useMemo(() => {
        return formData.mode === 'new' ? 'Add Item' : 'Update Stock';
    }, [formData.mode]);

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-other1 mb-4">
                {formTitle}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className='w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Mode Selection */}
                    {!editingItem && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-other1 mb-2">
                                Action <span className="text-red">*</span>
                            </label>
                            <Select
                                value={formData.mode}
                                onChange={handleModeChange}
                                options={selectOptions.mode}
                            />
                        </div>
                    )}

                    {/* Existing Item Selection */}
                    {formData.mode === 'update' && !editingItem && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-other1 mb-2">
                                Select Item to Update <span className="text-red">*</span>
                            </label>
                            <Select
                                value={formData.selectedItemId}
                                onChange={handleExistingItemSelect}
                                options={selectOptions.existingItems}
                            />
                            {errors.selectedItemId && <p className="mt-1 text-sm text-red">{errors.selectedItemId}</p>}
                        </div>
                    )}
                </div>

                {/* Item Details */}
                <div className="w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Item Name"
                        type="text"
                        value={formData.name}
                        onChange={formHandlers.name}
                        placeholder="Enter item name"
                        required
                        error={errors.name}
                        disabled={isFieldDisabled}
                    />

                    <div className="w-full">
                        <label className="block text-sm font-medium text-other1 mb-2">
                            Category <span className="text-red">*</span>
                        </label>
                        <Select
                            value={formData.category}
                            onChange={handleCategoryChange}
                            options={selectOptions.category}
                            isDisabled={isFieldDisabled}
                        />
                        {errors.category && <p className="mt-1 text-sm text-red">{errors.category}</p>}
                    </div>
                </div>

                {/* Cigarette Type - Only show for cigarette category */}
                {formData.category === 'cigarette' && (
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-other1 mb-2">
                            Cigarette Type <span className="text-red">*</span>
                        </label>
                        <Select
                            value={formData.cigaretteType}
                            onChange={formHandlers.cigaretteType}
                            options={selectOptions.cigaretteType}
                            isDisabled={isFieldDisabled}
                        />
                        {errors.cigaretteType && <p className="mt-1 text-sm text-red">{errors.cigaretteType}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label={formData.mode === 'update' ? 'Add Quantity' : 'Quantity'}
                        type="number"
                        value={formData.quantity}
                        onChange={formHandlers.quantity}
                        placeholder="0"
                        min="1"
                        required
                        error={errors.quantity}
                    />

                    <div className="w-full">
                        <label className="block text-sm font-medium text-other1 mb-2">
                            Unit <span className="text-red">*</span>
                        </label>
                        <Select
                            value={formData.unit}
                            onChange={formHandlers.unit}
                            options={selectOptions.unit}
                            isDisabled={isFieldDisabled}
                        />
                        {errors.unit && <p className="mt-1 text-sm text-red">{errors.unit}</p>}
                    </div>

                    <InputField
                        label="Price per Unit"
                        type="number"
                        value={formData.pricePerUnit}
                        onChange={formHandlers.pricePerUnit}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        error={errors.pricePerUnit}
                    />
                </div>

                {/* Volume Field - Only show for liquor items */}
                {formData.category !== 'cigarette' && (
                    <div className="w-full md:w-1/3 mt-4">
                        <InputField
                            label="Bottle Volume (ml)"
                            type="number"
                            value={formData.volume}
                            onChange={formHandlers.volume}
                            placeholder="Enter volume in milliliters"
                            min="1"
                            required
                            error={errors.volume}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <PrimaryButton type="submit">
                        {submitButtonText}
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
