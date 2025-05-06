import React, { FC, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const isAuthenticated = authService.isAuthenticated();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 