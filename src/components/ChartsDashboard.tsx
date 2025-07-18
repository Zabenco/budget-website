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
  const perPerson = Array.from(new Set(filtered.map(e => e.person))).map(p => ({
    name: p,
    spent: filtered.filter(e => e.person === p && e.type === 'expense').reduce((a, b) => a + b.amount, 0),
    saved: filtered.filter(e => e.person === p && e.type === 'income').reduce((a, b) => a + b.amount, 0),
  }));

  // Net per person per day
  const byDate = Array.from(new Set(filtered.map(e => e.date))).sort();
  const netByPersonByDate: { [person: string]: number[] } = {};
  perPerson.forEach(({ name: person }) => {
    netByPersonByDate[person] = byDate.map(date => {
      const entries = filtered.filter(e => e.person === person && e.date === date);
      const income = entries.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
      const expense = entries.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);
      return income - expense;
    });
  });
  // Prepare cumulative net for each person
  const cumulativeNetByPerson: { [person: string]: number[] } = {};
  perPerson.forEach(({ name: person }) => {
    let sum = 0;
    cumulativeNetByPerson[person] = netByPersonByDate[person].map(val => (sum += val));
  });
  const netLineData = {
    labels: byDate,
    datasets: perPerson.map(({ name: person }, idx) => ({
      label: person,
      data: cumulativeNetByPerson[person],
      borderColor: [
        '#4ade80', '#f87171', '#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#fcd34d', '#fca5a5', '#a3e635', '#f9a8d4', '#f472b6', '#f87171'
      ][idx % 14],
      backgroundColor: 'transparent',
      borderWidth: 2,
      fill: false,
      tension: 0.2,
    }))
  };

  // Spending by category
  const categories = Array.from(new Set(filtered.map(e => e.category)));
  const spentByCategory = categories.map(cat => filtered.filter(e => e.category === cat && e.type === 'expense').reduce((a, b) => a + b.amount, 0));

  // Total spending per month
  const months = Array.from(new Set(filtered.map(e => e.date.slice(0, 7)))).sort();
  const spendingByMonth = months.map(m => filtered.filter(e => e.date.startsWith(m) && e.type === 'expense').reduce((a, b) => a + b.amount, 0));

  // Chart data
  // Removed unused inOutData, inByDate, outByDate
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
  const spendingMonthData = {
    labels: months,
    datasets: [
      { label: 'Total Spending', data: spendingByMonth, backgroundColor: '#f87171' },
    ],
  };

  return (
    <div className="p-4 bg-[#2c3136] rounded shadow">
      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <div className="bg-[#23272a] text-green-400 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Total In</div>
          <div className="text-2xl font-bold">${totalIn.toFixed(2)}</div>
        </div>
        <div className="bg-[#23272a] text-red-400 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Total Out</div>
          <div className="text-2xl font-bold">${totalOut.toFixed(2)}</div>
        </div>
        <div className="bg-[#23272a] text-blue-400 rounded p-4 min-w-[140px] text-center">
          <div className="text-xs">Net</div>
          <div className="text-2xl font-bold">${net.toFixed(2)}</div>
        </div>
        {perPerson.map(p => (
          <div key={p.name} className="bg-[#23272a] text-gray-200 rounded p-4 min-w-[140px] text-center">
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
            className={`px-4 py-2 rounded ${timeFrame === tf.value ? 'bg-blue-600 text-white' : 'bg-[#23272a] text-gray-200'}`}
            onClick={() => setTimeFrame(tf.value)}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2c3136] p-4 rounded shadow">
          <h3 className="font-bold mb-2">Net Per Person Over Time</h3>
          <Line data={netLineData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div className="bg-[#23272a] p-4 rounded shadow">
          <h3 className="font-bold mb-2">Spending by Category</h3>
          <Doughnut data={categoryData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
        </div>
        <div className="bg-[#23272a] p-4 rounded shadow">
          <h3 className="font-bold mb-2">Who Spends/Saves Most</h3>
          <Bar data={perPersonData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div className="bg-[#23272a] p-4 rounded shadow">
          <h3 className="font-bold mb-2">Total Spending Per Month</h3>
          <Bar data={spendingMonthData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;
