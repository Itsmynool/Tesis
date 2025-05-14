import sensorRepository from '../repositories/sensorRepository.js';

// Function for getting devices list in service
const getDevices = async () => {
    // Get unique devices
    const devices = await sensorRepository.findUniqueDevices();
    // Return unique devices
    return devices.map(device => device.device);
};

// Function for getting realtime data in service
const getRealtimeData = async (device) => {
    // Get realtime data by device
    const dataDevice = await sensorRepository.findLatestDataByDevice(device);
    // Read current timestamp in Colombia
    const colombiaTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Bogota',
        hour12: false,
    });
    // Format current timestamp
    const currentTs = new Date(colombiaTime).toISOString();
    // Return realtime data
    return dataDevice ? { ...dataDevice.toJSON(), ts: currentTs } : { ts: currentTs };
};

// Function for getting history data in service
const getHistoryData = async (device) => {
    // Get history data by device
    const dataDevice = await sensorRepository.findHistoryByDevice(device);
    // Return history data
    return dataDevice;
};

export default {
    getDevices,
    getRealtimeData,
    getHistoryData,
};
