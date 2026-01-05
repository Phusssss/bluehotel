import type { User } from '../types';

export const hasPermission = (userProfile: User | null, requiredPermissions: string[], hotelId?: string): boolean => {
  if (!userProfile || !userProfile.isActive) return false;
  
  // Use active hotel or provided hotelId
  const targetHotelId = hotelId || userProfile.activeHotelId || userProfile.hotelId;
  
  // Check membership for specific hotel
  const membership = userProfile.memberships?.find(m => m.hotelId === targetHotelId);
  if (membership) {
    // Check membership permissions
    if (membership.role === 'admin') return true;
    if (membership.permissions.includes('all')) return true;
    return requiredPermissions.every(permission => 
      membership.permissions.includes(permission)
    );
  }
  
  // Fallback to legacy single-hotel permissions
  if (userProfile.role === 'admin') return true;
  if (userProfile.permissions.includes('all')) return true;
  return requiredPermissions.every(permission => 
    userProfile.permissions.includes(permission)
  );
};

export const hasRole = (userProfile: User | null, requiredRoles: string[], hotelId?: string): boolean => {
  if (!userProfile || !userProfile.isActive) return false;
  
  const targetHotelId = hotelId || userProfile.activeHotelId || userProfile.hotelId;
  
  // Check membership for specific hotel
  const membership = userProfile.memberships?.find(m => m.hotelId === targetHotelId);
  if (membership) {
    return requiredRoles.includes(membership.role);
  }
  
  // Fallback to legacy role
  return requiredRoles.includes(userProfile.role);
};

export const canAccessHotel = (userProfile: User | null, hotelId: string): boolean => {
  if (!userProfile || !userProfile.isActive) return false;
  
  // Check if user has membership for this hotel
  const hasMembership = userProfile.memberships?.some(m => m.hotelId === hotelId);
  if (hasMembership) return true;
  
  // Fallback to legacy single hotel check
  if (userProfile.role === 'admin') return true;
  return userProfile.hotelId === hotelId;
};

export const getMembership = (userProfile: User | null, hotelId: string) => {
  if (!userProfile) return null;
  return userProfile.memberships?.find(m => m.hotelId === hotelId) || null;
};