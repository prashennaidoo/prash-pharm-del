import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { BackgroundGradient } from '@/components/background-gradient';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import { MonthYearRangePicker } from '@/components/month-year-range-picker';
import { supabase } from '@/lib/supabase';
import { getCurrentUserPharmacy } from '@/lib/auth';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import html2pdf from '@/lib/html2pdf';

// Types
interface DeliveryData {
  id: number;
  order_id: string;
  status: string;
  delivery_date_time: string;
  address: string;
  medication_schedule: string;
  cold_chain: boolean;
  temperature: number | null;
  recipient_name: string;
  patient: {
    name: string;
    surname: string;
  } | null;
}

// Create styles function that uses theme values
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.screenPadding + 20, // Extra top padding
    paddingBottom: 80, // Account for floating nav bar
  },
  header: {
    marginBottom: theme.spacing.componentGap,
    gap: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
  },
  headerSubtitle: {
    ...theme.typography.body,
  },
  buttonsContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.componentGap,
  },
  button: {
    backgroundColor: theme.getStatusColor('picked_up'),
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.cardBackground,
    opacity: 0.5,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  dateRangeInfo: {
    backgroundColor: `${theme.colors.primary}20`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  dateRangeText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default function ReportsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDateRangeChange = (fromDate: Date, toDate: Date) => {
    setDateRange({ from: fromDate, to: toDate });
  };

  // Fetch deliveries from Supabase
  const fetchDeliveries = async (): Promise<DeliveryData[]> => {
    if (!dateRange) {
      throw new Error('Please select a date range first');
    }

    const { pharmacyId, pharmacyName } = await getCurrentUserPharmacy();

    // Set start date to beginning of the month
    const startDate = new Date(dateRange.from);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Set end date to end of the month
    const endDate = new Date(dateRange.to);
    endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('delivery')
      .select(`
        id,
        order_id,
        status,
        delivery_date_time,
        address,
        medication_schedule,
        cold_chain,
        temperature,
        recipient_name,
        patient:patient_id(name, surname)
      `)
      .eq('pharmacy_id', pharmacyId)
      .gte('delivery_date_time', startDate.toISOString())
      .lte('delivery_date_time', endDate.toISOString())
      .order('delivery_date_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch deliveries: ${error.message}`);
    }

    return (data || []) as unknown as DeliveryData[];
  };

  // Format medication schedule for display
  const formatSchedule = (schedule: string): string => {
    switch (schedule) {
      case 'unscheduled':
        return 'Unscheduled';
      case 'schedule-1-2':
        return 'Schedule 1-2';
      case 'schedule-3-5':
        return 'Schedule 3-5';
      case 'schedule-6':
        return 'Schedule 6';
      default:
        return schedule;
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate HTML for PDF
  const generateHTMLReport = async (deliveries: DeliveryData[]): Promise<string> => {
    const { pharmacyName } = await getCurrentUserPharmacy();
    
    const fromDateStr = dateRange!.from.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const toDateStr = dateRange!.to.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const tableRows = deliveries
      .map(
        (delivery) => `
        <tr>
          <td>${delivery.patient ? `${delivery.patient.name} ${delivery.patient.surname}` : 'N/A'}</td>
          <td>${delivery.address || 'N/A'}</td>
          <td>${formatDate(delivery.delivery_date_time)}</td>
          <td>${delivery.status || 'N/A'}</td>
          <td>${formatSchedule(delivery.medication_schedule)}</td>
          <td>${delivery.cold_chain ? 'Yes' : 'No'}</td>
          <td>${delivery.cold_chain && delivery.temperature ? `${delivery.temperature}°C` : 'N/A'}</td>
          <td>${delivery.recipient_name || 'N/A'}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Delivery Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              text-align: center;
              margin-bottom: 10px;
            }
            .subtitle {
              text-align: center;
              color: #7f8c8d;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .info-section {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .info-row {
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th {
              background-color: #3498db;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e9ecef;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #7f8c8d;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #7f8c8d;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <h1>Delivery Report</h1>
          <div class="subtitle">${pharmacyName}</div>
          
          <div class="info-section">
            <div class="info-row"><strong>Report Period:</strong> ${fromDateStr} to ${toDateStr}</div>
            <div class="info-row"><strong>Total Deliveries:</strong> ${deliveries.length}</div>
            <div class="info-row"><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</div>
          </div>

          ${
            deliveries.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Address</th>
                <th>Delivery Date/Time</th>
                <th>Status</th>
                <th>Medication Schedule</th>
                <th>Cold Chain</th>
                <th>Temperature</th>
                <th>Recipient Name</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          `
              : '<div class="no-data">No deliveries found for the selected date range.</div>'
          }

          <div class="footer">
            <p>This report was generated automatically by the Pharmacy Delivery System</p>
          </div>
        </body>
      </html>
    `;
  };

  // Generate PDF on web using html2pdf.js (loaded from CDN)
  const generatePDFWeb = async (html: string, filename: string) => {
    if (Platform.OS === 'web') {
      const html2pdfLib = await html2pdf();
      if (!html2pdfLib) return;

      const element = document.createElement('div');
      element.innerHTML = html;

      const options = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdfLib().set(options).from(element).save();
      Alert.alert('Success', 'PDF report downloaded successfully!');
    }
  };

  // Create PDF and share/download
  const handleCreatePDF = async () => {
    if (!dateRange) {
      Alert.alert('Date Range Required', 'Please select a date range before generating the report.');
      return;
    }

    try {
      setLoading(true);

      // Fetch deliveries
      const deliveries = await fetchDeliveries();

      // Generate HTML
      const html = await generateHTMLReport(deliveries);

      // Create filename
      const fromDateStr = dateRange.from.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      }).replace(/\s/g, '_');
      const toDateStr = dateRange.to.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      }).replace(/\s/g, '_');
      const filename = `Delivery_Report_${fromDateStr}_to_${toDateStr}.pdf`;

      // Handle platform-specific PDF generation
      if (Platform.OS === 'web') {
        // Web: Use html2pdf.js
        await generatePDFWeb(html, filename);
      } else {
        // Mobile: Use expo-print
        const { uri } = await Print.printToFileAsync({ html });
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Delivery Report - ${fromDateStr} to ${toDateStr}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', 'PDF generated successfully at: ' + uri);
        }
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', error.message || 'Failed to generate PDF report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradient style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: theme.colors.text }
          ]}>Reports</Text>
          <Text style={[
            styles.headerSubtitle,
            { color: theme.colors.textSecondary }
          ]}>View pharmacy analytics and reports</Text>
        </View>

        {/* Date Range Picker */}
        <MonthYearRangePicker 
          onRangeChange={handleDateRangeChange}
          style={{ marginBottom: theme.spacing.componentGap }}
        />

        {/* Display selected date range */}
        {dateRange && (
          <View style={styles.dateRangeInfo}>
            <Text style={styles.dateRangeText}>
              Selected Range: {dateRange.from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {dateRange.to.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        )}

        {/* Report Generation Button */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, (!dateRange || loading) && styles.buttonDisabled]}
            onPress={handleCreatePDF}
            disabled={!dateRange || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : null}
            <Text style={styles.buttonText}>
              {loading ? 'Generating PDF...' : 'Create PDF Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Navigation Bar */}
      <FloatingNavBar />
    </BackgroundGradient>
  );
}

