# 🔐 Authentication (Firebase Auth) — Phân tích & Cải tiến

**Mục tiêu:** đánh giá hiện trạng authentication trong dự án, chỉ ra thiếu sót và đề xuất các bước triển khai theo thứ tự ưu tiên.

---

## 1) Tóm tắt hiện trạng
- Có `authService` với các hàm cơ bản: `signIn`, `signOut`, `createUser`, `getUserProfile`, `onAuthStateChanged`.
- Có `useAuth` hook và `useAuthStore` (Zustand) để lưu `user` và `userProfile`.
- UI: `Login` page, `ProtectedRoute` kiểm tra authentication.

**Vấn đề chính:** luồng xác thực hoạt động ở mức demo nhưng thiếu các bước quan trọng để an toàn và sẵn sàng cho production (ví dụ: lấy `userProfile` thực tế, xử lý lỗi thân thiện, reset mật khẩu, email verification, RBAC enforcement, 2FA, Firestore security rules, v.v.).

---

## 2) Phát hiện chi tiết & mức ưu tiên

### 🔴 High priority (Cần sửa sớm)
1. useAuth hiện tại **gán profile cứng (hard-coded)** thay vì gọi `authService.getUserProfile(uid)` → dẫn tới sai quyền/không tôn trọng `isActive` / `permissions`.
2. **Không có kiểm tra role/permission** ở `ProtectedRoute` — chỉ kiểm tra authenticated. Cần thêm cơ chế cấp quyền (permission guard) để bảo vệ route/feature.
3. **Không có flows: password reset (sendPasswordResetEmail), email verification, update credentials, re-authenticate**.
4. **Xử lý lỗi**: map lỗi Firebase sang message thân thiện & thống nhất, không chỉ throw raw message.
5. **Kiểm tra `isActive`** ở login/onAuthStateChanged để ngăn tài khoản bị vô hiệu hóa truy cập.

### 🟠 Medium priority (Nâng cấp tốt cho production)
1. Add **email verification** flow + UI cho yêu cầu verify trước khi dùng 1 số tính năng.
2. **Token & session handling**: kiểm tra token expiry, refresh logic, và đảm bảo sign out khi token bị thu hồi.
3. **Audit logging** cho sự kiện auth (login failed, login success, password reset) để phục vụ security.
4. **Protect Firestore** bằng security rules theo role/hotelId.

### 🟡 Low priority / Nice-to-have
1. **2FA (MFA)** (SMS hoặc TOTP) cho user admin / manager.
2. **SSO providers** (Google/Facebook) cho tiện dụng.
3. SSO/SSO migration UX, SSO linking.
4. **Tests** cho flows: sign-in, sign-out, password reset, role-based access.

---

## 3) Kế hoạch cải tiến & ví dụ code

### A. Thay `useAuth` để fetch profile thực từ Firestore (Mẫu đề xuất)
- Hành động: trong `onAuthStateChanged` gọi `authService.getUserProfile(uid)`; nếu profile null → redirect hoặc tạo record theo policy; nếu profile.isActive === false → signOut và hiển thị thông báo.

Mã mẫu (ý tưởng):
```ts
// useAuth - pseudocode
const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
  if (firebaseUser) {
    setUser(firebaseUser);
    const profile = await authService.getUserProfile(firebaseUser.uid);
    if (!profile) {
      // optional: create minimal profile or redirect to setup
    }
    if (profile && !profile.isActive) {
      // user disabled
      await authService.signOut();
      setError('Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên.');
      setUser(null); setUserProfile(null);
    } else {
      setUserProfile(profile);
    }
  } else {
    setUser(null); setUserProfile(null);
  }
  setLoading(false);
});
```

### B. Thêm helper để kiểm tra permission và tích hợp ở route
- Tạo `hasPermission(userProfile, requiredPermissions)` utility.
- Mở rộng `ProtectedRoute` thành `ProtectedRoute({ requiredPermissions?: string[] })` để redirect hoặc hiển thị 403.

Mã ý tưởng:
```tsx
if (!isAuthenticated) return <Navigate to="/login" />;
if (requiredPermissions && !hasPermission(userProfile, requiredPermissions)) return <Navigate to="/403" />;
```

### C. Password reset / Email verification / Update email & password
- Mở rộng `authService` để export: `sendPasswordResetEmail`, `sendEmailVerification`, `verifyEmail`, `updatePassword`, `updateEmail`, `reauthenticate`.
- Thêm UI: "Quên mật khẩu", "Gửi xác thực email".

### D. Map lỗi Firebase sang user-friendly messages
- Tạo helper `formatFirebaseError(err)` -> trả message VN (hoặc i18n) cho `auth/wrong-password`, `auth/user-not-found`, `auth/email-already-in-use`, `auth/weak-password`...

### E. Firestore Security Rules & role enforcement
- Viết rules: users can read their own profile; staff in same hotel can read rooms/reservations per permission; admin can manage everything.
- Thêm doc `firestore.rules` và test local emulator rules.

### F. Optional: MFA, SSO, audit logs, tests
- Gợi ý libs & resources: Firebase MFA (Phone / TOTP via Cloud Functions), Firebase Auth providers, Sentry/LogRocket for login failures, Playwright/Vitest tests.

---

## 4) Checklist công việc (cấp độ issue/PR)
1. Fix `useAuth` to fetch real profile + enforce `isActive` (PR-1) ✅
2. Add `formatFirebaseError` and use in `Login` & all auth flows (PR-2)
3. Add `sendPasswordResetEmail` + UI (PR-3)
4. Implement `ProtectedRoute` enhancements with permission check and 403 page (PR-4)
5. Add Firestore security rules & tests (PR-5)
6. Add email verification + flows (PR-6)
7. Add unit/integration tests for auth flows (PR-7)
8. Optional: MFA & SSO (PR-8+)

---

## 5) Tài nguyên & tham khảo
- Firebase Auth docs: https://firebase.google.com/docs/auth
- Firestore security rules: https://firebase.google.com/docs/firestore/security/get-started
- Testing rules with emulator: https://firebase.google.com/docs/emulator-suite

---

Nếu bạn muốn, tôi có thể: 
- Tạo PR sửa `useAuth` (1) ngay bây giờ; hoặc
- Tạo PR thêm `sendPasswordResetEmail` + UI (2); hoặc
- Soạn `firestore.rules` mẫu dựa trên role/hotelId.

Chọn một trong các tác vụ trên để tôi bắt đầu. ✅
