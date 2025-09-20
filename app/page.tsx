import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Award, Users, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <Shield className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">
                Global Security Practitioners Alliance
              </h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Elevate your security expertise with professional certification, comprehensive training, and a global
                community of security practitioners.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              <Card className="text-center">
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Professional Certification</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Earn globally recognized security certifications that validate your expertise.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Comprehensive Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Rigorous security aptitude tests designed by industry experts.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Global Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Connect with security professionals from around the world.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
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
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Register</h3>
                <p className="text-sm text-muted-foreground">Create your profile with required documentation</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Payment</h3>
                <p className="text-sm text-muted-foreground">Secure payment processing for certification fee</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Take Test</h3>
                <p className="text-sm text-muted-foreground">Complete the security aptitude assessment</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-semibold mb-2">Get Certified</h3>
                <p className="text-sm text-muted-foreground">Receive your official certificate upon passing</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Ready to Advance Your Security Career?</h2>
            <p className="text-lg opacity-90 text-pretty max-w-2xl mx-auto mb-8">
              Join the global community of certified security professionals and take your career to the next level.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Start Your Certification Journey</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
