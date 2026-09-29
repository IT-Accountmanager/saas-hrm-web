import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  MapPin,
  Clock,
  Download,
  Trash2,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Modal, Input, Select, Button, Badge } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { leaveService } from '../../services/leaveService';
import { useAppStore } from '../../store/useAppStore';
import { Holiday } from '../../types';
import { downloadSampleHolidayExcelTemplate, parseHolidayFile, ParsedHolidayRow } from '../../utils/excelParser';

interface HolidayDisplayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  day: string;
  type: 'Public Holiday' | 'Company Observance' | 'Optional / Floating';
  location: string;
  description?: string;
  isUpcoming: boolean;
}

export const HolidaysPage: React.FC = () => {
  const { currentRole } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  const [selectedYear, setSelectedYear] = useState('2026');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawHolidays, setRawHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for New Holiday
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2025-01-01');
  const [newType, setNewType] = useState<'public' | 'company' | 'floating'>('public');
  const [newScope, setNewScope] = useState('Global / All Offices');
  const [newDesc, setNewDesc] = useState('');

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedHolidayRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importStats, setImportStats] = useState<{ valid: number; invalid: number }>({ valid: 0, invalid: 0 });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await leaveService.getHolidays();
      setRawHolidays(data);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const formattedHolidays: HolidayDisplayItem[] = rawHolidays.map((h) => {
    const d = new Date(h.date);
    const isValidDate = !isNaN(d.getTime());
    const year = isValidDate ? d.getFullYear().toString() : '2025';
    const dayName = h.day || (isValidDate ? d.toLocaleDateString('en-US', { weekday: 'long' }) : 'Monday');
    const formattedDateStr = isValidDate
      ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : h.date;

    let displayType: 'Public Holiday' | 'Company Observance' | 'Optional / Floating' = 'Public Holiday';
    if (h.type === 'Company') displayType = 'Company Observance';
    else if (h.type === 'Optional') displayType = 'Optional / Floating';

    const isUpcoming = h.date >= todayStr || year >= '2025';

    return {
      id: h.id,
      name: h.name,
      date: h.date,
      formattedDate: formattedDateStr,
      day: dayName,
      type: displayType,
      location: h.location || 'Global / All Offices',
      description: h.description,
      isUpcoming,
    };
  });

  const filteredHolidays = formattedHolidays.filter((h) => {
    if (selectedYear === 'All') return true;
    return h.date.startsWith(selectedYear);
  });

  const upcomingHolidays = filteredHolidays.filter((h) => h.isUpcoming);
  const nextHoliday = upcomingHolidays[0] || filteredHolidays[0];

  const handleAddHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    let apiType: 'Public' | 'Company' | 'Optional' = 'Public';
    if (newType === 'company') apiType = 'Company';
    if (newType === 'floating') apiType = 'Optional';

    try {
      await leaveService.addHoliday({
        name: newTitle,
        date: newDate,
        type: apiType,
        location: newScope,
        description: newDesc,
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      showToast(`Holiday "${newTitle}" created successfully!`);
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
      console.error('Failed to parse file:', err);
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

      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedRows([]);
      showToast(`Successfully imported ${validItems.length} holidays from Excel!`);
      await loadHolidays();
    } catch (err) {
      console.error('Bulk import failed:', err);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the holiday "${name}"?`)) {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Cloudy Wave Design */}
      <PageHeaderCard
        title="Company Holiday Management"
        subtitle="Official paid public holidays, regional observances, and floating time-off schedules."
        icon={CalendarIcon}
        badge={<Badge variant="primary">{filteredHolidays.length} Days in {selectedYear === 'All' ? 'All Years' : selectedYear}</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold focus:outline-none backdrop-blur-xs cursor-pointer"
            >
              <option value="2025">Calendar 2025</option>
              <option value="2026">Calendar 2026</option>
              <option value="2024">Calendar 2024</option>
              <option value="All">All Years</option>
            </select>

            {isAdminOrOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(true)}
                  className="font-bold shadow-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Import Excel</span>
                </Button>

                <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="font-bold shadow-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Holiday
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Next Upcoming Holiday Highlight Card */}
      {nextHoliday && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Next Upcoming Holiday
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {nextHoliday.name} — {nextHoliday.formattedDate} ({nextHoliday.day})
            </h2>
            <p className="text-blue-100 text-xs max-w-xl">
              {nextHoliday.description || 'Paid company holiday observed across all departments. Support desks operate on essential holiday protocols.'}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20 backdrop-blur-xs min-w-[120px]">
              <span className="text-2xl font-black block leading-none">{upcomingHolidays.length}</span>
              <span className="text-[11px] text-blue-200 font-medium">Holidays Left</span>
            </div>
          </div>
        </div>
      )}

      {/* Holidays List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHolidays.map((h) => (
          <div
            key={h.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all relative group ${h.isUpcoming
              ? 'border-blue-200 dark:border-blue-900/50 hover:shadow-md'
              : 'border-slate-200 dark:border-slate-800 opacity-75'
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.type === 'Public Holiday'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                    : h.type === 'Company Observance'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                >
                  {h.type}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{h.name}</h3>
                {h.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {h.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {h.isUpcoming ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3" /> Upcoming
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Passed</span>
                )}

                {isAdminOrOwner && (
                  <button
                    onClick={() => handleDeleteHoliday(h.id, h.name)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                {h.formattedDate} ({h.day})
              </div>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {h.location}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Add Holiday Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Company Holiday"
      >
        <form onSubmit={handleAddHolidaySubmit} className="space-y-4">
          <Input
            label="Holiday Title / Name"
            placeholder="e.g. Founder's Day / Labor Day"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Input
            label="Holiday Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
          <Select
            label="Holiday Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            options={[
              { value: 'public', label: 'Public Holiday (Mandatory Paid)' },
              { value: 'company', label: 'Company Observance' },
              { value: 'floating', label: 'Optional / Floating Holiday' },
            ]}
          />
          <Select
            label="Office Scope"
            value={newScope}
            onChange={(e) => setNewScope(e.target.value)}
            options={[
              { value: 'Global / All Offices', label: 'Global / All Offices' },
              { value: 'US Offices', label: 'US Offices Only' },
              { value: 'EU Offices', label: 'EU Offices Only' },
              { value: 'APAC Offices', label: 'APAC Offices Only' },
              { value: 'India Offices', label: 'India Offices Only' },
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Policy Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Paid holiday for all full-time staff. Emergency support on call."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Holiday</Button>
          </div>
        </form>
      </Modal>

      {/* Excel / CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setParsedRows([]);
        }}
        title="Import Holidays from Excel / CSV"
      >
        <div className="space-y-4">
          <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">
                Bulk Holiday Import Engine
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Upload your company holiday calendar file (.xlsx, .csv, .tsv). You can download our sample Excel template pre-formatted with date validation.
              </p>
              <button
                type="button"
                onClick={downloadSampleHolidayExcelTemplate}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline mt-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Excel / CSV Template</span>
              </button>
            </div>
          </div>

          {/* Upload Input Area */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-900/50">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {importFile ? importFile.name : 'Click or drag & drop Excel / CSV file here'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Supports .csv, .xlsx, .xls (Columns: Name, Date, Type, Scope, Description)
            </span>
          </div>

          {/* Parsing State & Results Preview */}
          {isParsing && (
            <div className="text-center py-4 text-xs font-semibold text-slate-500">
              Parsing Excel file...
            </div>
          )}

          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Preview Parsed Holidays ({parsedRows.length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-bold text-[11px]">
                    {importStats.valid} Valid
                  </span>
                  {importStats.invalid > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[11px]">
                      {importStats.invalid} Invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Scope</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'bg-white dark:bg-slate-900' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                        <td className="p-2 font-mono">{r.date}</td>
                        <td className="p-2">{r.type}</td>
                        <td className="p-2 text-slate-500">{r.location}</td>
                        <td className="p-2">
                          {r.isValid ? (
                            <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold text-[10px] flex items-center gap-1" title={r.errorReason}>
                              <AlertCircle className="w-3 h-3" /> {r.errorReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setParsedRows([]);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={importStats.valid === 0}
              onClick={handleBulkImportConfirm}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Import {importStats.valid} Holidays
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HolidaysPage;
