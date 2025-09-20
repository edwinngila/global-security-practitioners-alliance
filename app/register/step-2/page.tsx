"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegistrationProgress } from "@/components/registration-progress"

const step2Schema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  gender: z.string().min(1, "Please select your gender"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  designation: z.string().min(1, "Designation is required"),
  organization: z.string().min(1, "Organization is required"),
})

type Step2Form = z.infer<typeof step2Schema>

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
    resolver: zodResolver(step2Schema),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <RegistrationProgress currentStep={2} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Professional Information</CardTitle>
              <CardDescription>Tell us about your background and role</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nationality *</Label>
                    <Controller
                      name="nationality"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={errors.nationality ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
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
                    {errors.nationality && <p className="text-sm text-red-600">{errors.nationality.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
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
                    {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation/Role *</Label>
                  <Input
                    id="designation"
                    {...register("designation")}
                    placeholder="Security Manager"
                    className={errors.designation ? "border-red-500" : ""}
                  />
                  {errors.designation && <p className="text-sm text-red-600">{errors.designation.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    {...register("organization")}
                    placeholder="ABC Corporation"
                    className={errors.organization ? "border-red-500" : ""}
                  />
                  {errors.organization && <p className="text-sm text-red-600">{errors.organization.message}</p>}
                </div>

                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={goBack}>
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
