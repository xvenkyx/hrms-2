// context/AuthContext.tsx - FIXED
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth as useOIDCAuth } from 'react-oidc-context';
import { getMyProfile } from '@/api/employees';

export interface User {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'hr' | 'employee';
  department?: string;
  designation?: string;
  baseSalary?: number;
  leavesRemaining?: number;
  casualLeavesUsed?: number;
  casualLeavesTotal?: number;
  sickLeavesUsed?: number;
  sickLeavesTotal?: number;
  date_of_birth?: string;
  joiningDate?: string;
  pfApplicable?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const oidcAuth = useOIDCAuth();
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage on initial render
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync user data from Cognito to your backend
  const syncUserWithBackend = async () => {
    try {
      // When user logs in via Cognito, get their profile from your backend
      const profile = await getMyProfile();
      if (profile) {
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } else {
        // If no profile, clear user
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Handle OIDC auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      if (oidcAuth.isLoading) {
        return;
      }

      console.log('OIDC Auth State:', {
        isAuthenticated: oidcAuth.isAuthenticated,
        user: oidcAuth.user,
        error: oidcAuth.error
      });

      // If there's an OIDC error, clear everything
      if (oidcAuth.error) {
        console.error('OIDC Auth Error:', oidcAuth.error);
        setUser(null);
        localStorage.removeItem('user');
        setIsLoading(false);
        return;
      }

      if (oidcAuth.isAuthenticated && oidcAuth.user) {
        try {
          // User is authenticated via Cognito
          console.log('User authenticated via Cognito:', oidcAuth.user.profile.email);
          await syncUserWithBackend();
        } catch (error) {
          console.error('Authentication error:', error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        // User is not authenticated
        setUser(null);
        localStorage.removeItem('user');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [oidcAuth.isLoading, oidcAuth.isAuthenticated, oidcAuth.user, oidcAuth.error]);

  const login = async () => {
    try {
      await oidcAuth.signinRedirect();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    
    // Use Cognito logout URL
    const clientId = "3dpb9telsc7meq8hv8bt8in391";
    const logoutUri = "http://localhost:5173/login";
    const cognitoDomain = "https://us-east-1cztj6inyo.auth.us-east-1.amazoncognito.com";
    
    // Clear Cognito session
    if (oidcAuth.user) {
      await oidcAuth.removeUser();
    }
    
    // Redirect to Cognito logout
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: oidcAuth.isLoading || isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};