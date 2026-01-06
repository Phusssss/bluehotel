# 📊 Reports & Analytics System - Implementation Guide

**Status:** 🔄 50% Complete (Analytics exists, Reports placeholder)  
**Priority:** High  
**Estimated Effort:** 4-5 days  
**Dependencies:** Dashboard, Reservations, Rooms, Invoices

---

## 1. Current State

### ✅ What Exists
- `src/pages/Analytics.tsx` - Basic analytics page
- `src/components/analytics/AnalyticsDashboard.tsx` - Charts for revenue, occupancy, conflicts
- Charts: Recharts integration ready
- Date range picker for filtering

### ❌ What's Missing
- Advanced metrics (RevPAR, ADR, Average Daily Rate)
- Trend forecasting
- Detailed report types (occupancy, revenue, expense, guest)
- Scheduled report generation
- PDF export functionality
- Report archival system
- Comparison periods (YoY, MoM)

---

## 2. Report Types

### 1. **Occupancy Report**
```typescript
interface OccupancyReport {
  period: DateRange;
  dailyData: {
    date: string;
    occupiedRooms: number;
    totalRooms: number;
    occupancyRate: number;
  }[];
  byRoomType: {
    roomType: string;
    occupancyRate: number;
    averageStay: number;
  }[];
  peakDays: string[];
  offPeakDays: string[];
  averageOccupancy: number;
}
```

### 2. **Revenue Report**
```typescript
interface RevenueReport {
  period: DateRange;
  totalRevenue: number;
  totalReservations: number;
  averageDailyRate: number; // ADR
  revenuePerAvailableRoom: number; // RevPAR
  byRoomType: {
    roomType: string;
    revenue: number;
    reservations: number;
    adr: number;
  }[];
  bySource: {
    source: string;
    revenue: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
  }[];
}
```

### 3. **Expense Report**
```typescript
interface ExpenseReport {
  period: DateRange;
  maintenance: {
    totalCost: number;
    byCategory: Record<string, number>;
    itemCount: number;
  };
  operations: {
    staffing: number;
    supplies: number;
    utilities: number;
  };
  totalExpenses: number;
  expensePerOccupiedRoom: number;
}
```

### 4. **Guest Report**
```typescript
interface GuestReport {
  period: DateRange;
  newGuests: number;
  returningGuests: number;
  repeatRate: number; // percentage
  byCountry: Record<string, number>;
  averageStayLength: number;
  guestSatisfaction: {
    average: number;
    byRoomType: Record<string, number>;
  };
  topGuests: Guest[];
}
```

### 5. **Dashboard Report**
```typescript
interface DashboardReport {
  today: {
    checkIns: number;
    checkOuts: number;
    revenue: number;
    occupancy: number;
  };
  week: {
    forecast: {
      day: string;
      projectedOccupancy: number;
      projectedRevenue: number;
    }[];
  };
  alerts: {
    lowOccupancy: boolean;
    maintenanceBacklog: number;
    unassignedTasks: number;
  };
}
```

---

## 3. Implementation Components

```
src/types/report.ts                              [NEW]
src/services/reportService.ts                    [NEW]
src/store/useReportStore.ts                      [NEW]
src/pages/Reports.tsx                            [UPDATE]
src/components/reports/
  ├── ReportGenerator.tsx                        [NEW]
  ├── OccupancyReport.tsx                        [NEW]
  ├── RevenueReport.tsx                          [NEW]
  ├── ExpenseReport.tsx                          [NEW]
  ├── GuestReport.tsx                            [NEW]
  ├── ReportExport.tsx                           [NEW]
  └── ReportScheduler.tsx                        [NEW]
```

---

## 4. Key Calculations

### Advanced Metrics

```typescript
// Average Daily Rate (ADR)
export const calculateADR = (
  reservations: Reservation[],
  period: DateRange
): number => {
  const filtered = filterByPeriod(reservations, period);
  const totalRevenue = filtered.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalDays = filtered.reduce((sum, r) => sum + calculateNights(r), 0);
  return totalRevenue / totalDays || 0;
};

// Revenue Per Available Room (RevPAR)
export const calculateRevPAR = (
  reservations: Reservation[],
  rooms: Room[],
  period: DateRange
): number => {
  const revenue = calculateTotalRevenue(reservations, period);
  const availableRoomDays = rooms.length * daysInPeriod(period);
  return revenue / availableRoomDays || 0;
};

// Occupancy Rate
export const calculateOccupancyRate = (
  reservations: Reservation[],
  rooms: Room[],
  date: Date
): number => {
  const checkedInOnDate = reservations.filter(r =>
    r.checkInDate <= date && r.checkOutDate > date
  );
  return (checkedInOnDate.length / rooms.length) * 100;
};

// Average Stay Length
export const calculateAverageStay = (reservations: Reservation[]): number => {
  const totalNights = reservations.reduce((sum, r) => sum + calculateNights(r), 0);
  return totalNights / reservations.length || 0;
};

// Repeat Guest Rate
export const calculateRepeatGuestRate = (guests: Guest[]): number => {
  const recurring = guests.filter(g => g.reservationHistory && g.reservationHistory.length > 1);
  return (recurring.length / guests.length) * 100 || 0;
};
```

---

## 5. Report Generation Service

```typescript
// src/services/reportService.ts (skeleton)

export const reportService = {
  // Generate reports
  async generateOccupancyReport(hotelId: string, period: DateRange): Promise<OccupancyReport> {
    const reservations = await reservationService.getReservations(hotelId);
    const rooms = await roomService.getRooms(hotelId);
    
    const dailyData = generateDailyOccupancy(reservations, rooms, period);
    const byRoomType = generateByRoomType(reservations, rooms, period);
    
    return {
      period,
      dailyData,
      byRoomType,
      peakDays: findPeakDays(dailyData),
      offPeakDays: findOffPeakDays(dailyData),
      averageOccupancy: calculateAverage(dailyData.map(d => d.occupancyRate))
    };
  },
  
  async generateRevenueReport(hotelId: string, period: DateRange): Promise<RevenueReport> {
    const reservations = await reservationService.getReservations(hotelId);
    const rooms = await roomService.getRooms(hotelId);
    const invoices = await invoiceService.getInvoices(hotelId);
    
    return {
      period,
      totalRevenue: calculateTotalRevenue(reservations, period),
      totalReservations: filterByPeriod(reservations, period).length,
      averageDailyRate: calculateADR(reservations, period),
      revenuePerAvailableRoom: calculateRevPAR(reservations, rooms, period),
      byRoomType: generateRevenueByRoomType(reservations, period),
      bySource: generateRevenueBySource(reservations, period),
      monthlyTrend: generateMonthlyTrend(reservations, period)
    };
  },
  
  // Schedule report generation
  async scheduleReport(
    hotelId: string,
    type: ReportType,
    frequency: 'daily' | 'weekly' | 'monthly',
    recipients: string[]
  ): Promise<void> {
    // Store in reportSchedules collection
    // Trigger via Cloud Functions on schedule
  },
  
  // Export report
  async exportReport(
    report: any,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> {
    // Use jsPDF/xlsx for generation
  }
};
```

---

## 6. UI Components

### ReportGenerator Component
```typescript
// src/components/reports/ReportGenerator.tsx

interface ReportGeneratorProps {
  hotelId: string;
  onReport: (report: any) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ hotelId, onReport }) => {
  const [reportType, setReportType] = useState<ReportType>('occupancy');
  const [period, setPeriod] = useState<DateRange>([dayjs().subtract(30, 'days'), dayjs()]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const report = await reportService.generateReport(hotelId, reportType, {
        startDate: period[0],
        endDate: period[1]
      });
      onReport(report);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          value={reportType}
          onChange={setReportType}
          options={[
            { value: 'occupancy', label: 'Occupancy Report' },
            { value: 'revenue', label: 'Revenue Report' },
            { value: 'expense', label: 'Expense Report' },
            { value: 'guest', label: 'Guest Report' }
          ]}
        />
        <RangePicker value={period} onChange={(dates) => dates && setPeriod(dates)} />
        <Button loading={loading} onClick={handleGenerate} type="primary">
          Generate Report
        </Button>
      </Space>
    </Card>
  );
};
```

---

## 7. Analytics Dashboard Enhancements

### Add to existing AnalyticsDashboard
- RevPAR metric
- ADR metric
- 7-day revenue trend
- Occupancy forecast
- Guest source breakdown
- Repeat guest rate
- Room type performance

---

## 8. Key Libraries

- **jsPDF** - PDF generation
- **xlsx** - Excel export
- **recharts** - Already in use
- **dayjs** - Date handling (already in use)

---

## 9. Implementation Timeline

- **Day 1:** Report types + Service layer
- **Day 1:** Report components for each type
- **Day 2:** Analytics enhancements + advanced metrics
- **Day 2:** Export functionality (PDF, Excel)
- **Day 3:** Report scheduling + email integration (optional)
- **Day 3+:** Testing & refinements

**Total: 4-5 days for comprehensive system**

---

## 10. Integration Points

- Dashboard: Show key metrics
- Analytics page: Expand existing page
- Reports page: Create new dedicated page
- Email: Send scheduled reports
- Invoices: Include revenue data
- Maintenance: Include cost data

---

**Status:** Ready for implementation ✅
