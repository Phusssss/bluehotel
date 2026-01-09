# 🔌 FRONTEND INTEGRATION GUIDE - REACT → NODE.JS + MYSQL

## I. OVERVIEW - TỔNG QUAN

### Purpose
This document provides a **step-by-step guide** to migrate React frontend from Firebase to Node.js + MySQL backend while maintaining all existing features and user experience.

### Key Points
```
✅ No UI/UX changes - Keep React exactly as is
✅ Drop-in replacement - Replace Firebase calls with REST/WebSocket calls
✅ Parallel running - Can run both backends during transition
✅ Zero downtime migration - Users don't notice any changes
✅ API compatibility - React doesn't care about backend tech stack
```

---

## II. MIGRATION CHECKLIST - DANH SÁCH CÔNG VIỆC

### Phase 1: API Client Setup (Week 1)
- [ ] Create API client utility class
- [ ] Setup Axios/Fetch with interceptors
- [ ] Configure base URL (development/production)
- [ ] Implement error handling
- [ ] Setup request/response logging
- [ ] Configure CORS headers

### Phase 2: Authentication (Week 2)
- [ ] Replace Firebase.auth() with JWT tokens
- [ ] Update login endpoint to use Node.js API
- [ ] Update logout to clear JWT tokens
- [ ] Implement token refresh mechanism
- [ ] Store JWT in localStorage
- [ ] Add Authorization header to all requests
- [ ] Handle 401 Unauthorized responses

### Phase 3: Room Management (Week 3)
- [ ] Replace Firestore room queries with REST API calls
- [ ] Update room status listeners (Firestore → WebSocket)
- [ ] Update room CRUD operations
- [ ] Test all room features
- [ ] Verify real-time status updates

### Phase 4: Reservations (Week 4)
- [ ] Replace Firestore reservation queries
- [ ] Implement conflict detection calls
- [ ] Update check-in/check-out endpoints
- [ ] Replace audit log queries
- [ ] Test all reservation features

### Phase 5: Other Features (Weeks 5-6)
- [ ] Guests management
- [ ] Invoices & payments
- [ ] Services
- [ ] Maintenance
- [ ] Inventory
- [ ] Reports

### Phase 6: Real-time Updates (Week 7)
- [ ] Setup WebSocket connection (Socket.io)
- [ ] Replace Firestore onSnapshot with Socket.io listeners
- [ ] Implement real-time room status
- [ ] Implement real-time reservations
- [ ] Implement real-time notifications

### Phase 7: File Uploads (Week 8)
- [ ] Replace Firebase Storage with Node.js upload endpoint
- [ ] Implement maintenance image uploads
- [ ] Update file retrieval (REST endpoint)

### Phase 8: Testing & Deployment (Weeks 9-10)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Load testing
- [ ] Production deployment

---

## III. API CLIENT SETUP - THIẾT LẬP API CLIENT

### Create API Client Utility

**File: `src/services/api.ts`**
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Create Axios instance
class ApiClient {
  private instance: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add JWT token
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - Handle 401 & token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh token
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed - redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post<ApiResponse<{ access_token: string }>>(
        `${this.instance.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken }
      );

      const newToken = response.data.data.access_token;
      localStorage.setItem('access_token', newToken);
      return newToken;
    })();

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  // GET request
  get<T>(url: string, config?: any): Promise<T> {
    return this.instance.get<any, T>(url, config);
  }

  // POST request
  post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.post<any, T>(url, data, config);
  }

  // PUT request
  put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.put<any, T>(url, data, config);
  }

  // DELETE request
  delete<T>(url: string, config?: any): Promise<T> {
    return this.instance.delete<any, T>(url, config);
  }

  // Get raw instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const apiClient = new ApiClient({ baseURL: API_BASE_URL });
```

### Environment Variables

**File: `.env.local` (development)**
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000
```

**File: `.env.production`**
```
REACT_APP_API_URL=https://api.hotelmanagement.com/api
REACT_APP_WS_URL=wss://api.hotelmanagement.com
```

---

## IV. AUTHENTICATION MIGRATION - CHUYỂN ĐỔI XÁC THỰC

### Current Firebase Auth
```typescript
// OLD - Firebase
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const handleLogin = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // User logged in
  } catch (error) {
    // Handle error
  }
};
```

### New Node.js JWT Auth
```typescript
// NEW - JWT Tokens
interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Update auth state (Zustand)
    useAuthStore.setState({
      user: response.user,
      isAuthenticated: true,
    });

    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    // Handle error
  }
};
```

### Update Auth Store (Zustand)

**File: `src/store/useAuthStore.ts`**
```typescript
import { create } from 'zustand';
import { apiClient } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await apiClient.post<any>('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);

    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await apiClient.post('/auth/logout', {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  register: async (data: any) => {
    const response = await apiClient.post<any>('/auth/register', data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);

    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  refreshUser: async () => {
    const response = await apiClient.get<any>('/auth/me');
    set({ user: response.user });
  },
}));
```

---

## V. SERVICE LAYER MIGRATION - CHUYỂN ĐỔI SERVICE LAYER

### Pattern: Replace Firebase Calls with API Calls

**Before (Firebase)**:
```typescript
// src/services/roomService.ts - OLD
import { firestore } from '../config/firebaseConfig';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export const getRoomsRealtime = (callback: (rooms: Room[]) => void) => {
  const q = query(collection(firestore, 'rooms'), where('status', '!=', 'deleted'));
  
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(rooms);
  });
};

export const getRoomById = async (roomId: string) => {
  const docRef = doc(firestore, 'rooms', roomId);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

export const updateRoomStatus = async (roomId: string, status: string) => {
  await updateDoc(doc(firestore, 'rooms', roomId), { status });
};
```

**After (Node.js + MySQL)**:
```typescript
// src/services/roomService.ts - NEW
import { apiClient } from './api';
import { io } from 'socket.io-client';

interface Room {
  id: number;
  room_number: string;
  status: 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance';
  // ... other fields
}

// Option 1: Regular REST API calls
export const getRooms = async (filters?: any): Promise<Room[]> => {
  const response = await apiClient.get<Room[]>('/rooms', { params: filters });
  return response;
};

export const getRoomById = async (roomId: number): Promise<Room> => {
  const response = await apiClient.get<Room>(`/rooms/${roomId}`);
  return response;
};

export const updateRoomStatus = async (
  roomId: number,
  status: string
): Promise<Room> => {
  const response = await apiClient.put<Room>(`/rooms/${roomId}/status`, {
    status,
  });
  return response;
};

// Option 2: Real-time updates via WebSocket
export const subscribeToRoomUpdates = (callback: (rooms: Room[]) => void) => {
  const socket = io(process.env.REACT_APP_WS_URL);

  socket.on('room:status-changed', (data) => {
    callback(data.rooms);
  });

  return () => socket.disconnect();
};

export const subscribeToRoomStatus = (roomId: number, callback: (room: Room) => void) => {
  const socket = io(process.env.REACT_APP_WS_URL);

  socket.on(`room:${roomId}:updated`, (room) => {
    callback(room);
  });

  return () => socket.disconnect();
};
```

### Other Service Updates

**Reservations Service**:
```typescript
// src/services/reservationService.ts

export const getReservations = async (filters?: any): Promise<Reservation[]> => {
  return await apiClient.get('/reservations', { params: filters });
};

export const createReservation = async (data: CreateReservationDto) => {
  return await apiClient.post('/reservations', data);
};

export const updateReservation = async (id: number, data: any) => {
  return await apiClient.put(`/reservations/${id}`, data);
};

export const checkIn = async (reservationId: number) => {
  return await apiClient.post(`/reservations/${reservationId}/check-in`, {});
};

export const checkOut = async (reservationId: number) => {
  return await apiClient.post(`/reservations/${reservationId}/check-out`, {});
};

export const getReservationAudit = async (reservationId: number) => {
  return await apiClient.get(`/reservations/${reservationId}/audit`);
};
```

**Guests Service**:
```typescript
export const getGuests = async (): Promise<Guest[]> => {
  return await apiClient.get('/guests');
};

export const getGuestById = async (id: number): Promise<Guest> => {
  return await apiClient.get(`/guests/${id}`);
};

export const createGuest = async (data: CreateGuestDto) => {
  return await apiClient.post('/guests', data);
};

export const updateGuest = async (id: number, data: any) => {
  return await apiClient.put(`/guests/${id}`, data);
};

export const getGuestHistory = async (id: number) => {
  return await apiClient.get(`/guests/${id}/history`);
};
```

---

## VI. COMPONENT UPDATE PATTERN - MẪU CẬP NHẬT COMPONENT

### Before & After Examples

**List Component - Before (Firebase)**:
```typescript
import { useEffect, useState } from 'react';
import { firestore } from '../config/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';

export const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      const q = query(collection(firestore, 'rooms'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRooms(data);
      setLoading(false);
    };
    fetchRooms();
  }, []);

  if (loading) return <div>Loading...</div>;
  return (
    <div>
      {rooms.map(room => (
        <div key={room.id}>{room.room_number}</div>
      ))}
    </div>
  );
};
```

**List Component - After (Node.js)**:
```typescript
import { useEffect, useState } from 'react';
import { getRooms } from '../services/roomService';

export const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {rooms.map(room => (
        <div key={room.id}>{room.room_number}</div>
      ))}
    </div>
  );
};
```

**Real-time Component - Before (Firebase)**:
```typescript
import { useEffect, useState } from 'react';
import { subscribeToRoomUpdates } from '../services/roomService';

export const RoomsRealtime = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToRoomUpdates((updatedRooms) => {
      setRooms(updatedRooms);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {rooms.map(room => (
        <div key={room.id}>
          {room.room_number} - {room.status}
        </div>
      ))}
    </div>
  );
};
```

**Real-time Component - After (Node.js + WebSocket)**:
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const RoomsRealtime = () => {
  const [rooms, setRooms] = useState([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_WS_URL, {
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('room:status-changed', (data) => {
      setRooms(data.rooms);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div>
      {rooms.map(room => (
        <div key={room.id}>
          {room.room_number} - {room.status}
        </div>
      ))}
    </div>
  );
};
```

---

## VII. HOOKS MIGRATION - CHUYỂN ĐỔI HOOKS

### Custom Hook Pattern

**Before (Firebase)**:
```typescript
import { useEffect, useState } from 'react';
import { firestore } from '../config/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useReservations = (roomId?: string) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(firestore, 'reservations'));
    if (roomId) {
      q = query(collection(firestore, 'reservations'), where('room_id', '==', roomId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  return { reservations, loading };
};
```

**After (Node.js)**:
```typescript
import { useEffect, useState } from 'react';
import { getReservations } from '../services/reservationService';
import { io, Socket } from 'socket.io-client';

export const useReservations = (roomId?: number) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const data = await getReservations(roomId ? { room_id: roomId } : {});
        setReservations(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Setup WebSocket for real-time updates
    const newSocket = io(process.env.REACT_APP_WS_URL, {
      auth: {
        token: localStorage.getItem('access_token'),
      },
    });

    newSocket.on('reservation:created', (reservation) => {
      setReservations(prev => [...prev, reservation]);
    });

    newSocket.on('reservation:updated', (updated) => {
      setReservations(prev =>
        prev.map(r => r.id === updated.id ? updated : r)
      );
    });

    newSocket.on('reservation:deleted', (id) => {
      setReservations(prev => prev.filter(r => r.id !== id));
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [roomId]);

  return { reservations, loading };
};
```

---

## VIII. ERROR HANDLING - XỬ LÝ LỖI

### Consistent Error Handling Pattern

```typescript
interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Handle API errors
const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return {
      code: error.response.data?.code || 'UNKNOWN_ERROR',
      message: error.response.data?.message || 'An error occurred',
      statusCode: error.response.status,
      details: error.response.data?.details,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      code: 'NO_RESPONSE',
      message: 'No response from server',
      statusCode: 0,
    };
  } else {
    // Error in request setup
    return {
      code: 'REQUEST_ERROR',
      message: error.message,
      statusCode: 0,
    };
  }
};

// Usage in component
try {
  const result = await createReservation(data);
} catch (error) {
  const apiError = handleApiError(error);
  toast.error(apiError.message);
  console.error('API Error:', apiError);
}
```

---

## IX. FILE UPLOAD MIGRATION - CHUYỂN ĐỔI UPLOAD FILE

### Before (Firebase Storage)
```typescript
import { storage } from '../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uploadMaintenanceImage = async (file: File, maintenanceId: string) => {
  const storageRef = ref(storage, `maintenance/${maintenanceId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
```

### After (Node.js API)
```typescript
const uploadMaintenanceImage = async (file: File, maintenanceId: number) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<{ image_url: string }>(
    `/maintenance/${maintenanceId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.image_url;
};
```

### Component Usage
```typescript
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imageUrl = await uploadMaintenanceImage(file, maintenanceId);
    toast.success('Image uploaded successfully');
    // Update state with image URL
  } catch (error) {
    toast.error('Failed to upload image');
  }
};
```

---

## X. STATE MANAGEMENT UPDATE - CẬP NHẬT STATE MANAGEMENT

### Zustand Store Pattern (Unchanged)

The good news: You don't need to change Zustand stores much!

```typescript
// src/store/useReservationStore.ts
import { create } from 'zustand';
import * as reservationService from '../services/reservationService';

interface ReservationStore {
  reservations: Reservation[];
  loading: boolean;
  fetchReservations: () => Promise<void>;
  createReservation: (data: CreateReservationDto) => Promise<void>;
  updateReservation: (id: number, data: any) => Promise<void>;
  deleteReservation: (id: number) => Promise<void>;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: [],
  loading: false,

  fetchReservations: async () => {
    set({ loading: true });
    try {
      const data = await reservationService.getReservations();
      set({ reservations: data });
    } finally {
      set({ loading: false });
    }
  },

  createReservation: async (data) => {
    const result = await reservationService.createReservation(data);
    set((state) => ({ reservations: [...state.reservations, result] }));
  },

  updateReservation: async (id, data) => {
    const result = await reservationService.updateReservation(id, data);
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? result : r
      ),
    }));
  },

  deleteReservation: async (id) => {
    await reservationService.deleteReservation(id);
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    }));
  },
}));
```

---

## XI. TESTING UPDATES - CẬP NHẬT TESTING

### Mock API Client for Tests

```typescript
// src/services/__mocks__/api.ts
export const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
```

### Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useReservations } from '../hooks/useReservations';
import * as reservationService from '../services/reservationService';

jest.mock('../services/reservationService');

describe('useReservations', () => {
  it('should fetch reservations on mount', async () => {
    const mockReservations = [
      { id: 1, guest_name: 'John Doe', status: 'confirmed' },
    ];

    (reservationService.getReservations as jest.Mock).mockResolvedValue(
      mockReservations
    );

    const { result } = renderHook(() => useReservations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reservations).toEqual(mockReservations);
  });
});
```

---

## XII. DEPLOYMENT CHECKLIST - DANH SÁCH TRIỂN KHAI

### Before Going Live

- [ ] All Firebase references removed from code
- [ ] All API calls tested
- [ ] WebSocket real-time updates working
- [ ] Authentication working with JWT tokens
- [ ] File uploads working with new backend
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Logging configured
- [ ] Performance tested (no major regressions)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] Security review completed (no sensitive data in localStorage except JWT)
- [ ] Environment variables configured
- [ ] Documentation updated

### Monitoring & Observability

```typescript
// src/utils/monitoring.ts
import { apiClient } from '../services/api';

// Track API errors
apiClient.getAxiosInstance().interceptors.response.use(
  (response) => response,
  (error) => {
    // Log to monitoring service (e.g., Sentry, DataDog)
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      timestamp: new Date().toISOString(),
    });

    // Send to monitoring service
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }

    return Promise.reject(error);
  }
);
```

---

## XIII. PARALLEL RUNNING (Optional) - CHẠY SONG SONG

If you want to run both backends simultaneously during transition:

```typescript
// src/utils/backend.ts
const USE_NEW_BACKEND = process.env.REACT_APP_USE_NEW_BACKEND === 'true';

export const useNewBackend = (): boolean => {
  return USE_NEW_BACKEND;
};
```

```typescript
// src/services/roomService.ts
import { useNewBackend } from '../utils/backend';
import * as firebaseService from './firebase/roomService';
import * as nodejsService from './nodejs/roomService';

export const getRooms = async () => {
  if (useNewBackend()) {
    return nodejsService.getRooms();
  } else {
    return firebaseService.getRooms();
  }
};
```

This allows you to gradually migrate features while keeping both backends running.

---

## XIV. TROUBLESHOOTING GUIDE - HƯỚNG DẪN KHẮC PHỤC

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | JWT token expired | Implement token refresh in API client |
| CORS errors | Frontend URL not whitelisted | Configure CORS in Node.js backend |
| Real-time not updating | WebSocket not connected | Check socket.io setup and authentication |
| File upload fails | FormData not sent correctly | Use multipart/form-data header |
| Password hashing errors | Different hash algorithm | Use bcryptjs on both ends |
| Timezone differences | Database stores UTC | Handle timezone conversion in frontend |

---

## XV. TIMELINE - TIMELINE

```
Week 1:  API client setup, environment config
Week 2:  Auth migration (login, logout, token refresh)
Week 3:  Room management migration
Week 4:  Reservations migration
Week 5-6: Other features (guests, invoices, etc.)
Week 7:  WebSocket real-time updates
Week 8:  File uploads
Week 9-10: Testing, bug fixes, deployment
```

---

## XVI. FINAL CHECKLIST - DANH SÁCH CUỐI CÙNG

```
✅ API Client setup
✅ Authentication (JWT)
✅ All service layer migrated
✅ All components updated
✅ State management (Zustand) updated
✅ Real-time WebSocket working
✅ File uploads working
✅ Error handling
✅ Loading states
✅ Testing updated
✅ Performance verified
✅ No Firebase references remaining
✅ Documentation updated
✅ Team trained on new architecture
✅ Ready for production deployment
```

---

## CONCLUSION

The frontend integration is **straightforward**:

1. Replace Firebase service calls with REST API / WebSocket calls
2. Update authentication to use JWT tokens
3. Update real-time listeners to use Socket.io
4. Update file uploads to use REST endpoint
5. Keep React components largely unchanged
6. Update tests to mock new API client

**No major React/UI changes needed!** 🎉

The migration preserves the existing user experience while swapping out the backend completely.

