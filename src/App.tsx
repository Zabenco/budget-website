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
  const isAuthenticated = !!user && !!user.displayName;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Budget Tracker</h1>
      <div className="max-w-4xl mx-auto grid gap-6">
        <Auth />
        <ExpensesTable user={user} expenses={expenses} setExpenses={setExpenses} />
        {/* Removed duplicate SavingsGoals section */}
        {isAuthenticated && <BudgetAnalyzer />}
        {isAuthenticated && <ChartsDashboard expenses={expenses} />}
      </div>
    </div>
  );
}

export default App;
