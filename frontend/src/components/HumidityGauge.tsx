import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface HumidityGaugeProps {
  humidity: number;
}

const HumidityGauge: React.FC<HumidityGaugeProps> = ({ humidity }) => {
  const [chartData, setChartData] = useState<any>({
    datasets: [],
  });

  useEffect(() => {
    const clampedHumidity = Math.min(100, Math.max(0, humidity));

    // Determinar el color basado en el porcentaje de humedad (usando tonos de azul)
    let barColor = '#dbeafe'; // Azul muy claro por defecto (bajo)
    if (clampedHumidity > 30 && clampedHumidity <= 60) {
      barColor = '#60a5fa'; // Azul medio claro (moderado)
    } else if (clampedHumidity > 60 && clampedHumidity <= 80) {
      barColor = '#2563eb'; // Azul medio (alto)
    } else if (clampedHumidity > 80) {
      barColor = '#1e3a8a'; // Azul oscuro (muy crítico)
    }

    const data = {
      datasets: [
        {
          data: [clampedHumidity, 100 - clampedHumidity],
          backgroundColor: [barColor, 'rgba(255, 255, 255, 0.2)'],
          borderWidth: 0,
          circumference: 180,
          rotation: -90,
        },
      ],
      labels: ['Humedad', 'Resto'],
    };

    setChartData(data);
  }, [humidity]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
      <div className="w-full h-full">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        <div>
          <div className="text-lg font-bold text-black">{humidity.toFixed(0)}%</div>
          <div className="text-xs text-gray-400">Índice</div>
        </div>
      </div>
    </div>
  );
};

export default HumidityGauge;