import { useState, useEffect } from 'react';
import { useReservationStore } from '../store/useReservationStore';
import { useRoomStore } from '../store/useRoomStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { alertService } from '../services/alertService';
import dayjs from 'dayjs';
import type { Reservation, Room, Invoice } from '../types';
import type { DashboardData, AlertItem, RecentActivity, OccupancyChartData, RevenueChartData } from '../types/dashboard';

export const useDashboardData = (hotelId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    overview: {
      totalRooms: 0,
      occupiedRooms: 0,
      todayRevenue: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      upcomingReservations: 0,
      occupancyRate: 0
    },
    upcomingReservations: [],
    alerts: [],
    recentActivity: [],
    occupancyChart: [],
    revenueChart: []
  });

  const { reservations, fetchReservations } = useReservationStore();
  const { rooms, fetchRooms } = useRoomStore();
  const { invoices, fetchInvoices } = useInvoiceStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!hotelId) {
        setError('Hotel ID không hợp lệ');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all required data
        const [reservationsResult, roomsResult, invoicesResult, alertsResult] = await Promise.all([
          fetchReservations(hotelId),
          fetchRooms(hotelId),
          fetchInvoices(hotelId),
          alertService.getAlerts(hotelId)
        ]);
        
        // Set alerts from service
        setData(prevData => ({
          ...prevData,
          alerts: alertsResult
        }));
        
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        setError(error.message || 'Lỗi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [hotelId, fetchReservations, fetchRooms, fetchInvoices]);

  useEffect(() => {
    // Calculate dashboard metrics when data changes
    const calculateMetrics = () => {
      const today = dayjs().format('YYYY-MM-DD');
      const nextWeek = dayjs().add(7, 'days').format('YYYY-MM-DD');
      
      // Ensure arrays exist before processing
      const safeRooms = rooms || [];
      const safeReservations = reservations || [];
      const safeInvoices = invoices || [];
      
      // Room metrics
      const totalRooms = safeRooms.length;
      const occupiedRooms = safeRooms.filter((room: Room) => room.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      
      // Today's check-ins/check-outs
      const todayCheckIns = safeReservations.filter((res: Reservation) => 
        res.checkInDate === today && res.status === 'checked-in'
      ).length;
      
      const todayCheckOuts = safeReservations.filter((res: Reservation) => 
        res.checkOutDate === today && res.status === 'checked-out'
      ).length;
      
      // Upcoming reservations (next 7 days)
      const upcomingReservations = safeReservations.filter((res: Reservation) => 
        res.checkInDate >= today && res.checkInDate <= nextWeek && res.status !== 'cancelled'
      );
      
      // Today's revenue
      const todayInvoices = safeInvoices.filter((inv: Invoice) => 
        dayjs(inv.issueDate).format('YYYY-MM-DD') === today
      );
      const todayRevenue = todayInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);
      
      // Generate local alerts (system-generated)
      const systemAlerts = generateSystemAlerts(safeReservations, safeRooms, hotelId);
      
      // Combine with persisted alerts from service
      const allAlerts = [...data.alerts, ...systemAlerts];
      
      // Generate chart data
      const occupancyChart = generateOccupancyChart(safeReservations, safeRooms);
      const revenueChart = generateRevenueChart(safeInvoices);
      
      // Recent activity
      const recentActivity = generateRecentActivity(safeReservations, safeInvoices);
      
      setData({
        overview: {
          totalRooms,
          occupiedRooms,
          todayRevenue,
          todayCheckIns,
          todayCheckOuts,
          upcomingReservations: upcomingReservations.length,
          occupancyRate
        },
        upcomingReservations: upcomingReservations.slice(0, 10),
        alerts: allAlerts,
        recentActivity,
        occupancyChart,
        revenueChart
      });
    };

    if (!loading) {
      calculateMetrics();
    }
  }, [reservations, rooms, invoices, loading]);

  const generateSystemAlerts = (reservations: Reservation[], rooms: Room[], hotelId: string): AlertItem[] => {
    const alerts = [];
    const today = dayjs().format('YYYY-MM-DD');
    
    // Check for overbooking
    const todayReservations = reservations.filter((res: Reservation) => 
      res.checkInDate <= today && res.checkOutDate > today && res.status !== 'cancelled'
    );
    
    if (todayReservations.length > rooms.length) {
      alerts.push({
        id: `overbook-${hotelId}-${today}`,
        type: 'error',
        title: 'Overbooking detected',
        description: `${todayReservations.length} reservations for ${rooms.length} rooms`,
        priority: 'high',
        createdAt: new Date().toISOString(),
        hotelId
      });
    }
    
    // Check for pending payments
    const pendingPayments = reservations.filter((res: Reservation) => 
      res.paymentStatus === 'pending' && res.checkInDate === today
    );
    
    if (pendingPayments.length > 0) {
      alerts.push({
        id: `payment-${hotelId}-${today}`,
        type: 'warning',
        title: 'Pending payments',
        description: `${pendingPayments.length} reservations with pending payments`,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        hotelId
      });
    }
    
    return alerts;
  };

  const generateOccupancyChart = (reservations: Reservation[], rooms: Room[]): OccupancyChartData[] => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      
      const dayReservations = reservations.filter((res: Reservation) => 
        res.checkInDate <= dateStr && res.checkOutDate > dateStr && res.status !== 'cancelled'
      );
      
      const occupied = dayReservations.length;
      const available = rooms.length - occupied;
      
      data.push({
        name: date.format('dd'),
        occupied,
        available,
        occupancyRate: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0
      });
    }
    return data;
  };

  const generateRevenueChart = (invoices: Invoice[]): RevenueChartData[] => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      
      const dayInvoices = invoices.filter((inv: Invoice) => 
        dayjs(inv.issueDate).format('YYYY-MM-DD') === dateStr
      );
      
      const revenue = dayInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);
      
      data.push({
        date: date.format('DD/MM'),
        revenue
      });
    }
    return data;
  };

  const generateRecentActivity = (reservations: Reservation[], invoices: Invoice[]): RecentActivity[] => {
    const activities: RecentActivity[] = [];
    
    // Recent check-ins
    const recentCheckIns = reservations
      .filter((res: Reservation) => res.status === 'checked-in' && res.actualCheckInTime)
      .sort((a: Reservation, b: Reservation) => new Date(b.actualCheckInTime!).getTime() - new Date(a.actualCheckInTime!).getTime())
      .slice(0, 3);
    
    recentCheckIns.forEach((res: Reservation) => {
      activities.push({
        id: `checkin-${res.id}`,
        type: 'check-in',
        guest: res.guestName || 'N/A',
        room: res.roomNumber || 'N/A',
        time: res.actualCheckInTime!,
        status: 'completed'
      });
    });
    
    // Recent payments
    const recentPayments = invoices
      .filter((inv: Invoice) => inv.paymentStatus === 'paid')
      .sort((a: Invoice, b: Invoice) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 2);
    
    recentPayments.forEach((inv: Invoice) => {
      activities.push({
        id: `payment-${inv.id}`,
        type: 'payment',
        guest: 'Payment received',
        room: inv.totalAmount.toLocaleString('vi-VN') + ' VNĐ',
        time: inv.issueDate,
        status: 'completed'
      });
    });
    
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  };

  return {
    data,
    loading,
    error,
    refreshData: async () => {
      if (hotelId) {
        setError(null);
        try {
          const [, , , alertsResult] = await Promise.all([
            fetchReservations(hotelId),
            fetchRooms(hotelId),
            fetchInvoices(hotelId),
            alertService.getAlerts(hotelId)
          ]);
          
          setData(prevData => ({
            ...prevData,
            alerts: alertsResult
          }));
        } catch (error: any) {
          console.error('Error refreshing dashboard data:', error);
          setError(error.message || 'Lỗi làm mới dữ liệu');
        }
      }
    }
  };
};