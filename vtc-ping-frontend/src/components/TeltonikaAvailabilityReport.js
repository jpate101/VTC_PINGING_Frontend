import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2'; // Import Chart.js
import Chart from 'chart.js/auto'; // Import Chart.js auto
import './TeltonikaAvailabilityReport.css'; // Import the CSS file

// Helper function to generate random colors
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r},${g},${b},${alpha})`;
};

const TeltonikaAvailabilityReport = () => {
  const [gpsData, setGpsData] = useState([]);
  const [imeiData, setImeiData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('https://vtc-ping-testing.onrender.com/logs')
      .then(response => {
        const data = response.data;
        const gpsEntries = data.filter(entry => entry.message.type === 'GPS');
        
        const imeiMap = gpsEntries.reduce((acc, entry) => {
          const imei = entry.message.imei;
          if (!acc[imei] || new Date(entry.timestamp) > new Date(acc[imei].timestamp)) {
            acc[imei] = {
              timestamp: entry.timestamp,
              latitude: entry.message.latitude,
              longitude: entry.message.longitude,
            };
          }
          return acc;
        }, {});

        setGpsData(gpsEntries);
        setImeiData(imeiMap);
      })
      .catch(error => {
        setError(error);
        console.error('Error fetching data:', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Check if the device is online based on timestamp and coordinates
  const isOnline = (timestamp, latitude, longitude) => {
    const now = new Date();
    const entryTime = new Date(timestamp);
    const isRecent = (now - entryTime) <= 3 * 60 * 1000; // 3 minutes

    // Consider the device offline if latitude or longitude is unknown or 0
    const isValidLocation = latitude !== "unknown" && latitude !== 0 && longitude !== "unknown" && longitude !== 0;

    return isRecent && isValidLocation;
  };

  const generateGraphData = (imei) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours ago

    const labels = [];
    const data = [];

    const increment = 3 * 60 * 1000; // 3 minutes in milliseconds

    for (let currentTime = startTime; currentTime <= now; currentTime = new Date(currentTime.getTime() + increment)) {
      labels.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const isOn = gpsData.some(entry => {
        const entryTime = new Date(entry.timestamp);
        return entry.message.imei === imei &&
               entryTime >= currentTime &&
               entryTime < new Date(currentTime.getTime() + increment) &&
               entry.message.latitude !== "unknown" && entry.message.latitude !== 0 &&
               entry.message.longitude !== "unknown" && entry.message.longitude !== 0;
      });

      data.push(isOn ? 1 : 0);
    }

    return {
      labels,
      datasets: [{
        label: `IMEI ${imei} Status`,
        data,
        borderColor: getRandomColor(), // Random color for each IMEI
        backgroundColor: getRandomColor(0.2), // Semi-transparent color
        fill: true,
      }],
    };
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Teltonika Availability Report</h2>

      <div className="table-container">
        <h3>IMEI Status Table</h3>
        <table>
          <thead>
            <tr>
              <th>IMEI</th>
              <th>Most Recent Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(imeiData).map(imei => (
              <tr key={imei}>
                <td>{imei}</td>
                <td>{imeiData[imei].timestamp}</td>
                <td style={{
                  backgroundColor: isOnline(imeiData[imei].timestamp, imeiData[imei].latitude, imeiData[imei].longitude) ? 'lightgreen' : 'lightcoral',
                  color: isOnline(imeiData[imei].timestamp, imeiData[imei].latitude, imeiData[imei].longitude) ? 'black' : 'white'
                }}>
                  {isOnline(imeiData[imei].timestamp, imeiData[imei].latitude, imeiData[imei].longitude) ? 'Online' : 'Offline'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="graphs-container">
        <h3>Device Online/Offline Status</h3>
        {Object.keys(imeiData).map(imei => (
          <div key={imei} className="graph-container">
            <h4>IMEI {imei}</h4>
            <Line
              data={generateGraphData(imei)}
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
                      text: 'Status',
                    },
                    ticks: {
                      stepSize: 1,
                      callback: (value) => (value === 1 ? 'Online' : 'Offline'),
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
        ))}
      </div>
    </div>
  );
};

export default TeltonikaAvailabilityReport;