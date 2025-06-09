import { IncomeDetails, Deductions } from './schemas/itr';

export interface TaxCalculation {
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBeforeRelief: number;
  surcharge: number;
  educationCess: number;
  totalTaxLiability: number;
}

// Tax slabs for AY 2024-25 (Old Regime)
const TAX_SLABS_OLD = 
// [
//   { min: 0, max: 250000, rate: 0 },
//   { min: 250000, max: 500000, rate: 5 },
//   { min: 500000, max: 1000000, rate: 20 },
//   { min: 1000000, max: Infinity, rate: 30 },
// ];
[
    { min: 0, max: 250000, rate: 0 },      // No tax up to ₹2.5 lakh
    { min: 250001, max: 500000, rate: 5 }, // 5% for ₹2.5 lakh to ₹5 lakh
    { min: 500001, max: 1000000, rate: 20 }, // 20% for ₹5 lakh to ₹10 lakh
    { min: 1000001, max: Infinity, rate: 30 }, // 30% above ₹10 lakh
  ];
// Tax slabs for AY 2024-25 (New Regime)
const TAX_SLABS_NEW = 
// [
//   { min: 0, max: 300000, rate: 0 },
//   { min: 300000, max: 600000, rate: 5 },
//   { min: 600000, max: 900000, rate: 10 },
//   { min: 900000, max: 1200000, rate: 15 },
//   { min: 1200000, max: 1500000, rate: 20 },
//   { min: 1500000, max: Infinity, rate: 30 },
// ];
[
    { min: 0, max: 300000, rate: 0 },      // No tax up to ₹3 lakh
    { min: 300001, max: 600000, rate: 5 }, // 5% for ₹3 lakh to ₹6 lakh
    { min: 600001, max: 900000, rate: 10 }, // 10% for ₹6 lakh to ₹9 lakh
    { min: 900001, max: 1200000, rate: 15 }, // 15% for ₹9 lakh to ₹12 lakh
    { min: 1200001, max: 1500000, rate: 20 }, // 20% for ₹12 lakh to ₹15 lakh
    { min: 1500001, max: Infinity, rate: 30 }, // 30% above ₹15 lakh
  ];
export class TaxCalculator {
  static calculateTotalIncome(incomeDetails: IncomeDetails): number {
    let totalIncome = 0;

    // Salary Income
    if (incomeDetails.salaryIncome.hasIncome) {
      incomeDetails.salaryIncome.employers.forEach(employer => {
        totalIncome += employer.grossSalary;
      });
    }

    // House Property Income
    if (incomeDetails.housePropertyIncome.hasIncome) {
      incomeDetails.housePropertyIncome.properties.forEach(property => {
        const netIncome = property.annualValue - property.municipalTax - property.interestOnLoan - property.otherExpenses;
        totalIncome += Math.max(netIncome, 0); // Cannot be negative
      });
    }

    // Capital Gains
    if (incomeDetails.capitalGains.hasIncome) {
      totalIncome += incomeDetails.capitalGains.shortTermGains;
      totalIncome += incomeDetails.capitalGains.longTermGains;
    }

    // Other Sources
    if (incomeDetails.otherSources.hasIncome) {
      totalIncome += incomeDetails.otherSources.interestIncome;
      totalIncome += incomeDetails.otherSources.dividendIncome;
      totalIncome += incomeDetails.otherSources.otherIncome;
    }

    return totalIncome;
  }

  static calculateTotalDeductions(deductions: Deductions): number {
    let totalDeductions = 0;

    // Section 80C
    const section80CTotal = Object.values(deductions.section80C).reduce((sum, value) => sum + value, 0);
    totalDeductions += Math.min(section80CTotal, 150000); // Maximum limit

    // Section 80D
    const section80DTotal = Object.values(deductions.section80D).reduce((sum, value) => sum + value, 0);
    totalDeductions += section80DTotal;

    // Other Deductions
    totalDeductions += deductions.otherDeductions.section80E;
    totalDeductions += deductions.otherDeductions.section80TTA;
    totalDeductions += deductions.otherDeductions.section80U;

    // Section 80G donations
    deductions.otherDeductions.section80G.forEach(donation => {
      totalDeductions += donation.qualifyingAmount;
    });

    return totalDeductions;
  }

  static calculateTax(taxableIncome: number, useNewRegime: boolean = false): number {
    const slabs = useNewRegime ? TAX_SLABS_NEW : TAX_SLABS_OLD;
    let tax = 0;

    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
        tax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    return tax;
  }

  static calculateSurcharge(taxableIncome: number, baseTax: number): number {
    if (taxableIncome <= 5000000) return 0;
    if (taxableIncome <= 10000000) return baseTax * 0.10;
    if (taxableIncome <= 20000000) return baseTax * 0.15;
    if (taxableIncome <= 50000000) return baseTax * 0.25;
    return baseTax * 0.37;
  }

  static calculateEducationCess(taxAndSurcharge: number): number {
    return taxAndSurcharge * 0.04; // 4% education cess
  }

  static calculateCompleteTax(incomeDetails: IncomeDetails, deductions: Deductions, useNewRegime: boolean = false): TaxCalculation {
    const totalIncome = this.calculateTotalIncome(incomeDetails);
    const totalDeductions = useNewRegime ? 0 : this.calculateTotalDeductions(deductions); // No deductions in new regime
    const taxableIncome = Math.max(totalIncome - totalDeductions, 0);
    
    const taxBeforeRelief = this.calculateTax(taxableIncome, useNewRegime);
    const surcharge = this.calculateSurcharge(taxableIncome, taxBeforeRelief);
    const taxAfterSurcharge = taxBeforeRelief + surcharge;
    const educationCess = this.calculateEducationCess(taxAfterSurcharge);
    const totalTaxLiability = taxAfterSurcharge + educationCess;

    return {
      totalIncome,
      totalDeductions,
      taxableIncome,
      taxBeforeRelief,
      surcharge,
      educationCess,
      totalTaxLiability,
    };
  }

  static compareTaxRegimes(incomeDetails: IncomeDetails, deductions: Deductions): {
    oldRegime: TaxCalculation;
    newRegime: TaxCalculation;
    betterRegime: 'old' | 'new';
  } {
    const oldRegime = this.calculateCompleteTax(incomeDetails, deductions, false);
    const newRegime = this.calculateCompleteTax(incomeDetails, deductions, true);
    const betterRegime = oldRegime.totalTaxLiability <= newRegime.totalTaxLiability ? 'old' : 'new';

    return {
      oldRegime,
      newRegime,
      betterRegime,
    };
  }
}