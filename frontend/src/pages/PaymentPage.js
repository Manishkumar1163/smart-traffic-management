// ⚠️ PASTE COMPLETE PaymentPage.JS CODE FROM CLAUDE HERE
// import React from 'react';
// import './PaymentPage.css';
// function PaymentPage() {
//   return (
//     <div className="-container">
//       <h1>PaymentPage Page</h1>
//       <p>Replace this with complete code from Claude's artifact</p>
//     </div>
//   );
// }
// export default PaymentPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentPage.css';

const API_URL = 'http://localhost:8000/api';
const stripePromise = loadStripe('your_stripe_publishable_key');

function CheckoutForm({ violationId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      // Create payment intent
      const formData = new FormData();
      formData.append('violation_id', violationId);
      
      const intentResponse = await axios.post(
        `${API_URL}/payments/create-intent`,
        formData
      );

      const { client_secret } = intentResponse.data;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setMessage(`❌ Payment failed: ${error.message}`);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment in backend
        const confirmFormData = new FormData();
        confirmFormData.append('violation_id', violationId);
        confirmFormData.append('payment_intent_id', paymentIntent.id);
        
        await axios.post(`${API_URL}/payments/confirm`, confirmFormData);
        
        setMessage('✅ Payment successful!');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {message && (
        <div className={`payment-message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={!stripe || processing}
      >
        {processing ? 'Processing...' : `Pay ₹${amount}`}
      </button>

      <div className="payment-info">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>Test card: 4242 4242 4242 4242</p>
      </div>
    </form>
  );
}

function PaymentPage() {
  const { violationId } = useParams();
  const navigate = useNavigate();
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('online');

  useEffect(() => {
    fetchViolation();
  }, [violationId]);

  const fetchViolation = async () => {
    try {
      const response = await axios.get(`${API_URL}/violations`);
      const foundViolation = response.data.violations.find(v => v._id === violationId);
      
      if (!foundViolation) {
        alert('Violation not found');
        navigate('/violations');
        return;
      }

      if (foundViolation.payment_status === 'paid') {
        alert('This violation has already been paid');
        navigate('/violations');
        return;
      }

      setViolation(foundViolation);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching violation:', error);
      setLoading(false);
    }
  };

  const handleOfflinePayment = () => {
    alert('Please visit the nearest traffic office to make an offline payment. Bring your violation ID: ' + violationId);
  };

  const handlePaymentSuccess = () => {
    navigate('/violations');
  };

  if (loading) {
    return <div className="loading">Loading payment details...</div>;
  }

  if (!violation) {
    return <div className="error-message">Violation not found</div>;
  }

  return (
    <div className="payment-container">
      <h1 className="page-title">Payment</h1>

      <div className="payment-layout">
        <div className="violation-summary">
          <h2>Violation Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span>Violation ID:</span>
              <span className="summary-value">{violation._id}</span>
            </div>
            <div className="summary-row">
              <span>License Plate:</span>
              <span className="summary-value">{violation.license_plate}</span>
            </div>
            <div className="summary-row">
              <span>Violation Type:</span>
              <span className="summary-value">{violation.violation_type}</span>
            </div>
            <div className="summary-row">
              <span>Date/Time:</span>
              <span className="summary-value">
                {new Date(violation.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span className="summary-value">₹{violation.fine_amount}</span>
            </div>
          </div>

          {violation.screenshot_path && (
            <div className="evidence-preview">
              <h3>Evidence Photo</h3>
              <img 
                src={`${API_URL}/screenshots/${violation.screenshot_path.split('/').pop()}`}
                alt="Violation Evidence"
                className="evidence-thumb"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="payment-section">
          <h2>Choose Payment Method</h2>
          
          <div className="payment-method-selector">
            <button
              className={`method-btn ${paymentMethod === 'online' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('online')}
            >
              💳 Online Payment
            </button>
            <button
              className={`method-btn ${paymentMethod === 'offline' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('offline')}
            >
              🏢 Offline Payment
            </button>
          </div>

          {paymentMethod === 'online' ? (
            <div className="online-payment-container">
              <h3>Enter Card Details</h3>
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  violationId={violationId}
                  amount={violation.fine_amount}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          ) : (
            <div className="offline-payment-container">
              <h3>Offline Payment Instructions</h3>
              <div className="offline-instructions">
                <p>To make an offline payment:</p>
                <ol>
                  <li>Visit the nearest traffic office</li>
                  <li>Provide your violation ID: <strong>{violationId}</strong></li>
                  <li>Pay the fine amount: <strong>₹{violation.fine_amount}</strong></li>
                  <li>Collect the payment receipt</li>
                </ol>
                <button
                  className="offline-confirm-btn"
                  onClick={handleOfflinePayment}
                >
                  View Office Locations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
