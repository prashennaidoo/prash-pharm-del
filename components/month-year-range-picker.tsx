import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { TransparentCard } from './transparent-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MonthYearRangePickerProps {
  onRangeChange?: (fromDate: Date, toDate: Date) => void;
  style?: any;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearRangePicker({ onRangeChange, style }: MonthYearRangePickerProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Initialize with current month/year
  const [fromMonth, setFromMonth] = useState(currentMonth);
  const [fromYear, setFromYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);
  const [toYear, setToYear] = useState(currentYear);
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  // Generate years from 2020 to current year
  const years = Array.from(
    { length: currentYear - 2020 + 1 }, 
    (_, i) => 2020 + i
  );
  
  const formatDate = (month: number, year: number) => {
    return `${MONTHS[month]} ${year}`;
  };
  
  const handleFromDateSelect = (month: number, year: number) => {
    setFromMonth(month);
    setFromYear(year);
    setShowFromPicker(false);
    
    // Validate that from date is not after to date
    const fromDate = new Date(year, month);
    const toDate = new Date(toYear, toMonth);
    
    if (fromDate > toDate) {
      // Adjust to date to match from date
      setToMonth(month);
      setToYear(year);
      if (onRangeChange) {
        onRangeChange(fromDate, fromDate);
      }
    } else {
      if (onRangeChange) {
        onRangeChange(fromDate, toDate);
      }
    }
  };
  
  const handleToDateSelect = (month: number, year: number) => {
    setToMonth(month);
    setToYear(year);
    setShowToPicker(false);
    
    // Validate that to date is not before from date
    const fromDate = new Date(fromYear, fromMonth);
    const toDate = new Date(year, month);
    
    if (toDate < fromDate) {
      // Adjust from date to match to date
      setFromMonth(month);
      setFromYear(year);
      if (onRangeChange) {
        onRangeChange(toDate, toDate);
      }
    } else {
      if (onRangeChange) {
        onRangeChange(fromDate, toDate);
      }
    }
  };
  
  const isMonthDisabledForFrom = (month: number, year: number) => {
    // Disable future months/years
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };
  
  const isMonthDisabledForTo = (month: number, year: number) => {
    // Disable future months/years beyond current
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };
  
  const renderMonthYearPicker = (
    selectedMonth: number,
    selectedYear: number,
    onSelect: (month: number, year: number) => void,
    isFromPicker: boolean,
    onClose: () => void
  ) => (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.pickerContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.pickerCard, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                {isFromPicker ? 'Select From Date' : 'Select To Date'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Year Selector */}
            <View style={styles.yearSelector}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Year</Text>
              <View style={styles.yearGrid}>
                {years.map((year) => {
                  const isSelected = year === selectedYear;
                  const isDisabled = isFromPicker 
                    ? year > currentYear 
                    : year > currentYear;
                  
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearItem,
                        isSelected && { ...styles.selectedItem, backgroundColor: theme.colors.primary },
                        isDisabled && styles.disabledItem
                      ]}
                      onPress={() => !isDisabled && onSelect(selectedMonth, year)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          { color: theme.colors.text },
                          isSelected && { color: '#FFFFFF' },
                          isDisabled && { color: theme.colors.textTertiary }
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Month</Text>
              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => {
                  const isSelected = index === selectedMonth && selectedYear === selectedYear;
                  const isDisabled = isFromPicker
                    ? isMonthDisabledForFrom(index, selectedYear)
                    : isMonthDisabledForTo(index, selectedYear);
                  
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthItem,
                        isSelected && { ...styles.selectedItem, backgroundColor: theme.colors.primary },
                        isDisabled && styles.disabledItem
                      ]}
                      onPress={() => !isDisabled && onSelect(index, selectedYear)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          { color: theme.colors.text },
                          isSelected && { color: '#FFFFFF' },
                          isDisabled && { color: theme.colors.textTertiary }
                        ]}
                      >
                        {month.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
  
  return (
    <View style={[styles.container, style]}>
      <TransparentCard style={styles.rangeContainer}>
        {/* From Date Picker */}
        <View style={styles.dateInputWrapper}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>From</Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.textTertiary }]}
            onPress={() => setShowFromPicker(true)}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.calendarIcon}
            />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatDate(fromMonth, fromYear)}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Separator */}
        <View style={styles.separator}>
          <MaterialIcons name="arrow-forward" size={20} color={theme.colors.textSecondary} />
        </View>
        
        {/* To Date Picker */}
        <View style={styles.dateInputWrapper}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>To</Text>
          <TouchableOpacity
            style={[styles.dateInput, { borderColor: theme.colors.textTertiary }]}
            onPress={() => setShowToPicker(true)}
          >
            <MaterialIcons 
              name="calendar-today" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.calendarIcon}
            />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatDate(toMonth, toYear)}
            </Text>
          </TouchableOpacity>
        </View>
      </TransparentCard>
      
      {/* From Date Modal Picker */}
      {showFromPicker && renderMonthYearPicker(
        fromMonth,
        fromYear,
        handleFromDateSelect,
        true,
        () => setShowFromPicker(false)
      )}
      
      {/* To Date Modal Picker */}
      {showToPicker && renderMonthYearPicker(
        toMonth,
        toYear,
        handleToDateSelect,
        false,
        () => setShowToPicker(false)
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    width: '100%',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dateInputWrapper: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.inputPadding,
    borderWidth: 1,
    borderRadius: theme.borderRadius.input,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: theme.spacing.xs,
  },
  calendarIcon: {
    marginRight: theme.spacing.xs,
  },
  dateText: {
    ...theme.typography.body,
    flex: 1,
  },
  separator: {
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '90%',
    maxWidth: 400,
  },
  pickerCard: {
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  pickerTitle: {
    ...theme.typography.h4,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  sectionLabel: {
    ...theme.typography.label,
    marginBottom: theme.spacing.sm,
  },
  
  // Year Selector
  yearSelector: {
    marginBottom: theme.spacing.lg,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  yearItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 70,
    alignItems: 'center',
  },
  yearText: {
    ...theme.typography.body,
  },
  
  // Month Selector
  monthSelector: {
    marginBottom: theme.spacing.sm,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  monthItem: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  monthText: {
    ...theme.typography.bodySmall,
  },
  
  // State Styles
  selectedItem: {
    // backgroundColor set dynamically
  },
  disabledItem: {
    opacity: 0.3,
  },
});


