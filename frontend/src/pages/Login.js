import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import { motion } from 'framer-motion';

// Icons
import TrafficIcon from '@mui/icons-material/Traffic';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import SpeedIcon from '@mui/icons-material/Speed';

import { parseError } from '../utils/errorParser';

export default function Login() {
  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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
  const [rememberMe, setRememberMe] = useState(true);

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
        setError('Please fill in all mandatory fields');
        return;
      }
      setLoading(true);
      try {
        await login(formData.email, formData.password);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err) {
        setError(parseError(err));
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
        setError(parseError(err));
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#090d16', overflow: 'hidden', width: '100vw' }}>
      {/* Left: Graphic Smart Traffic City Mesh (Only visible md & up) */}
      <Box 
        sx={{ 
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          position: 'relative',
          width: '58.33%',
          background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 90.2%), #040711',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          boxSizing: 'border-box'
        }}
      >
        {/* Futuristic Background overlay */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.15,
            backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} 
        />
        
        {/* App Title Logo block */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 2 }}>
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              borderRadius: '12px', 
              p: 1.25, 
              display: 'flex', 
              color: '#fff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}
          >
            <TrafficIcon fontSize="medium" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#f8fafc', letterSpacing: 0.5 }}>
            TRAFFIC CONTROL CENTER
          </Typography>
        </Box>

        {/* Center Graphic Illustration Content */}
        <Box sx={{ my: 'auto', zIndex: 2, maxWidth: 540 }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: -1, mb: 2 }}>
              Intelligent Edge Traffic Auditing
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: 16, mb: 4, lineHeight: 1.6 }}>
              Autonomous monitoring grid using YOLOv8 multi-class classification and deep learning OCR pipelines to identify violations, map registered drivers, and automate e-challan streams instantly.
            </Typography>
          </motion.div>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: '100%' }}>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'none', borderRadius: '16px', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
              <CardContent sx={{ p: 2.5 }}>
                <SpeedIcon sx={{ color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>Real-time Speeds</Typography>
                <Typography variant="caption" color="text.secondary">Automatic velocity tracking and radar calculations</Typography>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'none', borderRadius: '16px', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
              <CardContent sx={{ p: 2.5 }}>
                <GraphicEqIcon sx={{ color: 'secondary.main', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700 }}>Double Smoothing</Typography>
                <Typography variant="caption" color="text.secondary">Holt's forecasting projecting violation cycles</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Footer info */}
        <Typography variant="caption" color="text.secondary" sx={{ zIndex: 2 }}>
          © Smart Traffic Management Systems • B.Tech CSE Final Year Major Project
        </Typography>
      </Box>

      {/* Right: Glassmorphism Login Card Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          width: { xs: '100%', md: '41.67%' },
          flexGrow: 1,
          background: 'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 60%), #090d16',
          boxSizing: 'border-box'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 430 }}
        >
          <Card 
            sx={{ 
              boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
              bgcolor: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              p: { xs: 2.5, sm: 4.5 },
              borderRadius: '16px',
              '&:hover': {
                transform: 'none'
              }
            }}
          >
            <Stack spacing={2} alignItems="center" sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}>
              <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '12px', p: 1.5, display: 'inline-flex', color: '#fff' }}>
                <TrafficIcon fontSize="large" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                TRAFFIC AI
              </Typography>
            </Stack>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, tracking: -0.5, mb: 1 }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isLogin ? 'Sign in to access the control monitoring panel' : 'Set up a new access role on the dashboard'}
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {error && <Alert severity="error" variant="filled">{error}</Alert>}
                {success && <Alert severity="success" variant="filled">{success}</Alert>}

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
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
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

                {isLogin && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={rememberMe} 
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary" 
                          size="small"
                        />
                      }
                      label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                    />
                    <Link href="#" variant="body2" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                      Forgot Password?
                    </Link>
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: 15,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                    }
                  }}
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {isLogin ? "New to the system? " : "Already registered? "}
                <Button
                  onClick={toggleMode}
                  sx={{ fontWeight: 700, textTransform: 'none', p: 0, minWidth: 'auto', ml: 0.5 }}
                >
                  {isLogin ? 'Register Here' : 'Log In Here'}
                </Button>
              </Typography>
            </Box>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}