# Deploying to AWS EC2

This guide describes how to deploy the **Lead Management System** (Frontend + Backend) onto a single **AWS EC2 instance**. This is a cost-effective and simple approach for moderate traffic, keeping the architecture similar to your local setup.

## Prerequisites

1.  **AWS Account**: You need an active AWS account.
2.  **MongoDB Atlas**: Your database is already in the cloud, so we just need the connection string.
3.  **Domain Name (Optional)**: If you want a custom URL (e.g., `myleads.com`).

---

## Step 1: Launch an EC2 Instance

1.  Log in to the **AWS Console** and navigate to **EC2**.
2.  Click **Launch Instances**.
3.  **Name**: `LeadManagementSystem`.
4.  **OS Image**: Choose **Ubuntu Server 24.04 LTS** (Free Tier eligible).
5.  **Instance Type**: `t2.micro` (Free Tier) or `t3.small` (Recommended).
6.  **Key Pair**: Create a new key pair (e.g., `lead-sys-key.pem`) and **download it**. Keep it safe!
7.  **Network Settings**:
    *   Check **Allow SSH traffic from** -> **My IP**.
    *   Check **Allow HTTP traffic from the internet**.
    *   Check **Allow HTTPS traffic from the internet**.
8.  Click **Launch Instance**.

---

## Step 2: Connect to Your Instance

1.  Open your terminal (on your local machine).
2.  Move your downloaded key file to a safe place and set permissions (Linux/Mac only):
    ```bash
    chmod 400 lead-sys-key.pem
    ```
3.  Connect via SSH (replace `YOUR_INSTANCE_IP` with the Public IPv4 address from AWS):
    ```bash
    ssh -i "path/to/lead-sys-key.pem" ubuntu@YOUR_INSTANCE_IP
    ```

---

## Step 3: Install Environment

Run these commands inside your EC2 terminal to install Node.js (v18), NPM, Git, and Nginx.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx (Web Server)
sudo apt install -y nginx

# Install PM2 (Process Manager to keep app running)
sudo npm install -g pm2
```

---

## Step 4: Deploy Backend

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    cd YOUR_REPO_NAME/backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create the `.env` file:
    ```bash
    nano .env
    ```
    Paste your production details (modify as needed):
    ```env
    PORT=5000
    MONGODB_URI=mongodb+srv://... (Your Atlas Connection String)
    ```
    Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

4.  **Start Backend**:
    ```bash
    # Assuming app.js or index.js is your entry point. Check package.json.
    # If your start script is "node src/app.js":
    pm2 start src/app.js --name "backend"
    
    # Save list so it restarts on reboot
    pm2 save
    pm2 startup
    ```

---

## Step 5: Deploy Frontend

1.  **Navigate to Frontend**:
    ```bash
    cd ../  # Go back to root
    # or cd ../Lead-Management-System (depending on your repo structure)
    npm install
    ```

2.  **Build the Project**:
    This creates a static `dist` folder optimized for production.
    ```bash
    npm run build
    ```

3.  **Move Build to Nginx**:
    Copy the built files to the web server directory.
    ```bash
    sudo cp -r dist/* /var/www/html/
    ```

---

## Step 6: Configure Nginx (Reverse Proxy)

We need Nginx to serve the Frontend files AND forward API requests to the Backend.

1.  **Edit Config**:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```

2.  **Update Content**:
    Replace the file content with this:

    ```nginx
    server {
        listen 80;
        server_name _;  # Or your domain name

        root /var/www/html;
        index index.html;

        # Serve Frontend
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to Backend (Port 5000)
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

3.  **Restart Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

---

## Step 7: Access Your App

Open your browser and visit:
`http://YOUR_INSTANCE_IP`

- You should see your Frontend dashboard.
- API requests will automatically route to your Backend.
- **Important**: Since we are using local file storage (`backend/uploads`), files uploaded will be saved on this server. Back them up regularly!

---

## Optional: Custom Domain & SSL (HTTPS)

1.  Point your domain's A Record to the EC2 IP address.
2.  Run `sudo apt install certbot python3-certbot-nginx`.
3.  Run `sudo certbot --nginx`.
