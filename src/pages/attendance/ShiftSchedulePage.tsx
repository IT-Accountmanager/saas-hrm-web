import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { useAppStore } from '../../store/useAppStore';
import { ShiftSchedule } from '../../types';
import { Card, CardHeader, CardTitle, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { PageHeaderCard } from '../../components/common/PageHeaderCard';
import { Clock, Plus, Sparkles, Trash2, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';

export const ShiftSchedulePage: React.FC = () => {
  const { currentRole } = useAppStore();
  const isAdminOrOwner = ['org_admin', 'org_owner', 'saas_owner', 'hr_admin'].includes(currentRole);

  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for creating/editing shift
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [breakMins, setBreakMins] = useState(60);
  const [graceMins, setGraceMins] = useState(15);
  const [shiftColor, setShiftColor] = useState('#3B82F6');

  const loadShifts = async () => {
    setLoading(true);
    try {
      const list = await attendanceService.getShiftSchedules();
      setShifts(list);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName) return;

    try {
      await attendanceService.createShiftSchedule({
        name: shiftName,
        startTime,
        endTime,
        breakDurationMinutes: Number(breakMins),
        graceTimeMinutes: Number(graceMins),
        color: shiftColor,
      });

      setIsAddModalOpen(false);
      setShiftName('');
      setStartTime('09:00 AM');
      setEndTime('06:00 PM');
      setBreakMins(60);
      setGraceMins(15);
      setShiftColor('#3B82F6');
      await loadShifts();
    } catch (err) {
      console.error('Failed to create shift schedule:', err);
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the shift "${name}"?`)) {
      try {
        await attendanceService.deleteShiftSchedule(id);
        await loadShifts();
      } catch (err) {
        console.error('Failed to delete shift schedule:', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderCard
        title="Shift Management & Work Schedules"
        subtitle="Define organizational shift timings, grace periods, and break allowances for employees."
        icon={Clock}
        badge={<Badge variant="primary">{shifts.length} Active Schedules</Badge>}
        actions={
          isAdminOrOwner ? (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddModalOpen(true)}
              className="font-bold shadow-xs"
            >
              Create New Shift
            </Button>
          ) : null
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Total Shifts</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{shifts.length} Active</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Standard Grace Window</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">15 Minutes</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Default Break Time</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">60 Mins / Day</div>
          </div>
        </div>
      </div>

      {/* Shift Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card key={shift.id} hoverEffect className="space-y-4 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold"
                  style={{ backgroundColor: shift.color || '#3B82F6' }}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{shift.name}</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="primary">Active</Badge>

                {isAdminOrOwner && (
                  <button
                    onClick={() => handleDeleteShift(shift.id, shift.name)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Delete Shift"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Shift Hours:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Break Duration:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {shift.breakDurationMinutes} mins
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Late Grace Window:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {shift.graceTimeMinutes} mins
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Shift Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Work Shift Schedule"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input
            label="Shift Schedule Name"
            placeholder="e.g. Night Shift / Rotational Shift B"
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              placeholder="e.g. 09:00 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              placeholder="e.g. 06:00 PM"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Break Duration (Minutes)"
              type="number"
              value={breakMins}
              onChange={(e) => setBreakMins(Number(e.target.value))}
              required
            />
            <Input
              label="Late Grace Time (Minutes)"
              type="number"
              value={graceMins}
              onChange={(e) => setGraceMins(Number(e.target.value))}
              required
            />
          </div>

          <Select
            label="Shift Badge Theme Color"
            value={shiftColor}
            onChange={(e) => setShiftColor(e.target.value)}
            options={[
              { value: '#3B82F6', label: 'Blue (Standard General)' },
              { value: '#10B981', label: 'Emerald (Morning Early)' },
              { value: '#8B5CF6', label: 'Purple (Evening Shift)' },
              { value: '#F59E0B', label: 'Amber (Rotational Shift)' },
              { value: '#EC4899', label: 'Pink (Night Shift)' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save & Activate Shift</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ShiftSchedulePage;
