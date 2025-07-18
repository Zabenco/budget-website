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
  const [groupIdInput, setGroupIdInput] = useState<string>('');
  const [refreshGroupId, setRefreshGroupId] = useState<number>(0);
  const isAuthenticated = !!user && !!user.displayName;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Try to read groupId from Firestore user profile
        try {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore');
          const db = getFirestore();
          const userDocRef = doc(db, 'users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.groupId) {
              setGroupId(data.groupId);
              setGroupIdInput(data.groupId);
            } else {
              setGroupId('default-group');
              setGroupIdInput('');
            }
          } else {
            setGroupId('default-group');
            setGroupIdInput('');
          }
        } catch (err) {
          console.error('Error reading groupId from Firestore:', err);
        }
      } else {
        setGroupId('default-group');
        setGroupIdInput('');
      }
    });
    return () => unsubscribe();
  }, [refreshGroupId]);

  async function handleSetGroupId() {
    if (!user || !groupIdInput) return;
    try {
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { groupId: groupIdInput }, { merge: true });
      setRefreshGroupId(r => r + 1); // triggers re-read from Firestore for this user only
    } catch (err) {
      console.error('Error setting groupId in Firestore:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
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
                  className="border p-2 rounded bg-gray-800 text-white"
                  value={groupIdInput}
                  onChange={e => setGroupIdInput(e.target.value)}
                  placeholder="Enter group ID"
                  style={{ minWidth: '120px' }}
                />
                <button
                  className="bg-blue-600 text-white px-3 py-2 rounded"
                  onClick={handleSetGroupId}
                  type="button"
                >Set Group ID</button>
                <span className="ml-2 text-gray-300 text-sm">Current: <span className="font-bold">{groupId}</span></span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-800 rounded shadow p-4">
          <ExpensesTable user={user} expenses={expenses} setExpenses={setExpenses} groupId={groupId} />
        </div>
        {isAuthenticated && (
          <div className="bg-gray-800 rounded shadow p-4">
            <BudgetAnalyzer />
          </div>
        )}
        {isAuthenticated && (
          <div className="bg-gray-800 rounded shadow p-4">
            <ChartsDashboard expenses={expenses} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
