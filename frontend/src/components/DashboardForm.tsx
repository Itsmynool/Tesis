  import { useState } from 'react';
  import { Line, Doughnut, Bar } from 'react-chartjs-2';
  import { SensorData, DashboardFormProps } from '../types';
  import TemperatureGauge from './TemperatureGauge';
  import HumidityGauge from './HumidityGauge';
  import AirQualityGauge from './AirQualityGauge';
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';
  import LightIndicator from './LightIndicator';

  // Estilo personalizado para el DatePicker
  const datePickerStyles = `
    .react-datepicker {
      background-color: #2d3748;
      border: 1px solid #4a5568;
      border-radius: 0.5rem;
      font-family: Arial, sans-serif;
    }
    .react-datepicker__header {
      background-color: #4a5568;
      border-bottom: none;
      padding: 0.5rem;
    }
    .react-datepicker__current-month,
    .react-datepicker__day-name {
      color: #ffffff;
    }
    .react-datepicker__day {
      color: #e2e8f0;
      border-radius: 0.25rem;
    }
    .react-datepicker__day:hover {
      background-color: #5a67d8;
      color: #ffffff;
    }
    .react-datepicker__day--selected,
    .react-datepicker__day--keyboard-selected {
      background-color: #5a67d8;
      color: #ffffff;
    }
    .react-datepicker__day--outside-month {
      color: #718096;
    }
    .react-datepicker__navigation {
      top: 0.5rem;
    }
    .react-datepicker__navigation--previous {
      border-right-color: #e2e8f0;
    }
    .react-datepicker__navigation--next {
      border-left-color: #e2e8f0;
    }
    .react-datepicker__triangle {
      display: none;
    }
  `;

  const DashboardForm: React.FC<DashboardFormProps> = ({
    availableDevices,
    selectedDevice,
    changeDevice,
    data,
    history,
    showHistory,
    setShowHistory,
    updateHistoryChartData,
    updateSummaryBarChartData,
    updateAirQualityChartData,
    getColor,
  }) => {
    // Depuración: Verificar los datos recibidos en history
    console.log('Datos recibidos en history:', history);

    const airQuality = data
      ? Math.round(
          100 -
            ((data.co * 10000 + data.lpg * 10000 + (data.smoke ? 50 : 0)) / 100)
        )
      : 0;

    // Estados para el filtrado de historial
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [startHour, setStartHour] = useState<number>(0);
    const [endHour, setEndHour] = useState<number>(23);
    const [filteredData, setFilteredData] = useState<SensorData[]>(history);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

    // Obtener el rango de fechas disponible en el historial
    const getAvailableDateRange = () => {
      if (history.length === 0) return { minDate: undefined, maxDate: undefined };
      const dates = history.map((entry) => new Date(entry.ts).getTime());
      const minTimestamp = Math.min(...dates);
      const maxTimestamp = Math.max(...dates);
      const minDate = new Date(minTimestamp);
      const maxDate = new Date(maxTimestamp);
      const result = {
        minDate: isNaN(minDate.getTime()) ? undefined : minDate,
        maxDate: isNaN(maxDate.getTime()) ? undefined : maxDate,
      };
      // Depuración: Verificar el rango de fechas
      console.log('Rango de fechas disponible:', result);
      return result;
    };

    const { minDate, maxDate } = getAvailableDateRange();

    // Generar opciones de horas (de 00:00 a 23:00)
    const hourOptions = Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));

    // Función para aplicar el filtro
    const handleFilter = () => {
      if (!selectedDay) {
        setFilteredData(history);
        console.log('Filtro aplicado (sin día seleccionado), datos:', history);
        return;
      }

      const filtered = history.filter((entry: SensorData) => {
        const entryDate = new Date(entry.ts);
        const entryHour = entryDate.getHours();

        // Filtrar por día exacto
        const isSameDay =
          entryDate.getFullYear() === selectedDay.getFullYear() &&
          entryDate.getMonth() === selectedDay.getMonth() &&
          entryDate.getDate() === selectedDay.getDate();

        // Filtrar por rango de horas
        const isWithinHourRange = entryHour >= startHour && entryHour <= endHour;

        return isSameDay && isWithinHourRange;
      });

      setFilteredData(filtered);
      // Depuración: Verificar los datos después del filtro
      console.log('Filtro aplicado, datos filtrados:', filtered);
    };

    const filteredHistoryChartData = (dataKey: string) => {
      if (filteredData.length > 0) {
        const sampledData = filteredData.filter((_, index) => index % 5 === 0);

        const labels = sampledData.map((entry: SensorData) =>
          new Date(entry.ts).toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );

        let chartData;

        if (dataKey === 'airQuality') {
          chartData = {
            labels,
            datasets: [
              {
                label: 'Calidad del Aire',
                data: sampledData.map((item: SensorData) =>
                  Math.min(
                    100,
                    Math.max(
                      0,
                      100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
                    )
                  )
                ),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: false,
              },
            ],
          };
        } else {
          chartData = {
            labels,
            datasets: [
              {
                label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
                data: sampledData.map((item: SensorData) => item[dataKey as keyof SensorData]),
                borderColor: getColor(dataKey),
                backgroundColor: getColor(dataKey, 0.2),
                tension: 0.3,
                fill: false,
              },
            ],
          };
        }

        return chartData;
      }
      return { labels: [], datasets: [] };
    };

    const getDynamicAxisRange = (dataKey: string) => {
      if (filteredData.length === 0) return { min: 0, max: 100 };

      let values: number[] = [];
      if (dataKey === 'airQuality') {
        values = filteredData.map((item: SensorData) =>
          Math.min(
            100,
            Math.max(
              0,
              100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
            )
          )
        );
      } else {
        values = filteredData
          .map((item: SensorData) => item[dataKey as keyof SensorData])
          .filter((value): value is number => typeof value === 'number');
      }

      if (values.length === 0) return { min: 0, max: 100 };

      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const padding = (maxValue - minValue) * 0.1 || 1;
      return {
        min: Math.max(minValue - padding, 0),
        max: maxValue + padding,
      };
    };

    const axisRange = showHistory ? getDynamicAxisRange(showHistory) : { min: 0, max: 100 };

    return (
      <div className="space-y-6 w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-800 min-h-screen p-4">
        <style>{datePickerStyles}</style>

        <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white mb-2">Seleccionar Dispositivo</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDevice || ''}
              onChange={(e) => changeDevice(e.target.value)}
              className="w-full max-w-xs p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Selecciona un dispositivo
              </option>
              {availableDevices.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md col-span-1 md:col-span-2 lg:col-span-4">
            <h2 className="text-lg font-semibold text-white mb-2">Resumen de Sensores</h2>
            <div className="h-48">
              <Bar
                data={updateSummaryBarChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      ticks: { color: 'white' },
                      grid: { display: false },
                    },
                    y: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            <div className="text-right mt-2">
              <button className="text-indigo-400 text-sm hover:text-indigo-300 transition duration-300">
                Ver Detalles
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-2">Temperatura, °C</h2>
            <TemperatureGauge temperature={data?.temp || 0} />
            <div className="text-xl font-bold text-white mt-2">
              {data?.temp ? `${data.temp.toFixed(1)}°C` : 'N/A'}
            </div>
            <div className="flex items-center justify-between w-full mt-2">
              <div className="text-xs text-gray-400">
                Valor actual
              </div>
              <button
                onClick={() => setShowHistory(showHistory === 'temp' ? null : 'temp')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'temp' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-1">Humedad</h2>
            <div className="flex items-center space-x-2">
              <HumidityGauge humidity={data?.humidity || 0} />
              <div className="text-lg font-bold text-white">
                {data?.humidity ? `${data.humidity.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Hum_DHT22</div>
            <div className="text-right mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'humidity' ? null : 'humidity')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'humidity' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-1">Calidad del Aire</h2>
            <div className="flex items-center space-x-2">
              <AirQualityGauge airQuality={airQuality} />
              <div className="text-lg font-bold text-white">
                {airQuality ? `${airQuality}%` : 'N/A'}
              </div>
            </div>
            <div className="text-right mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'airQuality' ? null : 'airQuality')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'airQuality' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-1">Estado de la Luz</h2>
            <div className="flex items-center space-x-2">
              <LightIndicator isOn={data?.light || false} />
              <div className="text-lg font-bold text-white">
                {data?.light ? 'Encendido' : 'Apagado'}
              </div>
            </div>
            <div className="text-right mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'light' ? null : 'light')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'light' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white mb-4">Datos en Tiempo Real</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-sm font-medium text-blue-400 mb-2">CO</h3>
              <div className="text-xl font-bold text-white">{data?.co ?? 'N/A'}</div>
              <button
                onClick={() => setShowHistory(showHistory === 'co' ? null : 'co')}
                className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'co' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-sm font-medium text-yellow-400 mb-2">LPG</h3>
              <div className="text-xl font-bold text-white">{data?.lpg ?? 'N/A'}</div>
              <button
                onClick={() => setShowHistory(showHistory === 'lpg' ? null : 'lpg')}
                className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'lpg' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-sm font-medium text-orange-400 mb-2">Movimiento</h3>
              <div className="text-xl font-bold text-white">{data?.motion ? 'Sí' : 'No'}</div>
              <button
                onClick={() => setShowHistory(showHistory === 'motion' ? null : 'motion')}
                className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'motion' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Humo</h3>
              <div className="text-xl font-bold text-white">{data?.smoke ? 'Sí' : 'No'}</div>
              <button
                onClick={() => setShowHistory(showHistory === 'smoke' ? null : 'smoke')}
                className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'smoke' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Historial */}
        {showHistory && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">
                Historial de {showHistory === 'airQuality' ? 'Calidad del Aire' : showHistory.charAt(0).toUpperCase() + showHistory.slice(1)}
              </h2>
              <div className="flex space-x-4 items-center">
                <div className="flex space-x-2 items-center">
                  <div>
                    <DatePicker
                      selected={selectedDay}
                      onChange={(date: Date | null) => setSelectedDay(date)}
                      minDate={minDate}
                      maxDate={maxDate}
                      placeholderText="Selecciona un día"
                      className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {hourOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-white">-</span>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {hourOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleFilter}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                  >
                    Filtrar
                  </button>
                </div>
                <button
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  className="text-indigo-400 text-sm hover:text-indigo-300 transition duration-300"
                >
                  {isHistoryExpanded ? 'Contraer' : 'Expandir'}
                </button>
              </div>
            </div>
            {filteredData.length === 0 ? (
              <div className="text-center text-gray-400">
                No hay datos disponibles para el día y rango de horas seleccionados.
              </div>
            ) : (
              <div className={`transition-all duration-300 ${isHistoryExpanded ? 'h-96' : 'h-48'}`}>
                <Line
                  data={filteredHistoryChartData(showHistory)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: 'top', labels: { color: 'white' } },
                      title: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}${showHistory === 'temp' ? '°C' : showHistory === 'humidity' || showHistory === 'airQuality' ? '%' : ''}`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          color: 'white',
                          maxTicksLimit: 10,
                          maxRotation: 45,
                          minRotation: 45,
                        },
                        grid: { display: false },
                      },
                      y: {
                        ticks: {
                          color: 'white',
                          callback: (value) => {
                            if (showHistory === 'temp') return `${value}°C`;
                            if (showHistory === 'humidity' || showHistory === 'airQuality') return `${value}%`;
                            if (showHistory === 'motion' || showHistory === 'smoke') return value === 1 ? 'Sí' : 'No';
                            return value;
                          },
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        min: axisRange.min,
                        max: axisRange.max,
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default DashboardForm;