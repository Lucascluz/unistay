import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
}

export function PageHeader({ showBackButton = true, backTo = "/", title }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Home Link */}
          <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/study-stay-logo.png" 
              alt="UniStay" 
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <span className="text-base sm:text-xl font-bold text-gray-900">UniStay</span>
          </Link>

          {/* Optional Title */}
          {title && (
            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 hidden md:block">
              {title}
            </h1>
          )}

          {/* Back Button */}
          {showBackButton && (
            <Link
              to={backTo}
              className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

interface SimpleLogoHeaderProps {
  showBackButton?: boolean;
}

export function SimpleLogoHeader({ showBackButton = true }: SimpleLogoHeaderProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/study-stay-logo.png" 
            alt="UniStay" 
            className="h-6 w-6 sm:h-8 sm:w-8"
          />
          <span className="text-base sm:text-xl font-bold text-gray-900">UniStay</span>
        </Link>
        
        {showBackButton && (
          <Link
            to="/"
            className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}
