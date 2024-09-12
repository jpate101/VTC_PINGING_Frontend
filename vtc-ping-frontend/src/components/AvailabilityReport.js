import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AvailabilityGraph from './AvailabilityGraph'; 

const AvailabilityReport = () => {
  const [systemNames, setSystemNames] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('');

  useEffect(() => {
    const fetchSystemNames = async () => {
      try {
        const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
        const jsonData = await response.json();

        console.log(jsonData);
        
        // Extract unique system names from the data
        const systems = [...new Set(jsonData.map(entry => entry.message.systemName))];
        setSystemNames(systems);
        if (systems.length > 0) setSelectedSystem(systems[0]); // Set the default system
      } catch (error) {
        console.error('Error fetching system names:', error);
      }
    };

    fetchSystemNames();
  }, []);

  return (
    <div>
      <h1>Availability Report</h1>
      <p>This page provides availability information for different systems.</p>
      <Link to="/">Go back to Home Page</Link>
    </div>
  );
};

export default AvailabilityReport;