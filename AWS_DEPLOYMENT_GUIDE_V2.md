# Complete AWS EC2 Deployment Guide (Fresh Server)

This is the exact, step-by-step guide to deploying your Lead Management System to a brand new AWS EC2 server, connected to your new `techteam_db_user` MongoDB database on `cluster0.owz0jgd`.

---

## 🚀 Phase 1: Launch the EC2 Instance

1. Go to your **AWS Console > EC2 > Launch Instance**.
2. **Name**: `LMS-Production-Server`.
3. **AMI (OS)**: Select **Ubuntu 24.04 LTS**.
4. **Instance Type**: Select `t3.small` (Recommended for React builds) or `t2.micro` (Free tier).
5. **Key Pair**: Create a new Key Pair named `lms-server-key.pem` and download it to your computer.
6. **Network Settings**: Check BOTH boxes:
   - ✅ Allow HTTP traffic from the internet
   - ✅ Allow HTTPS traffic from the internet
7. Click **Launch Instance**.

---

## 💻 Phase 2: Connect & Install Software

Open Git Bash (or PowerShell) on your local computer where your `.pem` key is.

```bash
# Connect to your server (replace with your server's Public IP)
chmod 400 lms-server-key.pem
ssh -i "lms-server-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Once you are logged into the AWS server, paste this block to install everything:

```bash
# Update Ubuntu
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 & Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx zip unzip

# Install PM2 to keep the backend running forever
sudo npm install -g pm2
```

---

## 📦 Phase 3: Upload Your Code

The easiest way to get your local code to the fresh server is to use GitHub.

1. Publish your local `Lead-Management-System` folder to a GitHub repository.
2. In your AWS terminal, clone the repository:

```bash
# Clone the repository (Replace URL with yours)
git clone <YOUR_GITHUB_REPO_URL>

# Enter the folder
cd Lead-Management-System
```

---

## ⚙️ Phase 4: Configure & Start Backend

```bash
cd backend
npm install
```

**CRITICAL STEP: Create the `.env` file!**
*Linux is very strict. Do NOT put quotes `"` around the MongoDB URLs on the server, or the backend will crash with an "Invalid scheme" error!*

Run this exact block of commands to automatically safely create the `.env` file:

```bash
# This creates the .env file with the proper formatting
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb+srv://techteam_db_user:PAnxIpwBxAgei6oJ@cluster0.owz0jgd.mongodb.net/venturemond_lms?retryWrites=true&w=majority" >> .env
echo "WEBSITE_DB_URI=mongodb+srv://techteam_db_user:PAnxIpwBxAgei6oJ@cluster0.owz0jgd.mongodb.net/venturemond_lms?retryWrites=true&w=majority" >> .env
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_c2hhcnAtcm9kZW50LTQwLmNsZXJrLmFjY291bnRzLmRldiQ" >> .env
echo "CLERK_SECRET_KEY=sk_test_bmfQn8odXtPE9oknSFHlyuWUkuz609wHi5McfxA11h" >> .env
```

**Start the Backend:**
```bash
pm2 start src/server.js --name "lms-backend"
pm2 save
pm2 startup
```
*(You can verify it started successfully by typing `pm2 logs`. You should see "MongoDB Connected".)*

---

## 🎨 Phase 5: Build The Frontend

```bash
# Go back to the main frontend folder
cd ~/Lead-Management-System

# Install React dependencies
npm install

# Safely inject the Clerk Public Key and Build the App
export VITE_CLERK_PUBLISHABLE_KEY=pk_test_c2hhcnAtcm9kZW50LTQwLmNsZXJrLmFjY291bnRzLmRldiQ
npm run build

# Copy the built website to the public internet folder
sudo cp -r dist/* /var/www/html/
```

---

## 🌍 Phase 6: Configure Nginx Routing

We need Nginx to route `/api/` traffic to the backend, and normal clicks to the React frontend.

```bash
sudo nano /etc/nginx/sites-available/default
```

Delete everything currently inside that file, and paste this block:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    # Frontend Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Routing
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
**Save & Exit:** Press `Ctrl+O`, hit `Enter`, press `Ctrl+X`.

**Restart Web Server:**
```bash
sudo systemctl restart nginx
```

---

## 🎉 Phase 7: Connect a Domain & Add Free SSL (HTTPS)

Before you can add an SSL certificate, you **must** connect a real domain name to your AWS server. Let's Encrypt cannot secure a raw IP address.

### 1. Point Your Domain to AWS
1. Go to your Domain Registrar (GoDaddy, Namecheap, Route53, etc.).
2. Go to **DNS Settings**.
3. Create an **A Record**:
   - **Name/Host**: `@` (or `lms` if using a subdomain like `lms.venturemond.com`)
   - **Value/Target**: `<YOUR_EC2_PUBLIC_IP>` (e.g. `13.56.24.89`)
   - **TTL**: Lowest possible (e.g. 5 mins)
4. Wait a few minutes for the DNS to propagate.

### 2. Update Nginx to recognize your Domain
Go back to your EC2 terminal and edit the Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/default
```
Find the line that says `server_name _;` and **replace the underscore `_` with your actual domain name.**
```nginx
server {
    listen 80;
    server_name lms.venturemond.com; # <--- CHANGE THIS TO YOUR DOMAIN

    # ...rest of your config
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`), then test the config:
```bash
# Check if config is valid
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Install Certbot (Let's Encrypt SSL)
Certbot is an automated tool that instantly gives your server a free, auto-renewing SSL certificate.

On your EC2 Terminal, run these commands:
```bash
# Install Certbot and its Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Request the Certificate (Replace with your actual email and domain)
sudo certbot --nginx -m tech@venturemond.com --agree-tos --no-eff-email -d lms.venturemond.com
```

### 4. What Certbot Does Next
You will see a success message. Certbot just did three things automatically:
1. Contacted Let's Encrypt to verify you own the domain.
2. Downloaded the secure SSL certificates to your `/etc/letsencrypt/` folder.
3. Automatically rewrote your Nginx configuration file to listen on Port 443 (HTTPS) and route all HTTP traffic to HTTPS.

### 5. Verify the Auto-Renewal
Let's Encrypt certificates expire every 90 days. But Certbot installed a background timer to renew them automatically!

Test the auto-renewal to make sure it works:
```bash
sudo certbot renew --dry-run
```
If that says success, your **Lead Management System is fully verified, secured with HTTPS, and live in Production forever!**
