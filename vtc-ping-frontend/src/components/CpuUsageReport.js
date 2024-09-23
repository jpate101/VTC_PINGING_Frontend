// src/components/CpuUsageReport.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './CpuUsageReport.css'; // Import any necessary CSS

const CpuUsageReport = () => {
  const [cpuData, setCpuData] = useState([]);
  const [uniqueSystemNames, setUniqueSystemNames] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch function to get CPU usage data
  const fetchCpuData = async () => {
    try {
      const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      const filteredData = jsonData.filter(entry => entry.message.type === 'Ping');
      setCpuData(filteredData);
      const systemNames = [...new Set(filteredData.map(entry => entry.message.systemName))];
      setUniqueSystemNames(systemNames);
    } catch (error) {
      setError(error);
      console.error('Error fetching CPU data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCpuData();
  }, []);

  // Generate graph data for CPU usage for the selected system
  const generateGraphData = (systemName) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    const labels = [];
    const cpuUsageData = [];

    const increment = 3 * 60 * 1000; // 3 minutes in milliseconds

    for (let currentTime = startTime; currentTime <= now; currentTime = new Date(currentTime.getTime() + increment)) {
      labels.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const entry = cpuData.find(entry => 
        entry.message.systemName === systemName && 
        new Date(entry.timestamp) >= currentTime &&
        new Date(entry.timestamp) < new Date(currentTime.getTime() + increment)
      );

      // Push the CPU usage value, defaulting to 0 if no entry exists
      cpuUsageData.push(entry ? entry.message.cpuUsage : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: `${systemName} CPU Usage (%)`,
          data: cpuUsageData,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: true,
        },
      ],
    };
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>CPU Usage Report</h1>
      
      <label htmlFor="systemSelect">Select System:</label>
      <select
        id="systemSelect"
        value={selectedSystem}
        onChange={(e) => setSelectedSystem(e.target.value)}
      >
        <option value="">--Select a System--</option>
        {uniqueSystemNames.map(systemName => (
          <option key={systemName} value={systemName}>{systemName}</option>
        ))}
      </select>

      {selectedSystem && (
        <div className="graph-container">
          <h3>{selectedSystem} CPU Usage Over Time</h3>
          <Line 
            data={generateGraphData(selectedSystem)} 
            options={{
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Time',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'CPU Usage (%)',
                  },
                  beginAtZero: true,
                },
              },
            }} 
            width={600} 
            height={300} 
          />
        </div>
      )}
    </div>
  );
};

export default CpuUsageReport;