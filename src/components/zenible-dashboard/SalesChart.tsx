import React from 'react';

interface ChartDataItem {
  month: string;
  value: number;
  height: string;
}

const chartData: ChartDataItem[] = [
  { month: 'Jan', value: 75, height: '265px' },
  { month: 'Feb', value: 47, height: '167px' },
  { month: 'Mar', value: 22, height: '76px' },
  { month: 'Apr', value: 59, height: '207px' },
  { month: 'May', value: 91, height: '320px' },
  { month: 'Jun', value: 44, height: '155px' },
  { month: 'Jul', value: 34, height: '119px' },
  { month: 'Aug', value: 63, height: '223px' },
  { month: 'Sep', value: 19, height: '68px' },
  { month: 'Oct', value: 18, height: '62px' },
  { month: 'Nov', value: 79, height: '278px' },
  { month: 'Dec', value: 43, height: '152px' },
];

const yAxisLabels = ['$6000', '$4500', '$3000', '$1500', '$0'];

interface SalesChartProps {
  darkMode?: boolean;
}

export default function SalesChart({ darkMode }: SalesChartProps) {
  return (
    <div className={`rounded-xl border p-4 ${
      darkMode
        ? 'bg-zenible-dark-card border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      <div className="mb-4">
        <h3 className={`font-inter font-semibold text-lg ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
        }`}>Overview</h3>
      </div>

      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-4 pt-4 pb-[46px]">
          {yAxisLabels.map((label) => (
            <span key={label} className={`font-inter font-normal text-sm ${
              darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
            }`}>
              {label}
            </span>
          ))}
        </div>

        {/* Chart bars */}
        <div className="flex-1 flex items-end gap-[10px] h-[390px] pb-6">
          {chartData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end h-[352px]">
                <div
                  className="w-9 mx-auto bg-gradient-to-t from-violet-400 to-violet-300 rounded-t"
                  style={{ height: data.height }}
                />
              </div>
              <span className={`font-inter font-normal text-sm mt-4 ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>
                {data.month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
