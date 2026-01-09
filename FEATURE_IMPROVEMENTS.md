# CẢI TIẾN CÁC CHỨC NĂNG HIỆN CÓ - HOTEL MANAGEMENT SYSTEM

## I. QUẢN LÝ ĐẶT PHÒNG (RESERVATIONS ENHANCEMENT)

### 1. Chế độ xem Timeline (Gantt Chart)
**Mục đích**: Hiển thị bản đồ thời gian chi tiết cho tất cả các phòng, cho phép kéo thả để quản lý đặt phòng.

**Chức năng chính**:
- Hiển thị Gantt chart với trục X là thời gian (ngày/tuần/tháng)
- Trục Y liệt kê các phòng được nhóm theo tầng
- Mỗi đặt phòng là một thanh màu sắc biểu thị trạng thái (confirmed, pending, checked-in)
- Hỗ trợ kéo thả để thay đổi phòng hoặc gia hạn ngày
- Hiển thị giá cơ sở và chi phí dịch vụ trên thanh
- Zoom in/out trên trục thời gian
- Filter theo loại phòng, trạng thái, khách hàng

**Công nghệ**:
- Thư viện: React Big Calendar hoặc react-gantt-chart
- Real-time update từ Firebase

**Hiệu suất mong muốn**:
- Tải dữ liệu ≤ 2 giây
- Kéo thả mượt mà (60fps)

---

### 2. Phát hiện xung đột thông minh (Smart Conflict Detection)
**Mục đích**: Tự động cảnh báo Overbooking và gợi ý phòng thay thế.

**Chức năng chính**:
- Kiểm tra xung đột ngay khi nhân viên nhập ngày check-in/check-out
- Hiển thị danh sách phòng trống tương đương nếu phòng khách chọn không khả dụng
- Cảnh báo cạnh phòng có khách (noise warning)
- Gợi ý phòng với số giường phù hợp
- Hỗ trợ người dùng chọn phòng thay thế trực tiếp trong form

**Logic kiểm tra**:
```
- Kiểm tra status: occupied, maintenance, blocked
- So sánh khoảng thời gian [check_in, check_out]
- Lựa chọn phòng có capacity ≥ số khách
- Tính toán sự khác biệt giá và gợi ý
```

**Cảnh báo hiển thị**:
- Không còn phòng loại A → Gợi ý loại B với giá khác
- Xung đột với đặt phòng khác
- Check-in/Check-out ngay cùng lúc

---

### 3. Lịch sử chỉnh sửa (Audit Log)
**Mục đích**: Theo dõi tất cả thay đổi trong đặt phòng để tăng tính minh bạch.

**Chức năng chính**:
- Ghi lại mọi thay đổi: tên khách, số phòng, giá, trạng thái, etc.
- Hiển thị:
  - Người thực hiện thay đổi
  - Thời gian thay đổi
  - Giá trị cũ → giá trị mới
  - Lý do thay đổi (optional memo)
- Bộ lọc theo khoảng thời gian, nhân viên, loại thay đổi
- Export audit log thành CSV/PDF
- Xem chi tiết đặt phòng tại thời điểm bất kỳ (point-in-time view)

**Lưu trữ**:
- Bảng `reservation_audit_logs` trong Firebase
- Lập chỉ mục theo reservation_id, timestamp, staff_id

---

## II. QUẢN LÝ PHÒNG (ROOMS ENHANCEMENT)

### 1. Cập nhật thời gian thực (Real-time Status)
**Mục đích**: Đồng bộ trạng thái phòng tức thì cho tất cả người dùng.

**Chức năng chính**:
- Sử dụng Firebase `onSnapshot` listener cho bảng `rooms`
- Trạng thái phòng: AVAILABLE, OCCUPIED, DIRTY, CLEANING, MAINTENANCE
- Hiển thị biểu tượng trạng thái trực quan (icon + màu sắc)
- Thời gian cập nhật: ngay lập tức (< 1 giây)
- Hỗ trợ transition mượt giữa các trạng thái

**Giao diện**:
- Card phòng hiển thị trạng thái hiện tại + giờ check-in/out
- Khi hover: hiển thị tên khách, số điện thoại, dịch vụ đã sử dụng
- Thay đổi màu sắc mượt mà khi trạng thái thay đổi

**Schema**:
```typescript
{
  room_id: string,
  room_number: string,
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE',
  current_guest?: string,
  check_out_time?: timestamp,
  last_updated: timestamp,
  updated_by: string
}
```

---

### 2. Tích hợp Buồng phòng (Housekeeping Integration)
**Mục đích**: Nhân viên vệ sinh cập nhật trạng thái phòng từ thiết bị di động.

**Chức năng chính**:
- Ứng dụng mobile-friendly hoặc Progressive Web App (PWA)
- Danh sách phòng cần vệ sinh hôm nay
- Nhân viên có thể:
  - Mark phòng là "Cleaning in progress"
  - Chụp ảnh trước/sau khi vệ sinh
  - Nhập ghi chú (vd: "Cần sửa vòi nước")
  - Submit trạng thái "Clean"
- Thông báo đẩy khi phòng vệ sinh xong
- Offline mode: tự động đồng bộ khi có kết nối

**Công nghệ**:
- React Native hoặc Flutter cho mobile
- Hoặc PWA sử dụng Service Workers

---

### 3. Quản lý danh mục tiện nghi (Amenities Management)
**Mục đích**: Tạo bảng quản lý tiện nghi tập trung, chuẩn hóa dữ liệu.

**Chức năng chính**:
- Bảng `amenities` với các trường:
  - ID, Tên (VN/EN), Biểu tượng, Danh mục (bathroom, bedroom, etc.)
  - Loại phòng nào có tiện nghi này
  - Trạng thái hoạt động
- Admin có thể CRUD amenities
- Khi tạo/chỉnh sửa phòng, chọn từ dropdown thay vì nhập text
- Hiển thị danh sách tiện nghi dạng icon trên phòng

**Database**:
```typescript
Amenity {
  id: string,
  name_vi: string,
  name_en: string,
  icon_url: string,
  category: 'bathroom' | 'bedroom' | 'entertainment' | 'other',
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## III. QUẢN LÝ NHÂN VIÊN (STAFF ENHANCEMENT)

### 1. Phân quyền chi tiết (ACL - Access Control List)
**Mục đích**: Kiểm soát truy cập chi tiết theo vai trò.

**Vai trò & quyền**:
- **Admin**: Toàn quyền
- **Manager**: Quản lý staff, xem báo cáo doanh thu, duyệt yêu cầu
- **Receptionist**: Quản lý check-in/out, đặt phòng, không xem báo cáo
- **Housekeeper**: Cập nhật trạng thái phòng, không xem dữ liệu khách
- **Maintenance**: Quản lý yêu cầu bảo trì, không can thiệp đặt phòng
- **Chef/Bar**: Quản lý dịch vụ, không xem hóa đơn tổng

**Bảng quyền**:
```
Quyền: create_reservation, edit_reservation, delete_reservation, view_report, 
       manage_staff, manage_maintenance, update_room_status, etc.
```

**Triển khai**:
- Thêm `permissions` array trong user document
- PermissionGuard component kiểm tra quyền trước hiển thị component
- API gateway kiểm tra quyền trước thực hiện hành động

---

### 2. Quản lý Ca làm việc (Shift Management)
**Mục đích**: Xếp lịch trực và bàn giao ca.

**Chức năng chính**:
- Bảng `shifts` quản lý ca làm việc:
  - Tên ca (Ca sáng, Chiều, Đêm)
  - Giờ bắt đầu/kết thúc
  - Vị trí làm việc
  - Số nhân viên cần
- Giao diện lên lịch (Shift Planner):
  - Kéo thả gán nhân viên vào ca
  - Kiểm tra xung đột ca
  - Thông báo khi ca chưa đủ nhân lực
- **Logbook** (Bàn giao ca):
  - Nhân viên ca sáng ghi chú các sự cố
  - Nhân viên ca chiều xác nhận đã đọc logbook
  - Lưu lịch sử logbook
  - Biểu mẫu: ngày, ca, sự kiện quan trọng, vấn đề cần giải quyết

---

### 3. Số hóa hồ sơ (Digital Personnel File)
**Mục đích**: Lưu trữ tài liệu nhân viên trực tiếp trong hệ thống.

**Chức năng chính**:
- Tải lên files:
  - CCCD/Hộ chiếu (scan bằng camera)
  - Hợp đồng lao động (PDF)
  - Chứng chỉ, bằng cấp
  - Ảnh chân dung
- Lưu trữ trên Firebase Storage với folder `/personnel/{staff_id}/`
- Phân quyền: chỉ HR, Manager, và chính nhân viên đó xem
- Thêm trường trong Staff profile:
  - Ngày hết hạn CCCD
  - Ngày hết hạn hợp đồng
- Thông báo khi tài liệu sắp hết hạn

---

## IV. QUẢN LÝ BẢO TRÌ (MAINTENANCE ENHANCEMENT)

### 1. Tự động hóa trạng thái (Automation)
**Mục đích**: Phòng ở trạng thái "Maintenance" tự động khóa trên lịch đặt phòng.

**Logic**:
- Khi maintenance request được set status = "IN_PROGRESS":
  - Tự động thay đổi room status = "MAINTENANCE"
  - Khóa phòng đó trên lịch đặt phòng (block availability)
  - Nếu có đặt phòng trùng lịch → hiển thị cảnh báo
- Khi maintenance request hoàn thành (status = "COMPLETED"):
  - Tự động set room status = "AVAILABLE" nếu không có khách
  - Hoặc = "CLEANING" nếu cần vệ sinh
  - Mở khóa phòng trên lịch

**Trigger**:
- Cloud Function lắng nghe thay đổi `maintenance_requests/{id}/status`
- Cập nhật `rooms/{room_id}/status` tương ứng

---

### 2. Đính kèm hình ảnh (Image Attachment)
**Mục đích**: Kỹ thuật viên nhanh chóng nắm bắt vấn đề từ ảnh chụp.

**Chức naung chính**:
- Form yêu cầu bảo trì cho phép:
  - Chụp ảnh trực tiếp từ camera
  - Tải lên từ thư viện ảnh
  - Upload nhiều ảnh cùng lúc
- Compress & optimize ảnh trước upload (giảm kích thước)
- Lưu ảnh vào Firebase Storage `/maintenance/{request_id}/images/`
- Hiển thị thumbnail trong danh sách yêu cầu
- Kỹ thuật viên có thể xem full resolution ảnh

**Schema**:
```typescript
MaintenanceRequest {
  ...existing fields,
  images: [
    {
      url: string,
      uploaded_by: string,
      uploaded_at: timestamp,
      description?: string
    }
  ]
}
```

---

### 3. Theo dõi chi phí (Cost Tracking)
**Mục đích**: Tính toán lợi nhuận ròng chính xác cho từng phòng.

**Chức năng chính**:
- Thêm fields trong maintenance request:
  - Danh mục chi phí (parts, labor, external service)
  - Chi tiết vật tư (tên, số lượng, đơn giá)
  - Chi phí lao động (số giờ × đơn giá/giờ)
  - Chi phí dịch vụ bên ngoài (thợ điện, thợ ống nước)
  - Ghi chú (hóa đơn, biên lai)
- Bảng tổng hợp chi phí:
  - Chi phí theo phòng / theo tháng / theo năm
  - Chi phí theo loại sự cố
  - Xu hướng chi phí (tăng/giảm)
- Tính ROI: (Doanh thu phòng - Chi phí bảo trì) / Chi phí bảo trì

**Database**:
```typescript
MaintenanceRequest {
  ...existing,
  costs: {
    labor: number,
    parts: number,
    external_service: number,
    total: number,
    items: [
      {
        category: string,
        description: string,
        quantity: number,
        unit_price: number
      }
    ]
  }
}
```

---

## Summary: Lộ trình Cải tiến

| Tính năng | Độ phức tạp | Thời gian ước tính |
|-----------|-------------|-------------------|
| Real-time phòng | Trung bình | 3-4 tuần |
| Gantt chart đặt phòng | Cao | 4-5 tuần |
| Conflict detection | Trung bình | 2-3 tuần |
| Audit log | Thấp | 1-2 tuần |
| Housekeeping mobile | Cao | 6-8 tuần |
| Amenities management | Thấp | 1 tuần |
| ACL quyền | Trung bình | 2-3 tuần |
| Shift management | Trung bình | 3-4 tuần |
| Digital file storage | Trung bình | 2-3 tuần |
| Maintenance automation | Trung bình | 2 tuần |
| Maintenance images | Thấp | 1-2 tuần |
| Cost tracking | Trung bình | 2-3 tuần |

