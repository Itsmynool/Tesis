import { Sequelize } from 'sequelize';
import express from 'express';
import SensorData from '../models/SensorData.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los dispositivos disponibles (únicos en sensor_data)
router.get('/devices', auth, async (req, res) => {
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
router.get('/realtime/:device', auth, async (req, res) => {
  const { device } = req.params;
  const user = await User.findById(req.user.id);

  console.log('Requested device:', device);
  console.log('User devices:', user.devices);

  if (!user.devices.includes(device)) {
    console.log('Access denied for device:', device);
    return res.status(403).json({ message: 'Access denied to this device' });
  }

  try {
    const data = await SensorData.findOne({
      where: { device: { [Sequelize.Op.iLike]: device } },
      order: [['ts', 'DESC']],
    });
    console.log('SQL Query Result:', data);

    res.json(data || {});
  } catch (error) {
    console.error('Error querying data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Obtener historial de datos para un dispositivo
router.get('/history/:device', auth, async (req, res) => {
  const { device } = req.params;
  const user = await User.findById(req.user.id);

  if (!user.devices.includes(device)) {
    return res.status(403).json({ message: 'Access denied to this device' });
  }

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