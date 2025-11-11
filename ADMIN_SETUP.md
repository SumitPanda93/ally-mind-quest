# Admin User Setup Guide

## Creating an Admin User

Since authentication is handled by Supabase Auth, admin users must be created through the application flow. Follow these steps:

### Option 1: Convert Existing User to Admin

1. Sign up for a regular account through the application
2. Note your user email address
3. Run this SQL query in your database to grant admin access:

```sql
UPDATE profiles 
SET experience_level = 'admin' 
WHERE email = 'your-email@example.com';
```

### Option 2: Admin Credentials Template

**Email:** admin@techmock.com  
**Password:** [Set during signup]

**Steps:**
1. Go to the Auth page (`/auth`)
2. Sign up using the email: `admin@techmock.com`
3. Choose any password (save it securely)
4. After signup, update the profile:

```sql
UPDATE profiles 
SET experience_level = 'admin' 
WHERE email = 'admin@techmock.com';
```

### Accessing Admin Dashboard

Once admin access is granted:
- Navigate to `/admin` route
- Dashboard will display:
  - Total platform users
  - Total exams completed
  - Platform average score
  - Top 5 performers
  - Recent exam activity table

### Admin Permissions

Admin users have access to:
- View all user exams and results (via RLS policies)
- Access admin-only dashboard route
- View platform-wide analytics
- Monitor user performance metrics

## Security Notes

- Admin credentials should be kept secure
- Only trusted users should have admin access
- Admin access grants visibility to all user data
- Change default admin credentials after first login
