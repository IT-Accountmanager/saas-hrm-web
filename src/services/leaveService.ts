import { LeaveRequest, LeaveBalance, Holiday } from '../types';
import { INITIAL_LEAVE_REQUESTS, INITIAL_HOLIDAYS } from './mockDb';
import { getFromStorage, saveToStorage } from './storage';

export const leaveService = {
  getRequests: async (_orgId: string = 'org-1'): Promise<LeaveRequest[]> => {
    return getFromStorage<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
  },

  getEmployeeBalances: async (_employeeId?: string): Promise<LeaveBalance> => {
    return {
      employeeId: _employeeId || 'emp-1',
      annual: { total: 18, used: 6, remaining: 12 },
      casual: { total: 10, used: 2, remaining: 8 },
      sick: { total: 12, used: 3, remaining: 9 },
      maternityPaternity: { total: 90, used: 0, remaining: 90 },
    };
  },

  applyLeave: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const list = getFromStorage<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
    const newRequest: LeaveRequest = {
      id: `lev-${Date.now()}`,
      organizationId: data.organizationId || 'org-1',
      employeeId: data.employeeId || 'emp-1',
      employeeCode: data.employeeCode || 'EMP001',
      employeeName: data.employeeName || 'Rahul Sharma',
      employeeAvatar: data.employeeAvatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      department: data.department || 'Engineering',
      leaveType: (data.leaveType as any) || 'Casual',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date().toISOString().split('T')[0],
      days: data.days || 1,
      reason: data.reason || 'Personal leave',
      status: data.status || 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      approverName: data.approverName || 'Amit Verma',
    };
    const updated = [newRequest, ...list];
    saveToStorage('leave_requests', updated);
    return newRequest;
  },

  updateStatus: async (requestId: string, status: 'Approved' | 'Rejected', approverName?: string, rejectionReason?: string): Promise<LeaveRequest> => {
    const list = getFromStorage<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error('Request not found');
    list[index] = {
      ...list[index],
      status,
      approverName: approverName || list[index].approverName || 'HR Admin',
      approvedOrRejectedDate: new Date().toISOString().split('T')[0],
      rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
    };
    saveToStorage('leave_requests', list);
    return list[index];
  },

  deleteRequest: async (requestId: string): Promise<void> => {
    const list = getFromStorage<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
    const filtered = list.filter(r => r.id !== requestId);
    saveToStorage('leave_requests', filtered);
  },

  getHolidays: async (): Promise<Holiday[]> => {
    return getFromStorage<Holiday[]>('holidays', INITIAL_HOLIDAYS);
  },

  addHoliday: async (holidayData: Partial<Holiday>): Promise<Holiday> => {
    const list = getFromStorage<Holiday[]>('holidays', INITIAL_HOLIDAYS);
    const dateObj = new Date(holidayData.date || new Date().toISOString().split('T')[0]);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const newHoliday: Holiday = {
      id: `hol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: holidayData.organizationId || 'org-1',
      name: holidayData.name || 'Company Holiday',
      date: holidayData.date || new Date().toISOString().split('T')[0],
      day: holidayData.day || dayName,
      type: holidayData.type || 'Public',
      location: holidayData.location || 'Global / All Offices',
      description: holidayData.description || '',
    };

    const updated = [...list, newHoliday];
    saveToStorage('holidays', updated);
    return newHoliday;
  },

  bulkAddHolidays: async (holidays: Partial<Holiday>[]): Promise<Holiday[]> => {
    const list = getFromStorage<Holiday[]>('holidays', INITIAL_HOLIDAYS);
    const newItems: Holiday[] = holidays.map((h, idx) => {
      const dateObj = new Date(h.date || new Date().toISOString().split('T')[0]);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      return {
        id: `hol-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: h.organizationId || 'org-1',
        name: h.name || 'Imported Holiday',
        date: h.date || new Date().toISOString().split('T')[0],
        day: h.day || dayName,
        type: (h.type as any) || 'Public',
        location: h.location || 'Global / All Offices',
        description: h.description || 'Imported from Excel',
      };
    });

    const updated = [...list, ...newItems];
    saveToStorage('holidays', updated);
    return newItems;
  },

  updateHoliday: async (id: string, holidayData: Partial<Holiday>): Promise<Holiday> => {
    const list = getFromStorage<Holiday[]>('holidays', INITIAL_HOLIDAYS);
    const index = list.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Holiday not found');

    list[index] = { ...list[index], ...holidayData };
    saveToStorage('holidays', list);
    return list[index];
  },

  deleteHoliday: async (id: string): Promise<void> => {
    const list = getFromStorage<Holiday[]>('holidays', INITIAL_HOLIDAYS);
    const filtered = list.filter(h => h.id !== id);
    saveToStorage('holidays', filtered);
  },

  getLeaveOverviewStats: async () => {
    const requests = await leaveService.getRequests();
    return {
      totalOnLeaveToday: 8,
      annual: 4,
      sick: 2,
      casual: 2,
      pendingRequests: requests.filter(r => r.status === 'Pending').length,
    };
  }
};
