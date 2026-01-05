# 🧑‍💼 Staff Management — Spec & Implementation Plan

**Mục tiêu:** Thiết kế và triển khai module quản lý nhân viên (Staff Management) đầy đủ, gồm CRUD, phân quyền (roles & permissions), thống kê hiệu suất, lịch làm việc, và tính năng liên quan (tạo user account, gắn role, import/export, audit).

---

## 1) Người dùng mục tiêu
- Admin (toàn quyền)
- Manager (quản lý khách sạn / phân quyền hạn chế)
- Staff (nhân viên lễ tân, buồng phòng, kỹ thuật, kế toán) — chỉ xem/hạn chế thao tác

---

## 2) Yêu cầu chức năng (functional requirements)
- CRUD staff: Thêm / Sửa / Xóa (soft-delete) / Khôi phục
- Mapped user account: Tạo tài khoản người dùng (Firebase Auth) khi cần và liên kết `staffId` → `users` collection. **Hỗ trợ multi-hotel membership:** một user có thể là thành viên của nhiều khách sạn với role/permissions riêng cho từng hotel.
- Roles & permissions: role (manager/ receptionist/housekeeper/maintenance/accounting), permissions array (view_reservations, check_in, manage_rooms, manage_invoices, etc.). Phân quyền được lưu theo từng hotel (per-hotel permissions).
- Work schedule: ca, ngày nghỉ, availability
- Salary & payroll metadata: salary, position, startDate, status
- Performance tracking: completed tasks, ratings, absence records
- Import / Export CSV (bulk create/update)
- Search, filter, pagination, sorting
- Audit logs: who changed gì, khi nào (modification history)
- UI: Staff list, Staff form (modal), Staff profile detail, Staff activity/history
- Security: only admin/manager may create/update certain fields; deactivated staff cannot login

---

## 3) Data model (Firestore documents)
Collection: `staffs`

Fields (suggested):
- id: string (doc id)
- hotelId: string (FK)
- firstName: string
- lastName: string
- email: string
- phone?: string
- position: string (enum: 'manager'|'receptionist'|'housekeeper'|'maintenance'|'accounting')
- department?: string
- role: string (admin|manager|staff)
- permissions: string[]

**Users collection (membership model):** recommend storing per-user membership info in `users/{uid}` as `memberships: Array<{ hotelId: string; role: string; permissions: string[]; staffId?: string }>` so a single Firebase Auth user can belong to multiple hotels, each with their own role & permissions. Use `memberships` to determine effective permissions for a given hotel context.
- salary?: number
- startDate?: Timestamp
- status: 'active' | 'inactive' | 'terminated'
- isDeleted?: boolean
- createdAt: Timestamp
- updatedAt: Timestamp
- notes?: string
- audit?: Array<{ id, action, byUserId, timestamp, changes }>
- schedule?: Array<{ date, shift: 'morning'|'afternoon'|'night', notes }>

**Indexing recommendations:**
- Index on `hotelId` + `position`
- Index on `hotelId` + `status`
- Text index for `email`, `firstName`, `lastName` (client-side search acceptable for small sets)

---

## 4) Services / API (src/services/staffService.ts)
Methods:
- getStaffs(hotelId: string, filter?: StaffFilter & { limit?: number; startAfter?: DocumentSnapshot }) => { staffs, lastDoc }
- getStaffById(staffId: string) => Staff | null
- createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>, createUserAccount?: boolean) => staffId
  - if createUserAccount: create Firebase user with email + random password, call sendEmailVerification
  - store `staffId` in `users` doc
- updateStaff(staffId: string, updates: Partial<Staff>, modifiedBy?: string)
  - push audit entry
- softDeleteStaff(staffId: string) / restoreStaff(staffId: string)
- bulkImportCSV(file) => { created: n, updated: m, errors: [...] }
- assignPermissions(staffId, permissions[])
- searchStaff(query, hotelId)

Error handling: use `formatFirebaseError` for auth errors and service-specific errors for business rules (e.g., duplicate email across same hotel).

---

## 5) UI/UX (components & pages)
Pages:
- Staffs Page (`/staffs`)
  - List view with cards/table, filters (position, status), pagination, quick actions (activate/deactivate, edit, delete, view profile)
  - Bulk operations (assign role, change status, export)
- Staff Profile (`/staffs/:id` or modal)
  - Detailed info, schedule, recent activity, performance metrics, edit button
- Staff Form (modal)
  - Fields: name, email, phone, position, startDate, salary, permissions (multi-select), optional create user account checkbox
- Import / Export modal
- Settings for roles & permission mappings (Admin only)
- **Hotel switcher** (app header): when a user has multiple memberships, allow selecting active hotel; show current role/permissions for that hotel and a quick link to manage memberships (if allowed).

Accessibility:
- Ensure forms have labels, keyboard-accessible controls, and proper focus management in modals.

Localization:
- Use i18n key strings (VN/EN) for labels and messages

---

## 6) RBAC & enforcement
Permissions list (suggested):
- view_staffs
- create_staff
- update_staff
- delete_staff
- manage_staff_permissions
- view_salary
- manage_schedule

Enforcement model:
- Store per-hotel memberships in `users/{uid}.memberships` and keep staff documents (`staffs`) tied to a single `hotelId`.
- Use an **active hotel context** in the app (user chooses which hotel they are currently managing). All permission checks and actions should be evaluated against the active hotel.
- `ProtectedRoute` and component-level guards should check `hasPermission(userProfile, hotelId, permission)`.
- Server-side / Firestore rules must verify caller's membership and permissions for the hotel in request (not a single global role) before allowing sensitive writes (e.g., salary update).

Helper (pseudo):
```ts
function getMembership(userProfile, hotelId) {
  return userProfile?.memberships?.find(m => m.hotelId === hotelId) || null;
}

function hasPermission(userProfile, hotelId, permission) {
  if (!userProfile) return false;
  const membership = getMembership(userProfile, hotelId);
  if (!membership) return false;
  if (membership.permissions?.includes('all')) return true;
  return membership.permissions?.includes(permission);
}
```

Frontend (active hotel context - suggestion):
```ts
// useAuthStore or a separate context
const { userProfile, setActiveHotel } = useAuthStore();
const activeHotelId = userProfile?.activeHotelId;

// check permission for current hotel
if (!hasPermission(userProfile, activeHotelId, 'create_staff')) {
  // hide create button
}
```

Notes:
- Use Firebase custom claims only for **global** roles (e.g., super-admin across all hotels). Per-hotel roles and permissions should live in Firestore `users` doc to support multiple memberships per user.
- When creating a staff and optionally creating a user account, add or update the relevant membership entry: `{ hotelId, role, permissions, staffId }`.

---

## 7) Firestore Security Rules (example snippet)
Note: Use Firebase Emulator to test rules thoroughly.

Example (partial):
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /staffs/{staffId} {
      allow read: if request.auth != null && isMemberOfHotel(request.auth.uid, resource.data.hotelId);
      allow create: if request.auth != null && isAdminOrManagerOfHotel(request.auth.uid, request.resource.data.hotelId);
      allow update: if request.auth != null && (isAdminOrManagerOfHotel(request.auth.uid, resource.data.hotelId) || (request.auth.uid == resource.data.userId && request.resource.data.keys().hasOnly(['notes'])));
      allow delete: if request.auth != null && isAdminOfHotel(request.auth.uid, resource.data.hotelId);
    }

    function getMembership(uid, hotelId) {
      let u = get(/databases/$(database)/documents/users/$(uid)).data;
      return u.memberships == null ? null : (u.memberships.filter(m => m.hotelId == hotelId)[0]);
    }

    function isMemberOfHotel(uid, hotelId) {
      return getMembership(uid, hotelId) != null;
    }

    function isAdminOrManagerOfHotel(uid, hotelId) {
      let m = getMembership(uid, hotelId);
      return m != null && (m.role == 'admin' || m.role == 'manager');
    }

    function isAdminOfHotel(uid, hotelId) {
      let m = getMembership(uid, hotelId);
      return m != null && m.role == 'admin';
    }
  }
}
```

---

## 8) UX Workflows & Edge cases
Workflows:
- Create staff:
  1. Admin opens Add Staff modal
  2. Fills form (optionally create user account)
  3. If create account selected → create Firebase Auth user (or link to existing user), then update `users/{uid}.memberships` by appending `{ hotelId, role, permissions, staffId }`; send verification if needed
  4. Save staff doc with `staffId` link to user
  5. Notify by email

- Multi-hotel user flow / Active hotel context:
  - If a user belongs to multiple hotels, show a hotel switcher in the app header to select the *active hotel context*; all UI and permission checks evaluate against the chosen hotel.
  - When admin assigns a user to a hotel, add or update the membership entry in the `users` doc with the appropriate role & permissions.

- Deactivate staff:
  - Soft-delete / set `status = 'inactive'` in `staffs` and update corresponding membership (remove or mark inactive) in `users/{uid}.memberships`; to block login you may revoke tokens or set a flag checked at sign-in.

Edge cases:
- Duplicate email across hotels: allowed or forbidden? Recommend forbid duplicate email within same hotel; allow multi-hotel users by creating/using `users` document with memberships that include multiple `hotelId` entries.
- Deleting staff with active assignments: block or show force-delete with reassignment UI. When deleting a staff who is linked to a `users/{uid}` that has memberships for other hotels, ensure only the membership for the deleted hotel is removed, not the entire user.
- Partial failures during bulk import: report results and allow retry for failed rows.

---

## 9) Testing strategy
- Unit tests for service logic (Vitest/Jest, mock Firestore)
  - createStaff validation, createUserAccount flow, uniqueness checks
  - updateStaff: audit logs updated
  - softDelete: blocks reservations/assignments
- Integration tests with Firebase Emulator for rules + end-to-end flows
  - simulate manager creating staff, manager trying to set salary (allowed), staff trying to update own role (forbidden)
- E2E tests for UI (Playwright): add staff, edit profile, import CSV, deactivate/reactivate

---

## 10) Monitoring & audit
- Save `audit` history per staff record with changes and who did them
- Hook activity logs to central `activity_logs` collection for admin reporting
- Consider Sentry/LogRocket for error monitoring and alerts

---

## 11) Acceptance criteria
- Staff CRUD works with server-side validations and role enforcement
- New staff can be created with/without user account; when user account is created, an email verification is sent
- Soft-delete prevents login and assignment; restore works
- Bulk import reports success/failure per row
- Firestore security rules prevent unauthorized writes/reads
- Unit & integration tests cover critical paths

---

## 12) Implementation roadmap (phased)
- PR-1: Data model + staffService + basic CRUD + store + list UI (2–3 days)
- PR-2: Create user account integration with Auth + email verification (1–2 days)
- PR-3: Roles & permissions UI + enforcement + rules (2 days)
- PR-4: Bulk import/export + tests (1 day)
- PR-5: Scheduling UI + payroll fields + performance tracking (2–3 days)
- PR-6: Tests & emulator rules (1–2 days)

---

## 13) Deliverables & files to add
- `src/services/staffService.ts` (service methods listed above)
- `src/store/useStaffStore.ts` (Zustand store)
- `src/pages/Staffs.tsx` + `src/components/staffs/*` (StaffList, StaffForm, StaffProfile, BulkOperations)
- `src/utils/staffUtils.ts` (permission helpers, import parsers)
- `firestore.rules` (rules for staffs and users)
- Tests: `tests/staffService.spec.ts`, `tests/firestore.rules.test.ts` (emulator)

---

Nếu bạn đồng ý, tôi có thể bắt đầu với PR-1 (data model, service, store, list UI) và tạo các tests cơ bản. Bạn muốn bắt đầu với phần nào?