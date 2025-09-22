"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, Menu, X, User, LogOut, ChevronDown, Bell, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user profile data
        const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()
        setUserProfile(profile)
      }
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    setIsMenuOpen(false)
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/why-join", label: "Why Join Us" },
    { href: "/contact", label: "Contact" },
  ]

  const userMenuItems = user
    ? [
        ...(user.email === "admin@gmail.com"
          ? [{ href: "/admin", label: "Admin Dashboard", icon: Settings }]
          : [
              { href: "/dashboard", label: "Dashboard", icon: User },
              { href: "/dashboard/profile", label: "Profile", icon: User },
              { href: "/dashboard/certificate", label: "Certificate", icon: Shield },
            ]),
      ]
    : []

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav
      className={`border-b sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-lg border-border text-foreground" : "bg-primary border-primary-600 text-primary-foreground"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className={`flex items-center gap-3 font-bold text-xl group ${isScrolled ? "text-primary" : "text-primary-foreground"}`}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 to-secondary/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className={`relative p-2 rounded-lg group-hover:bg-primary-foreground/20 transition-colors duration-300 ${isScrolled ? "bg-primary/10" : "bg-primary-foreground/10"}`}>
                <Shield className="h-6 w-6 text-accent group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <span className={`text-balance bg-gradient-to-r from-primary-foreground to-accent bg-clip-text text-transparent font-bold ${isScrolled ? "text-primary" : ""}`}>
              GSPA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-all duration-200 relative group ${
                    pathname === item.href
                      ? "text-accent font-semibold"
                      : `${isScrolled ? "text-foreground/80 hover:text-primary" : "text-primary-foreground/80 hover:text-accent"}`
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-accent transition-all duration-200 ${
                      pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <Button variant="ghost" size="sm" className={`relative ${isScrolled ? "hover:bg-muted" : "hover:bg-primary-foreground/10"}`}>
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-accent text-accent-foreground">
                    3
                  </Badge>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`flex items-center gap-2 px-3 py-2 ${isScrolled ? "hover:bg-muted" : "hover:bg-primary-foreground/10"}`}
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8 border-2 border-accent/30">
                        <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                          {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-primary-foreground">
                          {userProfile?.full_name || "User"}
                        </span>
                        <span className="text-xs text-primary-foreground/60">
                          {user.email === "admin@gmail.com" ? "Administrator" : "Member"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-primary-foreground/60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  asChild
                  className={`${isScrolled ? "hover:bg-muted hover:text-primary" : "hover:bg-primary-foreground/10 hover:text-accent"} transition-colors duration-200`}
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-primary font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <Link href="/register">Register Now</Link>
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`md:hidden transition-colors duration-200 ${isScrolled ? "hover:bg-muted" : "hover:bg-primary-foreground/10"}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-5 h-5">
              <Menu
                className={`h-5 w-5 absolute transition-all duration-200 ${isMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"}`}
              />
              <X
                className={`h-5 w-5 absolute transition-all duration-200 ${isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
              />
            </div>
          </Button>
        </div>

        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "max-h-96 opacity-100 py-4 border-t border-primary-600"
              : "max-h-0 opacity-0 py-0 overflow-hidden"
          }`}
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 py-2 px-3 rounded-lg ${
                  pathname === item.href
                    ? "text-accent font-semibold bg-primary-foreground/10"
                    : `${isScrolled ? "text-foreground/80 hover:text-primary hover:bg-muted/50" : "text-primary-foreground/80 hover:text-accent hover:bg-primary-foreground/5"}`
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-primary-600 pt-4 mt-2">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-10 w-10 border-2 border-accent/30">
                      <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                        {userProfile?.full_name ? getInitials(userProfile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-foreground">
                        {userProfile?.full_name || "User"}
                      </span>
                      <span className="text-xs text-primary-foreground/60">{user.email}</span>
                    </div>
                  </div>

                  {userMenuItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 ${isScrolled ? "text-foreground/80 hover:text-primary hover:bg-muted/50" : "text-primary-foreground/80 hover:text-accent hover:bg-primary-foreground/5"}`}
                      style={{ animationDelay: `${(navItems.length + index) * 50}ms` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}

                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="ghost"
                    asChild
                    className={`justify-start ${isScrolled ? "hover:bg-muted hover:text-primary" : "hover:bg-primary-foreground/10 hover:text-accent"}`}
                  >
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      <User className="h-4 w-4 mr-3" />
                      Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="justify-start bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-primary font-semibold"
                  >
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Register Now
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
