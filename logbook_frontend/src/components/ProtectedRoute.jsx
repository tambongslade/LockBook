import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, teacherOnly = false, delegateOnly = false }) => {
  const { user, loading, isAdmin, isTeacher, isDelegate } = useAuth();

  console.log('[ProtectedRoute] State:', { loading, user: user ? { role: user.role, id: user._id } : null, adminOnly, teacherOnly, delegateOnly });

  if (loading) {
    console.log('[ProtectedRoute] Result: Still loading auth state...');
    return <div>Loading Authentication...</div>;
  }

  if (!user) {
    console.log('[ProtectedRoute] Result: No user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check specific role requirements
  if (adminOnly) {
    console.log(`[ProtectedRoute] Checking adminOnly... User role: ${user?.role}`);
    const adminCheckResult = isAdmin(); // Call the function from context
    console.log(`[ProtectedRoute] isAdmin() check result: ${adminCheckResult}`);
    if (!adminCheckResult) {
        console.error('[ProtectedRoute] Result: Admin access required but denied. Redirecting to /');
        return <Navigate to="/" replace />;
    }
    console.log('[ProtectedRoute] Admin check passed.');
  }

  if (teacherOnly) {
    console.log(`[ProtectedRoute] Checking teacherOnly... User role: ${user?.role}`);
     const teacherCheck = isTeacher();
     console.log(`[ProtectedRoute] isTeacher() check result: ${teacherCheck}`);
     if (!teacherCheck) {
         console.error('[ProtectedRoute] Result: Teacher access required but denied. Redirecting to /');
         return <Navigate to="/" replace />;
     }
     console.log('[ProtectedRoute] Teacher check passed.');
  }

  if (delegateOnly) {
      console.log(`[ProtectedRoute] Checking delegateOnly... User role: ${user?.role}`);
      const delegateCheck = isDelegate();
      console.log(`[ProtectedRoute] isDelegate() check result: ${delegateCheck}`);
      if (!delegateCheck) {
          console.error('[ProtectedRoute] Result: Delegate/Student access required but denied. Redirecting to /');
          return <Navigate to="/" replace />;
      }
      console.log('[ProtectedRoute] Delegate check passed.');
  }

  // If all checks pass
  console.log('[ProtectedRoute] Result: Access granted.');
  return children;
};

export default ProtectedRoute; 