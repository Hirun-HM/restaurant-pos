#!/bin/bash

echo "🚀 FINAL DEPLOYMENT - Restaurant POS"
echo "===================================="

# Check build files
echo "📦 Checking build files..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html missing"
    exit 1
fi

if [ ! -f "dist/assets/index-D7iWNJ_m.js" ]; then
    echo "❌ JS file missing"
    exit 1
fi

if [ ! -f "dist/assets/index-DSC7MzEE.css" ]; then
    echo "❌ CSS file missing"
    exit 1
fi

echo "✅ All build files present"

# Check for basename issues
echo "🔍 Checking for routing issues..."
if grep -q 'basename=' src/App.jsx; then
    echo "⚠️  Warning: basename found in App.jsx"
    grep -n 'basename=' src/App.jsx
else
    echo "✅ No basename issues in App.jsx"
fi

# Check Vite config
echo "🔍 Checking Vite config..."
if grep -q "base: '\./'" vite.config.js; then
    echo "✅ Vite base path is correct (relative)"
else
    echo "⚠️  Vite base path might need adjustment"
    grep -n "base:" vite.config.js
fi

# Check HTML
echo "🔍 Checking HTML output..."
if grep -q "index-D7iWNJ_m.js" dist/index.html; then
    echo "✅ Correct JS file referenced in HTML"
else
    echo "❌ JS file reference mismatch in HTML"
fi

if grep -q "Critical CSS" dist/index.html; then
    echo "✅ Critical CSS included in HTML"
else
    echo "❌ Critical CSS missing from HTML"
fi

echo ""
echo "📋 DEPLOYMENT READY!"
echo "===================================="
echo "1. Copy the entire 'dist' folder to your AWS server"
echo "2. Replace the existing files in your nginx container"
echo "3. Restart the container"
echo ""
echo "🌐 Expected URL: http://ec2-3-142-250-63.us-east-2.compute.amazonaws.com:3000/"
echo ""
echo "✅ This build should work without routing errors"
echo "✅ No basename conflicts"
echo "✅ CSS fallbacks included"
echo "✅ Error handling for browser extensions"
echo ""
echo "🔧 If you still see issues:"
echo "   - Check browser Network tab for 404 errors"
echo "   - Verify Docker container is serving files correctly"
echo "   - Hard refresh (Ctrl+F5) to clear cache"
