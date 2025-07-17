import React from 'react';

const ExpensesTable: React.FC = () => {
  // TODO: Implement expense list, add/remove/filter, and show individual contributions
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Expenses</h2>
      {/* Expense table and controls will go here */}
      <p className="text-gray-500">No expenses yet.</p>
    </div>
  );
};

export default ExpensesTable;
