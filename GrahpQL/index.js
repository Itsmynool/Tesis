const { ApolloServer, gql } = require('apollo-server');
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'IoT',
  password: '12345',
  port: 5432,
});

// Esquema GraphQL
const typeDefs = gql`
  type IoTDevice {
    time: String
    device_type: String
    energy_consumption_kWh: Float
    temperature_C: Float
    status: String
    humidity_relative: Float
    noise_dB: Float
    opens_per_hour: Int
    alert_temperature: String
    intensity_lumens: Int
    light_color: String
    daily_energy_kWh: Float
  }

  type DailyAverage {
    device_type: String
    day: String
    avg_temperature: Float
    avg_humidity: Float
  }

  type MonthlyAverage {
    device_type: String
    month: String
    avg_temperature: Float
    avg_humidity: Float
  }

  type Query {
    devices: [IoTDevice]
    dailyAverages(day: String!, device_type: String): [DailyAverage]
    monthlyAverages(year: Int!, device_type: String!): [MonthlyAverage]
    availableYears(device_type: String!): [Int]
  }
`;

const resolvers = {
  Query: {
    dailyAverages: async (_, { day, device_type }) => {
      const query = `
        SELECT 
          device_type, 
          time_bucket('1 day', time) AS day, 
          AVG(temperature_C) AS avg_temperature, 
          AVG(humidity_relative) AS avg_humidity
        FROM iot_devices
        WHERE time_bucket('1 day', time) = $1
        ${device_type ? `AND device_type = $2` : ""}
        GROUP BY device_type, day
        ORDER BY day;
      `;
      const values = device_type ? [day, device_type] : [day];
      const result = await pool.query(query, values);
      return result.rows.map(row => ({
        device_type: row.device_type,
        day: row.day.toISOString(),
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
      }));
    },

    monthlyAverages: async (_, { year, device_type }) => {
      const query = `
        SELECT 
          device_type, 
          trim(to_char(time, 'TMMonth')) AS month,
          AVG(temperature_C) AS avg_temperature, 
          AVG(humidity_relative) AS avg_humidity
        FROM iot_devices
        WHERE EXTRACT(YEAR FROM time) = $1
          AND device_type = $2
        GROUP BY device_type, month
        ORDER BY MIN(time);
      `;
      const values = [year, device_type];
      const result = await pool.query(query, values);
      return result.rows.map(row => ({
        device_type: row.device_type,
        month: row.month,
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
      }));
    },

    availableYears: async (_, { device_type }) => {
      const query = `
        SELECT DISTINCT EXTRACT(YEAR FROM time) AS year
        FROM iot_devices
        WHERE device_type = $1
        ORDER BY year;
      `;
      const values = [device_type];
      const result = await pool.query(query, values);
      return result.rows.map(row => row.year);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Servidor GraphQL corriendo en ${url}`);
});
