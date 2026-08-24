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
import { parseError } from '../utils/errorParser';

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
      
      const intentResponse = await api.post('/api/payments/create-intent', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
        
        await api.post('/api/payments/confirm', confirmFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setMessage('✅ Payment received successfully! Challan settled.');
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setError(parseError(err));
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
        
        await api.post('/api/payments/confirm', confirmFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
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
        {message && <Alert severity="success" variant="filled" sx={{ borderRadius: '12px' }}>{message}</Alert>}
        {error && <Alert severity="error" variant="filled" sx={{ borderRadius: '12px' }}>{error}</Alert>}

        <Box
          sx={{
            p: 3,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            bgcolor: 'action.hover'
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#f8fafc', // Default color matching theme
                  fontFamily: 'Inter, sans-serif',
                  '::placeholder': { color: '#64748b' }
                },
                invalid: { color: '#ef4444' }
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
          sx={{ 
            py: 1.6, 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}
        >
          {processing ? 'Processing Secure Transaction...' : `Pay Penalty Fee`}
        </Button>

        <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ color: 'text.secondary' }}>
          <LockIcon fontSize="small" sx={{ opacity: 0.8 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Encrypted SSL payment gateway</Typography>
        </Stack>
        
        <Box sx={{ mt: 1, p: 2, border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.03)' }}>
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontWeight: 800, mb: 0.5 }}>
            🔬 University Evaluation Note:
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
            Stripe elements require secure endpoints. If you do not have a live Stripe secret key set up, you can enter any dummy credit card number (e.g. 4242 4242...) or click Pay to run mock validation.
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
      <Box className="animate-slide-up">
        <Skeleton variant="text" width={220} height={40} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 3, borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }} className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Penalties Settle Portal
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Settle outstanding traffic violations securely using credit cards or check physical branch options
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left: Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5 }}>
                Challan Receipt Summary
              </Typography>
              
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 10 }}>REFERENCE CHALLAN ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>{violation._id}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 10 }}>LICENSE PLATE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.25 }}>
                    {violation.license_plate}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 10 }}>OFFENSE TYPE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
                    {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 10 }}>LOCATION SPOT & TIMESTAMP</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
                    📍 {violation.location.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    📅 {new Date(violation.timestamp).toLocaleString()}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Challan Fine</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'secondary.main' }}>
                    ₹{violation.fine_amount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Payment Elements */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5 }}>
                Payment Method Options
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
                        borderRadius: '12px',
                        cursor: 'pointer',
                        borderColor: paymentMethod === 'online' ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                        bgcolor: paymentMethod === 'online' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <FormControlLabel
                        value="online"
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CreditCardIcon color={paymentMethod === 'online' ? 'primary' : 'inherit'} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Online Card</Typography>
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
                        borderRadius: '12px',
                        cursor: 'pointer',
                        borderColor: paymentMethod === 'offline' ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                        bgcolor: paymentMethod === 'offline' ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <FormControlLabel
                        value="offline"
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <BusinessIcon color={paymentMethod === 'offline' ? 'primary' : 'inherit'} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Local Branch</Typography>
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
                <Stack spacing={3.5}>
                  <Alert severity="info" variant="filled" sx={{ borderRadius: '12px' }}>
                    Offline payments are cleared physically at local municipal counters.
                  </Alert>
                  
                  <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Settle Offline Steps:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.6, fontSize: 13 }}>
                      1. Visit the nearest Traffic Police Headquarters or Local Court Branch.<br />
                      2. Present your License Plate or Challan ID: <strong style={{ color: '#fff' }}>{violationId}</strong>.<br />
                      3. Clear the penalty of <strong>₹{violation.fine_amount}</strong> in cash.<br />
                      4. Request the counter officer to issue a database clearance confirmation receipt.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleOfflineInstructions}
                    sx={{ py: 1.6 }}
                  >
                    Locate Police Branch Offices
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
