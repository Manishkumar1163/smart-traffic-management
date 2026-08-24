import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { parseError } from '../utils/errorParser';

export default function UploadVideo() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|avi|mov|mkv)$/i)) {
        setError('Please select a valid video file (MP4, AVI, MOV, MKV).');
        setFile(null);
        return;
      }
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('File size exceeds the 500MB university project upload limit.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a traffic video file.');
    if (!location.trim()) return setError('Please specify the camera junction location.');

    setUploading(true);
    setError('');
    setMessage('');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('location', location);

    try {
      await api.post('/api/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setMessage(`🎉 Video "${file.name}" uploaded successfully! Server is running YOLOv8 & OCR detection in the background.`);
      setFile(null);
      setLocation('');
      setProgress(0);
      
      // Redirect to the video tracking page after a brief delay
      setTimeout(() => {
        navigate('/videos');
      }, 1500);
      
    } catch (err) {
      setError(parseError(err));
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }} className="animate-slide-up">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
          Batch Video Audit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Upload offline traffic video recordings to queue YOLOv8 vehicle counting and OCR license plate recognition
        </Typography>
      </Box>

      {message && <Alert severity="success" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" variant="filled" sx={{ mb: 3.5, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={{ borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.45)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: file ? 'primary.main' : 'rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  p: 6,
                  bgcolor: file ? 'rgba(99, 102, 241, 0.03)' : 'action.hover',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: file ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.03)',
                    borderColor: 'primary.main'
                  },
                  position: 'relative'
                }}
                component="label"
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <CloudUploadIcon color="primary" sx={{ fontSize: 52, mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {file ? file.name : 'Select or Drag Traffic Video File'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Supported formats: MP4, AVI, MOV, MKV (Max 500MB)'}
                </Typography>
              </Box>

              <TextField
                label="Junction / Camera Location Location"
                placeholder="e.g. Crossing-4 Bypass Road"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                required
                disabled={uploading}
              />

              {uploading && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">Uploading video file...</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{progress}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: '12px',
                      bgcolor: 'action.hover' 
                    }} 
                  />
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={uploading || !file || !location.trim()}
                sx={{ 
                  py: 1.6, 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)'
                  }
                }}
              >
                {uploading ? 'Uploading Video...' : 'Upload & Initiate AI Scan'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ borderRadius: '16px', mt: 4 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            📋 Server-Side Processing Notice
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.6 }}>
            Uploading a video triggers the backend service thread. The AI scans the video frames, tracks multi-vehicle vectors, detects helmetless drivers, maps license plates via EasyOCR, and logs violations. You do not need to keep this tab open after the upload finishes!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}