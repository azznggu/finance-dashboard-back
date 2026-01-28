import { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from './services/api';
import type { HistoricalData, Period } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SectionData {
  title: string;
  data: HistoricalData | null;
  loading: boolean;
  unit: string;
  color: string;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '1day', label: '1일' },
  { value: '1week', label: '1주' },
  { value: '1month', label: '1개월' },
  { value: '6month', label: '6개월' },
  { value: '1year', label: '1년' }
];

function App() {
  // 카테고리별 독립적인 period
  const [exchangePeriod, setExchangePeriod] = useState<Period>('1day');
  const [goldPeriod, setGoldPeriod] = useState<Period>('1day');
  const [cryptoPeriod, setCryptoPeriod] = useState<Period>('1day');
  const [sp500Period, setSp500Period] = useState<Period>('1day');

  const [sections, setSections] = useState<{ [key: string]: SectionData }>({
    usdKrw: { title: 'USD/KRW 환율', data: null, loading: true, unit: '원', color: '#3b82f6' },
    jpyKrw: { title: 'JPY/KRW 환율', data: null, loading: true, unit: '원 (100엔)', color: '#8b5cf6' },
    gold: { title: '금시세 (3.75g)', data: null, loading: true, unit: '원', color: '#f59e0b' },
    btc: { title: '비트코인 (BTC)', data: null, loading: true, unit: '원', color: '#f97316' },
    eth: { title: '이더리움 (ETH)', data: null, loading: true, unit: '원', color: '#6366f1' },
    xrp: { title: '리플 (XRP)', data: null, loading: true, unit: '원', color: '#14b8a6' },
    sp500: { title: 'S&P 500', data: null, loading: true, unit: 'USD', color: '#10b981' }
  });

  // 환율 데이터 로딩 함수
  const loadExchangeData = useCallback(async () => {
    setSections(prev => ({
      ...prev,
      usdKrw: { ...prev.usdKrw, loading: true },
      jpyKrw: { ...prev.jpyKrw, loading: true }
    }));

    try {
      const [usdKrw, jpyKrw] = await Promise.all([
        api.getExchangeRate('USD/KRW', exchangePeriod),
        api.getExchangeRate('JPY/KRW', exchangePeriod)
      ]);

      setSections(prev => ({
        ...prev,
        usdKrw: { ...prev.usdKrw, data: usdKrw, loading: false },
        jpyKrw: { ...prev.jpyKrw, data: jpyKrw, loading: false }
      }));
    } catch (error) {
      console.error('환율 데이터 로딩 실패:', error);
      setSections(prev => ({
        ...prev,
        usdKrw: { ...prev.usdKrw, loading: false },
        jpyKrw: { ...prev.jpyKrw, loading: false }
      }));
    }
  }, [exchangePeriod]);

  // 금시세 데이터 로딩 함수
  const loadGoldData = useCallback(async () => {
    setSections(prev => ({
      ...prev,
      gold: { ...prev.gold, loading: true }
    }));

    try {
      const gold = await api.getGoldPrice(goldPeriod);
      setSections(prev => ({
        ...prev,
        gold: { ...prev.gold, data: gold, loading: false }
      }));
    } catch (error) {
      console.error('금시세 데이터 로딩 실패:', error);
      setSections(prev => ({
        ...prev,
        gold: { ...prev.gold, loading: false }
      }));
    }
  }, [goldPeriod]);

  // 가상화폐 데이터 로딩 함수
  const loadCryptoData = useCallback(async () => {
    setSections(prev => ({
      ...prev,
      btc: { ...prev.btc, loading: true },
      eth: { ...prev.eth, loading: true },
      xrp: { ...prev.xrp, loading: true }
    }));

    try {
      const [btc, eth, xrp] = await Promise.all([
        api.getCryptoPrice('BTC', cryptoPeriod),
        api.getCryptoPrice('ETH', cryptoPeriod),
        api.getCryptoPrice('XRP', cryptoPeriod)
      ]);

      setSections(prev => ({
        ...prev,
        btc: { ...prev.btc, data: btc, loading: false },
        eth: { ...prev.eth, data: eth, loading: false },
        xrp: { ...prev.xrp, data: xrp, loading: false }
      }));
    } catch (error) {
      console.error('가상화폐 데이터 로딩 실패:', error);
      setSections(prev => ({
        ...prev,
        btc: { ...prev.btc, loading: false },
        eth: { ...prev.eth, loading: false },
        xrp: { ...prev.xrp, loading: false }
      }));
    }
  }, [cryptoPeriod]);

  // S&P500 데이터 로딩 함수
  const loadSP500Data = useCallback(async () => {
    setSections(prev => ({
      ...prev,
      sp500: { ...prev.sp500, loading: true }
    }));

    try {
      const sp500 = await api.getSP500(sp500Period);
      setSections(prev => ({
        ...prev,
        sp500: { ...prev.sp500, data: sp500, loading: false }
      }));
    } catch (error) {
      console.error('S&P500 데이터 로딩 실패:', error);
      setSections(prev => ({
        ...prev,
        sp500: { ...prev.sp500, loading: false }
      }));
    }
  }, [sp500Period]);

  // 환율 데이터 로딩
  useEffect(() => {
    loadExchangeData();
  }, [loadExchangeData]);

  // 금시세 데이터 로딩
  useEffect(() => {
    loadGoldData();
  }, [loadGoldData]);

  // 가상화폐 데이터 로딩
  useEffect(() => {
    loadCryptoData();
  }, [loadCryptoData]);

  // S&P500 데이터 로딩
  useEffect(() => {
    loadSP500Data();
  }, [loadSP500Data]);

  const renderPeriodButtons = (currentPeriod: Period, onChange: (p: Period) => void) => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
              currentPeriod === p.value
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  };

  const renderCard = (key: string, section: SectionData, currentPeriod: Period) => {
    const { title, data, loading, unit, color } = section;

    if (loading) {
      return (
        <div key={key} className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">{title}</h3>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div key={key} className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">{title}</h3>
          <div className="text-center text-slate-400">데이터를 불러올 수 없습니다</div>
        </div>
      );
    }

    // history 데이터 검증
    if (!data.history || !Array.isArray(data.history) || data.history.length === 0) {
      return (
        <div key={key} className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2 text-slate-200">{title}</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-white">
              {data.current.toLocaleString('ko-KR')} <span className="text-lg text-slate-400">{unit}</span>
            </div>
            <div className={`text-sm mt-1 ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.change24h >= 0 ? '▲' : '▼'} {Math.abs(data.change24h).toFixed(2)}%
            </div>
          </div>
          <div className="text-center text-slate-400 py-8">차트 데이터가 없습니다</div>
        </div>
      );
    }

    // 타임스탬프 기준으로 정렬 (과거 → 현재)
    const sortedHistory = [...data.history].sort((a, b) => a.timestamp - b.timestamp);
    
    // 차트 key를 데이터 기반으로 생성 (데이터가 실제로 변경되었을 때만 리렌더링)
    const dataHash = sortedHistory.length > 0 
      ? `${sortedHistory[0].timestamp}-${sortedHistory[sortedHistory.length - 1].timestamp}-${sortedHistory.length}`
      : 'empty';

    const chartData = {
      labels: sortedHistory.map(point => {
        const date = new Date(point.timestamp);
        if (currentPeriod === '1day') {
          return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: title,
          data: sortedHistory.map(point => point.value),
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 2
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: 'easeInOutQuart' as const
      },
      transitions: {
        show: {
          animation: {
            duration: 500
          }
        },
        hide: {
          animation: {
            duration: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: '#1e293b',
          titleColor: '#e2e8f0',
          bodyColor: '#e2e8f0',
          borderColor: color,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context: any) {
              const index = context[0].dataIndex;
              const point = sortedHistory[index];
              if (point) {
                const date = new Date(point.timestamp);
                if (currentPeriod === '1day') {
                  return date.toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                }
                return date.toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric' 
                });
              }
              return '';
            },
            label: function(context: any) {
              const value = context.parsed.y;
              if (typeof value === 'number' && !isNaN(value)) {
                return `${value.toLocaleString('ko-KR')} ${unit}`;
              }
              return '데이터 없음';
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#334155',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 8,
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: '#334155',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: {
              size: 11
            },
            callback: function(value: any) {
              if (typeof value === 'number' && !isNaN(value)) {
                return value.toLocaleString('ko-KR');
              }
              return '';
            }
          }
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      },
      elements: {
        point: {
          hoverRadius: 6,
          hoverBorderWidth: 2
        }
      }
    };

    const changeColor = data.change24h >= 0 ? 'text-green-400' : 'text-red-400';
    const changeIcon = data.change24h >= 0 ? '▲' : '▼';

    return (
      <div key={key} className="bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-lg font-semibold mb-2 text-slate-200">{title}</h3>
        <div className="mb-4">
          <div className="text-3xl font-bold text-white">
            {data.current.toLocaleString('ko-KR')} <span className="text-lg text-slate-400">{unit}</span>
          </div>
          <div className={`text-sm mt-1 ${changeColor}`}>
            {changeIcon} {Math.abs(data.change24h).toFixed(2)}%
          </div>
        </div>
        <div style={{ height: '200px', position: 'relative' }}>
          <Line 
            key={`${key}-${currentPeriod}-${dataHash}`}
            data={chartData} 
            options={chartOptions}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💰 금융 대시보드</h1>
          <p className="text-slate-400">실시간 환율, 금시세, 가상화폐, 주가지수 정보</p>
        </header>

        {/* 환율 섹션 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-2">💱</span> 환율
            </h2>
          </div>
          {renderPeriodButtons(exchangePeriod, setExchangePeriod)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderCard('usdKrw', sections.usdKrw, exchangePeriod)}
            {renderCard('jpyKrw', sections.jpyKrw, exchangePeriod)}
          </div>
        </section>

        {/* 금시세 섹션 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-2">🥇</span> 금시세
            </h2>
          </div>
          {renderPeriodButtons(goldPeriod, setGoldPeriod)}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {renderCard('gold', sections.gold, goldPeriod)}
          </div>
        </section>

        {/* 가상화폐 섹션 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-2">₿</span> 가상화폐
            </h2>
          </div>
          {renderPeriodButtons(cryptoPeriod, setCryptoPeriod)}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderCard('btc', sections.btc, cryptoPeriod)}
            {renderCard('eth', sections.eth, cryptoPeriod)}
            {renderCard('xrp', sections.xrp, cryptoPeriod)}
          </div>
        </section>

        {/* S&P 500 섹션 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-2">📈</span> 주가지수
            </h2>
          </div>
          {renderPeriodButtons(sp500Period, setSp500Period)}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {renderCard('sp500', sections.sp500, sp500Period)}
          </div>
        </section>

        {/* 푸터 */}
        <footer className="text-center text-slate-500 mt-12 pb-8">
          <p>데이터는 5분마다 캐시됩니다. 각 카테고리별로 독립적인 기간 설정이 가능합니다.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
