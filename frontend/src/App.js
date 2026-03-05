import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TuendiHome from './pages/TuendiHome';
import TuendiTracking from './pages/TuendiTracking';
import TuendiDeliveryTracking from './pages/TuendiDeliveryTracking';
import TuendiWallet from './pages/TuendiWallet';
import TuendiHistory from './pages/TuendiHistory';
import TuendiDriverRegister from './pages/TuendiDriverRegister';
import Restaurants from './pages/Restaurants';
import RestaurantMenu from './pages/RestaurantMenu';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Tourism from './pages/Tourism';
import PlaceDetail from './pages/PlaceDetail';
import Bookings from './pages/Bookings';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Inquiries from './pages/Inquiries';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerRegister from './pages/PartnerRegister';
import AccountingDashboard from './pages/AccountingDashboard';
import JournalEntryForm from './pages/JournalEntryForm';
import AdminDashboard from './pages/AdminDashboard';
import PartnerAnalytics from './pages/PartnerAnalytics';
import PartnerMenuManagement from './pages/PartnerMenuManagement';
import PartnerOrders from './pages/PartnerOrders';
import PartnerDocuments from './pages/PartnerDocuments';
import ReferralPage from './pages/ReferralPage';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import '@/App.css';

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/taxi"
        element={
          <ProtectedRoute>
            <TuendiHome />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi"
        element={
          <ProtectedRoute>
            <TuendiHome />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi/tracking/:rideId"
        element={
          <ProtectedRoute>
            <TuendiTracking />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi/delivery-tracking/:deliveryId"
        element={
          <ProtectedRoute>
            <TuendiDeliveryTracking />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi/wallet"
        element={
          <ProtectedRoute>
            <TuendiWallet />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi/history"
        element={
          <ProtectedRoute>
            <TuendiHistory />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tuendi/driver-register"
        element={
          <ProtectedRoute>
            <TuendiDriverRegister />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/restaurants"
        element={
          <ProtectedRoute>
            <Restaurants />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/restaurants/:restaurantId"
        element={
          <ProtectedRoute>
            <RestaurantMenu />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tourism"
        element={
          <ProtectedRoute>
            <Tourism />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/tourism/:placeId"
        element={
          <ProtectedRoute>
            <PlaceDetail />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/properties"
        element={
          <ProtectedRoute>
            <Properties />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/properties/:propertyId"
        element={
          <ProtectedRoute>
            <PropertyDetail />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <Inquiries />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/register"
        element={
          <ProtectedRoute>
            <PartnerRegister />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedRoute>
            <PartnerDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/accounting"
        element={
          <ProtectedRoute>
            <AccountingDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/accounting/new-entry"
        element={
          <ProtectedRoute>
            <JournalEntryForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/analytics"
        element={
          <ProtectedRoute>
            <PartnerAnalytics />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/menu"
        element={
          <ProtectedRoute>
            <PartnerMenuManagement />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/orders"
        element={
          <ProtectedRoute>
            <PartnerOrders />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/partner/documents"
        element={
          <ProtectedRoute>
            <PartnerDocuments />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/referral"
        element={
          <ProtectedRoute>
            <ReferralPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;