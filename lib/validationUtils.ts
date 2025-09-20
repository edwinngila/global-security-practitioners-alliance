
// Enhanced validation utilities for the registration form

import * as z from "zod"

// Phone number validation for different countries
export const phoneValidation = {
  // International format with country code
  international: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone number")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  
  // US format
  us: z.string()
    .regex(/^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/, "Invalid US phone number")
    .min(10, "Phone number must be 10 digits")
    .max(11, "Phone number must not exceed 11 digits with country code"),
  
  // UK format
  uk: z.string()
    .regex(/^(\+44)?0?[1-9]\d{9,10}$/, "Invalid UK phone number")
    .min(10, "Phone number must be at least 10 digits")
    .max(13, "Phone number must not exceed 13 digits with country code"),
}

// Document validation patterns for different countries
export const documentValidation = {
  // Passport numbers (international standard)
  passport: z.string()
    .regex(/^[A-Z0-9]{6,12}$/, "Passport number must be 6-12 alphanumeric characters")
    .transform(val => val.toUpperCase()),
  
  // National ID patterns by country
  nationalId: {
    us: z.string()
      .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
    
    uk: z.string()
      .regex(/^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}\d{6}[A-DFM]{0,1}$/, "Invalid National Insurance number"),
    
    ca: z.string()
      .regex(/^\d{3}-\d{3}-\d{3}$/, "SIN must be in format XXX-XXX-XXX"),
    
    // Generic national ID
    generic: z.string()
      .regex(/^[A-Z0-9]{8,15}$/, "National ID must be 8-15 alphanumeric characters")
      .transform(val => val.toUpperCase()),
  },
  
  // Driver's license patterns
  driversLicense: {
    us: z.string()
      .regex(/^[A-Z]{1,2}\d{6,12}$/, "Invalid US driver's license format"),
    
    uk: z.string()
      .regex(/^[A-Z]{2}\d{6}[A-Z]{1}$/, "Invalid UK driving license number"),
    
    generic: z.string()
      .regex(/^[A-Z0-9]{6,12}$/, "Driver's license must be 6-12 alphanumeric characters")
      .transform(val => val.toUpperCase()),
  }
}

// Email validation with stricter rules
export const emailValidation = z.string()
  .email("Invalid email address")
  .toLowerCase()
  .trim()
  .refine(
    (email: string) => {
      // Check for common typos
      const commonTypos = [
        { wrong: 'gmial.com', correct: 'gmail.com' },
        { wrong: 'yahooo.com', correct: 'yahoo.com' },
        { wrong: 'hotmial.com', correct: 'hotmail.com' },
        { wrong: 'outlok.com', correct: 'outlook.com' },
      ]

      const domain = email.split('@')[1]
      const typo = commonTypos.find(t => domain === t.wrong)

      return !typo
    },
    (email: string) => {
      const domain = email.split('@')[1]
      const commonTypos = [
        { wrong: 'gmial.com', correct: 'gmail.com' },
        { wrong: 'yahooo.com', correct: 'yahoo.com' },
        { wrong: 'hotmial.com', correct: 'hotmail.com' },
        { wrong: 'outlok.com', correct: 'outlook.com' },
      ]

      const typo = commonTypos.find(t => domain === t.wrong)
      return {
        message: typo ? `Did you mean ${typo.correct}?` : "Invalid email format"
      }
    }
  )

// Name validation with cultural sensitivity
export const nameValidation = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .regex(
    /^[a-zA-Z\u00c0-\u00ff\u0100-\u017e\u0410-\u044f\u0401\u0451\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .refine(
    (name) => !name.includes('  '),
    "Name cannot contain consecutive spaces"
  )
  .refine(
    (name) => name.trim() === name,
    "Name cannot start or end with spaces"
  )
  .transform(val => val.replace(/\s+/g, ' ').trim())

// Age validation with leap year handling
export const ageValidation = (minAge: number, maxAge: number) => 
  z.string()
    .refine(
      (dateString) => {
        const birthDate = new Date(dateString)
        const today = new Date()
        
        if (isNaN(birthDate.getTime())) return false
        if (birthDate > today) return false
        
        // Calculate age accounting for leap years
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        const dayDiff = today.getDate() - birthDate.getDate()
        
        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age--
        }
        
        return age >= minAge && age <= maxAge
      },
      `Age must be between ${minAge} and ${maxAge} years old`
    )

// File validation utilities
export const fileValidation = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSizeMessage: "File size must be less than 5MB",
    typeMessage: "Only JPG, PNG, and WebP images are allowed"
  },
  
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSizeMessage: "File size must be less than 10MB",
    typeMessage: "Only PDF, DOC, DOCX, and image files are allowed"
  }
}

// Password validation
export const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "Password must contain at least one special character"
  )

// URL validation
export const urlValidation = z.string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url)
        return ['http:', 'https:'].includes(urlObj.protocol)
      } catch {
        return false
      }
    },
    "URL must use HTTP or HTTPS protocol"
  )

// Custom validation messages
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  invalidFormat: (field: string) => `Invalid ${field} format`,
  alreadyExists: (field: string) => `This ${field} is already registered`,
  passwordsDontMatch: "Passwords do not match",
  mustAccept: (field: string) => `You must accept the ${field}`,
  uploadRequired: (field: string) => `Please upload your ${field}`,
  selectRequired: (field: string) => `Please select your ${field}`,
}

// Utility function to create custom error messages
export const createErrorMessage = (field: string, error: z.ZodIssue) => {
  switch (error.code) {
    case z.ZodIssueCode.too_small:
      if (error.minimum === 1) {
        return validationMessages.required(field)
      }
      return validationMessages.minLength(field, error.minimum as number)
    
    case z.ZodIssueCode.too_big:
      return validationMessages.maxLength(field, error.maximum as number)
    
    case z.ZodIssueCode.invalid_string:
      if (error.validation === 'email') {
        return validationMessages.invalidFormat('email address')
      }
      if (error.validation === 'url') {
        return validationMessages.invalidFormat('URL')
      }
      return validationMessages.invalidFormat(field)
    
    case z.ZodIssueCode.invalid_type:
      if (error.expected === 'boolean' && error.received === 'undefined') {
        return validationMessages.mustAccept(field)
      }
      return validationMessages.invalidFormat(field)
    
    default:
      return error.message || validationMessages.invalidFormat(field)
  }
}

// Cross-field validation helper
export const crossFieldValidation = {
  // Validate that end date is after start date
  dateRange: (startDate: Date, endDate: Date) => {
    if (endDate <= startDate) {
      return { valid: false, message: "End date must be after start date" }
    }
    return { valid: true }
  },
  
  // Validate password confirmation
  passwordMatch: (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return { valid: false, message: validationMessages.passwordsDontMatch }
    }
    return { valid: true }
  },
  
  // Validate age based on date of birth
  ageRequirement: (birthDate: Date, minAge: number) => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    const adjustedAge = monthDiff < 0 ? age - 1 : age
    
    if (adjustedAge < minAge) {
      return { valid: false, message: `You must be at least ${minAge} years old` }
    }
    return { valid: true }
  }
}

// Real-time validation debounce
export const debounceValidation = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    return new Promise<ReturnType<T>>((resolve) => {
      timeout = setTimeout(() => resolve(func(...args)), wait)
    })
  }) as T
}

// Validation helper for file uploads
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "File is required" }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type" }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds maximum allowed size" }
  }
  
  return { valid: true }
}

// Sanitization helpers
export const sanitization = {
  // Remove extra spaces and trim
  cleanText: (text: string) => text.replace(/\s+/g, ' ').trim(),
  
  // Remove special characters except allowed ones
  cleanAlphanumeric: (text: string, allowSpaces = true) => {
    const regex = allowSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g
    return text.replace(regex, '')
  },
  
  // Format phone number
  formatPhone: (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
    return phone
  },
  
  // Format document number
  formatDocumentNumber: (number: string) => number.toUpperCase().replace(/\s+/g, '')
}
