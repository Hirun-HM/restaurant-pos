import React, { useEffect, useCallback } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // warning, danger, info
}) {
    // Close modal on escape key press
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscapeKey]);

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return 'text-red';
            case 'info':
                return 'text-primaryColor';
            case 'warning':
            default:
                return 'text-other2';
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-other1 bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                {/* Modal Content - responsive width */}
                <div 
                    className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                        <h2 className="text-lg sm:text-xl font-semibold text-other1">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 hover:bg-bgsecond rounded-full transition-colors"
                            type="button"
                        >
                            <FaTimes size={14} className="sm:hidden text-darkGray" />
                            <FaTimes size={16} className="hidden sm:block text-darkGray" />
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="p-4 sm:p-6 text-center">
                        <div className={`mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-fourthColor flex items-center justify-center ${getIconColor()}`}>
                            <FaExclamationTriangle size={24} className="sm:hidden" />
                            <FaExclamationTriangle size={32} className="hidden sm:block" />
                        </div>
                        
                        <h3 className="text-lg sm:text-xl font-semibold text-other1 mb-2">
                            {title}
                        </h3>
                        
                        <p className="text-sm sm:text-base text-text mb-4 sm:mb-6 leading-relaxed px-2">
                            {message}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                            <SecondaryButton 
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base"
                            >
                                {cancelText}
                            </SecondaryButton>
                            <PrimaryButton 
                                onClick={handleConfirm}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base"
                            >
                                {confirmText}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
