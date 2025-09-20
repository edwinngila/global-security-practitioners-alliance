import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Award, Network, BookOpen, Shield, Users, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function WhyJoinPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">Why Join GSPA?</h1>
              <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                Discover the benefits of becoming a certified security professional and joining our global community of
                experts.
              </p>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Advance Your Career</h2>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                GSPA certification opens doors to new opportunities and validates your expertise in the security field.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Career Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Certified professionals earn 25% more on average and have access to senior-level positions in
                    leading organizations.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Industry Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    GSPA certifications are recognized by Fortune 500 companies and government agencies worldwide.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Network className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Professional Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Connect with over 50,000 certified security professionals across 120 countries.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BookOpen className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Continuous Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Access to exclusive resources, webinars, and continuing education opportunities.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Credibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Demonstrate your commitment to professional excellence and ethical security practices.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Community Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Join local chapters, attend events, and participate in professional development activities.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Certification Benefits */}
        <section className="py-20 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-6">What You Get</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Official Certificate</h3>
                      <p className="text-muted-foreground text-sm">
                        Digital and physical certificates with unique verification codes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Digital Badge</h3>
                      <p className="text-muted-foreground text-sm">
                        Shareable digital credentials for LinkedIn and professional profiles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Member Directory</h3>
                      <p className="text-muted-foreground text-sm">
                        Listing in our global directory of certified professionals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Continuing Education</h3>
                      <p className="text-muted-foreground text-sm">
                        Access to exclusive training materials and industry updates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Career Support</h3>
                      <p className="text-muted-foreground text-sm">Job board access and career advancement resources</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 rounded-lg border">
                <h3 className="text-2xl font-bold mb-4">Certification Stats</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Pass Rate</span>
                      <span className="text-sm font-bold">78%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Career Advancement</span>
                      <span className="text-sm font-bold">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Salary Increase</span>
                      <span className="text-sm font-bold">25%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Ready to Join GSPA?</h2>
            <p className="text-lg opacity-90 text-pretty max-w-2xl mx-auto mb-8">
              Take the first step towards advancing your security career with globally recognized certification.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Start Your Registration <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
