// ⚠️ PASTE COMPLETE RegisterDriver.JS CODE FROM CLAUDE HERE
// import React from 'react';
// import './RegisterDriver.css';
// function RegisterDriver() {
//   return (
//     <div className="-container">
//       <h1>RegisterDriver Page</h1>
//       <p>Replace this with complete code from Claude's artifact</p>
//     </div>
//   );
// }
// export default RegisterDriver;


import React, { useState } from 'react';
import axios from 'axios';
import './RegisterDriver.css';

const API_URL = 'http://localhost:8000/api';

function RegisterDriver() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_plate: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setMessage('❌ Please enter driver name');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setMessage('❌ Please enter a valid email address');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setMessage('❌ Please enter a valid phone number');
      return;
    }
    if (!formData.license_plate.trim()) {
      setMessage('❌ Please enter license plate number');
      return;
    }
    if (!formData.address.trim()) {
      setMessage('❌ Please enter address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/drivers/register`, formData);
      setMessage(`✅ ${response.data.message}`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        license_plate: '',
        address: ''
      });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1 className="page-title">Register New Driver</h1>

      <div className="register-card">
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="text-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="text-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              className="text-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="license_plate" className="form-label">
              License Plate Number *
            </label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              placeholder="e.g., MH12AB1234"
              className="text-input"
              style={{ textTransform: 'uppercase' }}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              className="textarea-input"
              rows="4"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Driver'}
          </button>
        </form>

        <div className="form-info">
          <h3>ℹ️ Information</h3>
          <ul>
            <li>All fields marked with * are mandatory</li>
            <li>Email will be used for violation notifications</li>
            <li>Phone number should be 10 digits</li>
            <li>License plate number should match vehicle registration</li>
            <li>Ensure all details are accurate before submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RegisterDriver;