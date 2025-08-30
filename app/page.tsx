
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mic,
  Brain,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Star
} from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "AI-Powered Practice",
    description: "Practice with real-time AI feedback on your speaking performance, voice clarity, and presentation skills."
  },
  {
    icon: Brain,
    title: "Smart Feedback",
    description: "Get personalized insights on confidence, eye contact, gestures, and speaking pace to improve continuously."
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Visualize your improvement over time with detailed analytics and performance metrics."
  },
  {
    icon: Users,
    title: "Professional Growth",
    description: "Build confidence for presentations, meetings, interviews, and public speaking engagements."
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    content: "Oratory transformed my presentation skills. The AI feedback is incredibly detailed and helped me identify blind spots I never noticed.",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Sales Director",
    company: "InnovateCo",
    content: "The real-time feedback during practice sessions is game-changing. My confidence has improved dramatically in just a few weeks.",
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "Team Lead",
    company: "StartupXYZ",
    content: "Perfect for busy professionals. I can practice anywhere and get professional-level coaching insights instantly.",
    rating: 5
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">Oratory</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Master Public Speaking with{" "}
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Coaching
          </h1>
          <p className="text-xl text-brand-600 dark:text-brand-300 mb-8 max-w-2xl mx-auto">
            Practice presentations, get instant feedback, and build confidence with our advanced AI coaching platform.
            Perfect for professionals, students, and anyone looking to improve their speaking skills.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg hover:shadow-xl">
                <Play className="w-5 h-5 mr-2" />
                Start Practicing Now
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-brand-200 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:hover:bg-brand-800">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-800 dark:text-brand-100">
            Everything You Need to Excel
          </h2>
          <p className="text-xl text-brand-600 dark:text-brand-300 max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools and insights you need to become a confident, effective speaker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-brand-200 dark:border-brand-700 bg-white/50 dark:bg-brand-900/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-brand-800 dark:text-brand-100">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-brand-600 dark:text-brand-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-brand-50/50 dark:bg-brand-900/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-800 dark:text-brand-100">
              How It Works
            </h2>
            <p className="text-xl text-brand-600 dark:text-brand-300">
              Get started in minutes with our simple, effective process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-800 dark:text-brand-100">Record Your Practice</h3>
              <p className="text-brand-600 dark:text-brand-300">
                Use your camera and microphone to record practice sessions with or without slides
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-800 dark:text-brand-100">Get AI Analysis</h3>
              <p className="text-brand-600 dark:text-brand-300">
                Our AI analyzes your speech patterns, body language, and overall performance
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-800 dark:text-brand-100">Improve Continuously</h3>
              <p className="text-brand-600 dark:text-brand-300">
                Review detailed feedback, track progress, and practice regularly to build confidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-800 dark:text-brand-100">
            What Our Users Say
          </h2>
          <p className="text-xl text-brand-600 dark:text-brand-300">
            Join thousands of professionals who have transformed their speaking skills
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-brand-200 dark:border-brand-700 bg-white/50 dark:bg-brand-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <CardDescription className="text-base italic text-brand-600 dark:text-brand-300">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-semibold text-brand-800 dark:text-brand-100">{testimonial.name}</p>
                  <p className="text-sm text-brand-600 dark:text-brand-300">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-500 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Speaking Skills?
          </h2>
          <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who use Oratory to practice, improve, and excel in their presentations.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="bg-white text-brand-600 hover:bg-brand-50 shadow-lg hover:shadow-xl">
              Start Your Free Practice Session
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-200 dark:border-brand-700 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">Oratory</span>
              </div>
              <p className="text-brand-600 dark:text-brand-300">
                AI-powered public speaking practice platform for professionals.
              </p>
            </div>

            
          </div>

          <div className="border-t border-brand-200 dark:border-brand-700 mt-8 pt-8 text-center text-brand-500 dark:text-brand-400">
            <p>&copy; 2024 Oratory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}