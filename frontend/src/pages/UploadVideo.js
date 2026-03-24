// import React, { useState } from 'react';
// import axios from 'axios';
// import './UploadVideo.css';

// const API_URL = 'http://localhost:8000/api';

// function UploadVideo() {
//   const [file, setFile] = useState(null);
//   const [location, setLocation] = useState('');
//   const [uploading, setUploading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [progress, setProgress] = useState(0);

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
//       if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|avi|mov|mkv)$/i)) {
//         setMessage('Please select a valid video file (MP4, AVI, MOV, MKV)');
//         return;
//       }
      
//       if (selectedFile.size > 500 * 1024 * 1024) {
//         setMessage('File size should not exceed 500MB');
//         return;
//       }
      
//       setFile(selectedFile);
//       setMessage('');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!file) {
//       setMessage('Please select a video file');
//       return;
//     }
    
//     if (!location.trim()) {
//       setMessage('Please enter location');
//       return;
//     }

//     setUploading(true);
//     setMessage('');
//     setProgress(0);

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('location', location);

//     try {
//       const response = await axios.post(`${API_URL}/videos/upload`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round(
//             (progressEvent.loaded * 100) / progressEvent.total
//           );
//           setProgress(percentCompleted);
//         },
//       });

//       setMessage(`✅ ${response.data.message}. Video is being processed...`);
//       setFile(null);
//       setLocation('');
//       setProgress(0);
      
//       document.getElementById('video-file-input').value = '';
//     } catch (error) {
//       setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
//       setProgress(0);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="upload-container">
//       <h1 className="page-title">Upload Traffic Video</h1>
      
//       <div className="upload-card">
//         <form onSubmit={handleSubmit} className="upload-form">
//           <div className="form-group">
//             <label htmlFor="video-file-input" className="form-label">
//               Select Video File
//             </label>
//             <input
//               type="file"
//               id="video-file-input"
//               accept="video/*"
//               onChange={handleFileChange}
//               className="file-input"
//               disabled={uploading}
//             />
//             {file && (
//               <div className="file-info">
//                 <span>📹 {file.name}</span>
//                 <span className="file-size">
//                   ({(file.size / (1024 * 1024)).toFixed(2)} MB)
//                 </span>
//               </div>
//             )}
//           </div>

//           <div className="form-group">
//             <label htmlFor="location-input" className="form-label">
//               Location
//             </label>
//             <input
//               type="text"
//               id="location-input"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="e.g., Main Street Junction, City Center"
//               className="text-input"
//               disabled={uploading}
//             />
//           </div>

//           {progress > 0 && progress < 100 && (
//             <div className="progress-container">
//               <div className="progress-bar">
//                 <div 
//                   className="progress-fill" 
//                   style={{ width: `${progress}%` }}
//                 >
//                   {progress}%
//                 </div>
//               </div>
//             </div>
//           )}

//           {message && (
//             <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
//               {message}
//             </div>
//           )}

//           <button 
//             type="submit" 
//             className="submit-btn"
//             disabled={uploading || !file || !location.trim()}
//           >
//             {uploading ? 'Uploading...' : 'Upload and Process Video'}
//           </button>
//         </form>

//         <div className="upload-instructions">
//           <h3>📋 Instructions</h3>
//           <ul>
//             <li>Supported formats: MP4, AVI, MOV, MKV</li>
//             <li>Maximum file size: 500MB</li>
//             <li>Video should have clear view of license plates</li>
//             <li>Processing time depends on video length</li>
//             <li>You'll receive notifications once processing is complete</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default UploadVideo;



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UploadVideo.css';

const API_URL = 'http://localhost:8000/api';

function UploadVideo() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [processingVideos, setProcessingVideos] = useState([]);

  // Load processing videos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('processingVideos');
    if (saved) {
      const videos = JSON.parse(saved);
      setProcessingVideos(videos);
      
      // Resume polling for each video
      videos.forEach(video => {
        if (video.status === 'processing') {
          pollForDetections(video.id, video.location, video.filename);
        }
      });
    }
  }, []);

  // Save processing videos to localStorage whenever it changes
  useEffect(() => {
    if (processingVideos.length > 0) {
      localStorage.setItem('processingVideos', JSON.stringify(processingVideos));
    }
  }, [processingVideos]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|avi|mov|mkv)$/i)) {
        setMessage('Please select a valid video file (MP4, AVI, MOV, MKV)');
        return;
      }
      
      if (selectedFile.size > 500 * 1024 * 1024) {
        setMessage('File size should not exceed 500MB');
        return;
      }
      
      setFile(selectedFile);
      setMessage('');
    }
  };

  const updateProcessingVideo = (videoId, updates) => {
    setProcessingVideos(prev => 
      prev.map(video => 
        video.id === videoId ? { ...video, ...updates } : video
      )
    );
  };

  const removeProcessingVideo = (videoId) => {
    setProcessingVideos(prev => prev.filter(video => video.id !== videoId));
    
    // Clean up localStorage
    const remaining = processingVideos.filter(video => video.id !== videoId);
    if (remaining.length === 0) {
      localStorage.removeItem('processingVideos');
    }
  };

  // Poll for detections after video upload
  const pollForDetections = async (videoId, videoLocation, filename) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling attempt ${attempts} for video ${videoId}...`);
        
        updateProcessingVideo(videoId, {
          attempts: attempts,
          lastChecked: new Date().toLocaleTimeString()
        });
        
        const response = await axios.get(`${API_URL}/videos/${videoId}/detections`);
        
        if (response.data && response.data.length > 0) {
          // Detections found!
          console.log('Detections found:', response.data);
          
          updateProcessingVideo(videoId, {
            status: 'completed',
            detections: response.data,
            detectionsCount: response.data.length
          });
          
          // Create violations from detections
          await createViolationsFromDetections(response.data, videoLocation);
          
          // Show success message
          setMessage(`✅ Processing complete for "${filename}"! Found ${response.data.length} violation(s).`);
          
          // Remove from processing after 10 seconds
          setTimeout(() => {
            removeProcessingVideo(videoId);
          }, 10000);
          
          return;
        }
        
        // No detections yet, continue polling
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          updateProcessingVideo(videoId, {
            status: 'no_violations',
            message: 'No violations detected'
          });
          
          setMessage(`⚠️ Processing complete for "${filename}" but no violations detected.`);
          
          // Remove from processing after 10 seconds
          setTimeout(() => {
            removeProcessingVideo(videoId);
          }, 10000);
        }
      } catch (error) {
        console.error('Error polling for detections:', error);
        
        if (attempts < maxAttempts) {
          updateProcessingVideo(videoId, {
            status: 'processing',
            error: error.message
          });
          setTimeout(poll, 5000); // Continue polling even on error
        } else {
          updateProcessingVideo(videoId, {
            status: 'error',
            message: 'Error processing video'
          });
          
          setMessage(`❌ Error processing "${filename}". Please check the Violations page later.`);
          
          // Remove from processing after 10 seconds
          setTimeout(() => {
            removeProcessingVideo(videoId);
          }, 10000);
        }
      }
    };
    
    poll();
  };

  // Create violations from detections
  const createViolationsFromDetections = async (detections, videoLocation) => {
    try {
      for (const detection of detections) {
        await axios.post(`${API_URL}/violations/create`, {
          video_id: detection.video_id,
          license_plate: detection.license_plate,
          violation_type: detection.violation_type,
          timestamp: detection.timestamp,
          location: videoLocation,
          confidence_score: detection.confidence_score
        });
      }
      console.log('Violations created successfully');
    } catch (error) {
      console.error('Error creating violations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a video file');
      return;
    }
    
    if (!location.trim()) {
      setMessage('Please enter location');
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('location', location);

    try {
      const response = await axios.post(`${API_URL}/videos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      setUploading(false);
      setMessage(`✅ Video uploaded successfully! Processing "${file.name}"...`);
      
      // Get video ID from response (you may need to adjust based on your API response)
      const uploadedVideoId = response.data.video_id || response.data.id || `video_${Date.now()}`;
      
      // Add to processing videos
      const newProcessingVideo = {
        id: uploadedVideoId,
        filename: file.name,
        location: location,
        status: 'processing',
        uploadedAt: new Date().toLocaleTimeString(),
        attempts: 0,
        lastChecked: new Date().toLocaleTimeString()
      };
      
      setProcessingVideos(prev => [...prev, newProcessingVideo]);
      
      // Start polling for detections
      pollForDetections(uploadedVideoId, location, file.name);
      
      setFile(null);
      setLocation('');
      setProgress(0);
      
      document.getElementById('video-file-input').value = '';
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
      setProgress(0);
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1 className="page-title">Upload Traffic Video</h1>
      
      {/* Processing Videos Section */}
      {processingVideos.length > 0 && (
        <div className="processing-videos-section">
          <h2>🔄 Processing Videos ({processingVideos.length})</h2>
          <div className="processing-videos-list">
            {processingVideos.map((video) => (
              <div key={video.id} className={`processing-video-card ${video.status}`}>
                <div className="video-header">
                  <span className="video-filename">📹 {video.filename}</span>
                  <span className={`video-status-badge ${video.status}`}>
                    {video.status === 'processing' && '⏳ Processing'}
                    {video.status === 'completed' && '✅ Completed'}
                    {video.status === 'no_violations' && '⚠️ No Violations'}
                    {video.status === 'error' && '❌ Error'}
                  </span>
                </div>
                
                <div className="video-details">
                  <p>📍 Location: {video.location}</p>
                  <p>🕐 Uploaded: {video.uploadedAt}</p>
                  {video.status === 'processing' && (
                    <>
                      <p>🔍 Checking... (Attempt {video.attempts}/60)</p>
                      <p>⏱️ Last checked: {video.lastChecked}</p>
                      <div className="processing-spinner"></div>
                    </>
                  )}
                  {video.status === 'completed' && (
                    <p className="detections-found">
                      🚨 Found {video.detectionsCount} violation(s)!
                    </p>
                  )}
                  {video.message && (
                    <p className="status-message">{video.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="upload-card">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="video-file-input" className="form-label">
              Select Video File
            </label>
            <input
              type="file"
              id="video-file-input"
              accept="video/*"
              onChange={handleFileChange}
              className="file-input"
              disabled={uploading}
            />
            {file && (
              <div className="file-info">
                <span>📹 {file.name}</span>
                <span className="file-size">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location-input" className="form-label">
              Location
            </label>
            <input
              type="text"
              id="location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Street Junction, City Center"
              className="text-input"
              disabled={uploading}
            />
          </div>

          {progress > 0 && progress < 100 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={uploading || !file || !location.trim()}
          >
            {uploading ? 'Uploading...' : 'Upload and Process Video'}
          </button>
        </form>

        <div className="upload-instructions">
          <h3>📋 Instructions</h3>
          <ul>
            <li>Supported formats: MP4, AVI, MOV, MKV</li>
            <li>Maximum file size: 500MB</li>
            <li>Video should have clear view of license plates</li>
            <li>Processing time depends on video length</li>
            <li>Track processing status in the section above</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadVideo;