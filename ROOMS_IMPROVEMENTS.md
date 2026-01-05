# 🛏️ Rooms — Phân tích & Đề xuất cải tiến

**Mục tiêu:** đánh giá hiện trạng module "Rooms", chỉ ra thiếu sót, đưa ra ưu tiên cải tiến và những ví dụ mã cần thiết để tăng độ ổn định, UX và khả năng mở rộng.

---

## 1) Tóm tắt hiện trạng (những gì đã có)
- CRUD rooms được triển khai (create, read, update, delete) — `src/services/roomService.ts`.
- UI: `Rooms` page (`src/pages/Rooms.tsx`) với **grid/list view**, filter/search (`RoomFilterComponent`), `RoomCard` và `RoomForm` components.
- Store: `useRoomStore` (Zustand) quản lý trạng thái, loading và filter.
- Room model bao gồm: roomNumber, roomType, basePrice, status, floor, maxGuests, amenities, images, createdAt, lastUpdated.

---

## 2) Những điểm cần cải tiến (theo độ ưu tiên)

### 🔴 High priority
- Safety checks khi xóa phòng: hiện xóa cứng (`deleteDoc`) mà không kiểm tra ràng buộc (có reservation active liên quan hay không) → cần prevent delete hoặc làm soft-delete (flag `isDeleted` / `archived`).
- Pagination & query limits: `getRooms` lấy toàn bộ rooms cho hotel; với scale lớn cần hỗ trợ pagination (`limit`, `startAfter`) và indexing.
- Room detail view: `handleViewRoom` là TODO → cần trang/ modal detail hiển thị ảnh gallery, lịch đặt (liên kết reservations), maintenance logs.

### 🟠 Medium priority
- Bulk operations: bulk update status, bulk assign to maintenance, bulk delete (với confirm & safety checks).
- Availability & blocked dates: hiện không có khung dữ liệu để đánh dấu block/maintenance qua ngày (useful cho calendar integration & availability search).
- Price rules / seasonal pricing: override basePrice theo ngày/period (promo management).
- Validation & UX: ensure unique `roomNumber` per hotel; improve client-side validation and show helpful error messages.

### 🟡 Low priority / Nice-to-have
- Import/export CSV (bulk create/update), Room templates, Room type management page (if room types can be customized via admin).
- Audit logs for room changes (who changed, when, old/new values).
- Tests: unit + integration for `roomService` & `useRoomStore`.

---

## 3) Kế hoạch hành động / checklist (tách PR)
1. PR-1 (High): **Delete safety** — prevent deleting rooms with active reservations; implement soft-delete option.
2. PR-2 (High): **Pagination & filters** — extend `roomService.getRooms` to accept `limit` and `startAfter`, add UI pagination (load more or page buttons).
3. PR-3 (Medium): **Room detail page** — modal/page with image gallery, reservation list, maintenance notes.
4. PR-4 (Medium): **Bulk operations** — UI + store actions + service endpoints.
5. PR-5 (Medium): **Availability blocking** — manage blocked date ranges per room and show in Reservation calendar.
6. PR-6 (Low): **CSV import/export + tests + audit logs**.

---

## 4) Ví dụ kỹ thuật & snippet



---

### B) Prevent delete nếu còn reservation active (service-side check)
- Kiểm tra collection `reservations` trước khi xóa:

```ts
// roomService.deleteRoom (update)
async deleteRoom(roomId: string): Promise<void> {
  // 1. query reservations where roomId == roomId and status not in ['cancelled', 'checked-out']
  // 2. if any exist -> throw new Error('Không thể xóa: còn đặt phòng/đang sử dụng');
  // 3. else deleteDoc or mark isDeleted
}
```

Better: **soft-delete** bằng `isDeleted` boolean và filter trong `getRooms`.

---

### C) Pagination example (getRooms)
- Accept `limit: number` and `startAfterId?: string` or `startAfterDoc`.
- Use Firestore `limit()` and `startAfter()` with an index on `roomNumber`.

---

## 5) Xem xét về DB & security
- Thêm Firestore rules: chỉ staff của cùng hotel (hotelId) mới CRUD rooms; admins can manage all.
- Đặt index cho `hotelId + roomNumber` và các cột tìm kiếm (status, roomType) để phục vụ filter + orderBy.

---

## 6) Tests & QA
- Unit tests cho `roomService` (mock Firestore) để test create/update/delete/paginate & prevention logic.
- E2E test: create room -> upload images -> create reservation -> verify delete blocked.

---

## 7) Ước lượng effort (gợi ý)
- PR-1 (Image upload): 1–2 days
- PR-2 (Delete safety / soft-delete): 0.5–1 day
- PR-3 (Pagination): 0.5–1 day
- PR-4 (Detail page): 1 day
- PR-5 (Bulk ops): 1–2 days
- PR-6 (Availability blocking): 1–2 days

---

Nếu bạn muốn, tôi có thể bắt đầu với **PR-1: tích hợp upload ảnh vào `RoomForm` và `roomService`** (tạo helper `uploadFile`, cập nhật form & store). Chọn tác vụ để tôi bắt đầu. ✅
