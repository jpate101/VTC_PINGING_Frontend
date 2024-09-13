import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CameraReport.css'; // Import the CSS file for styling

const CameraReport = () => {
  const [cameraData, setCameraData] = useState([]);
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
        if (!cameraAvailability[systemName] || new Date(timestamp) > new Date(cameraAvailability[systemName].timestamp)) {
          cameraAvailability[systemName] = {
            ...CameraAvailability,
            timestamp: timestamp
          };
        }
      });

      setCameraData(Object.entries(cameraAvailability));
      setSelectedSystem(Object.keys(cameraAvailability)[0]); // Set default selected system
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

  // Determine unique camera IPs for table headers
  const cameraIPs = [...new Set(cameraData.flatMap(([_, cameras]) => Object.keys(cameras).filter(ip => ip !== 'timestamp')))];

  // Function to determine cell background color based on status
  const getStatusColor = (status) => {
    return status === 'Online' ? 'green' : 'red';
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container">
      <h1 className="header">Camera Availability Report</h1>
      <p>This page shows the current status of cameras for each system.</p>
      <Link to="/" className="link">Go back to Home Page</Link>

      {isLoading && <p className="loading">Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!isLoading && !error && (
        <>


          <table className="table">
            <thead>
              <tr>
                <th className="th">System Name</th>
                <th className="th">Timestamp</th>
                {cameraIPs.map((ip, index) => (
                  <th key={index} className="th">{ip}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cameraData.map(([systemName, cameras]) => (
                <tr key={systemName}>
                  <td className="td">{systemName}</td>
                  <td className="td">{cameras.timestamp}</td>
                  {cameraIPs.map((ip, ipIndex) => (
                    <td
                      key={ipIndex}
                      className="td"
                      style={{ backgroundColor: getStatusColor(cameras[ip] || 'Offline') }}
                    >
                      {cameras[ip] || 'Offline'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default CameraReport;