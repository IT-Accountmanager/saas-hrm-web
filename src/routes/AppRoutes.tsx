import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AppLayout } from '../layouts/AppLayout';

// Module Guard Component
import { ModuleGuard } from '../components/common/ModuleGuard';

// Public & Auth Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { TwoFactorPage } from '../pages/auth/TwoFactorPage';

// SaaS Owner Portal
import { SaasDashboardPage } from '../pages/saas/SaasDashboardPage';
import { SaasOrganizationsPage } from '../pages/saas/SaasOrganizationsPage';
import { SaasSubscriptionsPage } from '../pages/saas/SaasSubscriptionsPage';
import { SaasPlansPage } from '../pages/saas/SaasPlansPage';
import { SaasBillingInvoicesPage } from '../pages/saas/SaasBillingInvoicesPage';
import { SaasRevenueAnalyticsPage } from '../pages/saas/SaasRevenueAnalyticsPage';
import { SaasSystemAnalyticsPage } from '../pages/saas/SaasSystemAnalyticsPage';
import { SaasAuditLogsPage } from '../pages/saas/SaasAuditLogsPage';
import { SaasSettingsPage } from '../pages/saas/SaasSettingsPage';
import { SaasModulesPage } from '../pages/saas/SaasModulesPage';
import { SaasModularSubscriptionsPage } from '../pages/saas/SaasModularSubscriptionsPage';

// HR & Core Modules
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { EmployeesListPage } from '../pages/employees/EmployeesListPage';
import { EmployeeProfilePage } from '../pages/employees/EmployeeProfilePage';
import { DepartmentsPage } from '../pages/employees/DepartmentsPage';
import { DesignationsPage } from '../pages/employees/DesignationsPage';
import { TeamsPage } from '../pages/employees/TeamsPage';
import { OrgStructurePage } from '../pages/employees/OrgStructurePage';

// Communication & Work Tracking (Chat, Email, Tasks, Requests, Announcements)
import { ChatPage } from '../pages/chat/ChatPage';
import { EmailPage } from '../pages/email/EmailPage';
import { TasksPage } from '../pages/tasks/TasksPage';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { AnnouncementsPage } from '../pages/company/AnnouncementsPage';

// Attendance & Leave
import { AttendancePage } from '../pages/attendance/AttendancePage';
import { ClockInPage } from '../pages/attendance/ClockInPage';
import { ShiftSchedulePage } from '../pages/attendance/ShiftSchedulePage';
import { TimesheetsPage } from '../pages/attendance/TimesheetsPage';
import { LeaveManagementPage } from '../pages/leave/LeaveManagementPage';
import { LeaveRequestsPage } from '../pages/leave/LeaveRequestsPage';
import { LeaveBalancePage } from '../pages/leave/LeaveBalancePage';
import { HolidaysPage } from '../pages/leave/HolidaysPage';

// Payroll & Compensation
import { PayrollDashboardPage } from '../pages/payroll/PayrollDashboardPage';
import { SalaryStructurePage } from '../pages/payroll/SalaryStructurePage';
import { PayslipsPage } from '../pages/payroll/PayslipsPage';
import { PayrollAdjustmentsPage } from '../pages/payroll/PayrollAdjustmentsPage';
import { LoansAdvancesPage } from '../pages/payroll/LoansAdvancesPage';
import { StatutoryCompliancePage } from '../pages/payroll/StatutoryCompliancePage';

// Accounting & Finance
import { FinanceDashboardPage } from '../pages/finance/FinanceDashboardPage';
import { ChartOfAccountsPage } from '../pages/finance/ChartOfAccountsPage';
import { InvoicesReceivablesPage } from '../pages/finance/InvoicesReceivablesPage';
import { BillsPayablesPage } from '../pages/finance/BillsPayablesPage';
import { PaymentsReceiptsPage } from '../pages/finance/PaymentsReceiptsPage';
import { BankReconciliationPage } from '../pages/finance/BankReconciliationPage';
import { TaxGstPage } from '../pages/finance/TaxGstPage';
import { FinancialStatementsPage } from '../pages/finance/FinancialStatementsPage';

// Recruitment ATS & Talent Acquisition
import { JobOpeningsPage } from '../pages/recruitment/JobOpeningsPage';
import { JobCreatePage } from '../pages/recruitment/JobCreatePage';
import { CandidatesKanbanPage } from '../pages/recruitment/CandidatesKanbanPage';
import { CandidateDatabasePage } from '../pages/recruitment/CandidateDatabasePage';
import { ManpowerRequirementsPage } from '../pages/recruitment/ManpowerRequirementsPage';
import { JobRequisitionsPage } from '../pages/recruitment/JobRequisitionsPage';
import { ResumeManagementPage } from '../pages/recruitment/ResumeManagementPage';
import { ApplicationsPage } from '../pages/recruitment/ApplicationsPage';
import { ScreeningPage } from '../pages/recruitment/ScreeningPage';
import { InterviewsPage } from '../pages/recruitment/InterviewsPage';
import { InterviewEvaluationPage } from '../pages/recruitment/InterviewEvaluationPage';
import { OfferManagementPage } from '../pages/recruitment/OfferManagementPage';
import { RecruitmentPipelinePage } from '../pages/recruitment/RecruitmentPipelinePage';
import { RecruitmentAnalyticsPage } from '../pages/recruitment/RecruitmentAnalyticsPage';
import { OnboardingHandoverPage } from '../pages/recruitment/OnboardingHandoverPage';
import { RecruiterNotificationsPage } from '../pages/recruitment/RecruiterNotificationsPage';

// Performance & Operations
import { GoalsPage } from '../pages/performance/GoalsPage';
import { PerformanceReviewsPage } from '../pages/performance/PerformanceReviewsPage';
import { ExpensesPage } from '../pages/operations/ExpensesPage';
import { AssetsPage } from '../pages/operations/AssetsPage';
import { DocumentsPage } from '../pages/operations/DocumentsPage';
import { TrainingPage } from '../pages/operations/TrainingPage';

// Manager Dedicated Workspace
import { ManagerTeamPage } from '../pages/manager/ManagerTeamPage';
import { ManagerAttendancePage } from '../pages/manager/ManagerAttendancePage';
import { ManagerLeavePage } from '../pages/manager/ManagerLeavePage';
import { ManagerTasksPage } from '../pages/manager/ManagerTasksPage';
import { ManagerPerformancePage } from '../pages/manager/ManagerPerformancePage';
import { ManagerHiringPage } from '../pages/manager/ManagerHiringPage';
import { ManagerExpensesPage } from '../pages/manager/ManagerExpensesPage';
import { ManagerPayrollCompPage } from '../pages/manager/ManagerPayrollCompPage';
import { ManagerApprovalsCenterPage } from '../pages/manager/ManagerApprovalsCenterPage';
import { ManagerReportsPage } from '../pages/manager/ManagerReportsPage';

// Calendar, Reports, Settings & Support
import { CalendarPage } from '../pages/calendar/CalendarPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { HelpSupportPage } from '../pages/support/HelpSupportPage';

// ERP Expansion Modules
import { ProjectCostingPage } from '../pages/costing/ProjectCostingPage';
import { VendorManagementPage } from '../pages/procurement/VendorManagementPage';
import { PurchaseOrdersPage } from '../pages/procurement/PurchaseOrdersPage';

// CRM & Billing Modules
import { CrmDashboardPage } from '../pages/crm/CrmDashboardPage';
import { CustomersDatabasePage } from '../pages/crm/CustomersDatabasePage';
import { LeadsKanbanPage } from '../pages/crm/LeadsKanbanPage';
import { ClientInvoicesPage } from '../pages/billing/ClientInvoicesPage';
import { QuotationsPage } from '../pages/sales/QuotationsPage';
import { SalesPipelineAnalytics } from '../pages/sales/SalesPipelineAnalytics';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Standalone Full-Page Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Standalone Auth Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/2fa" element={<TwoFactorPage />} />

      {/* Main SaaS & HRM Application Workspace (AppLayout) */}
      <Route element={<AppLayout />}>
        {/* Dashboards */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/saas/dashboard" element={<DashboardPage forcedRole="saas_owner" />} />
        <Route path="/organization/dashboard" element={<DashboardPage forcedRole="org_admin" />} />
        <Route path="/hr/dashboard" element={<DashboardPage forcedRole="hr_admin" />} />
        <Route path="/hr-executive/dashboard" element={<DashboardPage forcedRole="hr_executive" />} />
        <Route path="/recruiter/dashboard" element={<ModuleGuard moduleId="recruitment_management"><DashboardPage forcedRole="recruiter" /></ModuleGuard>} />
        <Route path="/payroll/dashboard" element={<ModuleGuard moduleId="finance_management"><DashboardPage forcedRole="payroll_admin" /></ModuleGuard>} />
        <Route path="/manager/dashboard" element={<DashboardPage forcedRole="manager" />} />
        <Route path="/employee/dashboard" element={<DashboardPage forcedRole="employee" />} />

        {/* Work, Communication & Collaboration */}
        <Route path="/tasks" element={<ModuleGuard moduleId="project_task_management"><TasksPage /></ModuleGuard>} />
        <Route path="/chat" element={<ModuleGuard moduleId="chat_communication"><ChatPage /></ModuleGuard>} />
        <Route path="/email" element={<ModuleGuard moduleId="email_management"><EmailPage /></ModuleGuard>} />
        <Route path="/requests" element={<ModuleGuard moduleId="customer_service_support"><RequestsPage /></ModuleGuard>} />
        <Route path="/announcements" element={<AnnouncementsPage />} />

        {/* SaaS Specific Sub-pages */}
        <Route path="/saas" element={<DashboardPage forcedRole="saas_owner" />} />
        <Route path="/saas/organizations" element={<SaasOrganizationsPage />} />
        <Route path="/saas/modules" element={<SaasModulesPage />} />
        <Route path="/saas/modular-subscriptions" element={<Navigate to="/saas/modules" replace />} />
        {/* <Route path="/saas/subscriptions" element={<SaasSubscriptionsPage />} /> */}
        <Route path="/saas/subscriptions" element={<Navigate to="/saas" replace />} />
        <Route path="/saas/plans" element={<SaasPlansPage />} />
        <Route path="/saas/billing" element={<SaasBillingInvoicesPage />} />
        <Route path="/saas/revenue" element={<SaasRevenueAnalyticsPage />} />
        <Route path="/saas/sales" element={<SaasRevenueAnalyticsPage />} />
        <Route path="/saas/hiring" element={<EmployeesListPage />} />
        <Route path="/saas/tickets" element={<RequestsPage />} />
        <Route path="/saas/analytics" element={<SaasSystemAnalyticsPage />} />
        <Route path="/saas/audit-logs" element={<SaasAuditLogsPage />} />
        <Route path="/saas/settings" element={<SaasSettingsPage />} />

        {/* Employee Management & Profiles */}
        <Route path="/employees" element={<ModuleGuard moduleId="organization_management"><EmployeesListPage /></ModuleGuard>} />
        <Route path="/employees/:id" element={<ModuleGuard moduleId="organization_management"><EmployeeProfilePage /></ModuleGuard>} />
        <Route path="/profile" element={<EmployeeProfilePage />} />
        <Route path="/my-profile" element={<EmployeeProfilePage />} />
        <Route path="/employee/profile" element={<EmployeeProfilePage />} />
        <Route path="/departments" element={<ModuleGuard moduleId="organization_management"><DepartmentsPage /></ModuleGuard>} />
        <Route path="/designations" element={<ModuleGuard moduleId="organization_management"><DesignationsPage /></ModuleGuard>} />
        <Route path="/teams" element={<ModuleGuard moduleId="organization_management"><TeamsPage /></ModuleGuard>} />
        <Route path="/org-structure" element={<ModuleGuard moduleId="organization_management"><OrgStructurePage /></ModuleGuard>} />

        {/* Time & Attendance */}
        <Route path="/attendance" element={<ModuleGuard moduleId="employee_hr_management"><AttendancePage /></ModuleGuard>} />
        <Route path="/clock-in" element={<ModuleGuard moduleId="employee_hr_management"><ClockInPage /></ModuleGuard>} />
        <Route path="/shifts" element={<ModuleGuard moduleId="employee_hr_management"><ShiftSchedulePage /></ModuleGuard>} />
        <Route path="/timesheets" element={<ModuleGuard moduleId="employee_hr_management"><TimesheetsPage /></ModuleGuard>} />

        {/* Leave */}
        <Route path="/leave" element={<ModuleGuard moduleId="employee_hr_management"><LeaveManagementPage /></ModuleGuard>} />
        <Route path="/leave/requests" element={<ModuleGuard moduleId="employee_hr_management"><LeaveRequestsPage /></ModuleGuard>} />
        <Route path="/leave/balance" element={<ModuleGuard moduleId="employee_hr_management"><LeaveBalancePage /></ModuleGuard>} />
        <Route path="/leave/holidays" element={<ModuleGuard moduleId="employee_hr_management"><HolidaysPage /></ModuleGuard>} />

        {/* Payroll & Compensation */}
        <Route path="/payroll" element={<ModuleGuard moduleId="finance_management"><PayrollDashboardPage /></ModuleGuard>} />
        <Route path="/payroll/salary-structure" element={<ModuleGuard moduleId="finance_management"><SalaryStructurePage /></ModuleGuard>} />
        <Route path="/payroll/payslips" element={<ModuleGuard moduleId="finance_management"><PayslipsPage /></ModuleGuard>} />
        <Route path="/payroll/adjustments" element={<ModuleGuard moduleId="finance_management"><PayrollAdjustmentsPage /></ModuleGuard>} />
        <Route path="/payroll/loans" element={<ModuleGuard moduleId="finance_management"><LoansAdvancesPage /></ModuleGuard>} />
        <Route path="/payroll/compliance" element={<ModuleGuard moduleId="finance_management"><StatutoryCompliancePage /></ModuleGuard>} />
        <Route path="/my-payroll" element={<ModuleGuard moduleId="finance_management"><PayslipsPage /></ModuleGuard>} />

        {/* Core Accounting & Finance */}
        <Route path="/finance/chart-of-accounts" element={<ModuleGuard moduleId="finance_management"><ChartOfAccountsPage /></ModuleGuard>} />
        <Route path="/finance/invoices" element={<ModuleGuard moduleId="finance_management"><InvoicesReceivablesPage /></ModuleGuard>} />
        <Route path="/finance/receivables" element={<ModuleGuard moduleId="finance_management"><InvoicesReceivablesPage /></ModuleGuard>} />
        <Route path="/finance/bills" element={<ModuleGuard moduleId="finance_management"><BillsPayablesPage /></ModuleGuard>} />
        <Route path="/finance/payables" element={<ModuleGuard moduleId="finance_management"><BillsPayablesPage /></ModuleGuard>} />
        <Route path="/finance/vouchers" element={<ModuleGuard moduleId="finance_management"><PaymentsReceiptsPage /></ModuleGuard>} />
        <Route path="/finance/reconciliation" element={<ModuleGuard moduleId="finance_management"><BankReconciliationPage /></ModuleGuard>} />
        <Route path="/finance/gst" element={<ModuleGuard moduleId="finance_management"><TaxGstPage /></ModuleGuard>} />
        <Route path="/finance/statements" element={<ModuleGuard moduleId="finance_management"><FinancialStatementsPage /></ModuleGuard>} />

        {/* Recruiter / Talent Acquisition Dedicated Workspace */}
        <Route path="/recruiter/manpower-requirements" element={<ModuleGuard moduleId="recruitment_management"><ManpowerRequirementsPage /></ModuleGuard>} />
        <Route path="/recruiter/requisitions" element={<ModuleGuard moduleId="recruitment_management"><JobRequisitionsPage /></ModuleGuard>} />
        <Route path="/recruiter/requisitions/:id" element={<ModuleGuard moduleId="recruitment_management"><JobRequisitionsPage /></ModuleGuard>} />
        <Route path="/recruiter/jobs" element={<ModuleGuard moduleId="recruitment_management"><JobOpeningsPage /></ModuleGuard>} />
        <Route path="/recruiter/jobs/create" element={<ModuleGuard moduleId="recruitment_management"><JobCreatePage /></ModuleGuard>} />
        <Route path="/recruiter/jobs/:id" element={<ModuleGuard moduleId="recruitment_management"><JobOpeningsPage /></ModuleGuard>} />
        <Route path="/recruiter/candidates" element={<ModuleGuard moduleId="recruitment_management"><CandidateDatabasePage /></ModuleGuard>} />
        <Route path="/recruiter/candidates/:id" element={<ModuleGuard moduleId="recruitment_management"><CandidateDatabasePage /></ModuleGuard>} />
        <Route path="/recruiter/resumes" element={<ModuleGuard moduleId="recruitment_management"><ResumeManagementPage /></ModuleGuard>} />
        <Route path="/recruiter/applications" element={<ModuleGuard moduleId="recruitment_management"><ApplicationsPage /></ModuleGuard>} />
        <Route path="/recruiter/screening" element={<ModuleGuard moduleId="recruitment_management"><ScreeningPage /></ModuleGuard>} />
        <Route path="/recruiter/interviews" element={<ModuleGuard moduleId="recruitment_management"><InterviewsPage /></ModuleGuard>} />
        <Route path="/recruiter/interviews/calendar" element={<ModuleGuard moduleId="recruitment_management"><InterviewsPage /></ModuleGuard>} />
        <Route path="/recruiter/evaluations" element={<ModuleGuard moduleId="recruitment_management"><InterviewEvaluationPage /></ModuleGuard>} />
        <Route path="/recruiter/offers" element={<ModuleGuard moduleId="recruitment_management"><OfferManagementPage /></ModuleGuard>} />
        <Route path="/recruiter/pipeline" element={<ModuleGuard moduleId="recruitment_management"><RecruitmentPipelinePage /></ModuleGuard>} />
        <Route path="/recruiter/analytics" element={<ModuleGuard moduleId="recruitment_management"><RecruitmentAnalyticsPage /></ModuleGuard>} />
        <Route path="/recruiter/joining" element={<ModuleGuard moduleId="recruitment_management"><OnboardingHandoverPage /></ModuleGuard>} />
        <Route path="/recruiter/handover" element={<ModuleGuard moduleId="recruitment_management"><OnboardingHandoverPage /></ModuleGuard>} />
        <Route path="/recruiter/notifications" element={<ModuleGuard moduleId="recruitment_management"><RecruiterNotificationsPage /></ModuleGuard>} />

        {/* Recruitment / ATS Legacy & Inter-module Compatibility */}
        <Route path="/recruitment/jobs" element={<ModuleGuard moduleId="recruitment_management"><JobOpeningsPage /></ModuleGuard>} />
        <Route path="/recruitment/candidates" element={<ModuleGuard moduleId="recruitment_management"><CandidateDatabasePage /></ModuleGuard>} />
        <Route path="/recruitment/pipeline" element={<ModuleGuard moduleId="recruitment_management"><RecruitmentPipelinePage /></ModuleGuard>} />
        <Route path="/recruitment/interviews" element={<ModuleGuard moduleId="recruitment_management"><InterviewsPage /></ModuleGuard>} />

        {/* Manager Dedicated Workspace */}
        <Route path="/manager/team" element={<ManagerTeamPage />} />
        <Route path="/manager/attendance" element={<ManagerAttendancePage />} />
        <Route path="/manager/leave" element={<ManagerLeavePage />} />
        <Route path="/manager/tasks" element={<ManagerTasksPage />} />
        <Route path="/manager/performance" element={<ManagerPerformancePage />} />
        <Route path="/manager/hiring" element={<ManagerHiringPage />} />
        <Route path="/manager/expenses" element={<ManagerExpensesPage />} />
        <Route path="/manager/compensation" element={<ManagerPayrollCompPage />} />
        <Route path="/manager/approvals" element={<ManagerApprovalsCenterPage />} />
        <Route path="/manager/reports" element={<ManagerReportsPage />} />

        {/* Performance & OKRs */}
        <Route path="/performance/goals" element={<ModuleGuard moduleId="kpi_performance_management"><GoalsPage /></ModuleGuard>} />
        <Route path="/performance/reviews" element={<ModuleGuard moduleId="kpi_performance_management"><PerformanceReviewsPage /></ModuleGuard>} />

        {/* Operations & Documents */}
        <Route path="/operations/expenses" element={<ModuleGuard moduleId="finance_management"><ExpensesPage /></ModuleGuard>} />
        <Route path="/operations/assets" element={<ModuleGuard moduleId="inventory_asset_management"><AssetsPage /></ModuleGuard>} />
        <Route path="/assets" element={<ModuleGuard moduleId="inventory_asset_management"><AssetsPage /></ModuleGuard>} />
        <Route path="/my-assets" element={<ModuleGuard moduleId="inventory_asset_management"><AssetsPage /></ModuleGuard>} />
        <Route path="/employee/assets" element={<ModuleGuard moduleId="inventory_asset_management"><AssetsPage /></ModuleGuard>} />
        <Route path="/operations/documents" element={<ModuleGuard moduleId="document_management"><DocumentsPage /></ModuleGuard>} />
        <Route path="/documents" element={<ModuleGuard moduleId="document_management"><DocumentsPage /></ModuleGuard>} />
        <Route path="/my-documents" element={<ModuleGuard moduleId="document_management"><DocumentsPage /></ModuleGuard>} />
        <Route path="/employee/documents" element={<ModuleGuard moduleId="document_management"><DocumentsPage /></ModuleGuard>} />
        <Route path="/operations/training" element={<ModuleGuard moduleId="employee_hr_management"><TrainingPage /></ModuleGuard>} />

        {/* Calendar, Reports, Settings & Support */}
        <Route path="/calendar" element={<Navigate to="/attendance" replace />} />
        <Route path="/reports" element={<ModuleGuard moduleId="mis_analytics_dashboard"><ReportsPage /></ModuleGuard>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpSupportPage />} />
        <Route path="/support" element={<HelpSupportPage />} />

        {/* --- ERP & CRM Modules --- */}
        {/* CRM & Sales */}
        <Route path="/crm" element={<ModuleGuard moduleId="sales_crm"><CrmDashboardPage /></ModuleGuard>} />
        <Route path="/crm/leads" element={<ModuleGuard moduleId="sales_crm"><LeadsKanbanPage /></ModuleGuard>} />
        <Route path="/crm/customers" element={<ModuleGuard moduleId="sales_crm"><CustomersDatabasePage /></ModuleGuard>} />
        <Route path="/sales/quotations" element={<ModuleGuard moduleId="sales_crm"><QuotationsPage /></ModuleGuard>} />
        <Route path="/sales/pipeline" element={<ModuleGuard moduleId="sales_crm"><SalesPipelineAnalytics /></ModuleGuard>} />

        {/* Finance & ERP */}
        <Route path="/finance" element={<ModuleGuard moduleId="finance_management"><FinanceDashboardPage /></ModuleGuard>} />
        <Route path="/finance/invoices" element={<ModuleGuard moduleId="finance_management"><InvoicesReceivablesPage /></ModuleGuard>} />
        <Route path="/costing" element={<ProjectCostingPage />} />
        <Route path="/finance/coa" element={<ChartOfAccountsPage />} />
        <Route path="/finance/vouchers" element={<PaymentsReceiptsPage />} />
        <Route path="/billing/invoices" element={<ModuleGuard moduleId="finance_management"><ClientInvoicesPage /></ModuleGuard>} />
        <Route path="/billing/receipts" element={<PaymentsReceiptsPage />} />
        <Route path="/procurement" element={<ModuleGuard moduleId="inventory_asset_management"><VendorManagementPage /></ModuleGuard>} />
        <Route path="/procurement/vendors" element={<ModuleGuard moduleId="inventory_asset_management"><VendorManagementPage /></ModuleGuard>} />
        <Route path="/procurement/purchase-orders" element={<ModuleGuard moduleId="inventory_asset_management"><VendorManagementPage /></ModuleGuard>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

