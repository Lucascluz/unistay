import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/lib/auth";
import type { Route } from "./+types/register";
import type { RegisterRequest } from "~/lib/api/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - StudentStay" },
    { name: "description", content: "Create your StudentStay account" },
  ];
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: "",
    email: "",
    password: "",
    nationality: "",
    gender: undefined,
    birthDate: "",
    dataConsent: false,
    anonymizedDataOptIn: false,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.dataConsent) {
      setError("You must consent to data processing to create an account");
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.name, 
        formData.email, 
        formData.password,
        formData.nationality,
        formData.gender,
        formData.birthDate,
        formData.dataConsent,
        formData.anonymizedDataOptIn
      );
      
      // Redirect to the page they were trying to access, or home
      const redirectTo = searchParams.get("redirect") || "/";
      navigate(redirectTo);
    } catch (err) {
      setError("Failed to create account. Please try again.");
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
              alt="StudentStay Logo" 
              className="h-48 w-48 object-contain"
            />
            <span className="text-7xl font-bold text-gray-900 dark:text-white">StudentStay</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join thousands of students sharing their experiences
          </p>
        </div>

        {/* Register Form */}
        <Card className="p-8 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={8}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Optional fields toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
              >
                {showOptionalFields ? '▼' : '▶'} 
                {showOptionalFields ? 'Hide' : 'Add'} optional info (boosts your trust score!)
              </button>
            </div>

            {/* Optional demographic fields */}
            {showOptionalFields && (
              <div className="space-y-4 pt-2 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ✨ Adding this info increases your trust score and helps other students find relevant experiences!
                </p>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    type="text"
                    placeholder="e.g., Germany, Brazil, USA"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {/* Required consent */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="dataConsent"
                  checked={formData.dataConsent}
                  onChange={(e) => setFormData({ ...formData, dataConsent: e.target.checked })}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  required
                />
                <label htmlFor="dataConsent" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">I consent to data processing *</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Required to create an account and use StudentStay services
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="anonymizedDataOptIn"
                  checked={formData.anonymizedDataOptIn}
                  onChange={(e) => setFormData({ ...formData, anonymizedDataOptIn: e.target.checked })}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="anonymizedDataOptIn" className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to share anonymized data for research
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Helps improve student housing insights (optional)
                  </p>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate(`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Sign in
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
