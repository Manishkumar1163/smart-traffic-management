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
import ContactMailIcon from '@mui/icons-material/ContactMail';
import TimeToLeaveIcon from '@mui/icons-material/TimeToLeave';

import api from '../services/api';
import { parseError } from '../utils/errorParser';

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
    setLoading(true);
    setError('');
    setMessage('');
    
    // Normalize plate number to uppercase
    const submissionData = {
      ...formData,
      license_plate: formData.license_plate.toUpperCase().trim()
    };

    try {
      await api.post('/api/drivers', submissionData);
      setMessage('🎉 Driver and vehicle profile successfully registered to the traffic database!');
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
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }} className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Driver Registration Registry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Create a new driver authority profile mapped to a vehicle registration certificate (RC) and insurance cover
        </Typography>
      </Box>

      {message && <Alert severity="success" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            
            {/* Section 1: Owner Profile */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <PersonAddIcon fontSize="small" />
              Owner & Contact Profile
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Driver License (DL) Code"
                  name="license_number"
                  placeholder="e.g. DL1234567890123"
                  value={formData.license_number}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Permanent Residential Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Section 2: Vehicle Certification */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
              <TimeToLeaveIcon fontSize="small" />
              Vehicle & Insurance Certification
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="License Plate Number"
                  name="license_plate"
                  placeholder="e.g. MH12AB1234"
                  value={formData.license_plate}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="Must match the OCR license plate output format exactly"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Certificate (RC) Number"
                  name="rc_number"
                  placeholder="e.g. RC-123456"
                  value={formData.rc_number}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Insurance Policy Number"
                  name="insurance_number"
                  placeholder="e.g. INS-987654"
                  value={formData.insurance_number}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Insurance Expiry Date"
                  name="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  px: 5,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)'
                  }
                }}
              >
                {loading ? 'Submitting registry...' : 'Register Driver'}
              </Button>
            </Box>

          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}