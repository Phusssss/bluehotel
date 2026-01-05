import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';
import { mockRooms, mockGuests, mockReservations, mockStaff, mockInvoices } from '../utils/mockData';
import type { User } from '../types';

export const importMockData = async () => {
  try {
    console.log('Starting mock data import...');

    // Create admin user
    try {
      const adminCredential = await createUserWithEmailAndPassword(
        auth, 
        'admin@hotel.com', 
        'password123'
      );

      const adminUser: User = {
        id: adminCredential.user.uid,
        email: 'admin@hotel.com',
        role: 'admin',
        hotelId: 'hotel-001',
        permissions: ['all'],
        isActive: true,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', adminCredential.user.uid), adminUser);
      console.log('✅ Admin user created');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin user already exists');
      } else {
        console.error('❌ Error creating admin user:', error);
      }
    }

    // Import hotel data
    const hotelData = {
      id: 'hotel-001',
      name: 'BlueHT Hotel',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '+84 28 1234 5678',
      email: 'info@blueht-hotel.com',
      totalRooms: 100,
      createdAt: new Date(),
      logo: '',
      settings: {
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        taxRate: 0.1
      }
    };

    await setDoc(doc(db, 'hotels', 'hotel-001'), hotelData);
    console.log('✅ Hotel data imported');

    // Import rooms
    for (const room of mockRooms) {
      await addDoc(collection(db, 'rooms'), room);
    }
    console.log('✅ Rooms imported');

    // Import guests
    for (const guest of mockGuests) {
      await addDoc(collection(db, 'guests'), guest);
    }
    console.log('✅ Guests imported');

    // Import staff
    for (const staff of mockStaff) {
      await addDoc(collection(db, 'staffs'), staff);
    }
    console.log('✅ Staff imported');

    // Import reservations
    for (const reservation of mockReservations) {
      await addDoc(collection(db, 'reservations'), reservation);
    }
    console.log('✅ Reservations imported');

    // Import invoices
    for (const invoice of mockInvoices) {
      await addDoc(collection(db, 'invoices'), invoice);
    }
    console.log('✅ Invoices imported');

    console.log('🎉 Mock data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing mock data:', error);
    throw error;
  }
};