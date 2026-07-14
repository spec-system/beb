'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { canAccessView, ViewKey } from './roles';

export default function ProtectedRoute({ view, children }: { view?: ViewKey; children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (view && !canAccessView(user.role, view)) {
      router.replace('/');
    }
  }, [hydrated, router, user, view]);

  if (!hydrated || !user || (view && !canAccessView(user.role, view))) return null;
  return <>{children}</>;
}
