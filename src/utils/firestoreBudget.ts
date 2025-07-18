// src/utils/firestoreBudget.ts
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Expense } from '../components/ExpensesTable';

export async function fetchExpenses(userId: string): Promise<Expense[]> {
  const expensesRef = collection(db, 'expenses');
  const q = query(expensesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(userId: string, expense: Omit<Expense, 'id'>): Promise<string> {
  const expensesRef = collection(db, 'expenses');
  const docRef = await addDoc(expensesRef, { ...expense, userId });
  return docRef.id;
}

export async function removeExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

export async function updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
  await updateDoc(doc(db, 'expenses', expenseId), updates);
}

// Savings Goal
export async function fetchSavingsGoal(userId: string): Promise<{ name: string; target: number } | null> {
  const goalRef = doc(db, 'savingsGoals', userId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return null;
  return goalSnap.data() as { name: string; target: number };
}

export async function setSavingsGoal(userId: string, goal: { name: string; target: number }): Promise<void> {
  await setDoc(doc(db, 'savingsGoals', userId), goal);
}

export async function removeSavingsGoal(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'savingsGoals', userId));
}
