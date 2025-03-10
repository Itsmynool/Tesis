import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DashboardProps, SensorData } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0] || '');
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<string | null>(null); // Para mostrar el historial de un dato
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableDevices = async () => {
      try {
        setLoading(true);
        const response = await axios.get<string[]>('http://localhost:5000/api/data/devices', {
          headers: { 'x-auth-token': token },
        });
        setAvailableDevices(response.data);

        if (selectedDevice && !response.data.includes(selectedDevice)) {
          const deviceWithData = response.data.find(dev => dev === 'b8:27:eb:bf:9d:51');
          if (deviceWithData) {
            await changeDevice(deviceWithData);
          }
        }
      } catch (err) {
        console.error('Error al obtener dispositivos disponibles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDevices();
    const interval = setInterval(fetchAvailableDevices, 300000); // Actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, [token, selectedDevice]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDevice) return;
      try {
        setLoading(true);
        const response = await axios.get<SensorData>(`http://localhost:5000/api/data/realtime/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        setData(response.data);
      } catch (err) {
        console.error('Error al obtener datos en tiempo real:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      if (!selectedDevice) return;
      try {
        setLoading(true);
        const response = await axios.get<SensorData[]>(`http://localhost:5000/api/data/history/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        setHistory(response.data);
      } catch (err) {
        console.error('Error al obtener el historial:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchData();
      fetchHistory();
    }, 300000); // Actualizar cada 5 minutos
    return () => clearInterval(interval);
  }, [selectedDevice, token]);

  const getRealTimeChartData = (dataKey: string, value: number) => ({
    labels: [dataKey],
    datasets: [
      {
        label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
        data: [value],
        backgroundColor: getColor(dataKey),
        borderColor: getColor(dataKey),
        borderWidth: 1,
      },
    ],
  });

  const updateHistoryChartData = (dataKey: string) => {
    if (history.length > 0) {
      const labels = history.map((_, index) => `Punto ${index + 1}`);
      return {
        labels,
        datasets: [
          {
            label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
            data: history.map(item => item[dataKey as keyof SensorData]),
            borderColor: getColor(dataKey),
            backgroundColor: getColor(dataKey, 0.2),
            tension: 0.3,
            fill: false,
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

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const changeDevice = async (newDevice: string) => {
    if (!newDevice || newDevice === selectedDevice) return;
    try {
      setLoading(true);
      if (selectedDevice) {
        await axios.post('http://localhost:5000/api/auth/devices/remove', { device: selectedDevice }, {
          headers: { 'x-auth-token': token },
        });
      }
      await axios.post('http://localhost:5000/api/auth/devices/add', { device: newDevice }, {
        headers: { 'x-auth-token': token },
      });
      setSelectedDevice(newDevice);
      setToken(token, [newDevice]);
    } catch (err) {
      console.error('Error al cambiar de dispositivo:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800">Tablero de Control</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition duration-200"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sección de Cambio de Dispositivo */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cambiar Dispositivo</h2>
            <p className="text-gray-600 mb-4">
              Dispositivo Actual: <span className="font-medium text-blue-600">{selectedDevice || 'Ninguno'}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {availableDevices
                .filter(dev => dev !== selectedDevice)
                .map(dev => (
                  <button
                    key={dev}
                    onClick={() => changeDevice(dev)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition duration-200"
                  >
                    Cambiar a {dev}
                  </button>
                ))}
            </div>
          </div>

          {/* Datos en Tiempo Real con Gráficos */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Datos en Tiempo Real</h2>
            {data ? (
              <div className="grid grid-cols-1 gap-6">
                {['temp', 'humidity', 'co', 'lpg', 'light', 'motion', 'smoke'].map(dataKey => (
                  <div key={dataKey} className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700">
                      {dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}
                    </h3>
                    <div className="h-32">
                      <Bar
                        data={getRealTimeChartData(dataKey, data[dataKey as keyof SensorData] as number)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true } },
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setShowHistory(dataKey)}
                      className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                ))}
                <div className="p-3 bg-blue-50 rounded-lg col-span-1">
                  <strong className="text-blue-700">Última actualización:</strong>{' '}
                  {new Date(data.ts).toLocaleString('es-ES')}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No hay datos disponibles.</p>
            )}
          </div>

          {/* Historial (Modal) */}
          {showHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Historial de {showHistory.charAt(0).toUpperCase() + showHistory.slice(1)}
                </h2>
                <div className="h-96">
                  <Line
                    data={updateHistoryChartData(showHistory)}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: `Historial de ${showHistory}` },
                      },
                      scales: {
                        x: { title: { display: true, text: 'Punto' } },
                        y: { title: { display: true, text: 'Valor' } },
                      },
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowHistory(null)}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;