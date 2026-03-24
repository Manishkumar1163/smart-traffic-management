import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PendingPayments.css';



const API_URL = 'http://localhost:8000/api';

function PendingPayments() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingViolations();
  }, []);

  const fetchPendingViolations = async () => {
    try {
      const response = await axios.get(`${API_URL}/violations`);
      const pending = response.data.violations.filter(v => v.payment_status === 'pending');
      setViolations(pending);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching violations:', error);
      setLoading(false);
    }
  };

  const markAsPaid = async (violationId) => {
    if (!window.confirm('Mark this violation as paid? This action cannot be undone.')) {
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('violation_id', violationId);
      formData.append('payment_intent_id', `ADMIN_PAYMENT_${Date.now()}`);

      await axios.post(`${API_URL}/payments/confirm`, formData);
      
      alert('Payment marked as successful!');
      fetchPendingViolations();
    } catch (error) {
      const errorMessage = error.response && error.response.data && error.response.data.detail 
        ? error.response.data.detail 
        : error.message;
      alert('Error processing payment: ' + errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const waiveViolation = async (violationId) => {
    if (!window.confirm('Waive this violation? The fine will be set to ₹0 and marked as paid.')) {
      return;
    }

    setProcessing(true);
    try {
      // Update fine to 0 and mark as paid
      await axios.put(`${API_URL}/violations/${violationId}/waive`);
      
      alert('Violation waived successfully!');
      fetchPendingViolations();
    } catch (error) {
      const errorMessage = error.response && error.response.data && error.response.data.detail 
        ? error.response.data.detail 
        : error.message;
      alert('Error waiving violation: ' + errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading pending payments...</div>;
  }

  return (
    <div className="pending-payments-container">
      <div className="header">
        <h1 className="page-title">Pending Payments</h1>
        <div className="summary">
          <span className="summary-count">{violations.length} pending</span>
          <span className="summary-amount">
            Total: ₹{violations.reduce((sum, v) => sum + v.fine_amount, 0).toFixed(2)}
          </span>
        </div>
      </div>

      {violations.length === 0 ? (
        <div className="no-data">
          <p>✅ No pending payments!</p>
          <p className="sub-text">All violations have been paid</p>
        </div>
      ) : (
        <div className="violations-table-container">
          <table className="violations-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>License Plate</th>
                <th>Driver Name</th>
                <th>Violation Type</th>
                <th>Location</th>
                <th>Fine Amount</th>
                <th>Screenshot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((violation) => (
                <tr key={violation._id}>
                  <td>{new Date(violation.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="license-plate">{violation.license_plate}</span>
                  </td>
                  <td>{violation.driver_name || 'Unregistered'}</td>
                  <td>
                    <span className={`violation-badge ${violation.violation_type}`}>
                      {violation.violation_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{violation.location}</td>
                  <td className="amount">₹{violation.fine_amount}</td>
                  <td>
                    {violation.screenshot_path && (
                      <button 
                        className="btn-screenshot"
                        onClick={() => window.open(
                          `${API_URL.replace('/api', '')}/api/screenshots/${violation.screenshot_path.split('/').pop()}`,
                          '_blank'
                        )}
                      >
                        View
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-pay"
                        onClick={() => markAsPaid(violation._id)}
                        disabled={processing}
                      >
                        Mark as Paid
                      </button>
                      <button
                        className="btn-waive"
                        onClick={() => waiveViolation(violation._id)}
                        disabled={processing}
                      >
                        Waive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PendingPayments;