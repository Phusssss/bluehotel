# 🛎️ Services Management (Room Services) - Implementation Guide

**Status:** 🔄 10% Complete (Types partially defined, needs implementation)  
**Priority:** Medium  
**Estimated Effort:** 2-3 days  
**Dependencies:** Reservations, Guests, Invoices  

---

## 1. Overview

Room services allow guests to request additional services during their stay (laundry, food delivery, spa services, etc.). These services are:
- Available from a hotel-defined catalog
- Requestable by guests/staff during reservations
- Added to invoices automatically
- Trackable for revenue reporting

---

## 2. Data Structure

### Types

```typescript
// src/types/service.ts (NEW)

export interface Service extends BaseEntity {
  hotelId: string;
  name: string; // e.g., "Room Service Meal"
  description: string;
  category: ServiceCategory; // 'food' | 'laundry' | 'spa' | 'transport' | 'other'
  price: number;
  duration?: number; // hours if applicable
  image?: string;
  isAvailable: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest extends BaseEntity {
  hotelId: string;
  reservationId: string;
  guestId: string;
  serviceId: string;
  serviceName: string; // denormalized
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests?: string;
  requestedAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  status: 'requested' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string; // staffId
  notes?: string;
  isDeleted?: boolean;
}

export interface ServiceCategory {
  type: 'food' | 'laundry' | 'spa' | 'transport' | 'other';
  label: string;
  icon?: string;
}
```

### Firestore Collections

**services**
```
/services/{serviceId}
  - hotelId (indexed)
  - name, description, category (indexed)
  - price
  - duration
  - image (URL)
  - isAvailable (indexed)
  - isDeleted
  - createdAt, updatedAt

Indexes:
- (hotelId, isAvailable)
- (hotelId, category)
```

**serviceRequests**
```
/serviceRequests/{requestId}
  - hotelId (indexed)
  - reservationId (indexed)
  - guestId
  - serviceId
  - quantity, unitPrice, totalPrice
  - specialRequests
  - requestedAt, scheduledFor, completedAt
  - status (indexed)
  - assignedTo (staffId, indexed)
  - isDeleted

Indexes:
- (hotelId, status)
- (hotelId, reservationId)
- (hotelId, assignedTo)
```

---

## 3. Implementation Components

```
src/types/service.ts                             [NEW]
src/services/serviceService.ts                   [NEW]
src/store/useServiceStore.ts                     [NEW]
src/pages/Services.tsx                           [UPDATE]
src/components/services/
  ├── ServiceCatalog.tsx                         [NEW]
  ├── ServiceForm.tsx                            [NEW]
  ├── ServiceRequestList.tsx                     [NEW]
  ├── ServiceRequestForm.tsx                     [NEW]
  └── ServiceRequestDetail.tsx                   [NEW]
```

---

## 4. Key Features

### For Guests
- Browse available services during check-in
- Request services with special instructions
- View service requests and status
- Pay for services (added to invoice)

### For Staff
- View all service requests
- Manage service fulfillment
- Mark services as completed
- Track service revenue

### For Admin
- Manage service catalog (add/edit/delete)
- Set pricing
- View service requests
- Generate service revenue reports
- Manage service categories

---

## 5. Integration Points

### With Reservations
```typescript
// When guest checks in, show service catalog
// When guest requests service, link to reservationId
// When reservation checkout, include service charges
```

### With Invoices
```typescript
// Service requests automatically add line items to invoice
// Price: quantity × unitPrice
// Category: 'Service'
```

### With Dashboard
```typescript
// Show recent service requests
// Show service revenue metrics
// Show fulfillment status
```

---

## 6. Timeline

- **Service Service & Store:** 1 day
- **Admin Service Management UI:** 1 day
- **Guest Service Request UI:** 1 day
- **Integration & Testing:** 1 day

**Total: 2-3 days**

---

**Detailed implementation guides for components and service methods follow the same patterns as Staff and Maintenance modules.**

---

## 7. Dependencies

- ✅ Reservations system
- ✅ Guests system
- ✅ Invoices system
- 🔄 Staff Management (for assignment)

**Can be implemented independently but integrates with above.**

---

**Status:** Ready for implementation ✅
