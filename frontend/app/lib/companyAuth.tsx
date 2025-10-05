import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { companiesApi, type Company } from "./api";

interface CompanyAuthContextType {
  company: Company | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    companyType: 'landlord' | 'housing_platform' | 'university';
    taxId?: string;
    website?: string;
    verificationDocumentUrl?: string;
  }) => Promise<{ company: Company; message: string }>;
  logout: () => void;
}

const CompanyAuthContext = createContext<CompanyAuthContextType | undefined>(undefined);

export function CompanyAuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if company is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('companyToken');
      if (token) {
        try {
          const response = await companiesApi.getCurrentCompany();
          setCompany(response.company);
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('companyToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await companiesApi.login({ email, password });
    setCompany(response.company);
    // Store company token separately from user token
    localStorage.setItem('companyToken', response.token);
    localStorage.setItem('token', response.token); // For API client
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    companyType: 'landlord' | 'housing_platform' | 'university';
    taxId?: string;
    website?: string;
    verificationDocumentUrl?: string;
  }) => {
    const response = await companiesApi.register(data);
    // Note: Company cannot log in until verified, so don't set token
    return response;
  };

  const logout = () => {
    setCompany(null);
    localStorage.removeItem('companyToken');
    localStorage.removeItem('token');
  };

  return (
    <CompanyAuthContext.Provider
      value={{
        company,
        isLoggedIn: !!company,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </CompanyAuthContext.Provider>
  );
}

export function useCompanyAuth() {
  const context = useContext(CompanyAuthContext);
  if (context === undefined) {
    throw new Error("useCompanyAuth must be used within a CompanyAuthProvider");
  }
  return context;
}
