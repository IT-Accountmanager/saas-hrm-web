import { useAppStore } from '../store/useAppStore';
import { CorporateModuleId } from '../types/saasModules';
import { roleService } from '../services/roleService';
import { PermissionAction } from '../types/rbac';

export function useSubModuleAccess() {
    const { currentUser, currentOrg, currentRole } = useAppStore();

    const isSubModuleEnabled = (
        moduleId: CorporateModuleId,
        subModuleName?: string,
        action: PermissionAction = 'read'
    ): boolean => {
        // SaaS owner has global unrestricted access to all submodules
        if (currentRole === 'saas_owner') return true;

        // Perform full intersection check (SaaS Org Subscriptions ∩ Dynamic Role Permissions ∩ Action Capabilities)
        const check = roleService.checkUserPermission(
            currentUser,
            currentOrg,
            moduleId,
            subModuleName,
            action
        );

        return check.allowed;
    };

    return { isSubModuleEnabled };
}

