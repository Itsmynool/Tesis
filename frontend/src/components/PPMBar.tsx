import React from 'react';

interface PPMBarProps {
  value: number | null | undefined; // Valor en ppm (decimal, ej. 0.123456)
  maxValue: number; // Valor máximo para la escala (ej. 1.0)
  label: string; // Etiqueta como "CO"
}

const PPMBar: React.FC<PPMBarProps> = ({ value, maxValue, label }) => {
  // Clampear el valor entre 0 y maxValue
  const clampedValue = value !== null && value !== undefined ? Math.min(maxValue, Math.max(0, value)) : 0;
  // Calcular el ancho de la barra como porcentaje del maxValue
  const barWidth = (clampedValue / maxValue) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center space-x-2">
        <div className="relative w-full h-6 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="text-lg font-bold text-white">
          {value !== null && value !== undefined ? value.toFixed(6) : 'N/A'} ppm
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">0.0 - {maxValue.toFixed(1)} ppm</div>
    </div>
  );
};

export default PPMBar;