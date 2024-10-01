import './Dashboard.css';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [machines, setMachines] = useState([]);
    const [countryCodeFilter, setCountryCodeFilter] = useState('');
    const [siteFilter, setSiteFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [cameraData, setCameraData] = useState({});
    const [gpsData, setGpsData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [machinesResponse, cameraResponse] = await Promise.all([
                    fetch('/REA/Machine.json').then(res => res.json()),
                    fetch('https://vtc-ping-testing.onrender.com/logs').then(res => res.json())
                ]);

                const machinesData = Object.entries(machinesResponse).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setMachines(machinesData);

                const cameraAvailability = {};
                cameraResponse
                    .filter(entry => entry.message.type === 'Ping')
                    .forEach(entry => {
                        const { systemName, CameraAvailability, timestamp, LatestLogEvent } = entry.message;
                        if (!cameraAvailability[systemName]) {
                            cameraAvailability[systemName] = [];
                        }
                        cameraAvailability[systemName].push({
                            timestamp: new Date(timestamp),
                            CameraAvailability,
                            latestLogEventId: LatestLogEvent.Id,
                            latestLogEventTime: LatestLogEvent.time
                        });
                    });
                setCameraData(cameraAvailability);

                const gpsResponse = await axios.get('https://vtc-ping-testing.onrender.com/logs');
                const gpsMap = gpsResponse.data.reduce((acc, entry) => {
                    const imei = entry.message.imei;
                    const timestamp = new Date(entry.timestamp);
                    if (!acc[imei] || timestamp > new Date(acc[imei].latestTimestamp)) {
                        acc[imei] = {
                            latestTimestamp: entry.timestamp,
                            isOnline: (new Date() - timestamp <= 3 * 60 * 1000) &&
                                       entry.message.latitude !== "unknown" &&
                                       entry.message.longitude !== "unknown" &&
                                       entry.message.latitude !== 0 &&
                                       entry.message.longitude !== 0,
                        };
                    }
                    return acc;
                }, {});
                setGpsData(gpsMap);
            } catch (error) {
                setError(error.message);
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const countryCodes = [...new Set(machines.map(machine => machine.countryCode))];
    const sites = [...new Set(machines.map(machine => machine.site))];

    const filteredMachines = useMemo(() => {
        return machines.filter(machine => {
            return (
                (countryCodeFilter === '' || machine.countryCode === countryCodeFilter) &&
                (siteFilter === '' || machine.site === siteFilter) &&
                (activeFilter === '' || (activeFilter === 'Yes' ? machine.active : !machine.active))
            );
        });
    }, [machines, countryCodeFilter, siteFilter, activeFilter]);

    const activeWithoutConnections = machines.filter(machine => {
        const imei = machine.TeltonikaIMEI;
        const gpsDataEntry = gpsData[imei];
        const isVTCOnline = gpsDataEntry ? gpsDataEntry.isOnline : false;
        return machine.active && !isVTCOnline;
    });

    const tableData = filteredMachines.map(machine => {
        const latestEntries = cameraData[machine.id] || [];
        const latestEntry = latestEntries.reduce((latest, entry) => {
            return new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest;
        }, { timestamp: new Date(0), CameraAvailability: {} });

        const isUpToDate = new Date() - new Date(latestEntry.timestamp) <= 3 * 60 * 1000;
        const imei = machine.TeltonikaIMEI;
        const gpsDataEntry = gpsData[imei];
        const gpsStatus = gpsDataEntry ? (gpsDataEntry.isOnline ? 'Online' : 'Offline') : 'N/A';

        const latestLogEventId = latestEntries.length > 0 ? latestEntries[latestEntries.length - 1].latestLogEventId : 'N/A';
        const latestLogEventTime = latestEntries.length > 0 ? latestEntries[latestEntries.length - 1].latestLogEventTime : 'N/A';

        // Determine camera statuses
        const camera101Status = latestEntry.CameraAvailability['http://192.168.1.101/'] || 'N/A';
        const camera103Status = latestEntry.CameraAvailability['http://192.168.1.103/'] || 'N/A';
        const camera105Status = latestEntry.CameraAvailability['http://192.168.1.105/'] || 'N/A';
        const camera107Status = latestEntry.CameraAvailability['http://192.168.1.107/'] || 'N/A';

        return {
            id: machine.id,
            latestTimestamp: latestEntry.timestamp.toLocaleString(),
            isUpToDate: isUpToDate ? 'Yes' : 'No',
            gpsStatus,
            latestLogEventId,
            latestLogEventTime,
            camera101Status,
            camera103Status,
            camera105Status,
            camera107Status,
        };
    });

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Dashboard</h1>
            <p>test</p>
            <div>
                <select value={countryCodeFilter} onChange={(e) => setCountryCodeFilter(e.target.value)}>
                    <option value="">Select Country Code</option>
                    {countryCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>

                <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
                    <option value="">Select Site</option>
                    {sites.map(site => (
                        <option key={site} value={site}>{site}</option>
                    ))}
                </select>

                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                    <option value="">Select Active Status</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </div>

            {activeWithoutConnections.length > 0 && (
                <div>
                    <h2>Active Machines Without VTC or Teltonika Connections</h2>
                    <ul>
                        {activeWithoutConnections.map(machine => (
                            <li key={machine.id}>{machine.id}</li>
                        ))}
                    </ul>
                </div>
            )}

            {tableData.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Machine</th>
                            <th>Latest Data</th>
                            <th>Current VTC Connection</th>
                            <th>Teltonika Status</th>
                            <th>Latest Log Event ID</th>
                            <th>Latest Log Event Time</th>
                            <th>Camera 101 Status</th>
                            <th>Camera 103 Status</th>
                            <th>Camera 105 Status</th>
                            <th>Camera 107 Status</th>
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
                                <td style={{ backgroundColor: machine.gpsStatus === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.gpsStatus}
                                </td>
                                <td>{machine.latestLogEventId}</td>
                                <td>{machine.latestLogEventTime !== 'N/A' ? machine.latestLogEventTime : 'N/A'}</td>
                                <td style={{ backgroundColor: machine.camera101Status === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.camera101Status}
                                </td>
                                <td style={{ backgroundColor: machine.camera103Status === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.camera103Status}
                                </td>
                                <td style={{ backgroundColor: machine.camera105Status === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.camera105Status}
                                </td>
                                <td style={{ backgroundColor: machine.camera107Status === 'Online' ? 'lightgreen' : 'lightcoral' }}>
                                    {machine.camera107Status}
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