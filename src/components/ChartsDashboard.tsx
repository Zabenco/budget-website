import React, { useMemo, useState } from 'react';
import type { Expense } from './ExpensesTable';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';


ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Title);

interface ChartsDashboardProps {
  expenses: Expense[];
}

const timeFrames = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

function filterByTimeFrame(expenses: Expense[], frame: string) {
  if (frame === 'all') return expenses;
  const now = new Date();
  if (frame === 'month') {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }
  if (frame === 'year') {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear();
    });
  }
  return expenses;
}

const ChartsDashboard: React.FC<ChartsDashboardProps> = ({ expenses }) => {
  const [timeFrame, setTimeFrame] = useState('all');
  const filtered = useMemo(() => filterByTimeFrame(expenses, timeFrame), [expenses, timeFrame]);

  // Summary
  const totalIn = filtered.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalOut = filtered.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const net = totalIn - totalOut;
  const people = Array.from(new Set(filtered.map(e => e.person)));
  const perPerson = people.map(p => ({
    name: p,
    spent: filtered.filter(e => e.person === p && e.type === 'expense').reduce((a, b) => a + b.amount, 0),
    saved: filtered.filter(e => e.person === p && e.type === 'income').reduce((a, b) => a + b.amount, 0),
  }));

  // Money in/out over time
  const byDate = Array.from(new Set(filtered.map(e => e.date))).sort();
  const inByDate = byDate.map(date => filtered.filter(e => e.date === date && e.type === 'income').reduce((a, b) => a + b.amount, 0));
  const outByDate = byDate.map(date => filtered.filter(e => e.date === date && e.type === 'expense').reduce((a, b) => a + b.amount, 0));

  // Spending by category
  const categories = Array.from(new Set(filtered.map(e => e.category)));
  const spentByCategory = categories.map(cat => filtered.filter(e => e.category === cat && e.type === 'expense').reduce((a, b) => a + b.amount, 0));

  // Income per month
  const months = Array.from(new Set(filtered.map(e => e.date.slice(0, 7)))).sort();
  const incomeByMonth = months.map(m => filtered.filter(e => e.date.startsWith(m) && e.type === 'income').reduce((a, b) => a + b.amount, 0));

  // Chart data
  const inOutData = {
    labels: byDate,
    datasets: [
      { label: 'Money In', data: inByDate, backgroundColor: '#4ade80', borderColor: '#22c55e', borderWidth: 2, fill: false },
      { label: 'Money Out', data: outByDate, backgroundColor: '#f87171', borderColor: '#ef4444', borderWidth: 2, fill: false },
    ],
  };
  const categoryData = {
    labels: categories,
    datasets: [
      { label: 'Spent', data: spentByCategory, backgroundColor: [
        '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#fcd34d', '#fca5a5', '#a3e635', '#f9a8d4', '#f472b6', '#f87171'
      ] },
    ],
  };
  const perPersonData = {
    labels: perPerson.map(p => p.name),
    datasets: [
      { label: 'Spent', data: perPerson.map(p => p.spent), backgroundColor: '#f87171' },
      { label: 'Saved', data: perPerson.map(p => p.saved), backgroundColor: '#4ade80' },
    ],
  };
  const incomeMonthData = {
    labels: months,
    datasets: [
      { label: 'Income', data: incomeByMonth, backgroundColor: '#60a5fa' },
    ],
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <div className="bg-green-100 text-green-800 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Total In</div>
          <div className="text-2xl font-bold">${totalIn.toFixed(2)}</div>
        </div>
        <div className="bg-red-100 text-red-800 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Total Out</div>
          <div className="text-2xl font-bold">${totalOut.toFixed(2)}</div>
        </div>
        <div className="bg-blue-100 text-blue-800 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Net</div>
          <div className="text-2xl font-bold">${net.toFixed(2)}</div>
        </div>
        {perPerson.map(p => (
          <div key={p.name} className="bg-gray-100 text-gray-800 rounded p-4 min-w-[140px] text-center">
            <div className="text-xs">{p.name}</div>
            <div className="text-sm">Spent: <span className="font-bold text-red-600">${p.spent.toFixed(2)}</span></div>
            <div className="text-sm">Saved: <span className="font-bold text-green-600">${p.saved.toFixed(2)}</span></div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {timeFrames.map(tf => (
          <button
            key={tf.value}
            className={`px-4 py-2 rounded ${timeFrame === tf.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setTimeFrame(tf.value)}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Money In/Out Over Time</h3>
          <Line data={inOutData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Spending by Category</h3>
          <Doughnut data={categoryData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Who Spends/Saves Most</h3>
          <Bar data={perPersonData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Income Per Month</h3>
          <Bar data={incomeMonthData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;
