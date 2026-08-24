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
        main: '#6366f1', // Indigo glow accent
      },
      secondary: {
        main: '#a855f7', // Violet secondary accent
      },
      success: {
        main: '#22c55e',
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      },
      background: {
        default: mode === 'dark' ? '#090d16' : '#f8fafc', 
        paper: mode === 'dark' ? '#111827' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#475569',
      }
    },
    typography: {
      fontFamily: '"Inter", sans-serif',
      h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 800 },
      h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      subtitle1: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      subtitle2: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#0d121f' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: mode === 'dark' 
              ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)' 
              : '0 10px 30px -10px rgba(99, 102, 241, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)',
              boxShadow: mode === 'dark'
                ? '0 20px 40px -15px rgba(99, 102, 241, 0.18)'
                : '0 20px 40px -15px rgba(99, 102, 241, 0.08)',
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 30, // Rounded buttons
            textTransform: 'none',
            fontWeight: 700,
            padding: '8px 20px',
            fontFamily: '"Outfit", sans-serif',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
            padding: '16px 20px',
            fontFamily: '"Inter", sans-serif',
          },
          head: {
            backgroundColor: mode === 'dark' ? '#0d121f' : '#f1f5f9',
            color: mode === 'dark' ? '#94a3b8' : '#475569',
            fontWeight: 800,
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.75px',
          }
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02) !important' : 'rgba(0, 0, 0, 0.01) !important',
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px',
              borderColor: '#6366f1',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.25)',
            }
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? 'rgba(13, 18, 31, 0.95) !important' : 'rgba(255, 255, 255, 0.95) !important',
            backdropFilter: 'blur(16px)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: mode === 'dark' 
              ? '0 20px 40px -10px rgba(0, 0, 0, 0.7)' 
              : '0 20px 40px -10px rgba(99, 102, 241, 0.1)',
            borderRadius: '12px !important',
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.08) !important',
              color: '#818cf8',
            }
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