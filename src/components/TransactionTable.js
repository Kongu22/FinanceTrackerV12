import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Doughnut } from 'react-chartjs-2';
import AddTransactionForm from './AddTransactionForm'; // Import the AddTransactionForm
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartJSTooltip,
  Legend,
} from 'chart.js';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  IconButton,
  Modal,
  useTheme,
  useMediaQuery,
  Tooltip,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaSyncAlt, FaPlus, FaCheck, FaTimes } from 'react-icons/fa'; // Import FaPlus, FaCheck, and FaTimes icons
import StyledIconWrapper from './StyledIconWrapper';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import HomeIcon from '@mui/icons-material/Home';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MovieIcon from '@mui/icons-material/Movie';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SchoolIcon from '@mui/icons-material/School';
import FlightIcon from '@mui/icons-material/Flight';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Register the necessary components for Chart.js
ChartJS.register(ArcElement, ChartJSTooltip, Legend);

// Center text plugin
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    const centerTextOptions = chart.config.options.plugins.centerText;
    if (!centerTextOptions || !centerTextOptions.text) return;

    ctx.save();
    ctx.font = `${centerTextOptions.font.weight} ${centerTextOptions.font.size}px Arial`;
    ctx.fillStyle = centerTextOptions.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerTextOptions.text, width / 2, height / 2);
    ctx.restore(); // Add this to restore the context
  },
};

ChartJS.register(centerTextPlugin);

const categoryIcons = {
  food: <FastfoodIcon />,
  rent: <HomeIcon />,
  utilities: <LocalGasStationIcon />,
  entertainment: <MovieIcon />,
  transport: <LocalGasStationIcon />,
  health: <HealthAndSafetyIcon />,
  misc: <MoreHorizIcon />,
  salary: <AttachMoneyIcon />,
  bonus: <AttachMoneyIcon />,
  other: <MoreHorizIcon />,
  shopping: <ShoppingCartIcon />,
  education: <SchoolIcon />,
  travel: <FlightIcon />,
  bills: <ReceiptIcon />,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6666', '#FF99CC', '#66CCCC', '#FF9933', '#FFCC99', '#66FF66'];

const TransactionTable = ({ transactions, addTransaction, editTransaction, deleteTransaction }) => {
  const { currentTranslations } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    description: '',
    amount: '',
    date: '',
    type: '',
    category: '',
    isRecurring: false,
    recurringDay: '',
    recurringStartDate: '',
    recurringEndDate: '',
  });
  const [isTableVisible, setIsTableVisible] = useState(false); // State to control table visibility
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false); // State to control form visibility

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditData({
      ...transaction,
      recurringDay: transaction.recurringDay || '',
      recurringStartDate: transaction.recurringStartDate || '',
      recurringEndDate: transaction.recurringEndDate || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const saveEdit = () => {
    const updatedTransaction = {
      ...editData,
      amount: parseFloat(editData.amount),
    };
    editTransaction(updatedTransaction);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      description: '',
      amount: '',
      date: '',
      type: '',
      category: '',
      isRecurring: false,
      recurringDay: '',
      recurringStartDate: '',
      recurringEndDate: '',
    });
  };

  const toggleAddTransactionForm = () => {
    setIsAddTransactionOpen(!isAddTransactionOpen);
  };

  // Correctly handle adding a transaction
  const handleAddTransaction = (transaction) => {
    if (typeof addTransaction === 'function') {
      addTransaction(transaction);  // Ensure this is a function call
      setIsAddTransactionOpen(false); // Close the form modal
    } else {
      console.error("addTransaction is not a function", { addTransaction });
    }
  };

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  // Determine the total color based on income and expenses
  const totalColor = totalIncome > totalExpenses ? 'green' : 'red';

  const data = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'Expense') {
      const existingCategory = acc.find((item) => item.name === transaction.category);
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        acc.push({ name: transaction.category, value: transaction.amount });
      }
    }
    return acc;
  }, []);

  // Prepare data for the Doughnut chart
  const pieData = {
    labels: data.map((entry) => currentTranslations.categories[entry.name]),
    datasets: [
      {
        data: data.map((entry) => entry.value),
        backgroundColor: COLORS,
        hoverBackgroundColor: COLORS.map((color) => `${color}B3`), // Add transparency on hover
        borderWidth: 1,
        borderDash: [5, 5], // Dashed border for styling
      },
    ],
  };

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ₪${context.raw.toFixed(2)}`,
        },
      },
      legend: {
        display: false,
      },
      // Center text plugin configuration
      centerText: {
        display: true,
        text: `₪${totalExpenses.toFixed(2)}`,
        color: totalColor, // Apply the color based on total income vs expenses
        font: {
          size: isMobile ? 29 : 20, // Font size responsive to screen size
          weight: 'bold',
        },
      },
    },
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
      },
    },
    cutout: '70%', // Adjust the cutout percentage to place text within the doughnut
  };

  const handlePieClick = () => {
    setIsTableVisible(!isTableVisible); // Toggle the visibility of the transaction table
  };

  return (
    <>
      {/* Pie Chart and Add Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          position: 'relative',
        }}
      >
        {/* Pie Chart with click handler */}
        <Box
          sx={{ width: isLargeScreen ? '40%' : '80%', height: isMobile ? 280 : 250 }}
          onClick={handlePieClick} // Attach click handler only to pie chart
        >
          <Doughnut data={pieData} options={pieOptions} />
        </Box>
        {/* Add Button with separate click handler */}
        <IconButton
          onClick={toggleAddTransactionForm}
          sx={{
            position: 'absolute',
            right: 25,
            top: '87%',
            transform: 'translateY(-50%)',
            backgroundColor: 'primary.main',
            width: 51, // Adjust width
            height: 51, // Adjust height
            '&:hover': {
              backgroundColor: 'primary.dark', // Optional: add a hover effect
            },
          }}
        >
          <FaPlus color="white" size={24} /> {/* Adjust the size prop if needed */}
        </IconButton>
      </Box>

      {/* Add Transaction Form Modal */}
      <Modal
        open={isAddTransactionOpen}
        onClose={toggleAddTransactionForm}
        aria-labelledby="add-transaction-modal"
        aria-describedby="add-transaction-form"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : '50%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <AddTransactionForm addTransaction={handleAddTransaction} setFilterCriteria={() => {}} />
        </Box>
      </Modal>

      {/* Transaction Table */}
      {isTableVisible && (
        <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflowY: 'auto', mt: 3 }}>
          <Table stickyHeader size={isMobile ? 'small' : 'medium'} aria-label="transaction table">
            <TableHead>
              <TableRow>
                <TableCell>{currentTranslations.date}</TableCell>
                <TableCell>{currentTranslations.description}</TableCell>
                <TableCell>{currentTranslations.type}</TableCell>
                <TableCell>{currentTranslations.category}</TableCell>
                <TableCell>{currentTranslations.amount}</TableCell>
                {!isMobile && <TableCell>{currentTranslations.timestamp}</TableCell>}
                <TableCell>{currentTranslations.actions}</TableCell>
                <TableCell>{currentTranslations.recurring}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{
                    bgcolor: transaction.type === 'Income' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  }}
                >
                  {editingId === transaction.id ? (
                    <TableCell colSpan={8}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Box component="form" sx={{ width: isMobile ? '100%' : '80%', maxWidth: 400, mx: 'auto' }}>
                          <Grid container spacing={2}>
                            {/* Editing Form Inputs */}
                            <Grid item xs={12}>
                              <TextField
                                label={currentTranslations.date}
                                type="date"
                                name="date"
                                value={editData.date}
                                onChange={handleEditChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                size={isMobile ? 'small' : 'medium'}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label={currentTranslations.description}
                                name="description"
                                value={editData.description}
                                onChange={handleEditChange}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Select
                                label={currentTranslations.type}
                                name="type"
                                value={editData.type}
                                onChange={handleEditChange}
                                fullWidth
                                variant="outlined"
                                size={isMobile ? 'small' : 'medium'}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StyledIconWrapper>
                                      {selected === 'Income' ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />}
                                    </StyledIconWrapper>
                                    <Box sx={{ ml: 1 }}>
                                      {selected === 'Income' ? currentTranslations.income : currentTranslations.expenses}
                                    </Box>
                                  </Box>
                                )}
                              >
                                <MenuItem value="Income">
                                  <StyledIconWrapper>
                                    <FaArrowUp color="green" />
                                  </StyledIconWrapper>
                                  <Box sx={{ ml: 1 }}>{currentTranslations.income}</Box>
                                </MenuItem>
                                <MenuItem value="Expense">
                                  <StyledIconWrapper>
                                    <FaArrowDown color="red" />
                                  </StyledIconWrapper>
                                  <Box sx={{ ml: 1 }}>{currentTranslations.expenses}</Box>
                                </MenuItem>
                              </Select>
                            </Grid>
                            <Grid item xs={12}>
                              <Select
                                label={currentTranslations.category}
                                name="category"
                                value={editData.category}
                                onChange={handleEditChange}
                                fullWidth
                                variant="outlined"
                                size={isMobile ? 'small' : 'medium'}
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StyledIconWrapper>{categoryIcons[selected]}</StyledIconWrapper>
                                    <Box sx={{ ml: 1 }}>{currentTranslations.categories[selected]}</Box>
                                  </Box>
                                )}
                              >
                                {Object.keys(currentTranslations.categories).map((key) => (
                                  <MenuItem key={key} value={key}>
                                    <StyledIconWrapper>{categoryIcons[key]}</StyledIconWrapper>
                                    <Box sx={{ ml: 1 }}>{currentTranslations.categories[key]}</Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label={currentTranslations.amount}
                                type="number"
                                name="amount"
                                value={editData.amount}
                                onChange={handleEditChange}
                                fullWidth
                                size={isMobile ? 'small' : 'medium'}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={editData.isRecurring}
                                    onChange={handleEditChange}
                                    name="isRecurring"
                                  />
                                }
                                label={currentTranslations.recurringCheckboxLabel}
                              />
                            </Grid>
                            {editData.isRecurring && (
                              <>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Start Date"
                                    type="date"
                                    name="recurringStartDate"
                                    value={editData.recurringStartDate}
                                    onChange={handleEditChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? 'small' : 'medium'}
                                    helperText="Select the start date for the recurring transaction"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="Recurring Day"
                                    type="number"
                                    name="recurringDay"
                                    value={editData.recurringDay}
                                    onChange={handleEditChange}
                                    fullWidth
                                    size={isMobile ? 'small' : 'medium'}
                                    helperText="Enter the day of the month for the recurring transaction"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    label="End Date"
                                    type="date"
                                    name="recurringEndDate"
                                    value={editData.recurringEndDate}
                                    onChange={handleEditChange}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    size={isMobile ? 'small' : 'medium'}
                                    helperText="Select the end date for the recurring transaction"
                                  />
                                </Grid>
                              </>
                            )}
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Button onClick={saveEdit} sx={{ mr: 2 }} variant="contained" color="primary">
                                  <StyledIconWrapper>
                                    <FaCheck />
                                  </StyledIconWrapper>
                                </Button>
                                <Button onClick={cancelEdit} variant="contained" color="secondary">
                                  <StyledIconWrapper>
                                    <FaTimes />
                                  </StyledIconWrapper>
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledIconWrapper>
                            {transaction.type === 'Income' ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />}
                          </StyledIconWrapper>
                          <Box sx={{ ml: 1 }}>
                            {transaction.type === 'Income' ? currentTranslations.income : currentTranslations.expenses}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledIconWrapper>
                            {categoryIcons[transaction.category] || <MoreHorizIcon />}
                          </StyledIconWrapper>
                          <Box sx={{ ml: 1 }}>{currentTranslations.categories[transaction.category]}</Box>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          color: transaction.type === 'Income' ? 'green' : 'red',
                        }}
                      >
                        ₪{Number(transaction.amount).toFixed(2)}
                      </TableCell>
                      {!isMobile && <TableCell>{transaction.timestamp}</TableCell>}
                      <TableCell>
                        <Tooltip title={currentTranslations.updateBalance} arrow>
                          <Button onClick={() => handleEdit(transaction)} sx={{ minWidth: 36 }}>
                            <FaEdit />
                          </Button>
                        </Tooltip>
                        <Tooltip title={currentTranslations.transactionDeleted} arrow>
                          <Button onClick={() => deleteTransaction(transaction.id)} sx={{ minWidth: 36 }} color="error">
                            <FaTrash />
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {transaction.isRecurring && (
                          <Tooltip title={currentTranslations.recurringTooltip} arrow>
                            <StyledIconWrapper>
                              <FaSyncAlt style={{ color: 'green' }} />
                            </StyledIconWrapper>
                          </Tooltip>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default TransactionTable;
