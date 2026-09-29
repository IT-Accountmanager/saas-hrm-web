import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  User,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Modal, Input, Select, Button, Badge } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { leaveService } from '../../services/leaveService';
import { useAppStore } from '../../store/useAppStore';
import { LeaveRequest } from '../../types';

export const LeaveRequestsPage: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Apply on Behalf / Apply Leave
  const [empName, setEmpName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [leaveType, setLeaveType] = useState<any>('Casual');
  const [startDate, setStartDate] = useState('2024-05-27');
  const [endDate, setEndDate] = useState('2024-05-29');
  const [reason, setReason] = useState('');
  const [initialStatus, setInitialStatus] = useState<'Pending' | 'Approved'>('Pending');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await leaveService.getRequests();
      setRequests(list);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      await leaveService.updateStatus(id, newStatus, currentUser.name);
      await loadRequests();
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await leaveService.deleteRequest(id);
        await loadRequests();
      } catch (err) {
        console.error('Failed to delete leave request:', err);
      }
    }
  };

  const handleApplyLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    try {
      await leaveService.applyLeave({
        employeeName: empName || currentUser.name,
        department: department || 'Engineering',
        leaveType,
        startDate,
        endDate,
        days,
        reason,
        status: initialStatus,
        approverName: currentUser.name,
      });

      setIsApplyModalOpen(false);
      setEmpName('');
      setReason('');
      await loadRequests();
    } catch (err) {
      console.error('Failed to submit leave application:', err);
    }
  };

  const filtered = requests.filter(r => {
    const matchesSearch = (r.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Cloudy Wave Design */}
      <PageHeaderCard
        title="Leave Requests Queue"
        subtitle="Review, approve, or reject employee time-off applications and PTO requests."
        icon={CalendarDays}
        badge={<Badge variant="warning">{requests.filter(r => r.status === 'Pending').length} Pending</Badge>}
        actions={
          <Button size="sm" onClick={() => setIsApplyModalOpen(true)} className="font-bold shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdminOrOwner ? 'Apply on Behalf' : 'Apply Leave'}
          </Button>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {requests.filter(r => r.status === 'Pending').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Requires manager / HR sign-off</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Approved Leaves</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {requests.filter(r => r.status === 'Approved').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Scheduled on company calendar</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rejected / Cancelled</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {requests.filter(r => r.status === 'Rejected' || r.status === 'Cancelled').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Quota restored to balance</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, department or leave reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Dates & Duration</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.employeeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={req.employeeName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">{req.employeeName}</div>
                        <div className="text-slate-400 text-[11px]">{req.department} · Applied {req.appliedDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{req.leaveType}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {req.startDate} to {req.endDate}
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{req.days} day(s)</span>
                  </td>
                  <td className="py-4 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      req.status === 'Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'Approved' ? 'bg-emerald-500' :
                        req.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'Pending' && isAdminOrOwner && (
                        <>
                          <button
                            onClick={() => handleAction(req.id, 'Approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'Rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isAdminOrOwner && (
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave / Apply on Behalf Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={isAdminOrOwner ? "Create / Apply Leave on Behalf" : "Submit Leave Application"}
      >
        <form onSubmit={handleApplyLeaveSubmit} className="space-y-4">
          <Input
            label="Employee Full Name"
            placeholder="e.g. Rahul Sharma"
            value={empName}
            onChange={(e) => setEmpName(e.target.value)}
            required
          />

          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Human Resources', label: 'Human Resources' },
              { value: 'Sales', label: 'Sales' },
              { value: 'Operations', label: 'Operations' },
            ]}
          />

          <Select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
            options={[
              { value: 'Casual', label: 'Casual Leave (Paid)' },
              { value: 'Annual', label: 'Annual / Earned Leave (Paid)' },
              { value: 'Sick', label: 'Sick Leave (Paid)' },
              { value: 'Maternity', label: 'Maternity / Paternity Leave' },
              { value: 'Unpaid', label: 'Unpaid Leave' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Reason for Leave"
            placeholder="Describe the purpose of time off"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          {isAdminOrOwner && (
            <Select
              label="Initial Approval Status"
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as any)}
              options={[
                { value: 'Pending', label: 'Pending Approval' },
                { value: 'Approved', label: 'Directly Approve' },
              ]}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Leave Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default LeaveRequestsPage;
