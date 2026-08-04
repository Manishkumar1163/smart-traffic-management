import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TrafficIcon from '@mui/icons-material/Traffic';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    role: 'viewer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Please enter your email and password');
        return;
      }
      setLoading(true);
      try {
        await login(formData.email, formData.password);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err) {
        setError(err.response?.data?.detail || 'Invalid email or password');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all mandatory fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      try {
        await registerUser(formData.name, formData.email, formData.password, formData.role);
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: '',
          name: '',
          confirmPassword: '',
          role: 'viewer'
        });
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 4, boxShadow: 24, bgcolor: 'background.paper', backgroundImage: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: 3, p: 1.5, display: 'inline-flex', color: '#fff', boxShadow: '0 0 20px 0 rgba(99,102,241,0.5)' }}>
              <TrafficIcon fontSize="large" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', color: 'text.primary' }}>
              Smart Traffic AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? 'Login to access the monitoring portal' : 'Create an operator or viewer account'}
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              {!isLogin && (
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                />
              )}

              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
              />

              {!isLogin && (
                <>
                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={loading}
                  />
                  <TextField
                    select
                    label="Account Access Role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    fullWidth
                    disabled={loading}
                  >
                    <MenuItem value="viewer">Public Viewer</MenuItem>
                    <MenuItem value="traffic_officer">Traffic Enforcement Officer</MenuItem>
                    <MenuItem value="admin">System Administrator</MenuItem>
                  </TextField>
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: 16,
                  boxShadow: '0 4px 15px 0 rgba(99,102,241,0.4)',
                }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3.5, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Button
                onClick={toggleMode}
                sx={{ fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', ml: 0.5 }}
              >
                {isLogin ? 'Register Here' : 'Log In Here'}
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}