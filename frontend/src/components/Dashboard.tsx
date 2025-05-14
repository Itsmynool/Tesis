import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { DashboardProps, SensorData } from '../types';
import DashboardForm from './DashboardForm';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  const UPDATE_INTERVAL = 30000; // 30 segundos
  const MAX_HISTORY_ENTRIES = 100;

  const [availableDevices, setAvailableDevices] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('availableDevices') || '[]');
  });
  const [deviceHistories, setDeviceHistories] = useState<Record<string, SensorData[]>>(() => {
    return JSON.parse(localStorage.getItem('deviceHistories') || '{}');
  });
  const [data, setData] = useState<Record<string, SensorData | null>>(() => {
    const histories = JSON.parse(localStorage.getItem('deviceHistories') || '{}');
    const initialData: Record<string, SensorData | null> = {};
    Object.keys(histories).forEach(device => {
      initialData[device] = histories[device]?.length > 0 ? histories[device][histories[device].length - 1] : null;
    });
    return initialData;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<{ device: string; dataType: string } | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number>(UPDATE_INTERVAL / 1000); // En segundos
  const [showUpdateNotification, setShowUpdateNotification] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchAvailableDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<string[]>('http://localhost:5000/api/sensor/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const devices = response.data;
      setAvailableDevices(devices);
      localStorage.setItem('availableDevices', JSON.stringify(devices));
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al obtener dispositivos disponibles: ' + (err.message || 'Desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const devices = JSON.parse(localStorage.getItem('availableDevices') || '[]');
    if (!devices.length) return;
    try {
      setLoading(true);
      setError(null);
      await Promise.all(devices.map(async (device: string) => {
        try {
          const response = await axios.get<SensorData>(`http://localhost:5000/api/sensor/realtime/${device}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const newData = response.data;
          setDeviceHistories(prevHistories => {
            const updatedDeviceHistory = [...(prevHistories[device] || []), newData].slice(-MAX_HISTORY_ENTRIES);
            const updatedHistories = { ...prevHistories, [device]: updatedDeviceHistory };
            localStorage.setItem('deviceHistories', JSON.stringify(updatedHistories));
            return updatedHistories;
          });
        } catch (err: any) {
          // Error silenciado según solicitud
        }
      }));
      setDeviceHistories(prevHistories => {
        const updatedHistories = { ...prevHistories };
        const newData: Record<string, SensorData | null> = {};
        devices.forEach((device: string) => {
          newData[device] = updatedHistories[device]?.[updatedHistories[device].length - 1] || null;
        });
        setData(newData);
        return updatedHistories;
      });
      if (!isFirstLoad) {
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 5000);
      }
      setIsFirstLoad(false);
      setStartTime(new Date());
      setTimeRemaining(UPDATE_INTERVAL / 1000);
    } catch (err: any) {
      setError('Error al obtener datos en tiempo real: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
      setIsInitialFetchDone(true); // Marcar como completado después de terminar el fetch
    }
  };

  // Efecto para la inicialización de datos
  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      const hasDevices = localStorage.getItem('availableDevices') && JSON.parse(localStorage.getItem('availableDevices') || '[]').length > 0;
      const hasHistories = localStorage.getItem('deviceHistories') && Object.keys(JSON.parse(localStorage.getItem('deviceHistories') || '{}')).length > 0;

      if (isMounted && (!hasDevices || !hasHistories)) {
        await fetchAvailableDevices();
        await fetchData();
      } else if (isMounted) {
        setIsInitialFetchDone(true); // Si ya hay datos, marcar como hecho
      }
    };

    initializeData();
    return () => { isMounted = false; };
  }, [token, navigate, setToken]);

  // Efecto para el intervalo de actualización
  useEffect(() => {
    if (!isInitialFetchDone) return; // No iniciar el intervalo hasta que el fetch inicial esté completo

    const interval = setTimeout(() => {
      fetchData();
    }, UPDATE_INTERVAL);

    return () => clearTimeout(interval);
  }, [isInitialFetchDone, data]); // Dependencia en data para reiniciar el temporizador

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeElapsed = now.getTime() - startTime.getTime();
      const remainingSeconds = Math.max(Math.floor((UPDATE_INTERVAL - timeElapsed) / 1000), 0);
      setTimeRemaining(remainingSeconds);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const getTimeSinceLastUpdate = () => {
    return `Próxima actualización en ${timeRemaining} segundo${timeRemaining === 1 ? '' : 's'}`;
  };

  const predictNextValue = (history: SensorData[], dataKey: string): number => {
    if (history.length < 2) {
      const lastValue = history.length > 0 ? history[history.length - 1][dataKey as keyof SensorData] as number : 0;
      return lastValue;
    }

    const lastValue = history[history.length - 1][dataKey as keyof SensorData] as number;
    const secondLastValue = history[history.length - 2][dataKey as keyof SensorData] as number;
    const trend = lastValue - secondLastValue;
    const predicted = lastValue + trend;
    return predicted;
  };

  const updateHistoryChartData = (dataKey: string, device: string) => {
    const deviceHistory = deviceHistories[device] || [];
    if (deviceHistory.length > 0) {
      const labels = deviceHistory.map((entry) => new Date(entry.ts).toLocaleTimeString('es-ES'));
      const historicalData = deviceHistory.map((item) => {
        let value: number;
        if (dataKey === 'airQuality') {
          value = Math.min(
            100,
            Math.max(
              0,
              100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
            )
          );
        } else {
          value = item[dataKey as keyof SensorData] as number;
          if (dataKey === 'light' || dataKey === 'motion') {
            value = value ? 1 : 0;
          }
        }
        return value;
      });

      const predictedValue = predictNextValue(deviceHistory, dataKey);
      const allLabels = [...labels, 'Predicción'];

      let chartData;

      if (dataKey === 'airQuality') {
        chartData = {
          labels: allLabels,
          datasets: [
            {
              label: 'Calidad del Aire',
              data: historicalData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 1,
              tension: 0.3,
              fill: false,
              pointBackgroundColor: 'rgba(75, 192, 192, 1)',
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Predicción',
              data: Array(historicalData.length).fill(null).concat([predictedValue]),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 1)',
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: 'rgba(255, 99, 132, 1)',
              pointRadius: 5,
              pointHoverRadius: 7,
              showLine: false,
            },
          ],
        };
      } else {
        chartData = {
          labels: allLabels,
          datasets: [
            {
              label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
              data: historicalData,
              borderColor: getColor(dataKey),
              backgroundColor: getColor(dataKey, 0.2),
              borderWidth: 1,
              tension: 0.3,
              fill: false,
              pointBackgroundColor: getColor(dataKey),
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Predicción',
              data: Array(historicalData.length).fill(null).concat([predictedValue]),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 1)',
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: 'rgba(255, 99, 132, 1)',
              pointRadius: 5,
              pointHoverRadius: 7,
              showLine: false,
            },
          ],
        };
      }

      return chartData;
    }
    return { labels: [], datasets: [] };
  };

  const updateSummaryBarChartData = () => {
    if (Object.keys(data).length > 0) {
      const devicesWithData = Object.values(data).filter(d => d !== null) as SensorData[];
      if (devicesWithData.length === 0) return { labels: [], datasets: [] };
      const avgTemp = devicesWithData.reduce((sum, d) => sum + d.temp, 0) / devicesWithData.length;
      const avgHumidity = devicesWithData.reduce((sum, d) => sum + d.humidity, 0) / devicesWithData.length;
      const avgCO = devicesWithData.reduce((sum, d) => sum + d.co, 0) / devicesWithData.length;
      const avgLPG = devicesWithData.reduce((sum, d) => sum + d.lpg, 0) / devicesWithData.length;
      return {
        labels: ['Temp', 'Humedad', 'CO', 'LPG'],
        datasets: [
          {
            label: 'Valores Normalizados (Promedio)',
            data: [
              avgTemp / 50,
              avgHumidity / 100,
              avgCO * 10000,
              avgLPG * 10000,
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
    return { labels: [], datasets: [] };
  };

  const updateAirQualityChartData = () => {
    if (Object.keys(data).length > 0) {
      const devicesWithData = Object.values(data).filter(d => d !== null) as SensorData[];
      if (devicesWithData.length === 0) return { labels: [], datasets: [] };
      const avgAirQuality = devicesWithData.reduce((sum, d) => {
        return sum + Math.min(
          100,
          Math.max(
            0,
            100 - ((d.co * 10000 + d.lpg * 10000 + (d.smoke ? 50 : 0)) / 100)
          )
        );
      }, 0) / devicesWithData.length;
      return {
        labels: ['Calidad del Aire (Promedio)', 'Resto'],
        datasets: [
          {
            data: [avgAirQuality, 100 - avgAirQuality],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
            borderWidth: 1,
          },
        ],
      };
    }
    return { labels: [], datasets: [] };
  };

  const getColor = (dataKey: string, opacity: number = 1) => {
    const colors: { [key: string]: string } = {
      temp: 'rgb(75, 192, 192)',
      humidity: 'rgb(255, 99, 132)',
      co: 'rgb(54, 162, 235)',
      lpg: 'rgb(255, 206, 86)',
      light: 'rgb(153, 102, 255)',
      motion: 'rgb(255, 159, 64)',
      smoke: 'rgb(201, 203, 207)',
    };
    return colors[dataKey] ? colors[dataKey].replace('rgb', 'rgba').replace(')', `, ${opacity})`) : 'gray';
  };

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setToken(null);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      navigate('/HomePage', { replace: true });
    } catch (error) {
      // Error silenciado según solicitud
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black">Tablero de Control</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">{getTimeSinceLastUpdate()}</div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 z-50"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="pt-20 w-full">
        {error && (
          <div className="text-lg font-semibold text-red-500 mb-4">{error}</div>
        )}

        <DashboardForm
          availableDevices={availableDevices}
          data={data}
          deviceHistories={deviceHistories}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          updateHistoryChartData={updateHistoryChartData}
          updateSummaryBarChartData={updateSummaryBarChartData}
          updateAirQualityChartData={updateAirQualityChartData}
          getColor={getColor}
        />
      </div>

      {loading && (
        <div className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full text-sm">
          Actualizando...
        </div>
      )}
    </div>
  );
};

export default Dashboard;