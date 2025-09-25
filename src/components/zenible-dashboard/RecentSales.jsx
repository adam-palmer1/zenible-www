import React from 'react';

const salesData = [
  { id: 1, name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00' },
  { id: 2, name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00' },
  { id: 3, name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '+$299.00' },
  { id: 4, name: 'William Kim', email: 'will@email.com', amount: '+$99.00' },
  { id: 5, name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '+$39.00' },
  { id: 6, name: 'Ethan Wilson', email: 'ethan.wilson@email.com', amount: '+$39.00' },
];

// Generate avatar colors based on name
const getAvatarGradient = (name) => {
  const colors = [
    'from-purple-400 to-pink-400',
    'from-blue-400 to-cyan-400',
    'from-green-400 to-emerald-400',
    'from-orange-400 to-red-400',
    'from-indigo-400 to-purple-400',
    'from-pink-400 to-rose-400',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function RecentSales({ darkMode }) {
  return (
    <div className={`rounded-xl border p-4 ${
      darkMode
        ? 'bg-zenible-dark-card border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      <div className="mb-4">
        <h3 className={`font-inter font-semibold text-lg ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
        }`}>Recent Sales</h3>
        <p className={`font-inter font-normal text-sm mt-1 ${
          darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
        }`}>
          You made 265 sales this month.
        </p>
      </div>

      <div className="flex flex-col">
        {salesData.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between py-[10px]">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(sale.name)}`} />
              <div className="flex flex-col">
                <p className={`font-inter font-medium text-sm leading-[22px] ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}>
                  {sale.name}
                </p>
                <p className={`font-inter font-normal text-xs leading-[18px] ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}>
                  {sale.email}
                </p>
              </div>
            </div>
            <p className={`font-inter font-medium text-base ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}>
              {sale.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}