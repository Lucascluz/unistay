import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/lib/auth";

export function meta({}: any) {
  return [
    { title: "Login - UniStay" },
    { name: "description", content: "Login to access your UniStay account" },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Check if coming from email verification
  useEffect(() => {
    if (location.state?.emailVerified) {
      setSuccess("Email verified successfully! You can now log in.");
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowResendLink(false);
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Redirect to the page they were trying to access, or home
      const redirectTo = searchParams.get("redirect") || "/";
      navigate(redirectTo);
    } catch (err: any) {
      // Check if it's an email verification error
      // ApiError has 'data' property with the response body
      if (err.data?.emailNotVerified) {
        setError("Please verify your email address before logging in. Check your inbox for the verification link.");
        setShowResendLink(true);
      } else {
        setError(err.data?.message || err.message || "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="flex items-center justify-center gap-8 mb-4 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img 
              src="/study-stay-logo.png" 
              alt="UniStay Logo" 
              className="h-48 w-48 object-contain"
            />
            <span className="text-7xl font-bold text-gray-900 dark:text-white">UniStay</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                {showResendLink && (
                  <button
                    onClick={() => navigate("/resend-verification", { state: { email } })}
                    className="text-sm text-blue-600 dark:text-blue-400 underline mt-2 hover:text-blue-700"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => navigate(`/register${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Sign up
              </button>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Are you a business?{" "}
              <button
                onClick={() => navigate("/company/login")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Company Login
              </button>
            </p>
          </div>
        </Card>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
