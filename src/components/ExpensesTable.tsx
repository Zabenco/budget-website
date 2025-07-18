import React, { useState, useMemo } from 'react';
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  fetchExpenses,
  addExpense,
  removeExpense,
  fetchSharedGoals,
  addSharedGoal,
  removeSharedGoal,
  updateSharedGoal,
  BUDGET_CATEGORIES,
} from '../utils/firestoreBudget';
import { Doughnut } from 'react-chartjs-2';

export type Expense = {
  id: string;
  date: string;
  person: string;
  company: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  notes: string;
};

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const initialForm = {
  date: getToday(),
  person: '',
  company: '',
  amount: '',
  type: 'expense',
  category: '',
  notes: '',
};

const categories = BUDGET_CATEGORIES;

interface ExpensesTableProps {
  user?: User | null;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  groupId: string;
}

// Firestore-powered savings goal display
const SavingsGoalDisplay: React.FC<{
  goal: { name: string; target: number };
  expenses: Expense[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ goal, expenses, onEdit, onDelete }) => {
  const saved = useMemo(() => {
    const totalIn = expenses.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
    const totalOut = expenses.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);
    return totalIn - totalOut;
  }, [expenses]);
  const percent = goal ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0;
  const chartData = {
    labels: ['Saved', 'Remaining'],
    datasets: [
      {
        data: goal ? [Math.max(0, Math.min(saved, goal.target)), Math.max(0, goal.target - saved)] : [0, 1],
        backgroundColor: ['#4ade80', '#e5e7eb'],
        borderWidth: 0,
      },
    ],
  };
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 mt-4 justify-center">
      <div className="w-32 h-32 relative flex items-center justify-center">
        <Doughnut data={chartData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
        <div className="absolute w-32 h-32 top-0 left-0 flex items-center justify-center pointer-events-none">
          <span className="text-xl font-bold">{percent}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold mb-1">{goal.name}</div>
        <div className="mb-1">You have saved <span className="font-bold text-green-600">${Math.max(0, Math.min(saved, goal.target)).toFixed(2)}</span> / <span className="font-bold">${goal.target.toFixed(2)}</span></div>
        <div className="mb-1">You're <span className="font-bold text-blue-600">{percent}%</span> of the way through.</div>
        <button className="text-blue-500 mt-2" onClick={onEdit}>Edit Goal</button>
        <button className="text-red-500 ml-4" onClick={onDelete}>Delete Goal</button>
      </div>
    </div>
  );
};

const ExpensesTable: React.FC<ExpensesTableProps> = ({ user, expenses, setExpenses, groupId }) => {
  const [form, setForm] = useState({ ...initialForm, person: user?.displayName ?? '' });
  const [optionsOpen, setOptionsOpen] = useState<string | null>(null);
  // Shared goals state
  const [goals, setGoals] = useState<Array<{ id: string; name: string; target: number }>>([]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target: '' });
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editGoalForm, setEditGoalForm] = useState<{ name: string; target: string }>({ name: '', target: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // groupId is now passed as a prop from App.tsx

  // Fetch expenses and shared goals from Firestore on user change
  useEffect(() => {
    async function fetchData() {
      if (user && user.uid) {
        setLoading(true);
        setError(null);
        try {
          const expensesData = await fetchExpenses(groupId);
          const goalsData = await fetchSharedGoals(groupId);
          setExpenses(expensesData);
          setGoals(goalsData);
        } catch (err) {
          setError('Failed to load data from Firestore.');
          console.error('Firestore fetch error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setExpenses([]);
        setGoals([]);
      }
      setForm(f => ({ ...f, person: user?.displayName ?? '' }));
    }
    fetchData();
  }, [user, setExpenses, groupId]);

  // If not logged in or no displayName, show prompt and hide everything else
  const isAuthenticated = !!user && !!user.displayName;
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#2c3136] rounded shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Budget Tracker</h2>
          <p className="mb-4">Please log in and set your display name to access your budget, expenses, savings goals, analytics, and graphs.</p>
          <p className="text-gray-500">(You can set your display name after registering or in your account settings.)</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#2c3136] rounded shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Loading data from Firestore...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#23272a] rounded shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
          <p className="text-gray-500">Check your Firestore rules and network connection.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.date || !form.person || !form.company || !form.amount || !form.category) return;
    const expenseData = {
      date: form.date,
      person: user.displayName ?? '',
      company: form.company,
      amount: Number(form.amount),
      type: form.type as 'income' | 'expense',
      category: form.category,
      notes: form.notes,
    };
    addExpense(groupId, expenseData).then(id => {
      setExpenses(prev => [...prev, { ...expenseData, id, groupId }]);
      setForm({ ...initialForm, person: user.displayName ?? '' });
    });
  };

  const handleRemove = (id: string) => {
    removeExpense(id).then(() => {
      setExpenses(expenses.filter(e => e.id !== id));
    });
  };

  const handleOptions = (id: string) => {
    setOptionsOpen(optionsOpen === id ? null : id);
  };

  return (
    <div>
      <div className="p-4 bg-[#23272a] rounded shadow">
        <h2 className="text-xl font-bold mb-4">Income & Expenses</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4" onSubmit={handleAdd}>
          <input name="date" type="date" className="border p-2 rounded" value={form.date} onChange={handleChange} required />
          <input name="person" type="text" className="border p-2 rounded bg-[#2c3136] text-white" placeholder="Person" value={form.person} readOnly required />
          <input name="company" type="text" className="border p-2 rounded" placeholder="Company/Source" value={form.company} onChange={handleChange} required />
          <input name="amount" type="number" step="0.01" className="border p-2 rounded" placeholder="Amount" value={form.amount} onChange={handleChange} required />
          <select name="type" className="border p-2 rounded" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select name="category" className="border p-2 rounded" value={form.category} onChange={handleChange} required>
            <option value="">Category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea name="notes" className="border p-2 rounded md:col-span-3" placeholder="Notes" value={form.notes} onChange={handleChange} />
          <button className="bg-blue-500 text-white px-4 py-2 rounded md:col-span-3" type="submit" disabled={!user}>Add Entry</button>
        </form>
        {!user && <div className="text-red-500 mb-2">You must be logged in to add entries.</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-[#23272a]">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Person</th>
                <th className="p-2 border">Company/Source</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Notes</th>
                <th className="p-2 border">Options</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-2">No entries yet.</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className={e.type === 'income' ? 'bg-[#2c3136]' : 'bg-[#23272a]'}>
                  <td className="p-2 border">{e.date}</td>
                  <td className="p-2 border">{e.person}</td>
                  <td className="p-2 border">{e.company}</td>
                  <td className="p-2 border capitalize">{e.type}</td>
                  <td className="p-2 border">{e.category}</td>
                  <td className={`p-2 border font-bold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{e.type === 'income' ? '+' : '-'}${Math.abs(e.amount).toFixed(2)}</td>
                  <td className="p-2 border">{e.notes}</td>
                  <td className="p-2 border relative">
                    <button className="text-blue-500" onClick={() => handleOptions(e.id)}>Options</button>
                    {optionsOpen === e.id && (
                      <div className="absolute right-0 mt-2 bg-[#23272a] border rounded shadow z-10 flex flex-col">
                        <button className="px-4 py-2 hover:bg-[#2c3136] text-left text-white" onClick={() => {/* TODO: Edit logic */ setOptionsOpen(null);}}>Edit</button>
                        <button className="px-4 py-2 hover:bg-[#2c3136] text-left text-red-400" onClick={() => { handleRemove(e.id); setOptionsOpen(null); }}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Shared Savings Goals Section */}
      {isAuthenticated && (
        <div className="mt-8 p-4 bg-[#23272a] rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-center">Shared Savings Goals</h2>
          <div className="mb-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setEditingGoal(true)}>
              Add Savings Goal
            </button>
          </div>
          {editingGoal && (
            <form className="flex flex-col gap-2 md:max-w-md w-full items-center" onSubmit={e => {
              e.preventDefault();
              if (!goalForm.name || !goalForm.target || isNaN(Number(goalForm.target)) || Number(goalForm.target) <= 0) return;
              addSharedGoal(groupId, { name: goalForm.name, target: Number(goalForm.target) }).then(id => {
                setGoals(prev => [...prev, { id, name: goalForm.name, target: Number(goalForm.target) }]);
                setEditingGoal(false);
                setGoalForm({ name: '', target: '' });
              });
            }}>
              <input
                name="name"
                type="text"
                className="border p-2 rounded w-full max-w-xs"
                placeholder="Goal Name"
                value={goalForm.name}
                onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                name="target"
                type="number"
                step="0.01"
                className="border p-2 rounded w-full max-w-xs"
                placeholder="Target Amount ($)"
                value={goalForm.target}
                onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))}
                required
              />
              <button className="bg-green-500 text-white px-4 py-2 rounded w-full max-w-xs" type="submit">Save Goal</button>
              <button className="text-gray-500 mt-2 w-full max-w-xs" type="button" onClick={() => setEditingGoal(false)}>Cancel</button>
            </form>
          )}
          {editGoalId && (
            <form className="flex flex-col gap-2 md:max-w-md w-full items-center mt-4" onSubmit={e => {
              e.preventDefault();
              if (!editGoalForm.name || !editGoalForm.target || isNaN(Number(editGoalForm.target)) || Number(editGoalForm.target) <= 0) return;
              updateSharedGoal(editGoalId, { name: editGoalForm.name, target: Number(editGoalForm.target) }).then(() => {
                setGoals(goals.map(g => g.id === editGoalId ? { ...g, name: editGoalForm.name, target: Number(editGoalForm.target) } : g));
                setEditGoalId(null);
                setEditGoalForm({ name: '', target: '' });
              });
            }}>
              <input
                name="name"
                type="text"
                className="border p-2 rounded w-full max-w-xs"
                placeholder="Edit Goal Name"
                value={editGoalForm.name}
                onChange={e => setEditGoalForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                name="target"
                type="number"
                step="0.01"
                className="border p-2 rounded w-full max-w-xs"
                placeholder="Edit Target Amount ($)"
                value={editGoalForm.target}
                onChange={e => setEditGoalForm(f => ({ ...f, target: e.target.value }))}
                required
              />
              <button className="bg-blue-500 text-white px-4 py-2 rounded w-full max-w-xs" type="submit">Update Goal</button>
              <button className="text-gray-500 mt-2 w-full max-w-xs" type="button" onClick={() => { setEditGoalId(null); setEditGoalForm({ name: '', target: '' }); }}>Cancel</button>
            </form>
          )}
          <div className="mt-6">
            {goals.length === 0 ? (
              <div className="text-center text-gray-500">No shared goals yet.</div>
            ) : (
              goals.map(goal => (
                <div key={goal.id}>
                  <SavingsGoalDisplay
                    goal={goal}
                    expenses={expenses}
                    onEdit={() => {
                      setEditGoalId(goal.id);
                      setEditGoalForm({ name: goal.name, target: String(goal.target) });
                    }}
                    onDelete={() => {
                      removeSharedGoal(goal.id).then(() => setGoals(goals.filter(g => g.id !== goal.id)));
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTable;

/* If you have a budget analyzer or graphs/dashboard, ensure those are only rendered in the parent (App.tsx or main dashboard) when isAuthenticated is true.
For example, in App.tsx:
{isAuthenticated && <ChartsDashboard user={user} expenses={expenses} />}
{isAuthenticated && <BudgetAnalyzer user={user} expenses={expenses} />}
*/
