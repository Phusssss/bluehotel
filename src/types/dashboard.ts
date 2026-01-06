export interface OverviewData {
  totalRooms: number;
  occupiedRooms: number;
  todayRevenue: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  upcomingReservations: number;
  occupancyRate: number;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  dismissed?: boolean;
  viewed?: boolean;
  hotelId?: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  guest: string;
  room: string;
  time: string;
  status: string;
}

export interface OccupancyChartData {
  name: string;
  occupied: number;
  available: number;
  occupancyRate: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface DashboardData {
  overview: OverviewData;
  upcomingReservations: any[];
  alerts: AlertItem[];
  recentActivity: RecentActivity[];
  occupancyChart: OccupancyChartData[];
  revenueChart: RevenueChartData[];
}