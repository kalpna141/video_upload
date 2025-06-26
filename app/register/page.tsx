"use client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserPlus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// TypeScript interfaces
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();

  // Fix hydration by generating particles only on client side
  useEffect(() => {
    setIsClient(true);
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

  // Password strength calculation
  const calculatePasswordStrength = useCallback(
    (password: string): PasswordStrength => {
      let score = 0;

      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      const strengthMap: Array<{ label: string; color: string }> = [
        { label: "Very Weak", color: "bg-red-500" },
        { label: "Weak", color: "bg-orange-500" },
        { label: "Fair", color: "bg-yellow-500" },
        { label: "Good", color: "bg-blue-500" },
        { label: "Strong", color: "bg-green-500" },
        { label: "Very Strong", color: "bg-emerald-500" },
      ];

      return {
        score,
        label: strengthMap[score]?.label || "Very Weak",
        color: strengthMap[score]?.color || "bg-red-500",
      };
    },
    []
  );

  // Comprehensive form validation
  const validateField = useCallback(
    (name: keyof FormData, value: string): string | undefined => {
      switch (name) {
        case "email":
          if (!value.trim()) return "Email is required";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return "Please enter a valid email address";
          if (value.length > 254) return "Email is too long";
          break;

        case "password":
          if (!value) return "Password is required";
          if (value.length < 8)
            return "Password must be at least 8 characters long";
          if (value.length > 128) return "Password is too long";
          if (!/(?=.*[a-z])/.test(value))
            return "Password must contain at least one lowercase letter";
          if (!/(?=.*[A-Z])/.test(value))
            return "Password must contain at least one uppercase letter";
          if (!/(?=.*\d)/.test(value))
            return "Password must contain at least one number";
          if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(value))
            return "Password must contain at least one special character";
          break;

        case "confirmPassword":
          if (!value) return "Please confirm your password";
          if (value !== formData.password) return "Passwords do not match";
          break;

        default:
          return undefined;
      }
      return undefined;
    },
    [formData.password]
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

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        email: true,
        password: true,
        confirmPassword: true,
      });

      if (!validateForm()) return;

      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }),
        });

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            setErrors({ email: "An account with this email already exists" });
          } else if (response.status === 400) {
            setErrors({ submit: data.message || "Invalid registration data" });
          } else if (response.status >= 500) {
            setErrors({ submit: "Server error. Please try again later." });
          } else {
            setErrors({
              submit: data.message || "Registration failed. Please try again.",
            });
          }
          return;
        }

        // Success - redirect to login
        router.push("/login?message=Registration successful! Please log in.");
      } catch (error) {
        console.error("Registration error:", error);
        setErrors({
          submit:
            error instanceof Error
              ? error.message
              : "Network error. Please check your connection and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, validateForm, router]
  );

  const passwordStrength = calculatePasswordStrength(formData.password);
  const isFormValid =
    Object.keys(errors).length === 0 &&
    formData.email &&
    formData.password &&
    formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
      </div>

      {/* Floating particles - only render on client */}
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-300 text-sm">
              Join us and start your journey
            </p>
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
                  placeholder="Create a strong password"
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
                    errors.password ? "password-error" : "password-strength"
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

              {/* Password strength indicator */}
              {formData.password && (
                <div id="password-strength" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">
                      Password Strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.score >= 4
                          ? "text-green-400"
                          : passwordStrength.score >= 2
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

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

            {/* Confirm Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200 block">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      errors.confirmPassword ? "text-red-400" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  placeholder="Confirm your password"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border ${
                    errors.confirmPassword
                      ? "border-red-400 focus:ring-red-400"
                      : "border-white/20 focus:ring-purple-400"
                  } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {!errors.confirmPassword &&
                  formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-12 pr-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                  )}
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="text-red-400 text-xs mt-1 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
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
              aria-label="Create account"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>

          {/* Login link */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors duration-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>Secure & Protected</span>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
