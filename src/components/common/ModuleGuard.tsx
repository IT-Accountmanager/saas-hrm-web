import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Building2, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { CorporateModuleId } from '../../types/saasModules';
import { CORPORATE_MODULES } from '../../services/corporateModulesDb';
import { roleService } from '../../services/roleService';
import { PermissionAction } from '../../types/rbac';

interface ModuleGuardProps {
    moduleId: CorporateModuleId;
    subModule?: string;
    action?: PermissionAction;
    children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
    moduleId,
    subModule,
    action = 'read',
    children,
}) => {
    const { currentUser, currentOrg } = useAppStore();
    const navigate = useNavigate();

    // Evaluate dynamic permission intersection: Super Admin Org Modules ∩ Org Admin Role Permissions
    const permissionResult = roleService.checkUserPermission(
        currentUser,
        currentOrg,
        moduleId,
        subModule,
        action
    );

    if (permissionResult.allowed) {
        return <>{children}</>;
    }

    const moduleInfo = CORPORATE_MODULES.find((m) => m.id === moduleId);
    const moduleName = moduleInfo?.name || moduleId.replace(/_/g, ' ').toUpperCase();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in">
            <div className="max-w-lg w-full bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-slate-200/80 dark:border-dark-border overflow-hidden text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
                    <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {currentOrg?.name || 'Your Organization'}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {moduleName} Access Restricted
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        {permissionResult.reason ||
                            `This feature is restricted for your role. Contact your Organization Admin or Super Admin to request access.`}
                    </p>
                </div>

                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-left text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>RBAC Policy Intersection Check</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        <strong>Super Admin Org Provisioning:</strong>{' '}
                        {currentOrg?.subscribedModules?.includes(moduleId) ? '✓ Enabled' : '✗ Disabled'}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        <strong>User Role Permission:</strong> Evaluated for role "{currentUser?.role}"
                    </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
