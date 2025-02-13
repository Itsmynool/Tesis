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

  type StatusPercentage {
    ON: Float
    OFF: Float
    NULL: Float
  }

  type AlertTemperaturePercentage {
    ON: Float
    OFF: Float
    NULL: Float
  }

  type DailyAverage {
    device_type: String
    day: String
    avg_temperature: Float
    avg_humidity: Float
    avg_energy_consumption_kWh: Float
    avg_noise_dB: Float
    avg_opens_per_hour: Float
    avg_intensity_lumens: Float
    avg_daily_energy_kWh: Float
    status_percentage: StatusPercentage
    alert_temperature_percentage: AlertTemperaturePercentage
    light_colors: String
  }


  type MonthlyAverage {
    device_type: String
    month: String
    avg_temperature: Float
    avg_humidity: Float
    avg_energy_consumption_kWh: Float
    avg_noise_dB: Float
    avg_opens_per_hour: Float
    avg_intensity_lumens: Float
    avg_daily_energy_kWh: Float
    status_percentage: StatusPercentage
    alert_temperature_percentage: AlertTemperaturePercentage
    light_colors: String
  }

  type WeeklyDailyAverage {
    week: String
    day_of_week: String
    day_of_month: Int
    avg_temperature: Float
    avg_humidity: Float
    avg_energy_consumption_kWh: Float
    avg_noise_dB: Float
    avg_opens_per_hour: Float
    avg_intensity_lumens: Float
    avg_daily_energy_kWh: Float
    status_percentage: StatusPercentage
    alert_temperature_percentage: AlertTemperaturePercentage
    light_colors: String
  }

  type StatusPercentage {
    status: String
    percentage: Float
  }

  type AlertTemperaturePercentage {
    alert_temperature: String
    percentage: Float
  }

  type LightColorPercentage {
    light_color: String
    percentage: Float
  }

  type Query {
    devices: [IoTDevice]
    dailyAverages(day: String!, device_type: String): [DailyAverage]
    monthlyAverages(year: Int!, device_type: String!): [MonthlyAverage]
    availableYears(device_type: String!): [Int]
    weeklyDailyAverages(year: Int!, month_name: String!, device_type: String!): [WeeklyDailyAverage]
    availableDeviceTypes: [String]
    statusPercentages(device_type: String!): [StatusPercentage]
    alertTemperaturePercentages(device_type: String!): [AlertTemperaturePercentage]
    lightColorPercentages(device_type: String!): [LightColorPercentage]
  }
`;

const resolvers = {
  Query: {
    dailyAverages: async (_, { day, device_type }) => {
      const query = `
      WITH status_counts AS (
        SELECT 
          device_type, 
          time_bucket('1 day', time) AS day,
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'ON' THEN 1 END) AS on_count,
          COUNT(CASE WHEN status = 'OFF' THEN 1 END) AS off_count,
          COUNT(CASE WHEN status IS NULL THEN 1 END) AS null_count,
          COUNT(CASE WHEN alert_temperature = 'ON' THEN 1 END) AS alert_on_count,
          COUNT(CASE WHEN alert_temperature = 'OFF' THEN 1 END) AS alert_off_count,
          COUNT(CASE WHEN alert_temperature IS NULL THEN 1 END) AS alert_null_count
        FROM iot_devices
        WHERE time_bucket('1 day', time) = $1
        ${device_type ? `AND device_type = $2` : ""}
        GROUP BY device_type, day
      )
      SELECT 
        d.device_type, 
        s.day,
        COALESCE(AVG(d.temperature_C), 0) AS avg_temperature,
        COALESCE(AVG(d.humidity_relative), 0) AS avg_humidity,
        COALESCE(AVG(d.energy_consumption_kwh), 0) AS avg_energy_consumption_kWh,
        COALESCE(AVG(d.noise_db), 0) AS avg_noise_dB,
        COALESCE(AVG(d.opens_per_hour), 0) AS avg_opens_per_hour,
        COALESCE(AVG(d.intensity_lumens), 0) AS avg_intensity_lumens,
        COALESCE(AVG(d.daily_energy_kwh), 0) AS avg_daily_energy_kWh,
        COALESCE(s.on_count * 100.0 / NULLIF(s.total, 0), 0) AS status_on_percentage,
        COALESCE(s.off_count * 100.0 / NULLIF(s.total, 0), 0) AS status_off_percentage,
        COALESCE(s.null_count * 100.0 / NULLIF(s.total, 0), 0) AS status_null_percentage,
        COALESCE(s.alert_on_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_on_percentage,
        COALESCE(s.alert_off_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_off_percentage,
        COALESCE(s.alert_null_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_null_percentage,
        STRING_AGG(d.light_color, ', ') AS light_colors
      FROM iot_devices d
      JOIN status_counts s 
        ON d.device_type = s.device_type 
        AND time_bucket('1 day', d.time) = s.day
      GROUP BY d.device_type, s.day, s.on_count, s.off_count, s.null_count, 
              s.alert_on_count, s.alert_off_count, s.alert_null_count, s.total
      ORDER BY s.day;
      `;
    
      const values = device_type ? [day, device_type] : [day];
      const result = await pool.query(query, values);
    
      return result.rows.map(row => ({
        device_type: row.device_type,
        day: row.day ? row.day.toISOString() : null,
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
        avg_energy_consumption_kwh: row.avg_energy_consumption_kwh,
        avg_noise_dB: row.avg_noise_dB,
        avg_opens_per_hour: row.avg_opens_per_hour,
        avg_intensity_lumens: row.avg_intensity_lumens,
        avg_daily_energy_kWh: row.avg_daily_energy_kWh,
        status_percentage: {
          ON: row.status_on_percentage,
          OFF: row.status_off_percentage,
          NULL: row.status_null_percentage
        },
        alert_temperature_percentage: {
          ON: row.alert_on_percentage,
          OFF: row.alert_off_percentage,
          NULL: row.alert_null_percentage
        },
        light_colors: row.light_colors
      }));
    },

    monthlyAverages: async (_, { year, device_type }) => {
      const query = `
        WITH status_counts AS (
          SELECT 
            device_type, 
            date_trunc('month', time) AS month,
            TO_CHAR(date_trunc('month', time), 'Month') AS month_name,
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'ON' THEN 1 END) AS on_count,
            COUNT(CASE WHEN status = 'OFF' THEN 1 END) AS off_count,
            COUNT(CASE WHEN status IS NULL THEN 1 END) AS null_count,
            COUNT(CASE WHEN alert_temperature = 'ON' THEN 1 END) AS alert_on_count,
            COUNT(CASE WHEN alert_temperature = 'OFF' THEN 1 END) AS alert_off_count,
            COUNT(CASE WHEN alert_temperature IS NULL THEN 1 END) AS alert_null_count
          FROM iot_devices
          WHERE EXTRACT(YEAR FROM time) = $1
          ${device_type ? `AND device_type = $2` : ""}
          GROUP BY device_type, month
        )
        SELECT 
          d.device_type, 
          s.month,
          s.month_name,
          COALESCE(AVG(d.temperature_C), 0) AS avg_temperature,
          COALESCE(AVG(d.humidity_relative), 0) AS avg_humidity,
          COALESCE(AVG(d.energy_consumption_kwh), 0) AS avg_energy_consumption_kWh,
          COALESCE(AVG(d.noise_db), 0) AS avg_noise_dB,
          COALESCE(AVG(d.opens_per_hour), 0) AS avg_opens_per_hour,
          COALESCE(AVG(d.intensity_lumens), 0) AS avg_intensity_lumens,
          COALESCE(AVG(d.daily_energy_kwh), 0) AS avg_daily_energy_KWh,
          COALESCE(s.on_count * 100.0 / NULLIF(s.total, 0), 0) AS status_on_percentage,
          COALESCE(s.off_count * 100.0 / NULLIF(s.total, 0), 0) AS status_off_percentage,
          COALESCE(s.null_count * 100.0 / NULLIF(s.total, 0), 0) AS status_null_percentage,
          COALESCE(s.alert_on_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_on_percentage,
          COALESCE(s.alert_off_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_off_percentage,
          COALESCE(s.alert_null_count * 100.0 / NULLIF(s.total, 0), 0) AS alert_null_percentage,
          STRING_AGG(d.light_color, ', ') AS light_colors
        FROM iot_devices d
        JOIN status_counts s 
          ON d.device_type = s.device_type 
          AND date_trunc('month', d.time) = s.month
        GROUP BY d.device_type, s.month, s.month_name, s.on_count, s.off_count, 
                 s.null_count, s.alert_on_count, s.alert_off_count, 
                 s.alert_null_count, s.total
        ORDER BY s.month;
      `;
    
      const values = device_type ? [year, device_type] : [year];
      const result = await pool.query(query, values);
    
      return result.rows.map(row => ({
        device_type: row.device_type,
        month: row.month_name.trim(),
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
        avg_energy_consumption_kwh: row.avg_energy_consumption_kwh,
        avg_noise_dB: row.avg_noise_dB,
        avg_opens_per_hour: row.avg_opens_per_hour,
        avg_intensity_lumens: row.avg_intensity_lumens,
        avg_daily_energy_KWh: row.avg_daily_energy_KWh,
        status_percentage: {
          ON: row.status_on_percentage,
          OFF: row.status_off_percentage,
          NULL: row.status_null_percentage
        },
        alert_temperature_percentage: {
          ON: row.alert_on_percentage,
          OFF: row.alert_off_percentage,
          NULL: row.alert_null_percentage
        },
        light_colors: row.light_colors
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

    weeklyDailyAverages: async (_, { year, month_name, device_type }) => {
      const query = `
        SELECT 
          TO_CHAR(time, 'YYYY-"W"IW') AS week,
          EXTRACT(DAY FROM time) AS day_of_month,
          CASE 
            WHEN EXTRACT(DOW FROM time) = 0 THEN 'Domingo'
            WHEN EXTRACT(DOW FROM time) = 1 THEN 'Lunes'
            WHEN EXTRACT(DOW FROM time) = 2 THEN 'Martes'
            WHEN EXTRACT(DOW FROM time) = 3 THEN 'Miércoles'
            WHEN EXTRACT(DOW FROM time) = 4 THEN 'Jueves'
            WHEN EXTRACT(DOW FROM time) = 5 THEN 'Viernes'
            WHEN EXTRACT(DOW FROM time) = 6 THEN 'Sábado'
          END AS day_of_week,
          AVG(temperature_C) AS avg_temperature,
          AVG(humidity_relative) AS avg_humidity,
          AVG(energy_consumption_kwh) AS avg_energy_consumption_kWh,
          AVG(noise_db) AS avg_noise_dB,
          AVG(opens_per_hour) AS avg_opens_per_hour,
          AVG(intensity_lumens) AS avg_intensity_lumens,
          AVG(daily_energy_kwh) AS avg_daily_energy_KWh,
          COUNT(*) AS total_records,
          COUNT(CASE WHEN status = 'ON' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS status_on_percentage,
          COUNT(CASE WHEN status = 'OFF' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS status_off_percentage,
          COUNT(CASE WHEN status IS NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS status_null_percentage,
          COUNT(CASE WHEN alert_temperature = 'ON' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS alert_on_percentage,
          COUNT(CASE WHEN alert_temperature = 'OFF' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS alert_off_percentage,
          COUNT(CASE WHEN alert_temperature IS NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS alert_null_percentage,
          STRING_AGG(light_color, ', ') AS light_colors
        FROM iot_devices
        WHERE EXTRACT(YEAR FROM time) = $1
          AND to_char(time, 'TMMonth') ILIKE $2
          AND device_type = $3
        GROUP BY week, day_of_month, day_of_week
        ORDER BY MIN(time);
      `;
    
      const values = [year, month_name, device_type];
      const result = await pool.query(query, values);
    
      return result.rows.map(row => ({
        week: row.week,
        day_of_month: row.day_of_month,
        day_of_week: row.day_of_week,
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
        avg_energy_consumption_kwh: row.avg_energy_consumption_kWh,
        avg_noise_dB: row.avg_noise_dB,
        avg_opens_per_hour: row.avg_opens_per_hour,
        avg_intensity_lumens: row.avg_intensity_lumens,
        avg_daily_energy_KWh: row.avg_daily_energy_KWh,
        status_percentage: {
          ON: row.status_on_percentage,
          OFF: row.status_off_percentage,
          NULL: row.status_null_percentage
        },
        alert_temperature_percentage: {
          ON: row.alert_on_percentage,
          OFF: row.alert_off_percentage,
          NULL: row.alert_null_percentage
        },
        light_colors: row.light_colors
      }));
    },    

    availableDeviceTypes: async () => {
      const query = `
        SELECT DISTINCT device_type
        FROM iot_devices
        ORDER BY device_type;
      `;
      const result = await pool.query(query);
      return result.rows.map(row => row.device_type);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Servidor GraphQL corriendo en ${url}`);
});
