import React, { useState, useEffect } from 'react';
import { useLiquor } from '../../../hooks/useLiquor';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { PrimaryButton, SecondaryButton } from '../../../components/Button';
import { InputField } from '../../../components/InputField';
import Select from '../../../components/Select';
import LiquorStockForm from './components/LiquorStockForm';
import LiquorItemCard from './components/LiquorItemCard';
import LiquorBilling from './components/LiquorBilling';

const LIQUOR_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'whiskey', label: 'Whiskey' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'rum', label: 'Rum' },
  { value: 'gin', label: 'Gin' },
  { value: 'brandy', label: 'Brandy' },
  { value: 'tequila', label: 'Tequila' },
  { value: 'beer', label: 'Beer' },
  { value: 'wine', label: 'Wine' },
  { value: 'other', label: 'Other' }
];

export default function LiquorManagerWithAPI() {
  const {
    loading,
    error,
    analytics,
    fetchLiquorItems,
    createLiquorItem,
    updateLiquorItem,
    deleteLiquorItem,
    getItemsByType,
    getLowStockFromState,
    clearError
  } = useLiquor();

  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'analytics', 'billing'
  const [billingOpen, setBillingOpen] = useState(false);
  const [recentSales, setRecentSales] = useState([]);

  // Fetch liquor items on component mount
  useEffect(() => {
    fetchLiquorItems();
  }, [fetchLiquorItems]);

  // Handle liquor form submission
  const handleLiquorSubmit = async (formData) => {
    try {
      if (editingItem) {
        // Update existing item
        await updateLiquorItem(editingItem._id, formData);
      } else {
        // Create new item
        await createLiquorItem(formData);
      }
      
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error handling liquor submission:', error);
    }
  };

  // Handle sale completion
  const handleSaleComplete = (saleData) => {
    setRecentSales(prev => [...prev, { ...saleData, timestamp: new Date() }]);
    // Refresh liquor items to show updated stock
    fetchLiquorItems();
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (item) => {
    setDeleteConfirm({ show: true, item });
  };

  const confirmDelete = async () => {
    try {
      await deleteLiquorItem(deleteConfirm.item._id);
      setDeleteConfirm({ show: false, item: null });
    } catch (error) {
      // Error is handled by the hook
      console.error('Delete error:', error);
    }
  };

  // Filter and search items
  const filteredItems = React.useMemo(() => {
    let items = showLowStock ? getLowStockFromState() : getItemsByType(typeFilter);
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.brand.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search)
      );
    }
    
    return items;
  }, [typeFilter, searchTerm, showLowStock, getItemsByType, getLowStockFromState]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liquor Management</h1>
          <p className="text-gray-600 mt-1">Manage your liquor inventory, portions, and stock levels</p>
        </div>
        <PrimaryButton
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className='flex items-center'
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Liquor
        </PrimaryButton>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'items'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Liquor Items ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'billing'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Analytics Summary Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalItems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.lowStockCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Wasted</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalWastedVolume?.toFixed(0) || '0'} ml</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <InputField
                type="text"
                placeholder="Search liquor items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="md:w-48">
              <Select
                value={typeFilter}
                onChange={(value) => setTypeFilter(value)}
                options={LIQUOR_TYPES}
              />
            </div>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg whitespace-nowrap">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-gray-300 text-primaryColor focus:ring-primaryColor"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label>
          </div>

          {/* Loading */}
          {loading && <LoadingSpinner />}

          {/* Liquor Items Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {filteredItems.map((item) => (
                <LiquorItemCard
                  key={item._id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No liquor items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter !== 'all' || showLowStock
                  ? 'Try adjusting your filters or search term.'
                  : 'Get started by adding your first liquor item.'}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Liquor Analytics</h2>
          <p className="text-gray-600">Analytics dashboard coming soon...</p>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Liquor Billing</h2>
            <button
              onClick={() => setBillingOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Process Sale
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Process liquor sales with automatic stock management and portion tracking.
              All sales will automatically update inventory levels and track waste.
            </p>
            
            {recentSales.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Recent Sales</h3>
                <div className="space-y-2">
                  {recentSales.slice(-5).map((sale, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{sale.liquorName} - {sale.portionName}</span>
                        <span className="text-green-600">LKR {sale.totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        Qty: {sale.quantity} | Consumed: {sale.totalConsumed}ml
                        {sale.totalWasted > 0 && ` | Wasted: ${sale.totalWasted}ml`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <LiquorStockForm
          item={editingItem}
          onSubmit={handleLiquorSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Liquor Item"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />

      {billingOpen && (
        <LiquorBilling
          isOpen={billingOpen}
          onClose={() => setBillingOpen(false)}
          onSaleComplete={handleSaleComplete}
        />
      )}
    </div>
  );
}
