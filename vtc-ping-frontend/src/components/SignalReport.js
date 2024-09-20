// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const SignalReport = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page.</p>
      
      <div><Link to="/disk-health-report">Go to Disk Health Report</Link></div>

      <div><Link to="/AvailabilityReport">Go to Availability Report</Link></div>

      <div><Link to="/TeltonikaAvailabilityReport">Go to TeltonikaAvailability Report</Link></div>
      <div><Link to="/CameraReport">Go to Camera Report</Link></div>
    </div>
  );
};

export default SignalReport;