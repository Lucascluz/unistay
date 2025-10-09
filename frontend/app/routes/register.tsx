import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/lib/auth";
import { RegistrationSuccess } from "~/components/RegistrationSuccess";
import type { Route } from "./+types/register";
import type { RegisterRequest } from "~/lib/api/types";

export function meta() {
  return [
    { title: "Sign Up - UniStay" },
    { name: "description", content: "Create your UniStay account" },
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
    languagePreferences: [],
    currentCountry: "",
    currentCity: "",
    homeUniversity: "",
    destinationUniversity: "",
    studyField: "",
    studyLevel: undefined,
    studyStartDate: "",
    studyEndDate: "",
    currentHousingType: undefined,
    monthlyRent: undefined,
    isCurrentlyRenting: false,
    hasLivedAbroadBefore: false,
    dataConsent: false,
    anonymizedDataOptIn: false,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
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
      
      // Show success message instead of redirecting immediately
      setRegistrationSuccess(true);
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If registration was successful, show success component
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img 
                src="/study-stay-logo.png" 
                alt="UniStay Logo" 
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
              />
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">UniStay</span>
            </div>
          </div>
          <RegistrationSuccess email={formData.email} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img 
              src="/study-stay-logo.png" 
              alt="UniStay Logo" 
              className="h-16 w-16 sm:h-24 sm:w-24 object-contain"
            />
            <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">UniStay</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Join thousands of students sharing their experiences
          </p>
        </div>

        {/* Register Form */}
        <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-500 font-medium flex items-center gap-1 w-full justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                {showOptionalFields ? '▼' : '▶'} 
                <span className="font-semibold">
                  {showOptionalFields ? 'Hide' : 'Complete your profile now'} – Boost your trust score by up to 70%!
                </span>
              </button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {showOptionalFields ? 'Adding complete info helps other students trust your reviews more' : 'Takes just 2 minutes • All optional • Can be added later'}
              </p>
            </div>

            {/* Optional demographic fields */}
            {showOptionalFields && (
              <div className="space-y-4 sm:space-y-6 pt-4 border-t">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    ✨ Why complete your profile?
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Higher trust score = More credible reviews</li>
                    <li>• Help students find experiences relevant to their situation</li>
                    <li>• Get better recommendations and insights</li>
                  </ul>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">📋 Personal Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        type="text"
                        placeholder="e.g., Germany, Brazil"
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
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="languagePreferences">Languages You Speak</Label>
                    <Input
                      id="languagePreferences"
                      type="text"
                      placeholder="e.g., English, Portuguese, Spanish"
                      value={formData.languagePreferences?.join(', ') || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        languagePreferences: e.target.value.split(',').map(lang => lang.trim()).filter(Boolean)
                      })}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Separate multiple languages with commas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentCountry">Current Country</Label>
                      <Input
                        id="currentCountry"
                        type="text"
                        placeholder="e.g., Portugal"
                        value={formData.currentCountry}
                        onChange={(e) => setFormData({ ...formData, currentCountry: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentCity">Current City</Label>
                      <Input
                        id="currentCity"
                        type="text"
                        placeholder="e.g., Lisbon"
                        value={formData.currentCity}
                        onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">🎓 Academic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="homeUniversity">Home University</Label>
                      <Input
                        id="homeUniversity"
                        type="text"
                        placeholder="e.g., TU Munich"
                        value={formData.homeUniversity}
                        onChange={(e) => setFormData({ ...formData, homeUniversity: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destinationUniversity">Study Destination</Label>
                      <Input
                        id="destinationUniversity"
                        type="text"
                        placeholder="e.g., Nova Lisbon"
                        value={formData.destinationUniversity}
                        onChange={(e) => setFormData({ ...formData, destinationUniversity: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studyField">Field of Study</Label>
                      <Input
                        id="studyField"
                        type="text"
                        placeholder="e.g., Computer Science"
                        value={formData.studyField}
                        onChange={(e) => setFormData({ ...formData, studyField: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studyLevel">Study Level</Label>
                      <select
                        id="studyLevel"
                        value={formData.studyLevel || ''}
                        onChange={(e) => setFormData({ ...formData, studyLevel: e.target.value as any })}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select...</option>
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                        <option value="phd">PhD</option>
                        <option value="exchange">Exchange</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studyStartDate">Study Start Date</Label>
                      <Input
                        id="studyStartDate"
                        type="date"
                        value={formData.studyStartDate}
                        onChange={(e) => setFormData({ ...formData, studyStartDate: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studyEndDate">Study End Date</Label>
                      <Input
                        id="studyEndDate"
                        type="date"
                        value={formData.studyEndDate}
                        onChange={(e) => setFormData({ ...formData, studyEndDate: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Housing Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">🏠 Housing Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentHousingType">Current Housing Type</Label>
                      <select
                        id="currentHousingType"
                        value={formData.currentHousingType || ''}
                        onChange={(e) => setFormData({ ...formData, currentHousingType: e.target.value as any })}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select...</option>
                        <option value="student_home">Student Home</option>
                        <option value="shared_apartment">Shared Apartment</option>
                        <option value="private_apartment">Private Apartment</option>
                        <option value="family">Family</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyRent">Monthly Rent (€)</Label>
                      <Input
                        id="monthlyRent"
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.monthlyRent || ''}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || undefined })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.isCurrentlyRenting || false}
                        onChange={(e) => setFormData({ ...formData, isCurrentlyRenting: e.target.checked })}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Currently renting</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.hasLivedAbroadBefore || false}
                        onChange={(e) => setFormData({ ...formData, hasLivedAbroadBefore: e.target.checked })}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Lived abroad before</span>
                    </label>
                  </div>
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
                    Required to create an account and use UniStay services
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

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate(`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-600 font-semibold"
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
