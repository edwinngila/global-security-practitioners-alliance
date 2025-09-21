"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface RegistrationProgressProps {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}

export function RegistrationProgress({ currentStep, totalSteps, stepTitles }: RegistrationProgressProps) {
  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-8 border-b border-border/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <div key={stepNumber} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all duration-300 shadow-md",
                      isCompleted
                        ? "bg-green-500 text-white border-green-500 shadow-green-200"
                        : isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-110"
                          : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : stepNumber}
                  </div>
                  <span
                    className={cn(
                      "mt-3 text-sm font-medium text-center max-w-24 leading-tight",
                      isCurrent ? "text-primary font-semibold" : isCompleted ? "text-green-600" : "text-muted-foreground",
                    )}
                  >
                    {title}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-6 rounded-full transition-all duration-500",
                      isCompleted ? "bg-green-500" : "bg-border",
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
