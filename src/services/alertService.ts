import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { AlertItem } from '../types/dashboard';

export const alertService = {
  async getAlerts(hotelId: string): Promise<AlertItem[]> {
    try {
      const alertsRef = collection(db, 'alerts');
      const q = query(
        alertsRef,
        where('hotelId', '==', hotelId),
        where('dismissed', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as AlertItem[];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  },

  async dismissAlert(alertId: string): Promise<void> {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, {
        dismissed: true,
        dismissedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw new Error('Không thể ẩn cảnh báo');
    }
  },

  async markAsViewed(alertId: string): Promise<void> {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, {
        viewed: true,
        viewedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking alert as viewed:', error);
      throw new Error('Không thể đánh dấu đã xem');
    }
  }
};