import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoginView from './views/LoginView';
import IntegratedView from './views/IntegratedView';
import DeptProgramView from './views/DeptProgramView';
import ToeicView from './views/ToeicView';
import VolunteerView from './views/VolunteerView';
import StatsView from './views/StatsView';
import { canAccessView } from './auth/roles';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const first = (['integrated', 'dept', 'toeic', 'volunteer', 'stats'] as const).find((v) =>
    canAccessView(user.role, v),
  );
  return <Navigate to={`/${first ?? 'integrated'}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/integrated" element={<ProtectedRoute view="integrated"><IntegratedView /></ProtectedRoute>} />
        <Route path="/dept" element={<ProtectedRoute view="dept"><DeptProgramView /></ProtectedRoute>} />
        <Route path="/toeic" element={<ProtectedRoute view="toeic"><ToeicView /></ProtectedRoute>} />
        <Route path="/volunteer" element={<ProtectedRoute view="volunteer"><VolunteerView /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute view="stats"><StatsView /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
