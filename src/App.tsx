import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import TicketList from './components/tickets/TicketList';
import TicketThread from './components/tickets/TicketThread';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import React from 'react';
import SettingsPage from './pages/SettingsPage';

// Route guard for protected routes
const ProtectedRoute = ({ 
  children,
  requiredUserType 
}: { 
  children: JSX.Element,
  requiredUserType?: 'admin' | 'customer' 
}) => {
  // Note this works because we only use this component INSIDE the AuthProvider
  const { isAuthenticated, userType, isLoading } = useAuth();
  
  // If still loading auth state, show nothing
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // If a specific user type is required, check that too
  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to={`/${userType}`} replace />;
  }
  
  return children;
};

// App with routing
function AppWithRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <MainLayout userType="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<TicketList userType="admin" />} />
        <Route path="ticket/:ticketId" element={<TicketThread userType="admin" />} />
        {/* Settings route for admin */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Customer Routes */}
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute requiredUserType="customer">
            <MainLayout userType="customer" />
          </ProtectedRoute>
        }
      >
        <Route index element={<TicketList userType="customer" />} />
        <Route path="ticket/:ticketId" element={<TicketThread userType="customer" />} />
        {/* Settings route for customer */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Wrapper component to provide auth context
function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppWithRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;