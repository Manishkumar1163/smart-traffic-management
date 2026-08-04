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
      const response = await api.post('/api/videos/upload', formData, {
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
      setError(err.response?.data?.detail || err.message || 'Failed to upload video.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, tracking: -0.5 }}>
          📹 Upload Traffic Video for Offline Audit
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload pre-recorded traffic camera videos to run batch YOLOv8 vehicle counting, helmet check, and OCR challan logs
        </Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: 2, backgroundImage: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: file ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  p: 4,
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  textAlign: 'center',
                  '&:hover': { bgcolor: 'action.selected' },
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
                <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {file ? file.name : 'Select or Drag Traffic Video File'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Supported formats: MP4, AVI, MOV, MKV (Max 500MB)'}
                </Typography>
              </Box>

              <TextField
                label="Junction Location"
                placeholder="e.g. Main Street Bypass Road, Crossing-4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                required
                disabled={uploading}
              />

              {uploading && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Uploading video file...</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 2 }} />
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={uploading || !file || !location.trim()}
                sx={{ py: 1.5, fontWeight: 700, textTransform: 'none' }}
              >
                {uploading ? 'Uploading Video...' : 'Upload and Queue AI Processing'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      
      <Card sx={{ borderRadius: 3, mt: 4, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            📋 University Presentation Tip
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            Uploading a video triggers the backend service thread (`cv.py::_process_video_sync`). The AI scans the video frames, runs plate tracking, identifies helmetless riders or speed violators, extracts plates, saves crops, and auto-records tickets in the database. You do not need to keep this tab open after the upload finishes!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}