import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import DiskHealthReport from './components/DiskHealthReport';
import AvailabilityReport from './components/AvailabilityReport';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/disk-health-report" element={<DiskHealthReport />} />
          <Route path="/AvailabilityReport" element={<AvailabilityReport />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
