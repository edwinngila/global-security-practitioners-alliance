"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { Camera, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"

const registrationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  nationality: z.string().min(2, "Please select your nationality"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select your gender",
  }),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18
  }, "You must be at least 18 years old"),
  designation: z.string().min(2, "Designation is required"),
  organization: z.string().min(2, "Organization name is required"),
  documentType: z.enum(["passport", "national_id", "drivers_license"], {
    required_error: "Please select document type",
  }),
  documentNumber: z.string().min(5, "Document number is required"),
  declarationAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration",
  }),
})

type RegistrationForm = z.infer<typeof registrationSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null)
  const [signatureData, setSignatureData] = useState<string>("")
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  })

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }
      setPassportPhoto(file)
    }
  }

  const clearSignature = () => {
    signatureRef?.clear()
    setSignatureData("")
  }

  const saveSignature = () => {
    if (signatureRef && !signatureRef.isEmpty()) {
      setSignatureData(signatureRef.toDataURL())
    }
  }

  const nextStep = async () => {
    const fieldsToValidate =
      step === 1
        ? ["firstName", "lastName", "email", "phone", "nationality", "gender", "dateOfBirth"]
        : ["designation", "organization", "documentType", "documentNumber"]

    console.log("[v0] Current form values:", getValues())
    console.log("[v0] Validating fields:", fieldsToValidate)

    const isValid = await trigger(fieldsToValidate as any)
    console.log("[v0] Validation result:", isValid)
    console.log("[v0] Current errors:", errors)

    if (isValid) {
      setStep(step + 1)
    }
  }

  const onSubmit = async (data: RegistrationForm) => {
    if (!passportPhoto) {
      alert("Please upload a passport-size photo")
      return
    }

    if (!signatureData) {
      alert("Please provide your signature")
      return
    }

    setIsLoading(true)

    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: Math.random().toString(36) + Math.random().toString(36), // Generate random password
      })

      if (authError) throw authError

      if (authData.user) {
        // Upload passport photo
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
          signature_data: signatureData,
          declaration_accepted: data.declarationAccepted,
        })

        if (profileError) throw profileError

        // Redirect to payment
        router.push("/payment")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">Registration</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Complete your profile to begin your journey towards GSPA certification.
              </p>
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Professional Profile Registration</CardTitle>
                <CardDescription>
                  Step {step} of 3:{" "}
                  {step === 1 ? "Personal Information" : step === 2 ? "Professional Details" : "Review & Submit"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" {...register("firstName")} placeholder="John" />
                          {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                          {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" {...register("email")} placeholder="john.doe@example.com" />
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" {...register("phone")} placeholder="+1 (555) 123-4567" />
                        {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="nationality">Nationality *</Label>
                          <Select
                            onValueChange={(value: string) => {
                              setValue("nationality", value)
                              trigger("nationality")
                            }}
                          >
                            <SelectTrigger>
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
                          {errors.nationality && (
                            <p className="text-sm text-red-600 mt-1">{errors.nationality.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <Select
                            onValueChange={(value: "male" | "female" | "other") => {
                              setValue("gender", value)
                              trigger("gender")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                        {errors.dateOfBirth && (
                          <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>
                        )}
                      </div>

                      <div>
                        <Label>Passport-Size Photo *</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                              {passportPhoto ? (
                                <div className="flex items-center justify-center gap-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="text-sm text-green-600">{passportPhoto.name}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Camera className="h-8 w-8 text-gray-400" />
                                  <span className="text-sm text-gray-600">Click to upload passport photo</span>
                                  <span className="text-xs text-gray-500">Max 5MB, JPG/PNG</span>
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="designation">Designation/Role *</Label>
                        <Input id="designation" {...register("designation")} placeholder="Security Manager" />
                        {errors.designation && (
                          <p className="text-sm text-red-600 mt-1">{errors.designation.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="organization">Organization *</Label>
                        <Input id="organization" {...register("organization")} placeholder="ABC Corporation" />
                        {errors.organization && (
                          <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="documentType">Document Type *</Label>
                          <Select
                            onValueChange={(value: "passport" | "national_id" | "drivers_license") => {
                              setValue("documentType", value)
                              trigger("documentType")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="national_id">National ID</SelectItem>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.documentType && (
                            <p className="text-sm text-red-600 mt-1">{errors.documentType.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="documentNumber">Document Number *</Label>
                          <Input
                            id="documentNumber"
                            {...register("documentNumber")}
                            placeholder="Enter document number"
                          />
                          {errors.documentNumber && (
                            <p className="text-sm text-red-600 mt-1">{errors.documentNumber.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Digital Signature *</Label>
                        <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Please sign below</span>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                                Clear
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={saveSignature}>
                                Save
                              </Button>
                            </div>
                          </div>
                          <div className="border border-gray-300 rounded bg-white">
                            <SignatureCanvas
                              ref={(ref) => setSignatureRef(ref)}
                              canvasProps={{
                                width: 500,
                                height: 200,
                                className: "signature-canvas w-full",
                              }}
                              backgroundColor="white"
                            />
                          </div>
                          {signatureData && (
                            <div className="mt-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Signature saved</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="declaration"
                          onCheckedChange={(checked) => {
                            setValue("declarationAccepted", checked === true)
                            trigger("declarationAccepted")
                          }}
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
                            certification process.
                          </p>
                          {errors.declarationAccepted && (
                            <p className="text-sm text-red-600">{errors.declarationAccepted.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please review your information carefully. Once submitted, you will be redirected to payment.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h4 className="font-semibold mb-2">Personal Information</h4>
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
                            <strong>Nationality:</strong> {watch("nationality")}
                          </p>
                          <p>
                            <strong>Gender:</strong> {watch("gender")}
                          </p>
                          <p>
                            <strong>Date of Birth:</strong> {watch("dateOfBirth")}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Professional Information</h4>
                          <p>
                            <strong>Designation:</strong> {watch("designation")}
                          </p>
                          <p>
                            <strong>Organization:</strong> {watch("organization")}
                          </p>
                          <p>
                            <strong>Document Type:</strong> {watch("documentType")}
                          </p>
                          <p>
                            <strong>Document Number:</strong> {watch("documentNumber")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {passportPhoto && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Photo:</p>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {signatureData && (
                          <div>
                            <p className="text-sm font-semibold mb-1">Signature:</p>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Previous
                      </Button>
                    )}
                    {step < 3 ? (
                      <Button type="button" onClick={nextStep} className="ml-auto">
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isLoading} className="ml-auto">
                        {isLoading ? "Submitting..." : "Submit Registration"}
                      </Button>
                    )}
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
