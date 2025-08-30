import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../../../../components/Button";

export default function LiquorItemCard({ item, onEdit, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete(item.id);
        setShowDeleteModal(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg text-other1">{item.name}</h3>
                    <p className="text-sm text-text capitalize">{item.category.replace('_', ' ')}</p>
                    {item.cigaretteType && (
                        <p className="text-xs text-gray-500">{item.cigaretteType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    )}
                </div>
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="text-sm text-text">Quantity:</span>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-text">Price per Unit:</span>
                    <span className="font-medium">LKR {item.pricePerUnit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-text">Total Value:</span>
                    <span className="font-medium">LKR {(item.quantity * item.pricePerUnit).toFixed(2)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <PrimaryButton type="button" onClick={() => onEdit(item)}>
                    Update
                </PrimaryButton>
                <SecondaryButton type="button" onClick={handleDeleteClick}>
                    Delete
                </SecondaryButton>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-other1 mb-2">Confirm Delete</h3>
                            <p className="text-text">
                                Are you sure you want to delete <strong>{item.name}</strong>? 
                                This action cannot be undone.
                            </p>
                        </div>
                        
                        <div className="flex gap-3 justify-end">
                            <SecondaryButton type="button" onClick={handleCancelDelete}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton 
                                type="button" 
                                onClick={handleConfirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Delete
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
