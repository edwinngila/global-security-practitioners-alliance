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
        <section className="relative py-24 lg:py-36 bg-gradient-to-br from-background to-muted/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-accent/3"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left space-y-8">
                <div className="flex justify-center lg:justify-start">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-lg"></div>
                    <div className="relative bg-background border border-border/50 rounded-2xl p-4 shadow-xl">
                      <Shield className="h-20 w-20 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold text-balance leading-tight">
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Global Security
                    </span>
                    <br />
                    Practitioners Alliance
                  </h1>
                  <p className="text-xl lg:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-2xl">
                    Elevate your security expertise with professional certification, comprehensive training, and a global
                    community of security practitioners.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                    <Link href="/register">
                      Register Now <ArrowRight className="ml-2 h-6 w-6" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300" asChild>
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative w-full max-w-lg h-[28rem] bg-gradient-to-br from-muted via-muted/50 to-muted-foreground/20 rounded-3xl flex items-center justify-center border border-border/50 shadow-2xl backdrop-blur-sm">
                    <div className="text-center p-12 space-y-6">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-lg"></div>
                        <Shield className="relative h-32 w-32 text-primary mx-auto" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground font-semibold text-lg">Security Certification</p>
                        <p className="text-sm text-muted-foreground/70">Professional accreditation awaits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accreditation Prompt */}
        <section className="py-16 bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-y border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-semibold shadow-lg">
                <Shield className="h-5 w-5" />
                Global Accreditation
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-5xl font-bold text-balance">
                  Get Accredited Globally – Take the Security Aptitude Exam
                </h2>
                <p className="text-xl text-muted-foreground text-pretty max-w-4xl mx-auto leading-relaxed">
                  Join thousands of professionals worldwide who have earned their GSPA certification. Demonstrate your security expertise and stand out in the industry.
                </p>
              </div>
              <div className="pt-4">
                <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg px-10 py-6 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300">
                  <Link href="/register">
                    Start Accreditation Process <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-muted/10 to-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="h-4 w-4" />
                Why Choose GSPA?
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-balance mb-6">Why Choose GSPA?</h2>
              <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
                Join thousands of security professionals who have advanced their careers through our comprehensive
                certification program.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg">
                      <Award className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">Professional Certification</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    Earn globally recognized security certifications that validate your expertise.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg">
                      <BookOpen className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">Comprehensive Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">Rigorous security aptitude tests designed by industry experts.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">Global Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">Connect with security professionals from around the world.</CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">Industry Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">Certificates recognized by leading organizations worldwide.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4" />
                Certification Process
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-balance mb-6">Certification Process</h2>
              <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
                Simple steps to earn your professional security certification.
              </p>
            </div>

            {/* Desktop Process with connecting lines */}
            <div className="hidden lg:block relative">
              <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
              <div className="grid grid-cols-4 gap-8 relative">
                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      1
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl p-8 border border-border/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Register</h3>
                    <p className="text-muted-foreground leading-relaxed">Create your profile with required documentation</p>
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      2
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl p-8 border border-border/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Payment</h3>
                    <p className="text-muted-foreground leading-relaxed">Secure payment processing for certification fee</p>
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      3
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl p-8 border border-border/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Take Test</h3>
                    <p className="text-muted-foreground leading-relaxed">Complete the security aptitude assessment</p>
                  </div>
                </div>

                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      4
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl p-8 border border-border/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Get Certified</h3>
                    <p className="text-muted-foreground leading-relaxed">Receive your official certificate upon passing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Process */}
            <div className="lg:hidden space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Register</h3>
                  </div>
                  <p className="text-muted-foreground">Create your profile with required documentation</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Payment</h3>
                  </div>
                  <p className="text-muted-foreground">Secure payment processing for certification fee</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Take Test</h3>
                  </div>
                  <p className="text-muted-foreground">Complete the security aptitude assessment</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    4
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Get Certified</h3>
                  </div>
                  <p className="text-muted-foreground">Receive your official certificate upon passing</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
                  <Award className="h-4 w-4" />
                  Start Your Journey
                </div>
                <div className="space-y-6">
                  <h2 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                    Ready to Advance Your Security Career?
                  </h2>
                  <p className="text-xl opacity-90 text-pretty leading-relaxed max-w-lg">
                    Join the global community of certified security professionals and take your career to the next level.
                  </p>
                </div>
                <div className="pt-4">
                  <Button size="lg" variant="secondary" asChild className="text-lg px-10 py-6 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 bg-white text-primary hover:bg-white/90">
                    <Link href="/register">Start Your Certification Journey</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  <div className="absolute -inset-6 bg-white/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative w-full max-w-lg h-80 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                    <div className="text-center p-8 space-y-6">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl"></div>
                        <Award className="relative h-24 w-24 text-white mx-auto" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-bold text-xl">Your Certification Awaits</p>
                        <p className="text-white/80 text-lg">Join the elite ranks of certified security professionals</p>
                      </div>
                    </div>
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
