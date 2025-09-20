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
    <div className="w-full bg-white border-b border-gray-200 py-4">
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
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-500",
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium text-center max-w-20",
                      isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500",
                    )}
                  >
                    {title}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={cn("flex-1 h-0.5 mx-4 transition-colors", isCompleted ? "bg-green-500" : "bg-gray-300")}
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
