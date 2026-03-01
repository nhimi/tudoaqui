import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaxiNew from './pages/TaxiNew';
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
            <TaxiNew />
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