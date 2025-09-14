import React, { useMemo } from 'react';

const Select = ({ 
    options = [], 
    value, 
    onChange, 
    isDisabled,
    label = "",
    required = false,
    error = ""
}) => {
  // Memoize the options rendering
    const renderedOptions = useMemo(() => {
        return options.map((option) => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
        ));
    }, [options]);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative w-full font-poppins">
                <select
                    className={`border-2 w-full py-2 px-4 rounded-lg
                    focus:border-primaryColor focus:outline-none
                    appearance-none pr-10 cursor-pointer transition-all duration-200
                    ${value ? 'border-primaryColor' : 'border-gray-300'}
                    ${error ? 'border-red-500 focus:border-red-500' : ''}
                    ${isDisabled ? 'bg-gray-200 cursor-not-allowed border-gray-300' : 'bg-white'}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={isDisabled} // Disables the select input when isDisabled is true
                    required={required}
                >
                    {renderedOptions}
                </select>

                {/* Dropdown Icon */}
                <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    >
                    <path d="M6 9l6 6 6-6"></path>
                    </svg>
                </div>
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};


export default Select;
