"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  steps: { number: number; label: string }[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number
        const isCurrent = currentStep === step.number

        return (
          <div key={step.number} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  isCompleted
                    ? "bg-green-100 text-green-600 border-2 border-green-300"
                    : isCurrent
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.number}
              </div>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {isCompleted ? "Completado" : step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 h-px w-6 sm:w-12 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
