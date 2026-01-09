# CẢI TIẾN KỸ THUẬT & TRẢI NGHIỆM (UX/UI IMPROVEMENTS)

## I. CHỀ ĐỘ OFFLINE (Offline Mode)

### Tổng quan
**Mục đích**: Cho phép lễ tân/staff tiếp tục làm việc khi mất kết nối mạng tạm thời.

---

### 1. Architecture
**Công nghệ**:
- **Service Workers**: Lưu cache JavaScript, CSS, assets
- **Firebase Offline Persistence**: Firebase SDK hỗ trợ offline mode tự động
- **IndexedDB / LocalStorage**: Lưu dữ liệu local
- **Sync Queue**: Xếp hàng các thay đổi, gửi khi online

**Cách hoạt động**:
```
Offline:
  1. User thực hiện hành động (tạo reservation, cập nhật room status)
  2. Dữ liệu được lưu vào IndexedDB locally
  3. UI hiển thị "Pending sync" hoặc icon offline
  
Online:
  1. Service Worker detect kết nối
  2. Tự động sync dữ liệu từ IndexedDB lên Firebase
  3. Giải quyết conflict nếu có (vd: 2 staff sửa cùng dữ liệu)
  4. Hiển thị "Synced" notification
```

---

### 2. Dữ liệu tối thiểu (Essential Data Caching)
**Cache ngay khi online**:
- Danh sách phòng (room master data): 50KB
- Danh sách nhân viên: 30KB
- Danh sách khách hiện tại: 100KB
- Danh mục dịch vụ: 20KB
- Quy tắc giá: 10KB
- **Tổng**: ~200KB (quá nhẹ, tải nhanh)

**Dữ liệu không cache**:
- Ảnh đầy đủ (cache only avatar nhỏ)
- Báo cáo (xem online mới)
- Dữ liệu lịch sử cũ (>30 ngày)

**Cấu hình Firebase**:
```typescript
// firebaseConfig.ts
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs
  } else if (err.code == 'unimplemented') {
    // Browser không support
  }
});
```

---

### 3. Sync Strategy
**Quy tắc ưu tiên**:
1. **Critical**: Check-in, Check-out → Sync ngay khi online, không đợi
2. **High**: Tạo/sửa reservation → Sync trong 30 giây
3. **Normal**: Update room status, notes → Sync trong 5 phút
4. **Low**: Read operations → Không cần sync

**Conflict Resolution**:
- Nếu 2 staff vừa online cùng lúc sửa cùng data:
  - So sánh timestamp: version mới hơn thắng
  - Nếu sửa khác field: merge (union)
  - Nếu sửa cùng field: notify user → chọn version nào

---

### 4. UI/UX Offline
**Indicators**:
- **Status bar** (top): "Offline mode - Changes will be synced when online"
- **Icon offline**: mỗi item pending hiển thị icon hourglass nhỏ
- **Toast notification**: Khi sync thành công → "✓ 3 changes synced"

**Disabled features** (khi offline):
- Xem báo cáo (cần dữ liệu fresh)
- Gửi email/SMS
- Upload ảnh lớn
- Xem chi tiết booking ngoài dữ liệu cached

---

## II. ĐA NGÔN NGỮ & DARK MODE (i18n & Dark Mode)

### 1. Hỗ trợ Đa ngôn ngữ (i18n)
**Ngôn ngữ hỗ trợ**:
- Tiếng Việt (vi) - Default
- Tiếng Anh (en)

**Công nghệ**:
- Library: `react-i18next`
- Cấu trúc file:
```
public/locales/
  ├── vi/
  │   ├── common.json     (chung: buttons, headers)
  │   ├── dashboard.json  (dashboard)
  │   ├── reservation.json
  │   └── ... (module khác)
  └── en/
      ├── common.json
      ├── dashboard.json
      └── ...
```

**Cách dùng**:
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        {t('common.english')}
      </button>
    </div>
  );
}
```

**Persistence**:
- Lưu preference ngôn ngữ trong localStorage
- Tải lại trang → tự động dùng ngôn ngữ trước đó

---

### 2. Dark Mode
**Công nghệ**:
- Ant Design v5 hỗ trợ theme tích hợp
- Tailwind CSS: `dark:` variant
- Store: Zustand (uiStore) lưu preference

**Cách triển khai**:
```typescript
// uiStore.ts
const useUiStore = create((set) => ({
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ 
    darkMode: !state.darkMode 
  })),
}));

// App.tsx
function App() {
  const { darkMode } = useUiStore();
  
  return (
    <ConfigProvider theme={{ token: { colorBgBase: darkMode ? '#141414' : '#fff' } }}>
      <div className={darkMode ? 'dark' : ''}>
        {/* content */}
      </div>
    </ConfigProvider>
  );
}
```

**Persistence**:
- localStorage: `UI_DARK_MODE=true`
- System preference (optional): `prefers-color-scheme`

**UI Elements**:
- Toggle button (sun/moon icon) ở Header
- Áp dụng dark mode cho:
  - Background (từ trắng → #141414)
  - Text (từ đen → #e0e0e0)
  - Cards/Panels (trắng → xám đậm)
  - Borders (xám nhạt → xám đậm)
  - Charts/Graphs (tối ưu cho dark background)

**Lợi ích**:
- Giảm mỏi mắt cho nhân viên ca đêm
- Tiết kiệm điện (nếu dùng OLED screens)
- Phù hợp trend design hiện đại

---

## III. THÔNG BÁO ĐẨY (Push Notifications)

### Tổng quan
**Mục đích**: Gửi thông báo real-time cho quản lý khi có sự kiện quan trọng.

---

### 1. Thiết lập FCM (Firebase Cloud Messaging)
**Công nghệ**: Firebase Cloud Messaging (FCM)

**Bước cấu hình**:
1. Firebase Console → Project Settings → Cloud Messaging
2. Lấy Server API Key
3. Cấu hình FCM token trong ứng dụng

```typescript
// firebaseConfig.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const messaging = getMessaging(app);

// Lấy FCM token
export async function getFCMToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.error('Error getting FCM token:', err);
  }
}

// Lắng nghe foreground messages
onMessage(messaging, (payload) => {
  console.log('Foreground message:', payload);
  // Hiển thị toast notification
});
```

**Lưu token**:
```typescript
// userStore.ts
const fcmToken = await getFCMToken();
await updateDoc(doc(db, 'users', userId), {
  fcm_tokens: arrayUnion(fcmToken),
});
```

---

### 2. Sự kiện gửi thông báo
**Event 1: Đặt phòng mới**
- Trigger: Khi tạo reservation mới
- Gửi cho: Manager, Receptionist team
- Nội dung:
  ```
  "Đặt phòng mới: [Tên khách] - Phòng [số], 
   Check-in [ngày]"
  ```
- Action: Click → đi đến Reservations page

**Event 2: Sự cố bảo trì khẩn cấp**
- Trigger: Tạo maintenance request với priority = HIGH
- Gửi cho: Manager, Maintenance team
- Nội dung:
  ```
  "🚨 Bảo trì khẩn: Phòng [số] - [Vấn đề], 
   tạo bởi [tên staff]"
  ```
- Action: Click → chi tiết sự cố

**Event 3: Tồn kho sắp hết**
- Trigger: Inventory item ≤ min_threshold
- Gửi cho: Warehouse manager, Procurement
- Nội dung:
  ```
  "Kho sắp hết: [Tên vật tư] còn [số lượng], 
   ngưỡng [ngưỡng]"
  ```

**Event 4: Check-in/Check-out**
- Trigger: Guest check-in / check-out
- Gửi cho: Receptionist, Housekeeping
- Nội dung:
  ```
  "✓ [Tên khách] check-in Phòng [số]" / 
  "✗ [Tên khách] check-out Phòng [số]"
  ```

**Event 5: Feedback tiêu cực**
- Trigger: Guest rating < 3 sao trong survey
- Gửi cho: Manager
- Nội dung:
  ```
  "⚠ Đánh giá thấp từ [tên khách]: 
   '[comment]' - Hãy gọi để xin lỗi"
  ```

---

### 3. Cloud Function gửi thông báo
```typescript
// functions/src/notifications.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

// Trigger khi tạo reservation mới
export const onNewReservation = functions.firestore
  .document('reservations/{resId}')
  .onCreate(async (snap) => {
    const reservation = snap.data();
    
    // Lấy FCM tokens của managers
    const managers = await db.collection('users')
      .where('role', 'in', ['admin', 'manager'])
      .get();
    
    const tokens = managers.docs
      .flatMap(doc => doc.data().fcm_tokens || []);
    
    if (tokens.length === 0) return;
    
    const message = {
      notification: {
        title: 'Đặt phòng mới',
        body: `${reservation.guest_name} - Phòng ${reservation.room_number}`,
      },
      data: {
        reservation_id: snap.id,
        link: `/reservations/${snap.id}`,
      },
      tokens: tokens,
    };
    
    await messaging.sendMulticast(message);
  });
```

---

### 4. UI thông báo
**Notification Center**:
- **Notification bell icon** ở header
- Click → dropdown danh sách thông báo
  - Mới nhất ở trên
  - Thời gian gửi
  - Mark as read / delete
  - Preview nội dung

**Toast Notification**:
- Foreground message → hiển thị toast (bottom-right)
- Auto dismiss sau 5 giây
- Action button (View Details)

**Permission**:
- Lần đầu tải app → request notification permission
- User có thể disable từ settings

---

## IV. TÍCH HỢP KHÁC

### Kiểm toán & Tuân thủ (Compliance)
- Ghi nhận tất cả thay đổi dữ liệu nhạy cảm (giá, phòng)
- GDPR: Hỗ trợ "right to be forgotten" (delete guest data)
- Lưu trữ log ≥ 1 năm

### Accessibility (A11y)
- WCAG 2.1 AA compliance:
  - Contrast ratio ≥ 4.5:1
  - Keyboard navigation (Tab, Enter, Esc)
  - Screen reader support (ARIA labels)
  - Form labels rõ ràng

### Performance Optimization
- Code splitting: lazy load by route
- Image optimization: WebP, responsive sizes
- Bundle size: < 500KB (gzip)
- Lighthouse score: ≥ 90

---

## Summary: Roadmap UX/UI

| Tính năng | Độ phức tạp | Thời gian ước tính |
|-----------|-------------|-------------------|
| Offline mode | Trung bình | 2-3 tuần |
| i18n (Vi/En) | Thấp | 1 tuần |
| Dark mode | Thấp | 3-5 ngày |
| Push Notifications | Trung bình | 2 tuần |
| Accessibility (A11y) | Cao | 3-4 tuần |
| Performance tuning | Trung bình | 2-3 tuần |

---

## Ưu tiên triển khai

**Phase 1** (ngay):
- Dark mode (dễ, tác động cao)
- i18n đa ngôn ngữ

**Phase 2** (3-4 tuần):
- Offline mode
- Push Notifications

**Phase 3** (5-8 tuần):
- Accessibility
- Performance optimization
