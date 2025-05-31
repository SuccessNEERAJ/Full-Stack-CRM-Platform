import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Dashboard and Main Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Customer Pages
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';

// Order Pages
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import OrderFormPage from './pages/orders/OrderFormPage';

// Segment Pages
import SegmentsPage from './pages/segments/SegmentsPage';
import SegmentBuilderPage from './pages/segments/SegmentBuilderPage';
import SegmentDetailPage from './pages/segments/SegmentDetailPage';

// Campaign Pages
import CampaignsPage from './pages/campaigns/CampaignsPage';
import CampaignDetailPage from './pages/campaigns/CampaignDetailPage';
import NewCampaignPage from './pages/campaigns/NewCampaignPage';

// Profile Page
import ProfilePage from './pages/profile/ProfilePage';

// Notifications Page
import NotificationsPage from './pages/notifications/NotificationsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading auth state, show loading
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated, render the children
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <NotificationsProvider>
        <CssBaseline />
        <ToastContainer 
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes within Main Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Customer Routes */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="customers/edit/:id" element={<CustomerFormPage />} />

            {/* Order Routes */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<OrderFormPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/edit/:id" element={<OrderFormPage />} />

            {/* Segment Routes */}
            <Route path="segments" element={<SegmentsPage />} />
            <Route path="segments/new" element={<SegmentBuilderPage />} />
            <Route path="segments/:id" element={<SegmentDetailPage />} />
            <Route path="segments/edit/:id" element={<SegmentBuilderPage />} />

            {/* Campaign Routes */}
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/new" element={<NewCampaignPage />} />
            <Route path="campaigns/edit/:id" element={<NewCampaignPage />} />
            <Route path="campaigns/:id" element={<CampaignDetailPage />} />

            {/* Profile Route */}
            <Route path="profile" element={<ProfilePage />} />
            
            {/* Notifications Route */}
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationsProvider>
    </ThemeProvider>
  );
}

export default App;
