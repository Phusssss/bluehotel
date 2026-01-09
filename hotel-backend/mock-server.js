const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@hotel.com' && password === 'admin123') {
    res.json({
      access_token: 'mock-access-token-12345',
      refresh_token: 'mock-refresh-token-67890',
      user: {
        id: 1,
        email: 'admin@hotel.com',
        name: 'Admin User',
        role: 'admin',
        permissions: ['manage_rooms', 'view_reservations', 'manage_invoices']
      }
    });
  } else {
    res.status(401).json({
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'admin@hotel.com',
      name: 'Admin User',
      role: 'admin',
      permissions: ['manage_rooms', 'view_reservations', 'manage_invoices']
    }
  });
});

// Mock rooms endpoints
app.get('/api/rooms', (req, res) => {
  res.json([
    {
      id: 1,
      room_number: '101',
      room_type_id: 1,
      floor: 1,
      status: 'available',
      description: 'Standard room with city view',
      room_type: {
        id: 1,
        name: 'Standard',
        base_price: 100,
        capacity: 2
      }
    },
    {
      id: 2,
      room_number: '102',
      room_type_id: 1,
      floor: 1,
      status: 'occupied',
      description: 'Standard room with garden view',
      room_type: {
        id: 1,
        name: 'Standard',
        base_price: 100,
        capacity: 2
      }
    }
  ]);
});

// Mock reservations endpoints
app.get('/api/reservations', (req, res) => {
  res.json([
    {
      id: 1,
      guest_id: 1,
      room_id: 2,
      check_in_date: '2024-01-15',
      check_out_date: '2024-01-18',
      number_of_guests: 2,
      status: 'confirmed',
      total_amount: 300,
      booking_reference: 'BK001',
      guest: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      room: {
        id: 2,
        room_number: '102',
        room_type: {
          name: 'Standard',
          base_price: 100
        }
      }
    }
  ]);
});

// Mock guests endpoints
app.get('/api/guests', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      nationality: 'US',
      is_vip: false,
      loyalty_points: 150,
      total_stays: 3,
      total_spent: 900,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      address: '456 Oak Ave',
      nationality: 'CA',
      is_vip: true,
      loyalty_points: 500,
      total_stays: 8,
      total_spent: 2400,
      created_at: '2024-01-01T00:00:00Z'
    }
  ]);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Backend Server running on http://localhost:${PORT}`);
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Test Login: admin@hotel.com / admin123`);
});