'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../components/layout/AppShell';
import LoginView from '../views/LoginView';
import IntegratedView from '../views/IntegratedView';
import StudentSubmitView from '../views/StudentSubmitView';
import PlanFormView from '../views/PlanFormView';
import DeptProgramView from '../views/DeptProgramView';
import ToeicView from '../views/ToeicView';
import VolunteerView from '../views/VolunteerView';
import StatsView from '../views/StatsView';
import SettingsView from '../views/SettingsView';
import { useAuth } from '../auth/AuthContext';
import { canAccessView, ViewKey } from '../auth/roles';

export type PortalRoute =
  | '/'
  | '/login'
  | '/integrated'
  | '/submit'
  | '/form'
  | '/dept'
  | '/toeic'
  | '/volunteer'
  | '/stats'
  | '/settings';

type ProtectedRoute = Exclude<PortalRoute, '/' | '/login'>;

const VIEW_FOR_ROUTE: Record<ProtectedRoute, ViewKey> = {
  '/integrated': 'integrated',
  '/submit': 'submit',
  '/form': 'form',
  '/dept': 'dept',
  '/toeic': 'toeic',
  '/volunteer': 'volunteer',
  '/stats': 'stats',
  '/settings': 'settings',
};

const ROOT_REDIRECT_ORDER: ViewKey[] = [
  'integrated',
  'submit',
  'dept',
  'toeic',
  'volunteer',
  'stats',
  'settings',
];

function RootRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const first = ROOT_REDIRECT_ORDER.find((view) => canAccessView(user.role, view));
    const target = first === 'submit' ? '/submit' : `/${first ?? 'integrated'}`;
    router.replace(target);
  }, [router, user]);

  return null;
}

function routeView(route: ProtectedRoute): React.ReactElement {
  switch (route) {
    case '/integrated':
      return <IntegratedView />;
    case '/submit':
      return <StudentSubmitView />;
    case '/form':
      return <PlanFormView />;
    case '/dept':
      return <DeptProgramView />;
    case '/toeic':
      return <ToeicView />;
    case '/volunteer':
      return <VolunteerView />;
    case '/stats':
      return <StatsView />;
    case '/settings':
      return <SettingsView />;
  }
}

export default function PortalApp({ route }: { route: PortalRoute }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const view = route === '/' || route === '/login' ? undefined : VIEW_FOR_ROUTE[route];

  useEffect(() => {
    if (!hydrated) return;
    if (route === '/login') {
      if (user) router.replace('/');
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (view && !canAccessView(user.role, view)) router.replace('/');
  }, [hydrated, route, router, user, view]);

  if (!hydrated) return null;
  if (route === '/login') return user ? null : <LoginView />;
  if (!user) return null;
  if (route === '/') return <RootRedirect />;
  if (!view || !canAccessView(user.role, view)) return null;

  return <AppShell>{routeView(route)}</AppShell>;
}

export { PortalApp };
