import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DiskHealthReport.css'; // Import the CSS file

const DiskHealthReport = () => {
  const [pingData, setPingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const fetchPingData = async () => {
    try {
      const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();

      // Filter Ping type entries
      const filteredData = jsonData.filter(entry => entry.message.type === 'Ping');

      // Group by systemName and get the latest entry for each system
      const latestEntries = {};
      filteredData.forEach(entry => {
        const { systemName, timestamp, diskUsage } = entry.message;
        if (!latestEntries[systemName] || new Date(timestamp) > new Date(latestEntries[systemName].timestamp)) {
          latestEntries[systemName] = {
            ...entry.message,
            timestamp: timestamp,
            diskUsage: diskUsage
          };
        }
      });

      setPingData(Object.values(latestEntries));
    } catch (error) {
      setError(error.message);
      console.error('Error fetching ping data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPingData();
  }, []);

  const formatGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);

  const getSortedData = () => {
    const sortedData = [...pingData];
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortedData;
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      const direction = prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const getDriveColumns = () => {
    const drives = new Set();
    pingData.forEach(entry => {
      Object.keys(entry.diskUsage || {}).forEach(drive => drives.add(drive));
    });
    return Array.from(drives);
  };

  const driveColumns = getDriveColumns();
  const sortedData = getSortedData();

  // Function to determine if a row should have a red or green background based on C: drive
  const getRowClass = (diskUsage) => {
    if (diskUsage && diskUsage['C:\\']) {
      const { free, total } = diskUsage['C:\\'];
      const usedPercentage = ((total - free) / total) * 100;
      return usedPercentage > 80 ? 'high-usage-row' : 'normal-usage-row';
    }
    return 'normal-usage-row';
  };

  // Get a list of systems with C: drive usage above 80%
  const highUsageSystems = sortedData.filter(entry => {
    if (entry.diskUsage && entry.diskUsage['C:\\']) {
      const { free, total } = entry.diskUsage['C:\\'];
      const usedPercentage = ((total - free) / total) * 100;
      return usedPercentage > 80;
    }
    return false;
  }).map(entry => entry.systemName);

  return (
    <div className="container">
      <h1 className="header">Disk Health Report</h1>
      <p>This page provides disk health information.</p>
      <Link to="/" className="link">Go back to Home Page</Link>
      {isLoading && <p className="loading">Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      
      {!isLoading && !error && (
        <>
          {/* List of systems with high disk usage */}
          {highUsageSystems.length > 0 && (
            <div className="high-usage-list">
              <h2>Systems with High C: Drive Usage</h2>
              <ul>
                {highUsageSystems.map((systemName, index) => (
                  <li key={index}>{systemName}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disk health table */}
          <table className="table">
            <thead>
              <tr>
                <th className="th" onClick={() => handleSort('systemName')}>System Name</th>
                <th className="th" onClick={() => handleSort('timestamp')}>Timestamp</th>
                {driveColumns.map(drive => (
                  <th key={drive} className="th">{drive}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((entry, index) => (
                <tr
                  key={index}
                  className={getRowClass(entry.diskUsage)}
                >
                  <td className="td">{entry.systemName || 'Unknown'}</td>
                  <td className="td">{new Date(entry.timestamp).toLocaleString()}</td>
                  {driveColumns.map(drive => (
                    <td key={drive} className="td">
                      {entry.diskUsage[drive]
                        ? `${formatGB(entry.diskUsage[drive].total - entry.diskUsage[drive].free)} GB used of ${formatGB(entry.diskUsage[drive].total)} GB total`
                        : 'N/A'}
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

export default DiskHealthReport;