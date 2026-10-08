import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, CheckSquare, ArrowUp, ChevronDown, Plus, Download, Upload,
  MoreVertical, ChevronRight, X, CheckCircle2, FileSpreadsheet, AlertCircle,
  Trash2, Edit3, FileText, Briefcase, Tag, Coffee, DollarSign, Layers
} from 'lucide-react';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { downloadSampleTimesheetExcelTemplate, parseTimesheetFile, ParsedTimesheetRow } from '../../utils/excelParser';

// ──────────────────────────────────────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────────────────────────────────────
export interface TimesheetRow {
  id: string;
  date: string;
  day: string;
  project: string;
  category: string;
  checkIn: string;
  checkOut: string;
  breakMins: number;
  totalHours: string;
  hoursDecimal: number;
  status: 'Present' | 'Absent' | 'Leave';
  billable: boolean;
  taskNotes: string;
}

interface EntryForm {
  date: string;
  checkIn: string;
  checkOut: string;
  project: string;
  category: string;
  breakMins: string;
  status: TimesheetRow['status'];
  billable: boolean;
  taskNotes: string;
}

// Draft row used in the Monthly bulk-entry page
interface MonthDraft {
  isoDate: string;       // YYYY-MM-DD
  displayDate: string;   // "01 Sep 2026"
  dayName: string;       // "Mon"
  isWeekend: boolean;
  status: TimesheetRow['status'];
  checkIn: string;
  checkOut: string;
  breakMins: string;
  project: string;
  category: string;
  billable: boolean;
  taskNotes: string;
}

// ──────────────────────────────────────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────────────────────────────────────
const PROJECTS = [
  'SASS HRMS Portal',
  'Client Mobile App',
  'Internal Operations',
  'GoNex Ride-Hailing',
  'Admin Dashboard',
];
const CATEGORIES = [
  'Frontend Development',
  'Backend API',
  'Database Design',
  'QA & Testing',
  'Client Meeting',
  'Documentation',
  'DevOps & Deployment',
  'Code Review',
  'Design & Prototyping',
  'Sprint Planning',
];

const DEFAULT_FORM: EntryForm = {
  date: '2026-09-29',
  checkIn: '09:00',
  checkOut: '18:00',
  project: 'SASS HRMS Portal',
  category: 'Frontend Development',
  breakMins: '60',
  status: 'Present',
  billable: true,
  taskNotes: '',
};

// ──────────────────────────────────────────────────────────────────────────────
//  Helper
// ──────────────────────────────────────────────────────────────────────────────
function computeHours(checkIn: string, checkOut: string, breakMins: number, status: string) {
  if (status === 'Absent' || status === 'Holiday') return { formatted: '0 h 00 m', decimal: 0 };
  try {
    const [ih, im] = checkIn.split(':').map(Number);
    const [oh, om] = checkOut.split(':').map(Number);
    let diff = (oh * 60 + om) - (ih * 60 + im) - breakMins;
    if (diff < 0) diff = 0;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { formatted: `${h} h ${m.toString().padStart(2, '0')} m`, decimal: parseFloat((h + m / 60).toFixed(2)) };
  } catch {
    return { formatted: '8 h 00 m', decimal: 8 };
  }
}

function fmtTime24to12(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = (h % 12) || 12;
  return `${hr.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function generateMonthDrafts(year: number, month: number, defaultProject: string): MonthDraft[] {
  const days: MonthDraft[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const displayDate = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const dayName = dt.toLocaleDateString('en-GB', { weekday: 'short' });
    days.push({
      isoDate,
      displayDate,
      dayName,
      isWeekend,
      status: isWeekend ? 'Absent' : 'Present',
      checkIn: '09:00',
      checkOut: '18:00',
      breakMins: '60',
      project: defaultProject,
      category: 'Frontend Development',
      billable: !isWeekend,
      taskNotes: isWeekend ? 'Weekend Off' : '',
    });
  }
  return days;
}

// ──────────────────────────────────────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────────────────────────────────────
export const TimesheetsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRange, setSelectedRange] = useState('Sep 22, 2026 – Sep 28, 2026');
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TimesheetRow | null>(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(DEFAULT_FORM);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTimesheetRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStats, setImportStats] = useState({ valid: 0, invalid: 0 });

  // ── Filter & Month-navigation state ───────────────────────────────────
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-based
  const [filterStatus, setFilterStatus] = useState<'' | 'Present' | 'Absent' | 'Leave'>('');
  const [filterProject, setFilterProject] = useState('');
  const [filterBillable, setFilterBillable] = useState<'' | 'yes' | 'no'>('');
  const [filterSearch, setFilterSearch] = useState('');

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const navigateMonth = (dir: -1 | 1) => {
    let m = filterMonth + dir;
    let y = filterYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setFilterMonth(m);
    setFilterYear(y);
  };

  // ── Monthly bulk entry page ────────────────────────────────────────────────
  const [isMonthlyEntryOpen, setIsMonthlyEntryOpen] = useState(false);
  const [monthlyYear, setMonthlyYear] = useState(2026);
  const [monthlyMonth, setMonthlyMonth] = useState(9); // 1-based
  const [monthlyProject, setMonthlyProject] = useState('SASS HRMS Portal');
  const [monthlyDrafts, setMonthlyDrafts] = useState<MonthDraft[]>([]);

  const openMonthlyEntry = () => {
    setMonthlyDrafts(generateMonthDrafts(monthlyYear, monthlyMonth, monthlyProject));
    setIsMonthlyEntryOpen(true);
  };

  const updateDraft = (idx: number, patch: Partial<MonthDraft>) => {
    setMonthlyDrafts(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const applyToAllWorkdays = (patch: Partial<Pick<MonthDraft, 'checkIn' | 'checkOut' | 'breakMins' | 'project' | 'category' | 'billable'>>) => {
    setMonthlyDrafts(prev => prev.map(d => d.isWeekend ? d : { ...d, ...patch }));
  };

  const handleMonthlySubmit = () => {
    const newRows: TimesheetRow[] = monthlyDrafts.map((d, i) => {
      const bm = parseInt(d.breakMins || '0', 10);
      const { formatted, decimal } = computeHours(d.checkIn, d.checkOut, bm, d.status);
      const needTimes = d.status === 'Present' || d.status === 'Leave';
      return {
        id: (Date.now() + i).toString(),
        date: d.displayDate,
        day: d.dayName,
        project: d.project,
        category: d.category,
        checkIn: needTimes ? fmtTime24to12(d.checkIn) : '—',
        checkOut: needTimes ? fmtTime24to12(d.checkOut) : '—',
        breakMins: bm,
        totalHours: formatted,
        hoursDecimal: decimal,
        status: d.status,
        billable: d.billable,
        taskNotes: d.taskNotes || (d.isWeekend ? 'Weekend Off' : 'No description'),
      };
    });
    setRows(prev => [...newRows, ...prev]);
    setIsMonthlyEntryOpen(false);
    showToast(`Saved ${newRows.length} timesheet entries for ${new Date(monthlyYear, monthlyMonth - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}!`);
  };

  const [rows, setRows] = useState<TimesheetRow[]>([
    { id: '1', date: '22 Sep 2026', day: 'Mon', project: 'SASS HRMS Portal', category: 'Frontend Development', checkIn: '09:00 AM', checkOut: '06:00 PM', breakMins: 60, totalHours: '8 h 00 m', hoursDecimal: 8, status: 'Present', billable: true, taskNotes: 'Built timesheet UI with Excel bulk import. Implemented dynamic metric cards and modal form validation.' },
    { id: '2', date: '23 Sep 2026', day: 'Tue', project: 'SASS HRMS Portal', category: 'Backend API', checkIn: '09:15 AM', checkOut: '06:15 PM', breakMins: 60, totalHours: '8 h 00 m', hoursDecimal: 8, status: 'Present', billable: true, taskNotes: 'Developed REST API endpoints for attendance tracking, overtime calculations and regularisations.' },
    { id: '3', date: '24 Sep 2026', day: 'Wed', project: 'Client Mobile App', category: 'Database Design', checkIn: '09:05 AM', checkOut: '06:10 PM', breakMins: 45, totalHours: '8 h 20 m', hoursDecimal: 8.33, status: 'Present', billable: true, taskNotes: 'Optimised multi-tenant RBAC database schema and added composite indexes for query performance.' },
    { id: '4', date: '25 Sep 2026', day: 'Thu', project: 'Client Mobile App', category: 'QA & Testing', checkIn: '09:00 AM', checkOut: '06:30 PM', breakMins: 60, totalHours: '8 h 30 m', hoursDecimal: 8.5, status: 'Present', billable: true, taskNotes: 'Executed full E2E test suite. Fixed 12 critical bugs. Documented all failing edge cases with steps to reproduce.' },
    { id: '5', date: '26 Sep 2026', day: 'Fri', project: 'Internal Operations', category: 'Client Meeting', checkIn: '09:10 AM', checkOut: '07:00 PM', breakMins: 60, totalHours: '8 h 50 m', hoursDecimal: 8.83, status: 'Present', billable: false, taskNotes: 'Sprint review with client stakeholders. Received signoff on milestone 3. Shared next sprint roadmap.' },
    { id: '6', date: '27 Sep 2026', day: 'Sat', project: 'SASS HRMS Portal', category: 'Documentation', checkIn: '—', checkOut: '—', breakMins: 0, totalHours: '0 h 00 m', hoursDecimal: 0, status: 'Absent', billable: false, taskNotes: 'Weekend Off' },

  ]);

  // ── filteredRows (derived from rows — must be after rows state) ─────────────
  const filteredRows = rows.filter(row => {
    if (!row.date.includes(MONTHS[filterMonth - 1]) || !row.date.includes(String(filterYear))) return false;
    if (filterStatus && row.status !== filterStatus) return false;
    if (filterProject && row.project !== filterProject) return false;
    if (filterBillable === 'yes' && !row.billable) return false;
    if (filterBillable === 'no' && row.billable) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!row.date.toLowerCase().includes(q) && !row.project.toLowerCase().includes(q) &&
        !row.category.toLowerCase().includes(q) && !row.taskNotes.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const uniqueProjects = Array.from(new Set(rows.map(r => r.project)));

  // ── Metrics ──────────────────────────────────────────────────────────────
  const totalHoursStr = (() => {
    const total = rows.reduce((a, r) => a + r.hoursDecimal * 60, 0);
    return `${Math.floor(total / 60)} h ${(total % 60).toFixed(0).padStart(2, '0')} m`;
  })();
  const billableHoursStr = (() => {
    const total = rows.filter(r => r.billable).reduce((a, r) => a + r.hoursDecimal * 60, 0);
    return `${Math.floor(total / 60)} h ${(total % 60).toFixed(0).padStart(2, '0')} m`;
  })();
  const presentDays = rows.filter(r => r.status === 'Present').length;
  const overtimeStr = (() => {
    const ot = rows.reduce((a, r) => a + (r.status === 'Present' && r.hoursDecimal > 8 ? (r.hoursDecimal - 8) * 60 : 0), 0);
    return `${Math.floor(ot / 60)} h ${(ot % 60).toFixed(0).padStart(2, '0')} m`;
  })();

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Save / Edit ───────────────────────────────────────────────────────────
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dObj = new Date(form.date);
    const fDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const fDay = dObj.toLocaleDateString('en-GB', { weekday: 'short' });
    const bm = parseInt(form.breakMins || '0', 10) || 0;
    const { formatted, decimal } = computeHours(form.checkIn, form.checkOut, bm, form.status);
    const needsTimes = form.status === 'Present' || form.status === 'Leave';

    const updated: TimesheetRow = {
      id: editingRow?.id || Date.now().toString(),
      date: fDate,
      day: fDay,
      project: form.project,
      category: form.category,
      checkIn: needsTimes ? fmtTime24to12(form.checkIn) : '—',
      checkOut: needsTimes ? fmtTime24to12(form.checkOut) : '—',
      breakMins: bm,
      totalHours: formatted,
      hoursDecimal: decimal,
      status: form.status,
      billable: form.billable,
      taskNotes: form.taskNotes,
    };

    if (editingRow) {
      setRows(rows.map(r => r.id === editingRow.id ? updated : r));
      showToast(`Updated entry for ${fDate}`);
    } else {
      setRows([updated, ...rows]);
      showToast(`Added entry for ${fDate}`);
    }
    setIsAddModalOpen(false);
    setEditingRow(null);
    setForm(DEFAULT_FORM);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id: string, date: string) => {
    setRows(rows.filter(r => r.id !== id));
    setActiveMenuRowId(null);
    showToast(`Deleted entry for ${date}`);
  };

  // ── Excel Parse ───────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    try {
      const result = await parseTimesheetFile(file);
      setParsedRows(result.rows);
      setImportStats({ valid: result.totalValid, invalid: result.totalInvalid });
    } catch { showToast('Failed to parse file. Please use the template format.'); }
    finally { setIsParsing(false); }
  };

  const handleImportConfirm = () => {
    const valid = parsedRows.filter(r => r.isValid);
    if (!valid.length) return;
    const imported: TimesheetRow[] = valid.map((r, i) => {
      // Holiday no longer exists in Timesheets — treat as Absent
      const safeStatus: TimesheetRow['status'] =
        r.status === 'Holiday' ? 'Absent' : (r.status as TimesheetRow['status']);
      return {
        id: (Date.now() + i).toString(),
        date: r.date, day: r.day, project: r.project, category: r.category,
        checkIn: r.checkIn, checkOut: r.checkOut, breakMins: r.breakMins,
        totalHours: r.totalHours, hoursDecimal: r.hoursDecimal,
        status: safeStatus, billable: r.billable, taskNotes: r.taskNotes,
      };
    });
    setRows([...imported, ...rows]);
    setIsImportModalOpen(false);
    setImportFile(null);
    setParsedRows([]);
    showToast(`Imported ${valid.length} timesheet records successfully!`);
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Day', 'Project', 'Category', 'Check In', 'Check Out', 'Break (Mins)', 'Net Hours', 'Status', 'Billable', 'Task Notes'].join(','),
      ...rows.map(r => [
        `"${r.date}"`, `"${r.day}"`, `"${r.project}"`, `"${r.category}"`,
        `"${r.checkIn}"`, `"${r.checkOut}"`, r.breakMins, `"${r.totalHours}"`,
        `"${r.status}"`, r.billable ? 'Yes' : 'No', `"${r.taskNotes}"`
      ].join(','))
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `timesheet_${selectedRange.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    showToast('Timesheet exported successfully!');
  };

  // ── Status badge colour ───────────────────────────────────────────────────
  const statusCls = (s: string) => ({
    Present: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    Absent: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    Holiday: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    Leave: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  }[s] ?? 'bg-slate-100 text-slate-600');

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp = 'w-full h-9 px-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="h-4 w-4" /> {notification}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           FULL-PAGE MONTHLY BULK ENTRY — slides over the normal page
         ══════════════════════════════════════════════════════════════════════ */}
      {isMonthlyEntryOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#060E1E] overflow-y-auto">

          {/* ── Top Bar ─────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-50 bg-white/95 dark:bg-[#060E1E]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMonthlyEntryOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Monthly Timesheet Entry
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in details for all {monthlyDrafts.length} days — weekends are pre-filled as Off/Holiday
                </p>
              </div>
            </div>

            {/* Month / Year / Project selectors */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select value={monthlyMonth} onChange={e => setMonthlyMonth(Number(e.target.value))}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input type="number" min={2020} max={2035} value={monthlyYear} onChange={e => setMonthlyYear(Number(e.target.value))}
                className="h-9 w-24 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none" />
              <select value={monthlyProject} onChange={e => setMonthlyProject(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none">
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => setMonthlyDrafts(generateMonthDrafts(monthlyYear, monthlyMonth, monthlyProject))}
                className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors">
                Regenerate
              </button>
            </div>

            <button onClick={handleMonthlySubmit}
              className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm transition-all flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Save All {monthlyDrafts.length} Entries
            </button>
          </div>

          {/* ── Bulk-Apply Bar ───────────────────────────────────────────── */}
          <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">⚡ Apply to all workdays:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold">Check In</label>
              <input type="time" defaultValue="09:00" id="bulk-in"
                className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold">Check Out</label>
              <input type="time" defaultValue="18:00" id="bulk-out"
                className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 dark:text-slate-400 font-semibold">Break (m)</label>
              <input type="number" defaultValue="60" id="bulk-break" min={0} max={480}
                className="h-8 w-16 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white" />
            </div>
            <button onClick={() => {
              const inEl = document.getElementById('bulk-in') as HTMLInputElement;
              const outEl = document.getElementById('bulk-out') as HTMLInputElement;
              const brkEl = document.getElementById('bulk-break') as HTMLInputElement;
              applyToAllWorkdays({ checkIn: inEl?.value || '09:00', checkOut: outEl?.value || '18:00', breakMins: brkEl?.value || '60' });
            }} className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors">
              Apply
            </button>
          </div>

          {/* ── Days Table ──────────────────────────────────────────────── */}
          <div className="px-4 py-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                  <th className="pl-3 pb-2">#</th>
                  <th className="pb-2">Date / Day</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Check In</th>
                  <th className="pb-2">Check Out</th>
                  <th className="pb-2">Break</th>
                  <th className="pb-2">Net Hours</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Billable</th>
                  <th className="pb-2 min-w-[220px]">Task Notes <span className="text-rose-500">*</span></th>
                </tr>
              </thead>
              <tbody>
                {monthlyDrafts.map((d, idx) => {
                  const bm = parseInt(d.breakMins || '0', 10);
                  const { formatted } = computeHours(d.checkIn, d.checkOut, bm, d.status);
                  const isOff = d.status === 'Absent';
                  return (
                    <tr key={d.isoDate}
                      className={`rounded-2xl transition-colors ${d.isWeekend
                        ? 'bg-slate-50/80 dark:bg-slate-900/40'
                        : 'bg-white dark:bg-[#0F172A] shadow-xs hover:shadow-sm'
                        }`}
                    >
                      {/* # */}
                      <td className="pl-3 py-2 rounded-l-2xl text-slate-400 font-mono">{String(idx + 1).padStart(2, '0')}</td>

                      {/* Date */}
                      <td className="py-2 pr-2 whitespace-nowrap">
                        <span className={`font-bold block ${d.isWeekend ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                          }`}>{d.displayDate}</span>
                        <span className="text-[11px] text-slate-400">{d.dayName}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2 pr-2">
                        <select value={d.status} onChange={e => updateDraft(idx, { status: e.target.value as TimesheetRow['status'], taskNotes: (e.target.value === 'Absent' ? 'Absent' : d.taskNotes) })}
                          className={`h-8 px-2 rounded-xl border text-[11px] font-bold cursor-pointer focus:outline-none ${d.status === 'Present' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                            : d.status === 'Absent' ? 'border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                              : d.status === 'Leave' ? 'border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                                : 'border-purple-200 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
                            }`}>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>

                      {/* Check In */}
                      <td className="py-2 pr-2">
                        <input type="time" disabled={isOff} value={d.checkIn} onChange={e => updateDraft(idx, { checkIn: e.target.value })}
                          className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-[11px] font-mono w-[90px] focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                      </td>

                      {/* Check Out */}
                      <td className="py-2 pr-2">
                        <input type="time" disabled={isOff} value={d.checkOut} onChange={e => updateDraft(idx, { checkOut: e.target.value })}
                          className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-[11px] font-mono w-[90px] focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                      </td>

                      {/* Break */}
                      <td className="py-2 pr-2">
                        <input type="number" disabled={isOff} min={0} max={480} value={d.breakMins} onChange={e => updateDraft(idx, { breakMins: e.target.value })}
                          className="h-8 px-2 w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-[11px] focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                      </td>

                      {/* Net Hours */}
                      <td className="py-2 pr-2 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {formatted}
                      </td>

                      {/* Project */}
                      <td className="py-2 pr-2">
                        <select value={d.project} onChange={e => updateDraft(idx, { project: e.target.value })}
                          className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-[11px] focus:outline-none">
                          {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>

                      {/* Category */}
                      <td className="py-2 pr-2">
                        <select value={d.category} onChange={e => updateDraft(idx, { category: e.target.value })}
                          className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-[11px] focus:outline-none">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>

                      {/* Billable */}
                      <td className="py-2 pr-2">
                        <button type="button" disabled={isOff} onClick={() => updateDraft(idx, { billable: !d.billable })}
                          className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 disabled:opacity-30 ${d.billable ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}>
                          <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${d.billable ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* Task Notes */}
                      <td className="py-2 pr-3 rounded-r-2xl">
                        <input
                          type="text"
                          value={d.taskNotes}
                          onChange={e => updateDraft(idx, { taskNotes: e.target.value })}
                          placeholder={isOff ? 'Off / Holiday' : 'Describe work done today…'}
                          required={!isOff}
                          className={`h-8 px-3 rounded-xl border text-[11px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white ${!isOff && !d.taskNotes
                            ? 'border-rose-300 dark:border-rose-700'
                            : 'border-slate-200 dark:border-slate-700'
                            }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Bottom Action Bar ────────────────────────────────────────── */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-[#060E1E]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-emerald-600">{monthlyDrafts.filter(d => d.status === 'Present').length} workdays</span>
              &nbsp;·&nbsp;
              <span className="font-bold text-rose-500">{monthlyDrafts.filter(d => !d.taskNotes && !d.isWeekend && d.status === 'Present').length} missing notes</span>
              &nbsp;·&nbsp;
              <span className="font-bold text-blue-600">{monthlyDrafts.filter(d => d.billable).length} billable days</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMonthlyEntryOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-xs">
                Cancel
              </button>
              <button onClick={handleMonthlySubmit} className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Save All {monthlyDrafts.length} Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeaderCard
        title="Timesheets"
        subtitle="Track your working hours and manage your timesheets easily."
        icon={Clock}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="relative">
              <button onClick={() => setIsRangeOpen(v => !v)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#0F172A]/90 border border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{selectedRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>
              {isRangeOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-30 text-xs">
                  {[
                    'Sep 22, 2026 – Sep 28, 2026',
                    'Sep 15, 2026 – Sep 21, 2026',
                    'Sep 08, 2026 – Sep 14, 2026',
                    'Sep 01, 2026 – Sep 07, 2026',
                  ].map(r => (
                    <button key={r} onClick={() => { setSelectedRange(r); setIsRangeOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${selectedRange === r ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Import Excel */}
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer hover:bg-emerald-50/30">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </button>

            {/* Add Timesheet — opens full-page monthly entry */}
            <button onClick={openMonthlyEntry} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Timesheet</span>
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Hours', value: totalHoursStr, badge: '↑ 12%', icon: Clock, color: 'blue' },
          { label: 'Billable Hours', value: billableHoursStr, badge: '↑ 15%', icon: DollarSign, color: 'emerald' },
          { label: 'Working Days', value: `${presentDays} / 5`, badge: 'Mon–Fri', icon: Calendar, color: 'purple' },
          { label: 'Overtime', value: overtimeStr, badge: '↑ 50%', icon: Clock, color: 'indigo' },
        ].map(({ label, value, badge, icon: Icon, color }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl p-4 border border-white/80 dark:border-slate-800/80 bg-gradient-to-br from-white to-${color}-50/30 dark:from-[#0F172A] dark:to-${color}-950/20 backdrop-blur-xl shadow-xs hover:shadow-xl hover:border-${color}-300 dark:hover:border-${color}-700/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl bg-${color}-50/90 dark:bg-${color}-950/70 text-${color}-600 dark:text-${color}-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none block">{value}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-[11px] font-semibold text-emerald-500">{badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Layout: Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Timesheet Details</h2>
              <p className="text-xs text-slate-500">{selectedRange} · {rows.length} day entries</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Import
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          {/* ── Filter / Month Navigator Bar ───────────────────────────── */}
          <div className="space-y-3">
            {/* Month Navigator */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[110px] text-center">
                {MONTHS[filterMonth - 1]} {filterYear}
              </span>
              <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>

              {/* Quick month chips */}
              <div className="flex items-center gap-1.5 flex-wrap ml-2">
                {[0, -1, -2, -3].map(offset => {
                  let m = now.getMonth() + 1 + offset;
                  let y = now.getFullYear();
                  if (m < 1) { m += 12; y--; }
                  const active = m === filterMonth && y === filterYear;
                  return (
                    <button key={offset} onClick={() => { setFilterMonth(m); setFilterYear(y); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}>
                      {MONTHS[m - 1]} {y !== now.getFullYear() ? y : ''}
                    </button>
                  );
                })}
              </div>

              {/* Result count */}
              <span className="ml-auto text-[11px] text-slate-400 font-semibold">
                {filteredRows.length} {filteredRows.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[140px]">
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search project, notes…" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>

              {/* Status filter */}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>

              {/* Project filter */}
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[160px]">
                <option value="">All Projects</option>
                {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* Billable filter */}
              <select value={filterBillable} onChange={e => setFilterBillable(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
                <option value="">All Billing</option>
                <option value="yes">Billable</option>
                <option value="no">Non-Billable</option>
              </select>

              {/* Clear all filters */}
              {(filterStatus || filterProject || filterBillable || filterSearch) && (
                <button onClick={() => { setFilterStatus(''); setFilterProject(''); setFilterBillable(''); setFilterSearch(''); }}
                  className="h-8 px-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Project / Category</th>
                  <th className="py-3 px-2">Check In</th>
                  <th className="py-3 px-2">Check Out</th>
                  <th className="py-3 px-2">Break</th>
                  <th className="py-3 px-2">Net Hours</th>
                  <th className="py-3 px-2">Billable</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span className="text-xs font-semibold text-slate-400">
                          No entries for {MONTHS[filterMonth - 1]} {filterYear}
                          {(filterStatus || filterProject || filterBillable || filterSearch) ? ' matching filters' : ''}
                        </span>
                        <button onClick={openMonthlyEntry} className="mt-1 px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700">
                          + Add Entries for This Month
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.map(row => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-900 dark:text-white block whitespace-nowrap">{row.date}</span>
                        <span className="text-slate-400 text-[11px]">{row.day}</span>
                      </td>

                      {/* Project / Category */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Briefcase className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{row.project}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-sky-400 flex-shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[140px]">{row.category}</span>
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-2 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.checkIn}</td>

                      {/* Check Out */}
                      <td className="py-3 px-2 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.checkOut}</td>

                      {/* Break */}
                      <td className="py-3 px-2">
                        {row.breakMins > 0 ? (
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Coffee className="w-3 h-3 text-amber-400" />{row.breakMins}m
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>

                      {/* Net Hours */}
                      <td className="py-3 px-2 font-semibold font-mono text-slate-900 dark:text-white whitespace-nowrap">{row.totalHours}</td>

                      {/* Billable */}
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.billable ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {row.billable ? '$ Billable' : 'Non-Bill'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusCls(row.status)}`}>
                          {row.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right relative">
                        <button
                          onClick={() => setActiveMenuRowId(activeMenuRowId === row.id ? null : row.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuRowId === row.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-20 text-left">
                            <button onClick={() => { setExpandedNoteId(expandedNoteId === row.id ? null : row.id); setActiveMenuRowId(null); }} className="w-full text-left px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-blue-500" /> View Note
                            </button>
                            <button onClick={() => {
                              setEditingRow(row);
                              setForm({
                                date: new Date().toISOString().split('T')[0],
                                checkIn: '09:00', checkOut: '18:00',
                                project: row.project, category: row.category,
                                breakMins: row.breakMins.toString(),
                                status: row.status, billable: row.billable,
                                taskNotes: row.taskNotes,
                              });
                              setIsAddModalOpen(true);
                              setActiveMenuRowId(null);
                            }} className="w-full text-left px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                              <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit Entry
                            </button>
                            <button onClick={() => handleDelete(row.id, row.date)} className="w-full text-left px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Row
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Task Note Row */}
                    {expandedNoteId === row.id && (
                      <tr>
                        <td colSpan={9} className="px-4 pb-3 pt-0">
                          <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-3.5 flex gap-3 items-start">
                            <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">Task Summary</p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{row.taskNotes}</p>
                            </div>
                            <button onClick={() => setExpandedNoteId(null)} className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-indigo-50/60 dark:from-blue-950/40 dark:via-sky-950/20 dark:to-indigo-950/30 rounded-3xl p-5 border border-blue-100/80 dark:border-blue-900/40 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-blue-200/50 blur-xs" />
                <svg viewBox="0 0 64 64" className="w-16 h-16 relative z-10">
                  <path d="M 12,32 C 6,24 10,12 24,14 C 18,22 18,30 12,32 Z" fill="#60A5FA" fillOpacity="0.4" />
                  <path d="M 52,32 C 58,24 54,12 40,14 C 46,22 46,30 52,32 Z" fill="#38BDF8" fillOpacity="0.4" />
                  <circle cx="32" cy="32" r="16" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                  <line x1="32" y1="32" x2="32" y2="22" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  <line x1="32" y1="32" x2="40" y2="32" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="32" cy="32" r="2" fill="#2563EB" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Progress</h3>
                <p className="text-[11px] text-slate-500">Stay consistent! You're doing great.</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-3 bg-blue-100/70 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(presentDays / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-blue-600">{Math.round((presentDays / 5) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Hours</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Clock className="w-3.5 h-3.5" /> {totalHoursStr}
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 pt-2 px-1">
              {rows.map(r => (
                <div key={r.id} className="flex flex-col items-center flex-1">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1.5">{r.hoursDecimal > 0 ? `${r.hoursDecimal}h` : '0h'}</span>
                  <div className="w-full h-24 flex items-end justify-center">
                    <div
                      className={`w-full max-w-[28px] rounded-xl ${r.status === 'Present' ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400' : 'bg-slate-100 dark:bg-slate-800'}`}
                      style={{ height: r.hoursDecimal > 0 ? `${Math.min(100, (r.hoursDecimal / 10) * 100)}%` : '20%', opacity: r.hoursDecimal > 0 ? 1 : 0.4 }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 mt-2">{r.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { label: 'Apply for Leave', icon: Calendar, color: 'blue', onClick: () => navigate('/leave/apply') },
                { label: 'View Attendance', icon: Layers, color: 'blue', onClick: () => navigate('/attendance') },
                { label: 'Import Excel Timesheet', icon: FileSpreadsheet, color: 'emerald', onClick: () => setIsImportModalOpen(true) },
              ].map(({ label, icon: Icon, color, onClick }) => (
                <button key={label} onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-950/60 text-${color}-600 dark:text-${color}-400 flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Excel Import Modal ────────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Import Timesheets via Excel / CSV</h3>
                  <p className="text-xs text-slate-500">Upload a CSV with all 10 required columns to import multiple entries at once.</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Template Download */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">Download CSV Template</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Includes all 10 required columns: Date, Day, Project, Category, Check In, Check Out, Break Mins, Status, Billable, Task Notes.</p>
                  </div>
                </div>
                <button onClick={downloadSampleTimesheetExcelTemplate} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="ts-excel-input" />
                <label htmlFor="ts-excel-input" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-emerald-500 mx-auto" />
                  <span className="font-bold text-slate-700 dark:text-slate-200 block text-sm">
                    {importFile ? importFile.name : 'Click to select CSV / Excel file'}
                  </span>
                  <span className="text-[11px] text-slate-400">.CSV, .XLS, .XLSX — Max 5 MB</span>
                </label>
              </div>

              {isParsing && <div className="text-center py-4 text-slate-500 font-semibold animate-pulse">Parsing file…</div>}

              {/* Preview Table */}
              {parsedRows.length > 0 && !isParsing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Preview — {parsedRows.length} rows</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">✓ {importStats.valid} valid</span>
                      {importStats.invalid > 0 && <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">✕ {importStats.invalid} errors</span>}
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-[11px] min-w-[800px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          {['Date', 'Day', 'Project', 'Category', 'Check In', 'Check Out', 'Break', 'Net Hours', 'Status', 'Billable', 'Task Note', 'Valid?'].map(h => (
                            <th key={h} className="px-2 py-2 font-bold text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={r.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                            <td className="px-2 py-1.5 whitespace-nowrap font-semibold">{r.date}</td>
                            <td className="px-2 py-1.5">{r.day}</td>
                            <td className="px-2 py-1.5 max-w-[100px] truncate">{r.project}</td>
                            <td className="px-2 py-1.5 max-w-[100px] truncate">{r.category}</td>
                            <td className="px-2 py-1.5 font-mono">{r.checkIn}</td>
                            <td className="px-2 py-1.5 font-mono">{r.checkOut}</td>
                            <td className="px-2 py-1.5">{r.breakMins}m</td>
                            <td className="px-2 py-1.5 font-mono font-bold">{r.totalHours}</td>
                            <td className="px-2 py-1.5">{r.status}</td>
                            <td className="px-2 py-1.5">{r.billable ? '✓' : '✗'}</td>
                            <td className="px-2 py-1.5 max-w-[140px] truncate text-slate-500">{r.taskNotes}</td>
                            <td className="px-2 py-1.5">
                              {r.isValid
                                ? <span className="text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" />Ready</span>
                                : <span className="text-rose-600 flex items-center gap-1 font-bold" title={r.errorReason}><AlertCircle className="w-3 h-3" />{r.errorReason?.slice(0, 20)}…</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button disabled={importStats.valid === 0} onClick={handleImportConfirm} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-sm cursor-pointer">
                Import {importStats.valid > 0 ? `${importStats.valid} Rows` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                {editingRow ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setEditingRow(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-3.5 pt-4 pr-1">

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Date <span className="text-rose-500">*</span></label>
                <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} />
              </div>

              {/* Check In / Out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Check In <span className="text-rose-500">*</span></label>
                  <input type="time" required value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} className={inp} disabled={form.status === 'Absent'} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Check Out <span className="text-rose-500">*</span></label>
                  <input type="time" required value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} className={inp} disabled={form.status === 'Absent'} />
                </div>
              </div>

              {/* Break Mins */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Break Duration (Mins) <span className="text-rose-500">*</span></label>
                <input type="number" min="0" max="480" required value={form.breakMins} onChange={e => setForm(f => ({ ...f, breakMins: e.target.value }))} className={inp} placeholder="e.g. 60" />
                {(() => {
                  const { formatted } = computeHours(form.checkIn, form.checkOut, parseInt(form.breakMins || '0', 10), form.status);
                  return <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">→ Net Worked Hours: {formatted}</p>;
                })()}
              </div>

              {/* Project */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Project Name <span className="text-rose-500">*</span></label>
                <select required value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className={inp}>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="__custom__">Other / Custom Project</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Task Category <span className="text-rose-500">*</span></label>
                <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Attendance Status <span className="text-rose-500">*</span></label>
                <select required value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TimesheetRow['status'] }))} className={inp}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              {/* Billable Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Billable to Client?</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mark if this work can be billed to the client.</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, billable: !f.billable }))}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${form.billable ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.billable ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Task Notes — required */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Notes / Work Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={form.taskNotes}
                  onChange={e => setForm(f => ({ ...f, taskNotes: e.target.value }))}
                  placeholder="Describe what you worked on today in detail. Min. 10 characters required."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">{form.taskNotes.length} chars {form.taskNotes.length < 10 && <span className="text-rose-500 font-semibold">· at least 10 required</span>}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingRow(null); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer">
                  {editingRow ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TimesheetsPage;
