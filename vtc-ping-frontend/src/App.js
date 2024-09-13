import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import DiskHealthReport from './components/DiskHealthReport';
import AvailabilityReport from './components/AvailabilityReport';
import TeltonikaAvailabilityReport from './components/TeltonikaAvailabilityReport';
import CameraReport from './components/CameraReport';
import Header from './components/Header';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/disk-health-report" element={<DiskHealthReport />} />
          <Route path="/AvailabilityReport" element={<AvailabilityReport />} />
          <Route path="/TeltonikaAvailabilityReport" element={<TeltonikaAvailabilityReport />} />
          <Route path="/CameraReport" element={<CameraReport/>} />
          

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
