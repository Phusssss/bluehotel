# Phân tích vấn đề: Khác biệt hiển thị Phòng giữa trang Reservations và Rooms

## Vấn đề được báo cáo

- **Trang Reservations (`/reservations`)**: Khi chọn ngày check-in/check-out, hiển thị **2 phòng** khả dụng
- **Trang Rooms (`/rooms`)**: Không hiển thị phòng nào, hoặc hiển thị danh sách rỗng

## Nguyên nhân gốc rễ

### 1. **ReservationForm dùng API phức tạp hơn**
- **File**: `src/components/reservations/ReservationForm.tsx`
- **Logic**: Gọi `reservationService.getAvailableRooms()` khi chọn date range
  ```typescript
  const available = await reservationService.getAvailableRooms(
    userProfile.hotelId,
    dates[0].format('YYYY-MM-DD'),
    dates[1].format('YYYY-MM-DD'),
    numberOfGuests
  );
  ```
- **Kết quả**: Lọc phòng theo **tính khả dụng trong date range** + số khách

### 2. **Trang Rooms dùng store đơn giản**
- **File**: `src/pages/Rooms.tsx` 
- **Logic**: Gọi `fetchRooms()` từ `useRoomStore` → gọi `roomService.getRooms()`
  ```typescript
  const { rooms, fetchRooms } = useRoomStore();
  
  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchRooms(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, filter]);
  ```
- **Kết quả**: Chỉ lấy danh sách phòng theo filter **hiện tại** (status, type, floor...)
- **Filter áp dụng**: Chỉ có **search text filter** trong component (line 130 của Rooms.tsx)

### 3. **roomService.getRooms() có vấn đề query**
- **File**: `src/services/roomService.ts` (lines 24-52)
- **Vấn đề**:
  - Dùng `where('isDeleted', '!=', true)` → **không hợp lệ trong Firestore** (Firestore không support `!=` cho so sánh không bằng trực tiếp trên document level)
  - `orderBy('isDeleted')` **trước khi `orderBy('roomNumber')`** → vô lý vì chúng không liên quan
  - Không lọc theo trạng thái thực sự (status chỉ được áp dụng **nếu có trong filter**, nhưng Rooms.tsx không gửi filter.status từ RoomFilter)

### 4. **RoomFilter không gửi filter đến store**
- **File**: `src/components/rooms/RoomFilter.tsx`
- **Vấn đề**: Component gọi `onFilterChange()` khi user chọn filter (status, type, floor)
  - Nhưng ở `Rooms.tsx`, `setFilter()` được gọi → cập nhật `filter` state trong store
  - Tuy nhiên, **fetch lại rooms không được trigger khi filter thay đổi** (useEffect dependency thiếu `fetchRooms`)

### 5. **Client-side filter không đủ**
- **File**: `src/pages/Rooms.tsx` (lines 128-137)
- **Logic hiện tại**: Chỉ filter theo **search text** (`filter.search`)
  - Không lọc theo `status`, `type`, `floor` từ filter object
  - **Kết quả**: Dù user chọn filter, dữ liệu server không thay đổi + client-side filter không hoạt động

---

## So sánh chi tiết

| Khía cạnh | Reservations | Rooms |
|-----------|-------------|-------|
| **API dùng** | `reservationService.getAvailableRooms()` (dynamic) | `roomService.getRooms()` + store |
| **Filter logic** | Date range + số khách + kiểm tra xung đột | Status/type/floor (static) |
| **Kích hoạt fetch** | `handleDateChange()` (dynamic) | `useEffect` + filter (không trigger lại) |
| **Client-side filter** | Không (server-side lọc sẵn) | Chỉ search text |
| **Kết quả** | 2 phòng khả dụng | 0 phòng hoặc danh sách bị cắt |

---

## Giải pháp sửa chữa

### **Giải pháp 1: Sửa roomService.getRooms() (Ưu tiên cao)**
**File**: `src/services/roomService.ts`

```typescript
// ❌ Sai: Firestore không hỗ trợ != operator
where('isDeleted', '!=', true)

// ✅ Đúng: Dùng ==
where('isDeleted', '==', false)

// ❌ Sai: orderBy trên isDeleted trước roomNumber
orderBy('isDeleted'),
orderBy('roomNumber')

// ✅ Đúng: Chỉ orderBy trên roomNumber
orderBy('roomNumber')
```

**Cập nhật query**:
```typescript
const q = query(
  collection(db, COLLECTION_NAME),
  where('hotelId', '==', hotelId),
  where('isDeleted', '==', false),  // ✅ Fix
  orderBy('roomNumber'),             // ✅ Fix
  ...(filter?.status ? [where('status', '==', filter.status)] : []),
  ...(filter?.roomType ? [where('roomType', '==', filter.roomType)] : []),
  ...(filter?.limit ? [limit(filter.limit)] : []),
  ...(filter?.startAfter ? [startAfter(filter.startAfter)] : [])
);
```

### **Giải pháp 2: Trigger fetch khi filter thay đổi (Ưu tiên cao)**
**File**: `src/pages/Rooms.tsx` (useEffect)

```typescript
// ❌ Sai: Chỉ trigger khi hotelId/filter thay đổi, nhưng fetchRooms không gọi
useEffect(() => {
  if (userProfile?.hotelId) {
    fetchRooms(userProfile.hotelId);
  }
}, [userProfile?.hotelId, filter]); // ← filter không trigger fetch

// ✅ Đúng: Thêm fetchRooms vào dependency
useEffect(() => {
  if (userProfile?.hotelId) {
    fetchRooms(userProfile.hotelId);
  }
}, [userProfile?.hotelId, filter, fetchRooms]);
```

### **Giải pháp 3: Cải thiện client-side filter (Ưu tiên trung bình)**
**File**: `src/pages/Rooms.tsx` (filteredRooms logic)

```typescript
// ❌ Sai: Chỉ filter search text
const filteredRooms = rooms.filter(room => {
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchLower) ||
      room.amenities.some(amenity => amenity.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;
  }
  return true;
});

// ✅ Đúng: Filter theo tất cả criteria
const filteredRooms = rooms.filter(room => {
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchLower) ||
      room.amenities?.some(amenity => amenity.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;
  }
  if (filter.status && room.status !== filter.status) return false;
  if (filter.roomType && room.roomType !== filter.roomType) return false;
  if (filter.floor && room.floor !== filter.floor) return false;
  return true;
});
```

### **Giải pháp 4: Thêm Date Range Filter cho Rooms (Ưu tiên thấp - nâng cao)**
**File**: `src/components/rooms/RoomFilter.tsx`

Thêm option lọc phòng theo **tính khả dụng trong date range** (tương tự Reservations):
```typescript
const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

const handleDateRangeChange = async (dates: [Dayjs, Dayjs] | null) => {
  setDateRange(dates);
  if (dates) {
    // Gọi getAvailableRooms để filter theo date
    const available = await reservationService.getAvailableRooms(
      hotelId,
      dates[0].format('YYYY-MM-DD'),
      dates[1].format('YYYY-MM-DD'),
      1
    );
    onFilterChange({ ...filter, availableRooms: available });
  }
};
```

---

## Tóm tắt hành động sửa chữa (thứ tự ưu tiên)

| # | Hành động | File | Độ khó | Tác động |
|----|---------|------|--------|---------|
| 1️⃣ | Fix `where('isDeleted', '!=', true)` → `'==', false` | `roomService.ts` | Thấp | **Cao** - Sửa query Firestore |
| 2️⃣ | Fix orderBy query | `roomService.ts` | Thấp | **Cao** - Đảm bảo ordering đúng |
| 3️⃣ | Thêm fetchRooms vào dependency | `Rooms.tsx` | Thấp | **Trung** - Kích hoạt fetch khi filter |
| 4️⃣ | Cải thiện client-side filter logic | `Rooms.tsx` | Thấp | **Trung** - Filter đầy đủ status/type/floor |
| 5️⃣ | (Optional) Thêm date range filter | `RoomFilter.tsx` | Trung | **Thấp** - UX nâng cao |

---

## Dự kiến kết quả sau sửa

✅ **Trang `/rooms`**:
- Hiển thị danh sách phòng đầy đủ theo tính khả dụng
- Filter status/type/floor hoạt động chính xác
- (Optional) Có thể lọc theo date range giống như Reservations

✅ **Consistency giữa 2 trang**: 
- Cả 2 trang đều sử dụng logic hiển thị phòng nhất quán
- Không còn sự khác biệt lạ lùng giữa Reservations và Rooms
