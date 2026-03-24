import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";

const Charts = () => {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/violations")
      .then(res => res.json())
      .then(data => setViolations(data))
      .catch(err => console.error(err));
  }, []);

  const counts = {};

  violations.forEach(v => {
    const type = v.violation_type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Analytics</h2>

      {/* ✅ SAFE RENDER */}
      <div style={{ width: "600px" }}>
        <Bar
          data={{
            labels: labels,
            datasets: [
              {
                label: "Violations",
                data: values,
                backgroundColor: ["red", "blue", "green", "orange"],
              },
            ],
          }}
        />
      </div>

      <div style={{ width: "400px", marginTop: "30px" }}>
        <Pie
          data={{
            labels: labels,
            datasets: [
              {
                data: values,
                backgroundColor: ["red", "blue", "green", "orange"],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default Charts;