declare module 'react-thermometer-component' {
    import React from 'react';
  
    interface ThermometerProps {
      theme?: string;
      value: number;
      max?: number;
      steps?: number;
      format?: string;
      size?: string;
      height?: string | number;
      width?: string | number;
      [key: string]: any;
    }
  
    const Thermometer: React.FC<ThermometerProps>;
    export default Thermometer;
  }