import React, { useState, useEffect } from 'react';
import LiquorService from '../../../services/liquorService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import LiquorMenuCard from './components/LiquorMenuCard';
import LiquorPortionEditor from './components/LiquorPortionEditor';
import { FaWineBottle, FaSearch, FaFilter } from 'react-icons/fa';

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

export default function MenuLiquorManager() {
  const [liquorItems, setLiquorItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLiquor, setSelectedLiquor] = useState(null);
  const [showPortionEditor, setShowPortionEditor] = useState(false);

  useEffect(() => {
    fetchLiquorItems();
  }, []);

  const fetchLiquorItems = async () => {
    try {
      setLoading(true);
      const response = await LiquorService.getAllLiquors();
      setLiquorItems(response.data || []);
    } catch (error) {
      console.error('Error fetching liquor items:', error);
      setError('Failed to fetch liquor items');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePortions = (liquorItem) => {
    setSelectedLiquor(liquorItem);
    setShowPortionEditor(true);
  };

  const handleUpdatePortions = async (liquorId, portions) => {
    try {
      // Update each portion
      for (const portion of portions) {
        await LiquorService.updatePortionPrice(liquorId, portion._id, portion.price);
      }
      
      // Refresh the liquor items
      await fetchLiquorItems();
      
      // Update the selected liquor with new data
      const updatedLiquor = liquorItems.find(item => item._id === liquorId);
      if (updatedLiquor) {
        setSelectedLiquor({...updatedLiquor, portions});
      }
    } catch (error) {
      console.error('Error updating portions:', error);
      throw error;
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      brandy: '🥃',
      tequila: '🍹',
      beer: '🍺',
      wine: '🍷',
      other: '🥃'
    };
    return icons[type] || '🥃';
  };

  const filteredItems = liquorItems.filter(item => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const groupedItems = filteredItems.reduce((groups, item) => {
    const type = item.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaWineBottle className="text-2xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liquor Menu Management</h1>
            <p className="text-gray-600">Manage portions and prices for liquor items in stock</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-blue-600">{liquorItems.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {LIQUOR_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <FaWineBottle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No liquor items found</h3>
          <p className="text-gray-500">
            {searchTerm || typeFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Add some liquor items to your stock first.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([type, items]) => (
            <div key={type} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 capitalize flex items-center">
                <span className="mr-2">{getTypeIcon(type)}</span>
                {type} ({items.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                  <LiquorMenuCard
                    key={item._id}
                    liquorItem={item}
                    onManagePortions={handleManagePortions}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portion Editor Modal */}
      {showPortionEditor && selectedLiquor && (
        <LiquorPortionEditor
          liquorItem={selectedLiquor}
          onUpdatePortions={handleUpdatePortions}
          onClose={() => {
            setShowPortionEditor(false);
            setSelectedLiquor(null);
          }}
        />
      )}
    </div>
  );
}
