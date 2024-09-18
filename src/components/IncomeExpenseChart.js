// src/components/IncomeExpenseChart.js
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '@mui/material/styles';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const IncomeExpenseChart = ({ transactions }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const theme = useTheme(); // Access theme for consistent styling

  useEffect(() => {
    const calculateMonthlyTotals = (type) => {
      const monthlyTotals = Array(12).fill(0);

      transactions.forEach((transaction) => {
        const month = new Date(transaction.date).getMonth();
        if (transaction.type === type) {
          monthlyTotals[month] += transaction.amount;
        }
      });

      return monthlyTotals;
    };

    const incomeData = calculateMonthlyTotals('Income');
    const expenseData = calculateMonthlyTotals('Expense');

    setChartData({
      labels: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      datasets: [
        {
          label: 'Income',
          backgroundColor: 'rgba(75, 192, 192, 0.6)', // Greenish gradient
          hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)', // Darker on hover
          data: incomeData,
          barPercentage: 0.5,
          categoryPercentage: 0.8,
          borderRadius: 4, // Rounded corners for bars
        },
        {
          label: 'Expenses',
          backgroundColor: 'rgba(255, 99, 132, 0.6)', // Reddish gradient
          hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)', // Darker on hover
          data: expenseData,
          barPercentage: 0.5,
          categoryPercentage: 0.8,
          borderRadius: 4, // Rounded corners for bars
        }
      ]
    });
  }, [transactions]);

  const options = {
    indexAxis: 'y', // Horizontal bars
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: theme.palette.text.primary, // Dynamic color based on theme
          font: {
            size: 12,
          },
        },
        grid: {
          display: false, // Hide grid lines for cleaner look
        },
      },
      y: {
        ticks: {
          color: theme.palette.text.primary, // Dynamic color based on theme
          font: {
            size: 12,
          },
        },
        grid: {
          borderDash: [5, 5], // Dashed lines for y-axis
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: theme.palette.text.primary, // Dynamic color based on theme
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper, // Consistent tooltip background
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  };

  return (
    <div className="w-100" style={{ height: '90vh' }}>
      <h3 className="text-center" style={{ marginBottom: '20px', color: theme.palette.text.primary }}>
        Monthly Overview
      </h3>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default IncomeExpenseChart;
