export interface AuthProps {
  setToken: (token: string | null, devices?: string[]) => void;
}

export interface DashboardProps {
  token: string;
  setToken: (token: string | null, devices?: string[]) => void;
  devices: string[];
}

export interface SensorData {
  id: number;
  ts: string;
  device: string;
  co: number;
  humidity: number;
  light: boolean;
  lpg: number;
  motion: boolean;
  smoke: number;
  temp: number;
}