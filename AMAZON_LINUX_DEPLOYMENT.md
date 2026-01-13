# AWS Deployment Guide (Amazon Linux 2023 AMI)

This guide is for deploying on **Amazon Linux 2023** (which uses `dnf`/`yum` instead of `apt`).

---

## 1. Launch Instance (Amazon Linux)

1.  **AMI**: Select **Amazon Linux 2023 AMI**.
2.  **Architecture**: 64-bit (x86).
3.  **Security Group**: Allow Ports **22, 80, 443**.

---

## 2. Server Setup Commands

Connect to your server (`ssh -i key.pem ec2-user@YOUR_IP`) and run these commands:

```bash
# 1. Update System
sudo dnf update -y

# 2. Install Node.js 18
sudo dnf install -y nodejs18
# Verify: node -v (Should be v18+)

# 3. Install Nginx
sudo dnf install -y nginx

# 4. Install Git & Zip
sudo dnf install -y git zip unzip

# 5. Install PM2 (globally)
sudo npm install -g pm2
```

---

## 3. Upload & Setup Project

1.  **Upload**: (Same as before)
    ```bash
    scp -i "key.pem" project.zip ec2-user@YOUR_IP:~/
    ```

2.  **Unzip**:
    ```bash
    unzip project.zip -d app
    cd app
    ```

---

## 4. Deploy Backend

```bash
cd backend
npm install

# Setup .env (Ensure credentials are correct)
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb+srv://kalyanguraka7_db_user:cKNMM6YxANy4vGK5@cluster0.eaccjad.mongodb.net/?appName=Cluster0" >> .env

# Start with PM2
pm2 start src/app.js --name "backend"
pm2 save
pm2 startup
# (Run the command PM2 tells you to run after 'pm2 startup')
```

---

## 5. Deploy Frontend

```bash
cd ../
npm install

# Build with Clerk Key
export VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (YOUR KEY)
npm run build

# Move files to Nginx Root
# Amazon Linux default web root is usually /usr/share/nginx/html
sudo cp -r dist/* /usr/share/nginx/html/
```

---

## 6. Configure Nginx

1.  **Edit Config**:
    ```bash
    sudo nano /etc/nginx/nginx.conf
    ```
    *(Note: Amazon Linux uses `nginx.conf` directly or `conf.d` folders, typically `nginx.conf` has the server block)*.

2.  **Modify Server Block**:
    Find the `server { ... }` block inside the `http` block and replace it (or ensure it looks like this):

    ```nginx
    server {
        listen       80;
        server_name  vm-lm1.calvio.store; # OR your IP
        root         /usr/share/nginx/html;

        # Frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Backend Proxy
        location /api/ {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Keep existing error_page configs if present
    }
    ```

3.  **Start Nginx**:
    ```bash
    sudo systemctl enable nginx
    sudo systemctl start nginx
    ```

---

## 7. SSL (Certbot on Amazon Linux 2023)

Amazon Linux 2023 doesn't have `certbot-nginx` in default repos usually. Using `pip` is recommended.

```bash
# Install Python virtualenv
sudo dnf install -y python3 augeas-libs
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot-nginx

# Create symlink
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot

# Run Certbot
sudo certbot --nginx
```

---

## Summary of Differences (Amazon Linux vs Ubuntu)
- **Repo Manager**: `dnf` instead of `apt`.
- **User**: `ec2-user` instead of `ubuntu`.
- **Nginx Root**: `/usr/share/nginx/html` (typically) vs `/var/www/html`.
- **Config Path**: `/etc/nginx/nginx.conf` vs `/etc/nginx/sites-available/...`.
