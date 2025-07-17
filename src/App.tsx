import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ExpensesTable from './components/ExpensesTable';
import SavingsGoals from './components/SavingsGoals';
import BudgetAnalyzer from './components/BudgetAnalyzer';
import ChartsDashboard from './components/ChartsDashboard';
import Auth from './components/Auth';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Personal Budget Tracker</h1>
      <div className="max-w-4xl mx-auto grid gap-6">
        <Auth />
        <ExpensesTable />
        <SavingsGoals />
        <BudgetAnalyzer />
        <ChartsDashboard />
      </div>
    </div>
  );
}

export default App
