import React, { useEffect } from "react";

const LiveCamera = () => {

  useEffect(() => {
    fetch("http://127.0.0.1:8000/start");
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎥 Live Traffic Camera</h2>

      <img
        src="http://127.0.0.1:8000/stream"
        alt="Live Stream"
        style={{
          width: "100%",
          maxWidth: "800px",
          borderRadius: "10px",
          border: "2px solid #ccc"
        }}
      />
    </div>
  );
};

export default LiveCamera;