import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:8000';

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_drivers: 0,
    total_videos: 0,
    total_violations: 0,
    pending_payments: 0,
    paid_violations: 0,
    total_revenue: 0
  });

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/statistics`);
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // 🔄 Fetch violations
  const fetchViolations = async () => {
    try {
      const res = await axios.get(`${API_URL}/violations`);
      setViolations(res.data || []);
    } catch (err) {
      console.error('Error fetching violations:', err);
    }
  };

  // ⏱ AUTO REFRESH
  useEffect(() => {
    fetchStatistics();
    fetchViolations();
    setLoading(false);

    const interval = setInterval(() => {
      fetchStatistics();
      fetchViolations();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Safe calculations
  const paymentRate =
    stats.total_violations > 0
      ? ((stats.paid_violations / stats.total_violations) * 100).toFixed(1)
      : '0';

  const avgFine =
    stats.paid_violations > 0
      ? (stats.total_revenue / stats.paid_violations).toFixed(2)
      : '0.00';

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card clickable" onClick={() => navigate('/drivers')}>
          <div className="stat-icon" style={{ background: '#667eea' }}>👥</div>
          <div className="stat-content">
            <p className="stat-label">TOTAL DRIVERS</p>
            <h2 className="stat-value">{stats.total_drivers || 0}</h2>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/videos')}>
          <div className="stat-icon" style={{ background: '#10b981' }}>📹</div>
          <div className="stat-content">
            <p className="stat-label">VIDEOS PROCESSED</p>
            <h2 className="stat-value">{stats.total_videos || 0}</h2>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/violations')}>
          <div className="stat-icon" style={{ background: '#f59e0b' }}>⚠️</div>
          <div className="stat-content">
            <p className="stat-label">TOTAL VIOLATIONS</p>
            <h2 className="stat-value">{stats.total_violations || 0}</h2>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/pending-payments')}>
          <div className="stat-icon" style={{ background: '#ef4444' }}>⏳</div>
          <div className="stat-content">
            <p className="stat-label">PENDING PAYMENTS</p>
            <h2 className="stat-value">{stats.pending_payments || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>✓</div>
          <div className="stat-content">
            <p className="stat-label">PAID VIOLATIONS</p>
            <h2 className="stat-value">{stats.paid_violations || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>₹</div>
          <div className="stat-content">
            <p className="stat-label">TOTAL REVENUE</p>
            <h2 className="stat-value">
              ₹{(stats.total_revenue || 0).toFixed(2)}
            </h2>
          </div>
        </div>

      </div>

      {/* 🔥 LIVE VIOLATIONS SECTION */}
      <div className="overview-section">
        <h2 className="section-title">🚨 Live Violations</h2>

        {violations.length === 0 ? (
          <p>⏳ Waiting for violations...</p>
        ) : (
          violations.slice(0, 5).map((v, i) => (
            <div key={i} className="overview-item">
              <span>🚗 {v.license_plate || 'Unknown'}</span>
              <span>{v.violation_type}</span>
              <span>₹{v.fine_amount}</span>
            </div>
          ))
        )}
      </div>

      <div className="overview-section">
        <h2 className="section-title">System Overview</h2>

        <div className="overview-grid">
          <div className="overview-item">
            <span className="overview-label">Payment Collection Rate:</span>
            <span className="overview-value">{paymentRate}%</span>
          </div>

          <div className="overview-item">
            <span className="overview-label">Average Fine Amount:</span>
            <span className="overview-value">₹{avgFine}</span>
          </div>

          <div className="overview-item">
            <span className="overview-label">System Status:</span>
            <span className="status-badge active">● Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;