// src/components/DiskHealthReport.js
import React from 'react';
import { Link } from 'react-router-dom';

const DiskHealthReport = () => {
  return (
    <div>
      <h1>Disk Health Report</h1>
      <p>This page provides disk health information.</p>
      <Link to="/">Go back to Home Page</Link>
    </div>
  );
};

export default DiskHealthReport;