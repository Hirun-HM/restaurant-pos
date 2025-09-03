import React from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton } from '../../../../components/Button';

export default function MessageModal({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    type = 'info' // 'success', 'error', 'warning', 'info'
}) {
    if (!isOpen) return null;

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: '✅',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    titleColor: 'text-green-800',
                    buttonColor: 'bg-green-600 hover:bg-green-700'
                };
            case 'error':
                return {
                    icon: '❌',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    titleColor: 'text-red-800',
                    buttonColor: 'bg-red-600 hover:bg-red-700'
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    titleColor: 'text-yellow-800',
                    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
                };
            default:
                return {
                    icon: 'ℹ️',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    titleColor: 'text-blue-800',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const { icon, bgColor, borderColor, titleColor, buttonColor } = getIconAndColors();

    // Helper function to format message text
    const formatMessage = (text) => {
        if (!text) return '';
        
        // Convert to string if it's an object
        const messageText = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
        
        // Split by newlines and render as separate paragraphs
        return messageText.split('\n').map((line, index) => {
            if (line.trim() === '') {
                return <br key={index} />;
            }
            
            // Handle bullet points
            if (line.trim().startsWith('•')) {
                return (
                    <div key={index} className="ml-4 text-gray-700">
                        {line.trim()}
                    </div>
                );
            }
            
            // Handle headers (lines that end with colon)
            if (line.trim().endsWith(':')) {
                return (
                    <div key={index} className="font-semibold text-gray-800 mt-2 mb-1">
                        {line.trim()}
                    </div>
                );
            }
            
            return (
                <div key={index} className="text-gray-700 mb-1">
                    {line.trim()}
                </div>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{icon}</span>
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${titleColor} mb-2`}>
                                {title}
                            </h3>
                            <div className="text-sm">
                                {formatMessage(message)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <PrimaryButton 
                        onClick={onClose}
                        className={`${buttonColor} px-6 py-2 text-white rounded-lg font-medium transition-colors`}
                    >
                        OK
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

MessageModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info'])
};
