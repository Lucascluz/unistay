import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi, type User, type RegisterRequest } from "./api";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string, 
    email: string, 
    password: string,
    nationality?: string,
    gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say',
    birthDate?: string,
    dataConsent?: boolean,
    anonymizedDataOptIn?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const register = async (
    name: string, 
    email: string, 
    password: string,
    nationality?: string,
    gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say',
    birthDate?: string,
    dataConsent: boolean = true,
    anonymizedDataOptIn: boolean = false
  ) => {
    const registerData: RegisterRequest = {
      name,
      email,
      password,
      nationality,
      gender,
      birthDate,
      dataConsent,
      anonymizedDataOptIn,
    };
    
    console.log('🚀 Sending registration data:', registerData);
    
    try {
      const response = await authApi.register(registerData);
      console.log('✅ Registration successful:', response);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Logout from frontend even if backend call fails
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        // Don't logout on refresh failure - could be temporary network issue
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
