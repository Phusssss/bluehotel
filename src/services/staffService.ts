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
  DocumentSnapshot
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { formatFirebaseError } from '../utils/errorUtils';
import type { Staff, StaffFilter, HotelMembership } from '../types';

const COLLECTION_NAME = 'staffs';

export const staffService = {
  // Get staffs with pagination
  async getStaffs(
    hotelId: string, 
    filter?: StaffFilter & { limit?: number; startAfter?: DocumentSnapshot }
  ): Promise<{ staffs: Staff[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('isDeleted', '!=', true),
        orderBy('isDeleted'),
        orderBy('firstName')
      );

      if (filter?.position) {
        q = query(q, where('position', '==', filter.position));
      }

      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }

      if (filter?.limit) {
        q = query(q, limit(filter.limit));
      }

      if (filter?.startAfter) {
        q = query(q, startAfter(filter.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const staffs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Staff));

      // Client-side search filter
      let filteredStaffs = staffs;
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        filteredStaffs = staffs.filter(staff =>
          staff.firstName.toLowerCase().includes(searchLower) ||
          staff.lastName.toLowerCase().includes(searchLower) ||
          staff.email.toLowerCase().includes(searchLower)
        );
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { staffs: filteredStaffs, lastDoc };
    } catch (error) {
      console.error('Error getting staffs:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Get staff by ID
  async getStaffById(staffId: string): Promise<Staff | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, staffId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Staff;
      }
      return null;
    } catch (error) {
      console.error('Error getting staff:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Create staff with optional user account
  async createStaff(
    staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>,
    createUserAccount = false
  ): Promise<string> {
    try {
      // Check for duplicate email in same hotel
      const existingStaffs = await getDocs(
        query(
          collection(db, COLLECTION_NAME),
          where('hotelId', '==', staffData.hotelId),
          where('email', '==', staffData.email),
          where('isDeleted', '!=', true)
        )
      );

      if (!existingStaffs.empty) {
        throw new Error(`Email ${staffData.email} đã được sử dụng trong khách sạn này`);
      }

      let userId: string | undefined;

      // Create Firebase Auth user if requested
      if (createUserAccount) {
        try {
          const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            staffData.email,
            tempPassword
          );
          userId = userCredential.user.uid;

          // Send email verification
          await sendEmailVerification(userCredential.user);

          // Update user document with membership
          const membership: HotelMembership = {
            hotelId: staffData.hotelId,
            role: staffData.role,
            permissions: staffData.permissions
          };

          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const memberships = userData.memberships || [];
            memberships.push(membership);
            await updateDoc(userDocRef, { memberships });
          } else {
            await updateDoc(userDocRef, {
              email: staffData.email,
              memberships: [membership],
              isActive: true,
              createdAt: new Date()
            });
          }
        } catch (authError) {
          console.error('Error creating user account:', authError);
          // Continue with staff creation even if user creation fails
        }
      }

      // Create staff document
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...staffData,
        userId,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        audit: []
      });

      // Update user document with staffId if user was created
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const memberships = userData.memberships || [];
            const membershipIndex = memberships.findIndex(
              (m: HotelMembership) => m.hotelId === staffData.hotelId
            );
            if (membershipIndex >= 0) {
              memberships[membershipIndex].staffId = docRef.id;
              await updateDoc(userDocRef, { memberships });
            }
          }
        } catch (updateError) {
          console.error('Error updating user with staffId:', updateError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Update staff
  async updateStaff(
    staffId: string,
    updates: Partial<Staff>,
    modifiedBy?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, staffId);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Không tìm thấy nhân viên');
      }

      const currentData = currentDoc.data() as Staff;
      
      // Create audit entry
      const auditEntry = {
        id: Math.random().toString(36).substr(2, 9),
        action: 'update',
        byUserId: modifiedBy || 'system',
        timestamp: new Date(),
        changes: {} as Record<string, { from: any; to: any }>
      };

      // Track changes
      Object.keys(updates).forEach(key => {
        if (currentData[key as keyof Staff] !== updates[key as keyof Staff]) {
          auditEntry.changes[key] = {
            from: currentData[key as keyof Staff],
            to: updates[key as keyof Staff]
          };
        }
      });

      const updatedAudit = [...(currentData.audit || []), auditEntry];

      await updateDoc(docRef, {
        ...updates,
        audit: updatedAudit,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Soft delete staff
  async softDeleteStaff(staffId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, staffId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Restore staff
  async restoreStaff(staffId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, staffId);
      await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error restoring staff:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Assign permissions
  async assignPermissions(staffId: string, permissions: string[]): Promise<void> {
    try {
      await this.updateStaff(staffId, { permissions });
    } catch (error) {
      console.error('Error assigning permissions:', error);
      throw new Error(formatFirebaseError(error));
    }
  },

  // Bulk operations
  async bulkUpdateStaffs(staffIds: string[], updates: Partial<Staff>): Promise<void> {
    try {
      const promises = staffIds.map(id => this.updateStaff(id, updates));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk updating staffs:', error);
      throw new Error(formatFirebaseError(error));
    }
  }
};