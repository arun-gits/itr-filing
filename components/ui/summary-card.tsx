"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  printable?: boolean;
  headerActions?: React.ReactNode;
}

export function SummaryCard({
  title,
  children,
  defaultOpen = true,
  className,
  printable = false,
  headerActions,
}: SummaryCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 hover:bg-transparent">
                <CardTitle className="text-left flex items-center gap-2">
                  {title}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              {printable && (
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              {headerActions}
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface SummaryItemProps {
  label: string;
  value: string | number;
  emphasis?: boolean;
  className?: string;
}

export function SummaryItem({ label, value, emphasis = false, className }: SummaryItemProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  return (
    <div className={cn(
      "flex justify-between items-center py-2 border-b border-border/50 last:border-b-0",
      emphasis && "font-semibold text-primary",
      className
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm", emphasis && "text-primary font-medium")}>
        {formatValue(value)}
      </span>
    </div>
  );
}

interface SummaryGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function SummaryGrid({ children, columns = 2, className }: SummaryGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}