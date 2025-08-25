import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export const InputField = ({ 
    type = "text", 
    placeholder = "", 
    value, 
    onChange, 
    label = "", 
    error = "", 
    disabled = false,
    className = "",
    required = false,
    ...props 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primaryColor focus:ring-opacity-50
                        focus:border-transparent
                        ${error 
                            ? 'border-red-500 focus:border-transparent focus:ring-red-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        }
                        ${disabled 
                            ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'bg-white'
                        }
                        placeholder:text-gray-400`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 
                            text-gray-500 hover:text-gray-700 transition-colors duration-200
                            focus:outline-none"
                    >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};
