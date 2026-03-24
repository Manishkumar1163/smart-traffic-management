import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadVideo from './pages/UploadVideo';
import Violations from './pages/Violations';
import Drivers from './pages/Drivers';
import RegisterDriver from './pages/RegisterDriver';
import PaymentPage from './pages/PaymentPage';
import Videos from './pages/Videos';
import PendingPayments from './pages/PendingPayments';
import Charts from "./pages/Charts";
import LiveCamera from "./pages/LiveCamera";

import './App.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="App">
      <nav className="navbar">
        <ul className="nav-menu">
          <li><Link to="/charts">Analytics</Link></li>
          <li><Link to="/live">Live Camera</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/upload">Upload Video</Link></li>
          <li><Link to="/violations">Violations</Link></li>
        </ul>
      </nav>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        } />

        <Route path="/upload" element={
          <ProtectedRoute><Layout><UploadVideo /></Layout></ProtectedRoute>
        } />

        <Route path="/violations" element={
          <ProtectedRoute><Layout><Violations /></Layout></ProtectedRoute>
        } />

        {/* ✅ FIXED */}
        <Route path="/charts" element={
          <ProtectedRoute><Layout><Charts /></Layout></ProtectedRoute>
        } />

        <Route path="/live" element={
          <ProtectedRoute><Layout><LiveCamera /></Layout></ProtectedRoute>
        } />

        <Route path="*" element={<h1>404 Not Found</h1>} />

      </Routes>
    </Router>
  );
}

export default App;