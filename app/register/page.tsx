"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to step 1 by default
    router.replace("/register/step-1")
  }, [router])

  return null
}
