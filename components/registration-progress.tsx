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
    <div className="w-full step-indicator py-6 shadow-lg">
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
                      "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-3 transition-all duration-300 shadow-lg",
                      isCompleted
                        ? "bg-white text-green-600 border-green-500 shadow-green-200"
                        : isCurrent
                          ? "bg-white text-purple-600 border-purple-500 shadow-purple-200 scale-110"
                          : "bg-white/20 border-white/30 text-white/70",
                    )}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : stepNumber}
                  </div>
                  <span
                    className={cn(
                      "mt-3 text-sm font-medium text-center max-w-24 leading-tight",
                      isCurrent ? "text-white font-bold" : isCompleted ? "text-white/90" : "text-white/60",
                    )}
                  >
                    {title}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-6 rounded-full transition-all duration-500",
                      isCompleted ? "bg-white shadow-sm" : "bg-white/20",
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
