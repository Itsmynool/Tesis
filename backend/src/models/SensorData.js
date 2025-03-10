import { DataTypes } from 'sequelize';
import { sequelize } from '../config/pgdb.js';

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
  tableName: 'sensor_data', // Nombre exacto de la tabla
  timestamps: false,       // No agregar createdAt/updatedAt
  // Deshabilitar la clave primaria automática
  primaryKey: false,       // Indicar que no hay clave primaria
  // Evitar que Sequelize intente agregar una columna 'id' automáticamente
  freezeTableName: true,   // Evitar que Sequelize modifique el nombre de la tabla
});

export default SensorData;