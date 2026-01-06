import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { MaintenanceRequest, MaintenanceFilter, MaintenanceHistory } from '../types/maintenance';
import { formatFirebaseError } from '../utils/errorUtils';

const COLLECTION_NAME = 'maintenance';

export const maintenanceService = {
  // Get maintenance requests with pagination
  async getMaintenanceRequests(
    hotelId: string,
    filter?: MaintenanceFilter & { limit?: number; startAfter?: DocumentSnapshot }
  ): Promise<{
    requests: MaintenanceRequest[];
    lastDoc: DocumentSnapshot | null;
  }> {
    try {
      let q: any = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('isDeleted', '!=', true),
        orderBy('isDeleted'),
        orderBy('priority'),
        orderBy('createdAt', 'desc')
      );

      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }
      if (filter?.priority) {
        q = query(q, where('priority', '==', filter.priority));
      }
      if (filter?.assignedTo) {
        q = query(q, where('assignedTo', '==', filter.assignedTo));
      }
      if (filter?.roomId) {
        q = query(q, where('roomId', '==', filter.roomId));
      }

      if (filter?.limit) {
        q = query(q, limit(filter.limit));
      }
      if (filter?.startAfter) {
        q = query(q, startAfter(filter.startAfter));
      }

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        startedAt: doc.data().startedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        assignedAt: doc.data().assignedAt?.toDate(),
        requiredDate: doc.data().requiredDate?.toDate(),
      } as MaintenanceRequest));

      // Client-side search filter
      let filtered = requests;
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = requests.filter(req =>
          req.title.toLowerCase().includes(searchLower) ||
          req.description.toLowerCase().includes(searchLower) ||
          req.roomId.toLowerCase().includes(searchLower)
        );
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      return { requests: filtered, lastDoc };
    } catch (error) {
      console.error('Error getting maintenance requests:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Get single maintenance request
  async getMaintenanceById(id: string): Promise<MaintenanceRequest | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        startedAt: data.startedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        assignedAt: data.assignedAt?.toDate(),
        requiredDate: data.requiredDate?.toDate(),
      } as MaintenanceRequest;
    } catch (error) {
      console.error('Error getting maintenance:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Create maintenance request
  async createMaintenanceRequest(
    data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        isDeleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        requiredDate: data.requiredDate ? Timestamp.fromDate(data.requiredDate) : null,
        history: [{
          id: `hist_${Date.now()}`,
          timestamp: Timestamp.now(),
          action: 'created',
          changedBy: data.requestedBy,
          changes: []
        }]
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating maintenance:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Update maintenance request
  async updateMaintenanceRequest(
    id: string,
    updates: Partial<MaintenanceRequest>,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Get current document for history
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data();
      
      // Build history entry
      const historyEntry: MaintenanceHistory = {
        id: `hist_${Date.now()}`,
        timestamp: Timestamp.now() as any,
        action: 'status_change',
        changedBy,
        changes: Object.entries(updates).map(([field, value]) => ({
          field,
          oldValue: currentData?.[field] || null,
          newValue: value
        })),
        reason
      };

      // Convert dates to Timestamps
      const processedUpdates: any = { ...updates };
      if (updates.requiredDate) {
        processedUpdates.requiredDate = Timestamp.fromDate(updates.requiredDate);
      }
      if (updates.startedAt) {
        processedUpdates.startedAt = Timestamp.fromDate(updates.startedAt);
      }
      if (updates.completedAt) {
        processedUpdates.completedAt = Timestamp.fromDate(updates.completedAt);
      }
      if (updates.assignedAt) {
        processedUpdates.assignedAt = Timestamp.fromDate(updates.assignedAt);
      }

      await updateDoc(docRef, {
        ...processedUpdates,
        updatedAt: Timestamp.now(),
        history: currentData?.history
          ? [...currentData.history, historyEntry]
          : [historyEntry]
      });
    } catch (error) {
      console.error('Error updating maintenance:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Update status (shorthand)
  async updateMaintenanceStatus(
    id: string,
    status: 'pending' | 'in-progress' | 'completed',
    changedBy: string,
    notes?: string
  ): Promise<void> {
    const updates: any = { status };
    
    if (status === 'in-progress') {
      updates.startedAt = new Date();
    }
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    await this.updateMaintenanceRequest(id, updates, changedBy, notes);
  },

  // Assign maintenance to staff
  async assignMaintenanceToStaff(
    id: string,
    staffId: string,
    assignedBy: string
  ): Promise<void> {
    await this.updateMaintenanceRequest(
      id,
      { assignedTo: staffId, assignedAt: new Date() },
      assignedBy,
      `Assigned to ${staffId}`
    );
  },

  // Add cost to maintenance
  async addMaintenanceCost(
    id: string,
    amount: number,
    category: string,
    vendor?: string,
    changedBy?: string
  ): Promise<void> {
    const current = await this.getMaintenanceById(id);
    await this.updateMaintenanceRequest(
      id,
      {
        actualCost: (current?.actualCost || 0) + amount,
        costCategory: category as any,
        vendor
      },
      changedBy || 'system',
      `Cost added: $${amount}`
    );
  },

  // Get maintenance stats for hotel
  async getMaintenanceStats(hotelId: string): Promise<any> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('isDeleted', '!=', true)
      );
      
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      } as MaintenanceRequest));

      const stats = {
        totalRequests: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
        urgent: requests.filter(r => r.priority === 'urgent').length,
        averageResolutionTime: calculateAvgResolutionTime(requests),
        totalCosts: requests.reduce((sum, r) => sum + (r.actualCost || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting maintenance stats:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Soft delete
  async deleteMaintenanceRequest(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        isDeleted: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      throw new Error(formatFirebaseError(error));
    }
  }
};

function calculateAvgResolutionTime(requests: MaintenanceRequest[]): number {
  const completed = requests.filter(r =>
    r.status === 'completed' && r.createdAt && r.completedAt
  );
  if (completed.length === 0) return 0;

  const totalHours = completed.reduce((sum, r) => {
    const created = new Date(r.createdAt).getTime();
    const finished = new Date(r.completedAt!).getTime();
    return sum + (finished - created) / (1000 * 60 * 60);
  }, 0);

  return Math.round(totalHours / completed.length);
}