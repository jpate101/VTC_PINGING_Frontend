import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';  // Import Leaflet library
import 'leaflet/dist/leaflet.css';

// Path to your custom marker image
const markerIcon = new L.Icon({
iconUrl: '/images/location-dot-solid.svg',
  iconSize: [32, 32],  // Size of the icon (width, height)
  iconAnchor: [16, 32],  // Anchor point of the icon (x, y)
  popupAnchor: [0, -32],  // Popup anchor point (x, y)
});

const GpsReport = () => {
  const [pingData, setPingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [systemNames, setSystemNames] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [timestampRange, setTimestampRange] = useState([new Date().getTime() - 24 * 60 * 60 * 1000, new Date().getTime()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const jsonData = await response.json();

        const pingEntries = jsonData
          .filter(entry => entry.message.type === 'Ping')
          .map(entry => ({
            latitude: entry.message.latitude,
            longitude: entry.message.longitude,
            systemName: entry.message.systemName || 'Unknown',
            timestamp: new Date(entry.timestamp).getTime()
          }));

        setPingData(pingEntries);
        setSystemNames([...new Set(pingEntries.map(entry => entry.systemName))]);
      } catch (error) {
        console.error('Error fetching Ping data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = pingData.filter(entry =>
      (selectedSystem ? entry.systemName === selectedSystem : true) &&
      entry.timestamp >= timestampRange[0] &&
      entry.timestamp <= timestampRange[1]
    );
    setFilteredData(filtered);
  }, [pingData, selectedSystem, timestampRange]);

  const isValidLatLng = (lat, lng) => {
    return lat !== 'Unknown' && lng !== 'Unknown' && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  return (
    <div className="container">
      <h1 className="header">GPS Report</h1>

      <div>
        <label htmlFor="systemFilter">Filter by System Name:</label>
        <select
          id="systemFilter"
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
        >
          <option value="">All Systems</option>
          {systemNames.map((name, index) => (
            <option key={index} value={name}>{name}</option>
          ))}
        </select>

        <label htmlFor="timestampRange">Select Time Range:</label>
        <input
          type="date"
          onChange={(e) => setTimestampRange([new Date(e.target.value).getTime(), timestampRange[1]])}
        />
        <input
          type="date"
          onChange={(e) => setTimestampRange([timestampRange[0], new Date(e.target.value).getTime()])}
        />
      </div>

      <MapContainer center={[0, 0]} zoom={2} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredData.map((entry, index) => {
          const { latitude, longitude, systemName, timestamp } = entry;
          if (isValidLatLng(latitude, longitude)) {
            return (
              <Marker
                key={index}
                position={[parseFloat(latitude), parseFloat(longitude)]}
                icon={markerIcon}  // Use the custom marker icon
              >
                <Popup>
                  <div>
                    <strong>System Name:</strong> {systemName}<br />
                    <strong>Timestamp:</strong> {new Date(timestamp).toLocaleString()}
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            return null; // Skip markers with invalid lat/lng
          }
        })}
      </MapContainer>
    </div>
  );
};

export default GpsReport;