// src/hooks/useBudget.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const useBudget = () => {
  const [budgetLimit, setBudgetLimit] = useState(
    parseFloat(localStorage.getItem('budgetLimit')) || 3500
  ); // Default budget limit
  const [lastReset, setLastReset] = useState(new Date().getMonth());

  // Automatically adjust the warning threshold when budget limit changes
  const checkBudgetWarning = useCallback((currentExpenditure) => {
    const warningThreshold = budgetLimit - 500; // 500 shekels below the limit
    if (currentExpenditure >= warningThreshold) {
      toast.warn('You are close to the budget limit!');
    }
  }, [budgetLimit]);

  // Reset budget at the start of each new month
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (currentMonth !== lastReset) {
      setLastReset(currentMonth);
      setBudgetLimit(3500); // Reset to default or desired initial limit
      toast.info('Budget has been reset for the new month!');
    }
  }, [lastReset]);

  // Save budget limit to local storage
  useEffect(() => {
    localStorage.setItem('budgetLimit', budgetLimit);
  }, [budgetLimit]);

  const updateBudgetLimit = (newLimit) => {
    setBudgetLimit(newLimit);
    toast.success('Budget limit updated successfully!');
  };

  return {
    budgetLimit,
    setBudgetLimit: updateBudgetLimit,
    checkBudgetWarning,
  };
};

export default useBudget;
