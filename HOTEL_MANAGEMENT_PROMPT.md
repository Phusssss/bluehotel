# 🏨 PROMPT: Xây Dựng Hệ Thống Quản Lí Khách Sạn Toàn Diện

## 📋 Tổng Quan Dự Án

**Mục tiêu:** Xây dựng web app quản lí khách sạn full-stack với React JS, Ant Design, Tailwind CSS, Firebase

**Target Users:** Quản lí khách sạn, nhân viên lễ tân, kế toán, quản lí

**Phạm vi:** Desktop + Responsive Web

---

## 🏗️ PHẦN 1: SETUP CÔNG NGHỆ

### Tech Stack
```
Frontend:
- React JS (v18+)
- TypeScript
- Ant Design (UI Components)
- Tailwind CSS (Styling)
- React Router v6 (Navigation)
- Zustand hoặc Redux Toolkit (State Management)
- React Query / SWR (Data Fetching)
- React Hook Form (Form Management)
- Chart.js / Recharts (Statistics)

Backend:
- Firebase Realtime Database / Firestore
- Firebase Authentication
- Firebase Storage (hình ảnh)
- Firebase Cloud Functions (nếu cần)

Tools:
- Vite (Build tool)
- ESLint + Prettier
- Vitest (Testing)
```

### Package.json Essentials
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.x",
    "antd": "^5.x",
    "tailwindcss": "^3.x",
    "@react-query/core": "^5.x",
    "react-hook-form": "^7.x",
    "zustand": "^4.x",
    "firebase": "^10.x",
    "recharts": "^2.x",
    "dayjs": "^1.x",
    "axios": "^1.x"
  }
}
```

---

## 📊 PHẦN 2: DATABASE SCHEMA

### Database Structure (Firebase Firestore)

```
firestore/
├── hotels/
│   ├── hotelId
│   │   ├── name (string)
│   │   ├── address (string)
│   │   ├── phone (string)
│   │   ├── email (string)
│   │   ├── totalRooms (number)
│   │   ├── createdAt (timestamp)
│   │   ├── logo (url)
│   │   └── settings (object)
│
├── rooms/
│   ├── roomId
│   │   ├── hotelId (string - FK)
│   │   ├── roomNumber (string)
│   │   ├── roomType (enum: 'single', 'double', 'suite', 'deluxe')
│   │   ├── maxGuests (number)
│   │   ├── basePrice (number)
│   │   ├── status (enum: 'available', 'occupied', 'maintenance', 'blocked')
│   │   ├── floor (number)
│   │   ├── amenities (array)
│   │   ├── images (array of urls)
│   │   ├── createdAt (timestamp)
│   │   └── lastUpdated (timestamp)
│
├── reservations/
│   ├── reservationId
│   │   ├── hotelId (string - FK)
│   │   ├── guestId (string - FK)
│   │   ├── roomId (string - FK)
│   │   ├── checkInDate (date)
│   │   ├── checkOutDate (date)
│   │   ├── numberOfGuests (number)
│   │   ├── status (enum: 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled')
│   │   ├── totalPrice (number)
│   │   ├── notes (string)
│   │   ├── createdAt (timestamp)
│   │   ├── updatedAt (timestamp)
│   │   └── specialRequests (string)
│
├── guests/
│   ├── guestId
│   │   ├── firstName (string)
│   │   ├── lastName (string)
│   │   ├── email (string)
│   │   ├── phone (string)
│   │   ├── idNumber (string)
│   │   ├── idType (enum: 'passport', 'national_id', 'driver_license')
│   │   ├── address (string)
│   │   ├── country (string)
│   │   ├── totalStays (number)
│   │   ├── isVIP (boolean)
│   │   ├── createdAt (timestamp)
│   │   └── notes (string)
│
├── staffs/
│   ├── staffId
│   │   ├── hotelId (string - FK)
│   │   ├── firstName (string)
│   │   ├── lastName (string)
│   │   ├── email (string)
│   │   ├── phone (string)
│   │   ├── position (enum: 'manager', 'receptionist', 'housekeeper', 'maintenance', 'accounting')
│   │   ├── department (string)
│   │   ├── salary (number)
│   │   ├── startDate (date)
│   │   ├── status (enum: 'active', 'inactive')
│   │   ├── permissions (array)
│   │   └── createdAt (timestamp)
│
├── invoices/
│   ├── invoiceId
│   │   ├── hotelId (string - FK)
│   │   ├── reservationId (string - FK)
│   │   ├── guestId (string - FK)
│   │   ├── roomCharges (number)
│   │   ├── additionalServices (array of {name, price})
│   │   ├── taxes (number)
│   │   ├── discount (number)
│   │   ├── totalAmount (number)
│   │   ├── paymentMethod (enum: 'cash', 'credit_card', 'bank_transfer')
│   │   ├── paymentStatus (enum: 'pending', 'paid', 'partial')
│   │   ├── issueDate (date)
│   │   ├── dueDate (date)
│   │   └── notes (string)
│
├── services/
│   ├── serviceId
│   │   ├── hotelId (string - FK)
│   │   ├── name (string)
│   │   ├── description (string)
│   │   ├── price (number)
│   │   ├── category (enum: 'food', 'laundry', 'spa', 'transport', 'other')
│   │   ├── isActive (boolean)
│   │   └── createdAt (timestamp)
│
├── maintenance/
│   ├── maintenanceId
│   │   ├── hotelId (string - FK)
│   │   ├── roomId (string - FK)
│   │   ├── title (string)
│   │   ├── description (string)
│   │   ├── priority (enum: 'low', 'medium', 'high', 'urgent')
│   │   ├── status (enum: 'pending', 'in-progress', 'completed')
│   │   ├── assignedTo (staffId)
│   │   ├── reportedDate (date)
│   │   ├── completedDate (date)
│   │   ├── cost (number)
│   │   └── notes (string)
│
├── users/
│   ├── userId
│   │   ├── email (string)
│   │   ├── role (enum: 'admin', 'manager', 'staff')
│   │   ├── hotelId (string - FK)
│   │   ├── staffId (string - FK)
│   │   ├── permissions (array)
│   │   ├── lastLogin (timestamp)
│   │   ├── createdAt (timestamp)
│   │   └── isActive (boolean)
└── reports/
    ├── reportId
    │   ├── hotelId (string - FK)
    │   ├── type (enum: 'occupancy', 'revenue', 'expense', 'guest')
    │   ├── period (object: {startDate, endDate})
    │   ├── data (object)
    │   ├── generatedAt (timestamp)
    │   └── generatedBy (userId)
```

---

## 🎨 PHẦN 3: CORE FEATURES

### A. Dashboard (Trang Chủ)
- [ ] Overview card (Phòng trống, Phòng đã đặt, Doanh thu hôm nay, Khách mới)
- [ ] Biểu đồ chiếm dụng phòng (7 ngày, 30 ngày)
- [ ] Biểu đồ doanh thu theo tháng
- [ ] Danh sách check-in/check-out hôm nay
- [ ] Cảnh báo phòng cần bảo trì
- [ ] Activity log

### B. Quản Lí Phòng
- [ ] Danh sách phòng (grid/list view)
- [ ] Thêm/Sửa/Xóa phòng
- [ ] Phân loại phòng (Single, Double, Suite...)
- [ ] Thiết lập giá và amenities
- [ ] Upload hình ảnh phòng
- [ ] Status management (Available, Occupied, Maintenance, Blocked)
- [ ] Filter và search
- [ ] Bulk operations

### C. Quản Lí Đặt Phòng (Reservations)
- [ ] Calendar view (lịch đặt phòng)
- [ ] Tạo/Sửa/Xóa đặt phòng
- [ ] Check-in/Check-out process
- [ ] Modify reservation (thay đổi ngày, phòng, khách)
- [ ] Cancellation handling
- [ ] Payment tracking
- [ ] Guest notes & special requests
- [ ] Drag-drop trong calendar
- [ ] Advanced filtering
- [ ] Export báo cáo

### D. Quản Lí Khách Hàng (Guests)
- [ ] Danh sách khách hàng
- [ ] Thêm/Sửa/Xóa khách
- [ ] Guest profile (lịch sử đặt phòng, chi tiêu, ưu tiên)
- [ ] VIP guest management
- [ ] Contact management
- [ ] Blacklist feature
- [ ] Guest communication

### E. Quản Lí Lễ Tân & Check-in/out
- [ ] Check-in form
- [ ] Check-out form
- [ ] ID verification
- [ ] Room assignment automation
- [ ] Key management
- [ ] Luggage tracking
- [ ] Guest preferences
- [ ] Express check-in/out

### F. Quản Lí Hóa Đơn & Thanh Toán
- [ ] Tạo hóa đơn tự động
- [ ] Thêm dịch vụ phụ (minibar, spa, laundry)
- [ ] Thanh toán hóa đơn
- [ ] Multiple payment methods
- [ ] Refund processing
- [ ] Invoice history
- [ ] Tax calculation
- [ ] Export PDF/Excel

### G. Quản Lí Dịch Vụ Thêm
- [ ] Danh sách dịch vụ (Spa, Laundry, Room Service, Transport)
- [ ] Thêm/Sửa/Xóa dịch vụ
- [ ] Giá dịch vụ
- [ ] Service orders
- [ ] Service history

### H. Quản Lí Nhân Viên
- [ ] Danh sách nhân viên
- [ ] Thêm/Sửa/Xóa nhân viên
- [ ] Phân quyền (Roles & Permissions)
- [ ] Salary management
- [ ] Work schedule
- [ ] Performance tracking
- [ ] Department management

### I. Quản Lí Bảo Trì
- [ ] Maintenance requests
- [ ] Priority management
- [ ] Task assignment
- [ ] Completion tracking
- [ ] Cost tracking
- [ ] Maintenance history

### J. Báo Cáo & Thống Kê
- [ ] Occupancy report
- [ ] Revenue report
- [ ] Expense report
- [ ] Guest statistics
- [ ] Staff performance
- [ ] Custom date range
- [ ] Export PDF/Excel
- [ ] Real-time dashboard

### K. Cài Đặt Hệ Thống
- [ ] Hotel profile
- [ ] Room types management
- [ ] Tax settings
- [ ] Payment methods
- [ ] Email templates
- [ ] System logs
- [ ] Backup & restore
- [ ] User management

### L. Bảo Mật & Quyền Hạn
- [ ] Role-based access control
- [ ] Authentication (Firebase Auth)
- [ ] Audit logs
- [ ] Two-factor authentication option
- [ ] Permission management by role

---

## 🗂️ PHẦN 4: PROJECT STRUCTURE

```
src/
├── assets/
│   ├── images/
│   ├── icons/
│   └── styles/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── LoadingSpinner.tsx
│   ├── rooms/
│   │   ├── RoomList.tsx
│   │   ├── RoomForm.tsx
│   │   ├── RoomCard.tsx
│   │   └── RoomFilter.tsx
│   ├── reservations/
│   │   ├── ReservationCalendar.tsx
│   │   ├── ReservationForm.tsx
│   │   ├── ReservationList.tsx
│   │   └── CheckInOutForm.tsx
│   ├── guests/
│   │   ├── GuestList.tsx
│   │   ├── GuestForm.tsx
│   │   ├── GuestProfile.tsx
│   │   └── GuestSearch.tsx
│   ├── invoices/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoicePreview.tsx
│   │   └── PaymentForm.tsx
│   ├── dashboard/
│   │   ├── DashboardOverview.tsx
│   │   ├── StatisticCards.tsx
│   │   ├── Charts.tsx
│   │   └── RecentActivity.tsx
│   └── reports/
│       ├── ReportGenerator.tsx
│       ├── ReportChart.tsx
│       └── ReportTable.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Rooms.tsx
│   ├── Reservations.tsx
│   ├── Guests.tsx
│   ├── Invoices.tsx
│   ├── Services.tsx
│   ├── Staff.tsx
│   ├── Maintenance.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   └── NotFound.tsx
├── services/
│   ├── firebase.ts
│   ├── roomService.ts
│   ├── reservationService.ts
│   ├── guestService.ts
│   ├── invoiceService.ts
│   ├── authService.ts
│   └── reportService.ts
├── store/
│   ├── useAuthStore.ts
│   ├── useRoomStore.ts
│   ├── useReservationStore.ts
│   ├── useGuestStore.ts
│   ├── useInvoiceStore.ts
│   └── useNotificationStore.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFirestore.ts
│   ├── useForm.ts
│   ├── usePagination.ts
│   └── useNotification.ts
├── types/
│   ├── index.ts
│   ├── room.ts
│   ├── reservation.ts
│   ├── guest.ts
│   ├── invoice.ts
│   ├── staff.ts
│   └── common.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── calculations.ts
│   ├── dateHelpers.ts
│   └── constants.ts
├── config/
│   ├── firebaseConfig.ts
│   ├── antdConfig.ts
│   └── routeConfig.ts
├── App.tsx
└── main.tsx
```

---

## 📝 PHẦN 5: FAKE DATA STRUCTURE

```typescript
// Mock Data Examples

// Rooms
const mockRooms = [
  {
    roomId: 'room-001',
    hotelId: 'hotel-001',
    roomNumber: '101',
    roomType: 'single',
    maxGuests: 1,
    basePrice: 50,
    status: 'available',
    floor: 1,
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom'],
    images: ['url1', 'url2'],
    createdAt: new Date(),
    lastUpdated: new Date()
  },
  // ... more rooms
];

// Guests
const mockGuests = [
  {
    guestId: 'guest-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    idNumber: 'ABC123456',
    idType: 'passport',
    address: '123 Main St',
    country: 'USA',
    totalStays: 5,
    isVIP: true,
    createdAt: new Date(),
    notes: 'Preferred customer'
  },
  // ... more guests
];

// Reservations
const mockReservations = [
  {
    reservationId: 'res-001',
    hotelId: 'hotel-001',
    guestId: 'guest-001',
    roomId: 'room-001',
    checkInDate: '2026-01-10',
    checkOutDate: '2026-01-15',
    numberOfGuests: 2,
    status: 'confirmed',
    totalPrice: 300,
    notes: 'Ground floor preferred',
    createdAt: new Date(),
    updatedAt: new Date(),
    specialRequests: 'Late check-out'
  },
  // ... more reservations
];

// Invoices
const mockInvoices = [
  {
    invoiceId: 'inv-001',
    hotelId: 'hotel-001',
    reservationId: 'res-001',
    guestId: 'guest-001',
    roomCharges: 300,
    additionalServices: [
      { name: 'Spa', price: 50 },
      { name: 'Laundry', price: 20 }
    ],
    taxes: 37,
    discount: 0,
    totalAmount: 407,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    issueDate: '2026-01-15',
    dueDate: '2026-01-15',
    notes: ''
  },
  // ... more invoices
];

// Staff
const mockStaff = [
  {
    staffId: 'staff-001',
    hotelId: 'hotel-001',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@hotel.com',
    phone: '+9876543210',
    position: 'receptionist',
    department: 'Front Desk',
    salary: 2000,
    startDate: '2025-01-01',
    status: 'active',
    permissions: ['view_reservations', 'create_reservation'],
    createdAt: new Date()
  },
  // ... more staff
];
```

---

## 🚀 PHẦN 6: IMPLEMENTATION STEPS (THEO THỨ TỰ)

### STEP 1: Project Setup & Authentication
**Mục tiêu:** Thiết lập dự án, cấu hình Firebase, xây dựng hệ thống đăng nhập
- [ ] Khởi tạo React project với Vite
- [ ] Cấu hình TypeScript, ESLint, Prettier
- [ ] Cài đặt Ant Design + Tailwind CSS
- [ ] Cấu hình Firebase
- [ ] Xây dựng authentication (Login/Logout/Register)
- [ ] Tạo Protected Routes
- [ ] Setup State Management (Zustand)
- [ ] Tạo Layout component chính

**Output:** Working login page, protected routes, auth store

---

### STEP 2: Database Setup & Schema Initialization
**Mục tiêu:** Tạo cấu trúc database và import fake data
- [ ] Tạo Firestore collections
- [ ] Định nghĩa Firestore rules
- [ ] Tạo fake data scripts
- [ ] Import fake data vào Firestore
- [ ] Tạo Firebase service functions
- [ ] Test CRUD operations

**Output:** Clean database with mock data, working Firebase services

---

### STEP 3: Dashboard & Core Navigation
**Mục tiêu:** Xây dựng dashboard chính và navigation
- [ ] Tạo Sidebar navigation
- [ ] Tạo Header component
- [ ] Thiết kế Dashboard layout
- [ ] Tạo statistic cards
- [ ] Thêm basic charts
- [ ] Tạo recent activity list
- [ ] Responsive design

**Output:** Complete dashboard with navigation

---

### STEP 4: Room Management
**Mục tiêu:** Xây dựng module quản lí phòng
- [ ] Tạo Room List page
- [ ] Tạo Room Form (Add/Edit)
- [ ] Implement room filters
- [ ] Tạo room detail view
- [ ] Upload room images
- [ ] Status management (CRUD)
- [ ] Bulk operations

**Output:** Full room management module

---

### STEP 5: Guest Management
**Mục tiêu:** Xây dựng module quản lí khách hàng
- [ ] Tạo Guest List page
- [ ] Tạo Guest Form (Add/Edit)
- [ ] Implement guest search & filter
- [ ] Tạo guest profile
- [ ] History tracking
- [ ] VIP management
- [ ] Guest notes & preferences

**Output:** Complete guest management system

---

### STEP 6: Reservation & Calendar System
**Mục tiêu:** Xây dựng hệ thống đặt phòng và lịch
- [ ] Tạo Calendar component
- [ ] Implement drag-drop functionality
- [ ] Tạo Reservation Form
- [ ] Status workflow (pending → confirmed → checked-in → checked-out)
- [ ] Modify reservation logic
- [ ] Cancellation handling
- [ ] Advanced filtering & search

**Output:** Interactive calendar with full reservation management

---

### STEP 7: Check-in/Check-out Process
**Mục tiêu:** Xây dựng quy trình check-in/out
- [ ] Tạo Check-in Form
- [ ] ID verification flow
- [ ] Room assignment automation
- [ ] Guest preferences capture
- [ ] Check-out form
- [ ] Luggage management
- [ ] Express check-in option

**Output:** Streamlined guest arrival & departure process

---

### STEP 8: Invoice & Payment System
**Mục tiêu:** Xây dựng hệ thống hóa đơn và thanh toán
- [ ] Automatic invoice generation
- [ ] Add additional services
- [ ] Tax calculation
- [ ] Payment form (multiple methods)
- [ ] Invoice history & tracking
- [ ] Refund processing
- [ ] PDF export

**Output:** Complete invoicing & payment system

---

### STEP 9: Additional Services Management
**Mục tiêu:** Xây dựng module dịch vụ thêm
- [ ] Services CRUD
- [ ] Service categories
- [ ] Service orders
- [ ] Service history
- [ ] Pricing management
- [ ] Service assignment to reservations

**Output:** Additional services module

---

### STEP 10: Staff Management
**Mục tiêu:** Xây dựng module quản lí nhân viên
- [ ] Staff CRUD
- [ ] Role assignment
- [ ] Permission management
- [ ] Department management
- [ ] Salary tracking
- [ ] Work schedule
- [ ] User account linking

**Output:** Staff management & role-based access control

---

### STEP 11: Maintenance Management
**Mục tiêu:** Xây dựng module quản lí bảo trì
- [ ] Maintenance request form
- [ ] Priority levels
- [ ] Task assignment
- [ ] Status tracking
- [ ] Cost management
- [ ] Maintenance history

**Output:** Maintenance request system

---

### STEP 12: Reports & Analytics
**Mục tiêu:** Xây dựng module báo cáo
- [ ] Occupancy report
- [ ] Revenue report
- [ ] Guest statistics
- [ ] Staff performance metrics
- [ ] Custom date range
- [ ] Export PDF/Excel
- [ ] Dashboard charts

**Output:** Comprehensive reporting & analytics

---

### STEP 13: Settings & Configuration
**Mục tiêu:** Xây dựng cài đặt hệ thống
- [ ] Hotel profile settings
- [ ] Room types configuration
- [ ] Tax settings
- [ ] Payment methods
- [ ] Email templates
- [ ] System preferences

**Output:** System settings module

---

### STEP 14: Testing & Bug Fixes
**Mục tiêu:** Kiểm tra toàn bộ hệ thống
- [ ] Unit testing key functions
- [ ] Integration testing
- [ ] UI/UX testing
- [ ] Performance optimization
- [ ] Bug fixing
- [ ] Browser compatibility

**Output:** Stable, tested application

---

### STEP 15: Deployment & Documentation
**Mục tiêu:** Deploy ứng dụng và tài liệu hóa
- [ ] Build production
- [ ] Deploy Firebase Hosting
- [ ] Create documentation
- [ ] API documentation
- [ ] User manual
- [ ] Setup instructions

**Output:** Live production app with documentation

---

## ⚙️ PHẦN 7: SETUP INSTRUCTIONS

### Local Setup
```bash
# Clone repo
git clone <your-repo>
cd hotel-management

# Install dependencies
npm install

# Create .env file
cp .env.example .env.local
# Add Firebase config

# Start dev server
npm run dev

# Build for production
npm run build
```

### Firebase Setup
```
1. Go to Firebase Console
2. Create new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password)
5. Enable Storage (for images)
6. Copy config to .env.local
7. Create Firestore collections manually or via script
8. Import fake data
```

---

## 🎯 KEY FEATURES CHECKLIST

### Phase 1 (MVP)
- [ ] Authentication
- [ ] Dashboard
- [ ] Room Management
- [ ] Basic Reservations
- [ ] Guest Management
- [ ] Check-in/Check-out

### Phase 2 (Extended)
- [ ] Advanced Calendar
- [ ] Invoicing System
- [ ] Payment Processing
- [ ] Reports & Analytics
- [ ] Staff Management
- [ ] Services Management

### Phase 3 (Polish)
- [ ] Maintenance Management
- [ ] Settings & Configuration
- [ ] Email Notifications
- [ ] SMS Alerts
- [ ] Mobile Responsive
- [ ] Performance Optimization

---

## 💡 BEST PRACTICES

1. **State Management:** Sử dụng Zustand cho global state
2. **API Calls:** React Query cho data fetching
3. **Form Handling:** React Hook Form + validation
4. **Error Handling:** Toast notifications + error boundaries
5. **Performance:** Lazy loading, memoization, code splitting
6. **Security:** Firestore rules, input validation
7. **Testing:** Unit tests cho utils, integration tests cho services
8. **Code Quality:** ESLint, Prettier, TypeScript strict mode

---

## 📚 THAM KHẢO

Các website quản lí khách sạn để tham khảo:
- Hostaway
- CloudBeds
- Eviivo
- Hotelogix
- RoomMaster
- WebRezPro

---

## 🔗 USEFUL LIBRARIES

- **UI:** Ant Design, Tailwind CSS, React Icons
- **Forms:** React Hook Form, Yup/Zod
- **Data:** Firebase SDK, React Query
- **Tables:** Ant Design Table, React Table
- **Charts:** Recharts, Chart.js
- **Dates:** Day.js, React Calendar
- **Export:** jsPDF, SheetJS (Excel)
- **Upload:** React Dropzone
- **Notifications:** Ant Design message/notification
- **State:** Zustand, Redux Toolkit
- **Testing:** Vitest, React Testing Library

---

## 📞 SUPPORT & NEXT STEPS

Sau khi read prompt này, bạn có thể:
1. Bắt đầu từ STEP 1: Project Setup
2. Theo dõi checklist từng bước
3. Xây dựng từng feature theo thứ tự
4. Test và optimize

**Happy Coding! 🚀**
