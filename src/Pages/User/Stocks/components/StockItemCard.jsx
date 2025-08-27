import { PrimaryButton, SecondaryButton } from "../../../../components/Button";

export default function StockItemCard({ item, onEdit, onDelete }) {

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-other1 text-lg">{item.name}</h3>
                    <p className="text-sm text-text">{item.category}</p>
                </div>
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="text-sm text-text">Quantity:</span>
                    <span className="font-medium text-other1">{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-text">Price:</span>
                    <span className="font-medium text-other1">LKR {item.price}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <PrimaryButton type="button" onClick={() => onEdit(item)}>
                    Update
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => onDelete(item.id)}>
                    Cancel
                </SecondaryButton>
            </div>
        </div>
    );
}
