"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MorphingText } from "@/components/ui/morphing-text"
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  BarChart,
  Globe,
  Star,
  Rocket,
  Sparkles,
  TrendingUp,
  Cpu,
  Power
} from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Smart Energy Automation",
      description: "Automatically control lights and fans based on human presence using sensors and ESP devices."
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "IoT Powered Control",
      description: "Seamlessly connect ESP32, sensors, and relays through a real-time IoT architecture."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Energy Analytics",
      description: "Monitor power usage, detect idle consumption, and reduce unnecessary energy waste."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Access Control",
      description: "Role-based access for admins and operators with secure authentication."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Centralized Dashboard",
      description: "Manage multiple rooms and devices from one unified web dashboard."
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Scalable Architecture",
      description: "Built to scale from classrooms to entire campuses."
    }
  ]

  const testimonials = [
    {
      name: "Technical Staff",
      role: "Project Developer",
      content: "PowerNest helped me combine IoT, web, and real-world energy optimization into one powerful system.",
      avatar: "TS"
    },
    {
      name: "College Admin",
      role: "Infrastructure Team",
      content: "This system can significantly reduce electricity wastage in academic buildings.",
      avatar: "CA"
    },
    {
      name: "Project Mentor",
      role: "IoT Evaluator",
      content: "A strong real-world problem with an impressive technical execution.",
      avatar: "HM"
    }
  ]

  const stats = [
    { value: "30%+", label: "Energy Saved" },
    { value: "Real-time", label: "Automation" },
    { value: "4.9", label: "Project Rating", icon: <Star className="h-4 w-4 fill-current" /> },
    { value: "24/7", label: "Monitoring" }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-black w-full">

      {/* Hero Section */}
      <section className="flex items-center min-h-[100vh] sm:mt-0">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge className="mb-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
            <TrendingUp className="mr-2 h-4 w-4" />
            Smart Energy Regulation Platform
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-emerald-900 dark:text-emerald-400 mb-6">
            <MorphingText
              texts={[
                "SaveEnergy",
                "AutomatePower",
                "SmartCampuses",
                "PowerNest"
              ]}
            />
            <span className="block text-gray-800 dark:text-gray-300 mt-4">
              Intelligent Power Automation System
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            PowerNest automatically manages room-level electricity using IoT sensors,
            ESP devices, and a centralized web dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="px-8 py-6 text-lg border-emerald-600 text-emerald-700">
                Explore Features
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center items-center space-x-1 text-2xl font-bold text-emerald-900 dark:text-emerald-400">
                  <span>{stat.value}</span>
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-400">
              Why PowerNest?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              Designed for smart energy regulation using IoT and automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <div className="text-emerald-700 dark:text-emerald-400">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-400">
              Project Feedback
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar>
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {t.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{t.name}</h4>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="italic text-gray-700 dark:text-gray-400">
                    "{t.content}"
                  </p>
                  <div className="flex mt-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-5 w-5 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-white dark:bg-black">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center">
              <Power className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-900 dark:text-emerald-400">
              PowerNest
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-4 md:mt-0">
            © {new Date().getFullYear()} PowerNest — Smart Energy Automation
          </p>
        </div>
      </footer>
    </div>
  )
}
