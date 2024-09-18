// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import Balance from './components/Balance';
import TransactionTable from './components/TransactionTable';
import IncomeExpenseChart from './components/IncomeExpenseChart';
import MonthlySummary from './components/MonthlySummary';
import CSVExport from './components/CSVExport';
import LanguageSwitcher from './components/LanguageSwitcher';
import TransactionTablePage from './components/TransactionTablePage'; // Import the new page component
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Container,
  AppBar,
  Toolbar,
  Grid,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Switch,
  styled,
  CssBaseline,
  useMediaQuery,
  Fab,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PasswordLock from './components/PasswordLock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <ThemedApp />
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

const ThemedApp = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentTranslations } = useLanguage();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isIosPromptVisible, setIsIosPromptVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load functions adapted to store data segmented by year and month
  const loadInitialCapital = (year) => {
    const storedCapital = localStorage.getItem(`initialCapital_${year}`);
    return storedCapital ? parseFloat(storedCapital) : 0;
  };

  const loadTransactions = (year) => {
    const storedTransactions = localStorage.getItem(`transactions_${year}`);
    return storedTransactions ? JSON.parse(storedTransactions) : [];
  };

  const currentYear = new Date().getFullYear();

  const [initialCapital, setInitialCapital] = useState(loadInitialCapital(currentYear));
  const [transactions, setTransactions] = useState(loadTransactions(currentYear));
  const [recurringTransactions, setRecurringTransactions] = useState(loadTransactions(currentYear));
  const [filterCriteria] = useState({});
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // State for date filtering shared between TransactionTable and MonthlySummary
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Month index starts from 0

  const handleUnlock = () => {
    setIsAppUnlocked(true);
  };

  // Save functions adapted to store data segmented by year
  useEffect(() => {
    localStorage.setItem(`initialCapital_${currentYear}`, initialCapital);
  }, [initialCapital, currentYear]);

  useEffect(() => {
    localStorage.setItem(`transactions_${currentYear}`, JSON.stringify(transactions));
  }, [transactions, currentYear]);

  useEffect(() => {
    localStorage.setItem(`recurringTransactions_${currentYear}`, JSON.stringify(recurringTransactions));
  }, [recurringTransactions, currentYear]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDialogOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (isIOS()) {
      setIsIosPromptVisible(true);
    }
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setDialogOpen(false);
      });
    }
  };

  const handleCloseIosPrompt = () => {
    setIsIosPromptVisible(false);
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toLocaleString(),
    };

    if (transaction.isRecurring) {
      setRecurringTransactions((prevRecurring) => {
        const newRecurring = [...prevRecurring, newTransaction];
        localStorage.setItem(`recurringTransactions_${currentYear}`, JSON.stringify(newRecurring));
        return newRecurring;
      });
    }

    setTransactions((prevTransactions) => {
      const updatedTransactions = [...prevTransactions, newTransaction];
      localStorage.setItem(`transactions_${currentYear}`, JSON.stringify(updatedTransactions));
      return updatedTransactions;
    });

    toast.success(currentTranslations.transactionAdded);
  };

  const processRecurringTransactions = useCallback(() => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    const newTransactions = recurringTransactions
      .filter((recTransaction) => recTransaction.recurringDay === currentDay)
      .map((recTransaction) => ({
        ...recTransaction,
        date: new Date().toISOString().split('T')[0],
        id: transactions.length + 1,
      }));

    if (newTransactions.length > 0) {
      setTransactions((prevTransactions) => {
        const updatedTransactions = [...prevTransactions, ...newTransactions];
        localStorage.setItem(`transactions_${currentYear}`, JSON.stringify(updatedTransactions));
        return updatedTransactions;
      });
      toast.info('Recurring transactions processed for today.');
    }
  }, [recurringTransactions, transactions, currentYear]);

  useEffect(() => {
    const currentDate = new Date();
    const storedLastProcessed = localStorage.getItem('lastProcessedDate');
    const lastProcessedDate = storedLastProcessed ? new Date(storedLastProcessed) : null;

    if (!lastProcessedDate || lastProcessedDate.getDate() !== currentDate.getDate()) {
      processRecurringTransactions();
      localStorage.setItem('lastProcessedDate', currentDate.toISOString());
    }
  }, [processRecurringTransactions]);

  const editTransaction = (updatedTransaction) => {
    setTransactions(
      transactions.map((transaction) =>
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      )
    );
  };

  const deleteTransaction = (id) => {
    if (window.confirm(currentTranslations.deleteConfirmation)) {
      setTransactions(transactions.filter((transaction) => transaction.id !== id));
      setRecurringTransactions(recurringTransactions.filter((transaction) => transaction.id !== id));
      toast.info(currentTranslations.transactionDeleted);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const dateMatch =
      (!filterCriteria.startDate || new Date(transaction.date) >= new Date(filterCriteria.startDate)) &&
      (!filterCriteria.endDate || new Date(transaction.date) <= new Date(filterCriteria.endDate));
    const categoryMatch = !filterCriteria.category || transaction.category === filterCriteria.category;
    const typeMatch = !filterCriteria.type || transaction.type === filterCriteria.type;
    return dateMatch && categoryMatch && typeMatch;
  });

  const FuturisticSwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
      margin: 1,
      padding: 0,
      transform: 'translateX(6px)',
      '&.Mui-checked': {
        color: '#fff',
        transform: 'translateX(22px)',
        '& .MuiSwitch-thumb:before': {
          content: "'☀️'",
          position: 'absolute',
          top: 8,
          left: 6,
          fontSize: 14,
        },
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
          opacity: 1,
          border: 0,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
      width: 32,
      height: 32,
      '&:before': {
        content: "'🌙'",
        position: 'absolute',
        top: 8,
        left: 8,
        fontSize: 14,
      },
    },
    '& .MuiSwitch-track': {
      borderRadius: 20 / 2,
      backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }));

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleClearAllData = () => {
    setClearDialogOpen(true);
  };

  const confirmClearAllData = () => {
    // Calculate the current balance from transactions
    const currentBalance = transactions.reduce((acc, transaction) => {
      return transaction.type === 'Income' ? acc + transaction.amount : acc - transaction.amount;
    }, initialCapital);

    // Set the initial capital to the current balance
    setInitialCapital(currentBalance);
    localStorage.setItem(`initialCapital_${currentYear}`, currentBalance);

    // Clear all transaction data
    setTransactions([]);
    setRecurringTransactions([]);
    localStorage.removeItem(`transactions_${currentYear}`);
    localStorage.removeItem(`recurringTransactions_${currentYear}`);

    toast.info(currentTranslations.allDataCleared);
    setClearDialogOpen(false);
  };

  const cancelClearAllData = () => {
    setClearDialogOpen(false);
  };

  const isIOS = () => {
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const commonButtonStyle = {
    minWidth: isSmallScreen ? 120 : 160,
    height: 40,
    fontSize: isSmallScreen ? '0.8rem' : '1rem',
  };

  return (
    <Container maxWidth={isMediumScreen ? 'md' : 'lg'} sx={{ mt: 5 }}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <AppBar position="sticky" color="primary" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FinanceTracker
          </Typography>
          <IconButton color="inherit" onClick={handleDrawerOpen}>
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
            <Box
              sx={{ width: 250 }}
              role="presentation"
              onClick={handleDrawerClose}
              onKeyDown={handleDrawerClose}
            >
              <List>
                <ListItem button component={Link} to="/">
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <AccountBalanceWalletIcon />
                  </ListItemIcon>
                  <ListItemText primary={currentTranslations.financeTracker} />
                </ListItem>
                <ListItem>
                  <LanguageSwitcher />
                </ListItem>
                <ListItem>
                  <FuturisticSwitch
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                    inputProps={{ 'aria-label': 'toggle theme' }}
                  />
                </ListItem>
                {/* Add Export and Delete buttons for both small and large screens */}
                <Divider />
                <ListItem>
                  <CSVExport transactions={transactions} sx={commonButtonStyle} />
                </ListItem>
                <ListItem>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClearAllData}
                    sx={commonButtonStyle}
                  >
                    {currentTranslations.deleteAllData}
                  </Button>
                </ListItem>
              </List>
            </Box>
          </Drawer>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route
          path="/"
          element={
            !isAppUnlocked ? (
              <PasswordLock
                onUnlock={handleUnlock}
                initialBalance={initialCapital}
                transactions={transactions}
              />
            ) : (
              <Box sx={{ my: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ position: 'sticky', top: 64, zIndex: 1000, bgcolor: 'background.paper', mb: 2 }}>
                      <Balance
                        transactions={transactions}
                        initialCapital={initialCapital}
                        updateInitialCapital={setInitialCapital}
                      />
                    </Box>
                    {/* Removed AddTransactionForm from here */}
                    <TransactionTable
                      transactions={filteredTransactions} // Filtering transactions as per criteria
                      addTransaction={addTransaction} // Passing addTransaction function
                      editTransaction={editTransaction}
                      deleteTransaction={deleteTransaction}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                      setSelectedYear={setSelectedYear}
                      setSelectedMonth={setSelectedMonth}
                    />
                    <MonthlySummary
                      transactions={filteredTransactions}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <IncomeExpenseChart transactions={transactions} />
                  </Grid>
                </Grid>
              </Box>
            )
          }
        />
        {/* New Route for Transaction Table Page */}
        <Route
          path="/transactions"
          element={
            <TransactionTablePage
              transactions={transactions}
              editTransaction={editTransaction}
              deleteTransaction={deleteTransaction}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              setSelectedYear={setSelectedYear}
              setSelectedMonth={setSelectedMonth}
            />
          }
        />
      </Routes>

      <Dialog
        open={clearDialogOpen}
        onClose={cancelClearAllData}
        aria-labelledby="clear-data-dialog-title"
        aria-describedby="clear-data-dialog-description"
      >
        <DialogTitle id="clear-data-dialog-title">
          {currentTranslations.deleteAllData}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-data-dialog-description">
            {currentTranslations.deleteConfirmation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClearAllData} color="primary">
            {currentTranslations.exit}
          </Button>
          <Button onClick={confirmClearAllData} color="error">
            {currentTranslations.deleteAllData}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="install-dialog-title"
        aria-describedby="install-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="install-dialog-title">{currentTranslations.installWebApp}</DialogTitle>
        <DialogContent>
          <DialogContentText id="install-dialog-description">
            {currentTranslations.installWebAppDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            {currentTranslations.exit}
          </Button>
          <Button onClick={handleInstallClick} color="primary" autoFocus>
            {currentTranslations.installWebApp}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isIosPromptVisible}
        onClose={handleCloseIosPrompt}
        aria-labelledby="ios-instructions-title"
        aria-describedby="ios-instructions-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="ios-instructions-title">{currentTranslations.addToHomeScreen}</DialogTitle>
        <DialogContent>
          <DialogContentText id="ios-instructions-description">
            {currentTranslations.addToHomeScreenDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIosPrompt} color="primary">
            {currentTranslations.exit}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        onClick={scrollToTop}
        sx={{
          width: 52,
          height: 52,
          position: 'fixed',
          bottom: 16,
          right: 41,
          zIndex: 1000,
        }}
        aria-label="scroll back to top"
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Container>
  );
};

export default App;
