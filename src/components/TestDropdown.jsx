import React from 'react';

// Test the dropdown options
const LIQUOR_TYPES_FLAT = [
  // Hard Liquor
  { value: 'whiskey', label: '🥃 Whiskey (Hard Liquor)' },
  { value: 'vodka', label: '🍸 Vodka (Hard Liquor)' },
  { value: 'rum', label: '🍹 Rum (Hard Liquor)' },
  { value: 'gin', label: '🍸 Gin (Hard Liquor)' },
  { value: 'brandy', label: '🥃 Brandy (Hard Liquor)' },
  { value: 'tequila', label: '🍹 Tequila (Hard Liquor)' },
  // Beer & Wine
  { value: 'beer', label: '🍺 Beer' },
  { value: 'wine', label: '🍷 Wine' },
  // Other Items
  { value: 'cigarettes', label: '🚬 Cigarettes' },
  { value: 'other', label: 'ℹ️ Other' }
];

export default function TestDropdown() {
  return (
    <div className="p-4">
      <h3>Test Dropdown Options:</h3>
      <select className="w-full p-2 border rounded">
        <option value="">Select item type</option>
        {LIQUOR_TYPES_FLAT.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      <div className="mt-4">
        <h4>Available options:</h4>
        <ul>
          {LIQUOR_TYPES_FLAT.map((option) => (
            <li key={option.value}>{option.value}: {option.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
