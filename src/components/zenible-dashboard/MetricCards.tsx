import React from 'react';
import bagIcon from '../../assets/icons/bag.svg';
import usersIcon from '../../assets/icons/users.svg';
import dollarIcon from '../../assets/icons/dollar.svg';
import heartIcon from '../../assets/icons/heart.svg';

interface Metric {
  id: string;
  label: string;
  value: string;
  change: string;
  icon: string;
}

const metrics: Metric[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    icon: bagIcon,
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    value: '+2350',
    change: '+180.1% from last month',
    icon: usersIcon,
  },
  {
    id: 'sales',
    label: 'Sales',
    value: '+12,234',
    change: '+19% from last month',
    icon: dollarIcon,
  },
  {
    id: 'active',
    label: 'Active Now',
    value: '+573',
    change: '+201 from last month',
    icon: heartIcon,
  },
];

interface MetricCardsProps {
  darkMode?: boolean;
}

export default function MetricCards({ darkMode }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={`rounded-xl border p-6 ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-[22px]">
            <p className={`font-inter font-medium text-sm leading-[22px] ${
              darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
            }`}>
              {metric.label}
            </p>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-zenible-dark-tab-bg' : 'bg-zenible-tab-bg'
            }`}>
              <img src={metric.icon} alt="" className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className={`font-inter font-semibold text-xl md:text-2xl leading-8 ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}>
              {metric.value}
            </p>
            <p className={`font-inter font-normal text-xs leading-5 ${
              darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-400'
            }`}>
              {metric.change}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
