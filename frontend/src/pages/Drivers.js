

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Drivers.css';

const API_URL = 'http://localhost:8000/api';

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [driverViolations, setDriverViolations] = useState([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API_URL}/drivers`);
      setDrivers(response.data.drivers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    }
  };

  const viewDriver = async (driver) => {
    setSelectedDriver(driver);
    
    // Fetch driver's violations
    try {
      const response = await axios.get(`${API_URL}/violations/driver/${driver.license_plate}`);
      setDriverViolations(response.data.violations);
    } catch (error) {
      console.error('Error fetching driver violations:', error);
      setDriverViolations([]);
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDriver(null);
    setDriverViolations([]);
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  if (loading) {
    return <div className="loading">Loading drivers...</div>;
  }

  return (
    <div className="drivers-container">
      <h1 className="page-title">Registered Drivers</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, license plate, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="no-data">
          {searchTerm ? 'No drivers found matching your search' : 'No drivers registered yet'}
        </div>
      ) : (
        <div className="drivers-grid">
          {filteredDrivers.map((driver) => (
            <div key={driver._id} className="driver-card">
              <div className="driver-avatar">
                {driver.name.charAt(0).toUpperCase()}
              </div>
              <div className="driver-info">
                <h3 className="driver-name">{driver.name}</h3>
                <p className="driver-plate">
                  <span className="plate-badge">{driver.license_plate}</span>
                </p>
                <p className="driver-contact">
                  📧 {driver.email}
                </p>
                <p className="driver-contact">
                  📱 {driver.phone}
                </p>
                <p className="driver-address">
                  📍 {driver.address}
                </p>
                <button 
                  className="btn-view-driver"
                  onClick={() => viewDriver(driver)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedDriver && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Driver Details</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="driver-details-section">
                <h3>Personal Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{selectedDriver.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">License Plate:</span>
                  <span className="detail-value">{selectedDriver.license_plate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedDriver.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedDriver.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedDriver.address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Registered On:</span>
                  <span className="detail-value">
                    {new Date(selectedDriver.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="violations-history-section">
                <h3>Violation History ({driverViolations.length})</h3>
                {driverViolations.length === 0 ? (
                  <p className="no-violations">No violations recorded</p>
                ) : (
                  <div className="violations-list">
                    {driverViolations.map((violation) => (
                      <div key={violation._id} className="violation-item">
                        <div className="violation-item-header">
                          <span className="violation-type">{violation.violation_type}</span>
                          <span className={`status-badge ${violation.payment_status}`}>
                            {violation.payment_status}
                          </span>
                        </div>
                        <div className="violation-item-details">
                          <p>Date: {new Date(violation.timestamp).toLocaleString()}</p>
                          <p>Fine: ₹{violation.fine_amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drivers;
