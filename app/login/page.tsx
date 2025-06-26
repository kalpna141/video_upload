"use client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
import { signIn, SignInResponse } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// TypeScript interfaces
interface FormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  submit?: string;
}

// Fixed interface to match NextAuth SignInResponse
interface SignInResult {
  error?: string | null;
  ok?: boolean;
  status?: number;
  url?: string | null;
}

// Interface for particle positions to fix hydration
interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    email: false,
    password: false,
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();

  // Fix hydration by generating particles only on client side
  useEffect(() => {
    setIsClient(true);
    // Generate particles with consistent positions
    const generatedParticles: Particle[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
      })
    );
    setParticles(generatedParticles);
  }, []);

  // Form validation
  const validateField = useCallback(
    (name: keyof FormData, value: string): string | undefined => {
      switch (name) {
        case "email":
          if (!value.trim()) return "Email is required";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return "Please enter a valid email address";
          break;

        case "password":
          if (!value) return "Password is required";
          if (value.length < 6) return "Password must be at least 6 characters";
          break;

        default:
          return undefined;
      }
      return undefined;
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }

      // Clear submit error when user starts typing
      if (errors.submit) {
        setErrors((prev) => ({ ...prev, submit: undefined }));
      }
    },
    [touched, validateField, errors.submit]
  );

  // Handle input blur for validation
  const handleBlur = useCallback(
    (field: keyof FormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, formData[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [formData, validateField]
  );

  // Handle form submission - Fixed TypeScript issues
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        email: true,
        password: true,
      });

      if (!validateForm()) return;

      setIsLoading(true);
      setErrors({});

      try {
        const result: SignInResponse | undefined = await signIn("credentials", {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          // Handle different types of authentication errors
          switch (result.error) {
            case "CredentialsSignin":
              setErrors({
                submit: "Invalid email or password. Please try again.",
              });
              break;
            case "EmailNotVerified":
              setErrors({
                submit: "Please verify your email before signing in.",
              });
              break;
            case "UserNotFound":
              setErrors({ email: "No account found with this email address." });
              break;
            case "TooManyAttempts":
              setErrors({
                submit: "Too many failed attempts. Please try again later.",
              });
              break;
            default:
              setErrors({
                submit:
                  result.error || "Authentication failed. Please try again.",
              });
          }
        } else if (result?.ok) {
          // Success - redirect to home
          router.push("/");
        } else {
          setErrors({
            submit: "An unexpected error occurred. Please try again.",
          });
        }
      } catch (error) {
        console.error("Login error:", error);
        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : "Network error. Please check your connection.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, validateForm, router]
  );

  // Handle Google Sign In
  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign in error:", error);
      setErrors({
        submit: "Google sign in failed. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  const isFormValid =
    Object.keys(errors).length === 0 && formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
      </div>

      {/* Floating particles - Only render on client */}
      {isClient && (
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-ping"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-105 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-300 text-sm">Sign in to your account</p>
          </div>

          {/* Global error message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200 block">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 ${
                      errors.email ? "text-red-400" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  placeholder="Enter your email address"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("email", e.target.value)
                  }
                  onBlur={() => handleBlur("email")}
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border ${
                    errors.email
                      ? "border-red-400 focus:ring-red-400"
                      : "border-white/20 focus:ring-purple-400"
                  } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {!errors.email && formData.email && touched.email && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="text-red-400 text-xs mt-1 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200 block">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      errors.password ? "text-red-400" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  placeholder="Enter your password"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("password", e.target.value)
                  }
                  onBlur={() => handleBlur("password")}
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border ${
                    errors.password
                      ? "border-red-400 focus:ring-red-400"
                      : "border-white/20 focus:ring-purple-400"
                  } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15`}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="text-red-400 text-xs mt-1 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                Forgot your password?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              onClick={handleSubmit}
              className={`w-full font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-2 ${
                isLoading || !isFormValid
                  ? "bg-gray-600 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105"
              } text-white`}
              aria-label="Sign in to account"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/10 backdrop-blur-sm text-gray-300 rounded-full">
                  or
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className={`w-full flex items-center justify-center px-4 py-4 border border-white/20 rounded-xl font-medium transition-all duration-300 ${
                isGoogleLoading
                  ? "bg-white/5 cursor-not-allowed opacity-50"
                  : "bg-white/10 hover:bg-white/20 hover:scale-105"
              } text-white backdrop-blur-sm shadow-lg`}
              aria-label="Continue with Google"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Register link */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors duration-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                Create account
              </a>
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>Secure Login</span>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
