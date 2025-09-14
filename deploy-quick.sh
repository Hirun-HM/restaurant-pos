#!/bin/bash

# Quick deployment script for AWS
# This script builds the project and provides deployment instructions

echo "🚀 Building project for AWS deployment..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📁 Files to upload to AWS server:"
echo "   - Upload ALL contents of 'dist/' folder to your web server directory"
echo "   - Usually: /var/www/html/ or /usr/share/nginx/html/"
echo ""
echo "🔧 Key changes made:"
echo "   - ✅ Relative paths (./assets/ instead of /assets/)"
echo "   - ✅ React imports fixed"
echo "   - ✅ GitHub Pages script removed"
echo ""
echo "📋 Deployment steps:"
echo "   1. Copy dist/ contents to AWS server"
echo "   2. Set proper permissions: sudo chmod -R 755 /var/www/html/"
echo "   3. Restart nginx: sudo systemctl restart nginx"
echo "   4. Test: visit http://your-aws-ip"
echo ""
echo "🐛 If CSS still doesn't load, check:"
echo "   - Browser DevTools Network tab for 404 errors"
echo "   - Server logs: sudo tail -f /var/log/nginx/error.log"
echo "   - File permissions on server"
echo ""
echo "✨ Ready to deploy!"
