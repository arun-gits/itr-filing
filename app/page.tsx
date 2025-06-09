"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { FileText, Upload, Download, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [hasExistingData, setHasExistingData] = useState(false);
  const [completionStatus, setCompletionStatus] = useState({
    personalDetails: false,
    incomeDetails: false,
    deductions: false,
    taxSummary: false,
  });

  useEffect(() => {
    setHasExistingData(storage.hasData());
    setCompletionStatus(storage.getCompletionStatus());
  }, []);

  const handleStartNew = () => {
    if (hasExistingData) {
      const confirmed = confirm('This will clear all existing data. Are you sure you want to start a new ITR?');
      if (confirmed) {
        storage.clear();
        toast.success('Previous data cleared');
        router.push('/form/personal');
      }
    } else {
      router.push('/form/personal');
    }
  };

  const handleContinue = () => {
    // Find the first incomplete section
    if (!completionStatus.personalDetails) {
      router.push('/form/personal');
    } else if (!completionStatus.incomeDetails) {
      router.push('/form/income');
    } else if (!completionStatus.deductions) {
      router.push('/form/deductions');
    } else {
      router.push('/form/summary');
    }
  };

  const handleExport = () => {
    try {
      const data = storage.export();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itr-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string;
            const success = storage.import(data);
            if (success) {
              toast.success('Data imported successfully');
              setHasExistingData(true);
              setCompletionStatus(storage.getCompletionStatus());
            } else {
              toast.error('Failed to import data');
            }
          } catch (error) {
            toast.error('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getCompletionPercentage = () => {
    const completed = Object.values(completionStatus).filter(Boolean).length;
    return Math.round((completed / 4) * 100);
  };

  const completedSections = Object.values(completionStatus).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ITR Data Entry System
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional Income Tax Return filing application with comprehensive validation,
              real-time calculations, and secure data management.
            </p>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* New ITR Card */}
            <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Start New ITR</CardTitle>
                <CardDescription>
                  Begin a fresh Income Tax Return filing process with step-by-step guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartNew} 
                  className="w-full" 
                  size="lg"
                >
                  Start New Return
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Continue ITR Card */}
            <Card className={`relative overflow-hidden border-2 ${
              hasExistingData 
                ? 'border-green-200 hover:border-green-400' 
                : 'border-gray-200 opacity-60'
            } transition-colors`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-green-700">Continue ITR</CardTitle>
                    <CardDescription>
                      Resume your saved progress and complete remaining sections
                    </CardDescription>
                  </div>
                  {hasExistingData && (
                    <Badge variant="secondary">
                      {getCompletionPercentage()}% Complete
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasExistingData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${completionStatus.personalDetails ? 'text-green-600' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${completionStatus.personalDetails ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Personal Details
                      </div>
                      <div className={`flex items-center gap-2 ${completionStatus.incomeDetails ? 'text-green-600' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${completionStatus.incomeDetails ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Income Details
                      </div>
                      <div className={`flex items-center gap-2 ${completionStatus.deductions ? 'text-green-600' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${completionStatus.deductions ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Deductions
                      </div>
                      <div className={`flex items-center gap-2 ${completionStatus.taxSummary ? 'text-green-600' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${completionStatus.taxSummary ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Tax Summary
                      </div>
                    </div>
                    <Button 
                      onClick={handleContinue} 
                      className="w-full" 
                      variant="default"
                      size="lg"
                    >
                      Continue Filing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">No saved progress found</p>
                    <Button disabled className="w-full" size="lg">
                      No Data to Continue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data for backup or import previously saved data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={!hasExistingData}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" onClick={handleImport}>
                  <Download className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
                {hasExistingData && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      const confirmed = confirm('Are you sure you want to clear all data? This cannot be undone.');
                      if (confirmed) {
                        storage.clear();
                        setHasExistingData(false);
                        setCompletionStatus({
                          personalDetails: false,
                          incomeDetails: false,
                          deductions: false,
                          taxSummary: false,
                        });
                        toast.success('All data cleared');
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Comprehensive Forms</h3>
              <p className="text-sm text-gray-600">
                All ITR sections with proper validation and real-time calculations
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Auto-Save</h3>
              <p className="text-sm text-gray-600">
                Your progress is automatically saved as you work
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Export & Print</h3>
              <p className="text-sm text-gray-600">
                Generate professional reports ready for submission
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}