"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { storage } from '@/lib/storage';
import { ITRData } from '@/lib/schemas/itr';

export type FormStep = 'personal' | 'income' | 'deductions' | 'summary';

interface UseITRFormOptions<T extends z.ZodType> {
  step: FormStep;
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
}

export function useITRForm<T extends z.ZodType>({
  step,
  schema,
  defaultValues,
}: UseITRFormOptions<T>) {
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  type FormFields = z.infer<T>;
  
  const form = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: (defaultValues || {}) as FormFields,
    mode: 'onChange',
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = storage.load();
    const stepData = savedData[step === 'personal' ? 'personalDetails' : 
                             step === 'income' ? 'incomeDetails' :
                             step === 'deductions' ? 'deductions' : 'taxSummary'];
    
    if (stepData) {
      form.reset(stepData);
    }
    setIsLoading(false);
  }, [form, step]);

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (!isLoading && data) {
        setAutoSaveStatus('saving');
        const saveData: Partial<ITRData> = {
          [step === 'personal' ? 'personalDetails' : 
           step === 'income' ? 'incomeDetails' :
           step === 'deductions' ? 'deductions' : 'taxSummary']: data
        };
        
        storage.autoSave(saveData);
        
        // Show saved status briefly
        setTimeout(() => {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, step, isLoading]);

  const saveAndNext = async (data: z.infer<T>) => {
    const saveData: Partial<ITRData> = {
      [step === 'personal' ? 'personalDetails' : 
       step === 'income' ? 'incomeDetails' :
       step === 'deductions' ? 'deductions' : 'taxSummary']: data
    };
    
    storage.save(saveData);
    return true;
  };

  const getNextStep = (): FormStep | null => {
    const steps: FormStep[] = ['personal', 'income', 'deductions', 'summary'];
    const currentIndex = steps.indexOf(step);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  };

  const getPreviousStep = (): FormStep | null => {
    const steps: FormStep[] = ['personal', 'income', 'deductions', 'summary'];
    const currentIndex = steps.indexOf(step);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  };

  return {
    form,
    isLoading,
    autoSaveStatus,
    saveAndNext,
    getNextStep,
    getPreviousStep,
  };
}