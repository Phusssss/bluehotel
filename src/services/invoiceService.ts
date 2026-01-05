import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { Invoice } from '../types';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  // Get all invoices
  async getInvoices(hotelId: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId)
      );

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Invoice));
      
      return invoices.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  },

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Invoice;
      }
      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  },

  // Create invoice
  async createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invoiceData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Update invoice
  async updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);
      await updateDoc(docRef, invoiceData);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};