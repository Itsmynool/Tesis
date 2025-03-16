import React from 'react';
import './LightIndicator.css';

interface LightIndicatorProps {
  isOn: boolean;
}

const LightIndicator: React.FC<LightIndicatorProps> = ({ isOn }) => {
  // Aseguramos que isOn sea un booleano
  const isLightOn = Boolean(isOn);
  console.log('LightIndicator - isOn:', isLightOn); // Depuración

  return (
    <div className={`light ${isLightOn ? 'on' : 'off'}`}>
      <div className="glow"></div>
    </div>
  );
};

export default LightIndicator;