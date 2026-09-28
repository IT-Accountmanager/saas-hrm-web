import { CorporateModuleId } from './saasModules';

export type PermissionAction =
    | 'read'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'export'
    | 'import'
    | 'assign'
    | 'publish';

export const ALL_PERMISSION_ACTIONS: { key: PermissionAction; label: string; description: string }[] = [
    { key: 'read', label: 'Read / View', description: 'View list items, details, and reports' },
    { key: 'create', label: 'Create / Add', description: 'Create new records and entries' },
    { key: 'update', label: 'Update / Edit', description: 'Modify existing records and settings' },
    { key: 'delete', label: 'Delete / Remove', description: 'Permanently remove records' },
    { key: 'approve', label: 'Approve / Authorize', description: 'Approve requests, leaves, and budgets' },
    { key: 'export', label: 'Export Data', description: 'Export records to CSV, Excel, or PDF' },
    { key: 'import', label: 'Import Data', description: 'Bulk upload and import records' },
    { key: 'assign', label: 'Assign / Delegate', description: 'Assign tasks, leads, assets, or roles' },
    { key: 'publish', label: 'Publish / Broadcast', description: 'Publish job openings, announcements, or policies' },
];

export type ActionPermissions = Record<PermissionAction, boolean>;

export interface SubmodulePermissionConfig {
    submoduleName: string;
    enabled: boolean;
    actions: ActionPermissions;
}

export interface ModulePermissionConfig {
    moduleId: CorporateModuleId;
    enabled: boolean;
    actions: ActionPermissions;
    submodules?: Record<string, SubmodulePermissionConfig>;
}

export interface DynamicRole {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    isSystemDefault?: boolean; // true only for Super Admin or default System Org Admin
    systemRoleType?: 'saas_owner' | 'org_admin';
    color?: string; // Pill visual badge color accent
    modulePermissions: Partial<Record<CorporateModuleId, ModulePermissionConfig>>;
    userCount?: number;
    createdAt: string;
    updatedAt?: string;
}

// User-Role Binding mapping
export interface UserRoleAssignment {
    userId: string;
    organizationId: string;
    roleId: string;
    roleName: string;
    assignedAt: string;
}
