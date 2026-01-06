import { create } from 'zustand';
import type { MaintenanceRequest, MaintenanceFilter } from '../types/maintenance';
import { maintenanceService } from '../services/maintenanceService';
import type { DocumentSnapshot } from 'firebase/firestore';

interface MaintenanceState {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  filter: MaintenanceFilter;
  selectedRequest: MaintenanceRequest | null;
  selectedRequests: string[];
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  
  // Actions
  setRequests: (requests: MaintenanceRequest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: MaintenanceFilter) => void;
  setSelectedRequest: (request: MaintenanceRequest | null) => void;
  setSelectedRequests: (ids: string[]) => void;
  toggleRequestSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Async actions
  fetchRequests: (hotelId: string, reset?: boolean) => Promise<void>;
  loadMoreRequests: (hotelId: string) => Promise<void>;
  createRequest: (data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<MaintenanceRequest>, changedBy: string) => Promise<void>;
  updateStatus: (id: string, status: string, changedBy: string) => Promise<void>;
  assignToStaff: (id: string, staffId: string, assignedBy: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: string, changedBy: string) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  requests: [],
  loading: false,
  error: null,
  filter: {},
  selectedRequest: null,
  selectedRequests: [],
  hasMore: true,
  lastDoc: null,
  
  setRequests: (requests) => set({ requests }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setSelectedRequests: (ids) => set({ selectedRequests: ids }),
  toggleRequestSelection: (id) => {
    const { selectedRequests } = get();
    set({
      selectedRequests: selectedRequests.includes(id)
        ? selectedRequests.filter(rid => rid !== id)
        : [...selectedRequests, id]
    });
  },
  clearSelection: () => set({ selectedRequests: [] }),
  
  fetchRequests: async (hotelId: string, reset = true) => {
    set({ loading: true, error: null });
    if (reset) set({ requests: [], lastDoc: null, hasMore: true });
    
    try {
      const { filter, lastDoc } = get();
      const { requests, lastDoc: newLastDoc } = await maintenanceService.getMaintenanceRequests(
        hotelId,
        {
          ...filter,
          limit: 20,
          startAfter: reset ? undefined : lastDoc || undefined
        }
      );
      
      const current = reset ? [] : get().requests;
      set({
        requests: [...current, ...requests],
        lastDoc: newLastDoc,
        loading: false,
        hasMore: requests.length === 20
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  loadMoreRequests: async (hotelId: string) => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;
    await get().fetchRequests(hotelId, false);
  },
  
  createRequest: async (data) => {
    set({ loading: true, error: null });
    try {
      await maintenanceService.createMaintenanceRequest(data);
      await get().fetchRequests(data.hotelId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateRequest: async (id, updates, changedBy) => {
    set({ loading: true, error: null });
    try {
      await maintenanceService.updateMaintenanceRequest(id, updates, changedBy);
      set(state => ({
        requests: state.requests.map(r =>
          r.id === id ? { ...r, ...updates } : r
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateStatus: async (id, status, changedBy) => {
    await get().updateRequest(id, { status: status as any }, changedBy);
  },
  
  assignToStaff: async (id, staffId, assignedBy) => {
    set({ loading: true });
    try {
      await maintenanceService.assignMaintenanceToStaff(id, staffId, assignedBy);
      set(state => ({
        requests: state.requests.map(r =>
          r.id === id ? { ...r, assignedTo: staffId } : r
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteRequest: async (id) => {
    set({ loading: true });
    try {
      await maintenanceService.deleteMaintenanceRequest(id);
      set(state => ({
        requests: state.requests.filter(r => r.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  bulkUpdateStatus: async (ids, status, changedBy) => {
    set({ loading: true });
    try {
      await Promise.all(
        ids.map(id => maintenanceService.updateMaintenanceStatus(id, status as any, changedBy))
      );
      set(state => ({
        requests: state.requests.map(r =>
          ids.includes(r.id) ? { ...r, status: status as any } : r
        ),
        loading: false,
        selectedRequests: []
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));