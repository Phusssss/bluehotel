import { create } from 'zustand';
import { alertService } from '../services/alertService';
import type { AlertItem } from '../types/dashboard';

interface AlertState {
  alerts: AlertItem[];
  loading: boolean;
  error: string | null;

  // Actions
  setAlerts: (alerts: AlertItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchAlerts: (hotelId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  viewAlert: (alertId: string) => Promise<void>;
  removeAlert: (alertId: string) => void;
  clearErrors: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  loading: false,
  error: null,

  setAlerts: (alerts) => set({ alerts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchAlerts: async (hotelId: string) => {
    set({ loading: true, error: null });
    try {
      const alerts = await alertService.getAlerts(hotelId);
      set({ alerts, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Lỗi tải cảnh báo', 
        loading: false 
      });
    }
  },

  dismissAlert: async (alertId: string) => {
    try {
      await alertService.dismissAlert(alertId);
      // Remove from local state
      const { alerts } = get();
      set({ alerts: alerts.filter(a => a.id !== alertId) });
    } catch (error: any) {
      set({ error: error.message || 'Lỗi ẩn cảnh báo' });
      throw error;
    }
  },

  viewAlert: async (alertId: string) => {
    try {
      await alertService.markAsViewed(alertId);
      // Update alert in local state
      const { alerts } = get();
      const updated = alerts.map(a => 
        a.id === alertId ? { ...a, viewed: true } : a
      );
      set({ alerts: updated });
    } catch (error: any) {
      set({ error: error.message || 'Lỗi xem cảnh báo' });
      throw error;
    }
  },

  removeAlert: (alertId: string) => {
    const { alerts } = get();
    set({ alerts: alerts.filter(a => a.id !== alertId) });
  },

  clearErrors: () => set({ error: null })
}));
