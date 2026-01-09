# LỘ TRÌNH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION ROADMAP)

## I. TỔNG QUAN CHIẾN LƯỢC

### Mục tiêu dài hạn
Nâng cấp Hotel Management System từ MVP (Minimum Viable Product) lên **Enterprise-grade SaaS platform** với đầy đủ automation, real-time sync, và integration đa kênh.

### Giai đoạn phát triển
- **Phase 0** (Current): Hoàn thiện core features (Rooms, Reservations, Staff, Maintenance)
- **Phase 1** (Weeks 1-12): Tối ưu hóa core + UX/UI improvements
- **Phase 2** (Weeks 13-24): Thêm POS, Guest Portal, Floor Plan
- **Phase 3** (Weeks 25-40): Channel Manager, Inventory, CRM
- **Phase 4** (Weeks 41+): Mobile apps, Advanced analytics, Custom reports

---

## II. PHASE 1: CORE OPTIMIZATION & UX IMPROVEMENTS (Weeks 1-12)

### Tuần 1-2: Dark Mode & i18n
**Sprint**: Dark Mode & Multi-language
**Team**: 1 Frontend dev
**Tasks**:
- [ ] Cấu hình react-i18next
- [ ] Tạo translation files (Vi, En)
- [ ] Implement dark mode toggle
- [ ] Test trên tất cả pages
- [ ] Update Tailwind CSS configs

**Deliverables**:
- Dark mode toggle ở Header
- Hỗ trợ Vi/En hoàn toàn
- Persistence preference

**Testing**:
- All UI components đúng dark colors
- Contrast ratio ≥ 4.5:1
- Translation completeness 100%

---

### Tuần 3-4: Real-time Room Status
**Sprint**: Real-time Updates
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Cấu hình Firebase onSnapshot listeners
- [ ] Implement room status subscription (Zustand store)
- [ ] Real-time update trên Room cards
- [ ] Add visual indicators (icon + color)
- [ ] Handle connection loss gracefully
- [ ] Unit tests cho listeners

**Database Schema**:
```typescript
// collections/rooms/{roomId}
{
  room_id: string,
  room_number: string,
  status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE',
  current_guest?: string,
  check_out_time?: timestamp,
  housekeeping_notes?: string,
  last_updated: timestamp,
  updated_by: string
}
```

**Deliverables**:
- Real-time room status updates (< 1 giây latency)
- Visual status indicators
- Performance: 60fps updates

---

### Tuần 5-6: Offline Mode (Core)
**Sprint**: Offline Persistence
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Enable Firebase offline persistence
- [ ] Setup Service Worker
- [ ] Implement sync queue (Zustand)
- [ ] Cache essential data locally
- [ ] Sync strategy: prioritize critical operations
- [ ] Conflict resolution logic
- [ ] UI indicators (offline mode, syncing status)

**Critical Operations** (Sync ngay):
- Check-in / Check-out
- Create/update reservation
- Report maintenance issue

**Essential Data to Cache**:
- Room master data (50KB)
- Current guests (100KB)
- Staff list (30KB)
- Service catalog (20KB)

**Deliverables**:
- Offline mode fully functional
- Auto-sync when online
- Sync progress indicator
- "Syncing..." toast notifications

---

### Tuần 7-8: Push Notifications
**Sprint**: Firebase Cloud Messaging
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Setup FCM in Firebase Console
- [ ] Implement getFCMToken() in client
- [ ] Store FCM tokens in user document
- [ ] Create Cloud Functions for notifications
- [ ] Setup notification triggers:
  - New reservation
  - Maintenance issue
  - Inventory low stock
  - Check-in/Check-out
  - Guest feedback (negative)
- [ ] Build notification UI (bell icon, dropdown, toast)
- [ ] Permission handling (ask user)

**Cloud Functions to Create**:
```
1. onNewReservation(resId) → notify managers
2. onMaintenanceIssue(mainId) → notify team
3. onLowStock(itemId) → notify procurement
4. onGuestCheckIn/Out(resId) → notify staff
5. onNegativeFeedback(feedbackId) → notify manager
```

**Deliverables**:
- Notification center ở Header
- Toast notifications foreground
- Push notifications background
- Notification history

---

### Tuần 9: Conflict Detection Smart (Reservations)
**Sprint**: Overbooking Prevention
**Team**: 1 Backend dev
**Tasks**:
- [ ] Implement conflict detection algorithm
- [ ] Validate dates before save
- [ ] Suggest alternative rooms
- [ ] Show price difference
- [ ] Update reservation form UI
- [ ] Test edge cases (same check-in/out, adjacent rooms)

**Algorithm**:
```typescript
function detectConflict(roomId, checkIn, checkOut) {
  const overlapping = reservations.filter(r =>
    r.room_id === roomId &&
    r.status !== 'cancelled' &&
    !(r.checkout_date <= checkIn || r.checkin_date >= checkOut)
  );
  
  return overlapping.length > 0;
}

function suggestAlternatives(requiredCapacity, checkIn, checkOut) {
  return rooms.filter(r =>
    r.capacity >= requiredCapacity &&
    !detectConflict(r.id, checkIn, checkOut)
  );
}
```

**Deliverables**:
- Real-time conflict detection
- Alternative room suggestions
- Price comparison

---

### Tuần 10-11: Audit Log (Reservations)
**Sprint**: Reservation Audit Trail
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Create reservation_audit_logs collection
- [ ] Add audit trigger in update/delete functions
- [ ] Record: who, what, when, old→new values
- [ ] Implement Audit Log viewer UI
- [ ] Filter by date, staff, change type
- [ ] Export to CSV
- [ ] Point-in-time snapshot view

**Audit Fields**:
- reservation_id
- timestamp
- staff_id
- action: 'CREATE' | 'UPDATE' | 'DELETE'
- changes: { field: { old: any, new: any } }
- reason?: string

**Deliverables**:
- Audit log table ở reservation detail
- Full audit history
- Export capability

---

### Tuần 12: Testing & Optimization
**Sprint**: QA & Performance
**Team**: 1 QA + 1 Dev
**Tasks**:
- [ ] Integration testing (dark mode, i18n, offline, notifications)
- [ ] Performance testing:
  - Load time < 3s
  - Real-time update latency < 1s
  - Lighthouse score ≥ 90
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness
- [ ] Bug fixes & optimization

**Deliverables**:
- Test report
- Performance metrics
- Accessibility report
- Production-ready Phase 1

---

## III. PHASE 2: POS & VISUALIZATION (Weeks 13-24)

### Tuần 13-16: POS Lite System
**Sprint**: Point of Sale Lite
**Team**: 2 Backend devs + 1 Frontend dev
**Tasks**:
- [ ] Design Service & MenuItem schema
- [ ] Implement service CRUD
- [ ] Implement POS terminal interface
- [ ] Create Room Service form (ghi nợ)
- [ ] Integrate with Invoice system
- [ ] POS reports (doanh thu by service)
- [ ] Offline POS support

**Components to Build**:
- ServiceManager (admin)
- POSTerminal (touchscreen-friendly UI)
- RoomServiceForm
- ServiceInvoicePreview
- POSReports

**Database**:
```typescript
Service {
  id: string,
  name_vi: string,
  name_en: string,
  category: 'food' | 'beverage' | 'laundry' | 'spa',
  type: 'fixed' | 'variable',
  surcharge_percent?: number
}

MenuItem {
  id: string,
  service_id: string,
  name: string,
  price: number,
  is_available: boolean
}

RoomService {
  id: string,
  room_id: string,
  items: RoomServiceItem[],
  subtotal: number,
  tax: number,
  total: number,
  created_by: string,
  created_at: timestamp
}
```

**Deliverables**:
- Full POS functionality
- Room service (ghi nợ)
- Offline POS
- POS reports

---

### Tuần 17-20: Interactive Floor Plan
**Sprint**: Floor Plan Visualization
**Team**: 1 Frontend dev (SVG/Canvas specialist)
**Tasks**:
- [ ] Create floor plan editor (admin)
  - Upload/edit SVG sơ đồ
  - Mark room boundaries
  - Assign room_id to regions
  - Save to Firebase Storage
- [ ] Build floor plan viewer
  - Display rooms colored by status
  - Real-time color update (onSnapshot)
  - Zoom & pan
  - Hover tooltip
  - Click to show options (check-in, check-out, details)
- [ ] Implement filters (status, room type)
- [ ] Search by room number

**Technology**: 
- SVG.js hoặc Fabric.js para editor
- Canvas hoặc SVG para viewer

**Deliverables**:
- Floor plan editor
- Interactive floor plan viewer
- Real-time status visualization
- Fast performance (100+ rooms)

---

### Tuần 21-24: Gantt Chart (Reservations)
**Sprint**: Timeline Visualization
**Team**: 1 Frontend dev
**Tasks**:
- [ ] Integrate react-big-calendar hoặc timeline library
- [ ] Display all rooms on Y-axis, time on X-axis
- [ ] Color-code reservations by status
- [ ] Implement drag-and-drop room change
- [ ] Implement date extension (drag end date)
- [ ] Show guest info, price on bar
- [ ] Implement filters (room type, status, guest)
- [ ] Zoom (day/week/month view)

**Deliverables**:
- Full Gantt chart view
- Drag-drop room changes
- Timeline filter & search
- Responsive on large displays

---

## IV. PHASE 3: CHANNEL MANAGER & CRM (Weeks 25-40)

### Tuần 25-32: Channel Manager (iCal Sync)
**Sprint**: OTA Integration
**Team**: 2 Backend devs
**Tasks**:
- [ ] Create iCal feed generator
  - Endpoint: GET /api/ical/feed.ics
  - Include all reservations
  - Generate VEVENT for each reservation
- [ ] Setup OTA credentials storage (Secrets Manager)
- [ ] Implement iCal push (periodically update feed)
- [ ] Webhook receiver for OTA bookings
  - POST /api/webhooks/ota
  - Parse booking data
  - Create reservation in system
- [ ] Conflict detection (OTA vs local)
- [ ] Availability sync (block unavailable dates)

**iCal Format**:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hotel//Hotel Management//EN
BEGIN:VEVENT
UID:RES-12345@hotel.com
DTSTART:20260115T1400Z
DTEND:20260118T1100Z
SUMMARY:[RoomNumber] [GuestName]
DESCRIPTION:Status: Confirmed
END:VEVENT
END:VCALENDAR
```

**Deliverables**:
- iCal feed endpoint
- OTA webhook receiver
- Conflict resolution
- Manual sync trigger

---

### Tuần 33-36: Inventory Management
**Sprint**: Stock Management
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Design InventoryItem schema
- [ ] Implement CRUD inventory
- [ ] Add consumption tracking
  - Housekeeping mark items used
  - Auto-reduce per guest
- [ ] Low stock alerts
  - Firebase Realtime alerts
  - Push notification
  - Email to procurement
- [ ] Inventory reports
  - Stock level by category
  - Consumption trends
  - Cost analysis
- [ ] Auto-reorder (draft PO)

**Database**:
```typescript
InventoryItem {
  id: string,
  name: string,
  category: string,
  unit: 'piece' | 'bottle' | 'box',
  current_quantity: number,
  min_threshold: number,
  reorder_quantity: number,
  unit_cost: number
}

ConsumptionLog {
  id: string,
  item_id: string,
  quantity: number,
  logged_by: string,
  logged_at: timestamp,
  reason: 'guest_use' | 'damage' | 'adjustment'
}
```

**Deliverables**:
- Inventory dashboard
- Consumption tracking
- Low stock alerts
- Inventory reports

---

### Tuần 37-40: CRM & Loyalty Program
**Sprint**: Guest CRM & Loyalty
**Team**: 1 Backend + 1 Frontend dev
**Tasks**:
- [ ] Enhance Guest Profile
  - Add birthday, preferences, notes
  - Guest classification (new, returning, VIP)
- [ ] Implement Loyalty Points system
  - Points on stay (1 USD = 1 point)
  - Points on service (5% of bill)
  - Redemption: 100 points = $10
- [ ] Tier system (Silver, Gold, Platinum)
- [ ] Marketing automation
  - Birthday email campaign
  - Post-stay survey
  - Re-engagement emails
- [ ] CRM Analytics
  - Lifetime value (LTV)
  - Repeat rate
  - Churn rate
  - NPS calculation

**Deliverables**:
- Enhanced guest profiles
- Loyalty points system
- Marketing automation
- CRM analytics dashboard

---

## V. PHASE 4: MOBILE & ADVANCED (Weeks 41+)

### Mobile Apps
- **Housekeeping App** (React Native / Flutter)
  - Update room status
  - Capture before/after photos
  - Offline support
- **Manager Dashboard** (Mobile-optimized web)
  - KPIs & alerts
  - Quick actions (check-in, approve)
  - Notifications

### Advanced Features
- **AI/ML**:
  - Price optimization
  - Demand forecasting
  - Guest preference prediction
- **Advanced Analytics**:
  - Custom reports builder
  - Dashboard builder
  - Scheduled reports
- **Integrations**:
  - Accounting software (QuickBooks)
  - Email/SMS (SendGrid, Twilio)
  - Payment gateway (Stripe, PayPal)

---

## VI. RESOURCE ALLOCATION & TIMELINE

### Team Structure
```
Project Manager (1) - Overall planning & coordination
Backend Developers (2-3) - Firebase, APIs, business logic
Frontend Developers (2) - React, UI/UX
DevOps/Infrastructure (1) - Firebase, deployment
QA/Tester (1) - Testing & bug reporting
UI/UX Designer (optional) - Design improvements
```

### Timeline Summary

| Phase | Duration | Focus | Team |
|-------|----------|-------|------|
| Phase 1 | 12 weeks | Core optimization, UX, offline, notifications | 2-3 devs |
| Phase 2 | 12 weeks | POS, Floor Plan, Gantt | 2-3 devs |
| Phase 3 | 16 weeks | Channel Manager, Inventory, CRM | 2-3 devs |
| Phase 4 | 12+ weeks | Mobile, AI, Advanced features | 3-4 devs |
| **Total** | **52+ weeks** | **Enterprise-grade system** | **2-4 devs** |

---

## VII. QUALITY ASSURANCE

### Testing Strategy
```
Unit Tests: 80% code coverage
Integration Tests: API & database operations
E2E Tests: Critical user workflows (check-in, reservation)
Performance Tests: Load testing, responsiveness
UAT: With actual hotel staff
```

### Performance Targets
```
Page Load: < 3 seconds
API Response: < 500ms
Real-time updates: < 1 second
Lighthouse Score: ≥ 90
Mobile Performance: ≥ 80
```

### Monitoring & Analytics
```
Sentry: Error tracking
Google Analytics: User behavior
Firebase Analytics: App events
Custom dashboards: KPIs & metrics
```

---

## VIII. DEPLOYMENT STRATEGY

### Environments
```
Development: localhost
Staging: staging.hotel.com (Firebase project)
Production: app.hotel.com (Firebase project)
```

### Deployment Process
```
1. Code review (pull request)
2. Automated tests (CI/CD)
3. Merge to staging
4. Manual testing on staging
5. Merge to production
6. Monitor errors & performance
```

### CI/CD Pipeline (GitHub Actions)
```yaml
- Run linters (ESLint)
- Run unit tests
- Build bundle (Vite)
- Deploy to staging
- Run E2E tests on staging
- Manual approval
- Deploy to production
```

---

## IX. BUDGET & COST ESTIMATION

### Infrastructure Costs (Monthly)
```
Firebase Spark Plan (Free tier for Phase 1):
- Firestore: 50K reads/day free
- Storage: 5GB free
- Functions: 2M invocations free

Firebase Blaze Plan (Pay as you go):
- Phase 2-3: ~$200-500/month
- Phase 4 (heavy usage): $500-1000/month

Hosting & CDN:
- Firebase Hosting: ~$50/month
- Custom domain: $12/year

Monitoring & Analytics:
- Sentry: Free tier ($0)
- Google Analytics: Free
- Custom monitoring: $0
```

### Development Costs
```
Team (2-3 devs for 12 months): $80K-120K
Design & UX: $10K-15K
QA & Testing: $10K-15K
Infrastructure: $5K-10K (yearly)
Third-party APIs: $5K-10K (Stripe, SendGrid, etc.)

Total: ~$110K-170K for full implementation
```

---

## X. RISKS & MITIGATION

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Firebase quota exceeded | Medium | High | Implement rate limiting, upgrade plan early |
| Real-time sync conflict | Low | High | Robust conflict resolution, thorough testing |
| Overbooking race condition | Low | Critical | Database transactions, optimistic locking |
| Data loss (Firebase outage) | Low | Critical | Regular backups, disaster recovery plan |

### Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Staff resistance to change | Medium | Medium | Training, gradual rollout, support |
| Scope creep | High | High | Clear requirements, change control |
| Key person dependency | Medium | High | Documentation, knowledge sharing |

---

## XI. SUCCESS METRICS

### Phase 1
- [ ] Dark mode + i18n live & stable
- [ ] Real-time updates < 1s latency
- [ ] Offline mode supports 90% operations
- [ ] 95% push notification delivery rate
- [ ] User adoption > 80%

### Phase 2
- [ ] POS generating revenue tracking
- [ ] Floor plan interactive & responsive
- [ ] Gantt chart handles 500+ reservations
- [ ] Staff training completed

### Phase 3
- [ ] Channel Manager syncing with ≥ 2 OTAs
- [ ] Inventory module reducing stockouts by 50%
- [ ] CRM campaigns 20%+ email open rate

### Phase 4
- [ ] Mobile adoption > 60% housekeeping staff
- [ ] Revenue optimization + 5-10%
- [ ] System handles 100+ concurrent users

---

## XII. DOCUMENTATION & HANDOVER

### Documentation to Create
```
1. Technical Architecture Document
2. API Documentation (Swagger/OpenAPI)
3. Database Schema Document
4. UI/UX Design System
5. Staff Training Manual (Vi/En)
6. Admin Guide (Setup, Configuration)
7. Troubleshooting Guide
8. Deployment Guide
9. Maintenance Plan
```

### Knowledge Transfer
```
- Code walkthrough sessions (Backend, Frontend)
- Database design explanation
- Third-party API integrations
- Deployment & monitoring setup
- Support & escalation procedures
```

---

## CONCLUSION

This roadmap provides a structured, phased approach to evolve the hotel management system into a world-class, enterprise-grade platform. By focusing on core improvements first (Phase 1), then adding high-value features (Phases 2-3), and finally expanding with mobile & AI (Phase 4), we ensure:

✅ Continuous value delivery
✅ Risk mitigation through incremental releases
✅ User feedback integration
✅ Team capability building
✅ Sustainable growth

The timeline is realistic (~12 months for Phases 1-3), and the roadmap is flexible to accommodate changing business priorities.

