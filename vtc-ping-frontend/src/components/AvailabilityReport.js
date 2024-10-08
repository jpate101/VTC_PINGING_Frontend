import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './AvailabilityReport.css'; // Import the CSS file
import { Link } from 'react-router-dom';

const AvailabilityReport = () => {
  const [pingData, setPingData] = useState([]);
  const [currentlyOnDevices, setCurrentlyOnDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState('');

  // Fetch function to get ping data
  const fetchPingData = async () => {
    try {
      const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      const filteredData = jsonData.filter(entry => entry.message.type === 'Ping');
      setPingData(filteredData);
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

  // Function to get unique system names
  const getUniqueSystemNames = () => {
    const systemNames = new Set(pingData.map(entry => entry.message.systemName));
    return Array.from(systemNames);
  };

  // Determine currently "On" devices
  const getCurrentlyOnDevices = () => {
    const now = new Date();
    const recentData = pingData.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      return entry.message.type === 'Ping' && entryTime >= new Date(now.getTime() - 4 * 60 * 60 * 1000);
    });

    const systemStatus = {};
    recentData.forEach(entry => {
      const systemName = entry.message.systemName;
      if (!systemStatus[systemName] || new Date(entry.timestamp) > systemStatus[systemName]) {
        systemStatus[systemName] = new Date(entry.timestamp);
      }
    });

    return Object.keys(systemStatus).filter(systemName => {
      const lastSeen = systemStatus[systemName];
      return new Date() - lastSeen < 60 * 1000; // Consider "On" if last seen within the last minute
    });
  };

  useEffect(() => {
    if (pingData.length > 0) {
      setCurrentlyOnDevices(getCurrentlyOnDevices());
    }
  }, [pingData]);

  // Generate graph data for a specific system
  const generateGraphData = (systemName) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 4 hours ago

    const labels = [];
    const data = [];
    
    const increment = 3 * 60 * 1000; // 3 minutes in milliseconds

    for (let currentTime = startTime; currentTime <= now; currentTime = new Date(currentTime.getTime() + increment)) {
      labels.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const isOn = pingData.some(entry => {
        const entryTime = new Date(entry.timestamp);
        return entry.message.systemName === systemName &&
               entryTime >= currentTime &&
               entryTime < new Date(currentTime.getTime() + increment);
      });

      data.push(isOn ? 1 : 0);
    }

    return {
      labels,
      datasets: [{
        label: `${systemName} Ping Status`,
        data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }],
    };
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const uniqueSystemNames = getUniqueSystemNames();

  return (
    <div>
      <h2>Availability Report</h2>
      <Link to="/" className="link">Go back to Home Page</Link>

      {/* Dropdown for selecting system */}
      <div className="dropdown">
        <label htmlFor="systemSelect">Select System:</label>
        <select 
          id="systemSelect" 
          value={selectedSystem} 
          onChange={(e) => setSelectedSystem(e.target.value)}
        >
          <option value="">-- Select a System --</option>
          {uniqueSystemNames.map(systemName => (
            <option key={systemName} value={systemName}>{systemName}</option>
          ))}
        </select>
      </div>

      {/* Section for currently "On" devices */}
      <div className="currently-on-section">
        <h3>Currently On Devices</h3>
        <ul>
          {currentlyOnDevices.length > 0 ? (
            currentlyOnDevices.map((device, index) => (
              <li key={index}>{device}</li>
            ))
          ) : (
            <li>No devices currently on</li>
          )}
        </ul>
      </div>

      {selectedSystem ? (
        <div className="graph-container">
          <h3>{selectedSystem}</h3>
          <Line 
            data={generateGraphData(selectedSystem)} 
            options={{
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Time',
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Status',
                  },
                  ticks: {
                    stepSize: 1,
                    callback: (value) => (value === 1 ? 'On' : 'Off'),
                  },
                  grid: {
                    lineWidth: 0.5, // Adjust grid line thickness
                    color: '#ddd', // Change grid line color
                  },
                  border: {
                    width: 1, // Adjust border line thickness
                    color: '#000', // Change border color
                  },
                },
              },
            }} 
            width={600} // Set chart width
            height={300} // Set chart height
          />
        </div>
      ) : (
        <p>Please select a system to view its availability graph.</p>
      )}

      <div className="table-container">
        <h3>Ping Data Table</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Time</th>
              <th>System Name</th>
            </tr>
          </thead>
          <tbody>
            {pingData.length > 0 ? (
              pingData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.message.type}</td>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.message.systemName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AvailabilityReport;