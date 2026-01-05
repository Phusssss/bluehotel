# 🔎 Phân tích triển khai hệ thống (Toàn bộ dự án)

**Mục tiêu:** Đánh giá hiện trạng chức năng đã triển khai, kiểm tra tính hợp lý của luồng dữ liệu, phát hiện điểm còn thiếu/risks và đề xuất hành động ưu tiên.

---

## 1) Tóm tắt nhanh
- Kiến trúc dự án rõ ràng: *services* (Firestore), *stores* (Zustand), *components/pages* (React), *utils*.
- Các domain cốt lõi (Auth, Rooms, Reservations, Guests, Invoices, Analytics) đã có triển khai cơ bản và nhiều tính năng nâng cao.
- Điểm cần lưu ý: một số logic thực thi ở client-side (lọc, kiểm tra), thiếu ranh giới server-side (rules / transactions), và thiếu test tự động.

---

## 2) Phân tích theo module (chi tiết)

### Authentication
- Hiện trạng: `authService` có signIn/signOut/createUser/getUserProfile/email reset/verification helpers; `useAuth` + `useAuthStore` giữ state.
- Luồng dữ liệu: Firebase Auth ↔ Firestore (users profile) ↔ Zustand store. Xử lý lỗi đã được chuẩn hoá (`formatFirebaseError`).
- Vấn đề: cần đảm bảo `onAuthStateChanged` luôn fetch profile thực tế và kiểm tra `isActive`; chưa có rules Firestore rõ ràng cho quyền truy cập.
- Khuyến nghị: enforce isActive, add role/permission checks, deploy Firestore rules, hỗ trợ 2FA/SSO tùy nhu cầu.

### Rooms
- Hiện trạng: CRUD, unique `roomNumber`, soft-delete (`isDeleted`), bulk ops UI, modal detail hiện có placeholder.
- Luồng dữ liệu: tạo → kiểm tra tồn tại → ghi Firestore → store fetch/hiển thị.
- Vấn đề: `blockedDates` chưa được sử dụng/hiện thị; cần đảm bảo availability & reservation logic không sử dụng phòng `isDeleted`; pagination cần trả `lastDoc` để load more; delete phải an toàn (kiểm tra đặt phòng active).
- Khuyến nghị: surface `blockedDates` UI, dùng soft-delete everywhere (tránh create reservation cho phòng `isDeleted`), thêm index Firestore và tests cho create/delete.

### Reservations
- Hiện trạng: create/update/delete, checkAvailability, getAvailableRooms, check-in/out, modification history, bulk ops, export, conflict detection.
- Luồng dữ liệu: client kiểm tra availability → tạo reservation (ghi Firestore) → modification tracked.
- Vấn đề: checkAvailability hiện client-driven → có thể có race condition (double-booking) nếu hai client tạo cùng lúc; advanced filters là client-side (không scale tốt).
- Khuyến nghị: sử dụng Firestore transactions / server-side validation (Cloud Function) khi tạo reservation, di chuyển một số lọc phức tạp lên server, thực hiện tests concurrency.

### Guests
- Hiện trạng: CRUD, VIP flag, list/search UI.
- Vấn đề & khuyến nghị: thêm profile view, blacklist, liên hệ/communication log nếu cần.

### Invoices
- Hiện trạng: tạo/hủy/thiết lập dịch vụ thêm, payment status, export PDF hook ở UI.
- Vấn đề: đảm bảo đồng bộ paymentStatus giữa Reservation và Invoice; cải thiện template PDF nếu cần.
- Khuyến nghị: centralize tax calc, ensure payment flow atomic when needed.

### Analytics / Dashboard
- Hiện trạng: occupancy/revenue metrics, conflict detection implemented in services.
- Gợi ý: với dữ liệu lớn nên thêm server-side aggregation/caching.

---

## 3) Vấn đề về dữ liệu & invariants cần bảo đảm
- FK integrity: reservation phải tham chiếu room/guest thực sự tồn tại; nên validate server-side.
- Soft-delete: phòng `isDeleted` không được hiển thị hay cho phép đặt phòng; verify mọi luồng tuân thủ.
- Concurrency: chống double-booking bằng transaction/Cloud Function.

---

## 4) Bảo mật & rules
- Hiện chưa thấy Firestore security rules trong repo.
- Bắt buộc: viết rules để:
  - user chỉ đọc/ghi resources của `hotelId` tương ứng (trừ admin);
  - chỉ roles có quyền thực hiện thao tác quản trị (delete/force-delete/restore);
  - validate các fields quan trọng (hotelId, roomId) khi tạo tài liệu.
- Thử nghiệm rules bằng Firebase Emulator (emulator-suite).

---

## 5) Testing & CI
- Thiếu unit/integration tests. Nên thêm tối thiểu:
  - `roomService.createRoom` (duplicate roomNumber), `deleteRoom` safety, pagination;
  - `reservationService.checkAvailability` (edge cases) và transaction tests;
  - Auth flows và format error tests.
- Thêm pipeline CI chạy Vitest + emulator tests.

---

## 6) Ưu tiên hành động (ngắn hạn → dài hạn)
1. Firestore Security Rules + tests trên Emulator (high) 🔒
2. Server-side reservation validation (transaction or Cloud Function) để tránh double-booking (high) ⚠️
3. Ensure availability queries exclude `isDeleted` rooms and incorporate `blockedDates` (high)
4. Add unit/integration tests for Rooms & Reservations (medium)
5. Implement blockedDates UI + integration with calendar (medium)
6. Improve exports, PDF templates, analytics aggregation (low)

---

## 7) Gợi ý công việc tiếp theo (tôi có thể làm giúp)
- A: Tạo Firestore rules và test suite (emulator) — ưu tiên rất cao.
- B: Thêm transactional reservation creation/Cloud Function để chặn race condition.
- C: Triển khai blockedDates UI và kết nối với availability check.
- D: Thêm test cho pagination & delete safety.

Bạn muốn tôi bắt đầu với lựa chọn nào? Tôi sẽ tạo file MD chi tiết (đã xong), hoặc tiếp tục và triển khai task bạn chọn.✅
