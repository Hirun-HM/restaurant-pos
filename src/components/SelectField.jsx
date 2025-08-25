import React from 'react';

export default function SelectField({ 
    label, 
    value, 
    onChange, 
    options = [], 
    placeholder = "Select an option",
    required = false,
    error = null
}) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                required={required}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primaryColor focus:border-transparent transition-colors duration-200 ${
                    error ? 'border-red' : 'border-gray-300'
                }`}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red">{error}</p>}
        </div>
    );
}
