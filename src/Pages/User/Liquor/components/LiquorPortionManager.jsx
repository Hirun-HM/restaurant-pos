import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/Modal';
import { InputField } from '../../../../components/InputField';
import Button from '../../../../components/Button';

export default function LiquorPortionManager({ 
  liquorItem, 
  onClose, 
  onPortionAdd, 
  onPortionUpdate, 
  onPortionDelete 
}) {
  const [newPortion, setNewPortion] = useState({ name: '', volume: '', price: '' });
  const [editingPortion, setEditingPortion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPortion = async (e) => {
    e.preventDefault();
    if (!newPortion.name || !newPortion.volume || !newPortion.price) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onPortionAdd({
        name: newPortion.name,
        volume: parseFloat(newPortion.volume),
        price: parseFloat(newPortion.price)
      });
      setNewPortion({ name: '', volume: '', price: '' });
    } catch (error) {
      console.error('Error adding portion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePortion = async (e) => {
    e.preventDefault();
    if (!editingPortion || !editingPortion.name || !editingPortion.volume || !editingPortion.price) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onPortionUpdate(editingPortion._id, {
        name: editingPortion.name,
        volume: parseFloat(editingPortion.volume),
        price: parseFloat(editingPortion.price)
      });
      setEditingPortion(null);
    } catch (error) {
      console.error('Error updating portion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePortion = async (portionId) => {
    if (!window.confirm('Are you sure you want to delete this portion?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onPortionDelete(portionId);
    } catch (error) {
      console.error('Error deleting portion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (portion) => {
    setEditingPortion({ ...portion });
  };

  const cancelEdit = () => {
    setEditingPortion(null);
  };

  const predefinedPortions = [
    { name: 'Bottle', volume: liquorItem.bottleVolume, price: '' },
    { name: 'Half', volume: Math.round(liquorItem.bottleVolume / 2), price: '' },
    { name: '1/4', volume: Math.round(liquorItem.bottleVolume / 4), price: '' },
    { name: '100ml Shot', volume: 100, price: '' },
    { name: '75ml Shot', volume: 75, price: '' },
    { name: '50ml Shot', volume: 50, price: '' },
    { name: '25ml Shot', volume: 25, price: '' }
  ];

  const addPredefinedPortion = (portion) => {
    setNewPortion({
      name: portion.name,
      volume: portion.volume.toString(),
      price: ''
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Portions - ${liquorItem.name}`}
      size="large"
    >
      <div className="space-y-6">
        {/* Current Portions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Portions</h3>
          
          {liquorItem.portions && liquorItem.portions.length > 0 ? (
            <div className="space-y-3">
              {liquorItem.portions.map((portion) => (
                <div key={portion._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingPortion && editingPortion._id === portion._id ? (
                    <form onSubmit={handleUpdatePortion} className="flex items-center gap-3 flex-1">
                      <InputField
                        value={editingPortion.name}
                        onChange={(value) => setEditingPortion({ ...editingPortion, name: value })}
                        placeholder="Portion name"
                        className="flex-1"
                      />
                      <InputField
                        type="number"
                        value={editingPortion.volume}
                        onChange={(value) => setEditingPortion({ ...editingPortion, volume: value })}
                        placeholder="Volume (ml)"
                        className="w-24"
                      />
                      <InputField
                        type="number"
                        step="0.01"
                        value={editingPortion.price}
                        onChange={(value) => setEditingPortion({ ...editingPortion, price: value })}
                        placeholder="Price"
                        className="w-24"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                          Save
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{portion.name}</div>
                        <div className="text-sm text-gray-600">
                          {portion.volume}ml - ${portion.price?.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(portion)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePortion(portion._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                          disabled={isSubmitting}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No portions defined yet. Add some below.
            </div>
          )}
        </div>

        {/* Quick Add Predefined Portions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Add Common Portions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {predefinedPortions.map((portion, index) => (
              <button
                key={index}
                onClick={() => addPredefinedPortion(portion)}
                className="p-3 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <div className="font-medium">{portion.name}</div>
                <div className="text-xs">{portion.volume}ml</div>
              </button>
            ))}
          </div>
        </div>

        {/* Add New Portion Form */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Portion</h3>
          <form onSubmit={handleAddPortion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Portion Name"
                value={newPortion.name}
                onChange={(value) => setNewPortion({ ...newPortion, name: value })}
                placeholder="e.g., Single Shot, Double Shot"
                required
              />
              <InputField
                label="Volume (ml)"
                type="number"
                min="1"
                value={newPortion.volume}
                onChange={(value) => setNewPortion({ ...newPortion, volume: value })}
                placeholder="30"
                required
              />
              <InputField
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={newPortion.price}
                onChange={(value) => setNewPortion({ ...newPortion, price: value })}
                placeholder="8.00"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Portion'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

LiquorPortionManager.propTypes = {
  liquorItem: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onPortionAdd: PropTypes.func.isRequired,
  onPortionUpdate: PropTypes.func.isRequired,
  onPortionDelete: PropTypes.func.isRequired
};
