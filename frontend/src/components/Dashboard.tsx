import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DashboardProps, SensorData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0] || '');
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const navigate = useNavigate();

  const changeDevice = async (newDevice: string) => {
    console.log('Intentando cambiar a dispositivo:', newDevice);
    if (!newDevice || newDevice === selectedDevice) return;
    try {
      setLoading(true);
      setError(null);
      if (selectedDevice) {
        console.log('Eliminando dispositivo actual:', selectedDevice);
        await axios.post(
          'http://localhost:5000/api/auth/devices/remove',
          { device: selectedDevice },
          {
            headers: { 'x-auth-token': token },
          }
        );
      }
      console.log('Añadiendo nuevo dispositivo:', newDevice);
      await axios.post(
        'http://localhost:5000/api/auth/devices/add',
        { device: newDevice },
        {
          headers: { 'x-auth-token': token },
        }
      );
      setSelectedDevice(newDevice);
      setToken(token);
      console.log('Dispositivo cambiado exitosamente a:', newDevice);
    } catch (err: any) {
      console.error('Error al cambiar de dispositivo:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setToken(null);
        navigate('/login');
      } else {
        setError('Error al cambiar de dispositivo: ' + (err.message || 'Desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAvailableDevices = async () => {
      console.log('Buscando dispositivos disponibles...');
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<string[]>('http://localhost:5000/api/data/devices', {
          headers: { 'x-auth-token': token },
        });
        console.log('Dispositivos obtenidos:', response.data);
        setAvailableDevices(response.data);

        if (!selectedDevice || !response.data.includes(selectedDevice)) {
          const deviceWithData = response.data.find((dev) => dev === 'b8:27:eb:bf:9d:51') || response.data[0];
          if (deviceWithData) {
            console.log('Seleccionando dispositivo por defecto:', deviceWithData);
            setSelectedDevice(deviceWithData);
          }
        }
      } catch (err: any) {
        console.error('Error al obtener dispositivos disponibles:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener dispositivos disponibles: ' + (err.message || 'Desconocido'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDevices();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('Actualizando dispositivos disponibles...');
      try {
        const response = await axios.get<string[]>('http://localhost:5000/api/data/devices', {
          headers: { 'x-auth-token': token },
        });
        setAvailableDevices(response.data);
      } catch (err: any) {
        console.error('Error al actualizar dispositivos disponibles:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        }
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Buscando datos en tiempo real para:', selectedDevice);
      if (!selectedDevice) {
        console.log('No hay dispositivo seleccionado, saltando fetchData');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<SensorData>(`http://localhost:5000/api/data/realtime/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        console.log('Datos en tiempo real obtenidos:', response.data);
        setData(response.data);
      } catch (err: any) {
        console.error('Error al obtener datos en tiempo real:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener datos en tiempo real: ' + (err.message || 'Desconocido'));
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      console.log('Buscando historial para:', selectedDevice);
      if (!selectedDevice) {
        console.log('No hay dispositivo seleccionado, saltando fetchHistory');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<SensorData[]>(`http://localhost:5000/api/data/history/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        console.log('Historial obtenido:', response.data);
        setHistory(response.data);
      } catch (err: any) {
        console.error('Error al obtener el historial:', err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener el historial: ' + (err.message || 'Desconocido'));
        }
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
    }, 300000);
    return () => clearInterval(interval);
  }, [selectedDevice, token]);

  const updateHistoryChartData = (dataKey: string) => {
    if (history.length > 0) {
      const labels = history.map((entry) => new Date(entry.ts).toLocaleTimeString('es-ES'));
      return {
        labels,
        datasets: [
          {
            label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
            data: history.map((item) => item[dataKey as keyof SensorData]),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-red-600">{error}</div>
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
                .filter((dev) => dev !== selectedDevice)
                .map((dev) => (
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

          {/* Datos en Tiempo Real con Representaciones Personalizadas */}
          <div className="bg-white p-8 rounded-xl shadow-lg lg:col-span-3">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Datos en Tiempo Real</h2>
            {data ? (
              <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
                {/* Fila 1: Temperatura y Humedad */}
                <div className="bg-white p-6 rounded-lg shadow-md h-[600px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">TEMPERATURA</h3>
                  <div
                    className="relative w-80 h-[500px] mx-auto"
                    style={{
                      backgroundImage: `url(/assets/thermometer.png)`,
                      backgroundSize: '100% 100%', // Imagen más grande
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-4xl font-bold text-gray-800 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.temp}°C
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('temp')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">HUMEDAD</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/water-drop.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-4xl font-bold text-blue-600 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.humidity}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('humidity')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                {/* Fila 2: CO y LPG */}
                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">CO</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/cloud.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-3xl font-bold text-gray-700 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.co}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('co')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">LPG</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/fire.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-3xl font-bold text-yellow-600 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.lpg}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('lpg')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                {/* Fila 3: Luz y Movimiento */}
                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">LUZ</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/lightbulb.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-3xl font-bold text-gray-800 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.light ? 'Prendido' : 'Apagado'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('light')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">MOVIMIENTO</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/walking.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-3xl font-bold text-orange-600 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.motion ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('motion')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                {/* Fila 4: Humo y Última Actualización */}
                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex flex-col justify-between">
                  <h3 className="text-xl font-medium text-blue-700 text-center mb-4">HUMO</h3>
                  <div
                    className="relative w-72 h-72 mx-auto"
                    style={{
                      backgroundImage: `url(/assets/smog.png)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-3xl font-bold text-gray-700 bg-white bg-opacity-50 px-3 py-1 rounded">
                        {data.smoke ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-6">
                    <button
                      onClick={() => setShowHistory('smoke')}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <strong className="text-blue-700 text-lg">Última actualización:</strong>{' '}
                    <span className="text-lg">{new Date(data.ts).toLocaleString('es-ES')}</span>
                  </div>
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
                        x: {
                          title: { display: true, text: 'Hora' },
                        },
                        y: {
                          title: { display: true, text: 'Valor' },
                        },
                      },
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowHistory(null)}
                  className="mt-4 bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600"
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