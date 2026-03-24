import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Videos.css';

const API_URL = 'http://localhost:8000/api';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_URL}/videos`);
      setVideos(response.data.videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const viewDetections = async (video) => {
    setSelectedVideo(video);
    try {
      const response = await axios.get(`${API_URL}/videos/${video._id}/detections`);
      setDetections(response.data || []);
    } catch (error) {
      console.error('Error fetching detections:', error);
      setDetections([]);
    }
  };

  const deleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video and all its violations?')) {
      try {
        await axios.delete(`${API_URL}/videos/${videoId}`);
        alert('Video deleted successfully!');
        fetchVideos();
        setSelectedVideo(null);
      } catch (error) {
        const errorMessage = error.response && error.response.data && error.response.data.detail 
          ? error.response.data.detail 
          : error.message;
        alert('Error deleting video: ' + errorMessage);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  return (
    <div className="videos-container">
      <h1 className="page-title">Processed Videos</h1>

      <div className="videos-grid">
        {videos.length === 0 ? (
          <div className="no-data">
            <p>📹 No videos processed yet</p>
          </div>
        ) : (
          videos.map((video) => (
            <div key={video._id} className="video-card">
              <div className="video-header">
                <span className="video-icon">🎬</span>
                <h3>{video.filename}</h3>
              </div>
              
              <div className="video-details">
                <p><strong>Location:</strong> {video.location}</p>
                <p><strong>Uploaded:</strong> {new Date(video.uploaded_at).toLocaleString()}</p>
                <p><strong>Status:</strong> 
                  <span className={`status ${video.processed ? 'processed' : 'pending'}`}>
                    {video.processed ? '✅ Processed' : '⏳ Processing'}
                  </span>
                </p>
                {video.total_detections !== undefined && (
                  <p><strong>Violations Found:</strong> {video.total_detections}</p>
                )}
              </div>

              <div className="video-actions">
                <button 
                  onClick={() => viewDetections(video)}
                  className="btn-view"
                  disabled={!video.processed}
                >
                  View Detections
                </button>
                <button 
                  onClick={() => deleteVideo(video._id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detections Modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detections for {selectedVideo.filename}</h2>
              <button className="close-btn" onClick={() => setSelectedVideo(null)}>×</button>
            </div>
            
            <div className="modal-body">
              {detections.length === 0 ? (
                <p className="no-detections">No violations detected in this video</p>
              ) : (
                <div className="detections-list">
                  {detections.map((detection, index) => (
                    <div key={detection._id || index} className="detection-item">
                      <div className="detection-header">
                        <span className="detection-type">{detection.violation_type}</span>
                        <span className="detection-confidence">
                          {(detection.confidence_score * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                      <div className="detection-details">
                        <p><strong>License Plate:</strong> {detection.license_plate}</p>
                        <p><strong>Time:</strong> {new Date(detection.timestamp).toLocaleString()}</p>
                        <p><strong>Frame:</strong> {detection.frame_number}</p>
                        <p><strong>Fine:</strong> ₹{detection.fine_amount}</p>
                      </div>
                      {detection.screenshot_path && (
                        <img 
                          src={`${API_URL.replace('/api', '')}/api/screenshots/${detection.screenshot_path.split('/').pop()}`}
                          alt="Violation evidence"
                          className="detection-screenshot"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Videos;