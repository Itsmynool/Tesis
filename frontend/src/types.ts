
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


export interface DashboardFormProps {
  availableDevices: string[];
  selectedDevice: string;
  changeDevice: (newDevice: string) => void;
  data: SensorData | null;
  history: SensorData[];
  showHistory: string | null;
  setShowHistory: (key: string | null) => void;
  updateHistoryChartData: (dataKey: string) => { labels: string[]; datasets: any[] };
  updateSummaryBarChartData: () => { labels: string[]; datasets: any[] };
  updateAirQualityChartData: () => { labels: string[]; datasets: any[] };
  getColor: (dataKey: string, opacity?: number) => string;
  lastUpdate?: Date | null;
}