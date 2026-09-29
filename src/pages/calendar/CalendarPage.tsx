import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Gift,
  Clock,
  Cake,
  Video,
  Phone,
  Target,
  Umbrella,
  Coffee,
  X,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Sparkles,
  MapPin,
  AlertCircle,
  CalendarCheck,
  CalendarX,
  FileText,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { Modal, Input, Select, Button, Badge } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { leaveService } from '../../services/leaveService';
import { useAppStore } from '../../store/useAppStore';
import { Holiday } from '../../types';
import { downloadSampleHolidayExcelTemplate, parseHolidayFile, ParsedHolidayRow } from '../../utils/excelParser';

interface CalendarEvent {
  id: string;
  day: number;
  dateStr: string;
  title: string;
  time: string;
  type: 'meeting' | 'discussion' | 'holiday' | 'review' | 'call' | 'birthday' | 'leave' | 'training' | 'lunch';
  color: string;
  textColor: string;
  borderColor: string;
  icon: React.ElementType;
}

interface AttendanceDayRecord {
  day: number;
  month: 'prev' | 'current' | 'next';
  status?: 'present' | 'absent' | 'leave' | 'wfh';
  checkIn?: string;
  checkOut?: string;
  hours?: string;
}

export const CalendarPage: React.FC = () => {
  const { currentRole, isClockedIn, setClockInState, toggleBreak, isOnBreak } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  // Active View Tab: 'calendar' | 'attendance' | 'holidays'
  const [activeTab, setActiveTab] = useState<'calendar' | 'attendance' | 'holidays'>('calendar');

  // Calendar State
  const [currentMonthName, setCurrentMonthName] = useState('April 2025');
  const [activeCalendarView, setActiveCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDayNum, setSelectedDayNum] = useState<number>(8);
  const [isDayInspectorOpen, setIsDayInspectorOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  // Holidays State from Storage/Service
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedHolidayYear, setSelectedHolidayYear] = useState('2025');
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  // Form State for New Event
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting' as CalendarEvent['type'],
    day: 15,
    time: '10:00 AM',
    notes: ''
  });

  // Form State for New Holiday
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('2025-01-01');
  const [newHolidayType, setNewHolidayType] = useState<'Public' | 'Company' | 'Optional'>('Public');
  const [newHolidayScope, setNewHolidayScope] = useState('Global / All Offices');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedHolidayRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStats, setImportStats] = useState<{ valid: number; invalid: number }>({ valid: 0, invalid: 0 });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Holidays dynamically
  const fetchHolidays = async () => {
    try {
      const data = await leaveService.getHolidays();
      setHolidays(data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Events list matching reference design
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      day: 1,
      dateStr: 'Apr 01, 2025',
      title: 'Team Sync Meeting',
      time: '10:00 AM',
      type: 'meeting',
      color: 'bg-blue-50 dark:bg-blue-950/60',
      textColor: 'text-blue-600 dark:text-blue-300',
      borderColor: 'border-blue-100 dark:border-blue-900/60',
      icon: Video
    },
    {
      id: '2',
      day: 3,
      dateStr: 'Apr 03, 2025',
      title: 'Project Architecture Review',
      time: '11:00 AM',
      type: 'discussion',
      color: 'bg-emerald-50 dark:bg-emerald-950/60',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-100 dark:border-emerald-900/60',
      icon: Users
    },
    {
      id: '3',
      day: 5,
      dateStr: 'Apr 05, 2025',
      title: 'Good Friday Holiday',
      time: 'Public Paid Holiday',
      type: 'holiday',
      color: 'bg-purple-50 dark:bg-purple-950/60',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-100 dark:border-purple-900/60',
      icon: Gift
    },
    {
      id: '4',
      day: 7,
      dateStr: 'Apr 07, 2025',
      title: 'Q2 Performance Review',
      time: '02:00 PM',
      type: 'review',
      color: 'bg-rose-50 dark:bg-rose-950/60',
      textColor: 'text-rose-600 dark:text-rose-300',
      borderColor: 'border-rose-100 dark:border-rose-900/60',
      icon: Target
    },
    {
      id: '5',
      day: 9,
      dateStr: 'Apr 09, 2025',
      title: 'Enterprise Client Call',
      time: '11:30 AM',
      type: 'call',
      color: 'bg-sky-50 dark:bg-sky-950/60',
      textColor: 'text-sky-600 dark:text-sky-300',
      borderColor: 'border-sky-100 dark:border-sky-900/60',
      icon: Phone
    },
    {
      id: '6',
      day: 11,
      dateStr: 'Apr 11, 2025',
      title: 'Rohit Sharma Birthday',
      time: 'All Day Event',
      type: 'birthday',
      color: 'bg-amber-50 dark:bg-amber-950/60',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-100 dark:border-amber-900/60',
      icon: Cake
    },
    {
      id: '7',
      day: 14,
      dateStr: 'Apr 14, 2025',
      title: 'Dr. Ambedkar Jayanti',
      time: 'Public Holiday',
      type: 'holiday',
      color: 'bg-purple-50 dark:bg-purple-950/60',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-100 dark:border-purple-900/60',
      icon: Gift
    },
    {
      id: '8',
      day: 18,
      dateStr: 'Apr 18, 2025',
      title: 'Casual Leave - Rahul',
      time: 'Full Day',
      type: 'leave',
      color: 'bg-indigo-50 dark:bg-indigo-950/60',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      borderColor: 'border-indigo-100 dark:border-indigo-900/60',
      icon: Umbrella
    },
    {
      id: '9',
      day: 21,
      dateStr: 'Apr 21, 2025',
      title: 'Security Compliance Training',
      time: '10:00 AM',
      type: 'training',
      color: 'bg-blue-50 dark:bg-blue-950/60',
      textColor: 'text-blue-600 dark:text-blue-300',
      borderColor: 'border-blue-100 dark:border-blue-900/60',
      icon: Clock
    },
    {
      id: '10',
      day: 30,
      dateStr: 'Apr 30, 2025',
      title: 'Monthly Team Lunch',
      time: '12:30 PM',
      type: 'lunch',
      color: 'bg-purple-50 dark:bg-purple-950/60',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-100 dark:border-purple-900/60',
      icon: Coffee
    }
  ]);

  // Attendance Records mapped for April 2025
  const aprilAttendance: AttendanceDayRecord[] = [
    { day: 30, month: 'prev' },
    { day: 31, month: 'prev' },
    { day: 1, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:10 PM', hours: '9h 05m' },
    { day: 2, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:05 PM', hours: '8h 53m' },
    { day: 3, month: 'current', status: 'present', checkIn: '08:58 AM', checkOut: '06:00 PM', hours: '9h 02m' },
    { day: 4, month: 'current', status: 'absent' },
    { day: 5, month: 'current', status: 'leave' },
    { day: 6, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 7, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:15 PM', hours: '9h 05m' },
    { day: 8, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:08 PM', hours: '8h 56m' },
    { day: 9, month: 'current', status: 'present', checkIn: '09:04 AM', checkOut: '06:11 PM', hours: '9h 07m' },
    { day: 10, month: 'current', status: 'present', checkIn: '09:18 AM', checkOut: '06:20 PM', hours: '9h 02m' },
    { day: 11, month: 'current', status: 'leave' },
    { day: 12, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 13, month: 'current', status: 'present', checkIn: '09:14 AM', checkOut: '06:12 PM', hours: '8h 58m' },
    { day: 14, month: 'current', status: 'leave' },
    { day: 15, month: 'current', status: 'present', checkIn: '09:11 AM', checkOut: '06:19 PM', hours: '9h 08m' },
    { day: 16, month: 'current', status: 'absent' },
    { day: 17, month: 'current', status: 'present', checkIn: '09:02 AM', checkOut: '06:00 PM', hours: '8h 58m' },
    { day: 18, month: 'current', status: 'leave' },
    { day: 19, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:05 PM', hours: '9h 00m' },
    { day: 20, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:14 PM', hours: '9h 04m' },
    { day: 21, month: 'current', status: 'present', checkIn: '09:08 AM', checkOut: '06:10 PM', hours: '9h 02m' },
    { day: 22, month: 'current', status: 'present', checkIn: '09:15 AM', checkOut: '06:18 PM', hours: '9h 03m' },
    { day: 23, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:02 PM', hours: '9h 02m' },
    { day: 24, month: 'current', status: 'present', checkIn: '09:07 AM', checkOut: '06:10 PM', hours: '9h 03m' },
    { day: 25, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 26, month: 'current', status: 'present', checkIn: '09:12 AM', checkOut: '06:15 PM', hours: '9h 03m' },
    { day: 27, month: 'current', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h 00m' },
    { day: 28, month: 'current', status: 'present', checkIn: '09:05 AM', checkOut: '06:10 PM', hours: '9h 05m' },
    { day: 29, month: 'current', status: 'present', checkIn: '09:10 AM', checkOut: '06:12 PM', hours: '9h 02m' },
    { day: 30, month: 'current', status: 'present', checkIn: '09:08 AM', checkOut: '06:15 PM', hours: '9h 07m' },
    { day: 1, month: 'next' },
    { day: 2, month: 'next' },
    { day: 3, month: 'next' },
  ];

  // Calendar Grid Cells Array
  const daysArray: { dayNum: number; isCurrentMonth: boolean }[] = [
    { dayNum: 30, isCurrentMonth: false },
    { dayNum: 31, isCurrentMonth: false },
    ...Array.from({ length: 30 }, (_, i) => ({ dayNum: i + 1, isCurrentMonth: true })),
    { dayNum: 1, isCurrentMonth: false },
    { dayNum: 2, isCurrentMonth: false },
    { dayNum: 3, isCurrentMonth: false }
  ];

  // Event Handlers
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;

    let color = 'bg-blue-50 dark:bg-blue-950/60';
    let textColor = 'text-blue-600 dark:text-blue-300';
    let borderColor = 'border-blue-100 dark:border-blue-900/60';
    let icon = Video;

    if (newEvent.type === 'holiday') {
      color = 'bg-purple-50 dark:bg-purple-950/60';
      textColor = 'text-purple-700 dark:text-purple-300';
      borderColor = 'border-purple-100 dark:border-purple-900/60';
      icon = Gift;
    } else if (newEvent.type === 'birthday') {
      color = 'bg-amber-50 dark:bg-amber-950/60';
      textColor = 'text-amber-700 dark:text-amber-300';
      borderColor = 'border-amber-100 dark:border-amber-900/60';
      icon = Cake;
    }

    const created: CalendarEvent = {
      id: Date.now().toString(),
      day: Number(newEvent.day),
      dateStr: `Apr ${String(newEvent.day).padStart(2, '0')}, 2025`,
      title: newEvent.title,
      time: newEvent.time,
      type: newEvent.type,
      color,
      textColor,
      borderColor,
      icon
    };

    setEvents([...events, created]);
    setIsAddEventModalOpen(false);
    showToast(`Event "${newEvent.title}" added to calendar!`);
    setNewEvent({ title: '', type: 'meeting', day: 15, time: '10:00 AM', notes: '' });
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
      showToast(`Holiday "${newHolidayTitle}" added successfully!`);
      await fetchHolidays();
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
      await fetchHolidays();
    } catch (err) {
      console.error('Bulk import error:', err);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (window.confirm(`Delete holiday "${name}"?`)) {
      try {
        await leaveService.deleteHoliday(id);
        showToast(`Holiday "${name}" deleted.`);
        await fetchHolidays();
      } catch (err) {
        console.error('Error deleting holiday:', err);
      }
    }
  };

  // Selected Day Data for Modal Inspector
  const selectedDayEvents = events.filter((e) => e.day === selectedDayNum);
  const selectedDayAttendance = aprilAttendance.find((a) => a.day === selectedDayNum && a.month === 'current');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* =========================================================================
          TOP PAGE HEADER WITH CLOUDY WAVE DESIGN & TAB SWITCHER
         ========================================================================= */}
      <PageHeaderCard
        title="Unified Calendar & Work Workspace"
        subtitle="One single place for Events, Attendance Punches, Working Hours & HR Holiday Management."
        icon={CalendarIcon}
        badge={<Badge variant="primary">Unified Hub</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'holidays' && isAdminOrOwner && (
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

            {activeTab === 'holidays' && isAdminOrOwner && (
              <Button size="sm" onClick={() => setIsAddHolidayModalOpen(true)} className="font-bold shadow-xs">
                <Plus className="h-4 w-4 mr-1" />
                Add Holiday
              </Button>
            )}

            {activeTab === 'calendar' && (
              <Button size="sm" onClick={() => setIsAddEventModalOpen(true)} className="font-bold shadow-xs">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            )}
          </div>
        }
      />

      {/* =========================================================================
          UNIFICATION ARCHITECTURE EXPLANATION BANNER
         ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-sky-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/40 border border-blue-100/90 dark:border-blue-900/50 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Unified Calendar & Attendance Architecture
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                All-in-1 Place
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Attendance records, shift schedules, company paid holidays, and team meetings are now consolidated into 1 unified master workspace.
            </p>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
          >
            🗓️ Master Calendar
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
          >
            ⏰ Attendance Tracker
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'holidays'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
          >
            🎉 Holiday Management
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: UNIFIED MASTER CALENDAR GRID
         ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">

          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Events */}
            <div className="rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    {events.length}
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Scheduled Events
                  </div>
                  <span className="text-[11px] text-slate-400">This Month</span>
                </div>
              </div>
            </div>

            {/* Card 2: Attendance Present Rate */}
            <div className="rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    18 Days
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Present (90%)
                  </div>
                  <span className="text-[11px] text-slate-400">This Month</span>
                </div>
              </div>
            </div>

            {/* Card 3: Holidays Count */}
            <div className="rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    {holidays.length || 6}
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Paid Holidays
                  </div>
                  <span className="text-[11px] text-slate-400">Calendar 2025</span>
                </div>
              </div>
            </div>

            {/* Card 4: Working Hours */}
            <div className="rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    144.5 hrs
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    Total Hours
                  </div>
                  <span className="text-[11px] text-slate-400">This Month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid Section (Left: Grid, Right: Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-xs p-6 space-y-4">

              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <button onClick={() => showToast('Previous month')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => showToast('Next month')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-base">
                    <span>{currentMonthName}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button onClick={() => setActiveCalendarView('month')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeCalendarView === 'month' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Month</button>
                  <button onClick={() => setActiveCalendarView('week')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeCalendarView === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Week</button>
                  <button onClick={() => setActiveCalendarView('day')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${activeCalendarView === 'day' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Day</button>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 py-2 border-b border-slate-100 dark:border-slate-800">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800/80">
                {daysArray.map((cell, idx) => {
                  const dayEvents = cell.isCurrentMonth ? events.filter((e) => e.day === cell.dayNum) : [];
                  const dayAttendance = cell.isCurrentMonth ? aprilAttendance.find((a) => a.day === cell.dayNum && a.month === 'current') : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (cell.isCurrentMonth) {
                          setSelectedDayNum(cell.dayNum);
                          setIsDayInspectorOpen(true);
                        }
                      }}
                      className={`min-h-[100px] p-2 border-r border-b border-slate-100 dark:border-slate-800/80 transition-colors flex flex-col justify-between cursor-pointer ${cell.isCurrentMonth
                          ? 'bg-white dark:bg-[#0F172A] hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                          : 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${cell.isCurrentMonth
                            ? cell.dayNum === selectedDayNum
                              ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold'
                              : 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-300 dark:text-slate-600'
                          }`}>
                          {cell.dayNum}
                        </span>

                        {/* Attendance Dot indicator */}
                        {dayAttendance?.status && (
                          <span className={`h-2 w-2 rounded-full ${dayAttendance.status === 'present' ? 'bg-emerald-500' :
                              dayAttendance.status === 'absent' ? 'bg-rose-500' : 'bg-purple-500'
                            }`} title={`Attendance: ${dayAttendance.status}`} />
                        )}
                      </div>

                      {/* Render Event Chips */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((evt) => {
                          const IconComp = evt.icon;
                          return (
                            <div key={evt.id} className={`p-1 rounded-lg border text-[10px] truncate ${evt.color} ${evt.textColor} ${evt.borderColor}`}>
                              <div className="flex items-center gap-1 font-bold truncate">
                                <IconComp className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{evt.title}</span>
                              </div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-slate-400 font-bold block">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-5">

              {/* Today's Punch Widget */}
              <div className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl p-5 border border-white/80 dark:border-slate-800/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Today's Attendance Punch
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {isClockedIn ? '● Active' : 'Offline'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Check In Time</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">09:12 AM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Expected Out</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">06:08 PM</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setClockInState(!isClockedIn)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${isClockedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    {isClockedIn ? 'Clock Out Now' : 'Clock In Now'}
                  </button>
                  {isClockedIn && (
                    <button
                      onClick={toggleBreak}
                      className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 cursor-pointer"
                    >
                      {isOnBreak ? 'End Break' : 'Take Break'}
                    </button>
                  )}
                </div>
              </div>

              {/* Upcoming Events List */}
              <div className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl p-5 border border-white/80 dark:border-slate-800/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Events</h3>
                <div className="space-y-2.5">
                  {events.slice(0, 5).map((evt) => (
                    <div key={evt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${evt.color} ${evt.textColor}`}>
                        <evt.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{evt.title}</span>
                        <span className="text-[10px] text-slate-400">{evt.dateStr} • {evt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ATTENDANCE TRACKER HUB
         ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Attendance Matrix */}
            <div className="lg:col-span-8 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Attendance Breakdown</h3>
                <span className="text-xs font-semibold text-slate-400">April 2025</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {aprilAttendance.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center text-xs flex flex-col justify-between h-14 ${item.month !== 'current' ? 'opacity-40 border-slate-100 dark:border-slate-800' :
                        item.status === 'present' ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30' :
                          item.status === 'absent' ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/30' :
                            'border-purple-200 bg-purple-50/50 dark:bg-purple-950/30'
                      }`}
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.day}</span>
                    {item.status && (
                      <span className={`text-[9px] font-bold capitalize ${item.status === 'present' ? 'text-emerald-600' :
                          item.status === 'absent' ? 'text-rose-600' : 'text-purple-600'
                        }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Summary Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Summary</h3>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full border-8 border-emerald-500 flex items-center justify-center text-center">
                  <div>
                    <span className="text-xl font-black block leading-none">90%</span>
                    <span className="text-[9px] text-slate-400">Rate</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex justify-between"><span className="text-emerald-600 font-bold">● Present</span><span className="font-bold">18 days</span></div>
                  <div className="flex justify-between"><span className="text-rose-600 font-bold">● Absent</span><span className="font-bold">2 days</span></div>
                  <div className="flex justify-between"><span className="text-purple-600 font-bold">● Leave</span><span className="font-bold">1 day</span></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: HOLIDAY MANAGEMENT CENTER
         ========================================================================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-6 animate-fade-in">

          {/* Controls & Search Header */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                <option value="2025">Calendar 2025</option>
                <option value="2026">Calendar 2026</option>
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

          {/* Holidays Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays
              .filter((h) => {
                if (selectedHolidayYear !== 'All' && !h.date.startsWith(selectedHolidayYear)) return false;
                if (holidaySearchQuery && !h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase())) return false;
                return true;
              })
              .map((h) => (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative group space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.type === 'Public' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                        {h.type} Holiday
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mt-2">{h.name}</h4>
                      {h.description && <p className="text-xs text-slate-500 mt-1">{h.description}</p>}
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
          MODALS: DAY INSPECTOR, ADD EVENT, ADD HOLIDAY, EXCEL IMPORT
         ========================================================================= */}

      {/* 1. Day Inspector Modal */}
      {isDayInspectorOpen && (
        <Modal
          isOpen={isDayInspectorOpen}
          onClose={() => setIsDayInspectorOpen(false)}
          title={`Details for April ${selectedDayNum}, 2025`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">Attendance Status:</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 capitalize">
                {selectedDayAttendance?.status || 'Present'}
              </span>
            </div>

            {selectedDayAttendance?.checkIn && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Check In</span>
                  <span className="font-bold font-mono">{selectedDayAttendance.checkIn}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Check Out</span>
                  <span className="font-bold font-mono">{selectedDayAttendance.checkOut}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Hours</span>
                  <span className="font-bold font-mono">{selectedDayAttendance.hours}</span>
                </div>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-2">Scheduled Events ({selectedDayEvents.length})</span>
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayEvents.map(e => (
                    <div key={e.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{e.title}</span>
                      <span className="text-[11px] text-slate-500">{e.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">No custom meetings scheduled for this day.</span>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Add Event Modal */}
      {isAddEventModalOpen && (
        <Modal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} title="Add New Event">
          <form onSubmit={handleAddEvent} className="space-y-4">
            <Input label="Event Title" placeholder="e.g. Team Meeting / Client Sync" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
            <Input label="Day of Month (April)" type="number" min={1} max={30} value={newEvent.day} onChange={e => setNewEvent({ ...newEvent, day: Number(e.target.value) })} required />
            <Input label="Event Time" placeholder="10:00 AM" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required />
            <Select label="Type" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })} options={[
              { value: 'meeting', label: 'Meeting' },
              { value: 'discussion', label: 'Discussion' },
              { value: 'holiday', label: 'Holiday' },
              { value: 'birthday', label: 'Birthday' },
              { value: 'review', label: 'Review' },
            ]} />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsAddEventModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Event</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Add Holiday Modal */}
      {isAddHolidayModalOpen && (
        <Modal isOpen={isAddHolidayModalOpen} onClose={() => setIsAddHolidayModalOpen(false)} title="Add Holiday">
          <form onSubmit={handleAddHolidaySubmit} className="space-y-4">
            <Input label="Holiday Name" placeholder="e.g. Founder's Day" value={newHolidayTitle} onChange={e => setNewHolidayTitle(e.target.value)} required />
            <Input label="Date" type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required />
            <Select label="Type" value={newHolidayType} onChange={e => setNewHolidayType(e.target.value as any)} options={[
              { value: 'Public', label: 'Public Holiday (Paid)' },
              { value: 'Company', label: 'Company Observance' },
              { value: 'Optional', label: 'Floating / Optional' },
            ]} />
            <Input label="Office Scope" value={newHolidayScope} onChange={e => setNewHolidayScope(e.target.value)} placeholder="Global / All Offices" />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setIsAddHolidayModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Holiday</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. Excel Import Modal */}
      {isImportExcelModalOpen && (
        <Modal isOpen={isImportExcelModalOpen} onClose={() => setIsImportExcelModalOpen(false)} title="Import Holidays from Excel">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs space-y-1">
              <span className="font-bold block text-slate-900">Excel / CSV Import Engine</span>
              <p className="text-slate-600">Upload your holiday list. Click below to download the sample Excel format.</p>
              <button type="button" onClick={downloadSampleHolidayExcelTemplate} className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Download Sample Template (.csv)
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center relative bg-slate-50/50">
              <input type="file" accept=".csv,.xlsx,.xls,.tsv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <span className="text-xs font-bold block">{importFile ? importFile.name : 'Select or drop Excel/CSV file here'}</span>
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

    </div>
  );
};

export default CalendarPage;
