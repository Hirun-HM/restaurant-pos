import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

const PasswordModal = ({ isOpen, onClose, onSuccess, sectionName }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const correctPassword = import.meta.env.VITE_MANAGER_PASSWORD || 'Manager@2024!';

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
            setShowPassword(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate a small delay for better UX
        setTimeout(() => {
            if (password === correctPassword) {
                setIsLoading(false);
                onSuccess();
                onClose();
            } else {
                setError('Incorrect password. Please try again.');
                setPassword('');
                setIsLoading(false);
            }
        }, 500);
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        setShowPassword(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primaryColor bg-opacity-10 p-2 rounded-full">
                            <FaLock className="text-primaryColor text-lg" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                Access Restricted
                            </h2>
                            <p className="text-sm text-gray-600">
                                Enter password to access {sectionName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Manager Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primaryColor focus:border-transparent transition-all pr-12"
                                placeholder="Enter manager password"
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isLoading}
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm mt-2 flex items-center">
                                <span className="mr-1">⚠️</span>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || !password.trim()}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Verifying...
                                </div>
                            ) : (
                                'Access'
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer hint */}
                <div className="px-6 pb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">
                            <span className="font-medium">Note:</span> Only authorized managers can access Menu, Liquor, and Stocks sections.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;

PasswordModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    sectionName: PropTypes.string.isRequired
};
