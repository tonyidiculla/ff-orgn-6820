/**
 * Platform roles and privilege types based on public schema
 * 
 * Privilege System: NUMERIC LEVELS
 * Lower number = Higher privilege
 * 
 * Level Ranges:
 * 1-10:   Platform Admin (System-wide control)
 * 11-20:  Organization Admin (Organization-level management)
 * 21-30:  Entity/Department Admin (Entity-level management)
 * 31-40:  HMS/Medical (Hospital/Medical operations)
 * 41-60:  Management/Supervisory
 * 61-80:  Staff/Operational
 * 81-100: Basic User/External Access
 */

export type PrivilegeLevel = number

export type RoleCategory =
    | 'system_admin'
    | 'executive'
    | 'management'
    | 'medical_practitioner'
    | 'medical'
    | 'licensed_professional'
    | 'clinical_staff'
    | 'technical_specialist'
    | 'operational_staff'
    | 'support_staff'
    | 'staff'
    | 'external'
    | 'customer'

export interface PlatformRole {
    id: string
    role_name: string
    display_name: string
    description: string | null
    department: string
    category: RoleCategory
    level: number
    privilege_level: PrivilegeLevel
    permissions: string[]
    modules: string[]
    is_active: boolean
    created_at: string
    updated_at: string
    created_by: string | null
    solution_type: string[]
}

export interface UserRoleAssignment {
    id: string
    user_id: string
    is_active: boolean
    expires_at: string | null
    assigned_by: string | null
    assigned_at: string
    created_at: string
    updated_at: string
    user_platform_id: string | null
    is_immutable: boolean
    platform_role_id: string
}

export interface UserPrivileges {
    roles: PlatformRole[]
    assignments: UserRoleAssignment[]
    highestPrivilegeLevel: PrivilegeLevel | null
    allPermissions: Set<string>
    allModules: Set<string>
}

/**
 * Privilege level hierarchy (lower number = higher privilege)
 * Maps numeric levels to their descriptions and access checks
 * 
 * Reference Mapping:
 * 1-10:   Platform Admin
 * 11-20:  Organization Admin
 * 21-30:  Entity/Department Admin
 * 31-40:  HMS/Medical
 * 41-60:  Management/Supervisory
 * 61-80:  Staff/Operational
 * 81-100: Basic User/External
 */
export const PRIVILEGE_HIERARCHY = {
    PLATFORM_ADMIN: 1,           // System administrator
    ORGANIZATION_ADMIN: 15,      // Organization owner/manager
    ENTITY_ADMIN: 25,            // Department/facility admin
    MEDICAL_PRACTITIONER: 35,    // Veterinarian/doctor
    MANAGEMENT: 50,              // Manager/supervisor
    OPERATIONAL_STAFF: 70,       // Staff member
    SUPPORT_STAFF: 85,           // Support/external
    BASIC_USER: 100,             // Limited access user
} as const

/**
 * Check if a privilege level has access to a given minimum level requirement
 * Lower numeric levels have MORE access (higher privilege)
 */
export function hasPrivilegeLevel(
    userLevel: PrivilegeLevel | null,
    requiredLevel: PrivilegeLevel,
): boolean {
    if (!userLevel || !requiredLevel) return false
    // User can access if their privilege level is <= required level
    // (lower/equal number = higher privilege)
    return userLevel <= requiredLevel
}

/**
 * Get privilege level name/description from numeric level
 */
export function getPrivilegeName(level: PrivilegeLevel | null): string {
    if (!level) return 'No Access'
    
    if (level <= 10) return 'Platform Admin'
    if (level <= 20) return 'Organization Admin'
    if (level <= 30) return 'Entity Admin'
    if (level <= 40) return 'Medical/HMS'
    if (level <= 60) return 'Management'
    if (level <= 80) return 'Staff'
    if (level <= 100) return 'Basic User'
    return 'Unknown'
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(privileges: UserPrivileges | null, permission: string): boolean {
    if (!privileges) return false
    return privileges.allPermissions.has(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(privileges: UserPrivileges | null, permissions: string[]): boolean {
    if (!privileges || permissions.length === 0) return false
    return permissions.some((permission) => privileges.allPermissions.has(permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
    privileges: UserPrivileges | null,
    permissions: string[],
): boolean {
    if (!privileges || permissions.length === 0) return false
    return permissions.every((permission) => privileges.allPermissions.has(permission))
}

/**
 * Check if user has access to a module
 */
export function hasModule(privileges: UserPrivileges | null, module: string): boolean {
    if (!privileges) return false
    return privileges.allModules.has(module)
}

/**
 * Check if user has any of the specified modules
 */
export function hasAnyModule(privileges: UserPrivileges | null, modules: string[]): boolean {
    if (!privileges || modules.length === 0) return false
    return modules.some((module) => privileges.allModules.has(module))
}

/**
 * Get the display name of the highest-level role
 */
export function getPrimaryRoleDisplayName(privileges: UserPrivileges | null): string {
    if (!privileges || privileges.roles.length === 0) return 'User'

    const sortedRoles = [...privileges.roles].sort((a, b) => {
        const rankA = PRIVILEGE_HIERARCHY[a.privilege_level]
        const rankB = PRIVILEGE_HIERARCHY[b.privilege_level]
        return rankA - rankB
    })

    return sortedRoles[0]?.display_name ?? 'User'
}

/**
 * Aggregate user roles and permissions into a UserPrivileges object
 */
export function aggregatePrivileges(
    roles: PlatformRole[],
    assignments: UserRoleAssignment[],
): UserPrivileges {
    const activeRoles = roles.filter((role) => {
        const assignment = assignments.find((a) => a.platform_role_id === role.id && a.is_active)
        if (!assignment) return false

        if (assignment.expires_at) {
            const expiresAt = new Date(assignment.expires_at)
            if (expiresAt < new Date()) return false
        }

        return role.is_active
    })

    const allPermissions = new Set<string>()
    const allModules = new Set<string>()

    for (const role of activeRoles) {
        for (const permission of role.permissions) {
            allPermissions.add(permission)
        }
        for (const module of role.modules) {
            allModules.add(module)
        }
    }

    let highestPrivilegeLevel: PrivilegeLevel | null = null
    let highestRank = Number.MAX_VALUE

    for (const role of activeRoles) {
        const rank = PRIVILEGE_HIERARCHY[role.privilege_level]
        if (rank < highestRank) {
            highestRank = rank
            highestPrivilegeLevel = role.privilege_level
        }
    }

    return {
        roles: activeRoles,
        assignments: assignments.filter((a) => a.is_active),
        highestPrivilegeLevel,
        allPermissions,
        allModules,
    }
}
