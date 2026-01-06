# 👥 Staff Management - Implementation Guide

**Status:** 🔄 50% Complete (Backend ✅, Frontend ❌)  
**Priority:** High  
**Estimated Effort:** 3-4 days  
**Dependencies:** Authentication system, Permission system  

---

## 1. Current State Analysis

### ✅ What Already Exists

#### Backend Infrastructure (100% Ready)
- **Service Layer:** `src/services/staffService.ts` ✅
  ```typescript
  - getStaffs(hotelId, filter) → with pagination & search
  - getStaffById(staffId)
  - createStaff(staffData, createUserAccount?)
  - updateStaff(staffId, staffData)
  - deleteStaff(staffId) → with soft-delete
  - restoreStaff(staffId)
  - assignPermissions(staffId, permissions)
  - bulkUpdateStatus(staffIds, status)
  ```

- **State Management:** `src/store/useStaffStore.ts` ✅
  ```typescript
  - fetchStaffs(hotelId, reset?)
  - loadMoreStaffs(hotelId)
  - createStaff(staffData, createUserAccount?)
  - updateStaff(staffId, staffData)
  - deleteStaff(staffId)
  - restoreStaff(staffId)
  - bulkUpdateStatus(staffIds, status)
  - assignPermissions(staffId, permissions)
  - Pagination support (lastDoc, hasMore)
  - Selection management (toggleStaffSelection, bulk select)
  ```

- **Type Definitions:** `src/types/staff.ts` ✅
  ```typescript
  interface Staff {
    hotelId, firstName, lastName, email, phone, position, department,
    role, permissions, salary, startDate, status, isDeleted, notes,
    userId, schedule, audit
  }
  interface WorkSchedule { date, shift, notes }
  interface AuditEntry { id, timestamp, action, description, changedBy }
  ```

- **Components (Exist but Minimal):**
  - ✅ `src/components/staff/StaffForm.tsx` - Form component exists
  - ✅ `src/components/staff/StaffCard.tsx` - Card component exists

#### Database Schema (Firestore)
- ✅ **staffs** collection with:
  - Multi-tenant: (hotelId) indexed
  - Soft-delete: (isDeleted) flag
  - Search: (firstName, lastName, email)
  - Filtering: (status, position, department)
  - Relations: (userId) to Firebase Auth

#### Permissions System
- ✅ Permission types defined:
  ```typescript
  'manage_staff' | 'assign_roles' | 'assign_permissions' | 
  'view_staff_directory' | 'manage_schedules'
  ```

### ❌ What's Missing

#### Frontend Pages & UI
1. **Staff List Page** ❌
   - Currently: `src/pages/Staff.tsx` returns placeholder text
   - Needs: Full page with table/grid view

2. **Staff Management Interface** ❌
   - Staff list with pagination
   - Create/Edit modals
   - Delete confirmation
   - Restore functionality
   - Permission assignment UI
   - Schedule management UI
   - Department/role visualization

3. **Specific UI Components** ❌
   - StaffList.tsx - table with CRUD controls
   - StaffPermissionAssignment.tsx - permission checkboxes
   - StaffScheduleForm.tsx - work schedule editor
   - StaffFilter.tsx - advanced filtering
   - BulkStaffOperations.tsx - bulk actions

---

## 2. Feature Requirements

### User Stories

**As an Admin, I want to:**
1. View all staff members with their roles, positions, and status
2. Create new staff members and optionally create Firebase Auth accounts
3. Edit staff information (name, position, salary, contact)
4. Assign/revoke specific permissions to staff
5. Set staff work schedules (shifts per day)
6. Bulk update staff status (active → inactive)
7. Delete staff members (soft-delete with restore option)
8. Filter/search staff by name, position, department
9. View staff audit history (who changed what, when)

**As a Manager, I want to:**
1. View only my department's staff
2. Request permission changes (with admin approval flow optional)
3. View staff schedules
4. See staff availability for task assignment

---

## 3. Architecture & Data Structure

### Extended Staff Interface

```typescript
// src/types/staff.ts - extend existing

export interface Staff extends BaseEntity {
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: StaffPosition; // 'manager' | 'receptionist' | 'housekeeper' | 'maintenance' | 'accounting'
  department?: string; // e.g., "Front Desk", "Housekeeping", "Maintenance"
  role: 'admin' | 'manager' | 'staff'; // System role
  permissions: string[]; // e.g., ['manage_reservations', 'manage_rooms', 'view_analytics']
  
  salary?: number;
  startDate?: Date;
  status: 'active' | 'inactive' | 'terminated';
  
  isDeleted?: boolean;
  notes?: string;
  userId?: string; // Link to Firebase Auth
  
  // New fields
  avatar?: string; // Profile image URL
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankAccount?: {
    accountName: string;
    accountNumber: string;
    bank: string;
  };
  
  schedule?: WorkSchedule[]; // Weekly schedule
  audit?: AuditEntry[]; // Modification history
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSchedule {
  dayOfWeek: 'Monday' | 'Tuesday' | ... | 'Sunday';
  shiftStart: string; // "08:00"
  shiftEnd: string; // "16:00"
  isOffDay?: boolean;
  notes?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete' | 'permission_change';
  changedBy: string; // staffId of who made change
  changedFields: {
    fieldName: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
}

export const STAFF_PERMISSIONS = [
  'view_staff_directory',
  'manage_staff',
  'assign_roles',
  'assign_permissions',
  'manage_schedules',
  'view_reservations',
  'manage_reservations',
  'check_in_guest',
  'check_out_guest',
  'manage_rooms',
  'manage_invoices',
  'view_analytics',
  'manage_alerts',
  'manage_maintenance',
  'manage_services',
  'create_reports'
];
```

### Firestore Collections

**staffs**
```
/staffs/{staffId}
  - hotelId (indexed)
  - firstName, lastName, email, phone
  - position, department, role
  - permissions (array)
  - salary, startDate
  - status (indexed)
  - userId
  - avatar
  - emergencyContact { name, phone, relationship }
  - bankAccount { accountName, accountNumber, bank }
  - schedule [] (embedded)
  - audit [] (embedded)
  - isDeleted (indexed)
  - createdAt, updatedAt

Indexes:
- (hotelId, isDeleted, status)
- (hotelId, department)
- (hotelId, position)
- (email) → ensure unique per hotel
```

### Firestore Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Staff management - only admins of same hotel
    match /staffs/{staffId} {
      allow read: if request.auth != null && 
                     userHasHotelAccess(resource.data.hotelId);
      allow create: if request.auth != null && 
                       userHasPermission('manage_staff');
      allow update: if request.auth != null && 
                       userHasPermission('manage_staff');
      allow delete: if request.auth != null && 
                       userHasPermission('manage_staff');
    }
    
    function userHasHotelAccess(hotelId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.hotelId == hotelId;
    }
    
    function userHasPermission(permission) {
      return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions;
    }
  }
}
```

---

## 4. Component Implementation Plan

### File Structure
```
src/pages/Staff.tsx                              [MAIN PAGE - NEW]
src/components/staff/
  ├── StaffList.tsx                              [NEW - table view]
  ├── StaffForm.tsx                              [EXISTS - needs enhancement]
  ├── StaffCard.tsx                              [EXISTS - can reuse]
  ├── StaffFilter.tsx                            [NEW - filtering]
  ├── StaffPermissionAssignment.tsx              [NEW - permissions UI]
  ├── StaffScheduleForm.tsx                      [NEW - schedule editor]
  ├── BulkStaffOperations.tsx                    [NEW - bulk actions]
  └── StaffAuditHistory.tsx                      [NEW - audit log]
```

### 4.1 Staff List Page

**`src/pages/Staff.tsx`**
```typescript
import React, { useEffect, useState } from 'react';
import { Layout, Tabs, Button, Space, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useStaffStore } from '../store/useStaffStore';
import { usePermissions } from '../hooks/usePermissions'; // Or create new hook
import { StaffList } from '../components/staff/StaffList';
import { StaffForm } from '../components/staff/StaffForm';
import { StaffFilter } from '../components/staff/StaffFilter';
import { BulkStaffOperations } from '../components/staff/BulkStaffOperations';
import { PermissionGuard } from '../components/common/PermissionGuard';

export const Staff: React.FC = () => {
  const { userProfile } = useAuth();
  const { 
    staffs, 
    loading, 
    error,
    filter,
    selectedStaffs,
    fetchStaffs, 
    createStaff, 
    updateStaff, 
    deleteStaff,
    setFilter,
    setSelectedStaffs
  } = useStaffStore();
  
  const { canManageStaff } = usePermissions();
  
  const [formVisible, setFormVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [tabKey, setTabKey] = useState('all');

  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchStaffs(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, fetchStaffs]);

  const handleCreateStaff = (values: any) => {
    createStaff({
      ...values,
      hotelId: userProfile!.hotelId,
      status: 'active'
    }, values.createUserAccount);
    setFormVisible(false);
    message.success('Staff member created successfully');
  };

  const handleUpdateStaff = (values: any) => {
    if (selectedStaff) {
      updateStaff(selectedStaff.id, values);
      setFormVisible(false);
      setSelectedStaff(null);
      message.success('Staff member updated');
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    Modal.confirm({
      title: 'Delete Staff Member',
      content: 'Are you sure? This will soft-delete the record.',
      onOk: () => {
        deleteStaff(staffId);
        message.success('Staff member deleted');
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedStaffs.length === 0) {
      message.warning('Please select staff members');
      return;
    }
    
    Modal.confirm({
      title: 'Bulk Delete',
      content: `Delete ${selectedStaffs.length} staff members?`,
      onOk: () => {
        selectedStaffs.forEach(id => deleteStaff(id));
        setSelectedStaffs([]);
        message.success('Staff members deleted');
      }
    });
  };

  return (
    <PermissionGuard requiredPermissions={['manage_staff']}>
      <Layout style={{ minHeight: '100vh' }}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <Space>
              {selectedStaffs.length > 0 && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                >
                  Delete ({selectedStaffs.length})
                </Button>
              )}
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedStaff(null);
                  setFormVisible(true);
                }}
              >
                Add Staff Member
              </Button>
            </Space>
          </div>

          <Tabs
            items={[
              {
                key: 'all',
                label: `All Staff (${staffs.length})`,
                children: (
                  <>
                    <StaffFilter 
                      filter={filter}
                      onFilterChange={setFilter}
                    />
                    <StaffList
                      staffs={staffs}
                      loading={loading}
                      selectedStaffs={selectedStaffs}
                      onEdit={(staff) => {
                        setSelectedStaff(staff);
                        setFormVisible(true);
                      }}
                      onDelete={handleDeleteStaff}
                      onSelectChange={setSelectedStaffs}
                    />
                  </>
                )
              },
              {
                key: 'active',
                label: 'Active',
                children: (
                  <StaffList
                    staffs={staffs.filter(s => s.status === 'active')}
                    loading={loading}
                    selectedStaffs={selectedStaffs}
                    onEdit={(staff) => {
                      setSelectedStaff(staff);
                      setFormVisible(true);
                    }}
                    onDelete={handleDeleteStaff}
                    onSelectChange={setSelectedStaffs}
                  />
                )
              },
              {
                key: 'inactive',
                label: 'Inactive',
                children: (
                  <StaffList
                    staffs={staffs.filter(s => s.status === 'inactive')}
                    loading={loading}
                    selectedStaffs={selectedStaffs}
                    onEdit={(staff) => {
                      setSelectedStaff(staff);
                      setFormVisible(true);
                    }}
                    onDelete={handleDeleteStaff}
                    onSelectChange={setSelectedStaffs}
                  />
                )
              }
            ]}
            activeKey={tabKey}
            onChange={setTabKey}
          />

          <StaffForm
            visible={formVisible}
            staff={selectedStaff}
            onCancel={() => {
              setFormVisible(false);
              setSelectedStaff(null);
            }}
            onSubmit={selectedStaff ? handleUpdateStaff : handleCreateStaff}
            loading={loading}
          />
        </div>
      </Layout>
    </PermissionGuard>
  );
};
```

### 4.2 Staff List Component

**`src/components/staff/StaffList.tsx`** (NEW)
```typescript
import React from 'react';
import { Table, Space, Button, Tag, Tooltip, Popover, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import type { Staff } from '../../types';

interface StaffListProps {
  staffs: Staff[];
  loading: boolean;
  selectedStaffs?: string[];
  onEdit: (staff: Staff) => void;
  onDelete: (staffId: string) => void;
  onSelectChange?: (selectedIds: string[]) => void;
  onPermissionsEdit?: (staffId: string) => void;
}

export const StaffList: React.FC<StaffListProps> = ({
  staffs,
  loading,
  selectedStaffs = [],
  onEdit,
  onDelete,
  onSelectChange,
  onPermissionsEdit
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'firstName',
      key: 'name',
      render: (firstName: string, record: Staff) => (
        <div>
          <strong>{`${firstName} ${record.lastName}`}</strong>
          <br />
          <span className="text-xs text-gray-500">{record.email}</span>
        </div>
      )
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => <Tag color="blue">{position}</Tag>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || '-'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          manager: 'orange',
          staff: 'green'
        };
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          inactive: 'orange',
          terminated: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: Date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[], record: Staff) => (
        <Popover
          title="Permissions"
          content={
            <div>
              {perms.map(p => (
                <Tag key={p}>{p}</Tag>
              ))}
            </div>
          }
        >
          <Button type="link" size="small">
            <LockOutlined /> {perms.length} perms
          </Button>
        </Popover>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Staff) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onPermissionsEdit && (
            <Tooltip title="Manage Permissions">
              <Button 
                icon={<LockOutlined />}
                size="small"
                onClick={() => onPermissionsEdit(record.id)}
              />
            </Tooltip>
          )}
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
      dataSource={staffs}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      rowSelection={onSelectChange ? {
        selectedRowKeys: selectedStaffs,
        onChange: (keys) => onSelectChange(keys as string[])
      } : undefined}
      className="mt-6"
    />
  );
};
```

### 4.3 Staff Filter Component

**`src/components/staff/StaffFilter.tsx`** (NEW)
```typescript
import React from 'react';
import { Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { StaffFilter } from '../../types/staff';

interface StaffFilterProps {
  filter: StaffFilter;
  onFilterChange: (filter: StaffFilter) => void;
}

export const StaffFilter: React.FC<StaffFilterProps> = ({
  filter,
  onFilterChange
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filter, search: value });
  };

  const handlePositionChange = (value: string) => {
    onFilterChange({ ...filter, position: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filter, status: value || undefined });
  };

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Input
            placeholder="Search by name, email..."
            value={filter.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Filter by position"
            value={filter.position || undefined}
            onChange={handlePositionChange}
            allowClear
            options={[
              { value: 'manager', label: 'Manager' },
              { value: 'receptionist', label: 'Receptionist' },
              { value: 'housekeeper', label: 'Housekeeper' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'accounting', label: 'Accounting' }
            ]}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Select
            placeholder="Filter by status"
            value={filter.status || undefined}
            onChange={handleStatusChange}
            allowClear
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'terminated', label: 'Terminated' }
            ]}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Space>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              Clear
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
```

### 4.4 Permission Assignment Component

**`src/components/staff/StaffPermissionAssignment.tsx`** (NEW)
```typescript
import React, { useState } from 'react';
import { Modal, Checkbox, Group, Button, message, Divider } from 'antd';
import type { Staff } from '../../types';

interface PermissionAssignmentProps {
  staff: Staff | null;
  visible: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (staffId: string, permissions: string[]) => Promise<void>;
}

const PERMISSION_GROUPS = {
  'Dashboard & Analytics': [
    'view_analytics',
    'create_reports'
  ],
  'Reservations': [
    'view_reservations',
    'manage_reservations',
    'check_in_guest',
    'check_out_guest'
  ],
  'Rooms': [
    'manage_rooms'
  ],
  'Staff & Admin': [
    'view_staff_directory',
    'manage_staff',
    'assign_roles',
    'assign_permissions',
    'manage_schedules'
  ],
  'Operations': [
    'manage_invoices',
    'manage_alerts',
    'manage_maintenance',
    'manage_services'
  ]
};

export const StaffPermissionAssignment: React.FC<PermissionAssignmentProps> = ({
  staff,
  visible,
  loading,
  onCancel,
  onSubmit
}) => {
  const [permissions, setPermissions] = useState<string[]>(
    staff?.permissions || []
  );

  const handlePermissionChange = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const handleSubmit = async () => {
    if (staff) {
      await onSubmit(staff.id, permissions);
      message.success('Permissions updated');
      onCancel();
    }
  };

  return (
    <Modal
      title={`Manage Permissions - ${staff?.firstName} ${staff?.lastName}`}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      loading={loading}
      width={500}
    >
      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <div key={group}>
          <h4 className="font-semibold mb-2">{group}</h4>
          <div className="ml-4 mb-4 space-y-2">
            {perms.map(perm => (
              <Checkbox
                key={perm}
                checked={permissions.includes(perm)}
                onChange={() => handlePermissionChange(perm)}
              >
                {perm.replace(/_/g, ' ')}
              </Checkbox>
            ))}
          </div>
          <Divider />
        </div>
      ))}
    </Modal>
  );
};
```

### 4.5 Schedule Management Component

**`src/components/staff/StaffScheduleForm.tsx`** (NEW)
```typescript
import React from 'react';
import { Modal, Form, Table, Select, Input, Button, Space, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { WorkSchedule } from '../../types/staff';

interface StaffScheduleFormProps {
  visible: boolean;
  schedule: WorkSchedule[];
  onCancel: () => void;
  onSubmit: (schedule: WorkSchedule[]) => Promise<void>;
  loading: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHIFTS = ['morning', 'afternoon', 'night'];

export const StaffScheduleForm: React.FC<StaffScheduleFormProps> = ({
  visible,
  schedule,
  onCancel,
  onSubmit,
  loading
}) => {
  const [form] = Form.useForm();
  const [scheduleData, setScheduleData] = React.useState<WorkSchedule[]>(schedule);

  const handleAddSchedule = () => {
    setScheduleData([...scheduleData, { date: '', shift: 'morning', notes: '' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setScheduleData(scheduleData.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await onSubmit(scheduleData);
    message.success('Schedule updated');
    onCancel();
  };

  const columns = [
    {
      title: 'Day',
      dataIndex: 'date',
      key: 'date',
      render: (date: string, _, index: number) => (
        <Select
          value={date}
          onChange={(value) => {
            const newData = [...scheduleData];
            newData[index].date = value;
            setScheduleData(newData);
          }}
          options={DAYS.map(day => ({ value: day, label: day }))}
        />
      )
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift: string, _, index: number) => (
        <Select
          value={shift}
          onChange={(value) => {
            const newData = [...scheduleData];
            newData[index].shift = value;
            setScheduleData(newData);
          }}
          options={SHIFTS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        />
      )
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string, _, index: number) => (
        <Input
          value={notes}
          onChange={(e) => {
            const newData = [...scheduleData];
            newData[index].notes = e.target.value;
            setScheduleData(newData);
          }}
          placeholder="Optional notes"
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, __, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => handleRemoveSchedule(index)}
        />
      )
    }
  ];

  return (
    <Modal
      title="Work Schedule"
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      loading={loading}
      width={700}
    >
      <Table
        columns={columns}
        dataSource={scheduleData}
        rowKey={(_, index) => index}
        pagination={false}
      />
      <Button onClick={handleAddSchedule} className="mt-4" type="dashed">
        Add Schedule
      </Button>
    </Modal>
  );
};
```

---

## 5. Implementation Steps

### Step 1: Create Main Staff Page
```bash
# Update src/pages/Staff.tsx from placeholder to full implementation
# Replace return placeholder text with Staff page component
```

### Step 2: Create List Component
```bash
# Create src/components/staff/StaffList.tsx
# Implement table view with columns: name, position, department, role, status, actions
```

### Step 3: Create Filter Component
```bash
# Create src/components/staff/StaffFilter.tsx
# Implement search, position filter, status filter
```

### Step 4: Create Permission Assignment UI
```bash
# Create src/components/staff/StaffPermissionAssignment.tsx
# Implement permission checkboxes grouped by feature
```

### Step 5: Create Schedule Form
```bash
# Create src/components/staff/StaffScheduleForm.tsx
# Implement work schedule editor
```

### Step 6: Create Bulk Operations Component
```bash
# Create src/components/staff/BulkStaffOperations.tsx (optional)
# Implement bulk status update
```

### Step 7: Update StaffForm Component
```bash
# Enhance existing src/components/staff/StaffForm.tsx
# Add emergency contact fields
# Add bank account fields
# Add schedule management button
# Add permission assignment button
```

### Step 8: Update Routes
```typescript
// In App.tsx or router configuration
{
  path: '/staff',
  element: <ProtectedRoute requiredPermissions={['manage_staff']}><Staff /></ProtectedRoute>
}
```

### Step 9: Update Sidebar
```typescript
// In src/components/common/Sidebar.tsx
{
  key: '/staff',
  icon: <TeamOutlined />,
  label: 'Staff',
  onClick: () => navigate('/staff')
}
```

### Step 10: Update usePermissions Hook
```typescript
// Add canManageStaff flag
const canManageStaff = hasPermission('manage_staff');
const canAssignPermissions = hasPermission('assign_permissions');
const canViewStaffDirectory = hasPermission('view_staff_directory');
```

---

## 6. Testing Checklist

### Unit Tests
- [ ] Staff service CRUD operations
- [ ] Permission filtering logic
- [ ] Staff store state management
- [ ] Form validation (email unique per hotel)

### Integration Tests
- [ ] Create staff with Firebase Auth account
- [ ] Update staff permissions
- [ ] Delete/restore staff member
- [ ] Filter/search staff
- [ ] Bulk operations

### E2E Tests
- [ ] Login as admin → navigate to staff → create staff → verify in list
- [ ] Edit staff → verify changes saved
- [ ] Assign permissions → verify reflected in usePermissions
- [ ] Delete staff → verify soft-delete and restore

### Permission Tests
- [ ] Non-admin cannot access staff page
- [ ] Manager can view only their department
- [ ] Admin can manage all staff
- [ ] Permission changes reflect immediately

---

## 7. Security Considerations

1. **Firestore Rules**
   - Only admins with manage_staff permission can CRUD
   - Soft delete (isDeleted flag) prevents accidental loss
   - Multi-tenant isolation (hotelId check)

2. **Password Security**
   - Password reset email flow via Firebase Auth
   - No plaintext passwords in Firestore
   - Firebase Auth handles encryption

3. **Permission Model**
   - Granular permissions (manage_staff, assign_permissions, etc.)
   - Role-based initial assignments
   - Regular audit of permission changes

4. **Audit Trail**
   - Track all staff changes in audit array
   - Log who changed what and when
   - Include change reason

---

## 8. Dependencies & Timeline

### Dependencies
- ✅ Authentication system (already implemented)
- ✅ Permission system (already implemented)
- ✅ staffService and useStaffStore (already implemented)
- ✅ Type definitions (already defined)

### Timeline Estimate
- Day 1: Staff page + list + filter components (4 hours)
- Day 1: StaffForm enhancements + permission UI (4 hours)
- Day 2: Schedule management + bulk operations (4 hours)
- Day 2: Integration, routing, sidebar updates (2 hours)
- Day 3: Testing, bug fixes, polish (1 day)

**Total: 3-4 days**

---

## 9. Related Features

This staff management system enables:
- ✅ Maintenance assignment (to specific staff)
- ✅ Service request assignment
- ✅ Task scheduling
- ✅ Staff availability tracking
- ✅ Audit logging
- ✅ Role-based access control throughout the app

---

## 10. Future Enhancements

1. **Staff Performance Metrics**
   - Track check-ins performed
   - Track maintenance tasks completed
   - Performance ratings

2. **Staff Self-Service**
   - Update own schedule preferences
   - View pay stubs
   - Request time off

3. **Advanced Scheduling**
   - Auto-schedule based on availability
   - Shift swaps
   - Overtime tracking

4. **Integration with Payroll**
   - Automatic salary deduction
   - Tax withholding
   - Integration with payroll service

---

**Status:** Ready to implement ✅  
**Next Step:** Start with Step 1 - Create main Staff page
