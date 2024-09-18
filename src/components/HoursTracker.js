import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  IconButton, 
} from '@mui/material';
import { Edit, Delete, Save, Add, RemoveCircle } from '@mui/icons-material'; // Added RemoveCircle for break deletion
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useLanguage } from './LanguageContext';
import { useTheme } from '@mui/material/styles';

const HoursTracker = () => {
  const { currentTranslations } = useLanguage();
  const theme = useTheme();

  const [entries, setEntries] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(60); // Default hourly rate
  const [editingId, setEditingId] = useState(null);
  const [editingBreaks, setEditingBreaks] = useState([]); // Breaks during editing
  const [monthlySummaryOpen, setMonthlySummaryOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('MMMM'));
  
  const [manualStartTime, setManualStartTime] = useState(null);
  const [manualEndTime, setManualEndTime] = useState(null);
  const [breaks, setBreaks] = useState([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem('hoursEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('hoursEntries', JSON.stringify(entries));
    } else {
      localStorage.removeItem('hoursEntries'); // Clear storage when no entries exist
    }
  }, [entries]);

  const calculateHoursWorked = (start, end, totalBreakTimeInSeconds) => {
    const startTime = dayjs(start);
    const endTime = dayjs(end);

    const totalTimeInSeconds = endTime.diff(startTime, 'second') - totalBreakTimeInSeconds;
    const finalTotalTimeInSeconds = Math.max(0, totalTimeInSeconds);

    const hours = Math.floor(finalTotalTimeInSeconds / 3600);
    const minutes = Math.floor((finalTotalTimeInSeconds % 3600) / 60);
    const seconds = finalTotalTimeInSeconds % 60;

    return { hours, minutes, seconds };
  };

  const calculateSalary = (hoursWorkedDecimal, hourlyRate) => {
    const regularHours = Math.min(hoursWorkedDecimal, 8); // Regular 8 hours
    const overtimeHours = Math.max(0, hoursWorkedDecimal - 8); // Overtime after 8 hours
    const overtimeRate = 1.25; // Overtime rate
    const extraOvertimeRate = 1.5; // Extra overtime rate

    const overtime1 = Math.min(overtimeHours, 2); // First 2 overtime hours
    const overtime2 = Math.max(0, Math.min(overtimeHours - 2, 2)); // Next 2 hours
    const remainingOvertime = Math.max(0, overtimeHours - 4); // Remaining overtime

    const regularSalary = regularHours * hourlyRate;
    const overtimeSalary1 = overtime1 * hourlyRate * overtimeRate;
    const overtimeSalary2 = overtime2 * hourlyRate * extraOvertimeRate;
    const extraOvertimeSalary = remainingOvertime * hourlyRate * extraOvertimeRate;

    return regularSalary + overtimeSalary1 + overtimeSalary2 + extraOvertimeSalary;
  };

  const handleAddEntry = () => {
    if (!manualStartTime || !manualEndTime) {
      toast.error(currentTranslations.enterStartAndEndTime);
      return;
    }

    const totalBreakTimeInSeconds = breaks.reduce((acc, breakItem) => {
      return acc + (dayjs(breakItem.end).diff(dayjs(breakItem.start), 'second') || 0);
    }, 0);

    const workedTime = calculateHoursWorked(manualStartTime, manualEndTime, totalBreakTimeInSeconds);
    const hoursWorkedDecimal = workedTime.hours + workedTime.minutes / 60 + workedTime.seconds / 3600;
    const totalSalary = calculateSalary(hoursWorkedDecimal, hourlyRate);

    const newEntry = {
      id: entries.length + 1,
      date: dayjs(manualStartTime).format('YYYY-MM-DD'),
      startTime: dayjs(manualStartTime).format('HH:mm:ss'),
      endTime: dayjs(manualEndTime).format('HH:mm:ss'),
      hoursWorked: workedTime,
      totalSalary,
      breaks,
    };

    setEntries([...entries, newEntry]);
    setManualStartTime(null);
    setManualEndTime(null);
    setBreaks([]);
    toast.success(currentTranslations.entryAdded);
  };

  const handleEdit = (id) => {
    const entryToEdit = entries.find((entry) => entry.id === id);
    setEditingId(id);
    setEditingBreaks(entryToEdit.breaks || []);
  };

  const handleSaveEdit = (id, date, startTime, endTime) => {
    const totalBreakTimeInSeconds = editingBreaks.reduce((acc, breakItem) => {
      return acc + (dayjs(breakItem.end).diff(dayjs(breakItem.start), 'second') || 0);
    }, 0);

    const workedTime = calculateHoursWorked(`${date}T${startTime}`, `${date}T${endTime}`, totalBreakTimeInSeconds);
    const hoursWorkedDecimal = workedTime.hours + workedTime.minutes / 60 + workedTime.seconds / 3600;
    const totalSalary = calculateSalary(hoursWorkedDecimal, hourlyRate);

    const updatedEntries = entries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            date,
            startTime,
            endTime,
            hoursWorked: workedTime,
            totalSalary,
            breaks: editingBreaks,
          }
        : entry
    );
    setEntries(updatedEntries);
    setEditingId(null);
    toast.success(currentTranslations.entryUpdated);
  };

  const handleDelete = (id) => {
    if (window.confirm(currentTranslations.deleteEntryConfirmation)) {
      const updatedEntries = entries.filter((entry) => entry.id !== id);
      setEntries(updatedEntries);
      toast.info(currentTranslations.entryDeleted);
    }
  };

  const handleOpenClearDialog = () => {
    setClearDialogOpen(true);
  };

  const handleCloseClearDialog = () => {
    setClearDialogOpen(false);
  };

  const handleClearAllData = () => {
    setEntries([]);
    localStorage.removeItem('hoursEntries');
    toast.info(currentTranslations.allDataCleared);
    handleCloseClearDialog();
  };

  const getMonthlySummary = () => {
    const summary = {};

    for (let month = 0; month < 12; month++) {
      const monthKey = dayjs().month(month).format('MMMM');
      summary[monthKey] = { hoursWorked: 0, totalSalary: 0 };
    }

    entries.forEach((entry) => {
      const month = dayjs(entry.date).format('MMMM');
      if (summary[month]) {
        summary[month].hoursWorked += entry.hoursWorked?.hours + entry.hoursWorked?.minutes / 60 + entry.hoursWorked?.seconds / 3600 || 0;
        summary[month].totalSalary += entry.totalSalary;
      }
    });

    return summary;
  };

  const monthlySummary = getMonthlySummary();

  const handleOpenMonthlySummary = () => {
    setMonthlySummaryOpen(true);
  };

  const handleCloseMonthlySummary = () => {
    setMonthlySummaryOpen(false);
  };

  const handleEditBreakTime = (index, field, value) => {
    setEditingBreaks((prevBreaks) =>
      prevBreaks.map((breakItem, i) =>
        i === index ? { ...breakItem, [field]: value } : breakItem
      )
    );
  };

  const handleDeleteBreak = (breakIndex) => {
    setEditingBreaks((prevBreaks) => prevBreaks.filter((_, i) => i !== breakIndex));
  };

  const handleAddBreak = () => {
    setEditingBreaks([...editingBreaks, { start: '', end: '' }]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{ mt: 4, maxWidth: 800, mx: "auto", p: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom textAlign="center">
            {currentTranslations.hoursTracker}
          </Typography>

          {/* Hourly Rate Input */}
          <Box mt={2} textAlign="center">
            <TextField
              label={currentTranslations.hourlyRate}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              type="number"
              variant="outlined"
              sx={{ width: 200 }}
            />
          </Box>

          {/* Manual Time Input */}
          <Box mt={4}>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
              <Grid item>
                <TextField
                  label={currentTranslations.startTime}
                  type="datetime-local"
                  value={manualStartTime || ''}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item>
                <TextField
                  label={currentTranslations.endTime}
                  type="datetime-local"
                  value={manualEndTime || ''}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddEntry}
                  disabled={!manualStartTime || !manualEndTime}
                  sx={{ height: '100%' }}
                >
                  {currentTranslations.addEntry}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box mt={4}>
            <Typography variant="h6">{currentTranslations.workHoursSummary}</Typography>

            {/* Month Selector */}
            <Box mt={2} mb={2}>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                fullWidth
              >
                {Object.keys(monthlySummary).map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {entries.length > 0 ? (
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.date}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.startTime}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.endTime}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.hoursWorked}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.salary}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.breakTime}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ backgroundColor: '#7B1FA2', color: theme.palette.common.white }}>
                        <strong>{currentTranslations.actions}</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries
                      .filter((entry) => dayjs(entry.date).format('MMMM') === selectedMonth)
                      .map((entry, index) => (
                      <TableRow
                        key={entry.id}
                        sx={{
                          backgroundColor: index % 2 === 0 ? theme.palette.action.hover : theme.palette.background.paper,
                        }}
                      >
                        {editingId === entry.id ? (
                          <>
                            <TableCell align="center">
                              <DatePicker
                                value={dayjs(entry.date)}
                                onChange={(newDate) =>
                                  setEntries((prevEntries) =>
                                    prevEntries.map((item) =>
                                      item.id === entry.id
                                        ? { ...item, date: newDate.format('YYYY-MM-DD') }
                                        : item
                                    )
                                  )
                                }
                                renderInput={(params) => <TextField {...params} fullWidth />}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="time"
                                value={entry.startTime}
                                onChange={(e) =>
                                  setEntries((prevEntries) =>
                                    prevEntries.map((item) =>
                                      item.id === entry.id
                                        ? { ...item, startTime: e.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="time"
                                value={entry.endTime}
                                onChange={(e) =>
                                  setEntries((prevEntries) =>
                                    prevEntries.map((item) =>
                                      item.id === entry.id
                                        ? { ...item, endTime: e.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              {`${entry.hoursWorked?.hours?.toString().padStart(2, '0') || '00'}:${entry.hoursWorked?.minutes
                                ?.toString()
                                .padStart(2, '0') || '00'}:${entry.hoursWorked?.seconds?.toString().padStart(2, '0') || '00'}`}
                            </TableCell>
                            <TableCell align="center">
                              ₪{calculateSalary(
                                entry.hoursWorked?.hours + entry.hoursWorked?.minutes / 60 + entry.hoursWorked?.seconds / 3600 || 0,
                                hourlyRate
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              {editingBreaks.map((breakItem, breakIndex) => (
                                <Box key={breakIndex} mb={2} display="flex" alignItems="center" justifyContent="center">
                                  <Typography variant="subtitle2">{`${currentTranslations.breakTime} ${breakIndex + 1}`}</Typography>
                                  <TextField
                                    type="time"
                                    value={breakItem.start ? dayjs(breakItem.start).format('HH:mm') : ''}
                                    onChange={(e) =>
                                      handleEditBreakTime(breakIndex, 'start', `${entry.date}T${e.target.value}:00`)
                                    }
                                    label={currentTranslations.startTime}
                                    sx={{ mr: 2 }}
                                  />
                                  <TextField
                                    type="time"
                                    value={breakItem.end ? dayjs(breakItem.end).format('HH:mm') : ''}
                                    onChange={(e) =>
                                      handleEditBreakTime(breakIndex, 'end', `${entry.date}T${e.target.value}:00`)
                                    }
                                    label={currentTranslations.endTime}
                                  />
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDeleteBreak(breakIndex)}
                                    sx={{ ml: 2 }}
                                  >
                                    <RemoveCircle />
                                  </IconButton>
                                </Box>
                              ))}
                              <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddBreak}
                                sx={{ mt: 2 }}
                              >
                                {currentTranslations.addBreak}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleSaveEdit(entry.id, entry.date, entry.startTime, entry.endTime)
                                }
                              >
                                <Save />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell align="center">{entry.date}</TableCell>
                            <TableCell align="center">{entry.startTime}</TableCell>
                            <TableCell align="center">{entry.endTime}</TableCell>
                            <TableCell align="center">
                              {`${entry.hoursWorked?.hours?.toString().padStart(2, '0') || '00'}:${entry.hoursWorked?.minutes
                                ?.toString()
                                .padStart(2, '0') || '00'}:${entry.hoursWorked?.seconds?.toString().padStart(2, '0') || '00'}`}
                            </TableCell>
                            <TableCell align="center">₪{entry.totalSalary.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              {entry.breaks
                                ? entry.breaks
                                    .map(
                                      (breakItem) =>
                                        `${dayjs(breakItem.start).format('HH:mm')} - ${
                                          breakItem.end
                                            ? dayjs(breakItem.end).format('HH:mm')
                                            : currentTranslations.onBreak
                                        }`
                                    )
                                    .join(', ')
                                : currentTranslations.noBreaks}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="primary" onClick={() => handleEdit(entry.id)}>
                                <Edit />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleDelete(entry.id)}>
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>{currentTranslations.noHoursTracked}</Typography>
            )}
          </Box>

          <Box mt={4}>
            <Button
              variant="outlined"
              sx={{
                color: theme.palette.text.primary,
                minWidth: 150,
                fontSize: '1rem',
                borderColor: theme.palette.divider,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.text.secondary,
                },
                boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
              }}
              onClick={handleOpenMonthlySummary}
            >
              {currentTranslations.viewMonthlySummary}
            </Button>
          </Box>

          <Box mt={2}>
            <Button
              variant="contained"
              color="error"
              sx={{
                color: '#fff',
                minWidth: 150,
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: theme.palette.error.dark,
                },
                boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
              }}
              onClick={handleOpenClearDialog}
            >
              {currentTranslations.removeAllData}
            </Button>
          </Box>

          <Dialog open={monthlySummaryOpen} onClose={handleCloseMonthlySummary}>
            <DialogTitle>{currentTranslations.monthlySummary}</DialogTitle>
            <DialogContent dividers>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>{currentTranslations.month}</strong></TableCell>
                      <TableCell><strong>{currentTranslations.totalHoursWorked}</strong></TableCell>
                      <TableCell><strong>{currentTranslations.totalSalary}</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(monthlySummary).map(([month, data]) => (
                      <TableRow key={month}>
                        <TableCell>{month}</TableCell>
                        <TableCell>{data.hoursWorked.toFixed(2)}</TableCell>
                        <TableCell>₪ {data.totalSalary.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseMonthlySummary} color="primary">
                {currentTranslations.close}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={clearDialogOpen} onClose={handleCloseClearDialog}>
            <DialogTitle>{currentTranslations.removeAllData}</DialogTitle>
            <DialogContent dividers>
              <Typography>{currentTranslations.deleteEntryConfirmation}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseClearDialog} color="primary">
                {currentTranslations.cancelEdit}
              </Button>
              <Button onClick={handleClearAllData} color="error">
                {currentTranslations.removeAllData}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default HoursTracker;
