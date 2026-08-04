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

// Icons
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';

import api, { API_URL } from '../services/api';

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

      await api.post('/api/payments/confirm', formData);
      setMessage('✅ Payment marked successfully. Receipt email generated.');
      fetchPendingViolations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record manual payment confirmation.');
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
      setError(err.response?.data?.detail || 'Failed to waive violation.');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = violations.reduce((sum, v) => sum + v.fine_amount, 0);

  if (loading && violations.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}><Skeleton width={200} /></Typography>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
            Pending Penalty Collections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enforce digital challan penalty settlements, audit pending cases, or authorize administrative waivers
          </Typography>
        </Box>
        
        <Card variant="outlined" sx={{ borderRadius: 2.5, px: 3, py: 1.5, display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>CASES</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{violations.length}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>UNCOLLECTED</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Card>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {violations.length === 0 ? (
        <Alert severity="success" sx={{ py: 3, borderRadius: 3 }}>
          No pending payments. All traffic challans are settled and closed.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Violation Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>License Plate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Driver Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Violation Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fine Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Settlement Tools</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell>{new Date(row.timestamp).toLocaleString('en-IN')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {row.license_plate}
                  </TableCell>
                  <TableCell>{row.driver_name || 'Unregistered'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.violation_type.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color="secondary"
                      variant="soft"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{row.location}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>₹{row.fine_amount}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={processing}
                        startIcon={<PaymentIcon />}
                        onClick={() => handleMarkAsPaid(row._id)}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11 }}
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
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11 }}
                      >
                        Waive
                      </Button>
                      
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate('/violations')}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
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