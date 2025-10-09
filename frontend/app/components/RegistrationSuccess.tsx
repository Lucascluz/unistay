import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface RegistrationSuccessProps {
  email: string;
}

export function RegistrationSuccess({ email }: RegistrationSuccessProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900">
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 dark:bg-green-900/20">
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
            Account Created Successfully! 🎉
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            We've sent a verification email to:
          </p>
          <p className="text-blue-600 dark:text-blue-500 font-semibold mt-1 break-all text-sm sm:text-base">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-left">
              <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Next Steps:
              </p>
              <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Start exploring student housing reviews!</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to Home
          </Button>
          
          <Button
            onClick={() => navigate("/resend-verification")}
            variant="outline"
            className="w-full"
          >
            Didn't receive the email?
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          The verification link will expire in 24 hours
        </p>
      </div>
    </Card>
  );
}
