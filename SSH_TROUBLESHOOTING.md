# SSH Key Setup Guide for GitHub Actions

## The Issue
The deployment failed with SSH key errors. Here's how to fix it:

## Step 1: Prepare Your PEM Key

### 1.1 Check Your PEM Key Format
Your PEM key should look exactly like this:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
[multiple lines of base64 encoded data]
...
-----END RSA PRIVATE KEY-----
```

### 1.2 Convert PEM Key if Needed
If your key has a different format (like `BEGIN OPENSSH PRIVATE KEY`), convert it:

```bash
# Convert OpenSSH format to RSA format
ssh-keygen -p -m PEM -f your-key.pem
```

## Step 2: Add Secrets to GitHub

### 2.1 Add AWS_PEM_KEY
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AWS_PEM_KEY`
5. Value: Copy your ENTIRE PEM key content including the BEGIN and END lines

**Important**: 
- Include the `-----BEGIN RSA PRIVATE KEY-----` line
- Include the `-----END RSA PRIVATE KEY-----` line
- Include ALL lines in between
- Don't add extra spaces or newlines

### 2.2 Add AWS_SERVER_IP
1. Click "New repository secret"
2. Name: `AWS_SERVER_IP`
3. Value: `18.223.166.161` (your server IP)

## Step 3: Test Your PEM Key Locally

Before using it in GitHub Actions, test it locally:

```bash
# Test SSH connection
ssh -i your-key.pem ubuntu@18.223.166.161

# If you get permission errors, fix permissions:
chmod 600 your-key.pem
```

## Step 4: AWS Security Group Setup

Make sure your AWS EC2 security group allows:

| Type | Protocol | Port Range | Source |
|------|----------|------------|--------|
| SSH | TCP | 22 | 0.0.0.0/0 (or your IP) |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 |

## Step 5: Verify GitHub Secrets

After adding secrets, you can verify they're set correctly:
1. Go to your repository
2. Settings → Secrets and variables → Actions
3. You should see both `AWS_PEM_KEY` and `AWS_SERVER_IP` listed

## Common Issues and Solutions

### Issue 1: "Load key error in libcrypto"
**Solution**: Your PEM key format is wrong. Convert it using:
```bash
ssh-keygen -p -m PEM -f your-key.pem
```

### Issue 2: "Permission denied (publickey)"
**Solutions**:
1. Check that the PEM key is the correct one for your EC2 instance
2. Verify the username is `ubuntu` (for Ubuntu instances)
3. Check that your key hasn't been corrupted when copying to GitHub secrets

### Issue 3: "Host key verification failed"
**Solution**: The workflow now includes `-o StrictHostKeyChecking=no` to bypass this

### Issue 4: Key has wrong permissions
**Solution**: The workflow sets `chmod 600` automatically

## Testing Your Setup

After setting up the secrets, you can trigger the deployment by:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push origin main
   ```

2. **Or trigger manually**:
   - Go to GitHub → Actions tab
   - Click on "Deploy to AWS Server"
   - Click "Run workflow"

## Debugging Steps

If deployment still fails:

1. **Check the Actions log** for specific error messages
2. **Test SSH locally** with your PEM key
3. **Verify EC2 instance is running** and accessible
4. **Check security group settings** in AWS console

## Alternative: Using SSH Actions

If you continue having issues, you can use the `appleboy/ssh-action` instead:

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.AWS_SERVER_IP }}
    username: ubuntu
    key: ${{ secrets.AWS_PEM_KEY }}
    script: |
      echo "SSH connection successful"
```

Let me know if you need help with any of these steps!
