import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Palmtree,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Modal, Input, Select, Button, Badge } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { leaveService } from '../../services/leaveService';
import { useAppStore } from '../../store/useAppStore';
import { Holiday } from '../../types';

interface HolidayDisplayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  day: string;
  type: 'Public Holiday' | 'Company Observance' | 'Optional / Floating';
  location: string;
  isUpcoming: boolean;
}

export const HolidaysPage: React.FC = () => {
  const { currentRole } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  const [selectedYear, setSelectedYear] = useState('2024');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rawHolidays, setRawHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for New Holiday
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2024-09-02');
  const [newType, setNewType] = useState<'public' | 'company' | 'floating'>('public');
  const [newScope, setNewScope] = useState('Global / All Offices');

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
    const year = isValidDate ? d.getFullYear().toString() : '2024';
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
      location: 'Global / All Offices',
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
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      await loadHolidays();
    } catch (err) {
      console.error('Failed to create holiday:', err);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the holiday "${name}"?`)) {
      try {
        await leaveService.deleteHoliday(id);
        await loadHolidays();
      } catch (err) {
        console.error('Failed to delete holiday:', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Cloudy Wave Design */}
      <PageHeaderCard
        title="Company Holiday Calendar"
        subtitle="Official paid public holidays, regional observances, and floating time-off schedules."
        icon={CalendarIcon}
        badge={<Badge variant="primary">{filteredHolidays.length} Days in {selectedYear === 'All' ? 'All Years' : selectedYear}</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold focus:outline-none backdrop-blur-xs cursor-pointer"
            >
              <option value="2024">Calendar 2024</option>
              <option value="2025">Calendar 2025</option>
              <option value="2026">Calendar 2026</option>
              <option value="All">All Years</option>
            </select>

            {isAdminOrOwner && (
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="font-bold shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Holiday
              </Button>
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
              Paid company holiday observed across all departments. Support desks operate on essential holiday protocols.
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

      {/* Add Holiday Modal for Org Owner / Admin */}
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
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Holiday</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default HolidaysPage;
