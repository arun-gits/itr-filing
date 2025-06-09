"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeDetailsSchema, IncomeDetails } from '@/lib/schemas/itr';
import { useITRForm } from '@/hooks/use-itr-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, createSortableHeader } from '@/components/ui/data-grid';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface Employer {
    id: string;
    employerName: string;
    employerPan: string;
    grossSalary: number;
    basicSalary: number;
    hra: number;
    otherAllowances: number;
    professionalTax: number;
    tdsDeducted: number;
    fromDate: string;
    toDate: string;
}

interface Property {
    id: string;
    propertyType: 'self-occupied' | 'let-out' | 'deemed-let-out';
    address: string;
    annualValue: number;
    municipalTax: number;
    interestOnLoan: number;
    otherExpenses: number;
}

const employerColumns: ColumnDef<Employer>[] = [
    {
        header: createSortableHeader('Employer Name'),
        accessorKey: 'employerName',
    },
    {
        header: createSortableHeader('PAN'),
        accessorKey: 'employerPan',
    },
    {
        header: createSortableHeader('Gross Salary'),
        accessorKey: 'grossSalary',
        cell: ({ row }) => `₹${(row.getValue('grossSalary') as number).toLocaleString()}`,
    },
    {
        header: createSortableHeader('TDS Deducted'),
        accessorKey: 'tdsDeducted',
        cell: ({ row }) => `₹${(row.getValue('tdsDeducted') as number).toLocaleString()}`,
    },
];

const propertyColumns: ColumnDef<Property>[] = [
    {
        header: createSortableHeader('Property Type'),
        accessorKey: 'propertyType',
        cell: ({ row }) => {
            const type = row.getValue('propertyType') as string;
            return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        },
    },
    {
        header: createSortableHeader('Address'),
        accessorKey: 'address',
    },
    {
        header: createSortableHeader('Annual Value'),
        accessorKey: 'annualValue',
        cell: ({ row }) => `₹${(row.getValue('annualValue') as number).toLocaleString()}`,
    },
];

export default function IncomeDetailsForm() {
    const router = useRouter();
    const { form, isLoading, saveAndNext, getNextStep, getPreviousStep } = useITRForm({
        step: 'income',
        schema: incomeDetailsSchema,
        defaultValues: {
            salaryIncome: {
                hasIncome: false,
                employers: [],
            },
            housePropertyIncome: {
                hasIncome: false,
                properties: [],
            },
            capitalGains: {
                hasIncome: false,
                shortTermGains: 0,
                longTermGains: 0,
                exemptLongTermGains: 0,
            },
            otherSources: {
                hasIncome: false,
                interestIncome: 0,
                dividendIncome: 0,
                otherIncome: 0,
            },
        },
    });

    const [employerDialogOpen, setEmployerDialogOpen] = useState(false);
    const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
    const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    const employerForm = useForm<Employer>({
        defaultValues: {
            id: '',
            employerName: '',
            employerPan: '',
            grossSalary: 0,
            basicSalary: 0,
            hra: 0,
            otherAllowances: 0,
            professionalTax: 0,
            tdsDeducted: 0,
            fromDate: '',
            toDate: '',
        },
    });

    const propertyForm = useForm<Property>({
        defaultValues: {
            id: '',
            propertyType: 'self-occupied',
            address: '',
            annualValue: 0,
            municipalTax: 0,
            interestOnLoan: 0,
            otherExpenses: 0,
        },
    });

    const hasSalaryIncome = form.watch('salaryIncome.hasIncome');
    const hasPropertyIncome = form.watch('housePropertyIncome.hasIncome');
    const hasCapitalGains = form.watch('capitalGains.hasIncome');
    const hasOtherSources = form.watch('otherSources.hasIncome');

    const employers = form.watch('salaryIncome.employers') || [];
    const properties = form.watch('housePropertyIncome.properties') || [];

    const onSubmit = async (data: IncomeDetails) => {
        try {
            await saveAndNext(data);
            const nextStep = getNextStep();
            if (nextStep) {
                router.push(`/form/${nextStep}`);
            }
            toast.success('Income details saved successfully');
        } catch (error) {
            toast.error('Failed to save income details');
        }
    };

    const handleAddEmployer = () => {
        setEditingEmployer(null);
        employerForm.reset({
            id: '',
            employerName: '',
            employerPan: '',
            grossSalary: 0,
            basicSalary: 0,
            hra: 0,
            otherAllowances: 0,
            professionalTax: 0,
            tdsDeducted: 0,
            fromDate: '',
            toDate: '',
        });
        setEmployerDialogOpen(true);
    };

    const handleSaveEmployer = (employerData: Employer) => {
        const currentEmployers = form.getValues('salaryIncome.employers');

        if (editingEmployer) {
            const updatedEmployers = currentEmployers.map(emp =>
                emp.id === editingEmployer.id ? employerData : emp
            );
            form.setValue('salaryIncome.employers', updatedEmployers);
            toast.success('Employer updated');
        } else {
            const newEmployer = {
                ...employerData,
                id: Date.now().toString(),
            };
            form.setValue('salaryIncome.employers', [...currentEmployers, newEmployer]);
            toast.success('Employer added');
        }

        setEmployerDialogOpen(false);
    };
    const handleSaveProperty = (propertyData: Property) => {
        // Assuming 'form' is the react-hook-form instance for your main form
        // and properties are stored under housePropertyIncome.properties
        const currentProperties = form.getValues('housePropertyIncome.properties');

        if (editingProperty) {
            // If editing an existing property
            const updatedProperties = currentProperties.map(prop =>
                prop.id === editingProperty.id ? propertyData : prop
            );
            form.setValue('housePropertyIncome.properties', updatedProperties);
            toast.success('Property updated');
        } else {
            // If adding a new property
            const newProperty = {
                ...propertyData,
                id: Date.now().toString(), // Simple ID generation, consider a more robust method for production
            };
            form.setValue('housePropertyIncome.properties', [...currentProperties, newProperty]);
            toast.success('Property added');
        }

        setPropertyDialogOpen(false); // Close the property dialog
    };
    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Income Details</h1>
                <p className="text-gray-600 mt-2">
                    Enter your income from various sources for the financial year
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Salary Income */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Salary Income</CardTitle>
                            <CardDescription>
                                Income from employment, including salary, wages, and allowances
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="salaryIncome.hasIncome"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>I have salary income</FormLabel>
                                            <FormDescription>
                                                Check this if you received salary from any employer during the financial year
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {hasSalaryIncome && (
                                <div className="space-y-4">
                                    <DataGrid
                                        columns={employerColumns}
                                        data={employers}
                                        onAdd={handleAddEmployer}
                                        onEdit={(employer) => {
                                            setEditingEmployer(employer);
                                            employerForm.reset(employer);
                                            setEmployerDialogOpen(true);
                                        }}
                                        onDelete={(employer) => {
                                            const updatedEmployers = employers.filter(emp => emp.id !== employer.id);
                                            form.setValue('salaryIncome.employers', updatedEmployers);
                                            toast.success('Employer removed');
                                        }}
                                        addButtonText="Add Employer"
                                        searchPlaceholder="Search employers..."
                                        enablePagination={false}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* House Property Income */}
                    <Card>
                        <CardHeader>
                            <CardTitle>House Property Income</CardTitle>
                            <CardDescription>
                                Income from house property including rental income
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="housePropertyIncome.hasIncome"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>I have house property income</FormLabel>
                                            <FormDescription>
                                                Check this if you own property that generates rental income
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {hasPropertyIncome && (
                                <div className="space-y-4">
                                    <DataGrid
                                        columns={propertyColumns}
                                        data={properties}
                                        onAdd={() => {
                                            setEditingProperty(null);
                                            propertyForm.reset({
                                                id: '',
                                                propertyType: 'self-occupied',
                                                address: '',
                                                annualValue: 0,
                                                municipalTax: 0,
                                                interestOnLoan: 0,
                                                otherExpenses: 0,
                                            });
                                            setPropertyDialogOpen(true);
                                        }}
                                        onEdit={(property) => {
                                            setEditingProperty(property);
                                            propertyForm.reset(property);
                                            setPropertyDialogOpen(true);
                                        }}
                                        onDelete={(property) => {
                                            const updatedProperties = properties.filter(prop => prop.id !== property.id);
                                            form.setValue('housePropertyIncome.properties', updatedProperties);
                                            toast.success('Property removed');
                                        }}
                                        addButtonText="Add Property"
                                        searchPlaceholder="Search properties..."
                                        enablePagination={false}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Capital Gains */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Capital Gains</CardTitle>
                            <CardDescription>
                                Gains from sale of capital assets like shares, property, etc.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="capitalGains.hasIncome"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>I have capital gains</FormLabel>
                                            <FormDescription>
                                                Check this if you sold any capital assets during the financial year
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {hasCapitalGains && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="capitalGains.shortTermGains"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Short Term Capital Gains</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Assets held for ≤ 36 months (≤ 12 months for shares)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="capitalGains.longTermGains"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Long Term Capital Gains</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Assets held for {'>'} 36 months ({'>'} 12 months for shares)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="capitalGains.exemptLongTermGains"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Exempt Long Term Gains</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    LTCG exempt under various sections
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Other Sources */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Income from Other Sources</CardTitle>
                            <CardDescription>
                                Interest, dividends, and other miscellaneous income
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="otherSources.hasIncome"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>I have income from other sources</FormLabel>
                                            <FormDescription>
                                                Check this if you have interest, dividends, or other income
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {hasOtherSources && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="otherSources.interestIncome"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Interest Income</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Interest from banks, FDs, etc.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="otherSources.dividendIncome"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dividend Income</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Dividends from shares, mutual funds
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="otherSources.otherIncome"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Other Income</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Any other miscellaneous income
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
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

            {/* Employer Dialog */}
            <Dialog open={employerDialogOpen} onOpenChange={setEmployerDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEmployer ? 'Edit Employer' : 'Add Employer'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the employer details and salary information
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...employerForm}>
                        <form onSubmit={employerForm.handleSubmit(handleSaveEmployer)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={employerForm.control}
                                    name="employerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employer Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Company Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={employerForm.control}
                                    name="employerPan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employer PAN *</FormLabel>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={employerForm.control}
                                    name="grossSalary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gross Salary *</FormLabel>
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
                                    control={employerForm.control}
                                    name="tdsDeducted"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>TDS Deducted *</FormLabel>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={employerForm.control}
                                    name="fromDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={employerForm.control}
                                    name="toDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Date *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEmployerDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingEmployer ? 'Update' : 'Add'} Employer
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Property Dialog */}
            <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProperty ? 'Edit Property' : 'Add Property'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter the property details and related financial information.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...propertyForm}>
                        <form onSubmit={propertyForm.handleSubmit(handleSaveProperty)} className="space-y-4">
                            <FormField
                                control={propertyForm.control}
                                name="propertyType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Property Type *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select property type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="self-occupied">Self-Occupied</SelectItem>
                                                <SelectItem value="let-out">Let-Out</SelectItem>
                                                <SelectItem value="deemed-let-out">Deemed Let-Out</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={propertyForm.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Property Address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={propertyForm.control}
                                    name="annualValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Annual Value *</FormLabel>
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
                                    control={propertyForm.control}
                                    name="municipalTax"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Municipal Tax Paid *</FormLabel>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={propertyForm.control}
                                    name="interestOnLoan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Interest on Loan *</FormLabel>
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
                                    control={propertyForm.control}
                                    name="otherExpenses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Other Expenses</FormLabel>
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
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPropertyDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingProperty ? 'Update' : 'Add'} Property
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}