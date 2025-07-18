import React from 'react';

const BudgetAnalyzer: React.FC = () => {
  // TODO: Analyze expenses and show if under/over budget for the month
  return (
    <div className="p-4 bg-[#2c3136] rounded shadow">
      <h2 className="text-xl font-bold mb-4">Budget Analyzer</h2>
      {/* Budget analysis results will go here */}
      <p className="text-gray-500">No data to analyze yet.</p>
    </div>
  );
};

export default BudgetAnalyzer;
