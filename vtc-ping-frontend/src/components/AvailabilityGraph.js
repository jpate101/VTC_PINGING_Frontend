import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2'; // Importing a chart component
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

// Register the required components for Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const AvailabilityGraph = ({ systemName }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
        const jsonData = await response.json();
        const filteredData = jsonData.filter(entry => entry.message.systemName === systemName && entry.message.type === 'Ping');

        // Process the data
        const timestamps = filteredData.map(entry => new Date(entry.timestamp));
        const availability = filteredData.map((_, index) => {
          return index === 0 ? 0 : (timestamps[index] - timestamps[index - 1]) / 1000; // in seconds
        });

        setChartData({
          labels: timestamps.map(date => date.toLocaleTimeString()),
          datasets: [{
            label: `${systemName} Availability (seconds)`,
            data: availability,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false
          }]
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [systemName]);

  return (
    <div>
      <h2>Availability for {systemName}</h2>
      <Line data={chartData} />
    </div>
  );
};

export default AvailabilityGraph;