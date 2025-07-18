
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import { createGroupBudget, fetchGroupBudget, updateGroupBudget, fetchExpenses } from '../utils/firestoreBudget';
import type { GroupBudget, BudgetCategory } from '../utils/firestoreBudget';

const categoryLabels: { [key: string]: string } = {
  housing: 'Housing',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  transportation: 'Transportation',
  education: 'Education',
  debtPayments: 'Debt Payments',
  personalCare: 'Personal Care',
  food: 'Food',
  entertainment: 'Entertainment',
  miscellaneous: 'Miscellaneous',
  insurance: 'Insurance',
  salary: 'Salary',
};

const CATEGORY_KEYS: (keyof BudgetCategory)[] = [
  'housing',
  'utilities',
  'healthcare',
  'transportation',
  'education',
  'debtPayments',
  'personalCare',
  'food',
  'entertainment',
  'miscellaneous',
  'insurance',
  'salary',
];

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

const BudgetAnalyzer: React.FC<{ groupId?: string }> = ({ groupId }) => {
  const [{ month, year }, setMonthYear] = useState(getCurrentMonthYear());
  const [budget, setBudget] = useState<GroupBudget | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ expectedIncome: number; categories: Partial<BudgetCategory> }>({ expectedIncome: 0, categories: {} });
  const [expenses, setExpenses] = useState<any[]>([]);
  // Removed unused allBudgets state

  useEffect(() => {
    if (!groupId) return;
    fetchGroupBudget(groupId, month, year).then(setBudget);
    fetchExpenses(groupId).then(setExpenses);
    // Removed listGroupBudgets call
  }, [groupId, month, year]);

  useEffect(() => {
    if (budget) {
      setForm({ expectedIncome: budget.expectedIncome, categories: budget.categories });
    } else {
      setForm({ expectedIncome: 0, categories: {} });
    }
  }, [budget]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'expectedIncome') {
      setForm(f => ({ ...f, expectedIncome: Number(value) }));
    } else {
      setForm(f => ({ ...f, categories: { ...f.categories, [name]: Number(value) } }));
    }
  };

  const handleSave = async () => {
    if (!groupId) return;
    // Ensure all categories are numbers
    const fullCategories: BudgetCategory = {
      housing: Number(form.categories.housing ?? 0),
      utilities: Number(form.categories.utilities ?? 0),
      healthcare: Number(form.categories.healthcare ?? 0),
      transportation: Number(form.categories.transportation ?? 0),
      education: Number(form.categories.education ?? 0),
      debtPayments: Number(form.categories.debtPayments ?? 0),
      personalCare: Number(form.categories.personalCare ?? 0),
      food: Number(form.categories.food ?? 0),
      entertainment: Number(form.categories.entertainment ?? 0),
      miscellaneous: Number(form.categories.miscellaneous ?? 0),
      insurance: Number(form.categories.insurance ?? 0),
      salary: Number(form.categories.salary ?? 0),
    };
    if (budget) {
      await updateGroupBudget(budget.id!, {
        expectedIncome: form.expectedIncome,
        categories: fullCategories,
        expectedSavings: form.expectedIncome - Object.values(fullCategories).reduce((a, b) => a + b, 0),
      });
    } else {
      await createGroupBudget(groupId, month, year, form.expectedIncome, fullCategories);
    }
    setEditing(false);
    fetchGroupBudget(groupId, month, year).then(setBudget);
    // Removed listGroupBudgets call
  };

  // Calculate actuals for current month
  const actuals: Partial<BudgetCategory> = {};
  let actualIncome = 0;
  let actualExpenses = 0;
  // Map display category names to BudgetCategory keys
  const categoryKeyMap: { [key: string]: keyof BudgetCategory } = {
    'Housing': 'housing',
    'Utilities': 'utilities',
    'Healthcare': 'healthcare',
    'Transportation': 'transportation',
    'Education': 'education',
    'Debt Payments': 'debtPayments',
    'Personal Care': 'personalCare',
    'Food': 'food',
    'Entertainment': 'entertainment',
    'Miscellaneous': 'miscellaneous',
    'Insurance': 'insurance',
    'Salary': 'salary',
  };

  expenses.forEach(e => {
    if (e.type === 'income') {
      actualIncome += Number(e.amount);
    } else {
      actualExpenses += Number(e.amount);
      const catKey = categoryKeyMap[e.category] ?? (e.category as keyof BudgetCategory);
      if (actuals[catKey] !== undefined) actuals[catKey]! += Number(e.amount);
      else actuals[catKey] = Number(e.amount);
    }
  });
  const actualSavings = actualIncome - actualExpenses;

  // Prepare data for bar chart
  const chartData = budget ? {
    labels: CATEGORY_KEYS.map(cat => categoryLabels[cat]),
    datasets: [
      {
        label: 'Budgeted',
        data: CATEGORY_KEYS.map(cat => budget.categories[cat]),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Actual',
        data: CATEGORY_KEYS.map(cat => actuals[cat] ?? 0),
        backgroundColor: '#22c55e',
      },
    ],
  } : undefined;

  return (
    <div className="p-4 bg-[#23272a] rounded shadow">
      <h2 className="text-xl font-bold mb-4">Budget Analyzer</h2>
      <div className="mb-4 flex gap-4 items-center">
        <label className="font-semibold">Month:</label>
        <select
          className="bg-[#2c3136] text-white p-2 rounded"
          value={month}
          onChange={e => setMonthYear(y => ({ ...y, month: Number(e.target.value) }))}
        >
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <label className="font-semibold">Year:</label>
        <select
          className="bg-[#2c3136] text-white p-2 rounded"
          value={year}
          onChange={e => setMonthYear(y => ({ ...y, year: Number(e.target.value) }))}
        >
          {[...Array(6)].map((_, i) => {
            const yr = new Date().getFullYear() - i;
            return <option key={yr} value={yr}>{yr}</option>;
          })}
        </select>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => setEditing(true)}>
          {budget ? 'Edit Budget' : 'Create Budget'}
        </button>
      </div>

      {editing && (
        <div className="mb-6 p-4 bg-[#2c3136] rounded shadow">
          <h3 className="text-lg font-bold mb-2">{budget ? 'Edit Budget' : 'Create Budget'}</h3>
          <div className="mb-2">
            <label className="font-semibold mr-2">Expected Monthly Income:</label>
            <input
              type="number"
              name="expectedIncome"
              className="border p-2 rounded bg-[#23272a] text-white"
              value={form.expectedIncome}
              onChange={handleFormChange}
              min={0}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORY_KEYS.map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <label className="w-40">{categoryLabels[cat]}:</label>
                <input
                  type="number"
                  name={cat}
                  className="border p-2 rounded bg-[#23272a] text-white"
                  value={form.categories[cat] ?? 0}
                  onChange={handleFormChange}
                  min={0}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 font-semibold text-green-400">
            Expected Savings: ${form.expectedIncome - Object.values(form.categories).reduce((a, b) => a + (b ?? 0), 0)}
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded mt-4" onClick={handleSave}>Save Budget</button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded mt-4 ml-2" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      )}

      {budget && !editing && (
        <div className="mb-6 p-4 bg-[#2c3136] rounded shadow">
          <h3 className="text-lg font-bold mb-2">Budget for {month}/{year}</h3>
          <div className="mb-2 font-semibold">Expected Monthly Income: ${budget.expectedIncome}</div>
          <div className="mb-6">
            {chartData && <Bar data={chartData} options={{ plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {CATEGORY_KEYS.map(cat => {
              const remaining = (budget.categories[cat] ?? 0) - (actuals[cat] ?? 0);
              let color = 'text-green-400';
              if (remaining <= 0) color = 'text-red-400';
              else if (remaining <= 25) color = 'text-yellow-400';
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="w-40">{categoryLabels[cat]}:</span>
                  <span>${budget.categories[cat]}</span>
                  <span className={`font-semibold text-xs ${color}`}>{`$${remaining} remaining`}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 font-semibold text-green-400">Expected Savings: ${budget.expectedSavings}</div>
          <div className="mt-2 font-semibold text-blue-400">Actual Savings: ${actualSavings}</div>
          <div className="mt-2 font-semibold text-yellow-400">Net Profit/Loss: ${actualIncome - actualExpenses}</div>
        </div>
      )}
    </div>
  );
};

export default BudgetAnalyzer;
