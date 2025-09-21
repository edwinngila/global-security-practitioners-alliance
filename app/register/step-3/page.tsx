"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RegistrationProgress } from "@/components/registration-progress"

interface Step3Form {
  documentType: string
  documentNumber: string
  declarationAccepted: boolean
}

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep3() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step3Form>({
    mode: "onSubmit",
  })

  useEffect(() => {
    const saved = localStorage.getItem("registration-step-3")
    if (saved) {
      const data = JSON.parse(saved)
      Object.keys(data).forEach((key) => {
        setValue(key as keyof Step3Form, data[key])
      })
    }
  }, [setValue])

  const formData = watch()
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("registration-step-3", JSON.stringify(formData))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const onSubmit = (data: Step3Form) => {
    localStorage.setItem("registration-step-3", JSON.stringify(data))
    router.push("/register/step-4")
  }

  const goBack = () => {
    router.push("/register/step-2")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <RegistrationProgress currentStep={3} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Documents & Declaration</CardTitle>
              <CardDescription>Provide your identification and accept our terms</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Controller
                      name="documentType"
                      control={control}
                      rules={{ required: "Please select a document type" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={errors.documentType ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.documentType && <p className="text-sm text-red-600">{errors.documentType.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Document Number *</Label>
                    <Input
                      id="documentNumber"
                      {...register("documentNumber", {
                        required: "Document number is required",
                        minLength: { value: 3, message: "Document number must be at least 3 characters" },
                      })}
                      placeholder="Enter document number"
                      className={errors.documentNumber ? "border-red-500" : ""}
                    />
                    {errors.documentNumber && <p className="text-sm text-red-600">{errors.documentNumber.message}</p>}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Controller
                      name="declarationAccepted"
                      control={control}
                      rules={{
                        required: "You must accept the declaration",
                        validate: (value) => value === true || "You must accept the declaration",
                      }}
                      render={({ field }) => (
                        <Checkbox
                          id="declaration"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      )}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="declaration" className="text-sm font-medium">
                        Declaration *
                      </Label>
                      <p className="text-xs text-gray-600">
                        I hereby declare that all information provided is true and accurate to the best of my knowledge.
                        I understand that any false information may result in disqualification from the certification
                        process and may have legal consequences.
                      </p>
                      {errors.declarationAccepted && (
                        <p className="text-sm text-red-600">{errors.declarationAccepted.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={goBack}>
                    Previous
                  </Button>
                  <Button type="submit">Review & Submit</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
