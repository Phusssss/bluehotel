# Phân tích Dashboard — Version 2

Tôi đã rà soát lại mã nguồn sau khi bạn cập nhật. Dưới đây là tóm tắt những gì đã được triển khai, những phần còn thiếu, và khuyến nghị ưu tiên.

## Những thay đổi đã implement (so với lần 1)

- `hotelId` đã được lấy từ `useAuth()` trong `src/pages/Dashboard.tsx` (không còn hard-coded).
- `Quick Check-in` bây giờ có modal xác nhận (`showConfirmationModal`) và xử lý lỗi chi tiết trong `handleQuickCheckIn`.
- `checkIn` logic hoàn chỉnh đã được triển khai trong `src/services/reservationService.ts` và được gọi qua `useReservationStore.checkInReservation`.
- `useDashboardData` có xử lý an toàn (default values), báo lỗi khi `hotelId` không hợp lệ, và hàm `refreshData` để làm mới dữ liệu.
- `useReservationStore` đã có nhiều action nâng cao (check-in/out, availability, bulk ops, pagination helpers, move/modify/reservation history, export, detectConflicts, calculateOccupancy) và đang gọi `reservationService` tương ứng.
- Utilities và components hỗ trợ có sẵn: `showConfirmationModal` và `formatUtils`.
- Dashboard hiển thị lỗi nếu `useDashboardData.error` có giá trị và có nút `Thử lại`.

## Các phần vẫn thiếu / cần hoàn thiện

1. Dismiss alert (ẩn/đánh dấu cảnh báo):
   - `handleDismissAlert` trong `src/pages/Dashboard.tsx` còn TODO: chỉ gọi `refreshData()` sau confirmation; không có API/service để persist hoặc đánh dấu cảnh báo đã xử lý.
   - `generateAlerts` hiện tạo alerts tạm thời từ dữ liệu reservation/room — không có lưu trạng thái alert ở backend.

2. View alert (xem chi tiết):
   - `handleViewAlert` vẫn `console.log` — không điều hướng hoặc hiển thị modal chi tiết.

3. Phân quyền / permission checks:
   - Không thấy check quyền (ví dụ `canManageReservations`) trước khi hiển thị hoặc cho phép `Check-in` và các thao tác quản trị khác.

4. Navigation của "Xem tất cả":
   - `ReservationListPreview` và `AlertsPanel` có nút `Xem tất cả` nhưng không truyền handler/route cụ thể (chỉ là `Button type="link"`). Cần điều hướng tới trang đầy đủ hoặc bật modal.

5. Real-time updates:
   - Dashboard vẫn dùng polling/manual refresh (`refreshData`) — không có listener real-time (Firestore snapshot / WebSocket) để tự động cập nhật khi xảy ra check-in/check-out hoặc alert mới.

6. Alerts storage & lifecycle:
   - Hiện alerts được sinh trong frontend (generateAlerts). Nếu cần quản lý cảnh báo (acknowledge/dismiss/history), cần một collection `alerts` hoặc service để persist và query.

7. Tests: thiếu unit/integration tests cho components và hooks liên quan tới dashboard.

8. Pagination / large lists in UI:
   - Store có `fetchReservationsPaginated`, nhưng UI vẫn hiển thị slice(0,5/10) và thiếu navigation/pagination UI cho danh sách lớn.

9. Accessibility: cần audit aria-labels cho các nút quan trọng và đảm bảo keyboard navigation cho modal/action.

10. Consistency: Một số text vẫn hard-coded trong component (tuy không nghiêm trọng), và cần tập trung các chuỗi hiển thị vào hệ thống i18n nếu mở rộng ngôn ngữ.

## Đề xuất thay đổi (ưu tiên)

- Nhanh (Quick wins):
  1. Triển khai API/service `alertService` (collection `alerts`) hoặc dùng reservationService để persist alert nếu muốn, rồi cập nhật `handleDismissAlert` để gọi service và cập nhật UI.
  2. Triển khai `handleViewAlert` để điều hướng tới trang chi tiết alert hoặc mở modal hiển thị chi tiết.
  3. Thêm handler cho nút `Xem tất cả` trong `ReservationListPreview` và `AlertsPanel` (route tới `/reservations` và `/alerts`).

- Trung bình (Mid priority):
  4. Thêm kiểm tra phân quyền trước các hành động nhạy cảm (Check-in, dismiss alert, bulk ops). Có thể dùng `userProfile.roles` hoặc `useAuthStore`.
  5. Thêm feedback loading/disable cho từng reservation action dựa vào `operationStatus` (store đã có field này).

- Cao cấp (Optional / later):
  6. Tích hợp Firestore realtime listeners trong `useDashboardData` (snapshot listeners) để có updates tự động.
  7. Thêm unit tests cho `useDashboardData`, `ReservationListPreview`, `AlertsPanel`.
  8. Nếu cần audit trail cho alerts/reservation modifications, dùng collection riêng và expose endpoints trong `reservationService` hoặc `alertService`.

## Ghi chú kỹ thuật nhanh

- `reservationService` đã có sẵn: `checkIn`, `checkOut`, `checkAvailability`, `getAvailableRooms`, `modifyReservation`, `getModificationHistory`, `detectConflicts`, `calculateOccupancy`, `exportReservations`.
- `useReservationStore` tận dụng các service trên và đã xử lý `operationStatus` để hiển thị trạng thái thao tác cho từng reservation.

## Next steps tôi có thể làm cho bạn

- (1) Triển khai `alertService` + cập nhật `handleDismissAlert` và thêm UI "Xem tất cả" cho alerts (PR nhỏ). 
- (2) Thêm điều hướng cho nút `Xem tất cả` trong `ReservationListPreview` và `AlertsPanel`.
- (3) Thêm permission check wrapper hiển thị/ẩn nút dựa trên `userProfile.roles`.

Hãy chọn (1)/(2)/(3) hoặc yêu cầu khác để tôi bắt tay vào thực hiện tiếp.
