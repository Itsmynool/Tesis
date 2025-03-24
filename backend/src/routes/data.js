import { Sequelize } from 'sequelize';
import express from 'express';
import SensorData from '../models/SensorData.js'; 

const router = express.Router();

// Obtener todos los dispositivos disponibles (únicos en sensor_data)
router.get('/devices', async (req, res) => {
  try {
    // Obtener dispositivos únicos de la tabla sensor_data
    const devices = await SensorData.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('device')), 'device']],
    });

    // Mapear los dispositivos a un arreglo de strings
    const deviceList = devices.map(device => device.device);

    res.json(deviceList);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Obtener datos en tiempo real para un dispositivo
router.get('/realtime/:device', async (req, res) => {
  const { device } = req.params;

  try {
    const data = await SensorData.findOne({
      where: { device: { [Sequelize.Op.iLike]: device } },
      order: Sequelize.literal('random()'),
    });
    console.log('SQL Query Result:', data);

    // Obtener la hora actual en Colombia (UTC-5, zona America/Bogota)
    const colombiaTime = new Date().toLocaleString('en-US', {
      timeZone: 'America/Bogota',
      hour12: false,
    });
    const currentTs = new Date(colombiaTime).toISOString(); // Convertir a formato ISO

    // Sobrescribir ts con la hora actual en Colombia
    const responseData = data ? { ...data.toJSON(), ts: currentTs } : { ts: currentTs };

    res.json(responseData);
  } catch (error) {
    console.error('Error querying data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Obtener historial de datos para un dispositivo
router.get('/history/:device', async (req, res) => {
  const { device } = req.params;

  try {
    const data = await SensorData.findAll({
      where: { device: { [Sequelize.Op.iLike]: device } },
      order: [['ts', 'DESC']],
      limit: 100,
    });

    res.json(data);
  } catch (error) {
    console.error('Error querying history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;