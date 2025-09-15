#!/bin/bash

echo "🔍 DEBUGGING DEPLOYMENT ISSUE"
echo "=============================="

echo "📋 Current source code status:"
echo "1. App.jsx basename check:"
if grep -q "basename=" src/App.jsx; then
    echo "❌ FOUND basename in App.jsx:"
    grep -n "basename=" src/App.jsx
else
    echo "✅ No basename found in App.jsx - CORRECT"
fi

echo ""
echo "2. Current git commit:"
git log --oneline -1

echo ""
echo "3. Build test:"
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
    
    # Check if the built files have basename
    if find dist -name "*.js" -exec grep -l "basename.*restaurant-pos" {} \; 2>/dev/null | head -1; then
        echo "❌ Built JS files still contain restaurant-pos basename!"
        find dist -name "*.js" -exec grep -l "basename.*restaurant-pos" {} \;
    else
        echo "✅ Built JS files do not contain restaurant-pos basename"
    fi
else
    echo "❌ Local build failed:"
    cat build.log
fi

echo ""
echo "📡 Checking deployed version:"
echo "Deployed version should show the latest commit hash in browser console"

echo ""
echo "🚨 DEPLOYMENT TROUBLESHOOTING:"
echo "1. Check GitHub Actions logs for build errors"
echo "2. Verify ECR images are being updated"
echo "3. Ensure docker-compose is pulling latest images"
echo "4. Check if there's Docker image caching on AWS"
echo ""
echo "💡 QUICK FIX: If issue persists, try:"
echo "   - Add --no-cache to Docker build in CI/CD"
echo "   - Clear Docker cache on AWS server: docker system prune -a"
echo "   - Restart EC2 instance to clear all caches"

rm -f build.log
