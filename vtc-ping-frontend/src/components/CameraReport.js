import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './CameraReport.css'; // Import the CSS file for styling

const CameraReport = () => {
  const [cameraData, setCameraData] = useState({});
  const [uniqueSystems, setUniqueSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch camera data
  const fetchCameraData = async () => {
    try {
      const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      const filteredData = jsonData.filter(entry => entry.message.type === 'Ping');
      const cameraAvailability = {};

      filteredData.forEach(entry => {
        const { systemName, CameraAvailability, timestamp } = entry.message;
        if (!cameraAvailability[systemName]) {
          cameraAvailability[systemName] = [];
        }
        cameraAvailability[systemName].push({ timestamp: new Date(timestamp), ...CameraAvailability });
      });

      setCameraData(cameraAvailability);
      setUniqueSystems(Object.keys(cameraAvailability));
      setSelectedSystem(Object.keys(cameraAvailability)[0]); // Default to the first system
    } catch (error) {
      setError(error.message);
      console.error('Error fetching camera data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCameraData();
  }, []);

  // Function to generate graph data for a specific camera
  const generateCameraGraphData = (cameraIP, systemData) => {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 3* 24 * 60 * 60 * 1000);

    const labels = [];
    const statusData = [];
    const interval = 2 * 60 * 1000; // 2 minutes in milliseconds

    for (let currentTime = fourHoursAgo; currentTime <= now; currentTime = new Date(currentTime.getTime() + interval)) {
      labels.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Check if there is at least one "Online" status within the 2-minute interval
      const isOnline = systemData.some(entry => {
        const timestamp = new Date(entry.timestamp);
        return entry[cameraIP] === 'Online' &&
          timestamp <= currentTime &&
          timestamp > new Date(currentTime.getTime() - interval);
      });

      statusData.push(isOnline ? 1 : 0);
    }

    return {
      labels,
      datasets: [{
        label: `${cameraIP} Status`,
        data: statusData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }],
    };
  };

  // Determine unique camera IPs for table headers
  const getCameraIPs = (systemData) => {
    return [...new Set(systemData.flatMap(entry => Object.keys(entry).filter(ip => ip !== 'timestamp')))];
  };

  // Prepare table data with latest timestamp, "Up to Date" status, and latest camera statuses
  const tableData = uniqueSystems.map(systemName => {
    const systemEntries = cameraData[systemName];

    // Get latest timestamp and "Up to Date" status
    const latestEntry = systemEntries.reduce((latest, entry) => {
      return new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest;
    }, { timestamp: new Date(0) });

    const isUpToDate = new Date() - new Date(latestEntry.timestamp) <= 3 * 60 * 1000; // 3 minutes

    // Get latest status for each camera
    const cameraIPs = getCameraIPs(systemEntries);
    const latestStatuses = cameraIPs.reduce((statuses, ip) => {
      const latestStatus = systemEntries.reduce((status, entry) => {
        return entry[ip] || status;
      }, 'Offline');
      statuses[ip] = latestStatus;
      return statuses;
    }, {});

    return {
      systemName,
      timestamp: latestEntry.timestamp.toLocaleString(),
      isUpToDate: isUpToDate ? 'Yes' : 'No',
      ...latestStatuses,
    };
  });

  // Filtered data for the selected system
  const filteredSystemData = selectedSystem ? cameraData[selectedSystem] : [];
  const filteredCameraIPs = getCameraIPs(filteredSystemData);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container">
      <h1 className="header">Camera Availability Report</h1>
      <p>This page shows the availability status of cameras for each system over the last 4 hours with a 2-minute interval.</p>
      <Link to="/" className="link">Go back to Home Page</Link>

      {/* Render the table with latest timestamp, "Up to Date" status, and camera statuses */}
      <div className="table-container">
        <h3>Camera Availability Table</h3>
        {tableData.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th className="th">System Name</th>
                <th className="th">Latest Timestamp</th>
                <th className="th">Up to Date</th>
                {/* Dynamically create header columns for each camera IP */}
                {tableData.length > 0 && Object.keys(tableData[0]).filter(key => key !== 'systemName' && key !== 'timestamp' && key !== 'isUpToDate').map((ip, index) => (
                  <th key={index} className="th">{ip}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td className="td">{row.systemName}</td>
                  <td className="td">{row.timestamp}</td>
                  <td className="td" style={{ backgroundColor: row.isUpToDate === 'Yes' ? 'lightgreen' : 'lightcoral' }}>
                    {row.isUpToDate}
                  </td>
                  {/* Render status for each camera IP */}
                  {Object.keys(row).filter(key => key !== 'systemName' && key !== 'timestamp' && key !== 'isUpToDate').map((ip, ipIndex) => (
                    <td key={ipIndex} className="td" style={{ backgroundColor: row[ip] === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                      {row[ip]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No camera data available</p>
        )}
      </div>

      {/* Dropdown for selecting a system */}
      <div className="dropdown-container">
        <label htmlFor="system-select">Select System:</label>
        <select
          id="system-select"
          value={selectedSystem || ''}
          onChange={(e) => setSelectedSystem(e.target.value)}
        >
          <option value="">--Select a system--</option>
          {uniqueSystems.map(system => (
            <option key={system} value={system}>
              {system}
            </option>
          ))}
        </select>
      </div>

      {/* Render the graph for the selected system */}
      <div className="graph-container">
        {selectedSystem ? (
          filteredCameraIPs.length > 0 ? (
            filteredCameraIPs.map(cameraIP => (
              <div key={cameraIP} className="camera-graph">
                <h4>{cameraIP}</h4>
                <Line 
                  data={generateCameraGraphData(cameraIP, filteredSystemData)}
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
                          callback: (value) => (value === 1 ? 'Online' : 'Offline'),
                        },
                        grid: {
                          lineWidth: 0.5,
                          color: '#ddd',
                        },
                        border: {
                          width: 1,
                          color: '#000',
                        },
                      },
                    },
                  }} 
                  width={600}
                  height={300}
                />
              </div>
            ))
          ) : (
            <p>No data available for the selected system</p>
          )
        ) : (
          <p>Please select a system to view the graph.</p>
        )}
      </div>
    </div>
  );
};

export default CameraReport;