# End-to-End AWS EC2 Deployment Guide (Custom Domain)

**Domain**: `vm-lm1.calvio.store`
**IP**: `54.227.18.201`

---

## 1. Connect to Server

```bash
ssh -i "lead-app-key.pem" ubuntu@54.227.18.201
```

*(Assuming you have already launched the instance and have the key)*

---

## 2. Server Setup (If not done)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx zip unzip
sudo npm install -g pm2
```

---

## 3. Upload & Deploy App

*(Follow steps 3, 4, and 5 from the previous guide to upload code, start backend, and build frontend. Ensure you export your Clerk Key before building!)*

---

## 4. Configure Nginx for Your Domain

We will configure Nginx to serve `vm-lm1.calvio.store`.

1.  **Open Config**:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```

2.  **Paste This Configuration**:

    ```nginx
    server {
        listen 80;
        server_name vm-lm1.calvio.store;

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

3.  **Restart Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

---

## 5. Enable SSL (HTTPS)

Secure your domain with a free Let's Encrypt certificate.

1.  **Install Certbot**:
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    ```

2.  **Generate Certificate**:
    ```bash
    sudo certbot --nginx -d vm-lm1.calvio.store
    ```
    *   Enter your email when asked.
    *   Agree to terms (`Y`).
    *   Select option `2` (Redirect) if asked, to force HTTPS.

---

## 6. Verify

Visit **https://vm-lm1.calvio.store**

You should see your secure, deployed application.
