// src/components/Dashboard.js
import './Dashboard.css'; // Import the CSS file
import React, { useEffect, useState } from 'react';

const Dashboard = () => {
    const [machines, setMachines] = useState([]);
    const [countryCodeFilter, setCountryCodeFilter] = useState('');
    const [siteFilter, setSiteFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [cameraData, setCameraData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch machine data
        const fetchMachines = async () => {
            try {
                const response = await fetch('/REA/Machine.json');
                const data = await response.json();
                setMachines(Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                })));
            } catch (error) {
                console.error('Error fetching machine data:', error);
            }
        };

        // Fetch camera data
        const fetchCameraData = async () => {
            try {
                const response = await fetch('https://vtc-ping-testing.onrender.com/logs');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                const filteredData = jsonData.filter(entry => entry.message.type === 'Ping');
                const cameraAvailability = {};

                filteredData.forEach(entry => {
                    const { systemName, CameraAvailability, timestamp } = entry.message;
                    if (!cameraAvailability[systemName]) {
                        cameraAvailability[systemName] = [];
                    }
                    cameraAvailability[systemName].push({ timestamp: new Date(timestamp), ...CameraAvailability });
                });

                setCameraData(cameraAvailability);
            } catch (error) {
                setError(error.message);
                console.error('Error fetching camera data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMachines();
        fetchCameraData();
    }, []);

    // Get unique options for dropdowns
    const countryCodes = [...new Set(machines.map(machine => machine.countryCode))];
    const sites = [...new Set(machines.map(machine => machine.site))];

    // Filtered machines based on selected options
    const filteredMachines = machines.filter(machine => {
        return (
            (countryCodeFilter === '' || machine.countryCode === countryCodeFilter) &&
            (siteFilter === '' || machine.site === siteFilter) &&
            (activeFilter === '' || (activeFilter === 'Yes' ? machine.active : !machine.active))
        );
    });

    // Prepare table data with latest timestamp and "Up to Date" status
    const tableData = filteredMachines.map(machine => {
        const latestEntries = cameraData[machine.id] || [];
        const latestEntry = latestEntries.reduce((latest, entry) => {
            return new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest;
        }, { timestamp: new Date(0) });

        const isUpToDate = new Date() - new Date(latestEntry.timestamp) <= 3 * 60 * 1000; // 3 minutes

        return {
            id: machine.id,
            latestTimestamp: latestEntry.timestamp.toLocaleString(),
            isUpToDate: isUpToDate ? 'Yes' : 'No',
        };
    });

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Dashboard</h1>
            <div>
                <select
                    value={countryCodeFilter}
                    onChange={(e) => setCountryCodeFilter(e.target.value)}
                >
                    <option value="">Select Country Code</option>
                    {countryCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>

                <select
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                >
                    <option value="">Select Site</option>
                    {sites.map(site => (
                        <option key={site} value={site}>{site}</option>
                    ))}
                </select>

                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                >
                    <option value="">Select Active Status</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>

            {tableData.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Machine</th>
                            <th>Latest Data</th>
                            <th>Current VTC Connection</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map(machine => (
                            <tr key={machine.id}>
                                <td>{machine.id}</td>
                                <td>{machine.latestTimestamp}</td>
                                <td style={{ backgroundColor: machine.isUpToDate === 'Yes' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.isUpToDate}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No data available for the selected filters.</p>
            )}
        </div>
    );
};

export default Dashboard;