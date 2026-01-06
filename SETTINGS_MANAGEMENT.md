# ⚙️ Settings Management - Implementation Guide

**Status:** ❌ 0% Complete (Placeholder only)  
**Priority:** Medium  
**Estimated Effort:** 2-3 days  
**Dependencies:** Authentication system (admin-only access)

---

## 1. Overview

Settings management allows hotel administrators to configure system-wide parameters including hotel information, room management rules, billing settings, notification preferences, and integrations.

---

## 2. Settings Structure

### Hotel Information Section
```typescript
interface HotelInfo {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  taxId?: string;
}
```

### Room Settings Section
```typescript
interface RoomSettings {
  defaultCheckInTime: string; // "14:00"
  defaultCheckOutTime: string; // "12:00"
  earlyCheckInFee?: number;
  lateCheckoutFee?: number;
  defaultCancellationDays: number; // e.g., 7 days before stay
  maxOverbookingPercent: number; // 10 for 10% overbooking allowed
  minStayLength: number; // minimum nights for booking
}
```

### Billing Settings Section
```typescript
interface BillingSettings {
  currency: string; // 'VND' | 'USD' | etc
  taxRate: number; // 0.1 for 10%
  taxLabel: string; // "VAT"
  invoicePrefix: string; // "INV"
  invoiceStartNumber: number; // next invoice number
  paymentMethods: PaymentMethodSetting[];
  defaultPaymentTerm: number; // days
  autoInvoiceEmail: boolean;
}

interface PaymentMethodSetting {
  method: PaymentMethod; // 'cash' | 'credit_card' | 'bank_transfer'
  enabled: boolean;
  label: string;
  instructions?: string;
}
```

### Notification Settings Section
```typescript
interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  notifyOnReservation: boolean;
  notifyOnCheckIn: boolean;
  notifyOnCheckOut: boolean;
  notifyOnMaintenance: boolean;
  notifyOnLowOccupancy: boolean;
  occupancyThreshold: number; // e.g., 50%
  emailTemplate?: EmailTemplate;
}

interface EmailTemplate {
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}
```

### System Settings Section
```typescript
interface SystemSettings {
  language: string; // 'en' | 'vi'
  timezone: string; // 'Asia/Ho_Chi_Minh'
  dateFormat: string; // 'DD/MM/YYYY'
  timeFormat: string; // '24h' | '12h'
  decimalPlaces: number;
  debugMode: boolean;
  maintenanceMode: boolean;
}
```

### Integration Settings Section
```typescript
interface IntegrationSettings {
  stripeApiKey?: string;
  stripeEnabled?: boolean;
  
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioEnabled?: boolean;
  
  sendgridApiKey?: string;
  sendgridEnabled?: boolean;
  
  googleAnalyticsId?: string;
  
  slackWebhookUrl?: string;
}
```

---

## 3. Complete Settings Type

```typescript
// src/types/settings.ts (NEW)

export interface HotelSettings extends BaseEntity {
  hotelId: string; // Primary key
  
  // Hotel Info
  hotelInfo: HotelInfo;
  
  // Room Management
  roomSettings: RoomSettings;
  
  // Billing
  billingSettings: BillingSettings;
  
  // Notifications
  notificationSettings: NotificationSettings;
  
  // System
  systemSettings: SystemSettings;
  
  // Integrations
  integrationSettings: IntegrationSettings;
  
  // Audit
  lastModifiedBy: string;
  lastModifiedAt: Date;
  updatedAt: Date;
}

export interface SettingsFormState {
  activeTab: 'hotel' | 'rooms' | 'billing' | 'notifications' | 'system' | 'integrations';
  isSaving: boolean;
  saveSuccess: boolean;
  errorMessage?: string;
}
```

---

## 4. Firestore Structure

**settings**
```
/settings/{hotelId}
  - hotelId (indexed - primary key)
  - hotelInfo { name, address, city, country, phone, email, website, logo, taxId }
  - roomSettings { checkInTime, checkOutTime, fees, cancellation, overbooking, minStay }
  - billingSettings { currency, tax, invoicePrefix, paymentMethods, autoEmail }
  - notificationSettings { emailEnabled, smsEnabled, notifyOn*, templates }
  - systemSettings { language, timezone, dateFormat, debugMode }
  - integrationSettings { stripe*, twilio*, sendgrid*, google*, slack* }
  - lastModifiedBy, lastModifiedAt, updatedAt

No indexes needed (single document per hotel)
```

---

## 5. Components Structure

```
src/types/settings.ts                            [NEW]
src/services/settingsService.ts                  [NEW]
src/store/useSettingsStore.ts                    [NEW]
src/pages/Settings.tsx                           [UPDATE]
src/components/settings/
  ├── SettingsTabs.tsx                           [NEW - Tab navigation]
  ├── HotelInfoForm.tsx                          [NEW]
  ├── RoomSettingsForm.tsx                       [NEW]
  ├── BillingSettingsForm.tsx                    [NEW]
  ├── NotificationSettingsForm.tsx               [NEW]
  ├── SystemSettingsForm.tsx                     [NEW]
  ├── IntegrationSettingsForm.tsx                [NEW]
  └── SettingsSaveButton.tsx                     [NEW]
```

---

## 6. Service Implementation

```typescript
// src/services/settingsService.ts (skeleton)

export const settingsService = {
  async getSettings(hotelId: string): Promise<HotelSettings> {
    const docRef = doc(db, 'settings', hotelId);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as HotelSettings || getDefaultSettings(hotelId);
  },

  async updateSettings(hotelId: string, updates: Partial<HotelSettings>): Promise<void> {
    const docRef = doc(db, 'settings', hotelId);
    await setDoc(docRef, {
      ...updates,
      lastModifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
  },

  async updateHotelInfo(hotelId: string, info: HotelInfo): Promise<void> {
    await this.updateSettings(hotelId, { hotelInfo: info });
  },

  async updateRoomSettings(hotelId: string, settings: RoomSettings): Promise<void> {
    await this.updateSettings(hotelId, { roomSettings: settings });
  },

  async updateBillingSettings(hotelId: string, settings: BillingSettings): Promise<void> {
    await this.updateSettings(hotelId, { billingSettings: settings });
  },

  async updateNotificationSettings(hotelId: string, settings: NotificationSettings): Promise<void> {
    await this.updateSettings(hotelId, { notificationSettings: settings });
  },

  async updateSystemSettings(hotelId: string, settings: SystemSettings): Promise<void> {
    await this.updateSettings(hotelId, { systemSettings: settings });
  },

  async updateIntegrationSettings(hotelId: string, settings: IntegrationSettings): Promise<void> {
    await this.updateSettings(hotelId, { integrationSettings: settings });
  }
};
```

---

## 7. Main Settings Page

```typescript
// src/pages/Settings.tsx (UPDATE from placeholder)

export const Settings: React.FC = () => {
  const { userProfile } = useAuth();
  const { settings, loading, updateSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('hotel');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.hotelId) {
      // Fetch settings
    }
  }, [userProfile?.hotelId]);

  return (
    <PermissionGuard requiredPermissions={['admin']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Hotel Settings</h1>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'hotel',
              label: 'Hotel Information',
              children: <HotelInfoForm settings={settings} onSave={handleSave} />
            },
            {
              key: 'rooms',
              label: 'Room Settings',
              children: <RoomSettingsForm settings={settings} onSave={handleSave} />
            },
            {
              key: 'billing',
              label: 'Billing',
              children: <BillingSettingsForm settings={settings} onSave={handleSave} />
            },
            {
              key: 'notifications',
              label: 'Notifications',
              children: <NotificationSettingsForm settings={settings} onSave={handleSave} />
            },
            {
              key: 'system',
              label: 'System',
              children: <SystemSettingsForm settings={settings} onSave={handleSave} />
            },
            {
              key: 'integrations',
              label: 'Integrations',
              children: <IntegrationSettingsForm settings={settings} onSave={handleSave} />
            }
          ]}
        />
      </div>
    </PermissionGuard>
  );
};
```

---

## 8. Individual Form Components

Each form follows this pattern:

```typescript
// src/components/settings/HotelInfoForm.tsx (example)

interface HotelInfoFormProps {
  settings: HotelSettings;
  onSave: (section: string, data: any) => Promise<void>;
}

export const HotelInfoForm: React.FC<HotelInfoFormProps> = ({ settings, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue(settings.hotelInfo || {});
  }, [settings, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await onSave('hotelInfo', values);
      message.success('Settings saved');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="mt-6"
    >
      <Form.Item label="Hotel Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Address" name="address">
        <Input />
      </Form.Item>
      <Form.Item label="City" name="city">
        <Input />
      </Form.Item>
      <Form.Item label="Country" name="country">
        <Input />
      </Form.Item>
      <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Email" name="email" rules={[{ type: 'email', required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Website" name="website">
        <Input placeholder="https://example.com" />
      </Form.Item>
      <Form.Item label="Logo URL" name="logo">
        <Input placeholder="https://example.com/logo.png" />
      </Form.Item>
      <Form.Item label="Tax ID" name="taxId">
        <Input />
      </Form.Item>
      <Button htmlType="submit" type="primary" loading={loading}>
        Save Changes
      </Button>
    </Form>
  );
};
```

---

## 9. Store Implementation

```typescript
// src/store/useSettingsStore.ts

interface SettingsState {
  settings: HotelSettings | null;
  loading: boolean;
  error: string | null;
  
  fetchSettings: (hotelId: string) => Promise<void>;
  updateSettings: (section: string, data: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async (hotelId: string) => {
    set({ loading: true });
    try {
      const settings = await settingsService.getSettings(hotelId);
      set({ settings, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateSettings: async (section: string, data: any) => {
    const { settings } = get();
    if (!settings) return;

    set({ loading: true });
    try {
      const method = `update${section.charAt(0).toUpperCase() + section.slice(1)}`;
      await settingsService[method as keyof typeof settingsService](settings.hotelId, data);
      
      // Refresh settings
      await get().fetchSettings(settings.hotelId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

---

## 10. Implementation Timeline

- **Day 1:** Type definitions + Service layer
- **Day 1:** Store implementation
- **Day 2:** All form components
- **Day 2:** Main Settings page + integration
- **Day 3:** Testing + polish

**Total: 2-3 days**

---

## 11. Security Considerations

- Admin-only access (permission check)
- Sensitive fields: API keys stored encrypted or in environment variables
- Audit trail: Track who modified settings and when
- Validation: Ensure proper formats (phone, email, URLs)
- Rate limiting: Prevent settings manipulation attacks

---

## 12. Integration Points

- Room settings affect Reservation form (check-in/out times)
- Billing settings affect Invoice generation (tax, currency)
- Notification settings affect email/SMS delivery
- System settings affect UI language/timezone
- Integration settings enable external features

---

**Status:** Ready for implementation ✅
