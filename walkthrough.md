# Feature Walkthrough: Admin Dashboard & User Management

## 1. Admin Dashboard Overview
**Objective:** Verify that the Admin user has access to system-wide statistics and user activity.

1.  **Login as Admin:**
    *   Sign in with an account that has the `admin` role in Clerk metadata.
2.  **Dashboard Stats Cards:**
    *   Observe the new top row of statistics:
        *   **Total Users**: Count of all registered users.
        *   **Total Leads (All)**: Count of all leads in the system.
        *   **Leads Today**: Leads created since midnight.
        *   **Active Users**: Number of users who have created at least one lead.
3.  **User Lead Activity Table:**
    *   Scroll down to see the "User Lead Activity" table.
    *   Verify columns: Email, Total Leads Created, Leads Created Today, Last Lead Created.
    *   This data helps track team performance.

## 2. Lead Visibility & Isolation
**Objective:** Ensure Admins see all leads, but regular users only see their own.

1.  **Admin View:**
    *   As Admin, you should see leads from *all* users.
    *   Check the "Creator" or "User" info if available (or infer from the Activity table).
2.  **User View:**
    *   Log out and log in as a **Regular User**.
    *   **Verify Stats:** You should NOT see the Admin Stats cards or the User Lead Activity table.
    *   **Verify Leads:** You should ONLY see leads created by you.
    *   Create a new lead. Verify it appears in your list.

## 3. User Management
**Objective:** Create new users directly from the Admin panel.

1.  **Navigate to Manage Users:**
    *   As Admin, look for the **"Manage Users"** link in the sidebar (bottom section).
    *   Or, if in the Dashboard dropdown/view selector, select "User Management".
2.  **Create User:**
    *   Click the **"Create User"** button.
    *   Enter **Email**, **Password**, and select **Role** (User/Admin).
    *   Click "Create User".
3.  **Verify New User:**
    *   The user should appear in the table immediately.
    *   **Test Login:** Open an incognito window and log in with the newly created credentials. It should work immediately.

## 4. Technical Notes
*   **Security:** All admin routes (`/api/admin/*`) are protected. Regular users attempting to access them will receive a 403 Forbidden error.
*   **Data Accuracy:** "Leads Today" resets daily at midnight server time.
