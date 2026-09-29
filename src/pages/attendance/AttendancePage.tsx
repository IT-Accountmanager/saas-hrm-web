import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  CalendarCheck,
  CalendarX,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Gift,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Users,
  Video,
  Layers,
  Cake,
  Phone,
  Umbrella,
  UserCheck,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../../utils';
import { Modal, Badge, Button, Input, Select } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { leaveService } from '../../services/leaveService';
import { Holiday } from '../../types';
import { downloadSampleHolidayExcelTemplate, parseHolidayFile, ParsedHolidayRow } from '../../utils/excelParser';

interface DayAttendance {
  day: number;
  month: 'prev' | 'current' | 'next';
  status?: 'present' | 'absent' | 'leave';
  checkIn?: string;
  checkOut?: string;
  hours?: string;
}

interface CalendarEvent {
  id: string;
  day: number;
  dateStr: string;
  title: string;
  time: string;
  type: 'meeting' | 'discussion' | 'holiday' | 'review' | 'call' | 'birthday' | 'leave';
  color: string;
  textColor: string;
}

export const AttendancePage: React.FC = () => {
  const { currentRole, isClockedIn } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  // Active Main Tab inside Workspace: 'attendance' | 'events' | 'holidays'
  const [activeTab, setActiveTab] = useState<'attendance' | 'events' | 'holidays'>('attendance');
  const [isDayInspectorOpen, setIsDayInspectorOpen] = useState(false);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(8); // 8 = September 2026 (Current Live Month)
  const [selectedDay, setSelectedDay] = useState<number>(29);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Holidays state from storage/service
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [selectedHolidayYear, setSelectedHolidayYear] = useState('2026');

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting' as CalendarEvent['type'],
    day: 29,
    time: '10:00 AM'
  });

  // New Holiday Form State
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('2026-09-29');
  const [newHolidayType, setNewHolidayType] = useState<'Public' | 'Company' | 'Optional'>('Public');
  const [newHolidayScope, setNewHolidayScope] = useState('Global / All Offices');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');

  // Excel Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedHolidayRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStats, setImportStats] = useState<{ valid: number; invalid: number }>({ valid: 0, invalid: 0 });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadHolidays = async () => {
    try {
      const data = await leaveService.getHolidays();
      setHolidays(data);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const months = [
    'January 2026',
    'February 2026',
    'March 2026',
    'April 2026',
    'May 2026',
    'June 2026',
    'July 2026',
    'August 2026',
    'September 2026',
    'October 2026',
    'November 2026',
    'December 2026',
  ];

  // Scheduled Events List directly embedded into Attendance Calendar
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', day: 1, dateStr: 'Sep 01, 2026', title: 'Team Sprint Sync', time: '10:00 AM', type: 'meeting', color: 'bg-blue-50 text-blue-700 border-blue-200', textColor: 'text-blue-700' },
    { id: '2', day: 3, dateStr: 'Sep 03, 2026', title: 'Q3 Roadmap Review', time: '02:00 PM', type: 'review', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', textColor: 'text-emerald-700' },
    { id: '3', day: 5, dateStr: 'Sep 05, 2026', title: 'Teachers Day Observance', time: 'Company Event', type: 'holiday', color: 'bg-purple-50 text-purple-700 border-purple-200', textColor: 'text-purple-700' },
    { id: '4', day: 8, dateStr: 'Sep 08, 2026', title: 'Client Product Demo', time: '11:30 AM', type: 'call', color: 'bg-sky-50 text-sky-700 border-sky-200', textColor: 'text-sky-700' },
    { id: '5', day: 11, dateStr: 'Sep 11, 2026', title: 'Rohit Sharma Birthday', time: 'All Day', type: 'birthday', color: 'bg-amber-50 text-amber-700 border-amber-200', textColor: 'text-amber-700' },
    { id: '6', day: 14, dateStr: 'Sep 14, 2026', title: 'Hindi Diwas Holiday', time: 'Public Holiday', type: 'holiday', color: 'bg-purple-50 text-purple-700 border-purple-200', textColor: 'text-purple-700' },
    { id: '7', day: 18, dateStr: 'Sep 18, 2026', title: 'Casual Leave - Rahul', time: 'Full Day', type: 'leave', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', textColor: 'text-indigo-700' },
    { id: '8', day: 29, dateStr: 'Sep 29, 2026', title: 'Q3 Performance Review & All-Hands', time: '04:00 PM', type: 'review', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', textColor: 'text-emerald-700' },
  ]);

  // Attendance days matching September 2026
  const currentMonthDays: DayAttendance[] = [
    { day: 30, month: 'prev' },
    { day: 31, month: 'prev' },
    { day: 1, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:10 PM', hours: '9h 05m' },
    { day: 2, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:05 PM', hours: '8h 53m' },
    { day: 3, month: 'current', status: 'present', checkIn: '08:58 AM', checkOut: '06:00 PM', hours: '9h 02m' },
    { day: 4, month: 'current', status: 'absent' },
    { day: 5, month: 'current', status: 'present', checkIn: '09:15 AM', checkOut: '01:30 PM', hours: '4h 15m' },
    { day: 6, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 7, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:15 PM', hours: '9h 05m' },
    { day: 8, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:08 PM', hours: '8h 56m' },
    { day: 9, month: 'current', status: 'present', checkIn: '09:04 AM', checkOut: '06:11 PM', hours: '9h 07m' },
    { day: 10, month: 'current', status: 'present', checkIn: '09:18 AM', checkOut: '06:20 PM', hours: '9h 02m' },
    { day: 11, month: 'current', status: 'leave' },
    { day: 12, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 13, month: 'current', status: 'present', checkIn: '09:14 AM', checkOut: '06:12 PM', hours: '8h 58m' },
    { day: 14, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:08 PM', hours: '9h 03m' },
    { day: 15, month: 'current', status: 'present', checkIn: '09:11 AM', checkOut: '06:19 PM', hours: '9h 08m' },
    { day: 16, month: 'current', status: 'absent' },
    { day: 17, month: 'current', status: 'present', checkIn: '09:02 AM', checkOut: '06:00 PM', hours: '8h 58m' },
    { day: 18, month: 'current', status: 'present', checkIn: '09:20 AM', checkOut: '06:25 PM', hours: '9h 05m' },
    { day: 19, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:05 PM', hours: '9h 00m' },
    { day: 20, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:14 PM', hours: '9h 04m' },
    { day: 21, month: 'current', status: 'present', checkIn: '09:08 AM', checkOut: '06:10 PM', hours: '9h 02m' },
    { day: 22, month: 'current', status: 'present', checkIn: '09:15 AM', checkOut: '06:18 PM', hours: '9h 03m' },
    { day: 23, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:02 PM', hours: '9h 02m' },
    { day: 24, month: 'current', status: 'present', checkIn: '09:07 AM', checkOut: '06:10 PM', hours: '9h 03m' },
    { day: 25, month: 'current', status: 'absent' },
    { day: 26, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:15 PM', hours: '9h 03m' },
    { day: 27, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 28, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:10 PM', hours: '9h 05m' },
    { day: 29, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:12 PM', hours: '9h 02m' },
    { day: 30, month: 'current', status: 'present', checkIn: '09:08 AM', checkOut: '06:15 PM', hours: '9h 07m' },
    { day: 1, month: 'next' },
    { day: 2, month: 'next' },
    { day: 3, month: 'next' },
  ];

  const currentSelectedDayData = currentMonthDays.find(
    (d) => d.day === selectedDay && d.month === 'current'
  );

  const currentSelectedDayEvents = events.filter((e) => e.day === selectedDay);

  // Form Handlers
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;

    const created: CalendarEvent = {
      id: Date.now().toString(),
      day: Number(newEvent.day),
      dateStr: `Sep ${String(newEvent.day).padStart(2, '0')}, 2026`,
      title: newEvent.title,
      time: newEvent.time,
      type: newEvent.type,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      textColor: 'text-blue-700'
    };

    setEvents([...events, created]);
    setIsAddEventModalOpen(false);
    showToast(`Event "${newEvent.title}" added to calendar!`);
    setNewEvent({ title: '', type: 'meeting', day: 15, time: '10:00 AM' });
  };

  const handleAddHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayTitle || !newHolidayDate) return;

    try {
      await leaveService.addHoliday({
        name: newHolidayTitle,
        date: newHolidayDate,
        type: newHolidayType,
        location: newHolidayScope,
        description: newHolidayDesc,
      });

      setIsAddHolidayModalOpen(false);
      setNewHolidayTitle('');
      setNewHolidayDesc('');
      showToast(`Holiday "${newHolidayTitle}" created successfully!`);
      await loadHolidays();
    } catch (err) {
      console.error('Failed to create holiday:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    try {
      const result = await parseHolidayFile(file);
      setParsedRows(result.rows);
      setImportStats({ valid: result.totalValid, invalid: result.totalInvalid });
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkImportConfirm = async () => {
    const validItems = parsedRows.filter(r => r.isValid);
    if (validItems.length === 0) return;

    try {
      await leaveService.bulkAddHolidays(validItems.map(item => ({
        name: item.name,
        date: item.date,
        type: item.type,
        location: item.location,
        description: item.description,
      })));

      setIsImportExcelModalOpen(false);
      setImportFile(null);
      setParsedRows([]);
      showToast(`Successfully imported ${validItems.length} holidays from Excel!`);
      await loadHolidays();
    } catch (err) {
      console.error('Bulk import error:', err);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete holiday "${name}"?`)) {
      try {
        await leaveService.deleteHoliday(id);
        showToast(`Holiday "${name}" deleted.`);
        await loadHolidays();
      } catch (err) {
        console.error('Failed to delete holiday:', err);
      }
    }
  };

  return (
    <div className="space-y-4 animate-page-enter pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Card with Integrated Tab Controls */}
      <PageHeaderCard
        title="Unified Attendance & Calendar Hub"
        subtitle="Manage daily check-ins, scheduled events, working hours, and HR holiday schedules all in 1 place."
        icon={CalendarCheck}
        badge={<Badge variant="primary">All-in-1 Workspace</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdminOrOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImportExcelModalOpen(true)}
                className="font-bold shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Import Excel</span>
              </Button>
            )}

            {isAdminOrOwner && (
              <Button size="sm" onClick={() => setIsAddHolidayModalOpen(true)} className="font-bold shadow-xs">
                <Plus className="h-4 w-4 mr-1" />
                Add Holiday
              </Button>
            )}

            <Button size="sm" onClick={() => setIsAddEventModalOpen(true)} className="font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </div>
        }
      />

      {/* Unified Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between bg-white dark:bg-[#0F172A] p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Attendance Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Events & Schedules ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'holidays'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Holiday Management ({holidays.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Attendance Report</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ATTENDANCE CALENDAR (FULL-WIDTH GRID + MODAL DAY INSPECTOR)
         ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Present Days */}
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs flex-shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Present Days</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">18</span>
                  <span className="text-[10px] text-slate-400 block">This Month (90%)</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">↑ 12%</span>
            </div>

            {/* 2. Absent Days */}
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shadow-2xs flex-shrink-0">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Absent Days</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">2</span>
                  <span className="text-[10px] text-slate-400 block">This Month</span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">↓ 50%</span>
            </div>

            {/* 3. Leave Days */}
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shadow-2xs flex-shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Leave Days</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">1</span>
                  <span className="text-[10px] text-slate-400 block">This Month</span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">0%</span>
            </div>

            {/* 4. Total Working Hours */}
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-2xs flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Working Hours</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">144.5 hrs</span>
                  <span className="text-[10px] text-slate-400 block">This Month</span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">↑ 8%</span>
            </div>
          </div>

          {/* Full-Width Attendance Calendar Grid */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Full-Width Attendance Calendar Grid
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any date cell to open details for check-in/out timestamps and events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{months[currentMonthIndex]}</span>
                <button onClick={() => setCurrentMonthIndex((prev) => Math.min(months.length - 1, prev + 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Grid Cells - 100% Full Width */}
            <div className="grid grid-cols-7 gap-2">
              {currentMonthDays.map((item, idx) => {
                const isSelected = item.day === selectedDay && item.month === 'current';
                const dayEvts = item.month === 'current' ? events.filter(e => e.day === item.day) : [];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.month === 'current') {
                        setSelectedDay(item.day);
                        setIsDayInspectorOpen(true);
                      }
                    }}
                    className={cn(
                      'min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer space-y-1 hover:shadow-md',
                      item.month !== 'current' && 'opacity-30 bg-slate-50 dark:bg-slate-900 border-transparent cursor-not-allowed',
                      item.month === 'current' && !isSelected && 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500',
                      isSelected && 'bg-blue-50/70 border-blue-600 dark:bg-blue-950/50 shadow-xs ring-2 ring-blue-500/30'
                    )}
                  >
                    {/* Top Row: Day Number + Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-xs font-black',
                        isSelected ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]' : 'text-slate-800 dark:text-slate-200'
                      )}>
                        {item.day}
                      </span>

                      {/* Status Badge Text */}
                      {item.month === 'current' && item.status && (
                        <span className={cn(
                          'text-[9.5px] font-bold px-1.5 py-0.5 rounded-md capitalize',
                          item.status === 'present' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
                          item.status === 'absent' && 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
                          item.status === 'leave' && 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                        )}>
                          {item.status}
                        </span>
                      )}
                    </div>

                    {/* Middle: Clock In & Clock Out Times */}
                    {item.month === 'current' && item.checkIn && item.status === 'present' && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[9.5px] font-semibold text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[8.5px]">In:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{item.checkIn}</span>
                        </div>
                        {item.checkOut && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[8.5px]">Out:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{item.checkOut}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom: Events & Holiday Badges */}
                    {item.month === 'current' && (
                      <div className="space-y-1">
                        {dayEvts.map(evt => (
                          <div
                            key={evt.id}
                            className={cn(
                              'text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1',
                              evt.type === 'holiday' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            )}
                          >
                            {evt.type === 'holiday' && <Gift className="w-2.5 h-2.5 flex-shrink-0 text-purple-600" />}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: EVENTS & SCHEDULES WORKSPACE
         ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                Scheduled Events & Company Agenda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View all company meetings, roadmap reviews, team birthdays, and official holidays.
              </p>
            </div>

            <Button onClick={() => setIsAddEventModalOpen(true)} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule New Event
            </Button>
          </div>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((evt) => (
              <div key={evt.id} className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-indigo-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 font-mono">{evt.dateStr}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', evt.color)}>
                    {evt.type}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{evt.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{evt.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HOLIDAY MANAGEMENT (HR / ADMIN CONTROL PANEL)
         ========================================================================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#0F172A] p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none"
                />
              </div>

              <select
                value={selectedHolidayYear}
                onChange={(e) => setSelectedHolidayYear(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold cursor-pointer"
              >
                <option value="2026">Calendar 2026 (Active)</option>
                <option value="2025">Calendar 2025</option>
                <option value="2024">Calendar 2024</option>
                <option value="All">All Years</option>
              </select>
            </div>

            {isAdminOrOwner && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsImportExcelModalOpen(true)} className="font-bold">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Import from Excel
                </Button>
                <Button size="sm" onClick={() => setIsAddHolidayModalOpen(true)} className="font-bold">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Holiday
                </Button>
              </div>
            )}
          </div>

          {/* Holidays List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays
              .filter((h) => {
                if (selectedHolidayYear !== 'All' && !h.date.startsWith(selectedHolidayYear)) return false;
                if (holidaySearchQuery && !h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase())) return false;
                return true;
              })
              .map((h) => (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                        h.type === 'Public' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      )}>
                        {h.type} Holiday
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mt-2">{h.name}</h4>
                      {h.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.description}</p>}
                    </div>

                    {isAdminOrOwner && (
                      <button
                        onClick={() => handleDeleteHoliday(h.id, h.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                      {h.date} ({h.day})
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {h.location || 'Global'}
                    </span>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* =========================================================================
          MODALS: DAY INSPECTOR, ADD EVENT, ADD HOLIDAY, EXCEL IMPORT, REPORT
         ========================================================================= */}

      {/* 0. Day Inspector Modal (Opened when clicking a date cell) */}
      {isDayInspectorOpen && (
        <Modal
          isOpen={isDayInspectorOpen}
          onClose={() => setIsDayInspectorOpen(false)}
          title={`Day Details: ${months[currentMonthIndex].split(' ')[0]} ${selectedDay}, 2026`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Attendance Status</span>
                <Badge variant={currentSelectedDayData?.status === 'present' ? 'success' : 'warning'}>
                  {currentSelectedDayData?.status ? currentSelectedDayData.status.toUpperCase() : 'NO RECORD'}
                </Badge>
              </div>
              {currentSelectedDayData?.hours && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Total Hours</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{currentSelectedDayData.hours}</span>
                </div>
              )}
            </div>

            {/* Check-In & Check-Out Timestamps */}
            {currentSelectedDayData?.checkIn ? (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Check In Time</span>
                  <span className="font-black text-base text-slate-900 dark:text-white font-mono">{currentSelectedDayData.checkIn}</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block mb-1">Check Out Time</span>
                  <span className="font-black text-base text-slate-900 dark:text-white font-mono">{currentSelectedDayData.checkOut || '--:--'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                No clock-in timestamp recorded for this date.
              </div>
            )}

            {/* Day Scheduled Events */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Scheduled Events ({currentSelectedDayEvents.length})
              </span>
              {currentSelectedDayEvents.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentSelectedDayEvents.map(e => (
                    <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{e.title}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{e.type}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{e.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic block">No events scheduled for this day.</span>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setIsDayInspectorOpen(false)}>Close Details</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 1. Add Event Modal */}
      {isAddEventModalOpen && (
        <Modal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} title="Add New Event">
          <form onSubmit={handleAddEvent} className="space-y-4">
            <Input label="Event Title" placeholder="e.g. Client Sync Meeting" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
            <Input label="Day of Month (April)" type="number" min={1} max={30} value={newEvent.day} onChange={e => setNewEvent({ ...newEvent, day: Number(e.target.value) })} required />
            <Input label="Event Time" placeholder="10:00 AM" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required />
            <Select label="Type" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })} options={[
              { value: 'meeting', label: 'Meeting' },
              { value: 'review', label: 'Review' },
              { value: 'birthday', label: 'Birthday' },
              { value: 'holiday', label: 'Holiday' },
            ]} />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsAddEventModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Event</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Add Holiday Modal */}
      {isAddHolidayModalOpen && (
        <Modal isOpen={isAddHolidayModalOpen} onClose={() => setIsAddHolidayModalOpen(false)} title="Add Company Holiday">
          <form onSubmit={handleAddHolidaySubmit} className="space-y-4">
            <Input label="Holiday Title" placeholder="e.g. Independence Day" value={newHolidayTitle} onChange={e => setNewHolidayTitle(e.target.value)} required />
            <Input label="Date" type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required />
            <Select label="Type" value={newHolidayType} onChange={e => setNewHolidayType(e.target.value as any)} options={[
              { value: 'Public', label: 'Public Holiday (Mandatory Paid)' },
              { value: 'Company', label: 'Company Observance' },
              { value: 'Optional', label: 'Floating / Optional' },
            ]} />
            <Input label="Office Scope" value={newHolidayScope} onChange={e => setNewHolidayScope(e.target.value)} placeholder="Global / All Offices" />
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea rows={2} value={newHolidayDesc} onChange={e => setNewHolidayDesc(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none" placeholder="Holiday policy notes" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsAddHolidayModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Holiday</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Excel Import Modal */}
      {isImportExcelModalOpen && (
        <Modal isOpen={isImportExcelModalOpen} onClose={() => setIsImportExcelModalOpen(false)} title="Import Holidays from Excel">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs space-y-1">
              <span className="font-bold block text-slate-900">Bulk Excel Holiday Importer</span>
              <p className="text-slate-600">Upload your holiday file (.xlsx, .csv). You can download our sample Excel template below.</p>
              <button type="button" onClick={downloadSampleHolidayExcelTemplate} className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Download Sample Excel Template (.csv)
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center relative bg-slate-50/50">
              <input type="file" accept=".csv,.xlsx,.xls,.tsv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <span className="text-xs font-bold block">{importFile ? importFile.name : 'Click or drop Excel / CSV file here'}</span>
            </div>

            {parsedRows.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-xl text-xs">
                <span className="font-bold block">Preview ({importStats.valid} Valid)</span>
                {parsedRows.map((r, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{r.name} ({r.date})</span>
                    <span className={r.isValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{r.isValid ? 'Valid' : r.errorReason}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsImportExcelModalOpen(false)}>Cancel</Button>
              <Button disabled={importStats.valid === 0} onClick={handleBulkImportConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Import {importStats.valid} Holidays</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Report Modal */}
      {isReportModalOpen && (
        <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Monthly Attendance Log Report">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">Exporting monthly summary report for April 2025.</p>
            <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px]">
              <div>Total Employees: 124</div>
              <div>Present Average: 94.2%</div>
              <div>Total Working Days: 21</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Close</Button>
              <Button onClick={() => { showToast('Report downloaded as PDF.'); setIsReportModalOpen(false); }}>Download PDF</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AttendancePage;
