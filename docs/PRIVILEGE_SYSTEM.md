# Privilege System Integration - Complete ✅

## Overview

Successfully integrated the platform_roles and user_to_role_assignment tables from the public schema to enable privilege-based access control throughout the application.

**Key Principle**: Uses **NUMERIC privilege levels** (1-100) where lower numbers = higher privilege.

## Architecture

### Database Schema Relationship

```
auth.users (Supabase Auth)
    ↓ (user_id)
public.profiles
    ↓ (user_platform_id)
public.user_to_role_assignment
    ↓ (platform_role_id)
public.platform_roles
    ↓ (privilege_level: NUMERIC)
```

### Key Tables

#### public.profiles

- Links auth users to platform users
- **user_id**: UUID (foreign key to auth.users.id)
- **user_platform_id**: String (e.g., "H00000001") - platform identifier

#### public.user_to_role_assignment

- Links users to their assigned roles
- **user_platform_id**: String - links to profiles.user_platform_id
- **platform_role_id**: UUID - links to platform_roles.id
- **is_active**: Boolean - whether assignment is active
- **expires_at**: Timestamp (optional) - when assignment expires

#### public.platform_roles

- Defines available roles and their privileges using NUMERIC levels
- **id**: UUID - role identifier
- **role_name**: String - human-readable description (e.g., "Organization Admin")
- **privilege_level**: NUMERIC (1-100) - determines access and routing
- **permissions**: JSON Array - list of permission strings
- **modules**: JSON Array - list of accessible module names
- **is_active**: Boolean - whether role is active

## Privilege Level System

### Standard Level Ranges

| Range  | Level                   | Description                    | Typical Access                |
| ------ | ----------------------- | ------------------------------ | ----------------------------- |
| 1-10   | Platform Admin          | System-wide administration     | All system features           |
| 11-20  | Organization Admin      | Organization management        | Organization features         |
| 21-30  | Entity/Department Admin | Facility/Department management | Department operations         |
| 31-40  | HMS/Medical             | Hospital & medical operations  | Medical records, patient care |
| 41-60  | Management/Supervisor   | Team & operational management  | Team oversight, reporting     |
| 61-80  | Staff/Operational       | Regular staff operations       | Day-to-day operations         |
| 81-100 | Basic User/External     | Limited access                 | Read-only access              |

### Access Logic

**Lower numeric level = Higher privilege**

```typescript
// User can access a feature if their privilege_level <= required_level
const canAccess = userPrivilegeLevel <= requiredPrivilegeLevel

Examples:
- User with level 15 (Org Admin) can access features requiring level ≤ 20
- User with level 15 can access: 10 (no), 15 (yes), 20 (yes), 30 (yes)
- User with level 50 (Management) cannot access level 20 (Org Admin)
```

### Routing by Privilege Level

| Privilege Level | Route                    | Application         | Port |
| --------------- | ------------------------ | ------------------- | ---- |
| ≤ 10            | Platform Admin Portal    | Platform Admin      | 4000 |
| ≤ 20            | Organization App         | Organization        | 7100 |
| ≤ 40            | HMS                      | Hospital Management | 5001 |
| ≤ 60            | E-Store (Future)         | E-Commerce          | 6000 |
| ≤ 80            | Physical Store (Future)  | Retail              | 7000 |
| ≤ 100           | Channel Partner (Future) | Partners            | 8001 |
| Default         | Organization App         | Fallback            | 7100 |

## Implementation

### 1. Type System (`src/lib/privileges.ts`)

Complete TypeScript type definitions using NUMERIC privilege levels:

```typescript
// Privilege level is just a number
export type PrivilegeLevel = number;

// Privilege hierarchy constants
export const PRIVILEGE_HIERARCHY = {
  PLATFORM_ADMIN: 1, // Level 1-10
  ORGANIZATION_ADMIN: 15, // Level 11-20
  ENTITY_ADMIN: 25, // Level 21-30
  MEDICAL_PRACTITIONER: 35, // Level 31-40
  MANAGEMENT: 50, // Level 41-60
  OPERATIONAL_STAFF: 70, // Level 61-80
  SUPPORT_STAFF: 85, // Level 81-100
  BASIC_USER: 100, // Level 81-100
} as const;
```

Key utilities:

- `hasPrivilegeLevel(userLevel, requiredLevel)`: Returns `true` if `userLevel <= requiredLevel`
- `getPrivilegeName(level)`: Returns human-readable description (e.g., "Organization Admin")
- Supports any numeric level 1-100

### 2. Privilege Fetching

Implements the complete privilege lookup chain:

1. Query `public.profiles` by auth `user_id` → get `user_platform_id`
2. Query `public.user_to_role_assignment` by `user_platform_id` → get role assignments
3. Query `public.platform_roles` by role IDs → get `privilege_level` (NUMERIC)
4. Return minimum privilege level (lowest number = highest privilege)

```typescript
// Example: User has roles with levels [10, 15, 20]
// Function returns: 10 (highest privilege)
```

### 3. Schema Access

- ✅ Exposed public schema via PostgREST
- ✅ Granted SELECT permissions to anon, authenticated, service_role
- ✅ Granted UPDATE permissions on profiles table

### 4. Database Migrations

Created migrations:

````

- `grant_public_access.sql` - Grant schema and table permissions
- `20250108_add_user_id_to_profiles.sql` - Add user_id column to profiles
- `20250108_grant_profiles_permissions.sql` - Grant UPDATE on profiles

### 3. Type System (`src/lib/privileges.ts`)

Complete TypeScript type definitions:

- **PrivilegeLevel**: 13-level hierarchy enum
- **PlatformRole**: Role structure with permissions and modules
- **UserRoleAssignment**: Assignment with user and role linking
- **UserPrivileges**: Aggregated user privileges

Key utilities:

- `PRIVILEGE_HIERARCHY`: Ranking of privilege levels (1-13)
- `hasPrivilegeLevel()`: Check if user meets privilege requirement
- `hasPermission()`: Check if user has specific permission
- `hasModule()`: Check if user has access to module
- `aggregatePrivileges()`: Combine multiple roles into user privileges

### 4. Privilege Fetching (`src/lib/fetchUserPrivileges.ts`)

Implements the complete privilege lookup chain:

1. Query public.profiles by auth user_id → get user_platform_id
2. Query public.user_to_role_assignment by user_platform_id → get role assignments
3. Query public.platform_roles by role IDs → get role details
4. Aggregate permissions, modules, and determine highest privilege level

### 5. Context Integration (`src/contexts/UserContext.tsx`)

Extended with privilege management:

- `privileges`: Current user's aggregated privileges
- `privilegesLoading`: Loading state
### 5. Context Integration (`src/contexts/UserContext.tsx`)

Extended with privilege management:

- `privileges`: Current user's aggregated privileges
- `privilegesLoading`: Loading state
- `refreshPrivileges()`: Manual refresh function
- Auto-fetches on user login

### 6. React Components (`src/components/PrivilegeGates.tsx`)

Conditional rendering components using numeric privilege levels:

- `RequirePrivilegeLevel`: Show content only if `userLevel <= requiredLevel`
- `RequirePermission`: Show content only if user has specific permission
- `RequireModule`: Show content only if user has access to module
- `RequireAnyPermission`: Show if user has ANY of the permissions
- `RequireAllPermissions`: Show if user has ALL permissions
- `HideForPrivilegeLevel`: Hide content for specific levels
- `ShowForPrivilegeLevel`: Show content only for specific levels

### 7. Organization Page (`src/app/organization/page.tsx`)

Dashboard showing:

- Current numeric privilege level (1-100) with badge
- Privilege level name/description
- Authorization checks using numeric comparison
- Loading states
- Error handling

## Testing & Verification

### Setup for Test User (tony@fusiondtech.com)

Required database records:

```sql
-- 1. Create profile
INSERT INTO public.profiles (user_id, user_platform_id, email)
VALUES ('89af6091-a4a9-41bc-ab83-a9184da9bbe4', 'platform-id-here', 'tony@fusiondtech.com');

-- 2. Ensure organization_admin role exists with privilege_level ≤ 20
INSERT INTO public.platform_roles (role_name, privilege_level)
VALUES ('organization_admin', 15);

-- 3. Assign role to user
INSERT INTO public.user_to_role_assignment (user_platform_id, platform_role_id)
VALUES ('platform-id-here', (SELECT id FROM public.platform_roles WHERE role_name = 'organization_admin'));
```

After setup:
- ✅ Auth ID: 89af6091-a4a9-41bc-ab83-a9184da9bbe4
- ✅ Email: tony@fusiondtech.com
- ✅ Privilege Level: 15 (Organization Admin)
- ✅ Can access: Organization App (port 7100)

- `scripts/update-tony-profile.ts` - Link auth ID to profile
- `scripts/check-privilege-values.ts` - Inspect privilege data types
- `scripts/test-privileges-direct.ts` - Test complete privilege chain ✅

## Usage Examples

### Check User Privilege Level

```typescript
import { useUser } from "@/contexts/UserContext";
import { hasPrivilegeLevel } from "@/lib/privileges";

function MyComponent() {
  const { privileges } = useUser();

  if (!privileges) return <div>Loading...</div>;

  // Check if user has platform admin privilege (level <= 10)
  const isPlatformAdmin = hasPrivilegeLevel(
    privileges.highestPrivilegeLevel,
    10  // Platform Admin threshold
  );

  // Check if user has organization admin privilege (level <= 20)
  const isOrgAdmin = hasPrivilegeLevel(
    privileges.highestPrivilegeLevel,
    20  // Organization Admin threshold
  );

  return (
    <>
      {isPlatformAdmin && <AdminPanel />}
      {isOrgAdmin && <OrgPanel />}
    </>
  );
}
```

### Conditional Rendering with Gates

```typescript
import {
  RequirePrivilegeLevel,
  RequirePermission,
} from "@/components/PrivilegeGates";

function Dashboard() {
  return (
    <>
      <RequirePrivilegeLevel level={10}>
        <PlatformAdminSettings />
      </RequirePrivilegeLevel>

      <RequirePrivilegeLevel level={20}>
        <OrganizationSettings />
      </RequirePrivilegeLevel>

      <RequirePermission permission="user_management">
        <UserManagement />
      </RequirePermission>
````

### Manual Privilege Check

```typescript
import { useUser } from "@/contexts/UserContext";
import { hasPrivilegeLevel, getPrivilegeName } from "@/lib/privileges";

function MyComponent() {
  const { privileges } = useUser();

  if (!privileges) return <div>Loading...</div>;

  const level = privileges.highestPrivilegeLevel;

  // Check specific access levels
  const canAccessOrg = hasPrivilegeLevel(level, 20); // Org Admin or higher
  const canAccessHMS = hasPrivilegeLevel(level, 40); // HMS or higher
  const canManageUsers = privileges?.allPermissions.has("user_management");

  return (
    <div>
      <p>
        Your Level: {level} ({getPrivilegeName(level)})
      </p>
      {canAccessOrg && <button>Organization Settings</button>}
      {canAccessHMS && <button>HMS Access</button>}
      {canManageUsers && <button>Manage Users</button>}
    </div>
  );
}
```

## Privilege Levels (Numeric Scale)

**Lower number = Higher privilege**

- **1-10**: Platform Admin - System-wide control
- **11-20**: Organization Admin - Organization management
- **21-30**: Entity/Department Admin - Department management
- **31-40**: HMS/Medical - Medical operations
- **41-60**: Management/Supervisor - Team management
- **61-80**: Staff/Operational - Regular operations
- **81-100**: Basic User/External - Limited access

## Next Steps

### For Production

1. ✅ Schema exposed and permissions granted
2. ✅ Type system complete
3. ✅ Fetching infrastructure working
4. ✅ Context integration complete
5. ✅ React components built
6. ✅ Test user verified

### Potential Enhancements

- [ ] Add role assignment UI for admins
- [ ] Add audit logging for privilege checks
- [ ] Add role expiration notifications
- [ ] Add bulk role assignment
- [ ] Add role templates/presets
- [ ] Add privilege delegation
- [ ] Add temporary privilege elevation

## Files Modified/Created

### Core Implementation

- ✅ src/lib/privileges.ts (types & utilities)
- ✅ src/lib/fetchUserPrivileges.ts (fetching logic)
- ✅ src/contexts/UserContext.tsx (context integration)
- ✅ src/components/PrivilegeGates.tsx (React components)
- ✅ src/app/organization/page.tsx (demo dashboard)

### Database Migrations

- ✅ supabase/migrations/grant_public_access.sql
- ✅ supabase/migrations/20250108_add_user_id_to_profiles.sql
- ✅ supabase/migrations/20250108_grant_profiles_permissions.sql

### Test Scripts

- ✅ scripts/test-privileges-direct.ts (verification ✅)
- ✅ scripts/update-tony-profile.ts
- ✅ scripts/check-privilege-values.ts
- ✅ scripts/check-schema.ts

## Status: ✅ COMPLETE AND VERIFIED

The privilege system is fully integrated, tested, and ready for use. Tony's account has been successfully linked and privileges are being fetched correctly.
