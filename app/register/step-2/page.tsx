"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegistrationProgress } from "@/components/registration-progress"

interface Step2Form {
  nationality: string
  gender: string
  dateOfBirth: string
  designation: string
  organization: string
}

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep2() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step2Form>({
    mode: "onSubmit",
  })

  useEffect(() => {
    const saved = localStorage.getItem("registration-step-2")
    if (saved) {
      const data = JSON.parse(saved)
      Object.keys(data).forEach((key) => {
        setValue(key as keyof Step2Form, data[key])
      })
    }
  }, [setValue])

  const formData = watch()
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("registration-step-2", JSON.stringify(formData))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const onSubmit = (data: Step2Form) => {
    localStorage.setItem("registration-step-2", JSON.stringify(data))
    router.push("/register/step-3")
  }

  const goBack = () => {
    router.push("/register/step-1")
  }

  return (
    <div className="min-h-screen bg-background">
      <RegistrationProgress currentStep={2} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold">Professional Information</CardTitle>
              <CardDescription className="text-lg">Tell us about your background and role</CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Nationality *</Label>
                    <Controller
                      name="nationality"
                      control={control}
                      rules={{ required: "Please select your nationality" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`h-12 ${errors.nationality ? "border-destructive" : ""}`}>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kenya">Kenya</SelectItem>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="au">Australia</SelectItem>
                            <SelectItem value="de">Germany</SelectItem>
                            <SelectItem value="fr">France</SelectItem>
                            <SelectItem value="jp">Japan</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.nationality && <p className="text-sm text-destructive">{errors.nationality.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Gender *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      rules={{ required: "Please select your gender" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`h-12 ${errors.gender ? "border-destructive" : ""}`}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth", {
                      required: "Date of birth is required",
                    })}
                    className={`h-12 ${errors.dateOfBirth ? "border-destructive" : ""}`}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="designation" className="text-sm font-medium">Designation/Role *</Label>
                  <Input
                    id="designation"
                    {...register("designation", {
                      required: "Designation is required",
                      minLength: { value: 2, message: "Designation must be at least 2 characters" },
                    })}
                    placeholder="Security Manager"
                    className={`h-12 ${errors.designation ? "border-destructive" : ""}`}
                  />
                  {errors.designation && <p className="text-sm text-destructive">{errors.designation.message}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="organization" className="text-sm font-medium">Organization *</Label>
                  <Input
                    id="organization"
                    {...register("organization", {
                      required: "Organization is required",
                      minLength: { value: 2, message: "Organization must be at least 2 characters" },
                    })}
                    placeholder="ABC Corporation"
                    className={`h-12 ${errors.organization ? "border-destructive" : ""}`}
                  />
                  {errors.organization && <p className="text-sm text-destructive">{errors.organization.message}</p>}
                </div>

                <div className="flex justify-between pt-8">
                  <Button type="button" variant="outline" onClick={goBack} className="px-8">
                    Previous
                  </Button>
                  <Button type="submit" className="px-8">Continue to Documents</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
