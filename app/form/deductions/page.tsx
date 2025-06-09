"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deductionsSchema, Deductions } from '@/lib/schemas/itr';
import { useITRForm } from '@/hooks/use-itr-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataGrid, createSortableHeader } from '@/components/ui/data-grid';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface Donation {
  id: string;
  doneeInstitution: string;
  doneeAddress: string;
  doneePan: string;
  amount: number;
  deductionPercentage: '50' | '100';
  qualifyingAmount: number;
}

const donationColumns: ColumnDef<Donation>[] = [
  {
    header: createSortableHeader('Institution'),
    accessorKey: 'doneeInstitution',
  },
  {
    header: createSortableHeader('PAN'),
    accessorKey: 'doneePan',
  },
  {
    header: createSortableHeader('Amount'),
    accessorKey: 'amount',
    cell: ({ row }) => `₹${(row.getValue('amount') as number).toLocaleString()}`,
  },
  {
    header: createSortableHeader('Deduction %'),
    accessorKey: 'deductionPercentage',
    cell: ({ row }) => `${row.getValue('deductionPercentage')}%`,
  },
  {
    header: createSortableHeader('Qualifying Amount'),
    accessorKey: 'qualifyingAmount',
    cell: ({ row }) => `₹${(row.getValue('qualifyingAmount') as number).toLocaleString()}`,
  },
];

export default function DeductionsForm() {
  const router = useRouter();
  const { form, isLoading, saveAndNext, getNextStep, getPreviousStep } = useITRForm({
    step: 'deductions',
    schema: deductionsSchema,
    defaultValues: {
      section80C: {
        lifeInsurance: 0,
        epf: 0,
        ppf: 0,
        elss: 0,
        nsc: 0,
        homeLoanPrincipal: 0,
        tuitionFees: 0,
        other80C: 0,
      },
      section80D: {
        healthInsuranceSelf: 0,
        healthInsuranceFamily: 0,
        healthInsuranceParents: 0,
        preventiveHealthCheckup: 0,
      },
      otherDeductions: {
        section80E: 0,
        section80G: [],
        section80TTA: 0,
        section80U: 0,
      },
    },
  });

  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  const donationForm = useForm<Donation>({
    defaultValues: {
      id: '',
      doneeInstitution: '',
      doneeAddress: '',
      doneePan: '',
      amount: 0,
      deductionPercentage: '100',
      qualifyingAmount: 0,
    },
  });

  const donations = form.watch('otherDeductions.section80G') || [];

  // Calculate Section 80C total
  const section80CValues = form.watch('section80C');
  const section80CTotal = Object.values(section80CValues || {}).reduce((sum, value) => sum + (value || 0), 0);

  // Calculate Section 80D total
  const section80DValues = form.watch('section80D');
  const section80DTotal = Object.values(section80DValues || {}).reduce((sum, value) => sum + (value || 0), 0);

  const onSubmit = async (data: Deductions) => {
    try {
      await saveAndNext(data);
      const nextStep = getNextStep();
      if (nextStep) {
        router.push(`/form/${nextStep}`);
      }
      toast.success('Deductions saved successfully');
    } catch (error) {
      toast.error('Failed to save deductions');
    }
  };

  const handleAddDonation = () => {
    setEditingDonation(null);
    donationForm.reset({
      id: '',
      doneeInstitution: '',
      doneeAddress: '',
      doneePan: '',
      amount: 0,
      deductionPercentage: '100',
      qualifyingAmount: 0,
    });
    setDonationDialogOpen(true);
  };

  const handleSaveDonation = (donationData: Donation) => {
    const currentDonations = form.getValues('otherDeductions.section80G');
    
    if (editingDonation) {
      const updatedDonations = currentDonations.map(donation => 
        donation.id === editingDonation.id ? donationData : donation
      );
      form.setValue('otherDeductions.section80G', updatedDonations);
      toast.success('Donation updated');
    } else {
      const newDonation = {
        ...donationData,
        id: Date.now().toString(),
      };
      form.setValue('otherDeductions.section80G', [...currentDonations, newDonation]);
      toast.success('Donation added');
    }
    
    setDonationDialogOpen(false);
  };

  // Auto-calculate qualifying amount when amount or percentage changes
  useEffect(() => {
    const subscription = donationForm.watch((value, { name }) => {
      if (name === 'amount' || name === 'deductionPercentage') {
        const amount = value.amount || 0;
        const percentage = value.deductionPercentage || '100';
        const qualifyingAmount = (amount * parseInt(percentage)) / 100;
        donationForm.setValue('qualifyingAmount', qualifyingAmount);
      }
    });
    return () => subscription.unsubscribe();
  }, [donationForm]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deductions</h1>
        <p className="text-gray-600 mt-2">
          Enter your eligible deductions under various sections of the Income Tax Act
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 80C */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Section 80C Deductions
                <span className="text-sm font-normal text-muted-foreground">
                  Total: ₹{section80CTotal.toLocaleString()} / ₹1,50,000
                </span>
              </CardTitle>
              <CardDescription>
                Deductions up to ₹1,50,000 under Section 80C (combined limit)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="section80C.lifeInsurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Life Insurance Premium</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Premium paid for life insurance policies
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.epf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Provident Fund (EPF)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Employee contribution to EPF
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.ppf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Provident Fund (PPF)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Investment in PPF account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.elss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ELSS Mutual Funds</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Investment in Equity Linked Savings Scheme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.nsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National Savings Certificate (NSC)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Investment in NSC
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.homeLoanPrincipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Loan Principal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Principal repayment of home loan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.tuitionFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tuition Fees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Tuition fees for children's education
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80C.other80C"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other 80C Investments</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Other eligible 80C investments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {section80CTotal > 150000 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Your total Section 80C deductions exceed the maximum limit of ₹1,50,000. 
                    Only ₹1,50,000 will be considered for tax calculation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 80D */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Section 80D Deductions
                <span className="text-sm font-normal text-muted-foreground">
                  Total: ₹{section80DTotal.toLocaleString()}
                </span>
              </CardTitle>
              <CardDescription>
                Deductions for health insurance premiums and medical expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="section80D.healthInsuranceSelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Insurance - Self</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Premium for self (Max: ₹25,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80D.healthInsuranceFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Insurance - Family</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Premium for spouse/children (Max: ₹25,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80D.healthInsuranceParents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Insurance - Parents</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Premium for parents (Max: ₹50,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section80D.preventiveHealthCheckup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preventive Health Checkup</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Health checkup expenses (Max: ₹5,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Other Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>Other Deductions</CardTitle>
              <CardDescription>
                Additional deductions under various sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="otherDeductions.section80E"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section 80E - Education Loan Interest</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Interest paid on education loan (No limit)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherDeductions.section80TTA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section 80TTA - Savings Account Interest</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Interest from savings account (Max: ₹10,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherDeductions.section80U"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section 80U - Disability Deduction</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Deduction for disability (Max: ₹1,25,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 80G Donations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Section 80G - Donations</h3>
                    <p className="text-sm text-muted-foreground">
                      Donations to eligible institutions and funds
                    </p>
                  </div>
                </div>

                <DataGrid
                  columns={donationColumns}
                  data={donations}
                  onAdd={handleAddDonation}
                  onEdit={(donation) => {
                    setEditingDonation(donation);
                    donationForm.reset(donation);
                    setDonationDialogOpen(true);
                  }}
                  onDelete={(donation) => {
                    const updatedDonations = donations.filter(d => d.id !== donation.id);
                    form.setValue('otherDeductions.section80G', updatedDonations);
                    toast.success('Donation removed');
                  }}
                  addButtonText="Add Donation"
                  searchPlaceholder="Search donations..."
                  enablePagination={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                const prevStep = getPreviousStep();
                if (prevStep) {
                  router.push(`/form/${prevStep}`);
                }
              }}
            >
              Previous
            </Button>
            <Button type="submit">
              Save & Continue
            </Button>
          </div>
        </form>
      </Form>

      {/* Donation Dialog */}
      <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDonation ? 'Edit Donation' : 'Add Donation'}
            </DialogTitle>
            <DialogDescription>
              Enter the donation details for Section 80G deduction
            </DialogDescription>
          </DialogHeader>
          <Form {...donationForm}>
            <form onSubmit={donationForm.handleSubmit(handleSaveDonation)} className="space-y-4">
              <FormField
                control={donationForm.control}
                name="doneeInstitution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of the institution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={donationForm.control}
                name="doneeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Complete address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={donationForm.control}
                name="doneePan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution PAN *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ABCDE1234F" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={donationForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donation Amount *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={donationForm.control}
                  name="deductionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduction Percentage *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select percentage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="100">100%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={donationForm.control}
                name="qualifyingAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifying Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        readOnly
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Auto-calculated based on amount and percentage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDonationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDonation ? 'Update' : 'Add'} Donation
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}