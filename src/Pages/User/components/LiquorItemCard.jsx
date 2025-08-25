import { PrimaryButton, SecondaryButton } from "../../../components/Button";

export default function LiquorItemCard({ item, onEdit, onDelete }) {

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
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
                <SecondaryButton type="button" onClick={() => onDelete(item.id)}>
                    Delete
                </SecondaryButton>
            </div>
        </div>
    );
}
