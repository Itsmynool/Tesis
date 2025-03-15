// components/LightIndicator.tsx
import React from 'react';
import './LightIndicator.css';

interface LightIndicatorProps {
  isOn: boolean;
}

const LightIndicator: React.FC<LightIndicatorProps> = ({ isOn }) => {
  return (
    <div className={`light ${isOn ? 'on' : ''}`}>
      <div className="glow"></div>
    </div>
  );
};

export default LightIndicator;