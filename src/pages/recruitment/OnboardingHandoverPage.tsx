import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recruitmentService } from '../../services/recruitmentService';
import { recruitmentCommunicationService } from '../../services/recruitmentCommunicationService';
import { recruitmentWorkflowEngine } from '../../services/recruitmentWorkflowEngine';
import { OnboardingHandover } from '../../types';
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DataTable,
  Column,
  Modal,
  Avatar,
  Select,
} from '../../components/ui';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Calendar,
  Building2,
  RefreshCw,
  Send,
  Sparkles,
  Mail,
  ListTodo,
} from 'lucide-react';
import { formatDate } from '../../utils';

export const OnboardingHandoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';

  const [handovers, setHandovers] = useState<OnboardingHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<OnboardingHandover | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [assignedHrName, setAssignedHrName] = useState('Sneha Gupta (HR Operations)');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const list = await recruitmentService.getHandovers();
    setHandovers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleChecklistItem = async (
    key: keyof OnboardingHandover['checklist'],
    currentVal: boolean
  ) => {
    if (!selectedRecord) return;
    const updated = await recruitmentService.updateHandoverChecklist(selectedRecord.id, key, !currentVal);
    setSelectedRecord(updated);
    loadData();
  };

  const handleCompleteHandover = async () => {
    if (!selectedRecord) return;
    const updated = await recruitmentService.completeHandoverToHR(selectedRecord.id, assignedHrName);
    setIsChecklistModalOpen(false);
    const empCodeMsg = updated.employeeId ? ` (Created Employee Master: ${updated.employeeId})` : '';
    showToast(`Successfully handed over ${selectedRecord.candidateName} to HR Onboarding${empCodeMsg}`);
    loadData();
  };

  // Filter based on tab
  const filteredHandovers = handovers.filter((h) => {
    if (currentTab === 'pending') return h.handoverStatus === 'Joining Pending';
    if (currentTab === 'confirmed') return h.handoverStatus === 'Joining Confirmed';
    if (currentTab === 'documents') return h.documentsStatus === 'Pending Upload';
    if (currentTab === 'ready') return h.handoverStatus === 'Ready for Handover';
    if (currentTab === 'handover') return h.handoverStatus === 'Handover to HR';
    return true;
  });

  const getHandoverBadge = (status: OnboardingHandover['handoverStatus']) => {
    switch (status) {
      case 'Handover to HR':
        return <Badge variant="success" size="sm">Ready for HR Onboarding</Badge>;
      case 'Ready for Handover':
        return <Badge variant="primary" size="sm">Ready for Handover</Badge>;
      case 'Joining Confirmed':
        return <Badge variant="info" size="sm">Joining Confirmed</Badge>;
      case 'Joining Pending':
        return <Badge variant="warning" size="sm">Joining Pending</Badge>;
      default:
        return null;
    }
  };

  const columns: Column<OnboardingHandover>[] = [
    {
      header: 'Applicant / ID',
      accessorKey: 'candidateId',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {row.candidateId}
        </span>
      ),
    },
    {
      header: 'Candidate',
      accessorKey: 'candidateName',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.candidateAvatar} name={row.candidateName} size="sm" />
          <div>
            <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
              {row.candidateName}
            </p>
            <p className="text-[10px] text-slate-400">{row.candidateEmail}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Job & Designation',
      accessorKey: 'jobTitle',
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{row.jobTitle}</p>
          <p className="text-[10px] text-slate-400">{row.designation} • {row.department}</p>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      accessorKey: 'joiningDate',
      cell: (row) => (
        <div className="text-xs font-mono">
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatDate(row.joiningDate)}
          </span>
        </div>
      ),
    },
    {
      header: 'Offer Status',
      accessorKey: 'offerStatus',
      cell: (row) => (
        <Badge variant={row.offerStatus === 'Accepted' ? 'success' : 'warning'} size="sm">
          {row.offerStatus}
        </Badge>
      ),
    },
    {
      header: 'Documents',
      accessorKey: 'documentsStatus',
      cell: (row) => (
        <Badge variant={row.documentsStatus === 'Verified' ? 'success' : 'warning'} size="sm">
          {row.documentsStatus}
        </Badge>
      ),
    },
    {
      header: 'Handover Status',
      accessorKey: 'handoverStatus',
      cell: (row) => getHandoverBadge(row.handoverStatus),
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant={row.handoverStatus === 'Handover to HR' ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              setSelectedRecord(row);
              setIsChecklistModalOpen(true);
            }}
            className="text-xs"
          >
            {row.handoverStatus === 'Handover to HR' ? 'View Checklist' : 'Handover to HR'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successToast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Joining & Onboarding Handover Gateway
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit pre-employment readiness, verify documentation, and transfer selected candidates directly to HR Ops.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-dark-border overflow-x-auto">
        {[
          { key: 'pending', label: 'Joining Pending', count: handovers.filter((h) => h.handoverStatus === 'Joining Pending').length },
          { key: 'confirmed', label: 'Joining Confirmed', count: handovers.filter((h) => h.handoverStatus === 'Joining Confirmed').length },
          { key: 'documents', label: 'Documents Pending', count: handovers.filter((h) => h.documentsStatus === 'Pending Upload').length },
          { key: 'ready', label: 'Ready for Onboarding', count: handovers.filter((h) => h.handoverStatus === 'Ready for Handover').length },
          { key: 'handover', label: 'Handover to HR', count: handovers.filter((h) => h.handoverStatus === 'Handover to HR').length },
        ].map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${isActive
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full ${isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <Card className="border border-slate-200/80 dark:border-dark-border overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredHandovers}
          searchKey="candidateName"
          searchPlaceholder="Search candidate, job, ID or department..."
          pageSize={8}
        />
      </Card>

      {/* Pre-Handover Checklist Modal */}
      {selectedRecord && (
        <Modal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          title={`Pre-Employment Handover Audit: ${selectedRecord.candidateName}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={selectedRecord.candidateAvatar} name={selectedRecord.candidateName} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedRecord.candidateName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedRecord.designation} • {selectedRecord.department}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Start Date
                </span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatDate(selectedRecord.joiningDate)}
                </p>
              </div>
            </div>

            {/* Checklist items */}
            <div className="border border-slate-200 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-card space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-2">
                Mandatory Verification Checklist
              </h4>

              {[
                { key: 'offerAccepted', label: '1. Formal Offer Accepted by Candidate' },
                { key: 'personalInfoComplete', label: '2. Personal Identification & Contact Details Complete' },
                { key: 'resumeAvailable', label: '3. Signed CV / Verified Resume on Record' },
                { key: 'documentsUploaded', label: '4. Required Certificates & Tax Forms Uploaded' },
                { key: 'joiningDateConfirmed', label: '5. Joining Date & Orientation Schedule Confirmed' },
                { key: 'salaryDetailsApproved', label: '6. Base Salary & Executive Comp Package Approved' },
                { key: 'jobDepartmentConfirmed', label: '7. Department Allocation & Hiring Manager Confirmed' },
              ].map((item) => {
                const checked = selectedRecord.checklist[item.key as keyof OnboardingHandover['checklist']];
                return (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleToggleChecklistItem(
                          item.key as keyof OnboardingHandover['checklist'],
                          !!checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            {/* Handover Assignment */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assign to HR Onboarding Specialist
              </label>
              <Select
                value={assignedHrName}
                onChange={(e) => setAssignedHrName(e.target.value)}
                options={[
                  { label: 'Sneha Gupta (HR Operations Lead)', value: 'Sneha Gupta' },
                  { label: 'Alex Johnson (People Partner)', value: 'Alex Johnson' },
                  { label: 'Rachel Green (Employee Success)', value: 'Rachel Green' },
                ]}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-dark-border">
              <span className="text-[11px] text-slate-500">
                {Object.values(selectedRecord.checklist).filter(Boolean).length} of 7 checks satisfied
              </span>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsChecklistModalOpen(false)}>
                  Close
                </Button>

                {selectedRecord.handoverStatus !== 'Handover to HR' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCompleteHandover}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Handover to HR
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
