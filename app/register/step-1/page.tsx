"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationProgress } from "@/components/registration-progress"

const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
})

type Step1Form = z.infer<typeof step1Schema>

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep1() {
  const router = useRouter()
  const [savedData, setSavedData] = useState<Step1Form | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    mode: "onSubmit", // Only validate on submit to reduce errors
  })

  useEffect(() => {
    const saved = localStorage.getItem("registration-step-1")
    if (saved) {
      const data = JSON.parse(saved)
      setSavedData(data)
      Object.keys(data).forEach((key) => {
        setValue(key as keyof Step1Form, data[key])
      })
    }
  }, [setValue])

  const formData = watch()
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("registration-step-1", JSON.stringify(formData))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const onSubmit = (data: Step1Form) => {
    localStorage.setItem("registration-step-1", JSON.stringify(data))
    router.push("/register/step-2")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <RegistrationProgress currentStep={1} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Personal Information</CardTitle>
              <CardDescription>Let's start with your basic details</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="John"
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Doe"
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john.doe@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+1234567890"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
                </div>

                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" disabled>
                    Previous
                  </Button>
                  <Button type="submit">Next Step</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
