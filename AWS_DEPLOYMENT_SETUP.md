# AWS Deployment Setup Guide

This guide will help you set up GitHub Actions CI/CD for deploying your Restaurant POS system to AWS.

## Prerequisites

1. **AWS EC2 Instance**: You need an AWS EC2 instance with Ubuntu
2. **PEM Key**: Your private key file for SSH access
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Configure GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1.1 Add AWS_PEM_KEY Secret

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `AWS_PEM_KEY`
6. Value: Copy and paste the entire content of your `.pem` file, including:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   [your key content]
   -----END RSA PRIVATE KEY-----
   ```

### 1.2 Add AWS_SERVER_IP Secret

1. Click **New repository secret** again
2. Name: `AWS_SERVER_IP`
3. Value: Your AWS EC2 instance public IP address (e.g., `3.15.123.456`)

## Step 2: AWS Server Setup

### 2.1 Security Group Configuration

Make sure your AWS EC2 security group allows:
- **SSH (Port 22)**: For deployment access
- **HTTP (Port 80)**: For web traffic
- **HTTPS (Port 443)**: For secure web traffic (optional)
- **Custom Port 3000**: For your backend API (or whatever port you're using)

### 2.2 Connect to Your Server

```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

### 2.3 Initial Server Setup (Optional)

Update the system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

## Step 3: Deploy

Once you've set up the secrets, the deployment will happen automatically when you:

1. Push code to the `main` branch, OR
2. Manually trigger the workflow from the GitHub Actions tab

## Step 4: Verify Deployment

After deployment, you can verify by:

1. **Check the GitHub Actions tab** for deployment status
2. **Visit your server IP** in a browser: `http://your-server-ip`
3. **SSH to your server** and check the deployment:
   ```bash
   ssh -i your-key.pem ubuntu@your-server-ip
   cd /var/www/restaurant-pos
   sudo docker-compose ps
   ```

## Deployment Structure

The deployment creates the following structure on your AWS server:

```
/var/www/restaurant-pos/
├── frontend/           # Built React app
├── backend/           # Node.js backend
├── docker-compose.yml # Docker configuration
└── nginx.conf        # Nginx configuration
```

## Troubleshooting

### Common Issues:

1. **Permission denied (publickey)**
   - Check that your PEM key is correctly added to GitHub secrets
   - Ensure the key has the right format with begin/end markers

2. **Connection refused**
   - Check AWS security group settings
   - Verify the server IP is correct
   - Make sure the server is running

3. **Docker issues**
   - The script automatically installs Docker if not present
   - Check docker service: `sudo systemctl status docker`

4. **Nginx issues**
   - Check nginx status: `sudo systemctl status nginx`
   - Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Manual Commands for Debugging:

SSH to your server and run:

```bash
# Check running containers
sudo docker-compose ps

# View logs
sudo docker-compose logs

# Restart services
sudo docker-compose restart

# Check nginx
sudo systemctl status nginx

# Check available space
df -h
```

## Security Considerations

1. **Keep your PEM key secure** - Never commit it to the repository
2. **Use HTTPS** - Consider setting up SSL certificates (Let's Encrypt)
3. **Regular updates** - Keep your server and dependencies updated
4. **Firewall** - Only open necessary ports in security groups

## Next Steps

After successful deployment, consider:

1. Setting up a domain name and SSL certificate
2. Implementing database backups
3. Setting up monitoring and logging
4. Creating staging and production environments

## Support

If you encounter issues:

1. Check the GitHub Actions logs for deployment errors
2. SSH to your server and check system logs
3. Verify all secrets are correctly set in GitHub
