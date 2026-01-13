# Lead Management System

A comprehensive Lead Management System designed to ensure zero-miss follow-ups. Track leads, manage documents, schedule actions, and keep organized with structured meeting notes.

## Project Overview

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas)
- **Styling**: Tailwind CSS + shadcn/ui

## Project Structure

- **`/` (Root Directory)**: Contains the Frontend application code.
- **`/backend`**: Contains the Backend API, database models, and server logic.

## Prerequisites

- **Node.js**: v18 or higher is recommended.
- **MongoDB Atlas Account**: You need a running MongoDB cluster or a valid connection string.

## Authentication

This project uses **Clerk** for secure user authentication.

- **Login-Only Application**: The dashboard and all lead data are protected. Users must log in to access the app.
- **No Signups**: The login page does not allow self-registration by default.
- **Configuration**: You must provide the `VITE_CLERK_PUBLISHABLE_KEY` in your Frontend `.env` file for the login flow to work.

---

## 1. Backend Setup & Run

The backend handles API requests, database connections, and file uploads.

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a new file named `.env` in the `backend` folder.
   - Add the following content:
     ```env
     MONGODB_URI=<your_mongodb_connection_string>
     PORT=5000
     ```
   - Replace `<your_mongodb_connection_string>` with your actual MongoDB Atlas connection URL.

4. **Start the Backend Server**:
   ```bash
   npm run dev
   ```
   - The server will start on **http://localhost:5000**.
   - You should see "MongoDB Connected" in the terminal if successful.

---

## 2. Frontend Setup & Run

The frontend provides the user interface for managing leads.

1. **Navigate to the project root folder** (if you are currently in `backend`, go back up):
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Frontend Application**:
   ```bash
   npm run dev
   ```
   - The application will run (typically) on **http://localhost:8080** (check terminal output for the exact port).

---

## Running the Application

1. **Start the Backend First**: Ensure the backend server is running on port 5000.
2. **Start the Frontend**: Run the frontend in a separate terminal.
3. **Open Browser**: Navigate to the frontend URL (e.g., http://localhost:8080).
4. **Interact**: The frontend will automatically communicate with the backend at `http://localhost:5000`.

## Notes

- **Security**: Never commit your `.env` file to version control (Git). It contains sensitive database credentials.
- **Database**: Ensure your MongoDB IP Access List allows connections from your current IP (or allow 0.0.0.0/0 for development).
- **Troubleshooting**: If leads don't load, check the browser console and backend terminal for errors. Ensure the Backend is running and connected to MongoDB.
