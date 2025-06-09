"use client";

import * as React from "react";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  className,
}: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn(
      "flex",
      orientation === "horizontal" ? "flex-row items-center justify-between" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isPast = step.completed && index < currentStepIndex;
        const isFuture = !step.completed && index > currentStepIndex;
        const isClickable = onStepClick && (step.completed || index <= currentStepIndex);

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center",
                orientation === "vertical" ? "flex-row" : "flex-col",
                isClickable && "cursor-pointer",
                orientation === "horizontal" && "text-center"
              )}
              onClick={isClickable ? () => onStepClick(step.id) : undefined}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                isPast && "bg-primary border-primary text-primary-foreground",
                isActive && "bg-primary border-primary text-primary-foreground",
                isFuture && "bg-background border-border text-muted-foreground",
                isClickable && "hover:border-primary/50"
              )}>
                {isPast ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5\" fill={isActive ? "currentColor" : "none"} />
                )}
              </div>
              <div className={cn(
                orientation === "horizontal" ? "mt-2" : "ml-3"
              )}>
                <div className={cn(
                  "text-sm font-medium",
                  isActive && "text-primary",
                  (isPast || isActive) && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "transition-colors",
                orientation === "horizontal" 
                  ? "flex-1 h-0.5 mx-4 bg-border" 
                  : "w-0.5 h-6 ml-4 bg-border",
                index < currentStepIndex && "bg-primary"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}