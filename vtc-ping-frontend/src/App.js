import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import DiskHealthReport from './components/DiskHealthReport';
import AvailabilityReport from './components/AvailabilityReport';
import TeltonikaAvailabilityReport from './components/TeltonikaAvailabilityReport';
import CameraReport from './components/CameraReport';
import GpsReport from './components/GpsReport';
import SignalReport from './components/SignalReport';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CpuUsageReport from './components/CpuUsageReport';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/disk-health-report" element={<DiskHealthReport />} />
          <Route path="/AvailabilityReport" element={<AvailabilityReport />} />
          <Route path="/TeltonikaAvailabilityReport" element={<TeltonikaAvailabilityReport />} />
          <Route path="/CameraReport" element={<CameraReport/>} />
          <Route path='/GpsReport' element={<GpsReport/>}/>
          <Route path='/SignalReport' element={<SignalReport/>} />
          <Route path='/Dashboard' element={<Dashboard/>} />
          <Route path='/CpuUsageReport' element={<CpuUsageReport/>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
