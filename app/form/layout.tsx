"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { storage } from '@/lib/storage';
import { Home, Save } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  {
    id: 'personal',
    title: 'Personal Details',
    description: 'Basic information and addresses',
    route: '/form/personal',
  },
  {
    id: 'income',
    title: 'Income Details', 
    description: 'Salary, property, and other income',
    route: '/form/income',
  },
  {
    id: 'deductions',
    title: 'Deductions',
    description: '80C, 80D and other deductions',
    route: '/form/deductions',
  },
  {
    id: 'summary',
    title: 'Tax Summary',
    description: 'Review and finalize',
    route: '/form/summary',
  },
];

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [completionStatus, setCompletionStatus] = useState({
    personalDetails: false,
    incomeDetails: false,
    deductions: false,
    taxSummary: false,
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentStepId = pathname.split('/').pop() || 'personal';

  useEffect(() => {
    const updateStatus = () => {
      setCompletionStatus(storage.getCompletionStatus());
    };

    updateStatus();
    const unsubscribe = storage.subscribe(updateStatus);
    return unsubscribe;
  }, []);

  const progressSteps = steps.map(step => ({
    ...step,
    completed: completionStatus[step.id === 'personal' ? 'personalDetails' :
                                step.id === 'income' ? 'incomeDetails' :
                                step.id === 'deductions' ? 'deductions' : 'taxSummary'],
  }));

  const handleStepClick = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      router.push(step.route);
    }
  };

  const handleSaveAndExit = () => {
    // Data is automatically saved, just show confirmation and redirect
    toast.success('Progress saved successfully');
    router.push('/');
  };

  // Auto-save status indicator
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold text-gray-900">
                ITR Data Entry
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              <div className="text-sm text-muted-foreground">
                {autoSaveStatus === 'saving' && 'Saving...'}
                {autoSaveStatus === 'saved' && 'Saved'}
                {autoSaveStatus === 'idle' && 'Auto-save enabled'}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save & Exit
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <ProgressIndicator
              steps={progressSteps}
              currentStep={currentStepId}
              onStepClick={handleStepClick}
              orientation="horizontal"
              className="max-w-4xl mx-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              ITR Data Entry System - Assessment Year 2024-25
            </div>
            <div>
              Step {steps.findIndex(s => s.id === currentStepId) + 1} of {steps.length}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}