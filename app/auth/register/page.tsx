"use client"

import { useState } from "react"
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
  User,
  ArrowRight,
  Chrome,
  Github,
  Apple,
  CheckCircle
} from "lucide-react"


import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (id: keyof RegisterFormData, checked: boolean | 'indeterminate') => {
    setFormData(prev => ({
      ...prev,
      [id]: checked === true
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // This guard clause is perfect.
    if (isLoading) {
      return;
    }

    setError(null);

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (user) {
        await updateProfile(user, { displayName: fullName });

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          subscribedToNewsletter: formData.subscribeNewsletter,
          createdAt: serverTimestamp(),
        });
        console.log("User document created in Firestore for:", user.uid);
      }

      console.log("User registered:", user);
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Firebase registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak (should be at least 6 characters).");
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

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500"
    if (strength <= 3) return "bg-yellow-500"
    if (strength <= 4) return "bg-brand-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Fair"
    if (strength <= 4) return "Good"
    return "Strong"
  }

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
            Start your speaking journey today
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm animate-slide-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-brand-800 dark:text-brand-100">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-brand-600 dark:text-brand-300">
              Join thousands improving their speaking skills
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
            </div> */}

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-brand-200 dark:bg-brand-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-brand-900 px-2 text-brand-500 dark:text-brand-400">
                  Or create with email
                </span>
              </div>
            </div> */}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-brand-700 dark:text-brand-200">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                       onChange={handleChange}
                      className="pl-10 border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-brand-700 dark:text-brand-200">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-brand-700 dark:text-brand-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength(formData.password))}`}
                          style={{ width: `${(passwordStrength(formData.password) / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-brand-600 dark:text-brand-300">
                        {getStrengthText(passwordStrength(formData.password))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-brand-700 dark:text-brand-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-brand-400 hover:text-brand-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500">Passwords don't match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                    className="border-brand-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 mt-0.5"
                    required
                  />
                  <Label htmlFor="terms" className="text-sm text-brand-600 dark:text-brand-300 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) => handleCheckboxChange('subscribeNewsletter', checked as boolean)}
                    className="border-brand-300 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600"
                  />
                  <Label htmlFor="newsletter" className="text-sm text-brand-600 dark:text-brand-300">
                    Subscribe to our newsletter for speaking tips
                  </Label>
                </div> */}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-brand-200 dark:border-brand-700">
              <p className="text-sm text-brand-600 dark:text-brand-300">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
                >
                  Sign in here
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