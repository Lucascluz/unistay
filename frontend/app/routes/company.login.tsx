import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { useCompanyAuth } from "~/lib/companyAuth";

export default function CompanyLogin() {
  const navigate = useNavigate();
  const { login } = useCompanyAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/company/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Company Login</h1>
          <p className="text-sm text-gray-600 mt-2">
            Access your company dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Login Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              {error.includes("verification") && (
                <p className="text-sm text-red-600 mt-2">
                  Your company account is pending verification. Please wait for admin approval.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Company Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="company@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-gray-600">
            Don't have a company account?{" "}
            <Link to="/company/register" className="text-blue-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Looking for user login?{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Login as User
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
