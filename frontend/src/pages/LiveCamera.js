import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';

import api, { API_URL } from '../services/api';

export default function LiveCamera() {
  const [active, setActive] = useState(false);
  const [speedLimit, setSpeedLimit] = useState(60);
  const [stopLineY, setStopLineY] = useState(320); // Fallback stop line position
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch settings on mount
  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      setSpeedLimit(res.data.max_speed);
      setActive(res.data.live_active);
    } catch (err) {
      console.error('Failed to load traffic settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleStart = async () => {
    try {
      setMessage('');
      setError('');
      await api.get('/api/live/start');
      setActive(true);
      setMessage('🎥 Live camera tracking activated successfully.');
    } catch (err) {
      setError('Failed to initiate live webcam feed. Ensure webcam is connected.');
    }
  };

  const handleStop = async () => {
    try {
      setMessage('');
      setError('');
      await api.get('/api/live/stop');
      setActive(false);
      setMessage('🛑 Live camera stream stopped.');
    } catch (err) {
      setError('Failed to terminate live webcam feed.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      await api.post('/api/settings', { max_speed: parseInt(speedLimit, 10) });
      setMessage('✅ Speed limit threshold updated successfully.');
    } catch (err) {
      setError('Failed to save settings to AI backend.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          🎥 Live Camera Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Run live AI detection on attached webcam feeds and verify parameters in real time
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Live Stream Panel */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Box
              sx={{
                width: '100%',
                bgcolor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 450,
                position: 'relative'
              }}
            >
              {active ? (
                <img
                  src={`${API_URL}/stream`}
                  alt="Live Traffic Video Stream"
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
                  onError={(e) => {
                    setError('Unable to load MJPEG stream. Verify server is running.');
                    setActive(false);
                  }}
                />
              ) : (
                <Stack spacing={2} alignItems="center" sx={{ color: '#94a3b8' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Live Video Feed Inactive
                  </Typography>
                  <Typography variant="body2">
                    Click 'Start Live Monitoring' below to connect local camera
                  </Typography>
                </Stack>
              )}
            </Box>
            
            <CardContent sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  disabled={active}
                  onClick={handleStart}
                  sx={{ py: 1.2, px: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  Start Live Monitoring
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  disabled={!active}
                  onClick={handleStop}
                  sx={{ py: 1.2, px: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  Stop Monitoring
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurations Panel */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  AI Threshold Settings
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                  Adjust parameters dynamically to test detection sensitivities
                </Typography>
                
                <Box component="form" onSubmit={handleSaveSettings}>
                  <Stack spacing={3}>
                    <TextField
                      label="Speed Limit (km/h)"
                      type="number"
                      value={speedLimit}
                      onChange={(e) => setSpeedLimit(e.target.value)}
                      fullWidth
                      helperText="Vehicles crossing this speed trigger over-speeding tickets."
                    />
                    
                    <TextField
                      label="Red Light Stop Line Y"
                      type="number"
                      value={stopLineY}
                      onChange={(e) => setStopLineY(e.target.value)}
                      fullWidth
                      disabled
                      helperText="Stop line horizontal boundary pixel coordinate (read-only)."
                    />
                    
                    <Divider />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ py: 1.5, fontWeight: 700, textTransform: 'none' }}
                    >
                      Update Thresholds
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  ℹ️ AI Capabilities Active
                </Typography>
                <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: 13 }}>
                  <Box>• <strong>Helmet / Triple Riding</strong>: checks HSV skin counts on motorcycle crops.</Box>
                  <Box>• <strong>Wrong Direction</strong>: flags trajectory paths traveling upward.</Box>
                  <Box>• <strong>Wrong Lane</strong>: triggers ticket if vehicles drive in oncoming lane.</Box>
                  <Box>• <strong>Illegal Parking</strong>: flags stationary bounding boxes in shoulder zone.</Box>
                  <Box>• <strong>OCR Verification</strong>: captures license plate with EasyOCR fallback.</Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}