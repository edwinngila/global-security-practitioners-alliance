"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegistrationProgress } from "@/components/registration-progress"
import { PhoneInput } from "@/components/ui/phone-input"

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
    control,
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
    <div className="min-h-screen bg-background">
      <RegistrationProgress currentStep={1} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold">Personal Information</CardTitle>
              <CardDescription className="text-lg">Let's start with your basic details</CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register("firstName", {
                        required: "First name is required",
                        minLength: { value: 2, message: "Must be at least 2 characters" },
                      })}
                      placeholder="John"
                      className={`h-12 ${errors.firstName ? "border-destructive" : ""}`}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName", {
                        required: "Last name is required",
                        minLength: { value: 2, message: "Must be at least 2 characters" },
                      })}
                      placeholder="Doe"
                      className={`h-12 ${errors.lastName ? "border-destructive" : ""}`}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
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
                    className={`h-12 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Phone Number *</Label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: "Phone number is required",
                      validate: (value) => {
                        if (!value || value.trim().length < 5) {
                          return "Please enter a valid phone number"
                        }
                        return true
                      }
                    }}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter phone number"
                        className={errors.phone ? "border-destructive" : ""}
                      />
                    )}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium">Continue to Professional Info</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
