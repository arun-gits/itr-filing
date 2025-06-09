"use client";

import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalDetailsSchema, PersonalDetails } from '@/lib/schemas/itr';
import { useITRForm } from '@/hooks/use-itr-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataGrid, createSortableHeader } from '@/components/ui/data-grid';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'savings' | 'current' | 'salary' | 'other';
  isPrimary: boolean;
}

const bankAccountColumns: ColumnDef<BankAccount>[] = [
  {
    header: createSortableHeader('Bank Name'),
    accessorKey: 'bankName',
  },
  {
    header: createSortableHeader('Account Number'),
    accessorKey: 'accountNumber',
    cell: ({ row }) => {
      const accountNumber = row.getValue('accountNumber') as string;
      return `****${accountNumber.slice(-4)}`;
    },
  },
  {
    header: createSortableHeader('IFSC Code'),
    accessorKey: 'ifscCode',
  },
  {
    header: createSortableHeader('Type'),
    accessorKey: 'accountType',
    cell: ({ row }) => {
      const type = row.getValue('accountType') as string;
      return type.charAt(0).toUpperCase() + type.slice(1);
    },
  },
  {
    header: 'Primary',
    accessorKey: 'isPrimary',
    cell: ({ row }) => {
      return row.getValue('isPrimary') ? '✓' : '';
    },
  },
];

export default function PersonalDetailsForm() {
  const router = useRouter();
  const { form, isLoading, saveAndNext, getNextStep } = useITRForm({
    step: 'personal',
    schema: personalDetailsSchema,
    defaultValues: {
      nationality: 'Indian',
      residential: 'resident',
      address: {
        flatNo: '101',
        area: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India', // defaulted value
      },
      bankAccounts: [
        // {
        //   id: '1', // Unique identifier
        //   bankName: 'State Bank of India',
        //   accountNumber: '12345678', // At least 8 digits
        //   ifscCode: 'SBIN0001234', // Exactly 11 characters
        //   accountType: 'savings', // One of the enum values
        //   isPrimary: false, // Default value
        // },
        // {
        //   id: '2',
        //   bankName: 'HDFC Bank',
        //   accountNumber: '87654321',
        //   ifscCode: 'HDFC0001234',
        //   accountType: 'current',
        //   isPrimary: true, // This can be true for a primary account
        // }
      ],
    },
  });

  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const bankForm: UseFormReturn<BankAccount> = useForm<BankAccount>({
  defaultValues: {
    id: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'savings',
    isPrimary: false,
  },
});

  const bankAccounts = form.watch('bankAccounts') || [];

  const onSubmit = async (data: PersonalDetails) => {
    try {
      if (data.bankAccounts.length === 0) {
        toast.error('At least one bank account is required');
        return;
      }

      const hasPrimary = data.bankAccounts.some(account => account.isPrimary);
      if (!hasPrimary) {
        toast.error('Please select a primary bank account');
        return;
      }

      await saveAndNext(data);
      const nextStep = getNextStep();
      if (nextStep) {
        router.push(`/form/${nextStep}`);
      }
      toast.success('Personal details saved successfully');
    } catch (error) {
      toast.error('Failed to save personal details');
    }
  };

  const handleAddBank = () => {
    setEditingBank(null);
    bankForm.reset({
      id: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'savings',
      isPrimary: false,
    });
    setBankDialogOpen(true);
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    bankForm.reset(bank);
    setBankDialogOpen(true);
  };

  const handleDeleteBank = (bank: BankAccount) => {
    const currentAccounts = form.getValues('bankAccounts');
    const updatedAccounts = currentAccounts.filter(acc => acc.id !== bank.id);
    form.setValue('bankAccounts', updatedAccounts);
    toast.success('Bank account removed');
  };

  const handleSaveBank = (bankData: BankAccount) => {
    const currentAccounts = form.getValues('bankAccounts');

    if (bankData.isPrimary) {
      // Remove primary flag from other accounts
      currentAccounts.forEach(acc => acc.isPrimary = false);
    }

    if (editingBank) {
      // Update existing account
      const updatedAccounts = currentAccounts.map(acc =>
        acc.id === editingBank.id ? bankData : acc
      );
      form.setValue('bankAccounts', updatedAccounts);
      toast.success('Bank account updated');
    } else {
      // Add new account
      const newAccount = {
        ...bankData,
        id: Date.now().toString(),
      };
      form.setValue('bankAccounts', [...currentAccounts, newAccount]);
      toast.success('Bank account added');
    }

    setBankDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personal Details</h1>
        <p className="text-gray-600 mt-2">
          Enter your basic information, address, and bank account details
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal identification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABCDE1234F"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        10-character alphanumeric PAN number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadhaar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012" {...field} />
                      </FormControl>
                      <FormDescription>
                        12-digit Aadhaar number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother's Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mother's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residential Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="resident">Resident</SelectItem>
                          <SelectItem value="non-resident">Non-Resident</SelectItem>
                          <SelectItem value="not-ordinarily-resident">Not Ordinarily Resident</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Your email and phone details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormDescription>
                        10-digit mobile number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Your residential address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address.flatNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat/House Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="A-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building/Society Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Building name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area/Locality *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter area or locality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                Add your bank account details for refund processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataGrid
                columns={bankAccountColumns}
                data={bankAccounts}
                onAdd={handleAddBank}
                onEdit={handleEditBank}
                onDelete={handleDeleteBank}
                addButtonText="Add Bank Account"
                searchPlaceholder="Search bank accounts..."
                enablePagination={false}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
            <Button type="submit" onClick={() => {
                                const nextStep = getNextStep();
                                if (nextStep) {
                                    router.push(`/form/${nextStep}`);
                                }
                            }}>
              Save & Continue
            </Button>
          </div>
        </form>
      </Form>

      {/* Bank Account Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
            </DialogTitle>
            <DialogDescription>
              Enter the bank account details for refund processing
            </DialogDescription>
          </DialogHeader>
          <Form {...bankForm}>
            <form onSubmit={bankForm.handleSubmit(handleSaveBank)} className="space-y-4">
              <FormField
                control={bankForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="State Bank of India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bankForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bankForm.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SBIN0001234"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bankForm.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={bankForm.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Primary Account</FormLabel>
                        <FormDescription>
                          Use this account for refund processing
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBankDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBank ? 'Update' : 'Add'} Account
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}