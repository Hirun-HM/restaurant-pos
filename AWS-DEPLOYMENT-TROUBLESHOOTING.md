# AWS Deployment Troubleshooting Guide

## Issues Fixed
✅ React import errors - All components now properly import React  
✅ GitHub Pages redirect script removed from index.html  
✅ CSS compilation working - Tailwind classes properly generated  
✅ Build process successful  

## Remaining Potential Issues

### 1. **CSS Loading on AWS**

**Problem**: CSS might not be loading due to incorrect MIME types or path issues.

**Solutions**:

#### A. Nginx Configuration (if using Nginx)
Ensure your `nginx.conf` includes proper MIME types:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    # Proper MIME types
    location ~* \.(css)$ {
        add_header Content-Type text/css;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### B. Apache Configuration (if using Apache)
Add to `.htaccess` in your dist folder:

```apache
AddType text/css .css
AddType application/javascript .js

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### 2. **Base Path Configuration**

**Problem**: Assets not loading due to incorrect base paths.

**Current Configuration**:
- Vite base: `/` (root)
- Router basename: `/` (root)

**For Subdirectory Deployment** (like `/restaurant-pos/`):

1. Update `.env.production`:
   ```bash
   VITE_BASE_PATH=/restaurant-pos/
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

### 3. **CORS Issues**

**Problem**: API calls failing due to CORS.

**Solution**: Update your backend to allow your frontend domain:

```javascript
// In your backend (server.js)
app.use(cors({
    origin: ['http://your-aws-domain.com', 'https://your-aws-domain.com'],
    credentials: true
}));
```

### 4. **Environment Variables**

**Problem**: Environment variables not loading correctly.

**Check**: Your current `.env.production`:
```bash
VITE_BASE_PATH=
VITE_API_URL=http://3.142.250.63:5000/api
VITE_NODE_ENV=production
```

**Test**: Add console logs to verify:
```javascript
// Add to src/App.jsx temporarily
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Base Path:', import.meta.env.VITE_BASE_PATH);
```

## Debugging Steps

### 1. **Check Browser Console**
Open DevTools and look for:
- ❌ Failed to load CSS files (404 errors)
- ❌ "React is not defined" errors
- ❌ API request failures
- ❌ Routing issues

### 2. **Verify File Structure on Server**
Ensure your AWS server has:
```
/var/www/html/ (or your web root)
├── index.html
├── assets/
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── logo-[hash].jpg
└── logo.jpg
```

### 3. **Test Direct Asset Access**
Try accessing CSS directly in browser:
```
http://your-aws-ip/assets/index-DSC7MzEE.css
```

Should return CSS content, not 404.

### 4. **Check Server Logs**
Look at server logs for:
- 404 errors for assets
- Permission issues
- Server configuration errors

## Quick Fixes

### Fix 1: Force Refresh
```bash
# On AWS server, clear any cached files
rm -rf /var/www/html/*
# Re-upload dist folder contents
```

### Fix 2: Set Correct Permissions
```bash
# On AWS server
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### Fix 3: Test with Simple Server
```bash
# Test locally first
npm run build
npm run preview
# Visit http://localhost:4173 - should work perfectly
```

### Fix 4: Check Content-Type Headers
Use browser DevTools Network tab to verify CSS files are served with:
```
Content-Type: text/css
```

## Environment-Specific Builds

### For Development
```bash
cp .env.development .env
npm run build
```

### For Production
```bash
cp .env.production .env
npm run build
```

### For Subdirectory
```bash
echo "VITE_BASE_PATH=/restaurant-pos/" > .env.local
npm run build
```

## If Everything Else Fails

1. **Rebuild from scratch**:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Test with minimal build**:
   - Create a simple HTML file with just CSS to test if static files work
   - Gradually add React components

3. **Check AWS Security Groups**:
   - Ensure port 80/443 are open
   - Verify firewall settings

4. **Use AWS CloudFront**:
   - Can help with asset delivery and caching issues

The most likely issue is either MIME type configuration or file permissions on your AWS server.
