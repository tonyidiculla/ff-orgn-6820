// Privilege gates stub - privileges not currently implemented in JWT auth
import { ReactNode } from 'react'

export interface PrivilegeGateProps {
    children: ReactNode
    fallback?: ReactNode
}

// For now, all privilege checks pass (show content)
// TODO: Implement proper privilege fetching from backend
export function PlatformAdminGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function OrganizationAdminGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function EntityAdminGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function MedicalPractitionerGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function ManagementGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function OperationalStaffGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function SupportStaffGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}

export function BasicUserGate({ children, fallback }: PrivilegeGateProps) {
    return <>{children}</>
}