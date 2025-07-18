import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import './App.css'

import ExpensesTable from './components/ExpensesTable';
import type { Expense } from './components/ExpensesTable';
// import SavingsGoals from './components/SavingsGoals';
import BudgetAnalyzer from './components/BudgetAnalyzer';
import ChartsDashboard from './components/ChartsDashboard';
import Auth from './components/Auth';
import type { User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupId, setGroupId] = useState<string>('default-group');
  const isAuthenticated = !!user && !!user.displayName;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Budget Tracker</h1>
      <div className="max-w-4xl mx-auto grid gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Auth />
            {isAuthenticated && (
              <div className="flex items-center gap-2 ml-4">
                <label htmlFor="groupId" className="font-semibold">Group ID:</label>
                <input
                  id="groupId"
                  type="text"
                  className="border p-2 rounded"
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  placeholder="Enter group ID"
                  style={{ minWidth: '120px' }}
                />
              </div>
            )}
          </div>
        </div>
        <ExpensesTable user={user} expenses={expenses} setExpenses={setExpenses} groupId={groupId} />
        {isAuthenticated && <BudgetAnalyzer />}
        {isAuthenticated && <ChartsDashboard expenses={expenses} />}
      </div>
    </div>
  );
}

export default App;
