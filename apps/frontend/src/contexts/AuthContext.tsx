import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axiosInstance from '../lib/http';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../lib/auth-storage';
import type {
  AuthUser,
  LoginResponse,
  MeResponse,
  RegisterResponse,
  UserProfile,
  UserRole,
} from '../types/auth';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  referralCode?: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<RegisterResponse['data']>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }

    const { data } = await axiosInstance.get<MeResponse>('/api/auth/me');
    setUser(data.data);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshProfile();
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await axiosInstance.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });

    setStoredToken(data.data.token);
    const profile = await axiosInstance.get<MeResponse>('/api/auth/me');
    setUser(profile.data.data);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await axiosInstance.post<RegisterResponse>(
      '/api/auth/register',
      input
    );
    return data.data;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export type { AuthUser, UserRole };
