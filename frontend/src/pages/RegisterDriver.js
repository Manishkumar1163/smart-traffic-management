import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import api from '../services/api';

export default function RegisterDriver() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_plate: '',
    license_number: '',
    address: '',
    rc_number: '',
    insurance_number: '',
    insurance_expiry: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Input Validation
    if (!formData.name.trim()) return setError('Please enter the driver full name.');
    if (!formData.email.trim() || !formData.email.includes('@')) return setError('Please enter a valid email address.');
    if (!formData.phone.trim() || formData.phone.length < 10) return setError('Please enter a valid 10-digit phone number.');
    if (!formData.license_plate.trim()) return setError('Please specify the vehicle license plate.');
    if (!formData.license_number.trim()) return setError('Please specify the driver license number.');
    if (!formData.address.trim()) return setError('Please enter the permanent address.');

    setLoading(true);

    // Capitalize license plates and numbers
    const payload = {
      ...formData,
      license_plate: formData.license_plate.toUpperCase().replace(/\s+/g, ''),
      license_number: formData.license_number.toUpperCase().replace(/\s+/g, ''),
      rc_number: formData.rc_number ? formData.rc_number.toUpperCase().replace(/\s+/g, '') : undefined,
      insurance_expiry: formData.insurance_expiry ? new Date(formData.insurance_expiry).isoformat : undefined
    };

    try {
      const res = await api.post('/api/drivers/register', payload);
      setMessage(`✅ ${res.data.message}`);
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        license_plate: '',
        license_number: '',
        address: '',
        rc_number: '',
        insurance_number: '',
        insurance_expiry: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register driver. Vehicle plate might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          👤 Register Driver & Vehicle
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add new driver profiles mapped to vehicle license plates for electronic challan notices
        </Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: 2, backgroundImage: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <PersonAddIcon fontSize="small" />
              Owner & Vehicle Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number *"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Driving License Number *"
                  name="license_number"
                  placeholder="e.g. DL-1234567890123"
                  value={formData.license_number}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle License Plate *"
                  name="license_plate"
                  placeholder="e.g. MH12AB1234"
                  value={formData.license_plate}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="RC Number (Optional)"
                  name="rc_number"
                  placeholder="e.g. RC-MH12AB1234"
                  value={formData.rc_number}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Insurance Number (Optional)"
                  name="insurance_number"
                  placeholder="e.g. INS-889911"
                  value={formData.insurance_number}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Insurance Expiry Date (Optional)"
                  name="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Permanent Address *"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, px: 4, fontWeight: 700, textTransform: 'none' }}
                >
                  {loading ? 'Registering Driver...' : 'Register Driver & Vehicle'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}