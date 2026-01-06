export const PERMISSIONS = {
  // Staff management permissions
  VIEW_STAFFS: 'view_staffs',
  CREATE_STAFF: 'create_staff', 
  UPDATE_STAFF: 'update_staff',
  DELETE_STAFF: 'delete_staff',
  MANAGE_STAFF_PERMISSIONS: 'manage_staff_permissions',
  VIEW_SALARY: 'view_salary',
  MANAGE_SCHEDULE: 'manage_schedule',
  
  // Reservation permissions  
  VIEW_RESERVATIONS: 'view_reservations',
  CHECK_IN: 'check_in',
  
  // Room permissions
  MANAGE_ROOMS: 'manage_rooms',
  
  // Invoice permissions
  MANAGE_INVOICES: 'manage_invoices'
} as const;

export const DASHBOARD_PERMISSIONS = {
  VIEW_RESERVATIONS_PREVIEW: PERMISSIONS.VIEW_RESERVATIONS,
  QUICK_CHECK_IN: PERMISSIONS.CHECK_IN
} as const;