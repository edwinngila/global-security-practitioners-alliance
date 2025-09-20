"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Upload, X, ChevronLeft, ChevronRight, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"

// Enhanced validation schemas
const phoneRegex = /^[+]?[\d\s\-$$$$]+$/

const documentNumberValidation = {
  passport: z.string().regex(/^[A-Z0-9]{6,12}$/, "Passport number must be 6-12 alphanumeric characters"),
  national_id: z.string().regex(/^[A-Z0-9]{8,15}$/, "National ID must be 8-15 alphanumeric characters"),
  drivers_license: z.string().regex(/^[A-Z0-9]{6,12}$/, "Driver's license must be 6-12 alphanumeric characters"),
}

const registrationSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),

  email: z.string().email("Invalid email address").toLowerCase().trim(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(16, "Phone number must not exceed 16 digits")
    .regex(phoneRegex, "Please enter a valid phone number"),

  nationality: z.string().min(1, "Please select your nationality"),

  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select your gender",
  }),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()

      if (isNaN(birthDate.getTime())) return false
      if (birthDate > today) return false

      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const dayDiff = today.getDate() - birthDate.getDate()

      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

      return adjustedAge >= 18 && adjustedAge <= 100
    }, "You must be between 18 and 100 years old"),

  designation: z.string().min(2, "Designation is required").max(100, "Designation must not exceed 100 characters"),

  organization: z
    .string()
    .min(2, "Organization name is required")
    .max(100, "Organization name must not exceed 100 characters"),

  documentType: z.enum(["passport", "national_id", "drivers_license"], {
    required_error: "Please select a document type",
  }),

  documentNumber: z
    .string()
    .min(6, "Document number must be at least 6 characters")
    .max(15, "Document number must not exceed 15 characters")
    .regex(/^[A-Z0-9]+$/i, "Document number can only contain letters and numbers"),

  passportPhoto: z.any().optional(),

  signature: z.string().min(1, "Digital signature is required"),

  declarationAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration to proceed",
  }),
})

type RegistrationForm = z.infer<typeof registrationSchema>

// Helper components
const FormField = ({
  label,
  error,
  required,
  children,
  tooltip,
  className = "",
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  tooltip?: string
  className?: string
}) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex items-center gap-2">
      <Label className={error ? "text-red-600" : ""}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
)

const FileUploadArea = ({
  onFileSelect,
  preview,
  error,
  clearFile,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  currentFile,
}: {
  onFileSelect: (file: File) => void
  preview?: string
  error?: string
  clearFile: () => void
  accept?: string
  maxSize?: number
  currentFile?: File
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndProcessFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndProcessFile(file)
    }
  }

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return
    }

    if (file.size > maxSize) {
      return
    }

    onFileSelect(file)
  }

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${isDragOver ? "border-blue-500 bg-blue-50" : ""}
          ${error ? "border-red-500" : "border-gray-300 hover:border-gray-400"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview || currentFile ? (
          <div className="flex flex-col items-center gap-3">
            {preview ? (
              <img src={preview || "/placeholder.svg"} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
            ) : (
              <img
                src={URL.createObjectURL(currentFile as File) || "/placeholder.svg"}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-lg"
              />
            )}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Photo uploaded</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-gray-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">Max 5MB, JPG/PNG only</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

const SignaturePad = ({
  onSignatureSave,
  error,
  signatureRef,
}: {
  onSignatureSave: (dataUrl: string) => void
  error?: string
  signatureRef: React.RefObject<SignatureCanvas>
}) => {
  const [isDrawing, setIsDrawing] = useState(false)

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL()
      onSignatureSave(dataUrl)
    }
  }

  const handleClear = () => {
    signatureRef.current?.clear()
  }

  return (
    <div className="space-y-2">
      <Label>Digital Signature *</Label>
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Please sign in the box below</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        <div className="border border-gray-300 rounded bg-white overflow-hidden">
          <SignatureCanvas
            ref={signatureRef as React.RefObject<SignatureCanvas>}
            canvasProps={{
              width: 500,
              height: 200,
              className: "signature-canvas w-full touch-none",
            }}
            backgroundColor="white"
            onBegin={() => setIsDrawing(true)}
            onEnd={() => setIsDrawing(false)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const signatureRef = useRef<SignatureCanvas>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const autoSaveInterval = useRef<NodeJS.Timeout>()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    trigger,
    control,
    setError,
    clearErrors,
    getValues,
    reset,
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
    defaultValues: {
      declarationAccepted: false,
    },
  })

  const watchDocumentType = watch("documentType")
  const watchPassportPhoto = watch("passportPhoto")
  const watchSignature = watch("signature")

  // Auto-save functionality
  useEffect(() => {
    const saveFormData = () => {
      if (isDirty && isValid) {
        setIsAutoSaving(true)
        const formData = getValues()
        localStorage.setItem(
          "registration_form_draft",
          JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString(),
            step: step,
          }),
        )
        setTimeout(() => setIsAutoSaving(false), 1000)
      }
    }

    autoSaveInterval.current = setInterval(saveFormData, 30000) // Auto-save every 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current)
      }
    }
  }, [isDirty, isValid, getValues, step])

  // Load saved draft
  useEffect(() => {
    const savedDraft = localStorage.getItem("registration_form_draft")
    if (savedDraft) {
      try {
        const { data, timestamp, step: savedStep } = JSON.parse(savedDraft)
        const savedDate = new Date(timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          // Load if less than 24 hours old
          // Restore form data (excluding files)
          const { passportPhoto, signature, ...restData } = data
          Object.keys(restData).forEach((key) => {
            setValue(key as keyof RegistrationForm, restData[key as keyof RegistrationForm])
          })
          setStep(savedStep)
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }
  }, [setValue])

  const nationalityLabels: Record<string, string> = {
    us: "United States",
    uk: "United Kingdom",
    ca: "Canada",
    au: "Australia",
    de: "Germany",
    fr: "France",
    jp: "Japan",
    other: "Other",
  }

  const genderLabels: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
  }

  const documentTypeLabels: Record<string, string> = {
    passport: "Passport",
    national_id: "National ID",
    drivers_license: "Driver's License",
  }

  const handlePassportPhotoSelect = (file: File) => {
    setValue("passportPhoto", file, { shouldValidate: true })
    clearErrors("passportPhoto")
    console.log("[v0] Passport photo selected:", file.name)
  }

  const clearPhoto = () => {
    setValue("passportPhoto", undefined as any)
    setPhotoPreview("")
  }

  const handleSignatureSave = (signatureData: string) => {
    setValue("signature", signatureData, { shouldValidate: true })
    clearErrors("signature")
    console.log("[v0] Signature saved")
  }

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    console.log("[v0] Validating step:", stepNumber)

    let fieldsToValidate: (keyof RegistrationForm)[] = []

    switch (stepNumber) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email", "phone", "nationality", "gender", "dateOfBirth"]

        const passportPhoto = getValues("passportPhoto")
        if (!passportPhoto) {
          setError("passportPhoto", { message: "Passport photo is required" })
          return false
        }
        break

      case 2:
        fieldsToValidate = ["designation", "organization", "documentType", "documentNumber", "declarationAccepted"]

        const signature = getValues("signature")
        if (!signature) {
          setError("signature", { message: "Digital signature is required" })
          return false
        }
        break
    }

    const results = await trigger(fieldsToValidate)
    console.log("[v0] Step validation results:", results)

    if (!results) {
      console.log("[v0] Validation errors:", errors)
    }

    return results
  }

  const nextStep = async () => {
    const isValid = await validateStep(step)
    if (isValid) {
      setStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFormSubmit = async (data: RegistrationForm) => {
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: Math.random().toString(36) + Math.random().toString(36),
      })

      if (authError) throw authError

      if (authData.user) {
        // Upload passport photo
        const passportPhoto = data.passportPhoto
        const photoFileName = `${authData.user.id}_passport.${passportPhoto.name.split(".").pop()}`

        const { data: photoData, error: photoError } = await supabase.storage
          .from("documents")
          .upload(photoFileName, passportPhoto)

        if (photoError) throw photoError

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          passport_photo_url: photoData.path,
          nationality: data.nationality,
          gender: data.gender,
          date_of_birth: data.dateOfBirth,
          phone_number: data.phone,
          email: data.email,
          designation: data.designation,
          organization_name: data.organization,
          document_type: data.documentType,
          document_number: data.documentNumber,
          signature_data: data.signature,
          declaration_accepted: data.declarationAccepted,
        })

        if (profileError) throw profileError

        // Clear saved draft
        localStorage.removeItem("registration_form_draft")

        setSuccessMessage("Registration successful! Redirecting to payment...")
        setTimeout(() => router.push("/payment"), 2000)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = (step / 3) * 100

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">Professional Registration</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Join our certification program with a streamlined registration process.
              </p>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Step {step} of 3</span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">Registration Form</CardTitle>
                    <CardDescription className="mt-2">
                      {step === 1 && "Personal Information"}
                      {step === 2 && "Professional Details & Verification"}
                      {step === 3 && "Review & Submit"}
                    </CardDescription>
                  </div>

                  {isAutoSaving && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Auto-saving...
                    </div>
                  )}
                </div>

                {/* Messages */}
                {errorMessage && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                  </Alert>
                )}
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                  {step === 1 && (
                    <div className="space-y-6">
                      {/* Personal Information Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2">Personal Details</h3>
                        <p className="text-sm text-gray-600">Please provide your basic personal information</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="First Name"
                          error={errors.firstName?.message}
                          required
                          tooltip="Enter your legal first name as it appears on your documents"
                        >
                          <Input
                            {...register("firstName")}
                            placeholder="John"
                            className={errors.firstName ? "border-red-500" : ""}
                            aria-invalid={!!errors.firstName}
                          />
                        </FormField>

                        <FormField
                          label="Last Name"
                          error={errors.lastName?.message}
                          required
                          tooltip="Enter your legal last name as it appears on your documents"
                        >
                          <Input
                            {...register("lastName")}
                            placeholder="Doe"
                            className={errors.lastName ? "border-red-500" : ""}
                            aria-invalid={!!errors.lastName}
                          />
                        </FormField>
                      </div>

                      <FormField
                        label="Email Address"
                        error={errors.email?.message}
                        required
                        tooltip="We'll use this email for all communications"
                      >
                        <Input
                          type="email"
                          {...register("email")}
                          placeholder="john.doe@example.com"
                          className={errors.email ? "border-red-500" : ""}
                          aria-invalid={!!errors.email}
                        />
                      </FormField>

                      <FormField
                        label="Phone Number"
                        error={errors.phone?.message}
                        required
                        tooltip="Include country code (e.g., +1 for US)"
                      >
                        <Input
                          {...register("phone")}
                          placeholder="+1 (555) 123-4567"
                          className={errors.phone ? "border-red-500" : ""}
                          aria-invalid={!!errors.phone}
                        />
                      </FormField>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Nationality" error={errors.nationality?.message} required>
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
                        </FormField>

                        <FormField label="Gender" error={errors.gender?.message} required>
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
                        </FormField>
                      </div>

                      <FormField
                        label="Date of Birth"
                        error={errors.dateOfBirth?.message}
                        required
                        tooltip="You must be between 18 and 100 years old"
                      >
                        <Input
                          type="date"
                          {...register("dateOfBirth")}
                          className={errors.dateOfBirth ? "border-red-500" : ""}
                          max={new Date().toISOString().split("T")[0]}
                          aria-invalid={!!errors.dateOfBirth}
                        />
                      </FormField>

                      <FormField
                        label="Passport Photo"
                        error={errors.passportPhoto?.message}
                        required
                        tooltip="Upload a clear photo of yourself (JPEG, PNG, max 5MB)"
                      >
                        <FileUploadArea
                          onFileSelect={handlePassportPhotoSelect}
                          accept="image/*"
                          maxSize={5 * 1024 * 1024}
                          currentFile={watchPassportPhoto}
                        />
                      </FormField>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      {/* Professional Information Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2">Professional Details</h3>
                        <p className="text-sm text-gray-600">Information about your current role and organization</p>
                      </div>

                      <FormField
                        label="Designation/Role"
                        error={errors.designation?.message}
                        required
                        tooltip="Your current job title or position"
                      >
                        <Input
                          {...register("designation")}
                          placeholder="Security Manager"
                          className={errors.designation ? "border-red-500" : ""}
                          aria-invalid={!!errors.designation}
                        />
                      </FormField>

                      <FormField
                        label="Organization"
                        error={errors.organization?.message}
                        required
                        tooltip="Name of your current employer or organization"
                      >
                        <Input
                          {...register("organization")}
                          placeholder="ABC Corporation"
                          className={errors.organization ? "border-red-500" : ""}
                          aria-invalid={!!errors.organization}
                        />
                      </FormField>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="Document Type"
                          error={errors.documentType?.message}
                          required
                          tooltip="Type of identification document"
                        >
                          <Controller
                            name="documentType"
                            control={control}
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
                        </FormField>

                        <FormField
                          label="Document Number"
                          error={errors.documentNumber?.message}
                          required
                          tooltip={`Enter your ${watchDocumentType ? documentTypeLabels[watchDocumentType] : "document"} number`}
                        >
                          <Input
                            {...register("documentNumber")}
                            placeholder={watchDocumentType === "passport" ? "e.g., A12345678" : "Enter document number"}
                            className={errors.documentNumber ? "border-red-500" : ""}
                            aria-invalid={!!errors.documentNumber}
                          />
                        </FormField>
                      </div>

                      <SignaturePad
                        onSignatureSave={handleSignatureSave}
                        error={errors.signature?.message}
                        signatureRef={signatureRef}
                      />

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Controller
                            name="declarationAccepted"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="declaration"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            )}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor="declaration"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Declaration *
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              I hereby declare that all information provided is true and accurate to the best of my
                              knowledge. I understand that any false information may result in disqualification from the
                              certification process and may have legal consequences.
                            </p>
                            {errors.declarationAccepted && (
                              <p className="text-sm text-red-600">{errors.declarationAccepted.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please review your information carefully before submitting. All details will be verified
                            during the certification process.
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 border-b pb-2">Personal Information</h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Name:</strong> {watch("firstName")} {watch("lastName")}
                            </p>
                            <p>
                              <strong>Email:</strong> {watch("email")}
                            </p>
                            <p>
                              <strong>Phone:</strong> {watch("phone")}
                            </p>
                            <p>
                              <strong>Nationality:</strong>{" "}
                              {nationalityLabels[watch("nationality")] || watch("nationality")}
                            </p>
                            <p>
                              <strong>Gender:</strong> {genderLabels[watch("gender")] || watch("gender")}
                            </p>
                            <p>
                              <strong>Date of Birth:</strong>{" "}
                              {watch("dateOfBirth") ? format(new Date(watch("dateOfBirth")), "MMMM dd, yyyy") : ""}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 border-b pb-2">Professional Information</h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Designation:</strong> {watch("designation")}
                            </p>
                            <p>
                              <strong>Organization:</strong> {watch("organization")}
                            </p>
                            <p>
                              <strong>Document Type:</strong>{" "}
                              {documentTypeLabels[watch("documentType")] || watch("documentType")}
                            </p>
                            <p>
                              <strong>Document Number:</strong> {watch("documentNumber")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 p-4 bg-green-50 rounded-lg">
                        {watchPassportPhoto && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Photo uploaded</span>
                          </div>
                        )}
                        {watchSignature && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Signature provided</span>
                          </div>
                        )}
                        {watch("declarationAccepted") && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Declaration accepted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                      {step > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      )}
                    </div>

                    <div>
                      {step < 3 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="flex items-center gap-2"
                          disabled={isLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Submit Registration
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
