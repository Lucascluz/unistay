import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { useCompanyAuth } from "~/lib/companyAuth";
import { SimpleLogoHeader } from "~/components/PageHeader";

export default function CompanyRegister() {
  const navigate = useNavigate();
  const { register } = useCompanyAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyType: "landlord" as "landlord" | "housing_platform" | "university",
    taxId: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyType: formData.companyType,
        taxId: formData.taxId || undefined,
        website: formData.website || undefined,
      });
      
      setSuccess(true);
      // Don't navigate immediately, show success message
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleLogoHeader />
        <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Submitted!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your company registration has been received. Our team will review your information
              and verify your business credentials. You'll receive an email once your account is approved.
            </p>

            <div className="w-full space-y-3">
              <Button
                onClick={() => navigate("/company/login")}
                className="w-full"
              >
                Go to Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleLogoHeader />
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Company Registration</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
            Register your business to respond to reviews
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Registration Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm">Company Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Acme Housing LLC"
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="companyType" className="text-sm">Company Type *</Label>
              <select
                id="companyType"
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 text-sm sm:text-base"
                required
                disabled={isLoading}
              >
                <option value="landlord">Landlord</option>
                <option value="housing_platform">Housing Platform</option>
                <option value="university">University</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm">Company Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@company.com"
              required
              className="mt-1"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use your official company email address
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxId">Tax ID (Optional)</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="XX-XXXXXXX"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://company.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-xs sm:text-sm text-blue-900 dark:text-blue-200 mb-2">
              Verification Process
            </h3>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Your registration will be reviewed by our team</li>
              <li>• We'll verify your business credentials</li>
              <li>• You'll receive an email once approved</li>
              <li>• Only verified companies can respond to reviews</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Register Company"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have a company account?{" "}
            <Link to="/company/login" className="text-blue-600 hover:text-blue-700 underline font-medium">
              Login here
            </Link>
          </p>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              Looking to register as a user?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 underline font-medium">
                User Registration
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
    </div>
  );
}
