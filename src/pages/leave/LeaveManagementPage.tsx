import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { leaveService } from '../../services/leaveService';
import { LeaveRequest } from '../../types';
import {
  CalendarCheck,
  CalendarX,
  FileText,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  MoreHorizontal,
  Palmtree,
  PlusCircle,
  Star,
  Users,
  CalendarDays,
  Check,
  X,
  Calendar,
  Filter,
} from 'lucide-react';
import { cn } from '../../utils';
import { Modal, Button, Input, Select, Badge } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';

interface LeaveRecordItem {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  reason?: string;
}

export const LeaveManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  // Top Nav Tab: 'my' | 'team' | 'calendar'
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'calendar'>('my');

  // Filter States
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('Apr 2025 - Apr 2026');

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState('April 2025');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFullCalendarModalOpen, setIsFullCalendarModalOpen] = useState(false);
  const [selectedLeaveItem, setSelectedLeaveItem] = useState<LeaveRecordItem | null>(null);

  // Apply Form State
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2025-04-15');
  const [endDate, setEndDate] = useState('2025-04-16');
  const [reason, setReason] = useState('');

  // 8 Exact Records from Reference Image
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecordItem[]>([
    {
      id: 1,
      leaveType: 'Casual Leave',
      startDate: 'Apr 12, 2025',
      endDate: 'Apr 12, 2025',
      duration: '1 Day',
      status: 'Approved',
      reason: 'Personal family matter',
    },
    {
      id: 2,
      leaveType: 'Sick Leave',
      startDate: 'Apr 08, 2025',
      endDate: 'Apr 09, 2025',
      duration: '2 Days',
      status: 'Approved',
      reason: 'Fever and viral illness',
    },
    {
      id: 3,
      leaveType: 'Casual Leave',
      startDate: 'Mar 28, 2025',
      endDate: 'Mar 29, 2025',
      duration: '2 Days',
      status: 'Approved',
      reason: 'Out of station trip',
    },
    {
      id: 4,
      leaveType: 'Earned Leave',
      startDate: 'Mar 15, 2025',
      endDate: 'Mar 17, 2025',
      duration: '3 Days',
      status: 'Approved',
      reason: 'Annual vacation break',
    },
    {
      id: 5,
      leaveType: 'Sick Leave',
      startDate: 'Feb 10, 2025',
      endDate: 'Feb 10, 2025',
      duration: '1 Day',
      status: 'Approved',
      reason: 'Medical checkup',
    },
    {
      id: 6,
      leaveType: 'Casual Leave',
      startDate: 'Jan 22, 2025',
      endDate: 'Jan 24, 2025',
      duration: '3 Days',
      status: 'Rejected',
      reason: 'Urgent household relocation',
    },
    {
      id: 7,
      leaveType: 'Earned Leave',
      startDate: 'Jan 10, 2025',
      endDate: 'Jan 14, 2025',
      duration: '5 Days',
      status: 'Approved',
      reason: 'Winter family holidays',
    },
    {
      id: 8,
      leaveType: 'Casual Leave',
      startDate: 'Dec 18, 2024',
      endDate: 'Dec 19, 2024',
      duration: '2 Days',
      status: 'Approved',
      reason: 'Personal emergency',
    },
  ]);

  // Calendar matrix days for April 2025 (matching reference image)
  // Highlights: 8 (Selected blue), 12 (Approved green), 15 (Pending purple), 26 (Rejected red)
  const aprilCalendarDays = [
    { day: 30, month: 'prev' },
    { day: 31, month: 'prev' },
    { day: 1, month: 'current' },
    { day: 2, month: 'current' },
    { day: 3, month: 'current' },
    { day: 4, month: 'current' },
    { day: 5, month: 'current' },
    { day: 6, month: 'current' },
    { day: 7, month: 'current' },
    { day: 8, month: 'current', isSelected: true }, // Blue circle
    { day: 9, month: 'current' },
    { day: 10, month: 'current' },
    { day: 11, month: 'current' },
    { day: 12, month: 'current', status: 'Approved' }, // Green circle
    { day: 13, month: 'current' },
    { day: 14, month: 'current' },
    { day: 15, month: 'current', status: 'Pending' }, // Purple circle
    { day: 16, month: 'current' },
    { day: 17, month: 'current' },
    { day: 18, month: 'current' },
    { day: 19, month: 'current' },
    { day: 20, month: 'current' },
    { day: 21, month: 'current' },
    { day: 22, month: 'current' },
    { day: 23, month: 'current' },
    { day: 24, month: 'current' },
    { day: 25, month: 'current' },
    { day: 26, month: 'current', status: 'Rejected' }, // Red circle
    { day: 27, month: 'current' },
    { day: 28, month: 'current' },
    { day: 29, month: 'current' },
    { day: 30, month: 'current' },
    { day: 1, month: 'next' },
    { day: 2, month: 'next' },
    { day: 3, month: 'next' },
  ];

  // Filtering
  const filteredRecords = leaveRecords.filter((rec) => {
    const matchesType = typeFilter === 'All' || rec.leaveType.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const handleApplyLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: LeaveRecordItem = {
      id: leaveRecords.length + 1,
      leaveType: newLeaveType,
      startDate,
      endDate,
      duration: '2 Days',
      status: 'Pending',
      reason,
    };
    setLeaveRecords([newRecord, ...leaveRecords]);
    try {
      await leaveService.applyLeave({
        employeeName: currentUser?.name || 'Rahul Sharma',
        leaveType: newLeaveType as any,
        startDate,
        endDate,
        reason,
        status: 'Pending',
      });
    } catch (err) {
      console.error('Failed to persist leave request via service:', err);
    }
    setIsApplyModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-4 animate-page-enter">
      {/* HEADER AREA: CLOUDY WAVE DESIGN WITH 3D SVG ILLUSTRATION */}
      <PageHeaderCard
        title="Leave Management"
        subtitle="Apply for leaves, check your leave balance and track your leave history — all in one place."
        icon={CalendarDays}
        badge={<Badge variant="primary" size="sm">18 Days Available</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsApplyModalOpen(true)}
              className="font-bold shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Apply Leave
            </Button>
            {/* Right: Soft 3D Calendar & Clock Illustration */}
            <div className="hidden lg:flex items-center justify-end relative pr-2">
              <div className="relative flex items-center justify-center">
                {/* Ambient Soft Glow Behind Graphic */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-sky-300/20 to-blue-500/20 rounded-full blur-lg pointer-events-none" />

                {/* SVG 3D Calendar & Clock Graphic */}
                <svg width="95" height="52" viewBox="0 0 170 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Soft Leaves Decorative Background */}
                  <path d="M12 55C24 42 38 48 44 64C31 70 20 66 12 55Z" fill="#BFDBFE" fillOpacity="0.6" />
                  <path d="M152 28C142 16 128 22 122 38C134 44 146 40 152 28Z" fill="#BFDBFE" fillOpacity="0.5" />
                  <path d="M162 48C148 40 140 52 142 66C155 66 161 58 162 48Z" fill="#93C5FD" fillOpacity="0.5" />

                  {/* 3D Slanted Calendar */}
                  <g transform="translate(48, 14)">
                    <rect x="0" y="6" width="68" height="68" rx="10" fill="url(#calBaseGrad)" filter="url(#leaveCalShadow)" />
                    <rect x="0" y="0" width="68" height="20" rx="8" fill="#2563EB" />
                    {/* Spiral ring binders */}
                    <circle cx="14" cy="3" r="3" fill="#E2E8F0" stroke="#1D4ED8" strokeWidth="1" />
                    <circle cx="34" cy="3" r="3" fill="#E2E8F0" stroke="#1D4ED8" strokeWidth="1" />
                    <circle cx="54" cy="3" r="3" fill="#E2E8F0" stroke="#1D4ED8" strokeWidth="1" />

                    {/* Grid checkboxes / lines */}
                    <rect x="10" y="28" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="23" y="28" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="36" y="28" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="49" y="28" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />

                    <rect x="10" y="39" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="23" y="39" width="9" height="7" rx="2" fill="#2563EB" />
                    <rect x="36" y="39" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="49" y="39" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />

                    <rect x="10" y="50" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="23" y="50" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                    <rect x="36" y="50" width="9" height="7" rx="2" fill="#2563EB" />
                    <rect x="49" y="50" width="9" height="7" rx="2" fill="#93C5FD" opacity="0.6" />
                  </g>

                  {/* Overlapping Round Clock on Bottom-Right of Calendar */}
                  <g transform="translate(108, 48)">
                    <circle cx="20" cy="20" r="18" fill="url(#clockMiniGrad)" filter="url(#leaveClockShadow)" />
                    <circle cx="20" cy="20" r="15" fill="#FFFFFF" />
                    <circle cx="20" cy="20" r="2" fill="#2563EB" />
                    <line x1="20" y1="20" x2="20" y2="10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="20" x2="28" y2="16" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  <defs>
                    <linearGradient id="calBaseGrad" x1="0" y1="0" x2="68" y2="74" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#F8FAFC" />
                    </linearGradient>
                    <linearGradient id="clockMiniGrad" x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38BDF8" />
                      <stop offset="1" stopColor="#2563EB" />
                    </linearGradient>
                    <filter id="leaveCalShadow" x="-6" y="0" width="80" height="84" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.14" />
                    </filter>
                    <filter id="leaveClockShadow" x="0" y="0" width="42" height="42" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1E40AF" floodOpacity="0.25" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        }
      />

      {/* =========================================================================
          TOP 4 KPI METRIC CARDS (COMPACT HEIGHT, BALANCED PADDING, SHARP ALIGNMENT)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Leave Balance */}
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-xs flex-shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Leave Balance
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  18 Days
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">Available leaves</span>
            </div>
          </div>
          <div className="self-end pb-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" /> 12%
            </span>
          </div>
        </div>

        {/* 2. Leaves Taken */}
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400 shadow-xs flex-shrink-0">
              <CalendarX className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Leaves Taken
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  6 Days
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">This Year</span>
            </div>
          </div>
          <div className="self-end pb-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ArrowDownRight className="h-3 w-3 stroke-[2.5]" /> 8%
            </span>
          </div>
        </div>

        {/* 3. Pending Requests */}
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shadow-xs flex-shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Pending Requests
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  2
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">Awaiting Approval</span>
            </div>
          </div>
          <div className="self-end pb-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-1.5 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" /> 0%
            </span>
          </div>
        </div>

        {/* 4. Total Entitlement */}
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-xs flex-shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Entitlement
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  24 Days
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">Per Year</span>
            </div>
          </div>
          <div className="self-end pb-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" /> 0%
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTION / TABS ROW: MY LEAVES, TEAM LEAVES, LEAVE CALENDAR & + APPLY LEAVE
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left 3 Pill Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs',
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            )}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs',
              activeTab === 'team'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            )}
          >
            Team Leaves
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer text-xs',
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            )}
          >
            Leave Calendar
          </button>
        </div>

        {/* Right CTA Button: + Apply Leave */}
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition-all duration-150 hover:shadow-md cursor-pointer active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN SECTION:
          LEFT: LEAVE HISTORY TABLE WITH 3 FILTERS
          RIGHT: LEAVE CALENDAR & LEAVE CATEGORY PROGRESS BARS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* =======================================================================
            LEFT COLUMN: LEAVE HISTORY TABLE (7-8 COLS)
           ======================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-dark-border dark:bg-dark-card space-y-3.5">

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pb-2">
            {/* Filter 1: Leave Types */}
            <div className="relative">
              <button
                onClick={() => {
                  setTypeDropdownOpen(!typeDropdownOpen);
                  setStatusDropdownOpen(false);
                  setDateRangeDropdownOpen(false);
                }}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <span>{typeFilter === 'All' ? 'All Leave Types' : typeFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {typeDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-toast-slide dark:border-dark-border dark:bg-dark-card z-30">
                  {['All', 'Casual Leave', 'Sick Leave', 'Earned Leave'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setTypeDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        typeFilter === t
                          ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      {t === 'All' ? 'All Leave Types' : t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 2: Status */}
            <div className="relative">
              <button
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setTypeDropdownOpen(false);
                  setDateRangeDropdownOpen(false);
                }}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <span>{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {statusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-toast-slide dark:border-dark-border dark:bg-dark-card z-30">
                  {['All', 'Approved', 'Rejected', 'Pending'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setStatusDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        statusFilter === s
                          ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      {s === 'All' ? 'All Status' : s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 3: Date Range Picker */}
            <div className="relative sm:ml-auto">
              <button
                onClick={() => {
                  setDateRangeDropdownOpen(!dateRangeDropdownOpen);
                  setTypeDropdownOpen(false);
                  setStatusDropdownOpen(false);
                }}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{selectedDateRange}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dateRangeDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-toast-slide dark:border-dark-border dark:bg-dark-card z-30">
                  {['Apr 2025 - Apr 2026', 'Jan 2025 - Dec 2025', 'Past 6 Months', 'Past 30 Days'].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDateRange(d);
                        setDateRangeDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        selectedDateRange === d
                          ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clean Data Table matching reference image */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-dark-border">
                <tr>
                  <th className="py-3 px-3 w-10">#</th>
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-dark-border/60">
                {filteredRecords.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-medium text-slate-400">{row.id}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {row.leaveType}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                      {row.startDate}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                      {row.endDate}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-200">
                      {row.duration}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold',
                          row.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : row.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedLeaveItem(row);
                          setIsDetailsModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Entries Count & Clean Pagination */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-border text-xs text-slate-400">
            <span>
              Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
            </span>

            <div className="flex items-center gap-1">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-border dark:bg-slate-800 transition-colors"
                disabled
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                1
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 dark:border-dark-border dark:bg-slate-800 transition-colors"
                disabled
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* =======================================================================
            RIGHT COLUMN: LEAVE CALENDAR & LEAVE BALANCE PROGRESS CARDS (4-5 COLS)
           ======================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">

          {/* Card 1: Leave Calendar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave Calendar
                </h3>
              </div>
              <button
                onClick={() => setIsFullCalendarModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Full Calendar</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Month Navigator: < April 2025 > */}
            <div className="flex items-center justify-between px-2 pt-1">
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {calendarMonth}
              </span>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Mini Calendar Weekday Header */}
            <div className="grid grid-cols-7 text-center text-[10.5px] font-semibold text-slate-400 py-1">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Mini Calendar Day Matrix with highlights */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {aprilCalendarDays.map((item, idx) => {
                const isOtherMonth = item.month !== 'current';
                return (
                  <div
                    key={idx}
                    className="h-8 flex items-center justify-center relative"
                  >
                    {item.isSelected ? (
                      <span className="h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {item.day}
                      </span>
                    ) : item.status === 'Approved' ? (
                      <span className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        {item.day}
                      </span>
                    ) : item.status === 'Pending' ? (
                      <span className="h-7 w-7 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                        {item.day}
                      </span>
                    ) : item.status === 'Rejected' ? (
                      <span className="h-7 w-7 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-xs flex items-center justify-center">
                        {item.day}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isOtherMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'
                        )}
                      >
                        {item.day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-dark-border">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Rejected
              </span>
            </div>
          </div>

          {/* Card 2: Leave Balance Progress Bars */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover-card-lift transition-all duration-200 dark:border-dark-border dark:bg-dark-card space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave Balance
                </h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* 4 Leave Types Progress Bars */}
            <div className="space-y-3.5 pt-1">
              {/* 1. Casual Leave (8 / 12 days) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Palmtree className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Casual Leave
                    </span>
                  </div>
                  <span className="text-slate-400 font-semibold text-[11px]">
                    <strong className="text-slate-800 dark:text-white">8</strong> / 12 days
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: '66.6%' }}
                  />
                </div>
              </div>

              {/* 2. Sick Leave (5 / 8 days) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                      <PlusCircle className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Sick Leave
                    </span>
                  </div>
                  <span className="text-slate-400 font-semibold text-[11px]">
                    <strong className="text-slate-800 dark:text-white">5</strong> / 8 days
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: '62.5%' }}
                  />
                </div>
              </div>

              {/* 3. Earned Leave (3 / 6 days) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Earned Leave
                    </span>
                  </div>
                  <span className="text-slate-400 font-semibold text-[11px]">
                    <strong className="text-slate-800 dark:text-white">3</strong> / 6 days
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500"
                    style={{ width: '50%' }}
                  />
                </div>
              </div>

              {/* 4. Maternity Leave (0 / 12 days) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Maternity Leave
                    </span>
                  </div>
                  <span className="text-slate-400 font-semibold text-[11px]">
                    <strong className="text-slate-800 dark:text-white">0</strong> / 12 days
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-300 dark:bg-slate-700 transition-all duration-500"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          INTERACTIVE MODALS: APPLY LEAVE, DETAILS, FULL CALENDAR
         ========================================================================= */}
      {/* 1. Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Submit a new time-off request for manager approval."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplyLeaveSubmit}>
              Submit Leave Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleApplyLeaveSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category
            </label>
            <select
              value={newLeaveType}
              onChange={(e) => setNewLeaveType(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 dark:border-dark-border dark:bg-dark-card dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="Casual Leave">Casual Leave (8 days available)</option>
              <option value="Sick Leave">Sick Leave (5 days available)</option>
              <option value="Earned Leave">Earned Leave (3 days available)</option>
              <option value="Maternity Leave">Maternity Leave (12 days available)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 dark:border-dark-border dark:bg-dark-card dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 dark:border-dark-border dark:bg-dark-card dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State reason for absence..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 dark:border-dark-border dark:bg-dark-card dark:text-white focus:outline-none focus:border-blue-600 resize-none"
              required
            />
          </div>
        </form>
      </Modal>

      {/* 2. Leave Request Details Modal */}
      {selectedLeaveItem && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Leave Request #${selectedLeaveItem.id}`}
          description="Detailed breakdown and approval status."
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-dark-border">
              <span className="text-slate-400">Leave Type</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedLeaveItem.leaveType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-dark-border">
              <span className="text-slate-400">Duration</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedLeaveItem.duration}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-dark-border">
              <span className="text-slate-400">Dates</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLeaveItem.startDate} - {selectedLeaveItem.endDate}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-dark-border">
              <span className="text-slate-400">Status</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full font-bold text-[10px]',
                selectedLeaveItem.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              )}>
                {selectedLeaveItem.status}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-400 block mb-1">Reason:</span>
              <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedLeaveItem.reason}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Full Leave Calendar Modal */}
      <Modal
        isOpen={isFullCalendarModalOpen}
        onClose={() => setIsFullCalendarModalOpen(false)}
        title="Full Year Leave Schedule & Holidays"
        description="Comprehensive calendar view with team member absences and official holidays."
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Approved</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">16 Days</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block uppercase">Pending Approval</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">2 Days</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">Declined</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">3 Days</span>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
            {leaveRecords.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.leaveType} ({item.duration})</p>
                  <p className="text-[11px] text-slate-400">{item.startDate} to {item.endDate}</p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                  item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
