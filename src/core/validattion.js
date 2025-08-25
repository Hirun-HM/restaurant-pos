export const validateForm = (formData, setErrors) => {
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