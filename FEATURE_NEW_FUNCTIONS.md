# CHỨC NĂNG MỚI - NEW FEATURES FOR HOTEL MANAGEMENT

## I. HỆ THỐNG DỊCH VỤ & POS LITE (Services & Point of Sale)

### Tổng quan
**Mục đích**: Quản lý các dịch vụ đi kèm và cho phép ghi nợ vào phòng.

**Các dịch vụ hỗ trợ**:
- Nhà hàng (Restaurant)
- Bar/Lounge
- Minibar/Fridge
- Giặt ủi (Laundry)
- Spa/Massage
- Tour du lịch
- Dịch vụ khác

---

### 1. Quản lý Danh mục Dịch vụ (Service Catalog)
**Chức năng**:
- Admin tạo/chỉnh sửa dịch vụ:
  - Tên dịch vụ (VN/EN)
  - Mô tả
  - Danh mục (Food, Beverage, Laundry, etc.)
  - Loại giá (fixed, variable)
  - Ảnh sản phẩm
  - Phí bắt buộc (surcharge %)
  - Trạng thái (active/inactive)
  
**Database**:
```typescript
Service {
  id: string,
  name_vi: string,
  name_en: string,
  description: string,
  category: 'food' | 'beverage' | 'laundry' | 'spa' | 'other',
  type: 'fixed' | 'variable',
  price_type: 'per_unit' | 'per_person' | 'fixed',
  image_url?: string,
  surcharge_percent?: number,
  is_active: boolean,
  created_at: timestamp
}

MenuItem {
  id: string,
  service_id: string,
  name: string,
  description: string,
  price: number,
  image_url?: string,
  is_available: boolean,
  category: string,
  prepartion_time?: number (minutes)
}
```

---

### 2. Ghi nợ vào phòng (Post to Room)
**Mục đích**: Khách sử dụng dịch vụ không cần trả tiền ngay, tự động cộng dồn vào hóa đơn.

**Quy trình**:
1. Nhân viên nhà hàng/bar tạo order
2. Chọn phòng/khách từ dropdown
3. Thêm items vào order
4. Hệ thống tự động tạo **charge item** trong hóa đơn của khách
5. Khi khách check-out, tổng dịch vụ đã tính vào bill

**Chức năng**:
- Hiển thị danh sách phòng có khách (occupied)
- Ghi chú cho mỗi order (vd: "phòng 102 gọi cơm trưa")
- Lịch sử order: ai tạo, mấy giờ, tổng tiền
- Nếu khách phàn nàn, có thể xóa/sửa item (ghi log ai thay đổi)
- Tính tip & tax tự động

**Schema**:
```typescript
RoomService {
  id: string,
  room_id: string,
  guest_name: string,
  items: [
    {
      service_id: string,
      menu_item_id?: string,
      name: string,
      quantity: number,
      unit_price: number,
      subtotal: number,
      created_at: timestamp
    }
  ],
  subtotal: number,
  surcharge: number,
  tax: number,
  total: number,
  status: 'pending' | 'confirmed' | 'cancelled',
  created_by: string,
  created_at: timestamp,
  notes: string
}
```

---

### 3. Hóa đơn tổng hợp (Bill Aggregation)
**Chức năng**:
- Hóa đơn check-out tự động gộp:
  - Phí phòng
  - Dịch vụ ghi nợ (nhà hàng, bar, giặt ủi, etc.)
  - Tax & surcharge
  - Discount (nếu có promo)
  - Thanh toán định kỳ (cộng dồn)
- Chi tiết hóa đơn dạng bảng:
  - Ngày/giờ, mô tả, số lượng, giá, tổng
- Hỗ trợ in PDF hoặc gửi qua email
- Ghi nhận thanh toán: Tiền mặt, Thẻ, Chuyển khoản, etc.

---

### 4. Quản lý POS Terminal
**Chức năng**:
- Thiết lập POS cho các điểm dịch vụ (nhà hàng, bar, reception)
- Mỗi POS có:
  - Tên điểm
  - Danh sách menu
  - Quản lý tài khoản (đăng nhập POS-specific)
  - Tổng doanh thu theo ngày/tháng
- Offline mode: POS vẫn hoạt động khi mất mạng, đồng bộ khi có kết nối
- Báo cáo: Doanh thu phân tích theo dạng dịch vụ

---

## II. CỔNG THÔNG TIN KHÁCH HÀNG (Guest Portal)

### Tổng quan
**Mục đích**: Web app khách truy cập qua mã QR trong phòng để tự phục vụ.

**URL**: `https://hotel.com/guest?token={room_token}`

---

### 1. Giao diện Guest Portal
**Chức năng chính**:
- **Dashboard**:
  - Thông tin phòng (tên phòng, check-out time)
  - Số dư tài khoản (tiền dịch vụ đã tiêu)
  - Thông báo nhanh
  
- **Gọi đồ ăn / Đặt dịch vụ** (Room Service):
  - Hiển thị menu nhà hàng/bar theo category
  - Thêm vào giỏ hàng (cart)
  - Chọn giờ giao (ASAP, schedule)
  - Ghi chú đặc biệt (vd: không ớt, vô cùng dễ ớt)
  - Thanh toán: ghi nợ phòng / thanh toán tiền mặt khi giao
  - Tracking: hiển thị trạng thái order (confirmed, preparing, on the way, delivered)

- **Yêu cầu bổ sung** (Additional Requests):
  - Thêm khăn/gối/chăn
  - Yêu cầu vệ sinh lại phòng
  - Sửa chữa nhanh (bóng đèn, vòi nước)
  - Ghi chú & ảnh (khách chụp ảnh sự cố)

- **Thông tin dịch vụ khách sạn**:
  - Giờ mở các dịch vụ (nhà hàng, gym, pool)
  - Thông tin Wi-Fi / TV channels
  - Hướng dẫn sử dụng
  - Liên hệ reception/manager

- **Hóa đơn**:
  - Xem tạm tính hóa đơn check-out
  - Tải xuống PDF
  - Báo cáo khiếu nại về hóa đơn

- **Đánh giá & Feedback**:
  - Form đánh giá sau khi check-out
  - Rating: phòng, dịch vụ, thức ăn, nhân viên
  - Ghi chú ý kiến, đề xuất

---

### 2. Gọi phục vụ (Call Concierge)
**Chức năng**:
- Nút gọi ngay lễ tân/quản lý
- Chat hỗ trợ real-time (Firebase Firestore messages)
- Danh sách cuộc gọi trước đó (lịch sử)
- Ưu tiên: gọi khẩn cấp / yêu cầu thường

---

### 3. Kỹ thuật & Bảo mật
**Công nghệ**:
- Frontend: React SPA, Tailwind CSS
- Backend: Firebase Functions
- Authentication: Token-based (room_token)
  - Token tạo khi check-in, hết hạn khi check-out
  - Chỉ có thể truy cập dữ liệu của phòng đó

**Responsive Design**:
- Mobile-first (vì khách dùng điện thoại)
- PWA: hoạt động offline (cache menu, orders)

---

## III. SƠ ĐỒ KHÁCH SẠN TƯƠNG TÁC (Interactive Floor Plan)

### Tổng quan
**Mục đích**: Hiển thị bản đồ tầng thay vì danh sách, cho phép tương tác nhanh.

---

### 1. Tạo Sơ đồ Tầng
**Chức năng quản trị**:
- Admin upload ảnh sơ đồ tầng (SVG hoặc canvas)
- Đánh dấu vị trí từng phòng trên sơ đồ:
  - Vẽ polygon/box quanh phòng
  - Gán room_id cho mỗi khu vực
  - Căn chỉnh vị trí
  - Hỗ trợ zoom để dễ chỉnh sửa
- Lưu sơ đồ vào Firebase Storage (SVG format)

---

### 2. Hiển thị & Tương tác
**Giao diện người dùng**:
- Hiển thị sơ đồ tầng với phòng được tô màu theo trạng thái:
  - Xanh: AVAILABLE (sẵn sàng)
  - Đỏ: OCCUPIED (có khách)
  - Xám: MAINTENANCE
  - Vàng: CLEANING
  - Đen: BLOCKED
  
- **Tương tác**:
  - Hover phòng → hiển thị tooltip (tên phòng, trạng thái, khách)
  - Click phòng → popup chi tiết & các hành động:
    - **Check-in** (nếu trạng thái AVAILABLE)
    - **Check-out** (nếu OCCUPIED)
    - **View details** (xem thông tin khách, dịch vụ)
    - **Mark cleaning** (đánh dấu cần vệ sinh)
    - **Maintenance** (tạo yêu cầu bảo trì)

- **Zoom & Pan**:
  - Phóng to/thu nhỏ sơ đồ
  - Kéo sơ đồ để xem các tầng khác

- **Bộ lọc**:
  - Filter theo trạng thái (chỉ hiển thị phòng trống)
  - Filter theo loại phòng (single, double, suite)
  - Tìm kiếm số phòng

---

### 3. Công nghệ
**Library**:
- SVG.js hoặc Fabric.js: để vẽ/chỉnh sửa sơ đồ
- Leaflet.js hoặc Mapbox: nếu muốn có cảm giác như bản đồ thực

**Real-time Update**:
- Khi room status thay đổi → sơ đồ tô màu lại ngay (Firebase onSnapshot)

---

## IV. QUẢN LÝ KÊNH PHÂN PHỐI MINI (Mini Channel Manager)

### Tổng quan
**Mục đích**: Đồng bộ lịch với các sàn OTA (Booking.com, Agoda, Airbnb) để tránh overbooking.

---

### 1. Kết nối OTA
**Chức năng**:
- Admin thiết lập API key cho các OTA:
  - Booking.com (XML API hoặc Push API)
  - Agoda (Mapping API)
  - Airbnb (API Access)
- Lưu trữ credentials an toàn (Firebase Secrets Manager)

---

### 2. Đồng bộ lịch (iCal Sync)
**Quy trình**:
1. Hotel tạo iCal feed (ical.ics) từ dữ liệu reservation
2. OTA subscribe vào feed này
3. Mỗi khi có đặt phòng mới trong hệ thống hotel → tự động cập nhật feed
4. OTA đọc feed & cập nhật tình trạng room availability

**Công nghệ**:
- Tạo endpoint: `GET /api/ical/feed.ics` trả về iCal format
- iCal library: `ical.js`
- Cron job: cập nhật feed mỗi 30 phút

**Lợi ích**:
- Không bán trùng phòng khi khách đặt từ Booking + Airbnb cùng lúc
- Tự động khóa phòng khi có đặt từ OTA

---

### 3. Two-way Sync
**Nâng cao**:
- Hotel → OTA: Khi đặt phòng trong hệ thống → push update lên OTA
- OTA → Hotel: Khi khách đặt từ Booking → tự động tạo reservation trong hệ thống

**Công nghệ**:
- Webhook: OTA gửi webhook khi có booking mới
- Cloud Function xử lý webhook → tạo reservation trong Firebase

**Cảnh báo**:
- Nếu phát hiện xung đột (e.g., khách đặt phòng 101 từ Booking, đó nhân viên cũng đặt phòng 101) → cảnh báo ngay

---

### 4. Rate Management
**Chức năng**:
- Quản lý giá theo OTA:
  - Giá cơ sở: 1,000,000 VND
  - Giá Booking.com: 950,000 VND (giảm 50k vì commission)
  - Giá Airbnb: 1,100,000 VND (tăng 100k vì nhu cầu cao)
- Tự động cập nhật giá lên OTA qua API
- Promotional rate: ngày đặc biệt (lễ hội, sự kiện) có giá khác

---

## V. QUẢN LÝ KHO & VẬT TƯ (Inventory Management)

### Tổng quan
**Mục đích**: Quản lý vật tư tiêu hao và cảnh báo khi sắp hết hàng.

---

### 1. Danh mục vật tư
**Items**:
- Vệ sinh (kem đánh răng, xà phòng, dầu gội)
- Khăn (tay, tắm, linen, pillows)
- Minibar (nước, đồ ăn nhẹ)
- Nội thất (bóng đèn, giấy vệ sinh, giấy che nắng)

**Quản lý**:
```typescript
InventoryItem {
  id: string,
  name: string,
  category: 'amenities' | 'towels' | 'food' | 'furniture' | 'other',
  unit: 'piece' | 'bottle' | 'box' | 'meter',
  current_quantity: number,
  min_threshold: number, // Cảnh báo khi ≤ ngưỡng này
  reorder_quantity: number, // Mua bao nhiêu khi order
  supplier: string,
  unit_cost: number,
  location: string, // Kho hoặc vị trí cụ thể
  last_updated: timestamp
}
```

---

### 2. Quản lý Tồn kho
**Chức năng**:
- Ghi nhận nhập kho (purchase, tặng)
- Ghi nhận xuất kho (sử dụng, mất)
- Inventory count: kiểm kho định kỳ (hàng tháng/quý)
- Điều chỉnh lệch (khi kiểm kho phát hiện sai số)

**Ghi nhận sử dụng**:
- Housekeeping ghi nhận: "Phòng 102 dùng 2 chai xà phòng" → tự động trừ tồn kho
- Hoặc áp dụng mặc định: mỗi phòng vệ sinh = 1 set amenities

---

### 3. Cảnh báo & Báo cáo
**Cảnh báo**:
- Push notification khi tồn kho ≤ min_threshold
- Email thông báo cho quản lý kho
- Dashboard hiển thị "Items sắp hết"

**Báo cáo**:
- Mức tiêu thụ trung bình/tháng trên mỗi phòng
- Dự báo: "Dùng hết xà phòng trong 5 ngày nữa"
- Ranking: vật tư tiêu hao nhiều nhất
- Chi phí: tính chi phí vật tư/phòng/ngày để tính ROI

---

### 4. Automation
**Quy trình**:
- Khi tồn kho ≤ min_threshold → tự động tạo purchase order
- Có thể set auto-reorder hoặc manual approval
- Email nhà cung cấp với danh sách order

---

## VI. MARKETING & CHĂM SÓC KHÁCH HÀNG (CRM)

### Tổng quan
**Mục đích**: Tận dụng dữ liệu khách để tạo trải nghiệm cá nhân hóa & tăng loyalty.

---

### 1. Quản lý dữ liệu khách (Guest Profile)
**Thông tin**:
- Tên, tuổi, giới tính, quốc tịch
- Số điện thoại, email
- Địa chỉ, công ty (nếu business guest)
- **Ngày sinh** (để gửi lời chúc)
- **Lịch lưu trú** (check-in/out dates)
- **Sở thích** (loại phòng, dịch vụ yêu thích)
- **Ghi chú** (VIP, khách lặp lại, khiếu nại trước đó)
- **Preference flags** (tự chọn: không gọi sáng sớm, yêu thích loại giường, etc.)

**Phân loại khách**:
- New guest (lần đầu)
- Returning guest (đã lưu trú ≥ 2 lần)
- VIP (lưu trú ≥ 5 lần hoặc chi tiêu lớn)
- Corporate (công ty thường xuyên đặt)

---

### 2. Chiến dịch Marketing tự động
**Email Birthday Campaign**:
- Khi khách có ngày sinh đó → tự động gửi email:
  - Tiêu đề: "Happy Birthday! [Name]"
  - Nội dung: Lời chúc mừng + mã giảm giá sinh nhật (10-20%)
  - CTA: "Đặt lại phòng của bạn"
  - Thời gian gửi: sáng hôm đó

**Post-stay Survey**:
- Sau check-out 1 ngày → gửi email:
  - Nội dung: Cảm ơn khách lưu trú + đánh giá nhanh (5 sao)
  - Gợi ý: "Nếu bạn thích, hãy để lại review trên TripAdvisor"
  - Nếu rating < 3 sao → flag để manager follow-up

**Re-engagement Campaign**:
- Khách không quay lại > 6 tháng → gửi email:
  - "Chúng tôi nhớ bạn!"
  - Nội dung: Cập nhật dịch vụ mới + khuyến mãi đặc biệt
  - CTA: "Đặt ngay"

---

### 3. Loyalty Program (Points System)
**Cơ chế**:
- Mỗi lần lưu trú = kiếm điểm: 1 USD = 1 point
- Mỗi lần dùng dịch vụ = kiếm điểm: 5% của bill
- Tích lũy điểm → redeem: 100 points = 10 USD discount

**Tiers**:
- **Silver** (0-1000 points): Chào mừng
- **Gold** (1000-5000 points): Early check-in, late check-out
- **Platinum** (5000+ points): Free upgrade, room service credit

**Ghi nhận**:
```typescript
LoyaltyAccount {
  id: string,
  guest_id: string,
  total_points: number,
  tier: 'silver' | 'gold' | 'platinum',
  joined_date: timestamp,
  point_history: [
    {
      date: timestamp,
      action: 'stay' | 'service' | 'purchase' | 'redemption',
      points: number,
      description: string
    }
  ],
  next_tier_progress: number // %
}
```

---

### 4. Analytics & Insights
**Báo cáo**:
- Tỷ lệ khách quay lại (repeat rate)
- Average booking value theo loại khách
- Dịch vụ phổ biến nhất
- Feedback trend (points trung bình)

**Chỉ số CRM**:
- Lifetime Value (LTV): tổng chi tiêu của khách theo thời gian
- Churn rate: % khách không quay lại
- Net Promoter Score (NPS): "Bạn có giới thiệu khách sạn cho bạn bè?"

---

## Summary: Roadmap Triển khai Features Mới

| Tính năng | Độ phức tạp | Thời gian ước tính | Dependencies |
|-----------|-------------|-------------------|--------------|
| POS Lite + Services | Cao | 6-8 tuần | Reservation module |
| Guest Portal | Trung bình | 4-5 tuần | Reservation, Invoice |
| Interactive Floor Plan | Trung bình | 4-5 tuần | Real-time room status |
| Channel Manager (iCal) | Cao | 6-8 tuần | Reservation module |
| Two-way OTA Sync | Rất cao | 8-10 tuần | Channel Manager |
| Inventory Management | Trung bình | 4-5 tuần | Standalone |
| CRM & Loyalty | Trung bình | 5-6 tuần | Guest module |
| Marketing Automation | Trung bình | 3-4 tuần | CRM |

---

## Ưu tiên triển khai

**Phase 1** (Weeks 1-8): POS Lite, Guest Portal
**Phase 2** (Weeks 9-16): Interactive Floor Plan, Channel Manager
**Phase 3** (Weeks 17-24): Inventory, CRM & Loyalty

