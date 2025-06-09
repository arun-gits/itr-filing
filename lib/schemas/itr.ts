import { z } from 'zod';

// Validation patterns
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const aadhaarPattern = /^[0-9]{12}$/;
const phonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Personal Details Schema
export const personalDetailsSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  pan: z.string().regex(panPattern, 'Invalid PAN format (e.g., ABCDE1234F)'),
  aadhaar: z.string().regex(aadhaarPattern, 'Aadhaar must be 12 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  fatherName: z.string().min(2, 'Father name is required'),
  motherName: z.string().min(2, 'Mother name is required'),
  nationality: z.string().default('Indian'),
  residential: z.enum(['resident', 'non-resident', 'not-ordinarily-resident']),
  email: z.string().regex(emailPattern, 'Invalid email format'),
  phone: z.string().regex(phonePattern, 'Invalid phone number'),
  address: z.object({
    flatNo: z.string().min(1, 'Flat/House number is required'),
    building: z.string().optional(),
    area: z.string().min(1, 'Area/Locality is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits').max(6),
    country: z.string().default('India'),
  }),
  bankAccounts: z.array(z.object({
    id: z.string(),
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
    ifscCode: z.string().min(11, 'IFSC code must be 11 characters').max(11),
    accountType: z.enum(['savings', 'current', 'salary', 'other']),
    isPrimary: z.boolean().default(false),
  })),
});

// Income Details Schema
export const incomeDetailsSchema = z.object({
  salaryIncome: z.object({
    hasIncome: z.boolean().default(false),
    employers: z.array(z.object({
      id: z.string(),
      employerName: z.string().min(1, 'Employer name is required'),
      employerPan: z.string().regex(panPattern, 'Invalid employer PAN'),
      grossSalary: z.number().min(0, 'Gross salary cannot be negative'),
      basicSalary: z.number().min(0, 'Basic salary cannot be negative'),
      hra: z.number().min(0, 'HRA cannot be negative'),
      otherAllowances: z.number().min(0, 'Other allowances cannot be negative'),
      professionalTax: z.number().min(0, 'Professional tax cannot be negative'),
      tdsDeducted: z.number().min(0, 'TDS cannot be negative'),
      fromDate: z.string(),
      toDate: z.string(),
    })),
  }),
  housePropertyIncome: z.object({
    hasIncome: z.boolean().default(false),
    properties: z.array(z.object({
      id: z.string(),
      propertyType: z.enum(['self-occupied', 'let-out', 'deemed-let-out']),
      address: z.string().min(1, 'Property address is required'),
      annualValue: z.number().min(0, 'Annual value cannot be negative'),
      municipalTax: z.number().min(0, 'Municipal tax cannot be negative'),
      interestOnLoan: z.number().min(0, 'Interest on loan cannot be negative'),
      otherExpenses: z.number().min(0, 'Other expenses cannot be negative'),
    })),
  }),
  capitalGains: z.object({
    hasIncome: z.boolean().default(false),
    shortTermGains: z.number().min(0, 'Short term gains cannot be negative'),
    longTermGains: z.number().min(0, 'Long term gains cannot be negative'),
    exemptLongTermGains: z.number().min(0, 'Exempt long term gains cannot be negative'),
  }),
  otherSources: z.object({
    hasIncome: z.boolean().default(false),
    interestIncome: z.number().min(0, 'Interest income cannot be negative'),
    dividendIncome: z.number().min(0, 'Dividend income cannot be negative'),
    otherIncome: z.number().min(0, 'Other income cannot be negative'),
  }),
});

// Deductions Schema
export const deductionsSchema = z.object({
  section80C: z.object({
    lifeInsurance: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    epf: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    ppf: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    elss: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    nsc: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    homeLoanPrincipal: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    tuitionFees: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
    other80C: z.number().min(0).max(150000, 'Maximum limit is ₹1,50,000'),
  }),
  section80D: z.object({
    healthInsuranceSelf: z.number().min(0).max(25000, 'Maximum limit is ₹25,000'),
    healthInsuranceFamily: z.number().min(0).max(25000, 'Maximum limit is ₹25,000'),
    healthInsuranceParents: z.number().min(0).max(50000, 'Maximum limit is ₹50,000'),
    preventiveHealthCheckup: z.number().min(0).max(5000, 'Maximum limit is ₹5,000'),
  }),
  otherDeductions: z.object({
    section80E: z.number().min(0, 'Education loan interest cannot be negative'),
    section80G: z.array(z.object({
      id: z.string(),
      doneeInstitution: z.string().min(1, 'Institution name is required'),
      doneeAddress: z.string().min(1, 'Institution address is required'),
      doneePan: z.string().regex(panPattern, 'Invalid institution PAN'),
      amount: z.number().min(0, 'Donation amount cannot be negative'),
      deductionPercentage: z.enum(['50', '100']),
      qualifyingAmount: z.number().min(0, 'Qualifying amount cannot be negative'),
    })),
    section80TTA: z.number().min(0).max(10000, 'Maximum limit is ₹10,000'),
    section80U: z.number().min(0).max(125000, 'Maximum limit is ₹1,25,000'),
  }),
});

// Tax Summary Schema
export const taxSummarySchema = z.object({
  totalIncome: z.number(),
  totalDeductions: z.number(),
  taxableIncome: z.number(),
  taxBeforeRelief: z.number(),
  reliefUnder89: z.number().min(0),
  taxAfterRelief: z.number(),
  surcharge: z.number(),
  educationCess: z.number(),
  totalTaxLiability: z.number(),
  advanceTaxPaid: z.number().min(0),
  tdsDeducted: z.number().min(0),
  selfAssessmentTax: z.number().min(0),
  refundOrPayable: z.number(),
  verification: z.object({
    place: z.string().min(1, 'Place is required'),
    date: z.string().min(1, 'Date is required'),
    declarationAccepted: z.boolean().refine(val => val === true, 'You must accept the declaration'),
  }),
});

// Complete ITR Schema
export const itrSchema = z.object({
  personalDetails: personalDetailsSchema,
  incomeDetails: incomeDetailsSchema,
  deductions: deductionsSchema,
  taxSummary: taxSummarySchema,
});

export type PersonalDetails = z.infer<typeof personalDetailsSchema>;
export type IncomeDetails = z.infer<typeof incomeDetailsSchema>;
export type Deductions = z.infer<typeof deductionsSchema>;
export type TaxSummary = z.infer<typeof taxSummarySchema>;
export type ITRData = z.infer<typeof itrSchema>;