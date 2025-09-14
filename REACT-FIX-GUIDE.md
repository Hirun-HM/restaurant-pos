# React Import Issue Fix - Deployment Guide

## Problem Summary

The "Uncaught ReferenceError: React is not defined" error occurred when deploying to AWS. This was caused by several issues:

1. **Missing React Imports**: Components were missing proper React imports
2. **JSX Transform Configuration**: Inconsistent JSX transform settings between development and production
3. **Path Configuration Issues**: Conflicting base path configurations

## Root Causes & Fixes Applied

### 1. JSX Transform Configuration
**Problem**: Using React 19 with automatic JSX transform but inconsistent configuration.

**Solution**: Switched to classic JSX transform for better compatibility:
- Updated `jsconfig.json`: `"jsx": "react"` (instead of "react-jsx")
- Simplified `vite.config.js`: Removed automatic JSX transform config
- **All components now require `import React from 'react'`**

### 2. Missing React Imports
**Fixed these components**:
- `src/Pages/Welcome.jsx`
- `src/Pages/User/Stocks/components/StockItemCard.jsx`
- `src/components/Button.jsx`
- `src/components/Select.jsx`
- `src/components/LoadingSpinner.jsx`
- `src/components/PopupComponent.jsx`
- `src/components/InputField.jsx`
- `src/main.jsx`

### 3. Path Configuration Issues
**Problem**: Conflicting base paths between package.json, vite.config.js, and BrowserRouter.

**Solution**:
- Removed `homepage` field from `package.json`
- Made base path configurable via `VITE_BASE_PATH` environment variable
- Updated `App.jsx` to use configurable basename

## Current Configuration

### JSConfig (`jsconfig.json`)
```json
{
  "compilerOptions": {
    "jsx": "react"  // Classic JSX transform
  }
}
```

### Vite Config (`vite.config.js`)
```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE_PATH || '/',  // Configurable base path
    plugins: [react()],              // Simple React plugin
  };
});
```

### App Component (`src/App.jsx`)
```javascript
<BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
```

## Deployment Instructions

### For AWS Deployment

1. **Set Environment Variables**:
   Update `.env.production`:
   ```bash
   VITE_BASE_PATH=           # Empty for root deployment
   VITE_API_URL=http://your-aws-ip:5000/api
   VITE_NODE_ENV=production
   ```

2. **Build Command**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   Upload the `dist/` folder contents to your AWS server

### For Subdirectory Deployment

If deploying to a subdirectory (like `/restaurant-pos/`):

1. **Update .env.production**:
   ```bash
   VITE_BASE_PATH=/restaurant-pos/
   ```

2. **Build and deploy**:
   ```bash
   npm run build
   ```

## Prevention Guidelines

### 1. Always Import React
With classic JSX transform, **every .jsx file must import React**:

```javascript
// ✅ Correct
import React from 'react';
// or
import React, { useState, useEffect } from 'react';

// ❌ Wrong (will cause "React is not defined")
import { useState } from 'react';
```

### 2. Test Production Build Locally
Before deploying:
```bash
npm run build
npm run preview
# Test at http://localhost:4173
```

### 3. Check Console for Errors
Open browser dev tools and check for:
- "React is not defined" errors
- 404 errors for assets
- Routing issues

## Troubleshooting

### If you still get "React is not defined":

1. **Check all .jsx files have React imports**:
   ```bash
   find src -name "*.jsx" -exec grep -L "import React" {} \;
   ```

2. **Verify build output**:
   ```bash
   npm run build
   # Check if build completes without errors
   ```

3. **Test locally**:
   ```bash
   npm run preview
   # Visit http://localhost:4173 and check console
   ```

### Asset Loading Issues:

If assets don't load correctly:
- Check `VITE_BASE_PATH` matches your deployment path
- Ensure server is configured to serve static files from correct directory

## Environment Files

- `.env.development` - For local development
- `.env.production` - For AWS deployment
- Make sure `VITE_BASE_PATH` is correctly set for your deployment scenario

The application should now deploy successfully to AWS without React import errors.
