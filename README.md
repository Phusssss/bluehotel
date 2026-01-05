# 🏨 Hotel Management System

A comprehensive hotel management system built with React, TypeScript, Ant Design, and Firebase.

## ✨ Features

### 🎯 Core Features
- **Authentication** - Secure login/logout with Firebase Auth
- **Dashboard** - Real-time analytics and key metrics
- **Room Management** - Complete CRUD operations for rooms
- **Guest Management** - Customer profiles and history tracking
- **Reservation System** - Advanced booking management with calendar views
- **Check-in/Check-out** - Streamlined guest arrival and departure process
- **Invoice & Payment** - Automated billing and payment tracking

### 🚀 Advanced Features
- **Real-time Availability** - Prevent double bookings with live room availability
- **Drag & Drop Calendar** - Interactive calendar with drag-drop functionality
- **Bulk Operations** - Manage multiple reservations simultaneously
- **Modification History** - Complete audit trail of all changes
- **Advanced Filtering** - Multi-criteria search and filtering
- **Export Functionality** - Export data to CSV, Excel, and PDF
- **Analytics Dashboard** - Business insights and occupancy reports
- **Mobile Responsive** - Optimized for all device sizes
- **Accessibility** - WCAG compliant design

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: Ant Design, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State Management**: Zustand
- **Date Handling**: Day.js
- **Drag & Drop**: React DnD
- **Export**: xlsx, jspdf, papaparse
- **Icons**: Ant Design Icons

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hotel-management.git
   cd hotel-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Enable Storage
   - Copy your Firebase config

4. **Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Firebase configuration to `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── accessibility/   # Accessibility components
│   ├── analytics/       # Analytics dashboard
│   ├── layout/         # Layout components
│   └── reservations/   # Reservation-specific components
├── config/             # Configuration files
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── store/              # State management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎮 Usage

### Default Login
- **Email**: admin@hotel.com
- **Password**: admin123

### Key Workflows

1. **Creating a Reservation**
   - Navigate to Reservations page
   - Click "New Reservation"
   - Select guest, dates, and room
   - System automatically calculates pricing
   - Submit to create reservation

2. **Check-in Process**
   - Find confirmed reservation
   - Click "Check In" button
   - Verify guest information
   - Record actual check-in time
   - Update room status

3. **Managing Rooms**
   - Go to Rooms page
   - Add/edit room details
   - Set room status and pricing
   - Upload room images

## 📊 Features Overview

### Reservation Management
- **Calendar Views**: Month, Week, Day views
- **Drag & Drop**: Move reservations between rooms
- **Real-time Pricing**: Automatic calculation with taxes and discounts
- **Availability Checking**: Prevent double bookings
- **Bulk Operations**: Update multiple reservations at once

### Analytics & Reporting
- **Occupancy Reports**: Daily occupancy rates
- **Revenue Analytics**: Revenue tracking and forecasting
- **Guest Statistics**: Guest behavior insights
- **Export Options**: CSV, Excel, PDF exports

### Mobile Experience
- **Responsive Design**: Works on all screen sizes
- **Touch Optimized**: Touch-friendly interface
- **Offline Support**: Basic offline functionality

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🚀 Deployment

### Firebase Hosting
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Other Platforms
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop `dist` folder
- **AWS S3**: Upload build files to S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ant Design](https://ant.design/) for the amazing UI components
- [Firebase](https://firebase.google.com/) for the backend infrastructure
- [React](https://reactjs.org/) for the frontend framework
- [Vite](https://vitejs.dev/) for the build tool

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact: your-email@example.com

---

**Built with ❤️ for hotel management efficiency**