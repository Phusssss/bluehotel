import type { BaseEntity } from './common';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in-progress' | 'completed';
export type MaintenanceCategoryType = 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 
  'appliance' | 'structural' | 'cleaning' | 'other';

export interface MaintenanceRequest extends BaseEntity {
  hotelId: string;
  roomId: string; // Required - which room has the issue
  title: string; // e.g., "Broken AC unit"
  description: string;
  
  category: MaintenanceCategoryType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  
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
  attachments?: MaintenanceAttachment[];
  history?: MaintenanceHistory[];
  isDeleted?: boolean;
  
  // Room impact
  roomStatusBefore?: string; // room status before maintenance
  roomStatusAfter?: string; // room status after maintenance
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceCategory {
  type: MaintenanceCategoryType;
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
  category?: MaintenanceCategoryType;
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

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  { type: 'plumbing', label: 'Plumbing' },
  { type: 'electrical', label: 'Electrical' },
  { type: 'hvac', label: 'HVAC' },
  { type: 'furniture', label: 'Furniture' },
  { type: 'appliance', label: 'Appliance' },
  { type: 'structural', label: 'Structural' },
  { type: 'cleaning', label: 'Cleaning' },
  { type: 'other', label: 'Other' }
];

export const MAINTENANCE_PRIORITIES: { value: MaintenancePriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'orange' },
  { value: 'high', label: 'High', color: 'red' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
];

export const MAINTENANCE_STATUSES: { value: MaintenanceStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'in-progress', label: 'In Progress', color: 'orange' },
  { value: 'completed', label: 'Completed', color: 'green' }
];