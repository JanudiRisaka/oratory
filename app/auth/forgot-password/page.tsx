"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Mic,
  Mail,
  ArrowLeft,
  CheckCircle
} from "lucide-react"
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/router";
import { FirebaseError } from "firebase/app";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);

      setIsLoading(false);
      setIsSubmitted(true);
    } catch (error: unknown) {
      setIsLoading(false);
      console.error("Error sending password reset email:", error);

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-email') {
          alert('Invalid email address. Please try again.');
        } else if (error.code === 'auth/user-not-found') {
          alert('No user found with this email address.');
        } else {
          alert('An error occurred. Please try again later.');
        }
      } else {
        alert('An unexpected error occurred.');
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-800 flex items-center justify-center p-4">
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230ea5e9" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50`} />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl shadow-lg mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              Oratory
            </h1>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm animate-slide-in">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-brand-800 dark:text-brand-100">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-brand-600 dark:text-brand-300">
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-brand-600 dark:text-brand-300">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="w-full border-brand-200 hover:bg-brand-50 hover:border-brand-300 dark:border-brand-700 dark:hover:bg-brand-800"
                  >
                    Try Different Email
                  </Button>

                  <Link href="/auth/login">
                    <Button
                      variant="ghost"
                      className="w-full text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-950 dark:via-brand-900 dark:to-brand-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%230ea5e9&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl shadow-lg mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Oratory
          </h1>
          <p className="text-brand-600 dark:text-brand-300 mt-2">
            Reset your password
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-brand-900/80 backdrop-blur-sm animate-slide-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-brand-800 dark:text-brand-100">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center text-brand-600 dark:text-brand-300">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-brand-200 focus:border-brand-400 focus:ring-brand-400 dark:border-brand-700 dark:focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending reset link...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-brand-200 dark:border-brand-700">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-brand-500 dark:text-brand-400">
          <p>© 2024 Oratory. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
