import React, { createContext, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadVideo from './pages/UploadVideo';
import Violations from './pages/Violations';
import Drivers from './pages/Drivers';
import RegisterDriver from './pages/RegisterDriver';
import PaymentPage from './pages/PaymentPage';
import Videos from './pages/Videos';
import PendingPayments from './pages/PendingPayments';
import Charts from './pages/Charts';
import LiveCamera from './pages/LiveCamera';
import MapModule from './pages/MapModule';

import Layout from './components/Layout';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return null; 
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/violations" element={
        <ProtectedRoute><Layout><Violations /></Layout></ProtectedRoute>
      } />
      <Route path="/charts" element={
        <ProtectedRoute><Layout><Charts /></Layout></ProtectedRoute>
      } />
      <Route path="/live" element={
        <ProtectedRoute><Layout><LiveCamera /></Layout></ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute><Layout><MapModule /></Layout></ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute allowedRoles={['admin', 'traffic_officer']}><Layout><UploadVideo /></Layout></ProtectedRoute>
      } />
      <Route path="/videos" element={
        <ProtectedRoute allowedRoles={['admin', 'traffic_officer']}><Layout><Videos /></Layout></ProtectedRoute>
      } />
      <Route path="/drivers" element={
        <ProtectedRoute allowedRoles={['admin', 'traffic_officer']}><Layout><Drivers /></Layout></ProtectedRoute>
      } />
      <Route path="/register-driver" element={
        <ProtectedRoute allowedRoles={['admin', 'traffic_officer']}><Layout><RegisterDriver /></Layout></ProtectedRoute>
      } />
      <Route path="/pending-payments" element={
        <ProtectedRoute allowedRoles={['admin', 'traffic_officer']}><Layout><PendingPayments /></Layout></ProtectedRoute>
      } />
      <Route path="/pay/:violationId" element={
        <ProtectedRoute><Layout><PaymentPage /></Layout></ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'dark');
  
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => {
        const nextMode = prevMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', nextMode);
        return nextMode;
      });
    },
  }), []);
  
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#6366f1' : '#4f46e5', 
      },
      secondary: {
        main: '#f43f5e', 
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc', 
        paper: mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#475569',
      }
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'dark' ? '0 4px 20px 0 rgba(0,0,0,0.3)' : '0 4px 20px 0 rgba(0,0,0,0.05)',
          }
        }
      }
    }
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}