import { CorporateModuleId } from '../types/saasModules';
import { Organization, User } from '../types';
import {
    DynamicRole,
    PermissionAction,
    ModulePermissionConfig,
    ActionPermissions,
    ALL_PERMISSION_ACTIONS,
} from '../types/rbac';
import { getFromStorage, saveToStorage } from './storage';
import { CORPORATE_MODULES } from './corporateModulesDb';

// Default full action permissions object
export function createFullActions(): ActionPermissions {
    return {
        read: true,
        create: true,
        update: true,
        delete: true,
        approve: true,
        export: true,
        import: true,
        assign: true,
        publish: true,
    };
}

// Default read-only action permissions object
export function createReadOnlyActions(): ActionPermissions {
    return {
        read: true,
        create: false,
        update: false,
        delete: false,
        approve: false,
        export: false,
        import: false,
        assign: false,
        publish: false,
    };
}

// Helper to construct full module permissions map
export function createDefaultModulePermissions(
    enabledModuleIds: CorporateModuleId[],
    readOnly: boolean = false
): Partial<Record<CorporateModuleId, ModulePermissionConfig>> {
    const map: Partial<Record<CorporateModuleId, ModulePermissionConfig>> = {};

    CORPORATE_MODULES.forEach((mod) => {
        const isEnabled = enabledModuleIds.includes(mod.id);
        const actions = readOnly ? createReadOnlyActions() : createFullActions();

        const submodulesMap: Record<string, { submoduleName: string; enabled: boolean; actions: ActionPermissions }> = {};
        const subList = mod.subModules || mod.featureGroups.flatMap((g) => g.items);

        subList.forEach((subName) => {
            submodulesMap[subName] = {
                submoduleName: subName,
                enabled: isEnabled,
                actions: { ...actions },
            };
        });

        map[mod.id] = {
            moduleId: mod.id,
            enabled: isEnabled,
            actions: { ...actions },
            submodules: submodulesMap,
        };
    });

    return map;
}

// Pre-configured dynamic roles out-of-the-box for Acme Corp (org-1)
const INITIAL_DYNAMIC_ROLES: DynamicRole[] = [
    {
        id: 'role-super-admin',
        organizationId: 'platform',
        name: 'Super Admin',
        description: 'Fixed Platform Super Administrator with unrestricted global SaaS platform control',
        isSystemDefault: true,
        systemRoleType: 'saas_owner',
        color: '#3B82F6', // Blue
        modulePermissions: createDefaultModulePermissions([
            'organization_management',
            'recruitment_management',
            'employee_hr_management',
            'finance_management',
            'business_costing_center',
            'sales_crm',
            'project_task_management',
            'procurement_purchase',
            'inventory_asset_management',
            'customer_service_support',
            'email_management',
            'chat_communication',
            'document_management',
            'kpi_performance_management',
            'workflow_automation',
            'mis_analytics_dashboard',
            'ai_business_intelligence',
        ]),
        userCount: 1,
        createdAt: '2024-01-01',
    },
    {
        id: 'role-org-admin',
        organizationId: 'org-1',
        name: 'Organization Admin',
        description: 'Fixed Organization Administrator managing org users, settings, and custom roles',
        isSystemDefault: true,
        systemRoleType: 'org_admin',
        color: '#8B5CF6', // Purple
        modulePermissions: createDefaultModulePermissions([
            'organization_management',
            'recruitment_management',
            'employee_hr_management',
            'finance_management',
            'business_costing_center',
            'sales_crm',
            'project_task_management',
            'procurement_purchase',
            'inventory_asset_management',
            'customer_service_support',
            'email_management',
            'chat_communication',
            'document_management',
            'kpi_performance_management',
            'workflow_automation',
            'mis_analytics_dashboard',
            'ai_business_intelligence',
        ]),
        userCount: 2,
        createdAt: '2024-01-15',
    },
    {
        id: 'role-proj-mgr',
        organizationId: 'org-1',
        name: 'Project Manager',
        description: 'Manages projects, task boards, team workloads, and department Kanban execution',
        isSystemDefault: false,
        color: '#06B6D4', // Cyan
        modulePermissions: createDefaultModulePermissions([
            'project_task_management',
            'organization_management',
            'chat_communication',
            'email_management',
            'document_management',
            'kpi_performance_management',
            'mis_analytics_dashboard',
        ]),
        userCount: 3,
        createdAt: '2024-01-20',
    },
    {
        id: 'role-hr-mgr',
        organizationId: 'org-1',
        name: 'HR Manager',
        description: 'Oversees employee roster, attendance, leave approvals, department structures, and policies',
        isSystemDefault: false,
        color: '#EC4899', // Pink
        modulePermissions: createDefaultModulePermissions([
            'organization_management',
            'employee_hr_management',
            'recruitment_management',
            'document_management',
            'chat_communication',
            'email_management',
            'kpi_performance_management',
            'mis_analytics_dashboard',
        ]),
        userCount: 2,
        createdAt: '2024-01-20',
    },
    {
        id: 'role-team-lead',
        organizationId: 'org-1',
        name: 'Team Lead',
        description: 'Leads engineering & operational pods, reviews attendance, approves leave, and assigns tasks',
        isSystemDefault: false,
        color: '#10B981', // Emerald
        modulePermissions: createDefaultModulePermissions([
            'organization_management',
            'project_task_management',
            'employee_hr_management',
            'kpi_performance_management',
            'chat_communication',
            'email_management',
        ]),
        userCount: 5,
        createdAt: '2024-02-01',
    },
    {
        id: 'role-developer',
        organizationId: 'org-1',
        name: 'Developer',
        description: 'Engineering staff member focused on task execution, timesheets, and team chat',
        isSystemDefault: false,
        color: '#F59E0B', // Amber
        modulePermissions: createDefaultModulePermissions(
            [
                'organization_management',
                'project_task_management',
                'employee_hr_management',
                'chat_communication',
                'email_management',
                'document_management',
            ],
            true // Read-focused
        ),
        userCount: 14,
        createdAt: '2024-02-05',
    },
    {
        id: 'role-accountant',
        organizationId: 'org-1',
        name: 'Accountant / Payroll Specialist',
        description: 'Handles financial ledgers, invoices, payroll batches, tax filings, and expense claims',
        isSystemDefault: false,
        color: '#6366F1', // Indigo
        modulePermissions: createDefaultModulePermissions([
            'finance_management',
            'business_costing_center',
            'procurement_purchase',
            'document_management',
            'chat_communication',
            'email_management',
            'mis_analytics_dashboard',
        ]),
        userCount: 2,
        createdAt: '2024-02-10',
    },
];

export const roleService = {
    // Get all roles for an organization
    getOrgRoles: (orgId: string): DynamicRole[] => {
        const roles = getFromStorage<DynamicRole[]>('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);
        return roles.filter((r) => r.organizationId === orgId || r.organizationId === 'platform');
    },

    // Get single role by ID
    getRoleById: (roleId: string): DynamicRole | undefined => {
        const roles = getFromStorage<DynamicRole[]>('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);
        return roles.find((r) => r.id === roleId);
    },

    // Create new Custom Dynamic Role
    createRole: async (data: Omit<DynamicRole, 'id' | 'createdAt'>): Promise<DynamicRole> => {
        const roles = getFromStorage<DynamicRole[]>('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);

        const newRole: DynamicRole = {
            ...data,
            id: `role-custom-${Date.now()}`,
            userCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
        };

        const updated = [newRole, ...roles];
        saveToStorage('org_dynamic_roles', updated);
        return newRole;
    },

    // Update existing Role
    updateRole: async (roleId: string, data: Partial<DynamicRole>): Promise<DynamicRole> => {
        const roles = getFromStorage<DynamicRole[]>('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);
        const index = roles.findIndex((r) => r.id === roleId);

        if (index === -1) {
            throw new Error(`Role ${roleId} not found`);
        }

        const updatedRole: DynamicRole = {
            ...roles[index],
            ...data,
            updatedAt: new Date().toISOString().split('T')[0],
        };

        roles[index] = updatedRole;
        saveToStorage('org_dynamic_roles', roles);
        return updatedRole;
    },

    // Delete Custom Role (cannot delete fixed system roles)
    deleteRole: async (roleId: string): Promise<boolean> => {
        const roles = getFromStorage<DynamicRole[]>('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);
        const target = roles.find((r) => r.id === roleId);

        if (target?.isSystemDefault) {
            throw new Error('Fixed system roles (Super Admin / Organization Admin) cannot be deleted.');
        }

        const filtered = roles.filter((r) => r.id !== roleId);
        saveToStorage('org_dynamic_roles', filtered);
        return true;
    },

    // Reset to initial demo roles
    resetDefaultRoles: (): DynamicRole[] => {
        saveToStorage('org_dynamic_roles', INITIAL_DYNAMIC_ROLES);
        return INITIAL_DYNAMIC_ROLES;
    },

    // =========================================================================
    // THE MOST IMPORTANT RULE: PERMISSION EVALUATION INTERSECTION ENGINE
    // Effective Access = (Super Admin Org Modules & Submodules) ∩ (Org Admin User Role Permissions)
    // =========================================================================
    checkUserPermission: (
        user: User | null | undefined,
        org: Organization | null | undefined,
        moduleId: CorporateModuleId,
        submoduleName?: string,
        action: PermissionAction = 'read'
    ): { allowed: boolean; reason?: string } => {
        if (!user) {
            return { allowed: false, reason: 'User not authenticated' };
        }

        // 1. Super Admin (saas_owner) has global unrestricted access to all modules
        if (user.role === 'saas_owner') {
            return { allowed: true };
        }

        if (!org) {
            return { allowed: false, reason: 'Organization context missing' };
        }

        // 2. STEP 1 OF INTERSECTION: Super Admin Organization Level Check
        // Does the Organization have this module in its subscribedModules?
        const subscribedModules = org.subscribedModules || [];
        const isModuleEnabledForOrg = subscribedModules.includes(moduleId);

        if (!isModuleEnabledForOrg) {
            return {
                allowed: false,
                reason: `Module "${moduleId}" is not enabled for this Organization by Super Admin.`,
            };
        }

        // Is this specific submodule disabled for the Organization by Super Admin?
        if (submoduleName && org.disabledSubModules?.[moduleId]) {
            const disabledSubList = org.disabledSubModules[moduleId] || [];
            if (disabledSubList.includes(submoduleName)) {
                return {
                    allowed: false,
                    reason: `Submodule "${submoduleName}" is disabled for this Organization by Super Admin.`,
                };
            }
        }

        // 3. STEP 2 OF INTERSECTION: Organization Admin Level Check
        // Organization Admin (org_admin) has full admin access to all Super-Admin-enabled org modules
        if (user.role === 'org_admin' || user.role === 'org_owner') {
            return { allowed: true };
        }

        // 4. STEP 3 OF INTERSECTION: User Dynamic Custom Role Check
        const orgRoles = roleService.getOrgRoles(org.id);

        // Match role by ID, or fallback by role key string match (e.g. "hr_admin", "manager", etc.)
        let userRoleObj = orgRoles.find(
            (r) => r.id === (user as any).customRoleId || r.name.toLowerCase() === user.role.replace(/_/g, ' ').toLowerCase()
        );

        // If no direct role match found, create a fall-back matching structure for legacy role strings
        if (!userRoleObj) {
            userRoleObj = orgRoles.find((r) => r.name.toLowerCase().includes(user.role.split('_')[0]));
        }

        if (!userRoleObj) {
            // If user has a role string like 'manager' or 'employee', check if role exists
            return { allowed: true }; // Default safe fallback if role not mapped yet
        }

        const modConfig = userRoleObj.modulePermissions?.[moduleId];

        if (!modConfig || !modConfig.enabled) {
            return {
                allowed: false,
                reason: `Role "${userRoleObj.name}" does not have permission to access module "${moduleId}".`,
            };
        }

        // Check submodule level in role if provided
        if (submoduleName && modConfig.submodules) {
            const subConfig = modConfig.submodules[submoduleName];
            if (subConfig && !subConfig.enabled) {
                return {
                    allowed: false,
                    reason: `Role "${userRoleObj.name}" does not have permission to access submodule "${submoduleName}".`,
                };
            }
            if (subConfig && subConfig.actions && action) {
                const actionAllowed = subConfig.actions[action] ?? true;
                if (!actionAllowed) {
                    return {
                        allowed: false,
                        reason: `Role "${userRoleObj.name}" does not have "${action}" permission for submodule "${submoduleName}".`,
                    };
                }
            }
        }

        // Check action level in module
        if (modConfig.actions && action) {
            const actionAllowed = modConfig.actions[action] ?? true;
            if (!actionAllowed) {
                return {
                    allowed: false,
                    reason: `Role "${userRoleObj.name}" does not have "${action}" permission on module "${moduleId}".`,
                };
            }
        }

        return { allowed: true };
    },
};
