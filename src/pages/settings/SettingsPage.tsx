import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardHeader, CardTitle, Button, Badge, Tabs, Input, Modal } from '../../components/ui';
import {
  Shield,
  Building,
  Bell,
  Lock,
  Key,
  CheckCircle2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Info,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Save,
  Building2,
  Boxes,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Filter,
} from 'lucide-react';
import { roleService, createFullActions, createReadOnlyActions } from '../../services/roleService';
import { DynamicRole, PermissionAction, ALL_PERMISSION_ACTIONS, ActionPermissions } from '../../types/rbac';
import { CORPORATE_MODULES } from '../../services/corporateModulesDb';
import { CorporateModuleId } from '../../types/saasModules';

export const SettingsPage: React.FC = () => {
  const { currentOrg, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('permissions');

  // Org Profile State
  const [companyName, setCompanyName] = useState(currentOrg?.name || 'Acme Corp');
  const [industry, setIndustry] = useState(currentOrg?.industry || 'Technology & Software');
  const [contactEmail, setContactEmail] = useState(currentOrg?.contactEmail || 'admin@acmecorp.com');
  const [contactPhone, setContactPhone] = useState(currentOrg?.contactPhone || '+1 (555) 234-5678');
  const [website, setWebsite] = useState(currentOrg?.website || 'https://acmecorp.example.com');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic Roles State
  const orgId = currentOrg?.id || 'org-1';
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<DynamicRole | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState<DynamicRole | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Role Form Draft State
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleColor, setRoleColor] = useState('#3B82F6');
  const [draftModulePermissions, setDraftModulePermissions] = useState<
    DynamicRole['modulePermissions']
  >({});
  const [activeModuleTab, setActiveModuleTab] = useState<CorporateModuleId>('organization_management');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('ALL');
  const [submoduleSearchQuery, setSubmoduleSearchQuery] = useState('');
  const [expandedSubmodule, setExpandedSubmodule] = useState<string | null>(null);

  const SIX_PILLARS = [
    { id: 'ALL', label: 'All 6 Pillars' },
    { id: 'Organization', label: 'Organization' },
    { id: 'People', label: 'People' },
    { id: 'Finance', label: 'Finance' },
    { id: 'Business & Operations', label: 'Business & Ops' },
    { id: 'Communication', label: 'Communication' },
    { id: 'Control & Intelligence', label: 'Control & Intelligence' },
  ];

  // Toast message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = () => {
    const list = roleService.getOrgRoles(orgId);
    setRoles(list);
  };

  useEffect(() => {
    loadRoles();
  }, [orgId]);

  const orgSubscribedModules = currentOrg?.subscribedModules || [];
  const availableModules = CORPORATE_MODULES.filter((mod) => orgSubscribedModules.includes(mod.id));

  const handleOpenCreateRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleColor('#3B82F6');

    // Initialize with default permissions for Super-Admin-enabled org modules
    const initialPerms: DynamicRole['modulePermissions'] = {};

    availableModules.forEach((mod) => {
      const subList = mod.subModules || mod.featureGroups.flatMap((g) => g.items);
      const subMap: Record<string, { submoduleName: string; enabled: boolean; actions: ActionPermissions }> = {};

      subList.forEach((subName) => {
        subMap[subName] = {
          submoduleName: subName,
          enabled: true,
          actions: createReadOnlyActions(),
        };
      });

      initialPerms[mod.id] = {
        moduleId: mod.id,
        enabled: true,
        actions: createReadOnlyActions(),
        submodules: subMap,
      };
    });

    setDraftModulePermissions(initialPerms);
    if (availableModules.length > 0) {
      setActiveModuleTab(availableModules[0].id);
    }
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: DynamicRole) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRoleColor(role.color || '#3B82F6');
    setDraftModulePermissions(JSON.parse(JSON.stringify(role.modulePermissions || {})));
    if (availableModules.length > 0) {
      setActiveModuleTab(availableModules[0].id);
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      alert('Please provide a valid role name.');
      return;
    }

    if (selectedRole) {
      // Update existing role
      await roleService.updateRole(selectedRole.id, {
        name: roleName,
        description: roleDescription,
        color: roleColor,
        modulePermissions: draftModulePermissions,
      });
      showToast(`Role "${roleName}" updated successfully!`);
    } else {
      // Create new custom role
      await roleService.createRole({
        organizationId: orgId,
        name: roleName,
        description: roleDescription,
        color: roleColor,
        isSystemDefault: false,
        modulePermissions: draftModulePermissions,
      });
      showToast(`Custom Role "${roleName}" created successfully!`);
    }

    setIsRoleModalOpen(false);
    loadRoles();
  };

  const handleDeleteRole = async (role: DynamicRole) => {
    if (role.isSystemDefault) {
      alert('System Default roles cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
      await roleService.deleteRole(role.id);
      showToast(`Role "${role.name}" deleted.`);
      loadRoles();
    }
  };

  const handleOpenAssignUser = (role: DynamicRole) => {
    setRoleToAssign(role);
    setSelectedUserId('');
    setIsAssignUserModalOpen(true);
  };

  const handleConfirmAssignUser = async () => {
    if (!roleToAssign || !selectedUserId) {
      alert('Please select a user to assign to this role.');
      return;
    }
    await roleService.updateRole(roleToAssign.id, {
      userCount: (roleToAssign.userCount || 0) + 1,
    });
    showToast(`Successfully assigned user to role "${roleToAssign.name}"!`);
    setIsAssignUserModalOpen(false);
    loadRoles();
  };

  // Helper macro buttons inside role editor
  const handleMacroSelectAll = () => {
    const updated: DynamicRole['modulePermissions'] = { ...draftModulePermissions };

    availableModules.forEach((mod) => {
      if (updated[mod.id]) {
        updated[mod.id]!.enabled = true;
        updated[mod.id]!.actions = createFullActions();
        if (updated[mod.id]!.submodules) {
          Object.keys(updated[mod.id]!.submodules!).forEach((subKey) => {
            updated[mod.id]!.submodules![subKey].enabled = true;
            updated[mod.id]!.submodules![subKey].actions = createFullActions();
          });
        }
      }
    });
    setDraftModulePermissions({ ...updated });
  };

  const handleMacroReadOnlyAll = () => {
    const updated: DynamicRole['modulePermissions'] = { ...draftModulePermissions };

    availableModules.forEach((mod) => {
      if (updated[mod.id]) {
        updated[mod.id]!.enabled = true;
        updated[mod.id]!.actions = createReadOnlyActions();
        if (updated[mod.id]!.submodules) {
          Object.keys(updated[mod.id]!.submodules!).forEach((subKey) => {
            updated[mod.id]!.submodules![subKey].enabled = true;
            updated[mod.id]!.submodules![subKey].actions = createReadOnlyActions();
          });
        }
      }
    });
    setDraftModulePermissions({ ...updated });
  };

  const handleMacroClearAll = () => {
    const updated: DynamicRole['modulePermissions'] = { ...draftModulePermissions };
    availableModules.forEach((mod) => {
      if (updated[mod.id]) {
        updated[mod.id]!.enabled = false;
        const disabledActions: ActionPermissions = {
          read: false,
          create: false,
          update: false,
          delete: false,
          approve: false,
          export: false,
          import: false,
          assign: false,
          publish: false,
        };
        updated[mod.id]!.actions = disabledActions;
        if (updated[mod.id]!.submodules) {
          Object.keys(updated[mod.id]!.submodules!).forEach((subKey) => {
            updated[mod.id]!.submodules![subKey].enabled = false;
            updated[mod.id]!.submodules![subKey].actions = { ...disabledActions };
          });
        }
      }
    });
    setDraftModulePermissions({ ...updated });
  };

  const handleEnableAllSubmodulesForModule = (modId: CorporateModuleId, subList: string[]) => {
    const updated = { ...draftModulePermissions };
    const currentMod = updated[modId] || {
      moduleId: modId,
      enabled: true,
      actions: createReadOnlyActions(),
      submodules: {},
    };

    const nextSubmodules = { ...(currentMod.submodules || {}) };
    subList.forEach((subName) => {
      nextSubmodules[subName] = {
        submoduleName: subName,
        enabled: true,
        actions: nextSubmodules[subName]?.actions || createReadOnlyActions(),
      };
    });

    updated[modId] = {
      ...currentMod,
      enabled: true,
      submodules: nextSubmodules,
    };
    setDraftModulePermissions(updated);
  };

  const handleDisableAllSubmodulesForModule = (modId: CorporateModuleId, subList: string[]) => {
    const updated = { ...draftModulePermissions };
    const currentMod = updated[modId] || {
      moduleId: modId,
      enabled: true,
      actions: createReadOnlyActions(),
      submodules: {},
    };

    const nextSubmodules = { ...(currentMod.submodules || {}) };
    subList.forEach((subName) => {
      nextSubmodules[subName] = {
        submoduleName: subName,
        enabled: false,
        actions: nextSubmodules[subName]?.actions || createReadOnlyActions(),
      };
    });

    updated[modId] = {
      ...currentMod,
      submodules: nextSubmodules,
    };
    setDraftModulePermissions(updated);
  };

  const handleToggleSubmodule = (modId: CorporateModuleId, subName: string, enabled: boolean) => {
    const updated = { ...draftModulePermissions };
    const currentMod = updated[modId] || {
      moduleId: modId,
      enabled: true,
      actions: createReadOnlyActions(),
      submodules: {},
    };

    const nextSubmodules = { ...(currentMod.submodules || {}) };
    const existingSub = nextSubmodules[subName] || {
      submoduleName: subName,
      enabled: true,
      actions: createReadOnlyActions(),
    };

    nextSubmodules[subName] = {
      ...existingSub,
      enabled,
    };

    updated[modId] = {
      ...currentMod,
      submodules: nextSubmodules,
    };
    setDraftModulePermissions(updated);
  };

  const handleSubmoduleActionToggle = (
    modId: CorporateModuleId,
    subName: string,
    actionKey: PermissionAction,
    checked: boolean
  ) => {
    const updated = { ...draftModulePermissions };
    const currentMod = updated[modId] || {
      moduleId: modId,
      enabled: true,
      actions: createReadOnlyActions(),
      submodules: {},
    };

    const nextSubmodules = { ...(currentMod.submodules || {}) };
    const existingSub = nextSubmodules[subName] || {
      submoduleName: subName,
      enabled: true,
      actions: createReadOnlyActions(),
    };

    nextSubmodules[subName] = {
      ...existingSub,
      actions: {
        ...existingSub.actions,
        [actionKey]: checked,
      },
    };

    updated[modId] = {
      ...currentMod,
      submodules: nextSubmodules,
    };
    setDraftModulePermissions(updated);
  };

  const settingsTabs = [
    { id: 'permissions', label: 'Dynamic Roles & Permissions', icon: <Shield className="h-4 w-4" /> },
    { id: 'company', label: 'Company Profile', icon: <Building className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notification Settings', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security & 2FA', icon: <Lock className="h-4 w-4" /> },
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-blue-600" />
            Dynamic Organization & Role Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create custom roles, set granular permission matrices, and enforce multi-tenant access boundaries.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" /> Saved Successfully!
          </div>
        )}
      </div>

      <Tabs tabs={settingsTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* TAB 1: DYNAMIC ROLES & PERMISSIONS STUDIO */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in">
          {!isRoleModalOpen ? (
            <>
              {/* Super Admin Module Boundary Info Card */}
              <Card className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Organization Provisioning & RBAC Rule
                        </h3>
                        <Badge variant="primary" size="sm">
                          {orgSubscribedModules.length} / 17 Modules Subscribed
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <strong>Super Admin</strong> provisions which modules{' '}
                        <strong className="text-blue-600">{currentOrg?.name || 'Organization'}</strong> can access. As{' '}
                        <strong>Organization Admin</strong>, you can define custom roles and grant granular permissions within those enabled modules.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateRole}>
                      Create Custom Role
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Dynamic Roles List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const enabledModCount = Object.values(role.modulePermissions || {}).filter(
                    (m) => m?.enabled && orgSubscribedModules.includes(m.moduleId)
                  ).length;

                  return (
                    <Card
                      key={role.id}
                      className="p-5 border bg-white dark:bg-dark-card flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: role.color || '#3B82F6' }}
                            />
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                {role.name}
                              </h3>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {role.isSystemDefault ? (
                                  <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                    <Lock className="w-3 h-3 inline" /> Fixed System Role
                                  </span>
                                ) : (
                                  'Custom Dynamic Role'
                                )}
                              </span>
                            </div>
                          </div>

                          <Badge variant={role.isSystemDefault ? 'neutral' : 'primary'} size="sm">
                            {enabledModCount} Modules Active
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] line-clamp-2">
                          {role.description || 'No description specified for this role.'}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <strong>{role.userCount || 0}</strong> Users Assigned
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {role.createdAt ? `Created ${role.createdAt}` : 'System Default'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs font-semibold"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenEditRole(role)}
                        >
                          {role.isSystemDefault ? 'View Matrix' : 'Edit Permissions'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold shrink-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenAssignUser(role)}
                          title="Assign Users to Role"
                        >
                          Assign
                        </Button>
                        {!role.isSystemDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition shrink-0"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            /* ========================================================================= */
            /* DYNAMIC ROLE & PERMISSION MATRIX CREATOR / EDITOR FULL PAGE WORKSPACE     */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in">
              {/* Studio Top Navigation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
                    onClick={() => setIsRoleModalOpen(false)}
                  >
                    Back to Dynamic Roles List
                  </Button>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      {selectedRole ? `Edit Dynamic Role Studio: ${selectedRole.name}` : 'Create Custom Dynamic Role Studio'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Full page workspace to configure role metadata, pillar filters, module action permissions, and 9-action submodule controls.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                    Cancel
                  </Button>
                  {!selectedRole?.isSystemDefault && (
                    <Button size="sm" variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSaveRole}>
                      Save Dynamic Role & Permissions
                    </Button>
                  )}
                </div>
              </div>

              {/* Studio Content Container */}
              <Card className="p-6 space-y-6 border bg-white dark:bg-dark-card shadow-sm">
                <div className="space-y-6 text-xs">
                  {/* Basic Info Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Role Title / Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Project Manager, Lead Recruiter"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        disabled={selectedRole?.isSystemDefault}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Badge Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={roleColor}
                          onChange={(e) => setRoleColor(e.target.value)}
                          disabled={selectedRole?.isSystemDefault}
                          className="w-12 h-10 p-0.5 rounded-xl border border-slate-200 dark:border-dark-border cursor-pointer bg-slate-50 dark:bg-slate-800"
                        />
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{roleColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role Description & Scope
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe key responsibilities and access scope for users assigned to this role..."
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      disabled={selectedRole?.isSystemDefault}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Quick Action Macros Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-dark-border">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Permission Matrix Quick Macros:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMacroSelectAll}
                        disabled={selectedRole?.isSystemDefault}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
                      >
                        Grant Full Access
                      </button>
                      <button
                        type="button"
                        onClick={handleMacroReadOnlyAll}
                        disabled={selectedRole?.isSystemDefault}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                      >
                        Grant View Only
                      </button>
                      <button
                        type="button"
                        onClick={handleMacroClearAll}
                        disabled={selectedRole?.isSystemDefault}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 font-bold text-xs transition"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* 6 Core Pillars Filter Bar & Pillar Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-blue-500" />
                        Filter by Core Pillar (6 Pillars):
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-dark-border">
                        {selectedPillarFilter === 'ALL'
                          ? `Showing All ${availableModules.length} Subscribed Modules`
                          : `${selectedPillarFilter} Pillar — ${availableModules.filter((m) => m.pillar === selectedPillarFilter).length} of ${availableModules.filter((m) => m.pillar === selectedPillarFilter).length} Subscribed Modules`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {SIX_PILLARS.map((p) => {
                        const isSelected = selectedPillarFilter === p.id;
                        const count =
                          p.id === 'ALL'
                            ? availableModules.length
                            : availableModules.filter((m) => m.pillar === p.id).length;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPillarFilter(p.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${isSelected
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-50'
                              }`}
                          >
                            <span>{p.label}</span>
                            <span
                              className={`px-2 py-0.3 rounded-full text-[10px] font-black ${isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Module Tabs Selector */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {availableModules
                        .filter(
                          (mod) =>
                            selectedPillarFilter === 'ALL' || mod.pillar === selectedPillarFilter
                        )
                        .map((mod) => {
                          const isModActiveInRole = draftModulePermissions[mod.id]?.enabled;
                          const isSelectedTab = activeModuleTab === mod.id;

                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setActiveModuleTab(mod.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${isSelectedTab
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-100'
                                }`}
                            >
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/60 font-bold opacity-80">
                                {mod.pillar}
                              </span>
                              <span>{mod.name}</span>
                              {isModActiveInRole ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                              ) : null}
                            </button>
                          );
                        })}
                    </div>

                    {/* Active Module Permission Details Pane */}
                    {(() => {
                      const activeMod =
                        availableModules.find((m) => m.id === activeModuleTab) || availableModules[0];
                      if (!activeMod) return null;
                      const modConfig = draftModulePermissions[activeMod.id] || {
                        moduleId: activeMod.id,
                        enabled: false,
                        actions: createReadOnlyActions(),
                        submodules: {},
                      };

                      const submoduleList =
                        activeMod.subModules || activeMod.featureGroups.flatMap((g) => g.items);

                      const filteredSubmodules = submoduleList.filter((subName) =>
                        subName.toLowerCase().includes(submoduleSearchQuery.toLowerCase())
                      );

                      return (
                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-slate-850/60 space-y-5">
                          {/* Super Admin Status Banner or Module Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-border">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 text-[10px] font-bold uppercase">
                                  {activeMod.pillar} Pillar
                                </span>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                  {activeMod.name} Module
                                </h4>
                              </div>
                              <p className="text-slate-500 text-xs">{activeMod.description}</p>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={modConfig.enabled}
                                disabled={selectedRole?.isSystemDefault}
                                onChange={(e) => {
                                  const enabled = e.target.checked;
                                  const updated = { ...draftModulePermissions };
                                  updated[activeMod.id] = {
                                    ...modConfig,
                                    enabled,
                                    actions: enabled ? createReadOnlyActions() : modConfig.actions,
                                  };
                                  setDraftModulePermissions(updated);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          {/* Granular Submodules & Functions Control Section */}
                          {modConfig.enabled && (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-blue-500" />
                                    Submodules & Feature Control Panel ({submoduleList.length} Submodules):
                                  </h5>
                                  <p className="text-[11px] text-slate-400">
                                    Enable/disable individual submodules and configure granular 9 action functions per submodule.
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEnableAllSubmodulesForModule(activeMod.id, submoduleList)}
                                    disabled={selectedRole?.isSystemDefault}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 transition"
                                  >
                                    Enable All Submodules
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDisableAllSubmodulesForModule(activeMod.id, submoduleList)}
                                    disabled={selectedRole?.isSystemDefault}
                                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs border border-rose-200 dark:border-rose-800/60 transition"
                                  >
                                    Disable All
                                  </button>
                                </div>
                              </div>

                              {/* Search Submodules */}
                              <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search submodules..."
                                  value={submoduleSearchQuery}
                                  onChange={(e) => setSubmoduleSearchQuery(e.target.value)}
                                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Submodules Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredSubmodules.map((subName) => {
                                  const subConfig = modConfig.submodules?.[subName] || {
                                    submoduleName: subName,
                                    enabled: true,
                                    actions: createReadOnlyActions(),
                                  };
                                  const isSubEnabled = subConfig.enabled;
                                  const isExpanded = expandedSubmodule === subName;

                                  return (
                                    <div
                                      key={subName}
                                      className={`p-3.5 rounded-xl border transition ${isSubEnabled
                                        ? 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border shadow-2xs'
                                        : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <span
                                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSubEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                              }`}
                                          />
                                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                            {subName}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <span
                                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${isSubEnabled
                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                              }`}
                                          >
                                            {isSubEnabled ? '✓ Active' : 'Off'}
                                          </span>

                                          <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={isSubEnabled}
                                              disabled={selectedRole?.isSystemDefault}
                                              onChange={(e) =>
                                                handleToggleSubmodule(activeMod.id, subName, e.target.checked)
                                              }
                                              className="sr-only peer"
                                            />
                                            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                                          </label>

                                          {isSubEnabled && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedSubmodule(isExpanded ? null : subName)
                                              }
                                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                              title="Configure Submodule Actions"
                                            >
                                              {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Expanded Submodule Action Level Functions */}
                                      {isSubEnabled && isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Submodule Function Permissions (9 Actions):
                                          </span>
                                          <div className="grid grid-cols-3 gap-1.5">
                                            {ALL_PERMISSION_ACTIONS.map((actionObj) => {
                                              const isActionChecked = subConfig.actions?.[actionObj.key] ?? false;
                                              return (
                                                <label
                                                  key={actionObj.key}
                                                  className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${isActionChecked
                                                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-dark-border text-slate-500'
                                                    }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isActionChecked}
                                                    disabled={selectedRole?.isSystemDefault}
                                                    onChange={(e) =>
                                                      handleSubmoduleActionToggle(
                                                        activeMod.id,
                                                        subName,
                                                        actionObj.key,
                                                        e.target.checked
                                                      )
                                                    }
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                                  />
                                                  <span className="truncate">{actionObj.label}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Studio Bottom Controls */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-border">
                    <Button size="sm" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                      Cancel
                    </Button>
                    {!selectedRole?.isSystemDefault && (
                      <Button size="sm" variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSaveRole}>
                        Save Dynamic Role & Permissions
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ASSIGN USER TO ROLE MODAL                                                */}
      {/* ========================================================================= */}
      {
        isAssignUserModalOpen && roleToAssign && (
          <Modal
            isOpen={isAssignUserModalOpen}
            onClose={() => setIsAssignUserModalOpen(false)}
            title={`Assign User to Role: ${roleToAssign.name}`}
            size="md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: roleToAssign.color || '#3B82F6' }}
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{roleToAssign.name}</h4>
                  <p className="text-[11px] text-slate-500">{roleToAssign.description || 'Custom Dynamic Role'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Organization User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose User from Organization Roster --</option>
                  <option value="usr-101">Alex Rivera (Senior Engineer)</option>
                  <option value="usr-102">Sarah Jenkins (HR Lead)</option>
                  <option value="usr-103">Michael Chen (Product Manager)</option>
                  <option value="usr-104">David Kim (Finance Specialist)</option>
                  <option value="usr-105">Emily Watson (Operations Analyst)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-dark-border">
                <Button size="sm" variant="outline" onClick={() => setIsAssignUserModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<UserCheck className="w-4 h-4" />}
                  onClick={handleConfirmAssignUser}
                >
                  Confirm Role Assignment
                </Button>
              </div>
            </div>
          </Modal>
        )
      }
    </div >
  );
};

