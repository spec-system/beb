import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoginView from './views/LoginView';
import IntegratedView from './views/IntegratedView';
import StudentSubmitView from './views/StudentSubmitView';
import DeptProgramView from './views/DeptProgramView';
import BoardView from './views/BoardView';
import ToeicView from './views/ToeicView';
import VolunteerView from './views/VolunteerView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';
import { canAccessView } from './auth/roles';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const first = (['integrated', 'submit', 'dept', 'toeic', 'volunteer', 'stats', 'settings'] as const).find((v) =>
    canAccessView(user.role, v),
  );
  return <Navigate to={first === 'submit' ? '/submit' : `/${first ?? 'integrated'}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/integrated" element={<ProtectedRoute view="integrated"><IntegratedView /></ProtectedRoute>} />
        <Route path="/submit" element={<ProtectedRoute view="submit"><StudentSubmitView /></ProtectedRoute>} />
        <Route path="/board" element={<ProtectedRoute view="board"><BoardView /></ProtectedRoute>} />
        <Route path="/dept" element={<ProtectedRoute view="dept"><DeptProgramView /></ProtectedRoute>} />
        <Route path="/toeic" element={<ProtectedRoute view="toeic"><ToeicView /></ProtectedRoute>} />
        <Route path="/volunteer" element={<ProtectedRoute view="volunteer"><VolunteerView /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute view="stats"><StatsView /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute view="settings"><SettingsView /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
