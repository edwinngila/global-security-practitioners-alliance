"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationProgress } from "@/components/registration-progress"

interface Step1Form {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep1() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<Step1Form>({
    mode: "onSubmit",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  })

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("registration-step-1")
    if (saved) {
      const data = JSON.parse(saved)
      reset(data)
    }
  }, [reset])

  // Auto-save form data
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
                      {...register("firstName", {
                        required: "First name is required",
                        minLength: { value: 2, message: "Must be at least 2 characters" },
                      })}
                      placeholder="John"
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName", {
                        required: "Last name is required",
                        minLength: { value: 2, message: "Must be at least 2 characters" },
                      })}
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
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    placeholder="john.doe@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />

                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+254712345678"
                  />
                </div>

                <Button type="submit" className="w-full">Next</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
