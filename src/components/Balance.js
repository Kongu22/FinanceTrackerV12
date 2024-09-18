// src/components/Balance.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  LinearProgress,
} from '@mui/material';
import { useLanguage } from './LanguageContext';
import { toast } from 'react-toastify';
import { FaBars } from 'react-icons/fa';
import StyledIconWrapper from './StyledIconWrapper';
import useBudget from '../hooks/useBudget'; // Import the budget hook

const Balance = ({ transactions, initialCapital, updateInitialCapital }) => {
  const { currentTranslations } = useLanguage();
  const [newBalance, setNewBalance] = useState(initialCapital);
  const [showUpdateSection, setShowUpdateSection] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Use the budget management hook
  const { budgetLimit, setBudgetLimit, checkBudgetWarning } = useBudget();

  // Calculate the current balance based on initial capital and transactions
  const balance = transactions.reduce((acc, transaction) => {
    return transaction.type === 'Income'
      ? acc + transaction.amount
      : transaction.type === 'Expense'
      ? acc - transaction.amount
      : acc;
  }, initialCapital);

  // Calculate the current month's expenditures
  const currentMonthExpenditures = transactions.reduce((acc, transaction) => {
    return transaction.type === 'Expense' ? acc + transaction.amount : acc;
  }, 0);

  // Synchronize the balance when the initial capital changes
  useEffect(() => {
    setNewBalance(initialCapital);
  }, [initialCapital]);

  // Check if the user is close to the budget limit
  useEffect(() => {
    checkBudgetWarning(currentMonthExpenditures);
  }, [currentMonthExpenditures, checkBudgetWarning]);

  const handleBalanceChange = (e) => {
    setNewBalance(parseFloat(e.target.value) || 0);
  };

  // Update the initial capital with the current balance value
  const updateBalance = () => {
    updateInitialCapital(newBalance); // Update the initial capital in the parent component
    toast.success(currentTranslations.balanceUpdated);
  };

  // Toggle the visibility of the update section
  const toggleUpdateSection = () => {
    setShowUpdateSection((prev) => !prev);
  };

  // Handle budget limit change
  const handleBudgetLimitChange = (e) => {
    const newLimit = parseFloat(e.target.value) || 0;
    setBudgetLimit(newLimit);
  };

  // Determine the color based on the balance value
  const balanceColor = isNaN(balance) || balance === 0 ? 'white' : balance > 0 ? 'green' : 'red';

  // Calculate progress percentage towards the budget limit
  const progress = Math.min((currentMonthExpenditures / budgetLimit) * 100, 100);

  return (
    <Card sx={{ mb: 3, position: 'sticky', top: 0, zIndex: 1000 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant={isMobile ? 'h6' : 'h5'} component="h5" gutterBottom>
            {currentTranslations.currentBalance}: <span style={{ fontWeight: 'bold', color: balanceColor }}>₪{isNaN(balance) ? '0.00' : balance.toFixed(2)}</span>
          </Typography>
          <IconButton onClick={toggleUpdateSection} sx={{ ml: 2, mt: isMobile ? -0.5 : 0 }}>
            <StyledIconWrapper>
              <FaBars />
            </StyledIconWrapper>
          </IconButton>
        </Box>

        {showUpdateSection && (
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 2,
            }}
            noValidate
            autoComplete="off"
          >
            <TextField
              type="number"
              label={currentTranslations.setNewBalance}
              value={newBalance}
              onChange={handleBalanceChange}
              fullWidth
              size={isMobile ? 'small' : 'medium'}
            />
            <Button variant="outlined" onClick={updateBalance} size={isMobile ? 'small' : 'medium'}>
              {currentTranslations.updateBalance}
            </Button>

            {/* Input for updating the budget limit */}
            <TextField
              type="number"
              label={currentTranslations.budgetLimit}
              value={budgetLimit}
              onChange={handleBudgetLimitChange}
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        {/* Display progress bar */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            {currentTranslations.budgetLimit}: ₪{budgetLimit.toFixed(2)}
          </Typography>
          <LinearProgress variant="determinate" value={progress} color={progress >= 100 ? 'error' : 'primary'} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {currentTranslations.currentExpenditure}: ₪{currentMonthExpenditures.toFixed(2)} / ₪{budgetLimit.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Balance;
