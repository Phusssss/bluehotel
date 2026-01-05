import { create } from 'zustand';
import type { Invoice } from '../types';
import { invoiceService } from '../services/invoiceService';

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  selectedInvoice: Invoice | null;
  
  // Actions
  setInvoices: (invoices: Invoice[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  
  // Async actions
  fetchInvoices: (hotelId: string) => Promise<void>;
  createInvoice: (invoiceData: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (invoiceId: string, invoiceData: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  selectedInvoice: null,
  
  setInvoices: (invoices) => set({ invoices }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedInvoice: (selectedInvoice) => set({ selectedInvoice }),
  
  fetchInvoices: async (hotelId: string) => {
    set({ loading: true, error: null });
    try {
      const invoices = await invoiceService.getInvoices(hotelId);
      set({ invoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      await invoiceService.createInvoice(invoiceData);
      await get().fetchInvoices(invoiceData.hotelId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateInvoice: async (invoiceId: string, invoiceData) => {
    set({ loading: true, error: null });
    try {
      await invoiceService.updateInvoice(invoiceId, invoiceData);
      const { invoices } = get();
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, ...invoiceData } : invoice
      );
      set({ invoices: updatedInvoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteInvoice: async (invoiceId: string) => {
    set({ loading: true, error: null });
    try {
      await invoiceService.deleteInvoice(invoiceId);
      const { invoices } = get();
      const filteredInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
      set({ invoices: filteredInvoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));