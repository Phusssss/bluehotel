import { useMemo } from 'react';
import { useAuth } from './useAuth';

type PermissionsResult = {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canManageReservations: boolean;
  canViewReservations: boolean;
  // Alerts permissions
  canViewAlerts: boolean;
  canDismissAlerts: boolean;
  canCheckIn: boolean;
  canManageRooms: boolean;
  canManageInvoices: boolean;
  canViewStaffs: boolean;
  isAdmin: boolean;
};

export const usePermissions = (): PermissionsResult => {
  const { userProfile } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;
    return !!(userProfile.permissions && userProfile.permissions.includes(permission));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  return useMemo(() => ({
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Map semantic flags to explicit permission keys
    canManageReservations: hasPermission('manage_reservations'),
    canViewReservations: hasPermission('view_reservations'),
    // Alerts permissions
    canViewAlerts: hasPermission('view_alerts'),
    canDismissAlerts: hasPermission('dismiss_alerts'),
    canCheckIn: hasPermission('check_in'),
    canManageRooms: hasPermission('manage_rooms'),
    canManageInvoices: hasPermission('manage_invoices'),
    canViewStaffs: hasPermission('view_staffs'),
    isAdmin: userProfile?.role === 'admin'
  }), [userProfile]);
};