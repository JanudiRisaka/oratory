"use client"

import { useState , useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Eye,
  EyeOff,
  Mic,
  Mail,
  Lock,
  ArrowRight,
  Chrome,
  Github,
  Apple
} from "lucide-react"

// Firebase auth
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  })
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
console.log("LoginPage initial render - email:", email, "password:", password);
useEffect(() => {
  console.log("LoginPage Mounted - Initial Email State:", email);
  console.log("LoginPage Mounted - Initial Password State:", password);
}, []);
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Firebase login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setError(null);
    console.log(`Attempting social login with ${provider}`);

    setTimeout(() => {
      setIsLoading(false);
     
      alert(`Social login with ${provider} not yet implemented.`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
     <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230ea5e9" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50`} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl shadow-lg mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Oratory
          </h1>
          <p className="text-brand-600 dark:text-brand-300 mt-2">
            Welcome back to your speaking journey
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm animate-slide-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-brand-800 dark:text-brand-100">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-brand-600 dark:text-brand-300">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                className="border-brand-200 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:hover:bg-brand-800"
              >
                <Chrome className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
                className="border-brand-200 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:hover:bg-brand-800"
              >
                <Github className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("apple")}
                disabled={isLoading}
                className="border-brand-200 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:hover:bg-brand-800"
              >
                <Apple className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-brand-200 dark:bg-brand-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-brand-900 px-2 text-brand-500 dark:text-brand-400">
                  Or continue with email
                </span>
              </div>
            </div> */}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-brand-700 dark:text-brand-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-700 dark:text-brand-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-brand-400 hover:text-brand-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-brand-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-brand-600 dark:text-brand-300">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-brand-200 dark:border-brand-700">
              <p className="text-sm text-brand-600 dark:text-brand-300">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-brand-500 dark:text-brand-400">
          <p>© 2024 Oratory. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}