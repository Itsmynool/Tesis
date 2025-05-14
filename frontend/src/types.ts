export interface AuthProps {
  setToken: (token: string) => void;
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
  data: Record<string, SensorData | null>;
  deviceHistories: Record<string, SensorData[]>;
  showHistory: { device: string; dataType: string } | null;
  setShowHistory: (value: { device: string; dataType: string } | null) => void;
  updateHistoryChartData: (dataKey: string, device: string) => { labels: string[]; datasets: any[] };
  updateSummaryBarChartData: () => { labels: string[]; datasets: any[] };
  updateAirQualityChartData: () => { labels: string[]; datasets: any[] };
  getColor: (dataKey: string, opacity?: number) => string;
  lastUpdate?: Date | null;
}