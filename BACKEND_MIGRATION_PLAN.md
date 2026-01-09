# 🚀 MIGRATION PLAN: FIREBASE → NODE.JS + MYSQL BACKEND

## I. OVERVIEW - TỔNG QUAN DỰ ÁN

### Current State (Hiện tại)
```
Frontend:  React 18 + TypeScript (Vite)
Backend:   Firebase (Firestore, Cloud Functions, Auth, Storage)
Database:  NoSQL (Firestore)
Hosting:   Firebase Hosting
Real-time: Firebase onSnapshot listeners
Auth:      Firebase Authentication
Files:     Firebase Storage
```

### Target State (Mục tiêu)
```
Frontend:  React 18 + TypeScript (Vite) - NO CHANGE
Backend:   Node.js (Express.js) + TypeScript
Database:  MySQL 8.0+ (Relational)
Hosting:   Docker + Kubernetes / VPS / Cloud (AWS, GCP, Azure)
Real-time: WebSocket (Socket.io) / Server-Sent Events (SSE)
Auth:      JWT + Refresh Tokens
Files:     Local Storage / Cloud Storage (AWS S3 / Google Cloud Storage)
```

### Why Migrate?
```
✅ Cost Optimization: Firebase pricing cao khi dùng nhiều, MySQL dễ kiểm soát chi phí
✅ Data Control: Dữ liệu nằm trên server riêng, không phụ thuộc vendor lock-in
✅ Customization: Tự viết business logic, không bị giới hạn Firebase APIs
✅ Scalability: MySQL + Node.js dễ scale horizontally hơn
✅ Performance: Optimized queries, indexing, caching
✅ Integration: Kết nối dễ hơn với hệ thống bên thứ ba (OTA, Payment, etc.)
✅ Compliance: Data residency, backup policies tự kiểm soát
```

---

## II. ARCHITECTURE DESIGN - THIẾT KẾ KIẾN TRÚC

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  - Dashboard, Reservations, Rooms, Staff, Reports, etc.     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (Express.js)                        │
│  - Routes, Middleware, Request Validation, Error Handling   │
│  - Authentication (JWT), Authorization (RBAC)               │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Controllers  │  │   Services   │  │ Middleware   │
│ (Handlers)   │  │  (Business   │  │              │
│              │  │   Logic)     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                ▼
        │         ┌──────────────┐
        │         │  Repository  │
        │         │  (Data Acces)│
        └────────►└──────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  MySQL Database                │
        │  - Tables, Indexes, Triggers   │
        │  - Transactions, Constraints   │
        └────────────────────────────────┘
```

### Technology Stack

**Backend**:
```
Runtime:     Node.js 18+ LTS
Framework:   Express.js 4.x
Language:    TypeScript 5.x
ORM:         TypeORM hoặc Prisma
Database:    MySQL 8.0+
Cache:       Redis (optional, for optimization)
Real-time:   Socket.io (WebSocket)
Auth:        JWT (JSON Web Tokens)
Validation:  Zod hoặc class-validator
Logging:     Winston hoặc Pino
Testing:     Jest + Supertest
Documentation: Swagger/OpenAPI
```

**DevOps**:
```
Containerization: Docker
Orchestration:    Docker Compose (dev), Kubernetes (prod)
CI/CD:            GitHub Actions
Deployment:       Docker Hub, AWS ECR, or similar
Environment:      .env files (dotenv)
```

---

## III. DATABASE DESIGN - THIẾT KẾ CƠ SỞ DỮ LIỆU

### Database Schema Overview

#### 1. Authentication & Users
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  role ENUM('admin', 'manager', 'receptionist', 'housekeeper', 'maintenance', 'staff') NOT NULL DEFAULT 'staff',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_role (role)
);

CREATE TABLE user_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission),
  INDEX idx_user_id (user_id)
);

CREATE TABLE refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

#### 2. Rooms & Amenities
```sql
CREATE TABLE room_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  capacity INT NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_capacity (capacity),
  INDEX idx_is_active (is_active)
);

CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  room_type_id BIGINT NOT NULL,
  floor INT,
  status ENUM('available', 'occupied', 'dirty', 'cleaning', 'maintenance') DEFAULT 'available',
  current_guest_id BIGINT,
  check_out_time DATETIME,
  housekeeping_notes TEXT,
  last_updated DATETIME,
  updated_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (updated_by_id) REFERENCES users(id),
  INDEX idx_room_number (room_number),
  INDEX idx_status (status),
  INDEX idx_floor (floor),
  INDEX idx_current_guest_id (current_guest_id)
);

CREATE TABLE amenities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  icon_url VARCHAR(500),
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category)
);

CREATE TABLE room_type_amenities (
  room_type_id BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (room_type_id, amenity_id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);
```

#### 3. Reservations
```sql
CREATE TABLE guests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  nationality VARCHAR(100),
  passport_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  preferences JSON,
  is_vip BOOLEAN DEFAULT FALSE,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_is_vip (is_vip)
);

CREATE TABLE reservations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guest_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INT NOT NULL,
  status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  room_rate DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_requests TEXT,
  source ENUM('direct', 'booking.com', 'agoda', 'airbnb', 'phone', 'email') DEFAULT 'direct',
  booking_reference VARCHAR(50),
  created_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_check_in_date (check_in_date),
  INDEX idx_check_out_date (check_out_date),
  INDEX idx_guest_id (guest_id),
  INDEX idx_room_id (room_id),
  INDEX idx_source (source),
  INDEX idx_dates (check_in_date, check_out_date)
);

CREATE TABLE reservation_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  action ENUM('create', 'update', 'delete', 'check_in', 'check_out', 'cancel') NOT NULL,
  changed_fields JSON,
  old_values JSON,
  new_values JSON,
  reason TEXT,
  changed_by_id BIGINT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_id) REFERENCES users(id),
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_action (action),
  INDEX idx_changed_at (changed_at)
);
```

#### 4. Invoices & Payments
```sql
CREATE TABLE invoices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  guest_id BIGINT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  room_charges DECIMAL(10, 2),
  service_charges DECIMAL(10, 2),
  other_charges DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('draft', 'unpaid', 'partial', 'paid', 'overdue') DEFAULT 'unpaid',
  payment_deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  INDEX idx_status (status),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_created_at (created_at)
);

CREATE TABLE invoice_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  item_type ENUM('room', 'service', 'product', 'fee', 'discount') NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT,
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_id (invoice_id)
);

CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  payment_method ENUM('cash', 'card', 'transfer', 'check') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(100),
  payment_date DATETIME NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  processed_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by_id) REFERENCES users(id),
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_payment_method (payment_method)
);
```

#### 5. Maintenance & Services
```sql
CREATE TABLE maintenance_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'completed', 'cancelled') DEFAULT 'open',
  category VARCHAR(100),
  assigned_to_id BIGINT,
  reported_by_id BIGINT,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  completion_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  FOREIGN KEY (reported_by_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_room_id (room_id),
  INDEX idx_assigned_to_id (assigned_to_id)
);

CREATE TABLE maintenance_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  maintenance_id BIGINT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_type ENUM('before', 'after', 'issue') DEFAULT 'issue',
  uploaded_by_id BIGINT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (maintenance_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
  INDEX idx_maintenance_id (maintenance_id)
);

CREATE TABLE services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  category VARCHAR(50),
  type ENUM('fixed', 'variable') DEFAULT 'fixed',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category)
);

CREATE TABLE service_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_id (service_id)
);

CREATE TABLE room_services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id BIGINT NOT NULL,
  guest_id BIGINT,
  created_by_id BIGINT NOT NULL,
  subtotal DECIMAL(10, 2),
  surcharge DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_room_id (room_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE room_service_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_service_id BIGINT NOT NULL,
  service_item_id BIGINT,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  
  FOREIGN KEY (room_service_id) REFERENCES room_services(id) ON DELETE CASCADE,
  FOREIGN KEY (service_item_id) REFERENCES service_items(id),
  INDEX idx_room_service_id (room_service_id)
);
```

#### 6. Inventory
```sql
CREATE TABLE inventory_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(20),
  current_quantity INT NOT NULL,
  min_threshold INT,
  reorder_quantity INT,
  supplier VARCHAR(255),
  unit_cost DECIMAL(10, 2),
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_current_quantity (current_quantity)
);

CREATE TABLE inventory_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  item_id BIGINT NOT NULL,
  action ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  logged_by_id BIGINT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (logged_by_id) REFERENCES users(id),
  INDEX idx_item_id (item_id),
  INDEX idx_logged_at (logged_at)
);
```

---

## IV. API DESIGN - THIẾT KẾ API

### REST API Endpoints

#### Authentication
```
POST   /api/auth/register              - Đăng ký tài khoản
POST   /api/auth/login                 - Đăng nhập
POST   /api/auth/refresh               - Refresh JWT token
POST   /api/auth/logout                - Đăng xuất
POST   /api/auth/forgot-password       - Yêu cầu reset password
POST   /api/auth/reset-password        - Reset password
```

#### Users (Admin only)
```
GET    /api/users                      - Danh sách users
GET    /api/users/:id                  - Chi tiết user
POST   /api/users                      - Tạo user
PUT    /api/users/:id                  - Cập nhật user
DELETE /api/users/:id                  - Xóa user
POST   /api/users/:id/permissions      - Cấp quyền
GET    /api/users/:id/permissions      - Danh sách quyền của user
```

#### Rooms
```
GET    /api/rooms                      - Danh sách phòng
GET    /api/rooms/:id                  - Chi tiết phòng
PUT    /api/rooms/:id/status           - Cập nhật trạng thái phòng
GET    /api/rooms/availability         - Kiểm tra phòng trống
POST   /api/rooms/:id/housekeeping     - Cập nhật vệ sinh
GET    /api/room-types                 - Danh sách loại phòng
POST   /api/room-types                 - Tạo loại phòng
```

#### Reservations
```
GET    /api/reservations               - Danh sách đặt phòng
GET    /api/reservations/:id           - Chi tiết đặt phòng
POST   /api/reservations               - Tạo đặt phòng
PUT    /api/reservations/:id           - Cập nhật đặt phòng
DELETE /api/reservations/:id           - Hủy đặt phòng
POST   /api/reservations/:id/check-in  - Check-in
POST   /api/reservations/:id/check-out - Check-out
GET    /api/reservations/:id/audit     - Lịch sử thay đổi
```

#### Guests
```
GET    /api/guests                     - Danh sách khách
GET    /api/guests/:id                 - Chi tiết khách
POST   /api/guests                     - Tạo khách
PUT    /api/guests/:id                 - Cập nhật khách
GET    /api/guests/:id/history         - Lịch lưu trú
```

#### Invoices & Payments
```
GET    /api/invoices                   - Danh sách hóa đơn
GET    /api/invoices/:id               - Chi tiết hóa đơn
POST   /api/invoices                   - Tạo hóa đơn
PUT    /api/invoices/:id               - Cập nhật hóa đơn
POST   /api/invoices/:id/payments      - Ghi nhận thanh toán
GET    /api/invoices/:id/pdf           - In PDF
```

#### Services & Room Services
```
GET    /api/services                   - Danh sách dịch vụ
POST   /api/services                   - Tạo dịch vụ
GET    /api/room-services              - Danh sách dịch vụ phòng
POST   /api/room-services              - Ghi nợ dịch vụ
PUT    /api/room-services/:id          - Cập nhật dịch vụ phòng
```

#### Maintenance
```
GET    /api/maintenance                - Danh sách yêu cầu bảo trì
POST   /api/maintenance                - Tạo yêu cầu
GET    /api/maintenance/:id            - Chi tiết yêu cầu
PUT    /api/maintenance/:id            - Cập nhật yêu cầu
POST   /api/maintenance/:id/images     - Upload ảnh
```

#### Inventory
```
GET    /api/inventory                  - Danh sách vật tư
POST   /api/inventory                  - Tạo vật tư
PUT    /api/inventory/:id              - Cập nhật vật tư
POST   /api/inventory/:id/adjust       - Điều chỉnh số lượng
GET    /api/inventory/low-stock        - Vật tư sắp hết
```

#### Reports & Analytics
```
GET    /api/reports/revenue            - Báo cáo doanh thu
GET    /api/reports/occupancy          - Báo cáo lấp đầy phòng
GET    /api/reports/guests             - Báo cáo khách hàng
GET    /api/reports/maintenance        - Báo cáo bảo trì
```

### WebSocket Events (Real-time)
```
EMIT: room:status-changed {roomId, status, timestamp}
EMIT: reservation:created {reservation}
EMIT: reservation:updated {reservation}
EMIT: maintenance:created {maintenanceRequest}
EMIT: notification {type, message, data}
LISTEN: room:update-status {roomId, status}
LISTEN: reservation:update {reservationId, data}
```

---

## V. MIGRATION STRATEGY - CHIẾN LƯỢC DỰ ÁN

### Phase 1: Setup & Infrastructure (Weeks 1-2)
**Tasks**:
- [ ] Setup Node.js project (Express.js + TypeScript)
- [ ] Configure MySQL database
- [ ] Setup Docker & Docker Compose
- [ ] Configure environment variables (.env)
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Create database migrations
- [ ] Configure logging (Winston)
- [ ] Setup error handling & monitoring

**Deliverables**:
- ✅ Node.js project structure
- ✅ MySQL database ready
- ✅ Docker environment running
- ✅ API scaffolding done
- ✅ CI/CD pipeline working

---

### Phase 2: Authentication & Core APIs (Weeks 3-4)
**Tasks**:
- [ ] Implement JWT authentication
- [ ] Create Auth API (register, login, refresh, logout)
- [ ] Create User management API
- [ ] Implement role-based access control (RBAC)
- [ ] Create permission middleware
- [ ] Add password hashing (bcrypt)
- [ ] Add email verification (optional)
- [ ] Write unit tests

**Deliverables**:
- ✅ Auth API fully functional
- ✅ JWT tokens working
- ✅ RBAC implemented
- ✅ User management API ready
- ✅ Tests passing (80%+ coverage)

---

### Phase 3: Room Management APIs (Weeks 5-6)
**Tasks**:
- [ ] Create Room Type API (CRUD)
- [ ] Create Room API (CRUD)
- [ ] Create Amenities API
- [ ] Implement room status updates
- [ ] Add real-time room status (WebSocket / SSE)
- [ ] Create housekeeping integration API
- [ ] Write tests

**Deliverables**:
- ✅ Room management fully functional
- ✅ Real-time status updates working
- ✅ Housekeeping API ready
- ✅ Database queries optimized

---

### Phase 4: Reservations & Guests (Weeks 7-9)
**Tasks**:
- [ ] Create Guest API (CRUD)
- [ ] Create Reservation API (CRUD)
- [ ] Implement conflict detection
- [ ] Create audit logs
- [ ] Add guest preferences
- [ ] Create reservation status workflow
- [ ] Add VIP classification logic
- [ ] Write tests

**Deliverables**:
- ✅ Reservation API fully functional
- ✅ Conflict detection working
- ✅ Audit logs recording all changes
- ✅ Guest profiles complete

---

### Phase 5: Invoices & Payments (Weeks 10-11)
**Tasks**:
- [ ] Create Invoice API
- [ ] Create Invoice Items API
- [ ] Create Payments API
- [ ] Implement invoice generation
- [ ] Add PDF export (using puppeteer)
- [ ] Create payment methods handling
- [ ] Add tax calculations
- [ ] Write tests

**Deliverables**:
- ✅ Invoice system complete
- ✅ PDF generation working
- ✅ Payment processing ready
- ✅ All calculations verified

---

### Phase 6: Services & Room Services (Weeks 12-13)
**Tasks**:
- [ ] Create Services API (CRUD)
- [ ] Create Service Items API
- [ ] Create Room Services API (ghi nợ)
- [ ] Implement surcharge & tax calculations
- [ ] Integrate with invoices
- [ ] Add status workflow (pending → delivered)
- [ ] Write tests

**Deliverables**:
- ✅ Services fully functional
- ✅ POS integration ready
- ✅ Room service ghi nợ working
- ✅ Invoice integration verified

---

### Phase 7: Maintenance System (Weeks 14-15)
**Tasks**:
- [ ] Create Maintenance API (CRUD)
- [ ] Create image upload endpoint
- [ ] Implement maintenance status workflow
- [ ] Add cost tracking
- [ ] Create maintenance history
- [ ] Integrate with room status updates
- [ ] Write tests

**Deliverables**:
- ✅ Maintenance system complete
- ✅ Image uploads working
- ✅ Automation triggers ready
- ✅ Cost tracking functional

---

### Phase 8: Inventory System (Weeks 16-17)
**Tasks**:
- [ ] Create Inventory API (CRUD)
- [ ] Create Inventory Logs API
- [ ] Implement low stock alerts
- [ ] Add consumption tracking
- [ ] Create reorder logic
- [ ] Add inventory reports
- [ ] Write tests

**Deliverables**:
- ✅ Inventory management complete
- ✅ Stock alerts working
- ✅ Consumption tracking ready
- ✅ Reports functional

---

### Phase 9: Reports & Analytics (Weeks 18-19)
**Tasks**:
- [ ] Create Revenue Report API
- [ ] Create Occupancy Report API
- [ ] Create Guest Report API
- [ ] Create Maintenance Report API
- [ ] Add advanced filtering
- [ ] Add date range queries
- [ ] Add export to CSV/Excel
- [ ] Write tests

**Deliverables**:
- ✅ All reports working
- ✅ Advanced queries optimized
- ✅ Export functionality ready

---

### Phase 10: Real-time & WebSocket (Weeks 20-21)
**Tasks**:
- [ ] Setup Socket.io
- [ ] Implement room status real-time updates
- [ ] Implement reservation notifications
- [ ] Implement maintenance alerts
- [ ] Add notification system
- [ ] Handle connection/disconnection
- [ ] Add error recovery
- [ ] Write tests

**Deliverables**:
- ✅ WebSocket fully functional
- ✅ Real-time updates < 1 second
- ✅ Notifications working
- ✅ Connection management robust

---

### Phase 11: Frontend Integration & Testing (Weeks 22-25)
**Tasks**:
- [ ] Update React frontend API calls
- [ ] Replace Firebase references with REST/WebSocket
- [ ] Update authentication (localStorage JWT)
- [ ] Test all features
- [ ] Performance testing
- [ ] Load testing
- [ ] Fix bugs & issues
- [ ] Documentation

**Deliverables**:
- ✅ Frontend fully integrated
- ✅ All features working end-to-end
- ✅ Performance optimized
- ✅ No Firebase dependencies

---

### Phase 12: Deployment & Optimization (Weeks 26-28)
**Tasks**:
- [ ] Setup production environment
- [ ] Configure Docker for production
- [ ] Setup database backups
- [ ] Configure monitoring (New Relic / DataDog)
- [ ] Setup logging aggregation (ELK / Loggly)
- [ ] Performance tuning
- [ ] Security hardening
- [ ] UAT with team

**Deliverables**:
- ✅ Production-ready system
- ✅ Monitoring & alerts setup
- ✅ Backup strategy implemented
- ✅ Ready for go-live

---

## VI. PROJECT STRUCTURE - CẤU TRÚC DỰ ÁN

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts         # Database connection
│   │   ├── env.ts              # Environment variables
│   │   └── logger.ts           # Logger setup
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── rooms.controller.ts
│   │   ├── reservations.controller.ts
│   │   ├── guests.controller.ts
│   │   ├── invoices.controller.ts
│   │   ├── services.controller.ts
│   │   ├── maintenance.controller.ts
│   │   ├── inventory.controller.ts
│   │   └── reports.controller.ts
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── rooms.service.ts
│   │   ├── reservations.service.ts
│   │   ├── guests.service.ts
│   │   ├── invoices.service.ts
│   │   ├── services.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── inventory.service.ts
│   │   └── reports.service.ts
│   │
│   ├── repositories/           # Data access layer
│   │   ├── user.repository.ts
│   │   ├── room.repository.ts
│   │   ├── reservation.repository.ts
│   │   ├── guest.repository.ts
│   │   ├── invoice.repository.ts
│   │   └── ...
│   │
│   ├── entities/               # Database entities (TypeORM)
│   │   ├── User.ts
│   │   ├── Room.ts
│   │   ├── Reservation.ts
│   │   ├── Guest.ts
│   │   ├── Invoice.ts
│   │   └── ...
│   │
│   ├── routes/                 # API routes
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── rooms.routes.ts
│   │   ├── reservations.routes.ts
│   │   ├── guests.routes.ts
│   │   ├── invoices.routes.ts
│   │   ├── services.routes.ts
│   │   ├── maintenance.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── reports.routes.ts
│   │   └── index.ts
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rbac.middleware.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── hash.ts             # Password hashing
│   │   ├── jwt.ts              # JWT operations
│   │   ├── validators.ts       # Input validation
│   │   ├── errors.ts           # Custom errors
│   │   ├── pagination.ts       # Pagination helper
│   │   └── formatters.ts       # Data formatting
│   │
│   ├── websocket/              # WebSocket handling
│   │   ├── socket.gateway.ts
│   │   ├── rooms.gateway.ts
│   │   ├── reservations.gateway.ts
│   │   └── notifications.gateway.ts
│   │
│   ├── migrations/             # Database migrations
│   │   ├── 001_create_users.ts
│   │   ├── 002_create_rooms.ts
│   │   ├── 003_create_reservations.ts
│   │   └── ...
│   │
│   ├── seeders/                # Database seeders
│   │   ├── user.seeder.ts
│   │   ├── room-type.seeder.ts
│   │   └── amenity.seeder.ts
│   │
│   └── app.ts                  # Express app
│
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── Dockerfile              # Docker image
│   └── docker-compose.yml      # Local development
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions
│
├── .env.example                # Environment template
├── .env.local                  # Local env (git ignored)
├── .env.production             # Production env
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── eslint.config.js            # ESLint config
├── jest.config.js              # Jest config
├── README.md                   # Documentation
└── server.ts                   # Entry point
```

---

## VII. TECHNOLOGY DETAILS - CHI TIẾT CÔNG NGHỆ

### Dependencies & Libraries

**Core**:
```json
{
  "express": "^4.18.x",
  "typescript": "^5.x",
  "typeorm": "^0.3.x",
  "mysql2": "^3.x",
  "dotenv": "^16.x",
  "cors": "^2.8.x",
  "helmet": "^7.x"
}
```

**Authentication**:
```json
{
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.4.x",
  "passport": "^0.6.x",
  "passport-jwt": "^4.x"
}
```

**Validation & Error Handling**:
```json
{
  "zod": "^3.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

**Real-time & WebSocket**:
```json
{
  "socket.io": "^4.x",
  "socket.io-client": "^4.x"
}
```

**Logging & Monitoring**:
```json
{
  "winston": "^3.x",
  "pino": "^8.x",
  "express-async-errors": "^3.x"
}
```

**Testing**:
```json
{
  "jest": "^29.x",
  "supertest": "^6.x",
  "@testing-library/jest-dom": "^6.x",
  "ts-jest": "^29.x"
}
```

**Documentation & Utilities**:
```json
{
  "swagger-jsdoc": "^6.x",
  "swagger-ui-express": "^5.x",
  "uuid": "^9.x",
  "date-fns": "^2.x",
  "nodemailer": "^6.x",
  "puppeteer": "^21.x"
}
```

---

## VIII. SECURITY CONSIDERATIONS - XEM XÉT BẢO MẬT

### Authentication & Authorization
```typescript
// JWT Token Structure
{
  iss: "hotel-management-api",
  sub: userId,
  role: "admin",
  permissions: ["create:reservation", "read:report"],
  iat: timestamp,
  exp: timestamp + 24h
}

// Refresh Token (stored in DB)
{
  user_id: userId,
  token: secureRandomToken,
  expires_at: timestamp + 7d
}
```

### Data Protection
```
✅ Password hashing: bcryptjs (10+ rounds)
✅ JWT tokens: HS256 or RS256 (HTTPS only)
✅ Sensitive data: Encrypted at rest
✅ SQL Injection: Parameterized queries (TypeORM)
✅ XSS Prevention: Input sanitization
✅ CORS: Properly configured
✅ Rate limiting: Implemented
✅ HTTPS: Required for production
```

### Database Security
```
✅ Foreign key constraints
✅ Unique constraints
✅ Check constraints
✅ Transactions for consistency
✅ Soft deletes (deleted_at column)
✅ Audit logs for compliance
✅ Encrypted passwords
```

---

## IX. PERFORMANCE & OPTIMIZATION - HIỆU NĂNG

### Database Optimization
```sql
-- Indexes
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_invoices_guest ON invoices(guest_id);
CREATE FULLTEXT INDEX ft_guests_name ON guests(first_name, last_name);

-- Query optimization
SELECT SQL_CALC_FOUND_ROWS * FROM reservations 
WHERE check_in_date BETWEEN ? AND ? 
LIMIT 20, 20;
```

### Caching Strategy
```typescript
// In-memory cache for room types
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Redis cache (optional, for distributed cache)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
await redis.setex(`room:${id}`, 600, JSON.stringify(room));
```

### Query Optimization
```typescript
// Pagination
const skip = (page - 1) * limit;
const data = await reservationRepository.find({
  skip,
  take: limit,
  relations: ['guest', 'room', 'invoice']
});

// Aggregations
const stats = await reservationRepository
  .createQueryBuilder()
  .select('COUNT(*)', 'total')
  .addSelect('SUM(total_price)', 'revenue')
  .where('check_in_date >= :start', { start })
  .getRawOne();
```

### API Response Optimization
```typescript
// Selective fields
GET /api/reservations?fields=id,guest_name,room_number,check_in_date

// Compression
app.use(compression());

// ETag caching
app.use((req, res, next) => {
  const etag = generateETag(data);
  if (req.get('if-none-match') === etag) {
    res.status(304).end();
  }
});
```

---

## X. TESTING STRATEGY - CHIẾN LƯỢC KIỂM THỬ

### Unit Tests
```typescript
describe('ReservationService', () => {
  describe('createReservation', () => {
    it('should create reservation when room is available', async () => {
      // Mock data
      const input = { roomId: 1, guestId: 1, checkIn, checkOut };
      
      // Execute
      const result = await service.createReservation(input);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('confirmed');
    });
    
    it('should throw error when room is not available', async () => {
      // Arrange
      jest.spyOn(roomService, 'checkAvailability')
        .mockResolvedValue(false);
      
      // Assert
      await expect(service.createReservation(input))
        .rejects.toThrow('Room not available');
    });
  });
});
```

### Integration Tests
```typescript
describe('Reservation API', () => {
  it('POST /api/reservations should create reservation', async () => {
    const response = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        guest_id: 1,
        room_id: 1,
        check_in_date: '2026-02-01',
        check_out_date: '2026-02-03'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2E Tests
```typescript
describe('Hotel Management Flow', () => {
  it('should complete full reservation flow', async () => {
    // 1. Create guest
    const guest = await createGuest({...});
    
    // 2. Create reservation
    const res = await createReservation({ guestId: guest.id });
    
    // 3. Check-in
    await checkIn({ reservationId: res.id });
    
    // 4. Add room services
    await addRoomService({ roomId: res.room_id, items: [...] });
    
    // 5. Check-out
    await checkOut({ reservationId: res.id });
    
    // 6. Generate invoice
    const invoice = await generateInvoice({ reservationId: res.id });
    
    expect(invoice.total).toBeGreaterThan(0);
  });
});
```

---

## XI. DEPLOYMENT STRATEGY - CHIẾN LƯỢC TRIỂN KHAI

### Docker Setup
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mysql://user:password@db:3306/hotel_dev
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules
    
  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=hotel_dev
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    volumes:
      - db_data:/var/lib/mysql
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db_data:
```

### Kubernetes Deployment (Production)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hotel-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hotel-api
  template:
    metadata:
      labels:
        app: hotel-api
    spec:
      containers:
      - name: api
        image: hotel-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## XII. TIMELINE & MILESTONES - TIMELINE & MỌC

| Phase | Weeks | Tasks | Deliverables |
|-------|-------|-------|--------------|
| 1 | 1-2 | Setup infrastructure | Node.js project, MySQL, Docker |
| 2 | 3-4 | Auth & Users | JWT auth, User management |
| 3 | 5-6 | Rooms | Room API, Real-time updates |
| 4 | 7-9 | Reservations & Guests | Full reservation system |
| 5 | 10-11 | Invoices & Payments | Billing system |
| 6 | 12-13 | Services | POS system |
| 7 | 14-15 | Maintenance | Maintenance management |
| 8 | 16-17 | Inventory | Stock management |
| 9 | 18-19 | Reports | Analytics |
| 10 | 20-21 | WebSocket/Real-time | Live updates |
| 11 | 22-25 | Frontend Integration | Connect React to Node.js |
| 12 | 26-28 | Deployment & Testing | Production ready |
| **Total** | **28 weeks** | **Full backend** | **Enterprise-ready system** |

---

## XIII. RESOURCE REQUIREMENTS - YÊUTẦU TÀI NGUYÊN

### Team
```
1 Backend Lead (Node.js + MySQL expert)
2 Backend Developers (TypeScript, REST APIs)
1 DevOps Engineer (Docker, Kubernetes, CI/CD)
1 QA Engineer (API testing, performance testing)
1 Database Administrator (Schema design, optimization)
```

### Infrastructure
```
Development:    Local MySQL + Docker
Staging:        Small AWS/GCP instance (t3.small)
Production:     Medium AWS/GCP instance (t3.medium)
                + RDS MySQL (db.t3.small)
                + Redis (optional)
                + S3/Cloud Storage (for files)
```

### Monthly Costs (Estimated)
```
Development:     $0 (local)
Staging:         $30-50
Production:      $100-200
Database:        $50-100
Total:           ~$200-300/month
```

---

## XIV. MIGRATION RISKS & MITIGATION - RỦI RO VÀ GIẢI PHÁP

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data loss during migration | Low | Critical | Backup before migration, test on staging |
| Performance degradation | Medium | High | Performance testing, indexing, caching |
| Breaking changes in frontend | Medium | High | Gradual migration, parallel running, API versioning |
| MySQL connection pool exhaustion | Low | High | Connection pooling, monitoring |
| JWT token expiration issues | Low | Medium | Proper token refresh, error handling |
| File upload security | Medium | Medium | Validation, sandboxing, scanning |
| Real-time sync lag | Medium | Medium | WebSocket optimization, caching |

---

## XV. SUCCESS METRICS - MỤC TIÊU THÀNH CÔNG

### Performance
```
✅ API response time: < 200ms (avg)
✅ Database query time: < 100ms (avg)
✅ Real-time updates: < 1 second latency
✅ Uptime: > 99.9%
✅ Request throughput: > 1000 req/sec
```

### Quality
```
✅ Code coverage: > 80%
✅ Test pass rate: 100%
✅ Bug escape rate: < 2%
✅ Zero security vulnerabilities (OWASP Top 10)
```

### Adoption
```
✅ Migration completion: 100%
✅ Feature parity with Firebase: 100%
✅ Team comfortable with new stack: 100%
✅ Zero Firebase dependencies: 100%
```

---

## XVI. NEXT STEPS - BƯỚC TIẾP THEO

### Immediately
1. Review this document with backend team
2. Confirm technology choices
3. Allocate resources
4. Setup development environment

### Week 1
1. Create Node.js project
2. Configure MySQL database
3. Setup Docker
4. Begin Phase 1 (Setup & Infrastructure)

### Week 3
1. Start Phase 2 (Auth APIs)
2. Begin frontend integration planning
3. Setup testing framework

### Ongoing
1. Weekly progress reviews
2. Performance benchmarking
3. Security audits
4. Documentation updates

---

## CONCLUSION

This migration plan provides a **complete roadmap** to transition from Firebase to Node.js + MySQL backend over **28 weeks**.

✅ Clear architecture & technology choices  
✅ Detailed database schema  
✅ Comprehensive API design  
✅ Phased implementation approach  
✅ Risk assessment & mitigation  
✅ Testing & deployment strategies  

**Ready to build a scalable, robust backend! 🚀**

