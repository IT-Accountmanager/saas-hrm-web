import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getNavigationForRole } from '../../config/navigation';
import { ROLE_PERSONAS } from '../../config/roleDashboardConfig';
import { cn } from '../../utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  NotebookTabs,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentRole,
    currentUser,
    currentOrg,
    activeContext,
    sidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    setMobileMenuOpen,
    logout,
  } = useAppStore();

  const companyName = currentRole === 'saas_owner'
    ? (activeContext === 'superadmin' ? 'Global SaaS Platform' : (currentOrg?.name || currentUser?.organizationName || 'Acme Corp'))
    : (currentOrg?.name || currentUser?.organizationName || 'Acme Corp');

  const location = useLocation();
  const navSections = getNavigationForRole(
    currentRole,
    currentOrg?.subscribedModules,
    currentOrg?.disabledSubModules,
    activeContext,
    currentUser,
    currentOrg
  );
  const currentPersona = ROLE_PERSONAS[currentRole] || ROLE_PERSONAS.employee;

  const [openDropdowns, setOpenDropdowns] = React.useState<{ [key: string]: boolean }>({});

  const toggleDropdown = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenDropdowns((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white text-slate-700 transition-all duration-300 ease-in-out border-r border-slate-200/80 dark:bg-[#0F172A] dark:text-slate-300 dark:border-slate-800/80 select-none shadow-xs',
          sidebarCollapsed ? 'w-20' : 'w-64',
          // Mobile responsive class
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/60">
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/25 text-white font-black text-lg group-hover:scale-105 transition-transform">
              <span className="text-white">◆</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                HRM
              </span>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-thin">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Subtle Section Divider */}
              {sIdx > 0 && section.sectionTitle && !sidebarCollapsed && (
                <div className="pt-2 pb-1">
                  <div className="border-t border-slate-100 dark:border-slate-800/80" />
                </div>
              )}
              {/* Top Section Company Name Header */}
              {sIdx === 0 ? (
                <div
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 select-none mb-2 transition-colors',
                    sidebarCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'px-3 py-2.5'
                  )}
                  title={companyName}
                >
                  <NotebookTabs className="h-4.5 w-4.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  {!sidebarCollapsed && (
                    <span className="font-bold text-sm tracking-tight truncate text-blue-600 dark:text-blue-400">
                      {companyName}
                    </span>
                  )}
                </div>
              ) : (
                section.sectionTitle && !sidebarCollapsed && (
                  <p className="px-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 pt-0.5">
                    {section.sectionTitle}
                  </p>
                )
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExact = location.pathname === item.href;
                const isSubPath = item.href !== '/' &&
                  item.href !== '/dashboard' &&
                  item.href !== '/saas' &&
                  item.href !== '/employees' &&
                  item.href !== '/leave' &&
                  item.href !== '/payroll' &&
                  item.href !== '/recruitment' &&
                  item.href !== '/performance' &&
                  item.href !== '/operations' &&
                  item.href !== '/reports' &&
                  item.href !== '/settings' &&
                  item.href !== '/calendar' &&
                  location.pathname.startsWith(item.href + '/');
                const isEmployeeProfile = item.href === '/profile' && (location.pathname === '/profile' || location.pathname === '/my-profile');
                const isActive = isExact || isSubPath || isEmployeeProfile || (hasChildren && location.pathname.startsWith(item.href));
                const isDropdownOpen = !!openDropdowns[item.href] || location.pathname.startsWith(item.href);

                return (
                  <div key={item.href + item.title} className="space-y-0.5">
                    <div className="flex items-center">
                      <Link
                        to={item.href}
                        onClick={() => {
                          if (hasChildren) {
                            setOpenDropdowns((prev) => ({ ...prev, [item.href]: true }));
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          'group flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 relative overflow-hidden',
                          isActive
                            ? 'bg-blue-50/90 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                          sidebarCollapsed && 'justify-center px-0'
                        )}
                        title={sidebarCollapsed ? item.title : undefined}
                      >
                        {/* Active Menu Indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 transition-all duration-150" />
                        )}
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0 transition-colors duration-150',
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200'
                          )}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate flex-1 text-left">{item.title}</span>
                        )}
                        {!sidebarCollapsed && item.badge && (
                          <span
                            className={cn(
                              'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-colors mr-1',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>

                      {/* Dropdown Toggle Chevron */}
                      {hasChildren && !sidebarCollapsed && (
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(item.href, e)}
                          title="Toggle sub-menu"
                          className="p-1.5 mr-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 transition-transform duration-200',
                              isDropdownOpen ? 'rotate-0 text-blue-600 dark:text-blue-400' : '-rotate-90'
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Dropdown Children Sub-items */}
                    {hasChildren && isDropdownOpen && !sidebarCollapsed && (
                      <div className="ml-6 pl-2.5 my-1 border-l-2 border-blue-100 dark:border-slate-800 space-y-1 animate-fadeIn">
                        {item.children!.map((child) => {
                          const isChildActive =
                            location.pathname + location.search === child.href ||
                            (!location.search && child.href === '/chat?tab=chat' && location.pathname === '/chat') ||
                            (!location.search && child.href === '/email?folder=inbox' && location.pathname === '/email');

                          return (
                            <Link
                              key={child.href + child.title}
                              to={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                                isChildActive
                                  ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/90 dark:bg-blue-950/50 shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                              )}
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <span className={cn('w-1.5 h-1.5 rounded-full', isChildActive ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-700')} />
                                {child.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Profile & Logout Section */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/profile"
                className="group relative cursor-pointer"
                title={`${currentPersona.name} (${currentPersona.title})`}
              >
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50/90 p-2 border border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-800/80">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity cursor-pointer group"
                title="View Profile"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={currentPersona.avatar}
                    alt={currentPersona.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all"
                  />
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                    {currentPersona.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentPersona.title}
                  </p>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Log Out"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Collapse Sidebar Button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors cursor-pointer',
              sidebarCollapsed ? 'justify-center px-0' : ''
            )}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
