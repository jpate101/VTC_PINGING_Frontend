import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/disk-health-report">Disk Health Report</Link></li>
          <li><Link to="AvailabilityReport">Availability Report</Link></li>
          <li><Link to="/TeltonikaAvailabilityReport">Teltonika Availability Report</Link></li>
          <li><Link to="/CameraReport">Camera Report</Link></li>
          <li><Link to="/GpsReport">GPS Report</Link></li>
          <li><Link to="/SignalReport">Signal Report</Link></li>
          <li><Link to="/CpuUsageReport">CPU Usage Report</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;