import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Award, Users, BookOpen, ArrowRight, CreditCard } from "lucide-react"
import Link from "next/link"
import { AdminSetupNotice } from "@/components/admin-setup-notice"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <AdminSetupNotice />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-6">
                  <Shield className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">
                  Global Security Practitioners Alliance
                </h1>
                <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                  Elevate your security expertise with professional certification, comprehensive training, and a global
                  community of security practitioners.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" asChild>
                    <Link href="/register">
                      Register Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md h-96 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-2xl flex items-center justify-center border border-border/50">
                  <div className="text-center p-8">
                    <Shield className="h-24 w-24 text-primary/60 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Security Certification Hero Image</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">Replace with actual hero image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Why Choose GSPA?</h2>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                Join thousands of security professionals who have advanced their careers through our comprehensive
                certification program.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Professional Certification</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Earn globally recognized security certifications that validate your expertise.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Comprehensive Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Rigorous security aptitude tests designed by industry experts.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Global Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Connect with security professionals from around the world.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle>Industry Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Certificates recognized by leading organizations worldwide.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Certification Process</h2>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                Simple steps to earn your professional security certification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  1
                </div>
                <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Register</h3>
                <p className="text-sm text-muted-foreground">Create your profile with required documentation</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  2
                </div>
                <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Payment</h3>
                <p className="text-sm text-muted-foreground">Secure payment processing for certification fee</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  3
                </div>
                <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Take Test</h3>
                <p className="text-sm text-muted-foreground">Complete the security aptitude assessment</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  4
                </div>
                <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center mx-auto mb-4 border border-border/50">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Get Certified</h3>
                <p className="text-sm text-muted-foreground">Receive your official certificate upon passing</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Ready to Advance Your Security Career?</h2>
                <p className="text-lg opacity-90 text-pretty mb-8">
                  Join the global community of certified security professionals and take your career to the next level.
                </p>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">Start Your Certification Journey</Link>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm h-64 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                  <div className="text-center p-6">
                    <Award className="h-16 w-16 text-white/80 mx-auto mb-4" />
                    <p className="text-white/90 font-medium">Certification CTA Image</p>
                    <p className="text-sm text-white/70 mt-2">Replace with actual CTA image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
