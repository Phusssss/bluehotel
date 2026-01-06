# 🔧 Maintenance Management - Implementation Guide

**Status:** ❌ 0% Complete (Types defined, needs full implementation)  
**Priority:** Critical  
**Estimated Effort:** 3-4 days  
**Dependencies:** Staff Management, Room Management  
**Blocks:** Reservation system (room status management), Analytics

---

## 1. Current State Analysis

### ✅ What Already Exists

#### Type Definitions
- ✅ **MaintenancePriority:** 'low' | 'medium' | 'high' | 'urgent'
- ✅ **MaintenanceStatus:** 'pending' | 'in-progress' | 'completed'
- ✅ **RoomStatus** includes 'maintenance' status

#### Service/Store Stubs
- ❌ No maintenanceService.ts
- ❌ No useMaintenanceStore.ts
- ❌ Only stub page `src/pages/Maintenance.tsx`

### ❌ What's Missing

Complete implementation from backend to frontend:
1. Type definitions (extended)
2. Firestore service (CRUD, filtering, status tracking)
3. Zustand store (state management)
4. UI components (list, form, detail view)
5. Page implementation
6. Integration with rooms and staff

---

## 2. Feature Requirements

### User Stories

**As a Hotel Manager, I want to:**
1. Report maintenance issues for rooms
2. Set priority levels for urgent repairs
3. Assign maintenance tasks to specific staff
4. Track maintenance status (pending → in-progress → completed)
5. Monitor maintenance costs
6. View maintenance history per room
7. See maintenance timeline/dashboard
8. Receive alerts for urgent maintenance

**As Maintenance Staff, I want to:**
1. See my assigned maintenance tasks
2. Update task status
3. Add notes/progress updates
4. Upload photos of work completed
5. View room details related to the task

**As Admin, I want to:**
1. View all maintenance requests across hotel
2. See completion rates and response times
3. Track total maintenance costs
4. Generate maintenance reports
5. Manage maintenance history
6. Schedule preventive maintenance

---

## 3. Architecture & Data Structure

### Extended Maintenance Interfaces

```typescript
// src/types/maintenance.ts (NEW FILE)

import type { BaseEntity } from './common';
import type { MaintenancePriority, MaintenanceStatus } from './common';

export interface MaintenanceRequest extends BaseEntity {
  hotelId: string;
  roomId: string; // Required - which room has the issue
  title: string; // e.g., "Broken AC unit"
  description: string;
  
  category: MaintenanceCategory; // plumbing, electrical, hvac, etc.
  priority: MaintenancePriority; // low, medium, high, urgent
  status: MaintenanceStatus; // pending, in-progress, completed
  
  // Assignment
  assignedTo?: string; // staffId of assigned maintenance person
  requestedBy: string; // staffId or userId who reported
  assignedAt?: Date;
  
  // Dates
  requiredDate?: Date; // when repair is needed by
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // hours
  
  // Costs
  estimatedCost?: number;
  actualCost?: number;
  costCategory?: 'in-house' | 'contractor' | 'parts' | 'labor';
  vendor?: string; // external vendor if used
  invoiceNumber?: string;
  
  // Tracking
  notes?: string;
  attachments?: MaintenanceAttachment[]; // before/after photos
  history?: MaintenanceHistory[];
  isDeleted?: boolean;
  
  // Room impact
  roomStatusBefore?: string; // room status before maintenance
  roomStatusAfter?: string; // room status after maintenance
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceCategory {
  type: 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 
        'appliance' | 'structural' | 'cleaning' | 'other';
  label: string;
}

export interface MaintenanceAttachment {
  id: string;
  url: string;
  type: 'photo' | 'document' | 'invoice';
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface MaintenanceHistory {
  id: string;
  timestamp: Date;
  action: 'created' | 'assigned' | 'status_change' | 'cost_added' | 
          'attachment_added' | 'note_added';
  changedBy: string; // staffId
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
}

export interface MaintenanceFilter {
  search?: string; // room number or title
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: string;
  assignedTo?: string; // staffId filter
  roomId?: string;
  dateRange?: [Date, Date];
}

export interface MaintenanceStats {
  totalRequests: number;
  pending: number;
  inProgress: number;
  completed: number;
  urgent: number;
  averageResolutionTime: number; // hours
  totalCosts: number;
  costByCategory: Record<string, number>;
}

// For Firestore queries
export interface MaintenanceQueryOptions {
  limit?: number;
  startAfter?: any;
  orderBy?: 'priority' | 'createdAt' | 'completedAt';
}
```

### Firestore Collections

**maintenance**
```
/maintenance/{maintenanceId}
  - hotelId (indexed)
  - roomId (indexed) - denormalized room number for display
  - title, description
  - category
  - priority (indexed)
  - status (indexed)
  - assignedTo (indexed, staffId)
  - requestedBy (staffId)
  - requiredDate
  - startedAt, completedAt
  - estimatedCost, actualCost
  - costCategory, vendor, invoiceNumber
  - notes, attachments
  - history (embedded array)
  - roomStatusBefore, roomStatusAfter
  - isDeleted
  - createdAt, updatedAt

Indexes:
- (hotelId, status, priority) - for dashboard
- (hotelId, assignedTo) - for staff member's tasks
- (hotelId, roomId) - for room maintenance history
- (hotelId, createdAt DESC) - for chronological list
- (hotelId, completedAt DESC) - for completed tasks
```

**maintenanceTemplates** (optional - for preventive maintenance)
```
/maintenanceTemplates/{templateId}
  - hotelId
  - title (e.g., "Monthly HVAC Inspection")
  - description
  - category
  - frequency (monthly, quarterly, yearly)
  - estimatedCost
  - suggestedPriority
  - relatedRoomIds (optional - for specific rooms)
```

### Firestore Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Maintenance requests
    match /maintenance/{maintenanceId} {
      // Read: staff with manage_maintenance permission or assigned staff
      allow read: if request.auth != null && (
        hasPermission('manage_maintenance') ||
        resource.data.assignedTo == request.auth.uid
      );
      
      // Create: any staff
      allow create: if request.auth != null && hasPermission('manage_maintenance');
      
      // Update: manager or assigned staff
      allow update: if request.auth != null && (
        hasPermission('manage_maintenance') ||
        resource.data.assignedTo == request.auth.uid
      );
      
      // Delete: only managers
      allow delete: if request.auth != null && hasPermission('manage_maintenance');
    }
    
    function hasPermission(permission) {
      return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions;
    }
  }
}
```

---

## 4. Component Implementation Plan

### File Structure
```
src/types/maintenance.ts                          [NEW - Type definitions]
src/services/maintenanceService.ts                [NEW - Backend service]
src/store/useMaintenanceStore.ts                  [NEW - State management]
src/pages/Maintenance.tsx                         [UPDATE - Main page]
src/components/maintenance/
  ├── MaintenanceList.tsx                         [NEW - Table view]
  ├── MaintenanceForm.tsx                         [NEW - Create/Edit modal]
  ├── MaintenanceFilter.tsx                       [NEW - Filtering]
  ├── MaintenanceDetail.tsx                       [NEW - Detail modal]
  ├── MaintenanceStats.tsx                        [NEW - Dashboard stats]
  ├── MaintenanceTimeline.tsx                     [NEW - Timeline view]
  └── MaintenanceAttachments.tsx                  [NEW - Photo upload]
```

### 4.1 Maintenance Service

**`src/services/maintenanceService.ts`** (NEW)
```typescript
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
        ...doc.data()
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
      return docSnap.exists() ? ({
        id: docSnap.id,
        ...docSnap.data()
      } as MaintenanceRequest) : null;
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
      
      // Build history entry
      const historyEntry: MaintenanceHistory = {
        id: `hist_${Date.now()}`,
        timestamp: Timestamp.now() as any,
        action: 'status_change',
        changedBy,
        changes: Object.entries(updates).map(([field, value]) => ({
          field,
          oldValue: null, // Could fetch old doc here
          newValue: value
        })),
        reason
      };

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        history: (await getDoc(docRef)).data()?.history
          ? [...(await getDoc(docRef)).data().history, historyEntry]
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
    
    if (status === 'in-progress' && !notes) {
      updates.startedAt = Timestamp.now();
    }
    if (status === 'completed') {
      updates.completedAt = Timestamp.now();
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
      { assignedTo: staffId, assignedAt: Timestamp.now() as any },
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
      const requests = snapshot.docs.map(doc => doc.data() as MaintenanceRequest);

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
```

### 4.2 Maintenance Store

**`src/store/useMaintenanceStore.ts`** (NEW)
```typescript
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
      const request = get().requests.find(r => r.id === id);
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
```

### 4.3 Maintenance List Component

**`src/components/maintenance/MaintenanceList.tsx`** (NEW)
```typescript
import React from 'react';
import { Table, Space, Button, Tag, Tooltip, Badge, Popover } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { MaintenanceRequest } from '../../types/maintenance';
import dayjs from 'dayjs';

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  loading: boolean;
  selectedRequests?: string[];
  onEdit: (request: MaintenanceRequest) => void;
  onDelete: (id: string) => void;
  onSelectChange?: (ids: string[]) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({
  requests,
  loading,
  selectedRequests = [],
  onEdit,
  onDelete,
  onSelectChange,
  onStatusChange
}) => {
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      urgent: 'red'
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckOutlined style={{ color: 'green' }} />;
    if (status === 'in-progress') return <ClockCircleOutlined style={{ color: 'orange' }} />;
    return null;
  };

  const columns = [
    {
      title: 'Room',
      dataIndex: 'roomId',
      key: 'room',
      width: 80,
      render: (roomId: string) => <strong>{roomId}</strong>
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: MaintenanceRequest) => (
        <div>
          <strong>{title}</strong>
          <br />
          <span className="text-xs text-gray-500">{record.category}</span>
        </div>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={status === 'completed' ? 'green' : status === 'in-progress' ? 'orange' : 'default'}>
            {status.replace('_', ' ')}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string) => assignedTo || 'Unassigned'
    },
    {
      title: 'Cost',
      dataIndex: 'actualCost',
      key: 'cost',
      render: (cost: number) => cost ? `$${cost.toLocaleString()}` : '-'
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record: MaintenanceRequest) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={requests}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 20 }}
      rowSelection={onSelectChange ? {
        selectedRowKeys: selectedRequests,
        onChange: (keys) => onSelectChange(keys as string[])
      } : undefined}
      className="mt-4"
    />
  );
};
```

---

## 5. Implementation Steps (Same format as Staff Management)

### Step 1: Create Type Definitions
- Create `src/types/maintenance.ts` with all interfaces

### Step 2: Create Service Layer
- Create `src/services/maintenanceService.ts` with CRUD operations

### Step 3: Create Store
- Create `src/store/useMaintenanceStore.ts` with Zustand

### Step 4: Create UI Components
- MaintenanceList.tsx
- MaintenanceForm.tsx
- MaintenanceFilter.tsx
- MaintenanceDetail.tsx
- MaintenanceStats.tsx

### Step 5: Update Main Page
- Replace placeholder in `src/pages/Maintenance.tsx`

### Step 6: Integration
- Add route in App.tsx
- Add sidebar menu item
- Connect to Rooms status updates
- Update usePermissions

### Step 7: Room Status Integration
```typescript
// When maintenance is created, optionally mark room as 'maintenance'
// When maintenance is completed, restore previous room status
// Prevent reservations for rooms in maintenance status
```

### Step 8: Staff Integration
```typescript
// When assigning maintenance to staff, create task
// Staff can see assigned tasks
// Track staff workload
```

---

## 6. Timeline & Effort

- **Day 1:** Type definitions + Service + Store (4 hours)
- **Day 1:** UI components - List, Form, Filter (4 hours)
- **Day 2:** Detail view, stats, attachments (4 hours)
- **Day 2:** Integration, routing, room/staff linking (4 hours)
- **Day 3:** Testing, bug fixes (1 day)

**Total: 3-4 days**

---

## 7. Key Integration Points

1. **Room Management**
   - Mark room as 'maintenance' when issue created
   - Prevent reservations during maintenance
   - Denormalize room info in maintenance doc

2. **Staff Management**
   - Assign tasks to specific staff
   - Track staff workload
   - Show assigned tasks on staff detail

3. **Dashboard**
   - Show urgent maintenance count
   - Show maintenance costs
   - Show pending tasks

4. **Reports**
   - Maintenance cost reports
   - Response time analytics
   - Completion rate tracking

---

**Status:** Ready to implement ✅
