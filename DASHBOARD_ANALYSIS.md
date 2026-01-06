# Phân tích chức năng Dashboard

## Tổng quan

Dashboard hiện tại gồm các thành phần chính sau:

- `OverviewCards` (src/components/dashboard/OverviewCards.tsx): hiển thị các chỉ số tổng quan (tỷ lệ lấp phòng, check-in hôm nay, doanh thu hôm nay, đặt phòng sắp tới).
- Biểu đồ (trong `src/pages/Dashboard.tsx`): biểu đồ thanh lấp đầy phòng 7 ngày và biểu đồ đường doanh thu 7 ngày (dùng `recharts`).
- `ReservationListPreview` (src/components/dashboard/ReservationListPreview.tsx): danh sách nhanh các đặt phòng sắp tới, nút xem chi tiết và check-in nhanh.
- `AlertsPanel` (src/components/dashboard/AlertsPanel.tsx): hiển thị danh sách cảnh báo/ thông báo với phân loại priority và hành động xem/ẩn.
- Mục `Recent Activity` trong `src/pages/Dashboard.tsx`: danh sách hoạt động gần đây (hiện render nếu có phần tử).
- Hook `useDashboardData` (src/hooks/useDashboardData.ts) được sử dụng để nạp dữ liệu dashboard.
- Store `useReservationStore` được dùng để xử lý check-in nhanh từ dashboard.

## Đã có những gì (Implemented)

- Giao diện tổng quan rõ ràng, sử dụng Ant Design và Recharts: cards, charts, list.
- Các thành phần tách nhỏ (OverviewCards, ReservationListPreview, AlertsPanel) giúp tái sử dụng.
- Hiển thị dữ liệu tóm tắt cho 7 ngày và danh sách rút gọn (5 mục) kèm hành động nhanh.
- Có flow check-in nhanh (`onQuickCheckIn`) gọi `useReservationStore.checkInReservation` và refresh dữ liệu.
- Badge hiển thị số cảnh báo ưu tiên cao trong `AlertsPanel`.
- Tooltip/formatting cho tiền và ngày đã được xử lý ở nhiều chỗ (locale `vi-VN`).

## Chưa có / Thiếu (Missing or incomplete)

- Nguồn `hotelId` hiện hard-coded trong `src/pages/Dashboard.tsx` (`const hotelId = 'hotel-1'`) — chưa lấy từ authentication/context.
- Điều hướng tới trang chi tiết đặt phòng chưa được implement (chỉ log `console.log` trong `handleViewReservation`).
- Hành động xem/ẩn cảnh báo (`onViewAlert`, `onDismissAlert`) được truyền vào từ `Dashboard` nhưng không có triển khai gọi API hoặc cập nhật store thực tế.
- Thiếu xác nhận/confirmation khi thực hiện hành động quan trọng (ví dụ check-in nhanh, dismiss alert).
- Thiếu kiểm tra phân quyền/permission trước khi cho phép check-in hoặc thao tác cảnh báo.
- Thiếu xử lý lỗi chi tiết (hiện chỉ hiện `message.error('Check-in failed!')` mà không log lỗi hoặc hiển thị chi tiết). 
- Hooks/service chưa được kiểm tra ở đây (cần xác nhận `useDashboardData` và các `service` tương ứng để đảm bảo shape dữ liệu, fallback khi null/undefined, và xử lý lỗi).
- Không có pagination hoặc link tới trang đầy đủ cho danh sách (chỉ có "Xem tất cả" nhưng chưa điều hướng đến trang tương ứng).
- Thiếu cập nhật real-time (WebSocket/Firestore realtime) để phản ánh check-in/check-out và cảnh báo ngay lập tức.
- Thiếu unit/integration tests cho các component dashboard.

## Cần thay đổi / Đề xuất (Changes & Recommendations)

1. Lấy `hotelId` từ context/auth:
   - Thay `const hotelId = 'hotel-1'` bằng giá trị lấy từ `useAuth` hoặc `useAuthStore` để đảm bảo dashboard hiển thị theo khách sạn người dùng đang quản lý.

2. Hoàn thiện điều hướng và hành động chi tiết:
   - Triển khai `handleViewReservation` để điều hướng sang trang chi tiết đặt phòng (ví dụ: route `/reservations/:id`).
   - Triển khai `onViewAlert` và `onDismissAlert` để gọi API hoặc cập nhật store; thêm confirmation trước khi dismiss.

3. Xác thực phân quyền:
   - Trước khi hiển thị nút `Check-in` hoặc cho phép thao tác admin, kiểm tra quyền của user (ví dụ `canManageReservations`).

4. Cải thiện UX cho hành động quan trọng:
   - Thêm modal xác nhận cho `Quick Check-in` (hiển thị thông tin reservation, khung thời gian, và ghi chú).
   - Hiển thị spinner/disable button khi xử lý, show lỗi chi tiết khi thất bại.

5. Nâng cao độ bền dữ liệu và xử lý lỗi:
   - `useDashboardData` nên trả về cấu trúc an toàn (mặc định empty arrays / zeros) để tránh crash khi `data` là undefined.
   - Thêm logging lỗi (Sentry / console) và hiển thị message người dùng rõ ràng.

6. Tối ưu hiển thị dữ liệu lớn:
   - Thêm pagination hoặc link tới trang đầy đủ cho danh sách đặt phòng và cảnh báo.
   - Xem xét lazy-loading hoặc virtualization nếu có nhiều mục.

7. Real-time cập nhật (tùy trường hợp sử dụng):
   - Nếu cần cập nhật ngay khi có check-in/check-out hoặc cảnh báo, tích hợp WebSocket hoặc Firestore realtime listener.

8. Kiểm thử và tài liệu:
   - Thêm unit tests cho các component dashboard (render, props, hành vi nút).
   - Làm rõ contract API trong `src/services/*` và document fields cần thiết cho `useDashboardData`.

9. Localization & consistency:
   - Chuẩn hóa format ngày/tiền ở 1 chỗ (utility hoặc Intl wrapper) thay vì dùng `toLocaleString` rải rác.
   - Trừ khi ứng dụng multi-language, tách text cứng sang file copy (i18n) để dễ bảo trì.

10. Type safety & code quality:
   - Hoàn thiện TypeScript interfaces cho dữ liệu dashboard (ví dụ `OverviewData`, `AlertItem`, `Reservation` types).
   - Thêm kiểm tra null/optional chaining nơi cần.

11. Accessibility & Responsive:
   - Kiểm tra aria labels cho nút hành động quan trọng.
   - Đảm bảo layout charts hoạt động tốt trên mobile (chiều cao biểu đồ, overflow xử lý).

## Nhiệm vụ ưu tiên (Quick wins)

- Thay `hotelId` lấy từ auth context (cực kỳ quan trọng để dữ liệu chính xác).
- Triển khai điều hướng `View Reservation` đến trang chi tiết.
- Thêm confirmation modal cho Quick Check-in và xử lý lỗi chi tiết.
- Triển khai `onDismissAlert` để gọi API và cập nhật UI (với confirmation).

## Tài liệu tham khảo code (vị trí file)

- Trang Dashboard: src/pages/Dashboard.tsx
- Overview cards: src/components/dashboard/OverviewCards.tsx
- Reservation preview: src/components/dashboard/ReservationListPreview.tsx
- Alerts panel: src/components/dashboard/AlertsPanel.tsx
- Hook dữ liệu: src/hooks/useDashboardData.ts
- Store reservation: src/store/useReservationStore.ts

---

Nếu bạn muốn, tôi có thể tiếp tục và:

- (A) Tạo PR chuyển `hotelId` từ hard-coded sang lấy từ `useAuth` và thêm test nhỏ, hoặc
- (B) Triển khai `handleViewReservation` để điều hướng, hoặc
- (C) Viết modal xác nhận cho Quick Check-in và cập nhật `useReservationStore` call.

Chọn một hành động để tôi thực hiện tiếp.
