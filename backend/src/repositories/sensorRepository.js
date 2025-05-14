import { Sequelize } from 'sequelize';
import SensorData from '../models/sensorData.js';

// Function for finding unique devices from database
const findUniqueDevices = async () => {
  return await SensorData.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('device')), 'device']],
  });
};

// Function for finding latest data by device from database
const findLatestDataByDevice = async (device) => {
  return await SensorData.findOne({
    where: { device: { [Sequelize.Op.iLike]: device } },
    order: Sequelize.literal('random()'),
  });
};

// Function for finding history by device from database
const findHistoryByDevice = async (device) => {
  return await SensorData.findAll({
    where: { device: { [Sequelize.Op.iLike]: device } },
    order: [['ts', 'DESC']],
    limit: 100,
  });
};

export default {
  findUniqueDevices,
  findLatestDataByDevice,
  findHistoryByDevice,
};
