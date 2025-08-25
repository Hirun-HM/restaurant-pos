import PropTypes from 'prop-types';
import { useMemo } from 'react';

const Select = ({ options, value, onChange, isDisabled }) => {
  // Memoize the options rendering
    const renderedOptions = useMemo(() => {
        return options.map((option) => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
        ));
    }, [options]);

    return (
        <div className="relative w-full font-poppins">
            <select
                className={`border-2 w-full py-2 px-4 rounded-md
                focus:border-primaryColor focus:outline-none
                appearance-none pr-10 cursor-pointer
                ${isDisabled ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                value={value}
                onChange={onChange}
                disabled={isDisabled} // Disables the select input when isDisabled is true
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
    );
};

Select.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool, // Added prop validation for isDisabled
};

export default Select;
