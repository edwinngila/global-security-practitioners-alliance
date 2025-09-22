"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Award, Users, BookOpen, X } from "lucide-react"

export function UserAdvertisement() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show advertisement for first-time visitors
    const hasSeenAd = localStorage.getItem("user-ad-seen")
    if (!hasSeenAd) {
      // Delay showing the ad for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000) // Show after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [])

  const dismissAd = () => {
    localStorage.setItem("user-ad-seen", "true")
    setIsVisible(false)
  }

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Welcome to GSPA Certification</DialogTitle>
                <DialogDescription>
                  Global Security Practitioners Alliance - Your Path to Professional Excellence
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissAd}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img
                src="/Global-Security-Practitioners-Alliance.png"
                alt="GSPA Logo"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-primary">
              Advance Your Security Career Today!
            </h2>
            <p className="text-muted-foreground">
              Join thousands of certified security professionals worldwide and stand out in the competitive cybersecurity industry.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Professional Certification</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn a globally recognized security certification
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Industry Recognition</h3>
                    <p className="text-sm text-muted-foreground">
                      Join an elite community of certified professionals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Comprehensive Training</h3>
                    <p className="text-sm text-muted-foreground">
                      30-question aptitude test covering all security domains
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Career Advancement</h3>
                    <p className="text-sm text-muted-foreground">
                      Open doors to better job opportunities and higher salaries
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg text-center space-y-4">
            <h3 className="text-lg font-semibold">Ready to Get Started?</h3>
            <p className="text-muted-foreground">
              Complete your registration and take the security aptitude test to earn your professional certification.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <a href="/register">
                  Start Your Certification Journey
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/about">
                  Learn More About GSPA
                </a>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>This certification is recognized globally and demonstrates your commitment to security excellence.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}