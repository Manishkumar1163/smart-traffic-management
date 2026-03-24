import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Violations.css';

const API_URL = 'http://localhost:8000/api';

function Violations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      const response = await axios.get(`${API_URL}/violations`);
      setViolations(response.data.violations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching violations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading violations...</div>;
  }

  return (
    <div className="violations-container">
      <h1 className="page-title">Traffic Violations</h1>

      {violations.length === 0 ? (
        <div className="no-data">No violations found</div>
      ) : (
        <div className="violations-table-container">
          <table className="violations-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Driver Name</th>
                <th>Violation Type</th>
                <th>Date/Time</th>
                <th>Fine Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((violation) => (
                <tr key={violation._id}>
                  <td className="license-plate">{violation.license_plate}</td>
                  <td>{violation.driver_name || 'N/A'}</td>
                  <td>{violation.violation_type}</td>
                  <td>{new Date(violation.timestamp).toLocaleString()}</td>
                  <td className="amount">₹{violation.fine_amount}</td>
                  <td>
                    <span className={`status-badge ${violation.payment_status}`}>
                      {violation.payment_status.toUpperCase()}
                    </span>
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

export default Violations;