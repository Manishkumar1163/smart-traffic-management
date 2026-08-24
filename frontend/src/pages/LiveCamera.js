import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import { useAuth } from '../context/AuthContext';

export default function LiveCamera() {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [speedLimit, setSpeedLimit] = useState(60);
  const [stopLineY, setStopLineY] = useState(320); 
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Live Camera Stream
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Run live AI tracking on attached junction webcam streams and configure violation limits
        </Typography>
      </Box>

      {/* Grid container replaced with robust CSS grid spanning full width */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
          gap: 3, 
          width: '100%',
          alignItems: 'start'
        }}
      >
        {/* Live Stream Panel */}
        <Card 
          sx={{ 
            width: '100%',
            borderRadius: '16px',
            bgcolor: '#0d121f',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none',
            overflow: 'hidden', 
            boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.65)' 
          }}
        >
          <Box
            sx={{
              width: '100%',
              bgcolor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 460,
              position: 'relative',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {active ? (
              <>
                <img
                  src={`${API_URL}/stream`}
                  alt="Live Traffic Video Stream"
                  style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    setError('Unable to load MJPEG stream. Verify server is running.');
                    setActive(false);
                  }}
                />
                {/* Surviellance Telemetry Overlay */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    bgcolor: 'rgba(9, 13, 22, 0.85)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: 2, 
                    px: 2, 
                    py: 1, 
                    border: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 10
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box className="pulsing-alert-active" sx={{ width: 8, height: 8, bgcolor: '#22c55e', borderRadius: '50%' }} />
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#f8fafc', letterSpacing: 0.5 }}>
                      REC // JUNCTION_04
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10 }}>
                    AI: YOLOv8n (Custom weights loaded)
                  </Typography>
                </Box>

                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16, 
                    bgcolor: 'rgba(9, 13, 22, 0.85)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: 2, 
                    px: 2, 
                    py: 1, 
                    border: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 10
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                    ⚡ 30 FPS • 1080p
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 10 }}>
                    Y-Boundary Stopline: {stopLineY}
                  </Typography>
                </Box>
              </>
            ) : (
              <Stack spacing={2.5} alignItems="center" sx={{ color: '#94a3b8', p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Surveillance Feed Offline
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 350 }}>
                  {user && user.role === 'viewer' 
                    ? 'Live feed has not been started. Monitor state is managed by enforcement officers.' 
                    : "Webcam feeds are inactive. Click 'Start Live Stream' below to establish connection."}
                </Typography>
              </Stack>
            )}
          </Box>
          
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2.5} justifyContent="center">
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                disabled={active || (user && user.role === 'viewer')}
                onClick={handleStart}
                sx={{ 
                  py: 1.5, 
                  px: 4, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)' 
                }}
              >
                Start Live Stream
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                disabled={!active || (user && user.role === 'viewer')}
                onClick={handleStop}
                sx={{ 
                  py: 1.5, 
                  px: 4,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)' 
                }}
              >
                Stop Stream
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Configurations Panel */}
        <Stack spacing={3}>
          {message && <Alert severity="success" variant="filled" sx={{ borderRadius: 3 }}>{message}</Alert>}
          {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{error}</Alert>}

          <Card 
            sx={{ 
              width: '100%',
              borderRadius: '16px',
              bgcolor: '#0d121f',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundImage: 'none'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon color="primary" fontSize="small" />
                Sensors & Thresholds
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Modify traffic thresholds; speed alerts and lines adapt instantly
              </Typography>
              
              <Box component="form" onSubmit={handleSaveSettings}>
                <Stack spacing={3.5}>
                  <TextField
                    label="Speed Limit Threshold (km/h)"
                    type="number"
                    value={speedLimit}
                    onChange={(e) => setSpeedLimit(e.target.value)}
                    fullWidth
                    disabled={user && user.role === 'viewer'}
                    helperText="Crossing this speed triggers automatic speeding challans"
                  />
                  
                  <TextField
                    label="Red Light Stop Line Y (pixel)"
                    type="number"
                    value={stopLineY}
                    onChange={(e) => setStopLineY(e.target.value)}
                    fullWidth
                    disabled
                    helperText="Pixel Y horizontal boundary coordinate (read-only)"
                  />
                  
                  <Divider sx={{ opacity: 0.5 }} />
                  
                  {user && user.role !== 'viewer' && (
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{ py: 1.6 }}
                    >
                      Update Sensor Thresholds
                    </Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card 
            sx={{ 
              width: '100%',
              borderRadius: '16px',
              bgcolor: '#0d121f',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundImage: 'none'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                ⚙️ Active AI Capabilities
              </Typography>
              <Stack spacing={2} sx={{ color: 'text.secondary', fontSize: 13 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>• Helmet Safety check</Typography>
                  Skin color pixel distribution check on motorcycle crops
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>• Wrong Direction driving</Typography>
                  Tracks vertical movement vectors rising across tracking lines
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>• Wrong Lane / Crossing</Typography>
                  Flags vehicles driving left of double yellow divider markers
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>• OCR license plate extraction</Typography>
                  Runs EasyOCR recognition on plate bounding crops
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}