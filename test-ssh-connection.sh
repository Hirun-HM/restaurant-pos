#!/bin/bash

# AWS SSH Connection Test Script
# This script helps you test your SSH connection to AWS before using GitHub Actions

# Configuration
PEM_KEY_PATH="path/to/your-key.pem"  # Update this path
AWS_IP="18.223.166.161"
USERNAME="ubuntu"

echo "=== AWS SSH Connection Test ==="
echo "Server IP: $AWS_IP"
echo "Username: $USERNAME"
echo "PEM Key: $PEM_KEY_PATH"
echo ""

# Check if PEM key exists
if [ ! -f "$PEM_KEY_PATH" ]; then
    echo "❌ Error: PEM key file not found at $PEM_KEY_PATH"
    echo "Please update the PEM_KEY_PATH variable in this script"
    exit 1
fi

# Check PEM key permissions
PEM_PERMS=$(stat -f "%OLp" "$PEM_KEY_PATH" 2>/dev/null || stat -c "%a" "$PEM_KEY_PATH" 2>/dev/null)
if [ "$PEM_PERMS" != "600" ]; then
    echo "⚠️  Warning: PEM key permissions are $PEM_PERMS (should be 600)"
    echo "Fixing permissions..."
    chmod 600 "$PEM_KEY_PATH"
    echo "✅ Fixed: PEM key permissions set to 600"
fi

echo "🔍 Testing SSH connection..."

# Test basic SSH connection
if ssh -i "$PEM_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$USERNAME@$AWS_IP" "whoami" > /dev/null 2>&1; then
    echo "✅ SSH connection successful!"
    
    # Test sudo access
    echo "🔍 Testing sudo access..."
    if ssh -i "$PEM_KEY_PATH" -o StrictHostKeyChecking=no "$USERNAME@$AWS_IP" "sudo whoami" > /dev/null 2>&1; then
        echo "✅ Sudo access working!"
    else
        echo "❌ Sudo access failed"
        echo "The ubuntu user might not have passwordless sudo access"
    fi
    
    # Get system info
    echo ""
    echo "📋 Server Information:"
    ssh -i "$PEM_KEY_PATH" -o StrictHostKeyChecking=no "$USERNAME@$AWS_IP" "
        echo 'OS: '$(lsb_release -d -s 2>/dev/null || echo 'Unknown')
        echo 'Kernel: '$(uname -r)
        echo 'Architecture: '$(uname -m)
        echo 'Uptime: '$(uptime -p 2>/dev/null || uptime)
        echo 'Disk Space: '$(df -h / | tail -1 | awk '{print \$4\" available\"}')"
    
    echo ""
    echo "🎉 All tests passed! Your SSH connection is ready for GitHub Actions."
    
else
    echo "❌ SSH connection failed!"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check if the PEM key is correct for this EC2 instance"
    echo "2. Verify the server IP address: $AWS_IP"
    echo "3. Ensure the EC2 instance is running"
    echo "4. Check AWS Security Group allows SSH (port 22) from your IP"
    echo "5. Verify the username is 'ubuntu' for Ubuntu instances"
    echo ""
    echo "Manual test command:"
    echo "ssh -i $PEM_KEY_PATH -v ubuntu@$AWS_IP"
    exit 1
fi

echo ""
echo "📝 To use this in GitHub Actions:"
echo "1. Add AWS_PEM_KEY secret with the content of: $PEM_KEY_PATH"
echo "2. Add AWS_SERVER_IP secret with value: $AWS_IP"
echo "3. Ensure your PEM key is in RSA format (not OpenSSH format)"
echo ""
echo "To convert OpenSSH to RSA format:"
echo "ssh-keygen -p -m PEM -f $PEM_KEY_PATH"
