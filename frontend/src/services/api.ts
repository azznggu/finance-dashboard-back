import axios from 'axios';
import type { HistoricalData, Period } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // 환율
  getExchangeRate: async (pair: string, period: Period): Promise<HistoricalData> => {
    const response = await axios.get(`${API_BASE_URL}/exchange-rate`, {
      params: { pair, period }
    });
    return response.data;
  },

  // 금시세
  getGoldPrice: async (period: Period): Promise<HistoricalData> => {
    const response = await axios.get(`${API_BASE_URL}/gold`, {
      params: { period }
    });
    return response.data;
  },

  // 가상화폐
  getCryptoPrice: async (symbol: string, period: Period): Promise<HistoricalData> => {
    const response = await axios.get(`${API_BASE_URL}/crypto/${symbol}`, {
      params: { period }
    });
    return response.data;
  },

  // S&P 500
  getSP500: async (period: Period): Promise<HistoricalData> => {
    const response = await axios.get(`${API_BASE_URL}/sp500`, {
      params: { period }
    });
    return response.data;
  },

  // 전체 데이터
  getAllData: async (period: Period) => {
    const response = await axios.get(`${API_BASE_URL}/all`, {
      params: { period }
    });
    return response.data;
  }
};
