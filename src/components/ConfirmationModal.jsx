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
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Modal Content with w-1/2 */}
                <div 
                    className="relative bg-white rounded-2xl shadow-xl w-1/2 max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-other1">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-bgsecond rounded-full transition-colors"
                            type="button"
                        >
                            <FaTimes size={16} className="text-darkGray" />
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="p-6 text-center">
                        <div className={`mx-auto mb-4 w-16 h-16 rounded-full bg-fourthColor flex items-center justify-center ${getIconColor()}`}>
                            <FaExclamationTriangle size={32} />
                        </div>
                        
                        <h3 className="text-xl font-semibold text-other1 mb-2">
                            {title}
                        </h3>
                        
                        <p className="text-text mb-6 leading-relaxed">
                            {message}
                        </p>
                        
                        <div className="flex gap-3 justify-center">
                            <SecondaryButton 
                                onClick={onClose}
                                className="px-6 py-2"
                            >
                                {cancelText}
                            </SecondaryButton>
                            <PrimaryButton 
                                onClick={handleConfirm}
                                className="px-6 py-2"
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
