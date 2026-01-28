export interface PriceData {
  timestamp: number;
  value: number;
}

export interface HistoricalData {
  current: number;
  change24h: number;
  history: PriceData[];
}

export type Period = '1day' | '1week' | '1month' | '6month' | '1year';
