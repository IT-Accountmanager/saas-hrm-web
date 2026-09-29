import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { UserRole } from '../../types';
import { roleService } from '../../services/roleService';
import { DynamicRole } from '../../types/rbac';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Building,
  Building2,
  Shield,
  Clock,
  HelpCircle,
  LogOut,
  Settings,
  User,
  Check,
} from 'lucide-react';
import { cn } from '../../utils';
import { ROLE_PERSONAS } from '../../config/roleDashboardConfig';

export const Header: React.FC = () => {
  const {
    currentRole,
    currentUser,
    currentOrg,
    allOrgs,
    activeContext,
    setActiveContext,
    switchRole,
    switchOrg,
    isDarkMode,
    toggleDarkMode,
    setMobileMenuOpen,
    setCommandPaletteOpen,
    setNotificationsOpen,
    logout,
  } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotificationsCount = 3;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const orgRoles: DynamicRole[] = roleService.getOrgRoles(currentOrg?.id || 'org-1');

  const baseRoles: { role: UserRole; title: string; desc: string; badgeColor: string }[] = [
    { role: 'saas_owner', title: 'SaaS Platform Owner (Super Admin)', desc: 'Manage tenants, MRR, subscriptions', badgeColor: 'bg-purple-100 text-purple-700' },
    { role: 'org_admin', title: 'Organization Admin (Acme Admin)', desc: 'Fixed Org Admin & Dynamic Role Studio', badgeColor: 'bg-indigo-100 text-indigo-700' },
  ];

  // Add dynamic custom roles created by Org Admin
  const customRoleItems = orgRoles
    .filter((r: DynamicRole) => !r.isSystemDefault)
    .map((r: DynamicRole) => ({
      role: r.name.toLowerCase().replace(/\s+/g, '_') as UserRole,
      title: `${r.name} (Custom Role)`,
      desc: r.description || 'Dynamic custom organization role',
      badgeColor: 'bg-blue-100 text-blue-700',
    }));

  const legacyRoles: { role: UserRole; title: string; desc: string; badgeColor: string }[] = [
    { role: 'hr_admin', title: 'HR Admin', desc: 'Complete HR suite & employee records', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { role: 'hr_executive', title: 'HR Executive', desc: 'Daily attendance, leaves & onboarding', badgeColor: 'bg-teal-100 text-teal-700' },
    { role: 'recruiter', title: 'Talent Recruiter', desc: 'ATS pipeline & interview scheduling', badgeColor: 'bg-cyan-100 text-cyan-700' },
    { role: 'payroll_admin', title: 'Payroll Admin', desc: 'Salary batches & tax compliance', badgeColor: 'bg-amber-100 text-amber-700' },
    { role: 'manager', title: 'Engineering Manager', desc: 'Team approvals & performance reviews', badgeColor: 'bg-orange-100 text-orange-700' },
    { role: 'employee', title: 'Employee Self-Service', desc: 'Clock-in, leaves, payslips & assets', badgeColor: 'bg-slate-100 text-slate-700' },
  ];

  const rolesList = [...baseRoles, ...customRoleItems, ...legacyRoles];

  const currentPersona = ROLE_PERSONAS[currentRole] || ROLE_PERSONAS.employee;

  const handleRoleChange = async (newRole: UserRole) => {
    await switchRole(newRole);
    setRoleDropdownOpen(false);
    setUserMenuOpen(false);
    const targetRoute = ROLE_PERSONAS[newRole]?.defaultRoute || '/dashboard';
    navigate(targetRoute);
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md transition-all duration-300 dark:border-slate-800/80 dark:bg-dark-bg/95"
    >
      {/* Left Section: Mobile Menu Button & Global Search Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex-shrink-0 rounded-xl border border-slate-200/80 p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Search Icon Button (Compact for Mobile screens < sm) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex sm:hidden flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Search anything... (Ctrl + K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Desktop & Tablet Search Bar with Ctrl + K Badge */}
        <div
          onClick={() => setCommandPaletteOpen(true)}
          className="group relative hidden sm:flex items-center w-48 sm:w-64 md:w-80 lg:w-96 cursor-pointer"
        >
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Search anything... (Ctrl + K)"
            className="w-full rounded-full border border-slate-200/90 bg-slate-50/70 py-1.5 pl-10 pr-16 text-xs text-slate-700 placeholder-slate-400 transition-all hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer dark:border-slate-800 dark:bg-dark-card dark:text-slate-200 dark:placeholder-slate-500 dark:hover:bg-slate-800/80"
          />
          <div className="absolute right-3 flex items-center">
            <kbd className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Ctrl + K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section: Context Switcher + Org Selector + Theme + Notifications + User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Dual Context Switcher for SaaS Owner (Hidden on mobile < md to prevent navbar overflow) */}
        {currentRole === 'saas_owner' && (
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveContext('organisation');
                if (location.pathname.startsWith('/saas')) {
                  navigate('/dashboard');
                }
              }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs',
                activeContext === 'organisation'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Switch to Organisation Context"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Organisation</span>
            </button>
            <button
              onClick={() => {
                setActiveContext('superadmin');
                if (!location.pathname.startsWith('/saas')) {
                  navigate('/saas');
                }
              }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs',
                activeContext === 'superadmin'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Switch to Super Admin Context"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Super Admin</span>
            </button>
          </div>
        )}

        {/* Organization Switcher (Hidden on mobile and tablet < lg) */}
        {currentRole !== 'saas_owner' && (
          <div className="relative hidden lg:block" ref={orgDropdownRef}>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="truncate max-w-[120px] font-semibold">{currentOrg?.name || 'Acme Corporation'}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-toast-slide dark:border-dark-border dark:bg-dark-card z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-dark-border mb-1">
                  Organizations
                </div>
                {allOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrg(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors',
                      currentOrg?.id === org.id
                        ? 'bg-blue-50 text-blue-900 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span>{org.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">{org.plan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="rounded-xl border border-slate-200/80 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 flex-shrink-0 cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
        </button>

        {/* Notifications Trigger */}
        <button
          onClick={() => setNotificationsOpen(true)}
          className="group relative rounded-xl border border-slate-200/80 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer flex-shrink-0"
          title="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:rotate-12 transition-transform duration-200 origin-top" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-badge-pulse">
            {unreadNotificationsCount}
          </span>
        </button>

        {/* Help (Hidden on small mobile screens < sm) */}
        <button
          onClick={() => alert('HRM SaaS Help & Documentation Center')}
          className="hidden sm:flex rounded-xl border border-slate-200/80 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 flex-shrink-0 cursor-pointer"
          title="Help & Support"
        >
          <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </button>

        {/* User Profile / Menu */}
        <div className="relative pl-0.5" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full p-0.5 sm:pr-2.5 sm:py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
          >
            <img
              src={currentPersona.avatar}
              alt={currentPersona.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20 hover-avatar-ring flex-shrink-0"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">{currentPersona.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-0.5">
                {currentPersona.title} <ChevronDown className="h-2.5 w-2.5 inline" />
              </span>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-toast-slide dark:border-dark-border dark:bg-dark-card z-50">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-dark-border mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{currentPersona.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentPersona.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {currentPersona.title}
                  </span>
                </div>
              </div>

              {/* Role Switcher in Menu */}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role Persona
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 mb-2 scrollbar-thin">
                {rolesList.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleRoleChange(item.role)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
                      currentRole === item.role
                        ? 'bg-blue-50 text-blue-900 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span>{item.title}</span>
                    {currentRole === item.role && <Check className="h-3 w-3 text-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-slate-100 dark:border-dark-border" />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/my-profile');
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Account Settings</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-dark-border" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
