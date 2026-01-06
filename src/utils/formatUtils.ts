import dayjs from 'dayjs';

/**
 * Format currency to Vietnamese format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number to Vietnamese format
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Format date to Vietnamese format
 */
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Format datetime to Vietnamese format
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Check if date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};