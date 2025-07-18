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
// Shared savings goals
export async function fetchSharedGoals(groupId: string): Promise<Array<{ id: string; name: string; target: number }>> {
  const goalsRef = collection(db, 'goals');
  const q = query(goalsRef, where('groupId', '==', groupId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string; target: number }));
}

export async function addSharedGoal(groupId: string, goal: { name: string; target: number }): Promise<string> {
  const goalsRef = collection(db, 'goals');
  const docRef = await addDoc(goalsRef, { ...goal, groupId });
  return docRef.id;
}

export async function removeSharedGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'goals', goalId));
}

export async function updateSharedGoal(goalId: string, updates: Partial<{ name: string; target: number }>): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), updates);
}
