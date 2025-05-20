import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { supabase } from '../lib/supabase';
import { getProfile, createProfile } from '../lib/api';
import type { UserType, Profile } from '../types/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, userType: 'admin' | 'customer') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Define isAuthenticated before any use
  const isAuthenticated = !!session && !!user;

  // Function to handle profile retrieval or creation if missing
  const fetchOrCreateProfile = useCallback(async (userId: string, userEmail: string | undefined) => {
    try {
      // Add some delay to prevent multiple simultaneous attempts
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Attempt to fetch profile
      const userProfile = await getProfile(userId);
      
      // If profile exists, use it
      if (userProfile) {
        setProfile(userProfile);
        setUserType(userProfile.user_type || null);
        return userProfile;
      } 
      
      // If no profile and we have an email, try to create one
      if (!userProfile && userEmail) {
        console.log('No profile found, creating one with default customer type');
        try {
          // Create a default customer profile
          const newProfile = await createProfile(userId, userEmail, 'customer');
          
          if (newProfile) {
            setProfile(newProfile);
            setUserType(newProfile.user_type);
            toast.success('Profile created successfully');
            return newProfile;
          } else {
            console.error('Failed to create default profile');
            // Check if profile was created by another process
            const retryProfile = await getProfile(userId);
            if (retryProfile) {
              console.log('Profile was created by another process, using it');
              setProfile(retryProfile);
              setUserType(retryProfile.user_type || null);
              return retryProfile;
            }
          }
        } catch (error) {
          console.error('Error creating profile:', error);
          // Still check if profile was created despite the error
          const retryProfile = await getProfile(userId);
          if (retryProfile) {
            console.log('Profile exists despite error, using it');
            setProfile(retryProfile);
            setUserType(retryProfile.user_type || null);
            return retryProfile;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in fetchOrCreateProfile:', error);
      return null;
    }
  }, []);

  // Initialize and set up Supabase auth listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // If user is logged in, fetch or create their profile
        if (currentSession?.user) {
          await fetchOrCreateProfile(currentSession.user.id, currentSession.user.email);
        }

        setIsInitialized(true);
        setIsLoading(false);

        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user || null);
            
            if (currentSession?.user) {
              await fetchOrCreateProfile(currentSession.user.id, currentSession.user.email);
            } else {
              setProfile(null);
              setUserType(null);
            }
          }
        );

        // Clean up subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchOrCreateProfile]); // Only depend on the stable fetchOrCreateProfile function

  // Separate useEffect for navigation logic
  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Don't redirect until auth is initialized
    }

    // For HashRouter, we need to get the path from the hash
    // window.location.hash will be something like "#/admin/settings"
    // so we remove the '#' and get the path
    const hashPath = window.location.hash.replace('#', '');
    const pathname = hashPath || '/';
    
    // If user is not authenticated and not on authentication-related pages, redirect to login
    if (!isAuthenticated && 
        !pathname.startsWith('/register') && 
        !pathname.startsWith('/forgot-password') && 
        pathname !== '/') {
      navigate('/', { replace: true });
    } 
    // If user is authenticated but on login page, redirect to appropriate dashboard
    else if (isAuthenticated && userType && pathname === '/') {
      navigate(`/${userType}`, { replace: true });
    }
    // If user is authenticated but on wrong dashboard type, redirect to correct one
    else if (isAuthenticated && userType) {
      if (userType === 'admin' && !pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      } else if (userType === 'customer' && !pathname.startsWith('/customer')) {
        navigate('/customer', { replace: true });
      }
    }
  }, [isAuthenticated, userType, isInitialized, isLoading, navigate]);

  const signUp = async (email: string, password: string, userType: 'admin' | 'customer') => {
    try {
      setIsLoading(true);
      const { data: { user }, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      if (user) {
        // Create a profile for the user
        const newProfile = await createProfile(user.id, email, userType);
        
        if (!newProfile) {
          console.error('Failed to create user profile during signup');
          toast.error('Account created but profile setup failed. Please contact support.');
        } else {
          toast.success('Account created successfully! You can now sign in.');
        }
        // We don't auto-sign in to allow for easy switching between admin/customer for demo
      }
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Error creating account');
      console.error('Error signing up:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Session and user state will be updated by the auth listener
      toast.success('Signed in successfully');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Error signing in');
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Session and user state will be updated by the auth listener
      toast.success('Signed out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Error signing out');
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      userType,
      profile,
      isAuthenticated,
      isLoading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};