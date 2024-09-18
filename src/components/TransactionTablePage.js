// src/components/TransactionTablePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionTable from './TransactionTable';
import { Box, Button, Container, Typography } from '@mui/material';

const TransactionTablePage = ({ transactions, editTransaction, deleteTransaction, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth }) => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Transactions
      </Typography>
      <TransactionTable
        transactions={transactions}
        editTransaction={editTransaction}
        deleteTransaction={deleteTransaction}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        setSelectedYear={setSelectedYear}
        setSelectedMonth={setSelectedMonth}
      />
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Back to Main App
        </Button>
      </Box>
    </Container>
  );
};

export default TransactionTablePage;
