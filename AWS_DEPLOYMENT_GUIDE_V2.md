# End-to-End AWS EC2 Deployment Guide (Updated with Clerk)

This guide is tailored specifically for your project with your **actual database credentials** included. Use this version for deployment.

---

## 1. Launch & Connect to AWS EC2

1.  **Launch Instance**:
    *   Go to **AWS Console > EC2 > Launch Instance**.
    *   **Name**: `LeadManagementApp`.
    *   **AMI**: `Ubuntu Server 24.04 LTS`.
    *   **Instance Type**: `t3.small` (Recommended) or `t2.micro`.
    *   **Key Pair**: Create new -> `lead-app-key` -> Download `.pem`.
    *   **Security Group**: Allow **SSH**, **HTTP**, **HTTPS**.
    *   Click **Launch**.

2.  **Connect**:
    *   Open Terminal (or Git Bash on Windows).
    *   Navigate to your key file using `cd`.
    *   Run:
        ```bash
        chmod 400 lead-app-key.pem
        ssh -i "lead-app-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
        ```

---

## 2. Server Setup (Copy & Paste)

Run these commands on your EC2 server to install Node.js 18, Nginx, and PM2.
*Note: You do NOT need to install MongoDB or Clerk separately. They are handled via the Cloud and NPM.*

```bash
# Update System
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx & Zip (for file handling)
sudo apt install -y nginx zip unzip

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

---

## 3. Upload Your Code

Since your code is local, the easiest way (without setting up Git auth) is to copy it securely from your local machine.

**On your LOCAL machine (open a new terminal window):**

```bash
# Navigate to your project root
cd e:\VM-Lead-Management-System\Lead-Management-System

# Exclude node_modules to make upload fast (create a temporary zip)
# Windows PowerShell command to zip (or just right-click folder -> Send to -> Compressed folder named 'project.zip')

# Upload the zip file to EC2 using SCP
scp -i "path/to/lead-app-key.pem" project.zip ubuntu@<YOUR_EC2_PUBLIC_IP>:~/
```

**Back on EC2 Server:**

```bash
# Unzip the project
unzip project.zip -d app
cd app
```

---

## 4. Deploy Backend

```bash
cd backend

# Install dependencies (This installs Clerk SDK and Mongoose automatically)
npm install

# Create .env file with YOUR Credentials
# We write this directly to the file:
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb+srv://kalyanguraka7_db_user:cKNMM6YxANy4vGK5@cluster0.eaccjad.mongodb.net/?appName=Cluster0" >> .env
# Note: Since auth is frontend-only for now, backend key is optional unless verifying tokens server-side.

# Start Backend with PM2
pm2 start src/app.js --name "lead-backend"
pm2 save
pm2 startup
```

---

## 5. Deploy Frontend

**Important:** You must provide your Clerk Publishable Key during the build.

```bash
cd ../ # Go back to app root

# Install dependencies
npm install

# Build the Frontend with your Clerk Key
# REPLACE 'pk_test_...' with your ACTUAL key from your local .env file
export VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
npm run build

# Copy build files to Nginx web folder
sudo cp -r dist/* /var/www/html/
```

---

## 6. Configure Nginx

This connects the internet to your app.

```bash
# Open config file
sudo nano /etc/nginx/sites-available/default
```

**Delete everything in that file and paste this:**

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

**Save & Exit:** Press `Ctrl+O`, `Enter`, `Ctrl+X`.

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

---

## 7. Done!

Go to `http://<YOUR_EC2_PUBLIC_IP>` in your browser.

Your Lead Management System is now live!
- **Database**: Connected to MongoDB Atlas.
- **Auth**: Secured by Clerk.
