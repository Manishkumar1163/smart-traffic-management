import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

// Icons
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import api from '../services/api';
import { parseError } from '../utils/errorParser';

export default function PendingPayments() {
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPendingViolations = async () => {
    try {
      const res = await api.get('/api/violations');
      const pending = (res.data.violations || []).filter(v => v.payment_status === 'pending');
      setViolations(pending);
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingViolations();
  }, []);

  const handleMarkAsPaid = async (violationId) => {
    if (!window.confirm('Mark this challan as settled? This will log a manual payment receipt.')) {
      return;
    }
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('violation_id', violationId);
      formData.append('payment_intent_id', `ADMIN_MANUAL_PAYMENT_${Date.now()}`);

      await api.post('/api/payments/confirm', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('✅ Payment marked successfully. Receipt email generated.');
      fetchPendingViolations();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleWaiveViolation = async (violationId) => {
    if (!window.confirm('Waive this violation? Fine will be reduced to ₹0 and marked as settled.')) {
      return;
    }
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/api/violations/${violationId}/waive`);
      setMessage('✅ Violation waived successfully. Fines updated to 0.');
      fetchPendingViolations();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = violations.reduce((sum, v) => sum + v.fine_amount, 0);

  if (loading && violations.length === 0) {
    return (
      <Box className="animate-slide-up">
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}><Skeleton width={220} /></Typography>
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box className="animate-slide-up">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            Pending Penalties
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enforce digital challan settlements, compile uncollected logs, or authorize waivers
          </Typography>
        </Box>
        
        <Card sx={{ borderRadius: '16px', px: 3, py: 1.5, display: 'flex', gap: 3.5, border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 8px 24px rgba(99,102,241,0.1)' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 9.5, letterSpacing: 0.5 }}>PENDING CASES</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.25 }}>{violations.length}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ opacity: 0.5 }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, fontSize: 9.5, letterSpacing: 0.5 }}>UNCOLLECTED PENALTY</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'secondary.main', mt: 0.25 }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Card>
      </Box>

      {message && <Alert severity="success" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{error}</Alert>}

      {violations.length === 0 ? (
        <Alert severity="success" variant="filled" sx={{ py: 3, borderRadius: '12px' }}>
          No pending payments. All traffic challans are settled and closed.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)', border: 'none', backgroundImage: 'none' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'background.paper' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>Violation Date</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>License Plate</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>Driver Name</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>Violation Type</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>Location Spot</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 2 }}>Fine Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, py: 2 }}>Settlement Tools</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((row) => (
                <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontSize: 13 }}>{new Date(row.timestamp).toLocaleString('en-IN')}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: 13.5 }}>
                    {row.license_plate}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.driver_name || 'Unregistered Owner'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="soft"
                      sx={{ fontWeight: 800, fontSize: 9.5 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize', fontSize: 13 }}>{row.location}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'secondary.main', fontSize: 13.5 }}>₹{row.fine_amount}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={processing}
                        startIcon={<PaymentIcon />}
                        onClick={() => handleMarkAsPaid(row._id)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, borderRadius: 2 }}
                      >
                        Settle Paid
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        disabled={processing}
                        startIcon={<GavelIcon />}
                        onClick={() => handleWaiveViolation(row._id)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, borderRadius: 2 }}
                      >
                        Waive
                      </Button>
                      
                      <Tooltip title="View Challan Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate('/violations')}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}