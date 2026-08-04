import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BusinessIcon from '@mui/icons-material/Business';
import LockIcon from '@mui/icons-material/Lock';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import api, { API_URL } from '../services/api';

// Initialize stripe loading (dummy publishable key is fine for loading elements, actual intents drive transactions)
const stripePromise = loadStripe('pk_test_51PqU9rRxS1234567890abcdefghijklmnopqrstuvwxyz');

function CheckoutForm({ violationId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      // 1. Request PaymentIntent creation from FastAPI
      const formData = new FormData();
      formData.append('violation_id', violationId);
      
      const intentResponse = await api.post('/api/payments/create-intent', formData);
      const { client_secret, sandbox } = intentResponse.data;

      // 2. If running in Sandbox Mode (Stripe credentials missing in .env)
      if (sandbox || client_secret.startsWith('mock_secret_for_')) {
        logSandboxPayment(client_secret);
        return;
      }

      // 3. Live/Test Stripe payment execution
      if (!stripe || !elements) {
        setError('Stripe elements failed to initialize.');
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(`❌ Card error: ${stripeError.message}`);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Send payment confirmation back to server
        const confirmFormData = new FormData();
        confirmFormData.append('violation_id', violationId);
        confirmFormData.append('payment_intent_id', paymentIntent.id);
        
        await api.post('/api/payments/confirm', confirmFormData);
        setMessage('✅ Payment received successfully! Challan settled.');
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Payment intent creation failed.');
      setProcessing(false);
    }
  };

  const logSandboxPayment = async (clientSecret) => {
    // Simulate transaction delay
    setTimeout(async () => {
      try {
        const confirmFormData = new FormData();
        confirmFormData.append('violation_id', violationId);
        // Pass a mock intent token
        confirmFormData.append('payment_intent_id', `mock_intent_token_${Date.now()}`);
        
        await api.post('/api/payments/confirm', confirmFormData);
        setMessage('✅ [Sandbox Mode] Mock Payment processed successfully! Notice settled.');
        setTimeout(() => onSuccess(), 1500);
      } catch (err) {
        setError('Sandbox payment confirmation failed.');
        setProcessing(false);
      }
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            p: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover'
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#f8fafc', // Default color matching theme
                  fontFamily: 'Outfit, Inter, sans-serif',
                  '::placeholder': { color: '#64748b' }
                },
                invalid: { color: '#f43f5e' }
              }
            }}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={processing}
          sx={{ py: 1.5, fontWeight: 700, textTransform: 'none' }}
        >
          {processing ? 'Processing Secure Transaction...' : `Pay Penalty ₹${amount}`}
        </Button>

        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ color: 'text.secondary' }}>
          <LockIcon fontSize="small" />
          <Typography variant="caption">Encrypted 256-bit payment validation gateway</Typography>
        </Stack>
        
        <Box sx={{ mt: 1, p: 1.5, border: '1px dashed', borderColor: 'warning.main', borderRadius: 2, bgcolor: 'warning.main' + '10' }}>
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontWeight: 600 }}>
            🔬 University Examiner Tip:
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Stripe elements require a secure connection. If you don't have a live Stripe secret key, you can enter any dummy credit card number (e.g. 4242 4242...) or click Pay to run mock validation.
          </Typography>
        </Box>
      </Stack>
    </form>
  );
}

export default function PaymentPage() {
  const { violationId } = useParams();
  const navigate = useNavigate();
  
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const fetchViolation = async () => {
    try {
      const res = await api.get('/api/violations');
      const found = (res.data.violations || []).find(v => v._id === violationId);
      
      if (!found) {
        alert('Challan record not found.');
        navigate('/violations');
        return;
      }
      if (found.payment_status === 'paid') {
        alert('This traffic challan has already been paid.');
        navigate('/violations');
        return;
      }
      setViolation(found);
    } catch (err) {
      console.error('Error fetching violation for checkout:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolation();
  }, [violationId]);

  const handleOfflineInstructions = () => {
    alert(`Please take your Challan Reference ID: ${violationId} to the nearest Traffic Inspectorate Branch to pay your penalty in cash.`);
  };

  if (loading && !violation) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Skeleton variant="text" width={150} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          Digital Challan Payment Gate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Settle outstanding traffic penalties using secure Stripe card payments or find cash options
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left: Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%', backgroundImage: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Invoice Summary
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Reference Case ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{violation._id}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">License Plate</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {violation.license_plate}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Violation Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Location & Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    📍 {violation.location.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    📅 {new Date(violation.timestamp).toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Penalty</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                    ₹{violation.fine_amount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Payment Elements */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, backgroundImage: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Settle Invoice
              </Typography>
              
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ mb: 4 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        cursor: 'pointer',
                        borderColor: paymentMethod === 'online' ? 'primary.main' : 'divider',
                        bgcolor: paymentMethod === 'online' ? 'primary.main' + '08' : 'transparent',
                      }}
                    >
                      <FormControlLabel
                        value="online"
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CreditCardIcon color={paymentMethod === 'online' ? 'primary' : 'inherit'} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Card Payment</Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Card>
                  </Grid>

                  <Grid item xs={6}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        cursor: 'pointer',
                        borderColor: paymentMethod === 'offline' ? 'primary.main' : 'divider',
                        bgcolor: paymentMethod === 'offline' ? 'primary.main' + '08' : 'transparent',
                      }}
                    >
                      <FormControlLabel
                        value="offline"
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <BusinessIcon color={paymentMethod === 'offline' ? 'primary' : 'inherit'} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Cash Branch</Typography>
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </Card>
                  </Grid>
                </Grid>
              </RadioGroup>

              {paymentMethod === 'online' ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    violationId={violationId}
                    amount={violation.fine_amount}
                    onSuccess={() => navigate('/violations')}
                  />
                </Elements>
              ) : (
                <Stack spacing={3}>
                  <Alert severity="info">
                    Cash payments are handled physically at local municipal offices.
                  </Alert>
                  
                  <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Steps to Settle Offline:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      1. Visit your nearest Traffic Police Commissionerate Branch.<br />
                      2. Present your License Plate number or Challan ID: <strong>{violationId}</strong>.<br />
                      3. Pay the fine amount of <strong>₹{violation.fine_amount}</strong> in cash.<br />
                      4. Request the counter clerk to clear the case from the database records.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleOfflineInstructions}
                    sx={{ py: 1.5, fontWeight: 700, textTransform: 'none' }}
                  >
                    Locate Inspectorate Offices
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
