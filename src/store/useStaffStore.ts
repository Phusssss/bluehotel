import { create } from 'zustand';
import type { Staff, StaffFilter } from '../types';
import { staffService } from '../services/staffService';
import type { DocumentSnapshot } from 'firebase/firestore';

interface StaffState {
  staffs: Staff[];
  loading: boolean;
  error: string | null;
  filter: StaffFilter;
  selectedStaff: Staff | null;
  selectedStaffs: string[];
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  
  // Actions
  setStaffs: (staffs: Staff[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: StaffFilter) => void;
  setSelectedStaff: (staff: Staff | null) => void;
  setSelectedStaffs: (staffIds: string[]) => void;
  toggleStaffSelection: (staffId: string) => void;
  clearSelection: () => void;
  
  // Async actions
  fetchStaffs: (hotelId: string, reset?: boolean) => Promise<void>;
  loadMoreStaffs: (hotelId: string) => Promise<void>;
  createStaff: (staffData: Omit<Staff, 'id'>, createUserAccount?: boolean) => Promise<void>;
  updateStaff: (staffId: string, staffData: Partial<Staff>) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  restoreStaff: (staffId: string) => Promise<void>;
  bulkUpdateStatus: (staffIds: string[], status: string) => Promise<void>;
  assignPermissions: (staffId: string, permissions: string[]) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffs: [],
  loading: false,
  error: null,
  filter: {},
  selectedStaff: null,
  selectedStaffs: [],
  hasMore: true,
  lastDoc: null,
  
  setStaffs: (staffs) => set({ staffs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedStaff: (selectedStaff) => set({ selectedStaff }),
  setSelectedStaffs: (selectedStaffs) => set({ selectedStaffs }),
  toggleStaffSelection: (staffId) => {
    const { selectedStaffs } = get();
    const newSelection = selectedStaffs.includes(staffId)
      ? selectedStaffs.filter(id => id !== staffId)
      : [...selectedStaffs, staffId];
    set({ selectedStaffs: newSelection });
  },
  clearSelection: () => set({ selectedStaffs: [] }),
  
  fetchStaffs: async (hotelId: string, reset = true) => {
    set({ loading: true, error: null });
    if (reset) set({ staffs: [], lastDoc: null, hasMore: true });
    
    try {
      const { filter, lastDoc } = get();
      const { staffs, lastDoc: newLastDoc } = await staffService.getStaffs(hotelId, {
        ...filter,
        limit: 20,
        startAfter: reset ? undefined : lastDoc || undefined
      });
      
      const currentStaffs = reset ? [] : get().staffs;
      set({ 
        staffs: [...currentStaffs, ...staffs],
        lastDoc: newLastDoc,
        loading: false,
        hasMore: staffs.length === 20
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  loadMoreStaffs: async (hotelId: string) => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;
    await get().fetchStaffs(hotelId, false);
  },
  
  createStaff: async (staffData, createUserAccount = false) => {
    set({ loading: true, error: null });
    try {
      await staffService.createStaff(staffData, createUserAccount);
      await get().fetchStaffs(staffData.hotelId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateStaff: async (staffId: string, staffData) => {
    set({ loading: true, error: null });
    try {
      await staffService.updateStaff(staffId, staffData);
      const { staffs } = get();
      const updatedStaffs = staffs.map(staff => 
        staff.id === staffId ? { ...staff, ...staffData } : staff
      );
      set({ staffs: updatedStaffs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteStaff: async (staffId: string) => {
    set({ loading: true, error: null });
    try {
      await staffService.softDeleteStaff(staffId);
      const { staffs } = get();
      const filteredStaffs = staffs.filter(staff => staff.id !== staffId);
      set({ staffs: filteredStaffs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  restoreStaff: async (staffId: string) => {
    set({ loading: true, error: null });
    try {
      await staffService.restoreStaff(staffId);
      // Refresh the list
      const currentStaff = get().staffs.find(s => s.id === staffId);
      if (currentStaff) {
        await get().fetchStaffs(currentStaff.hotelId);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  bulkUpdateStatus: async (staffIds: string[], status: string) => {
    set({ loading: true, error: null });
    try {
      await staffService.bulkUpdateStaffs(staffIds, { status: status as any });
      const { staffs } = get();
      const updatedStaffs = staffs.map(staff => 
        staffIds.includes(staff.id!) ? { ...staff, status: status as any } : staff
      );
      set({ staffs: updatedStaffs, loading: false, selectedStaffs: [] });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  assignPermissions: async (staffId: string, permissions: string[]) => {
    set({ loading: true, error: null });
    try {
      await staffService.assignPermissions(staffId, permissions);
      const { staffs } = get();
      const updatedStaffs = staffs.map(staff => 
        staff.id === staffId ? { ...staff, permissions } : staff
      );
      set({ staffs: updatedStaffs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));