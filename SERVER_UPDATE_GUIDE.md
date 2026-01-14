# Server Update Guide

These commands are for updating your live AWS EC2 server after you have pushed changes to GitHub.

## Prerequisite: Switch to Git (Run Once)
Since you likely uploaded a Zip file initially, your server folder isn't connected to GitHub yet. Run this once on your server:

```bash
cd app
# Initialize Git
git init
# Connect to your repo
git remote add origin https://github.com/kalyan-venturemond/VM-Lead-Management-System.git
# Force match the repo
git fetch --all
git reset --hard origin/main
```

## Standard Update Process (Run Whenever You Update Code)

Run these commands on your server whenever you have new changes:

### 1. Pull Latest Code
```bash
cd ~/app
git pull origin main
```

### 2. Rebuild Frontend (Important for UI Changes)
```bash
# Install any new packages
npm install

# Build the static files
npm run build

# Move build to web server folder
sudo cp -r dist/* /var/www/html/
```

### 3. Restart Backend (Important for API/Logic Changes)
```bash
pm2 restart all
```
