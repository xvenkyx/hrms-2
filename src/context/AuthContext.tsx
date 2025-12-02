import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// In AuthContext file, update the User interface:
export interface User {
  employeeId: string;  // Change from optional to required
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'hr' | 'employee';
  department?: string;
  designation?: string;  // Add this
  baseSalary?: number;  // Add this
  leavesRemaining?: number;  // Add this
  casualLeavesUsed?: number;  // Add this
  casualLeavesTotal?: number;  // Add this
  sickLeavesUsed?: number;  // Add this
  sickLeavesTotal?: number;  // Add this
  date_of_birth?: string;  // Add this
  joiningDate?: string;  // Add this
  pfApplicable?: boolean;  // Add this
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<any>;
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
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get API base URL from environment
  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setSessionToken(token);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('📤 Attempting login to:', `${API_BASE}/auth`);
      console.log('📧 Email:', email);
      
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          company_email: email,
          password: password
        })
      });

      console.log('📥 Login response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.error || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login success:', data);
      
      setUser(data.employee);
      setSessionToken(data.sessionToken);
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('user', JSON.stringify(data.employee));
      
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch(`${API_BASE}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', sessionToken })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const register = async (data: any) => {
    console.log('📤 Registering:', `${API_BASE}/auth`);
    console.log('📝 Data:', data);
    
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action: 'register', ...data })
    });

    console.log('📥 Register response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Register error:', errorText);
      throw new Error(errorText || 'Registration failed');
    }

    return response.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};