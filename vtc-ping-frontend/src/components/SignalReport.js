// src/components/SignalReport.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './SignalReport.css'; // Import any necessary CSS

const SignalReport = () => {
  const [pingData, setPingData] = useState([]);
  const [uniqueSystemNames, setUniqueSystemNames] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch function to get ping data
  const fetchPingData = async () => {
    try {
      const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      setPingData(jsonData.filter(entry => entry.message.type === 'Ping'));
      const systemNames = [...new Set(jsonData.map(entry => entry.message.systemName))];
      setUniqueSystemNames(systemNames);
    } catch (error) {
      setError(error);
      console.error('Error fetching ping data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPingData();
  }, []);

  // Generate graph data for signal levels for the selected system
  const generateGraphData = (systemName) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 4 hours ago

    const labels = [];
    const rsrpData = [];
    const rsrqData = [];
    const rssiData = [];
    const sinrData = [];
    
    const increment = 3 * 60 * 1000; // 3 minutes in milliseconds

    for (let currentTime = startTime; currentTime <= now; currentTime = new Date(currentTime.getTime() + increment)) {
      labels.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const entry = pingData.find(entry => 
        entry.message.systemName === systemName && 
        new Date(entry.timestamp) >= currentTime &&
        new Date(entry.timestamp) < new Date(currentTime.getTime() + increment)
      );

      // Push the respective values, defaulting to 0 if no entry exists
      rsrpData.push(entry ? entry.message.signalLevels.RSRP : 0);
      rsrqData.push(entry ? entry.message.signalLevels.RSRQ : 0);
      rssiData.push(entry ? entry.message.signalLevels.RSSI : 0);
      sinrData.push(entry ? entry.message.signalLevels.SINR : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: `${systemName} RSRP Value`,
          data: rsrpData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
        {
          label: `${systemName} RSRQ Value`,
          data: rsrqData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        },
        {
          label: `${systemName} RSSI Value`,
          data: rssiData,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: true,
        },
        {
          label: `${systemName} SINR Value`,
          data: sinrData,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: true,
        },
      ],
    };
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Signal Strength Report</h1>
      
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
          <h3>{selectedSystem} Signal Values Over Time</h3>
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
                    text: 'Signal Value',
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

export default SignalReport;