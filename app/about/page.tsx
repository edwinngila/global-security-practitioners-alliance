import Navigation from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Target, Globe, Users, BookOpen } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold text-balance mb-6">About GSPA</h1>
                <p className="text-xl text-muted-foreground text-pretty mb-8 leading-relaxed">
                  The Global Security Practitioners Alliance is dedicated to advancing security excellence through
                  professional certification, training, and community building.
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md h-80 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-2xl flex items-center justify-center border border-border/50">
                  <div className="text-center p-8">
                    <Shield className="h-20 w-20 text-primary/60 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">About GSPA Image</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">Replace with actual about image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card>
                <CardHeader>
                  <Target className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    To establish and maintain the highest standards of professional competency in the security industry
                    through comprehensive certification programs, continuous education, and fostering a global community
                    of security practitioners committed to excellence.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    To be the world's leading authority in security professional certification, recognized globally for
                    our rigorous standards, innovative assessment methods, and commitment to advancing the security
                    profession.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Our Core Values</h2>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                The principles that guide everything we do at GSPA.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We maintain the highest standards in all our certification programs and educational offerings.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Integrity</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We operate with transparency, honesty, and ethical practices in all our interactions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>Innovation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We continuously evolve our methods and technologies to stay ahead of industry trends.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-balance mb-4">Our Story</h2>
                <p className="text-lg text-muted-foreground text-pretty">
                  Founded by security professionals, for security professionals.
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  The Global Security Practitioners Alliance was established in response to the growing need for
                  standardized, globally recognized security certifications. As the security landscape evolved rapidly
                  with new threats and technologies, industry leaders recognized the importance of having a unified
                  approach to professional development and certification.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  Our founding members, comprising seasoned security professionals from various sectors including
                  corporate security, cybersecurity, physical security, and risk management, came together with a shared
                  vision: to create a certification body that would set the gold standard for security professional
                  competency.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Today, GSPA serves thousands of security professionals worldwide, offering rigorous certification
                  programs that are recognized by leading organizations across industries. Our commitment to excellence
                  and continuous improvement ensures that our certifications remain relevant and valuable in an
                  ever-changing security landscape.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
