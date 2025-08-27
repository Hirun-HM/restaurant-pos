# Stock Management API Documentation

## Base URL
```
http://localhost:5000/api/stock
```

## Endpoints

### 1. Get All Stock Items
**GET** `/`

Get all stock items with optional filtering and pagination.

#### Query Parameters
- `category` (optional) - Filter by category: `ingredients`, `food`, `drinks`, `supplies`
- `lowStock` (optional) - Filter low stock items: `true` or `false`
- `search` (optional) - Search in name, description, or supplier
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 50, max: 100)

#### Example Request
```
GET /api/stock?category=ingredients&page=1&limit=20
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "Chicken Breast",
      "category": "ingredients",
      "quantity": 15,
      "unit": "kg",
      "price": 8.99,
      "minimumQuantity": 5,
      "supplier": "Fresh Meat Co.",
      "description": "Fresh boneless chicken breast",
      "isLowStock": false,
      "totalValue": 134.85,
      "lastRestocked": "2024-01-15T10:30:00.000Z",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "totalItems": 45,
    "totalValue": 2500.75,
    "lowStockCount": 3,
    "categories": {
      "ingredients": {
        "count": 20,
        "totalValue": 1200.50,
        "lowStockCount": 2
      }
    }
  }
}
```

### 2. Get Single Stock Item
**GET** `/:id`

Get a specific stock item by ID.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Chicken Breast",
    "category": "ingredients",
    "quantity": 15,
    "unit": "kg",
    "price": 8.99,
    "minimumQuantity": 5,
    "supplier": "Fresh Meat Co.",
    "description": "Fresh boneless chicken breast",
    "isLowStock": false,
    "totalValue": 134.85,
    "lastRestocked": "2024-01-15T10:30:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Create Stock Item
**POST** `/`

Create a new stock item.

#### Request Body
```json
{
  "name": "Chicken Breast",
  "category": "ingredients",
  "quantity": 15,
  "unit": "kg",
  "price": 8.99,
  "minimumQuantity": 5,
  "supplier": "Fresh Meat Co.",
  "description": "Fresh boneless chicken breast",
  "expiryDate": "2024-02-15T00:00:00.000Z",
  "barcode": "1234567890123"
}
```

#### Required Fields
- `name` (string, 1-100 characters)
- `category` (enum: ingredients, food, drinks, supplies)
- `quantity` (number, >= 0)
- `unit` (string, max 20 characters)
- `price` (number, >= 0)

#### Optional Fields
- `minimumQuantity` (number, >= 0, default: 5)
- `supplier` (string, max 100 characters)
- `description` (string, max 500 characters)
- `expiryDate` (date)
- `barcode` (string, unique)

#### Response
```json
{
  "success": true,
  "message": "Stock item created successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Chicken Breast",
    "category": "ingredients",
    "quantity": 15,
    "unit": "kg",
    "price": 8.99,
    "minimumQuantity": 5,
    "supplier": "Fresh Meat Co.",
    "description": "Fresh boneless chicken breast",
    "isLowStock": false,
    "totalValue": 134.85,
    "lastRestocked": "2024-01-15T10:30:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Stock Item
**PUT** `/:id`

Update an existing stock item.

#### Request Body
Same as create, but all fields are optional.

#### Response
```json
{
  "success": true,
  "message": "Stock item updated successfully",
  "data": {
    // Updated stock item data
  }
}
```

### 5. Update Stock Quantity
**PUT** `/:id/quantity`

Add or subtract stock quantity (for restocking or consumption).

#### Request Body
```json
{
  "quantity": 10,
  "operation": "add"  // or "subtract"
}
```

#### Response
```json
{
  "success": true,
  "message": "Stock added successfully",
  "data": {
    // Updated stock item data
  },
  "quantityChange": {
    "operation": "add",
    "amount": 10,
    "previousQuantity": 15,
    "newQuantity": 25
  }
}
```

### 6. Delete Stock Item
**DELETE** `/:id`

Soft delete a stock item (sets isActive to false).

#### Response
```json
{
  "success": true,
  "message": "Stock item deleted successfully"
}
```

### 7. Get Low Stock Items
**GET** `/low-stock`

Get all items that are below their minimum quantity threshold.

#### Response
```json
{
  "success": true,
  "data": [
    {
      // Stock items with quantity <= minimumQuantity
    }
  ],
  "count": 3
}
```

### 8. Get Stock Analytics
**GET** `/analytics`

Get comprehensive analytics about stock inventory.

#### Response
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalItems": 45,
      "totalValue": 2500.75,
      "averagePrice": 55.57,
      "totalQuantity": 450,
      "lowStockCount": 3
    },
    "byCategory": [
      {
        "_id": "ingredients",
        "count": 20,
        "totalValue": 1200.50,
        "averagePrice": 60.03,
        "totalQuantity": 200,
        "lowStockCount": 2
      },
      {
        "_id": "drinks",
        "count": 15,
        "totalValue": 800.25,
        "averagePrice": 53.35,
        "totalQuantity": 150,
        "lowStockCount": 1
      }
    ]
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Stock item name is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Stock item not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Error message (in development mode)"
}
```

## Data Types

### Stock Item Model
```javascript
{
  _id: ObjectId,                    // MongoDB ID
  name: String,                     // Item name (required)
  category: String,                 // Category enum (required)
  quantity: Number,                 // Current quantity (required)
  unit: String,                     // Unit of measurement (required)
  price: Number,                    // Price per unit (required)
  minimumQuantity: Number,          // Low stock threshold (default: 5)
  supplier: String,                 // Supplier name (optional)
  description: String,              // Item description (optional)
  lastRestocked: Date,              // Last restock date
  expiryDate: Date,                 // Expiry date (optional)
  barcode: String,                  // Barcode (optional, unique)
  isActive: Boolean,                // Active status (default: true)
  isLowStock: Boolean,              // Virtual field (quantity <= minimumQuantity)
  totalValue: Number,               // Virtual field (quantity * price)
  createdAt: Date,                  // Creation timestamp
  updatedAt: Date                   // Last update timestamp
}
```

### Categories
- `ingredients` - Raw ingredients for cooking
- `food` - Prepared food items
- `drinks` - Beverages and drinks
- `supplies` - Kitchen and restaurant supplies
