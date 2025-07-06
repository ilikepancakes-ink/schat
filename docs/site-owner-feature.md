# Site Owner Feature

## Overview

The Site Owner feature implements a three-tier role hierarchy in Schat:

1. **Regular Users** - Standard chat participants
2. **Moderators (Admins)** - Can moderate content, ban users, and see all channels
3. **Site Owners** - Have full administrative control, including the ability to grant/revoke moderator privileges

## Key Features

### Role Hierarchy

- **Site Owners** (`is_site_owner: true`)
  - Can grant and revoke moderator privileges
  - Can perform all moderator actions
  - Have access to the admin panel
  - Can see all chatrooms and channels

- **Moderators** (`is_admin: true`)
  - Can ban/unban users
  - Can see all chatrooms and channels
  - Have access to the admin panel
  - **Cannot** grant or revoke admin privileges (restricted to site owners only)

- **Regular Users**
  - Standard chat functionality
  - Can only see public channels and channels they're members of

### Admin Panel Changes

The admin panel now displays:
- Site Owner badge (purple) for site owners
- Mod badge (blue) for moderators
- Updated statistics showing site owners and mods separately
- Grant/Revoke mod buttons only visible to site owners

### Database Schema

Added `is_site_owner` column to the `users` table:
```sql
ALTER TABLE users ADD COLUMN is_site_owner BOOLEAN DEFAULT FALSE;
```

### API Security

- Admin privilege management endpoints now require site owner privileges
- Regular moderators can still perform other admin actions (ban/unban users)
- Proper error messages for unauthorized access attempts

## Implementation Details

### Files Modified

1. **Database Schema** (`src/lib/supabase.ts`)
   - Added `is_site_owner` column to users table
   - Updated RLS policies

2. **Type Definitions** (`src/types/database.ts`)
   - Updated User, ChatUser, AuthUser interfaces
   - Added `is_site_owner: boolean` field

3. **Authentication** (`src/lib/auth.ts`)
   - Updated JWT token generation and verification
   - Added site owner field to all auth functions

4. **Admin API** (`src/app/api/admin/users/route.ts`)
   - Added site owner privilege checks for admin management
   - Maintained backward compatibility for other admin actions

5. **Admin Panel Components**
   - `src/components/admin/AdminPanel.tsx` - Updated access checks
   - `src/components/admin/UserManagement.tsx` - Added site owner UI elements

6. **Chatrooms API** (`src/app/api/chatrooms/route.ts`)
   - Updated to allow both mods and site owners to see all channels

### Migration

Run the database migration to add the site owner column:

```bash
# Option 1: Run the migration script
node scripts/run-site-owner-migration.js

# Option 2: Execute SQL manually in Supabase dashboard
# Copy contents of scripts/add-site-owner-column.sql
```

### Testing

Comprehensive test suite in `src/__tests__/site-owner.test.ts` covers:
- Site owner can grant/revoke admin privileges
- Regular admins cannot grant/revoke admin privileges
- Regular admins can still perform other admin actions
- Proper error handling and status codes

## Usage

### Promoting a User to Site Owner

Currently, site owners must be set directly in the database:

```sql
UPDATE users SET is_site_owner = true WHERE username = 'your-username';
```

### Admin Panel Access

- Site owners and moderators can access the admin panel
- Only site owners see grant/revoke mod buttons
- Role badges clearly indicate user privileges

### Security Considerations

- Site owner privileges are the highest level of access
- Only site owners can manage moderator privileges
- All admin actions are logged for audit purposes
- Proper authentication and authorization checks at API level

## Future Enhancements

- Site owner management interface for promoting/demoting site owners
- Audit log for all administrative actions
- Role-based permissions system
- Bulk user management tools
