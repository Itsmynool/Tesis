import { DataTypes } from 'sequelize';
import { sequelize } from '../databases/postgresqlDatabase.js';

const SensorData = sequelize.define('SensorData', {
  ts: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  device: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  co: {
    type: DataTypes.FLOAT,
  },
  humidity: {
    type: DataTypes.FLOAT,
  },
  light: {
    type: DataTypes.FLOAT,
  },
  lpg: {
    type: DataTypes.FLOAT,
  },
  motion: {
    type: DataTypes.BOOLEAN,
  },
  smoke: {
    type: DataTypes.BOOLEAN,
  },
  temp: {
    type: DataTypes.FLOAT,
  },
}, {
  tableName: 'sensor_data',
  timestamps: false,     
  primaryKey: false,      
  freezeTableName: true, 
});

export default SensorData;