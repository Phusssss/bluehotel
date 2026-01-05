import type { Room, Guest, Reservation, Invoice, Staff } from '../types';

// Mock Rooms
export const mockRooms: Room[] = [
  {
    id: 'room-001',
    hotelId: 'hotel-001',
    roomNumber: '101',
    roomType: 'single',
    maxGuests: 1,
    basePrice: 500000,
    status: 'available',
    floor: 1,
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom'],
    images: [],
    createdAt: new Date(),
    lastUpdated: new Date()
  },
  {
    id: 'room-002',
    hotelId: 'hotel-001',
    roomNumber: '102',
    roomType: 'double',
    maxGuests: 2,
    basePrice: 800000,
    status: 'occupied',
    floor: 1,
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Minibar'],
    images: [],
    createdAt: new Date(),
    lastUpdated: new Date()
  },
  {
    id: 'room-003',
    hotelId: 'hotel-001',
    roomNumber: '201',
    roomType: 'suite',
    maxGuests: 4,
    basePrice: 1500000,
    status: 'maintenance',
    floor: 2,
    amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Minibar', 'Balcony'],
    images: [],
    createdAt: new Date(),
    lastUpdated: new Date()
  }
];

// Mock Guests
export const mockGuests: Guest[] = [
  {
    id: 'guest-001',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    email: 'nguyenvana@email.com',
    phone: '+84901234567',
    idNumber: 'ABC123456',
    idType: 'national_id',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    country: 'Vietnam',
    totalStays: 5,
    isVIP: true,
    createdAt: new Date(),
    notes: 'Khách hàng VIP, ưu tiên phòng tầng cao'
  },
  {
    id: 'guest-002',
    firstName: 'Trần',
    lastName: 'Thị B',
    email: 'tranthib@email.com',
    phone: '+84907654321',
    idNumber: 'DEF789012',
    idType: 'passport',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    country: 'Vietnam',
    totalStays: 2,
    isVIP: false,
    createdAt: new Date(),
    notes: ''
  }
];

// Mock Reservations
export const mockReservations: Reservation[] = [
  {
    id: 'res-001',
    hotelId: 'hotel-001',
    guestId: 'guest-001',
    roomId: 'room-002',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    numberOfGuests: 2,
    status: 'checked-in',
    totalPrice: 2400000,
    notes: 'Yêu cầu phòng tầng cao',
    specialRequests: 'Check-out muộn',
    source: 'online',
    confirmationCode: 'ABC123',
    paymentStatus: 'paid',
    createdAt: new Date()
  }
];

// Mock Staff
export const mockStaff: Staff[] = [
  {
    id: 'staff-001',
    hotelId: 'hotel-001',
    firstName: 'Lê',
    lastName: 'Văn C',
    email: 'levanc@hotel.com',
    phone: '+84909876543',
    position: 'receptionist',
    department: 'Front Desk',
    salary: 15000000,
    startDate: '2023-01-01',
    status: 'active',
    permissions: ['view_reservations', 'create_reservation', 'check_in', 'check_out'],
    createdAt: new Date()
  }
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    hotelId: 'hotel-001',
    reservationId: 'res-001',
    guestId: 'guest-001',
    roomCharges: 2400000,
    additionalServices: [
      { name: 'Spa', price: 500000 },
      { name: 'Laundry', price: 200000 }
    ],
    taxes: 280000,
    discount: 0,
    totalAmount: 3380000,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    issueDate: '2024-01-18',
    dueDate: '2024-01-18',
    notes: '',
    createdAt: new Date()
  }
];