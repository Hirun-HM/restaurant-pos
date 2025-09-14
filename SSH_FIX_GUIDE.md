# SSH Permission Issues - Complete Fix Guide

## The Problem
You're getting "permission denied" when connecting to AWS Ubuntu without `sudo`, which indicates SSH key or user permission issues.

## Step 1: Test Your SSH Connection Locally

I've created a test script for you. First, update the script with your PEM key path:

```bash
# Edit the test script
nano test-ssh-connection.sh

# Update this line with your actual PEM key path:
PEM_KEY_PATH="path/to/your-key.pem"  # Change this!

# Run the test
./test-ssh-connection.sh
```

## Step 2: Common SSH Issues and Fixes

### Issue 1: Wrong PEM Key Permissions
```bash
# Fix permissions
chmod 600 your-key.pem
```

### Issue 2: Wrong PEM Key Format
If your key starts with `-----BEGIN OPENSSH PRIVATE KEY-----`, convert it:
```bash
# Convert to RSA format
ssh-keygen -p -m PEM -f your-key.pem
# Press Enter when prompted for passphrase (leave empty)
```

### Issue 3: Wrong Username
For AWS Ubuntu instances, always use `ubuntu`:
```bash
# Correct
ssh -i your-key.pem ubuntu@18.223.166.161

# Wrong
ssh -i your-key.pem ec2-user@18.223.166.161  # This is for Amazon Linux
ssh -i your-key.pem root@18.223.166.161      # This won't work
```

### Issue 4: Security Group Settings
In AWS Console → EC2 → Security Groups, ensure:
- **Type**: SSH
- **Protocol**: TCP  
- **Port**: 22
- **Source**: 0.0.0.0/0 (or your specific IP)

### Issue 5: Instance State
Make sure your EC2 instance is:
- ✅ Running (not stopped/stopping)
- ✅ Status checks passed
- ✅ Has a public IP assigned

## Step 3: Test Manual SSH Connection

```bash
# Test basic connection
ssh -i your-key.pem -v ubuntu@18.223.166.161

# Test with specific options
ssh -i your-key.pem -o StrictHostKeyChecking=no ubuntu@18.223.166.161

# Test sudo access (should work without password)
ssh -i your-key.pem ubuntu@18.223.166.161 "sudo whoami"
```

## Step 4: GitHub Secrets Setup

Once local SSH works, set up GitHub secrets:

### 4.1 Get Your PEM Key Content
```bash
# Display your PEM key (copy this output)
cat your-key.pem
```

### 4.2 Add to GitHub
1. Go to your repo → Settings → Secrets and variables → Actions
2. Add `AWS_PEM_KEY` with the COMPLETE output from above
3. Add `AWS_SERVER_IP` with value `18.223.166.161`

**Important**: Include the entire PEM key:
```
-----BEGIN RSA PRIVATE KEY-----
[all the content]
-----END RSA PRIVATE KEY-----
```

## Step 5: Verify GitHub Actions Setup

The updated workflow now includes:
- ✅ Better error handling
- ✅ Proper sudo usage
- ✅ Service status checks
- ✅ Detailed logging

## Step 6: Alternative SSH Method

If you still have issues, you can use a different SSH action:

```yaml
# Add this to your workflow instead of manual SSH
- name: Deploy via SSH Action
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.AWS_SERVER_IP }}
    username: ubuntu
    key: ${{ secrets.AWS_PEM_KEY }}
    script: |
      echo "Connected successfully!"
      whoami
      sudo whoami
```

## Debugging Commands

If deployment still fails, SSH to your server and run:

```bash
# Check system status
sudo systemctl status docker
sudo systemctl status nginx

# Check running containers
sudo docker ps

# Check logs
sudo docker-compose logs

# Check disk space
df -h

# Check memory
free -h

# Check network
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001
```

## Quick Fix Checklist

- [ ] PEM key permissions are 600
- [ ] PEM key is in RSA format (not OpenSSH)
- [ ] Using 'ubuntu' username
- [ ] Security group allows SSH (port 22)
- [ ] EC2 instance is running
- [ ] Public IP is correct
- [ ] GitHub secrets are set correctly
- [ ] Local SSH test works

## Need Help?

Run the test script first:
```bash
./test-ssh-connection.sh
```

If it passes, your GitHub Actions should work. If it fails, fix the local connection first before trying GitHub Actions.

## Manual Connection Command

Your manual connection command should be:
```bash
ssh -i your-key.pem ubuntu@18.223.166.161
```

If this doesn't work, the issue is with your AWS setup, not the GitHub Actions workflow.
