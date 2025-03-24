import sensorService from '../services/sensorService.js';

// Function for getting devices list in controller
const getDevices = async (req, res) => {
    try {
        // Get devices list
        const devices = await sensorService.getDevices();
        // Return devices
        res.json(devices);
    } catch (error) {
        // If error, return error
        console.error('Error fetching devices:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function for getting realtime data in controller
const getRealtimeData = async (req, res) => {
    // Get device from params in request url
    const { device } = req.params;
    try {
        // Get realtime data
        const data = await sensorService.getRealtimeData(device);
        // Return realtime data
        res.json(data);
    } catch (error) {
        // If error, return error
        console.error('Error querying data:', error)
        res.status(403).json({ message: error.message });
    }
};

// Function for getting history data in controller
const getHistoryData = async (req, res) => {
    // Get device from params in request url
    const { device } = req.params;
    try {
        // Get history data
        const data = await sensorService.getHistoryData(device);
        // Return history data
        res.json(data);
    } catch (error) {
        // If error, return error
        console.error('Error querying history:', error);
        res.status(403).json({ message: error.message });
    }
};

export default {
    getDevices,
    getRealtimeData,
    getHistoryData,
};
