"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taxSummarySchema, TaxSummary } from '@/lib/schemas/itr';
import { useITRForm } from '@/hooks/use-itr-form';
import { storage } from '@/lib/storage';
import { TaxCalculator } from '@/lib/tax-calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { Calculator, FileText, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink, pdf } from '@react-pdf/renderer';

export default function TaxSummaryForm() {
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      padding: 30,
      fontFamily: 'Helvetica', // Or 'Roboto' if you registered it
    },
    section: {
      marginVertical: 10,
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eeeeee',
      borderBottomStyle: 'solid',
    },
    header: {
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 20,
      color: '#333333',
      fontWeight: 'bold',
    },
    subHeader: {
      fontSize: 16,
      marginBottom: 8,
      color: '#555555',
      fontWeight: 'bold',
    },
    text: {
      fontSize: 10,
      marginBottom: 3,
      lineHeight: 1.5,
    },
    boldText: {
      fontSize: 10,
      marginBottom: 3,
      lineHeight: 1.5,
      fontWeight: 'bold',
    },
    table: {
      width: 'auto',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      marginBottom: 10,
    },
    tableRow: {
      margin: 'auto',
      flexDirection: 'row',
    },
    tableColHeader: {
      width: '25%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderBottomColor: '#000000',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      backgroundColor: '#f2f2f2',
    },
    tableCol: {
      width: '25%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    tableCellHeader: {
      margin: 5,
      fontSize: 10,
      fontWeight: 'bold',
    },
    tableCell: {
      margin: 5,
      fontSize: 9,
    },
  });

  const [itrData, setItrData] = useState<any>(null);
  
  const generateReport = () => {
    if (!itrData) {
      return <Text style={styles.text}>No ITR data available to generate report.</Text>;
    } else {
      return (
        <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Income Tax Return Report</Text>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Personal Details</Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>Name:</Text> {itrData.personalDetails.firstName} {itrData.personalDetails.lastName}
          </Text>
          <Text style={styles.text}><Text style={styles.boldText}>PAN:</Text> {itrData.personalDetails.pan}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Aadhaar:</Text> {itrData.personalDetails.aadhaar}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Date of Birth:</Text> {itrData.personalDetails.dateOfBirth}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Email:</Text> {itrData.personalDetails.email}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Phone:</Text> {itrData.personalDetails.phone}</Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>Address:</Text> {itrData.personalDetails.address.flatNo}, {itrData.personalDetails.address.area}, {itrData.personalDetails.address.city}, {itrData.personalDetails.address.state} - {itrData.personalDetails.address.pincode}, {itrData.personalDetails.address.country}
          </Text>
        </View>

        {/* Bank Accounts */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Bank Accounts</Text>
          {itrData.personalDetails.bankAccounts.map((account: any, index: number) => (
            <View key={index} style={{ marginBottom: 5 }}>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Bank:</Text> {account.bankName} (<Text style={styles.boldText}>A/C No.:</Text> {account.accountNumber})
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>IFSC:</Text> {account.ifscCode}, <Text style={styles.boldText}>Type:</Text> {account.accountType} {account.isPrimary ? '(Primary)' : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Income Details */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Income Details</Text>

          {/* Salary Income */}
          <Text style={styles.boldText}>Salary Income:</Text>
          {itrData.incomeDetails.salaryIncome.hasIncome ? (
            itrData.incomeDetails.salaryIncome.employers.map((employer: any, index: number) => (
              <View key={index} style={{ marginLeft: 10, marginBottom: 5 }}>
                <Text style={styles.text}>Employer: {employer.employerName}</Text>
                <Text style={styles.text}>Gross Salary: {employer.grossSalary}</Text>
                <Text style={styles.text}>TDS Deducted: {employer.tdsDeducted}</Text>
              </View>
            ))
          ) : (
            <Text style={{ ...styles.text, marginLeft: 10 }}>N/A</Text>
          )}

          {/* House Property Income */}
          <Text style={{ ...styles.boldText, marginTop: 5 }}>House Property Income:</Text>
          {itrData.incomeDetails.housePropertyIncome.hasIncome ? (
            itrData.incomeDetails.housePropertyIncome.properties.map((property: any, index: number) => (
              <View key={index} style={{ marginLeft: 10, marginBottom: 5 }}>
                <Text style={styles.text}>Type: {property.propertyType}</Text>
                <Text style={styles.text}>Annual Value: {property.annualValue}</Text>
                <Text style={styles.text}>Municipal Tax: {property.municipalTax}</Text>
                <Text style={styles.text}>Interest on Loan: {property.interestOnLoan}</Text>
              </View>
            ))
          ) : (
            <Text style={{ ...styles.text, marginLeft: 10 }}>N/A</Text>
          )}

          {/* Capital Gains */}
          <Text style={{ ...styles.boldText, marginTop: 5 }}>Capital Gains:</Text>
          {itrData.incomeDetails.capitalGains.hasIncome ? (
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.text}>Short Term Gains: {itrData.incomeDetails.capitalGains.shortTermGains}</Text>
              <Text style={styles.text}>Long Term Gains: {itrData.incomeDetails.capitalGains.longTermGains}</Text>
            </View>
          ) : (
            <Text style={{ ...styles.text, marginLeft: 10 }}>N/A</Text>
          )}

          {/* Other Sources */}
          <Text style={{ ...styles.boldText, marginTop: 5 }}>Other Sources Income:</Text>
          {itrData.incomeDetails.otherSources.hasIncome ? (
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.text}>Interest Income: {itrData.incomeDetails.otherSources.interestIncome}</Text>
              <Text style={styles.text}>Dividend Income: {itrData.incomeDetails.otherSources.dividendIncome}</Text>
              <Text style={styles.text}>Other Income: {itrData.incomeDetails.otherSources.otherIncome}</Text>
            </View>
          ) : (
            <Text style={{ ...styles.text, marginLeft: 10 }}>N/A</Text>
          )}
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Deductions</Text>

          <Text style={styles.boldText}>Section 80C:</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.text}>Life Insurance: {itrData.deductions.section80C.lifeInsurance}</Text>
            <Text style={styles.text}>EPF: {itrData.deductions.section80C.epf}</Text>
            {/* Add more 80C items */}
            <Text style={styles.text}>Total 80C: {itrData.deductions.section80C.lifeInsurance + itrData.deductions.section80C.epf}</Text>
          </View>

          <Text style={{ ...styles.boldText, marginTop: 5 }}>Section 80D (Health Insurance):</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.text}>Self: {itrData.deductions.section80D.healthInsuranceSelf}</Text>
            <Text style={styles.text}>Family: {itrData.deductions.section80D.healthInsuranceFamily}</Text>
            {/* Add more 80D items */}
            <Text style={styles.text}>Total 80D: {itrData.deductions.section80D.healthInsuranceSelf + itrData.deductions.section80D.healthInsuranceFamily}</Text>
          </View>

          {itrData.deductions.otherDeductions.section80G.length > 0 && (
            <>
              <Text style={{ ...styles.boldText, marginTop: 5 }}>Section 80G (Donations):</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Donee Institution</Text></View>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Amount</Text></View>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Qualifying Amount</Text></View>
                  <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Deduction %</Text></View>
                </View>
                {itrData.deductions.otherDeductions.section80G.map((donation: any, index: number) => (
                  <View style={styles.tableRow} key={index}>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{donation.doneeInstitution}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{donation.amount}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{donation.qualifyingAmount}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{donation.deductionPercentage}%</Text></View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Tax Summary */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Tax Summary</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Total Income:</Text> {itrData.taxSummary.totalIncome}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Total Deductions:</Text> {itrData.taxSummary.totalDeductions}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Taxable Income:</Text> {itrData.taxSummary.taxableIncome}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Tax Before Relief:</Text> {itrData.taxSummary.taxBeforeRelief}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Relief Under 89:</Text> {itrData.taxSummary.reliefUnder89}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Tax After Relief:</Text> {itrData.taxSummary.taxAfterRelief}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Education Cess:</Text> {itrData.taxSummary.educationCess}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Total Tax Liability:</Text> {itrData.taxSummary.totalTaxLiability}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>TDS Deducted:</Text> {itrData.taxSummary.tdsDeducted}</Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>
              {itrData.taxSummary.refundOrPayable < 0 ? 'Refund Due:' : 'Tax Payable:'}
            </Text> {Math.abs(itrData.taxSummary.refundOrPayable)}
          </Text>
        </View>

        {/* Verification */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Verification</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Place:</Text> {itrData.taxSummary.verification.place}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Date:</Text> {itrData.taxSummary.verification.date}</Text>
          <Text style={styles.text}><Text style={styles.boldText}>Declaration Accepted:</Text> {itrData.taxSummary.verification.declarationAccepted ? 'Yes' : 'No'}</Text>
        </View>

      </Page>
    </Document>
      )
    }
  };
  const router = useRouter();
  const { form, isLoading, saveAndNext, getPreviousStep } = useITRForm({
    step: 'summary',
    schema: taxSummarySchema,
    defaultValues: {
      totalIncome: 0,
      totalDeductions: 0,
      taxableIncome: 0,
      taxBeforeRelief: 0,
      reliefUnder89: 0,
      taxAfterRelief: 0,
      surcharge: 0,
      educationCess: 0,
      totalTaxLiability: 0,
      advanceTaxPaid: 0,
      tdsDeducted: 0,
      selfAssessmentTax: 0,
      refundOrPayable: 0,
      verification: {
        place: '',
        date: new Date().toISOString().split('T')[0],
        declarationAccepted: false,
      },
    },
  });

  const [calculations, setCalculations] = useState<any>(null);
  const [useNewRegime, setUseNewRegime] = useState(false);

  // Load and calculate tax on component mount
  useEffect(() => {
    const loadDataAndCalculate = () => {
      const savedData = storage.load();

      if (savedData.incomeDetails && savedData.deductions) {
        const taxComparison = TaxCalculator.compareTaxRegimes(
          savedData.incomeDetails,
          savedData.deductions
        );

        setCalculations(taxComparison);

        // Use the better regime by default
        const betterRegime = taxComparison.betterRegime === 'new';
        setUseNewRegime(betterRegime);

        // Update form with calculated values
        const selectedCalculation = betterRegime ? taxComparison.newRegime : taxComparison.oldRegime;

        form.setValue('totalIncome', selectedCalculation.totalIncome);
        form.setValue('totalDeductions', selectedCalculation.totalDeductions);
        form.setValue('taxableIncome', selectedCalculation.taxableIncome);
        form.setValue('taxBeforeRelief', selectedCalculation.taxBeforeRelief);
        form.setValue('surcharge', selectedCalculation.surcharge);
        form.setValue('educationCess', selectedCalculation.educationCess);
        form.setValue('totalTaxLiability', selectedCalculation.totalTaxLiability);

        // Calculate TDS from salary income
        let totalTDS = 0;
        if (savedData.incomeDetails.salaryIncome.hasIncome) {
          savedData.incomeDetails.salaryIncome.employers.forEach((employer: any) => {
            totalTDS += employer.tdsDeducted || 0;
          });
        }
        form.setValue('tdsDeducted', totalTDS);

        // Calculate refund or payable
        const taxAfterRelief = selectedCalculation.totalTaxLiability - (form.getValues('reliefUnder89') || 0);
        const totalPaid = totalTDS + (form.getValues('advanceTaxPaid') || 0) + (form.getValues('selfAssessmentTax') || 0);
        const refundOrPayable = totalPaid - taxAfterRelief;

        form.setValue('taxAfterRelief', taxAfterRelief);
        form.setValue('refundOrPayable', refundOrPayable);
      }
    };

    if (!isLoading) {
      loadDataAndCalculate();
    }
  }, [isLoading, form]);

  // Recalculate when regime changes
  useEffect(() => {
    if (calculations) {
      const selectedCalculation = useNewRegime ? calculations.newRegime : calculations.oldRegime;

      form.setValue('totalIncome', selectedCalculation.totalIncome);
      form.setValue('totalDeductions', selectedCalculation.totalDeductions);
      form.setValue('taxableIncome', selectedCalculation.taxableIncome);
      form.setValue('taxBeforeRelief', selectedCalculation.taxBeforeRelief);
      form.setValue('surcharge', selectedCalculation.surcharge);
      form.setValue('educationCess', selectedCalculation.educationCess);
      form.setValue('totalTaxLiability', selectedCalculation.totalTaxLiability);

      // Recalculate refund/payable
      const taxAfterRelief = selectedCalculation.totalTaxLiability - (form.getValues('reliefUnder89') || 0);
      const totalPaid = (form.getValues('tdsDeducted') || 0) + (form.getValues('advanceTaxPaid') || 0) + (form.getValues('selfAssessmentTax') || 0);
      const refundOrPayable = totalPaid - taxAfterRelief;

      form.setValue('taxAfterRelief', taxAfterRelief);
      form.setValue('refundOrPayable', refundOrPayable);
    }
    const itrDataString = localStorage.getItem('itr-data');
    if (itrDataString) {
      setItrData(JSON.parse(itrDataString));
    }
  }, [useNewRegime, calculations, form]);

  const onSubmit = async (data: TaxSummary) => {
    try {
      if (!data.verification.declarationAccepted) {
        toast.error('Please accept the declaration to proceed');
        return;
      }

      await saveAndNext(data);
      toast.success('Tax summary completed successfully');

      // Show completion message
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      toast.error('Failed to save tax summary');
    }
  };

  const handleGenerateReport = async () => {
    // This would generate a PDF report
    // toast.success('Report generation feature coming soon');
    if (!itrData) {
      toast.error('No ITR data found to generate report.');
      return;
    }
    // toast.success('Generating report...');
     try {
      // 1. Get the Document instance from your existing generateReport method
      const pdfDocumentInstance = generateReport();

      if (!pdfDocumentInstance) {
        toast.error('Report generation failed');
        return;
      }

      // 2. Convert the Document instance to a Blob
      const blob = await pdf(pdfDocumentInstance).toBlob();

      // 3. Create a temporary URL for the Blob
      const url = URL.createObjectURL(blob);

      // 4. Create a temporary anchor element for download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${itrData.personalDetails.firstName}_ITR_Report_${Date.now()}.pdf`; // Desired filename

      // 5. Programmatically click the anchor to trigger download
      document.body.appendChild(a); // Required for Firefox compatibility
      a.click();

      // 6. Clean up the temporary URL and anchor element
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating or downloading PDF:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const totalIncome = form.watch('totalIncome') || 0;
  const totalDeductions = form.watch('totalDeductions') || 0;
  const taxableIncome = form.watch('taxableIncome') || 0;
  const totalTaxLiability = form.watch('totalTaxLiability') || 0;
  const refundOrPayable = form.watch('refundOrPayable') || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tax Summary</h1>
        <p className="text-gray-600 mt-2">
          Review your tax calculation and complete the verification
        </p>
      </div>

      {/* Tax Regime Comparison */}
      {calculations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Regime Comparison
            </CardTitle>
            <CardDescription>
              Choose the tax regime that works best for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${!useNewRegime ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setUseNewRegime(false)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Old Tax Regime</h3>
                  {calculations.betterRegime === 'old' && (
                    <Badge variant="secondary">Recommended</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Income:</span>
                    <span>₹{calculations.oldRegime.totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deductions:</span>
                    <span>₹{calculations.oldRegime.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span>₹{calculations.oldRegime.taxableIncome.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Tax:</span>
                    <span>₹{calculations.oldRegime.totalTaxLiability.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${useNewRegime ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setUseNewRegime(true)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">New Tax Regime</h3>
                  {calculations.betterRegime === 'new' && (
                    <Badge variant="secondary">Recommended</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Income:</span>
                    <span>₹{calculations.newRegime.totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deductions:</span>
                    <span>₹{calculations.newRegime.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span>₹{calculations.newRegime.taxableIncome.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Tax:</span>
                    <span>₹{calculations.newRegime.totalTaxLiability.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Income Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Income Summary</CardTitle>
              <CardDescription>
                Summary of your total income and deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{totalIncome.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Total Income</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{totalDeductions.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Total Deductions</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{taxableIncome.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">Taxable Income</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Calculation */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation</CardTitle>
              <CardDescription>
                Detailed breakdown of your tax liability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tax before Relief:</span>
                    <span>₹{form.watch('taxBeforeRelief')?.toLocaleString() || '0'}</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="reliefUnder89"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relief under Section 89</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Relief for salary received in arrears
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <span>Surcharge:</span>
                    <span>₹{form.watch('surcharge')?.toLocaleString() || '0'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Education Cess:</span>
                    <span>₹{form.watch('educationCess')?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      ₹{totalTaxLiability.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">Total Tax Liability</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Payments</CardTitle>
              <CardDescription>
                Enter the tax payments you have already made
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="tdsDeducted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TDS Deducted</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Tax deducted at source
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advanceTaxPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Tax Paid</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Advance tax payments made
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selfAssessmentTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Self Assessment Tax</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Self assessment tax paid
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">
                  {refundOrPayable >= 0 ? (
                    <span className="text-green-600">₹{refundOrPayable.toLocaleString()} Refund</span>
                  ) : (
                    <span className="text-red-600">₹{Math.abs(refundOrPayable).toLocaleString()} Payable</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {refundOrPayable >= 0 ? 'Amount to be refunded' : 'Additional tax to be paid'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
              <CardDescription>
                Complete the verification to finalize your ITR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="verification.place"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter place" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="verification.date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="verification.declarationAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Declaration *</FormLabel>
                      <FormDescription>
                        I verify that the information given above is correct and complete to the best of my knowledge and belief and nothing has been concealed therefrom.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const prevStep = getPreviousStep();
                if (prevStep) {
                  router.push(`/form/${prevStep}`);
                }
              }}
              className="flex-1"
            >
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateReport}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>

            <Button type="submit" className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete ITR
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}