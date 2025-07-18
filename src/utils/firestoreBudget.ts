// Budget CRUD for group
export type BudgetCategory = {
  housing: number;
  food: number;
  utilities: number;
  entertainment: number;
  healthcare: number;
  miscellaneous: number;
  transportation: number;
  insurance: number;
  education: number;
  childcare: number;
  debt: number;
  savings: number;
  personal: number;
};

export type GroupBudget = {
  id?: string;
  groupId: string;
  month: number;
  year: number;
  expectedIncome: number;
  categories: BudgetCategory;
  expectedSavings: number;
};

export async function createGroupBudget(groupId: string, month: number, year: number, expectedIncome: number, categories: Partial<BudgetCategory>): Promise<string> {
  const fullCategories: BudgetCategory = {
    housing: categories.housing ?? 0,
    food: categories.food ?? 0,
    utilities: categories.utilities ?? 0,
    entertainment: categories.entertainment ?? 0,
    healthcare: categories.healthcare ?? 0,
    miscellaneous: categories.miscellaneous ?? 0,
    transportation: categories.transportation ?? 0,
    insurance: categories.insurance ?? 0,
    education: categories.education ?? 0,
    childcare: categories.childcare ?? 0,
    debt: categories.debt ?? 0,
    savings: categories.savings ?? 0,
    personal: categories.personal ?? 0,
  };
  const expectedSavings = expectedIncome - Object.values(fullCategories).reduce((a, b) => a + b, 0);
  const budgetsRef = collection(db, 'budgets');
  const docRef = await addDoc(budgetsRef, {
    groupId,
    month,
    year,
    expectedIncome,
    categories: fullCategories,
    expectedSavings,
  });
  return docRef.id;
}

export async function fetchGroupBudget(groupId: string, month: number, year: number): Promise<GroupBudget | null> {
  const budgetsRef = collection(db, 'budgets');
  const q = query(budgetsRef, where('groupId', '==', groupId), where('month', '==', month), where('year', '==', year));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { id: snapshot.docs[0].id, ...docData } as GroupBudget;
}

export async function updateGroupBudget(budgetId: string, updates: Partial<GroupBudget>): Promise<void> {
  await updateDoc(doc(db, 'budgets', budgetId), updates);
}

export async function listGroupBudgets(groupId: string): Promise<GroupBudget[]> {
  const budgetsRef = collection(db, 'budgets');
  const q = query(budgetsRef, where('groupId', '==', groupId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupBudget));
}
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
} from 'firebase/firestore';
import type { Expense } from '../components/ExpensesTable';

export async function fetchExpenses(groupId: string): Promise<Expense[]> {
  const expensesRef = collection(db, 'expenses');
  const q = query(expensesRef, where('groupId', '==', groupId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(groupId: string, expense: Omit<Expense, 'id' | 'groupId'>): Promise<string> {
  try {
    const expensesRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesRef, { ...expense, groupId });
    console.log('Expense added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
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
  try {
    const goalsRef = collection(db, 'goals');
    const docRef = await addDoc(goalsRef, { ...goal, groupId });
    console.log('Shared goal added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding shared goal:', error);
    throw error;
  }
}

export async function removeSharedGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'goals', goalId));
}

export async function updateSharedGoal(goalId: string, updates: Partial<{ name: string; target: number }>): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), updates);
}
