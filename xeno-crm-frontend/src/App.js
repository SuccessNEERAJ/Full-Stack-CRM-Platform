import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { setAuthToken } from './utils/authUtils';
import { updateAuthHeader } from './services/apiService';
import { NotificationsProvider } from './context/NotificationsContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import LoginCallback from './pages/auth/LoginCallback';

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
  // Extract token from URL if present
  useEffect(() => {
    // Function to extract token from URL
    const extractAndStoreToken = () => {
      // Check if we're on the dashboard page with auth parameters
      const isDashboardWithAuth = window.location.pathname.includes('/dashboard') && 
                                window.location.search.includes('auth=success');
      
      // Log the current URL and path for debugging
      console.log('Current location:', {
        pathname: window.location.pathname,
        search: window.location.search,
        isDashboardWithAuth: isDashboardWithAuth,
        fullUrl: window.location.href
      });
      
      // Get the current URL search params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const authSuccess = urlParams.get('auth') === 'success';
      
      console.log('URL params check:', { 
        hasToken: !!token, 
        tokenLength: token ? token.length : 0,
        authSuccess,
        rawSearch: window.location.search
      });
      
      // Special handling for OAuth redirect
      if (isDashboardWithAuth) {
        console.log('Detected dashboard with auth=success');
        
        // Extract token using regex as fallback if URLSearchParams fails
        let extractedToken = token;
        if (!extractedToken) {
          const tokenMatch = window.location.search.match(/[?&]token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            extractedToken = decodeURIComponent(tokenMatch[1]);
            console.log('Extracted token using regex:', extractedToken.substring(0, 15) + '...');
          }
        }
        
        if (extractedToken) {
          console.log('Token found in URL, storing in localStorage');
          
          try {
            // Store the token
            localStorage.setItem('xeno_auth_token', extractedToken);
            console.log('Token stored in localStorage, length:', extractedToken.length);
            
            // Update API headers
            updateAuthHeader();
            console.log('API headers updated with token');
            
            // Clean up URL by removing all auth parameters
            let newSearch = window.location.search;
            newSearch = newSearch.replace(/[?&]token=[^&]+/g, '');
            newSearch = newSearch.replace(/[?&]auth=[^&]+/g, '');
            newSearch = newSearch.replace(/[?&]t=[^&]+/g, '');
            newSearch = newSearch.replace(/[?&]user=[^&]+/g, '');
            
            // Fix the search string format
            if (newSearch.startsWith('&')) {
              newSearch = '?' + newSearch.substring(1);
            }
            
            if (newSearch === '?') {
              newSearch = '';
            }
            
            // Create and apply the new clean URL
            const newUrl = window.location.pathname + newSearch + window.location.hash;
            console.log('Cleaned URL:', newUrl);
            window.history.replaceState({}, document.title, newUrl);
            
            // Force a page refresh to ensure the token is used
            window.location.reload();
            return true;
          } catch (error) {
            console.error('Error storing token:', error);
            return false;
          }
        } else {
          console.log('Auth success but no token found in URL');
        }
      } else {
        console.log('Not on dashboard with auth parameters');
      }
      
      return false;
    };
    
    // Execute the token extraction
    const tokenExtracted = extractAndStoreToken();
    
    if (!tokenExtracted) {
      console.log('No token extracted from URL');
      // Check if we already have a token in localStorage
      const existingToken = localStorage.getItem('xeno_auth_token');
      if (existingToken) {
        console.log('Found existing token in localStorage');
        updateAuthHeader();
      }
    }
  }, []);
  
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
          <Route path="/auth/callback" element={<LoginCallback />} />
          
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
