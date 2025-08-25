export const validateLiquorForm = (formData, setErrors) => {
    const errors = {};
    let isValid = true;

    // Mode validation
    if (!formData.mode) {
        errors.mode = 'Please select an action';
        isValid = false;
    }

    // Selected item validation for update mode
    if (formData.mode === 'update' && !formData.selectedItemId) {
        errors.selectedItemId = 'Please select an item to update';
        isValid = false;
    }

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
        errors.name = 'Item name is required';
        isValid = false;
    } else if (formData.name.trim().length < 2) {
        errors.name = 'Item name must be at least 2 characters long';
        isValid = false;
    }

    // Category validation
    if (!formData.category) {
        errors.category = 'Please select a category';
        isValid = false;
    }

    // Cigarette type validation for cigarette category
    if (formData.category === 'cigarette' && !formData.cigaretteType) {
        errors.cigaretteType = 'Please select cigarette type';
        isValid = false;
    }

    // Quantity validation
    if (!formData.quantity || formData.quantity.toString().trim().length === 0) {
        errors.quantity = 'Quantity is required';
        isValid = false;
    } else {
        const quantity = parseInt(formData.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            errors.quantity = 'Quantity must be a positive number';
            isValid = false;
        } else if (quantity > 10000) {
            errors.quantity = 'Quantity cannot exceed 10,000';
            isValid = false;
        }
    }

    // Unit validation
    if (!formData.unit) {
        errors.unit = 'Please select a unit';
        isValid = false;
    }

    // Price validation
    if (!formData.pricePerUnit || formData.pricePerUnit.toString().trim().length === 0) {
        errors.pricePerUnit = 'Price per unit is required';
        isValid = false;
    } else {
        const price = parseFloat(formData.pricePerUnit);
        if (isNaN(price) || price <= 0) {
            errors.pricePerUnit = 'Price must be a positive number';
            isValid = false;
        } else if (price > 10000) {
            errors.pricePerUnit = 'Price cannot exceed $10,000';
            isValid = false;
        }
    }

    setErrors(errors);
    return isValid;
};
