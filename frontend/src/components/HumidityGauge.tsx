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

    const data = {
      datasets: [
        {
          data: [clampedHumidity, 100 - clampedHumidity],
          backgroundColor: ['#3b82f6', 'rgba(255, 255, 255, 0.2)'],
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
    <div className="relative w-20 h-20 flex-shrink-0">
      <div className="w-full h-full">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="text-lg font-bold text-white">{humidity.toFixed(1)}%</div>
        <div className="text-xs text-gray-400">Value</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pointer-events-none">
        <span className="text-xs text-white">0</span>
        <span className="text-xs text-white">100</span>
      </div>
    </div>
  );
};

export default HumidityGauge;