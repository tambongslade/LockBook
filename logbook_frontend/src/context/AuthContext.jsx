import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios'; // Assuming axios instance is here

const AuthContext = createContext();

// Helper function to get token from local storage
const getToken = () => localStorage.getItem('authToken');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading initially

  // Check authentication on initial load - logic moved directly into useEffect
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const performVerification = async () => {
      const token = getToken();
      if (!token) {
        if (isMounted) {
            setUser(null);
            setLoading(false);
        }
        return;
      }

      console.log('Verifying token (on mount)...');
      // Keep loading true until verification finishes or component unmounts
      // setLoading(true); // Already true initially

      try {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
            setUser(response.data);
            console.log('Token verified (on mount), user set:', response.data);
        }
      } catch (error) {
        console.error('Token verification failed (on mount): ', error);
        localStorage.removeItem('authToken');
        if (isMounted) {
            setUser(null);
        }
      } finally {
         if (isMounted) {
             setLoading(false);
         }
      }
    };

    performVerification();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // <-- IMPORTANT: Empty dependency array ensures this runs only once on mount

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password }); // Use your actual login endpoint
      const { token, user: userData } = response.data;

      if (!token || !userData) {
          throw new Error('Login response missing token or user data.');
      }

      localStorage.setItem('authToken', token); // Store the token
      // Configure axios to automatically send the token from now on (if not already done)
      // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      console.log('Login successful, token stored, user set:', userData);
      return userData; // Return user data for redirection logic
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('authToken'); // Clear token on failed login
      setUser(null);
      throw error.response?.data || { message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('authToken'); // Clear the token
    // Clear Authorization header from axios instance if set globally
    // delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAdmin = () => {
    // Roles might be lowercase from backend or after JWT decode
    return user?.role?.toLowerCase() === 'admin';
  };

  const isTeacher = () => {
    return user?.role?.toLowerCase() === 'teacher';
  };

  const isDelegate = () => {
    return user?.role?.toLowerCase() === 'delegate' || user?.role?.toLowerCase() === 'student'; // Assuming delegate might have student role too?
  };

  const providerValue = {
    user,
    login,
    logout,
    isAdmin,
    isTeacher,
    isDelegate,
    loading
  };

  // Log the value being provided just before returning
  console.log('[AuthContext] Providing value:', { 
    loading: providerValue.loading, 
    user: providerValue.user ? { role: providerValue.user.role, id: providerValue.user._id } : null 
  });

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 