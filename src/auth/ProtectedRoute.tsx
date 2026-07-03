import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canAccessView, ViewKey } from './roles';

export default function ProtectedRoute({ view, children }: { view?: ViewKey; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (view && !canAccessView(user.role, view)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
