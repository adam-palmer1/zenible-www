import React, { useState, useEffect, useRef } from 'react';
import { ArrowsRightLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useCurrencyConversion } from '../../../hooks/crm/useCurrencyConversion';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { usePreferences } from '../../../contexts/PreferencesContext';
import currencyConversionAPI from '../../../services/api/crm/currencyConversion';
import { AVAILABLE_CURRENCIES } from './WidgetRegistry';

/**
 * Currency Exchange Widget for Dashboard
 * Shows live exchange rate with optional historical graph
 *
 * Settings:
 * - fromCurrency: Source currency (defaults to company default currency)
 * - toCurrency: Target currency (default: 'EUR')
 * - showGraph: Whether to show historical graph (default: true)
 * - graphDays: Number of days for graph (default: 7, max: 365)
 */
const CurrencyExchangeWidget = ({ settings = {}, widgetId = 'currency-exchange' }) => {
  const { convert } = useCurrencyConversion();
  const { defaultCurrency: companyDefaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const { updatePreference, getPreference } = usePreferences();
  const [rate, setRate] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const chartRef = useRef(null);

  // Determine currencies - wait for company currency to load
  const companyCode = companyDefaultCurrency?.currency?.code;
  const baseFromCurrency = settings.fromCurrency || companyCode || 'GBP';
  const baseToCurrency = settings.toCurrency || (baseFromCurrency === 'EUR' ? 'USD' : 'EUR');

  // Apply swap if active
  const fromCurrency = isSwapped ? baseToCurrency : baseFromCurrency;
  const toCurrency = isSwapped ? baseFromCurrency : baseToCurrency;

  // Handle swap click
  const handleSwap = () => {
    setIsSwapped(!isSwapped);
  };
  const showGraph = settings.showGraph !== false;
  const graphDays = settings.graphDays || 7;

  // Get currency symbols
  const fromSymbol = AVAILABLE_CURRENCIES.find(c => c.code === fromCurrency)?.symbol || fromCurrency;
  const toSymbol = AVAILABLE_CURRENCIES.find(c => c.code === toCurrency)?.symbol || toCurrency;

  useEffect(() => {
    // Wait for company currency to load before fetching data
    if (currencyLoading) {
      return;
    }

    const loadData = async () => {
      // Don't fetch if both currencies are the same
      if (fromCurrency === toCurrency) {
        setRate(1);
        setHistoricalData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get current rate
        const rateResult = await convert(1, fromCurrency, toCurrency);
        setRate(typeof rateResult === 'number' ? rateResult : parseFloat(rateResult) || null);

        // Get historical data if graph is enabled
        if (showGraph) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - graphDays);

          try {
            const data = await currencyConversionAPI.getHistoricalRange(
              fromCurrency,
              toCurrency,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            );
            // API returns data_points array with { date, rate, capture_window }
            const dataPoints = data.data_points || data.rates || [];
            setHistoricalData(dataPoints);
          } catch (histError) {
            console.warn('Historical data not available:', histError);
            setHistoricalData([]);
          }
        }
      } catch (err) {
        console.error('Failed to load exchange rate:', err);
        setError('Failed to load rate');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fromCurrency, toCurrency, showGraph, graphDays, convert, currencyLoading]);

  // Calculate trend from historical data
  const getTrend = () => {
    if (historicalData.length < 2) return null;
    const getRate = (d) => parseFloat(d.rate || d.exchange_rate || d.value || 0);
    const firstRate = getRate(historicalData[0]);
    const lastRate = getRate(historicalData[historicalData.length - 1]);
    if (!firstRate || !lastRate) return null;
    const change = ((lastRate - firstRate) / firstRate) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(2),
    };
  };

  const trend = getTrend();

  // Format date for display
  const formatDate = (dateString, short = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (short) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Interactive chart with axes and hover
  const renderChart = () => {
    if (historicalData.length < 2) return null;

    const getRate = (d) => parseFloat(d.rate || d.exchange_rate || d.value || 0);
    const rates = historicalData.map(getRate).filter(r => r > 0);
    if (rates.length < 2) return null;

    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const range = max - min || 0.0001;

    // Responsive dimensions - chart will scale with container
    const width = 320;
    const height = 100;
    const paddingLeft = 45;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 20;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Generate points for the line
    const points = rates.map((rate, i) => {
      const x = paddingLeft + (i / (rates.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((rate - min) / range) * chartHeight;
      return { x, y, rate, date: historicalData[i]?.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    // Y-axis labels (3 values: min, mid, max)
    const midRate = (min + max) / 2;
    const yLabels = [
      { value: max, y: paddingTop },
      { value: midRate, y: paddingTop + chartHeight / 2 },
      { value: min, y: paddingTop + chartHeight },
    ];

    // X-axis labels (start and end dates)
    const xLabels = [
      { date: historicalData[0]?.date, x: paddingLeft },
      { date: historicalData[historicalData.length - 1]?.date, x: paddingLeft + chartWidth },
    ];

    // Handle mouse move for hover
    const handleMouseMove = (e) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();

      // Convert screen coordinates to viewBox coordinates
      const scaleX = width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;

      // Find closest point
      let closestPoint = null;
      let closestDist = Infinity;

      points.forEach(p => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < closestDist && dist < 30 * scaleX) {
          closestDist = dist;
          closestPoint = p;
        }
      });

      setHoveredPoint(closestPoint);
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };

    return (
      <div className="relative">
        <svg
          ref={chartRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <line
              key={i}
              x1={paddingLeft}
              y1={label.y}
              x2={width - paddingRight}
              y2={label.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={paddingLeft - 5}
              y={label.y + 4}
              textAnchor="end"
              className="text-[9px] fill-gray-400"
            >
              {label.value.toFixed(4)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={height - 5}
              textAnchor={i === 0 ? 'start' : 'end'}
              className="text-[9px] fill-gray-400"
            >
              {formatDate(label.date, true)}
            </text>
          ))}

          {/* Main line - Zenible Purple */}
          <path
            d={pathD}
            fill="none"
            stroke="#8e51ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover point indicator */}
          {hoveredPoint && (
            <>
              {/* Vertical line */}
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartHeight}
                stroke="#8e51ff"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              {/* Point circle */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill="#8e51ff"
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
            style={{
              left: Math.min(hoveredPoint.x, width - 100),
              top: Math.max(hoveredPoint.y - 35, 0),
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-medium">{toSymbol}{hoveredPoint.rate.toFixed(4)}</div>
            <div className="text-gray-300 text-[10px]">{formatDate(hoveredPoint.date)}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
        <ArrowsRightLeftIcon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with currencies and trend */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">{fromCurrency}</span>
          <button
            onClick={handleSwap}
            className="p-0.5 rounded hover:bg-gray-100 transition-colors"
            title="Swap currencies"
          >
            <ArrowsRightLeftIcon className="w-3.5 h-3.5 text-gray-400 hover:text-[#8e51ff] transition-colors" />
          </button>
          <span className="text-sm font-semibold text-gray-900">{toCurrency}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            trend.direction === 'up'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowTrendingUpIcon className="w-2.5 h-2.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-2.5 h-2.5" />
            )}
            {trend.percentage}%
          </div>
        )}
      </div>

      {/* Rate display - compact */}
      <div className="bg-gray-50 rounded-lg p-2 mb-1 flex-shrink-0">
        <p className="text-[10px] text-gray-500 leading-tight">Current Rate</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">
          {fromSymbol}1 = {toSymbol}{typeof rate === 'number' ? rate.toFixed(4) : '—'}
        </p>
      </div>

      {/* Historical Graph - takes remaining space */}
      {showGraph && historicalData.length > 1 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-[60px]">
            {renderChart()}
          </div>
          <p className="text-[9px] text-gray-400 text-center flex-shrink-0">
            Last {graphDays} {graphDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencyExchangeWidget;
