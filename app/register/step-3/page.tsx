"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RegistrationProgress } from "@/components/registration-progress"
import { SignaturePad } from "@/components/signature-pad"
import { PhotoUpload } from "@/components/photo-upload"

interface Step3Form {
  documentType: string
  documentNumber: string
  passportPhoto: File | null
  signature: string | null
  declarationAccepted: boolean
}

const stepTitles = ["Personal Info", "Professional Info", "Documents", "Review"]

export default function RegisterStep3() {
  const router = useRouter()
  const [photoFile, setPhotoFile] = useState<File | null>(null)

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
        if (key !== "passportPhoto") {
          setValue(key as keyof Step3Form, data[key])
        }
      })
    }
  }, [setValue])

  const formData = watch()
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const dataToSave = { ...formData }
      delete dataToSave.passportPhoto // Don't save file to localStorage
      localStorage.setItem("registration-step-3", JSON.stringify(dataToSave))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const onSubmit = (data: Step3Form) => {
    const dataToSave = { ...data }
    delete dataToSave.passportPhoto // Don't save file to localStorage
    localStorage.setItem("registration-step-3", JSON.stringify(dataToSave))

    // Store photo file separately if needed
    if (photoFile) {
      // In a real app, you'd upload this to your server
      console.log("Photo file:", photoFile)
    }

    router.push("/register/step-4")
  }

  const goBack = () => {
    router.push("/register/step-2")
  }

  return (
    <div className="min-h-screen form-gradient">
      <RegistrationProgress currentStep={3} totalSteps={4} stepTitles={stepTitles} />

      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="form-card shadow-2xl border-0">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Documents & Verification
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Upload your documents and provide your digital signature
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Document Information */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Document Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Document Type *</Label>
                      <Controller
                        name="documentType"
                        control={control}
                        rules={{ required: "Please select a document type" }}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={cn("h-12", errors.documentType ? "border-red-500" : "")}>
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
                        className={cn("h-12", errors.documentNumber ? "border-red-500" : "")}
                      />
                      {errors.documentNumber && <p className="text-sm text-red-600">{errors.documentNumber.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2 mb-6">
                    Passport Photo
                  </h3>
                  <Controller
                    name="passportPhoto"
                    control={control}
                    rules={{ required: "Passport photo is required" }}
                    render={({ field }) => (
                      <PhotoUpload
                        onPhotoChange={(file) => {
                          setPhotoFile(file)
                          field.onChange(file)
                        }}
                        value={field.value}
                        required
                        error={errors.passportPhoto?.message}
                      />
                    )}
                  />
                </div>

                {/* Digital Signature */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-green-200 pb-2 mb-6">
                    Digital Signature
                  </h3>
                  <Controller
                    name="signature"
                    control={control}
                    rules={{ required: "Digital signature is required" }}
                    render={({ field }) => (
                      <SignaturePad
                        onSignatureChange={field.onChange}
                        value={field.value}
                        required
                        error={errors.signature?.message}
                      />
                    )}
                  />
                </div>

                {/* Declaration */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
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
                    <div className="space-y-3">
                      <Label htmlFor="declaration" className="text-base font-semibold text-amber-800">
                        Declaration & Agreement *
                      </Label>
                      <div className="text-sm text-amber-700 space-y-2">
                        <p>
                          I hereby declare that all information provided is true and accurate to the best of my
                          knowledge. I understand that any false information may result in disqualification from the
                          certification process and may have legal consequences.
                        </p>
                        <p>
                          By signing above, I agree to the terms and conditions of the Global Security Practitioners
                          Alliance and consent to the processing of my personal data for certification purposes.
                        </p>
                      </div>
                      {errors.declarationAccepted && (
                        <p className="text-sm text-red-600">{errors.declarationAccepted.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={goBack} className="px-8 py-3 bg-transparent">
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Review & Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
